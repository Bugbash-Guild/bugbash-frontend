import { createHash, randomUUID } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  planSkinAssetIntake,
  type SkinAssetIntakeResult,
} from "./skinAssetIntake";

type SkinPublicationTarget = {
  monsterSlug: string;
  skinId: string;
  sourceDir: string;
};

type StageApprovedSkinOptions = SkinPublicationTarget & {
  approvedDir: string;
  force: boolean;
};

type ExistingSkinState = "missing" | "matching" | "conflict";

const LOCK_OWNER_FILE = "owner.json";
const EXPECTED_SKIN_FILE_NAMES = APPENDIX_A_SKIN_STAGES.map(
  (stage) => `${stage}.png`,
).sort();

function errorCode(error: unknown): string | null {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null;
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== "ESRCH";
  }
}

async function removeAbandonedLock(lockDir: string): Promise<boolean> {
  let owner: unknown;
  try {
    owner = JSON.parse(
      await readFile(path.join(lockDir, LOCK_OWNER_FILE), "utf8"),
    );
  } catch {
    return false;
  }

  if (
    typeof owner !== "object" ||
    owner === null ||
    !("pid" in owner) ||
    typeof owner.pid !== "number"
  ) {
    return false;
  }
  if (
    !Number.isInteger(owner.pid) ||
    owner.pid < 1 ||
    isProcessRunning(owner.pid)
  ) {
    return false;
  }

  const abandonedDir = `${lockDir}.abandoned-${randomUUID()}`;
  try {
    await rename(lockDir, abandonedDir);
  } catch (error) {
    return errorCode(error) === "ENOENT";
  }
  await rm(abandonedDir, { force: true, recursive: true });
  return true;
}

async function publicationLockDir({
  monsterSlug,
  skinId,
  sourceDir,
}: SkinPublicationTarget): Promise<string> {
  await mkdir(sourceDir, { recursive: true });
  const canonicalSourceDir = await realpath(sourceDir);
  const targetHash = createHash("sha256")
    .update(`${canonicalSourceDir}\0${monsterSlug}\0${skinId}`)
    .digest("hex");
  return path.join(os.tmpdir(), `bugbash-skin-publication-${targetHash}.lock`);
}

export async function withSkinPublicationLock<T>(
  target: SkinPublicationTarget,
  action: () => Promise<T>,
): Promise<T> {
  const lockDir = await publicationLockDir(target);
  let acquired = false;

  for (let attempt = 0; attempt < 2 && !acquired; attempt += 1) {
    try {
      await mkdir(lockDir);
      acquired = true;
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
      if (attempt > 0 || !(await removeAbandonedLock(lockDir))) {
        throw new Error(
          `Skin publication is already running for ${target.monsterSlug}/${target.skinId}`,
        );
      }
    }
  }

  if (!acquired) {
    throw new Error(
      `Skin publication is already running for ${target.monsterSlug}/${target.skinId}`,
    );
  }

  try {
    await writeFile(
      path.join(lockDir, LOCK_OWNER_FILE),
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
      { flag: "wx" },
    );
    return await action();
  } finally {
    await rm(lockDir, { force: true, recursive: true });
  }
}

async function existingSkinState(
  targetDir: string,
  approvedDir: string,
): Promise<ExistingSkinState> {
  let entries;
  try {
    entries = await readdir(targetDir, { withFileTypes: true });
  } catch (error) {
    if (errorCode(error) === "ENOENT") return "missing";
    if (errorCode(error) === "ENOTDIR") return "conflict";
    throw error;
  }

  const fileNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  if (
    entries.length !== EXPECTED_SKIN_FILE_NAMES.length ||
    fileNames.length !== EXPECTED_SKIN_FILE_NAMES.length ||
    !fileNames.every((name, index) => name === EXPECTED_SKIN_FILE_NAMES[index])
  ) {
    return "conflict";
  }

  for (const fileName of EXPECTED_SKIN_FILE_NAMES) {
    const [existing, approved] = await Promise.all([
      readFile(path.join(targetDir, fileName)),
      readFile(path.join(approvedDir, fileName)),
    ]);
    if (!existing.equals(approved)) return "conflict";
  }
  return "matching";
}

export async function stageApprovedSkinAtomically({
  approvedDir,
  force,
  monsterSlug,
  skinId,
  sourceDir,
}: StageApprovedSkinOptions): Promise<SkinAssetIntakeResult> {
  const plan = planSkinAssetIntake({
    candidateDir: approvedDir,
    monsterSlug,
    skinId,
    sourceDir,
  });
  const targetDir = path.dirname(plan.copies[0].toPath);
  const parentDir = path.dirname(targetDir);
  await mkdir(parentDir, { recursive: true });

  const state = await existingSkinState(targetDir, approvedDir);
  if (state === "matching") {
    return {
      ...plan,
      stagedKeys: plan.copies.map((copy) => copy.inputKey),
    };
  }
  if (state === "conflict" && !force) {
    throw new Error(`Skin asset destination already exists: ${targetDir}`);
  }

  let stagingDir: string | null = await mkdtemp(
    path.join(parentDir, `.${skinId}-approved-`),
  );
  let backupDir: string | null = null;
  let installed = false;
  let preserveBackup = false;

  try {
    // A same-filesystem directory rename exposes all six validated files at once.
    await Promise.all(
      APPENDIX_A_SKIN_STAGES.map((stage) =>
        copyFile(
          path.join(approvedDir, `${stage}.png`),
          path.join(stagingDir as string, `${stage}.png`),
        ),
      ),
    );

    if (state === "conflict") {
      backupDir = `${targetDir}.backup-${randomUUID()}`;
      await rename(targetDir, backupDir);
    }
    await rename(stagingDir, targetDir);
    stagingDir = null;
    installed = true;

    if (backupDir) {
      await rm(backupDir, { force: true, recursive: true });
      backupDir = null;
    }
  } catch (error) {
    if (backupDir && !installed) {
      const preservedBackupDir = backupDir;
      try {
        await rename(preservedBackupDir, targetDir);
        backupDir = null;
      } catch (restoreError) {
        preserveBackup = true;
        throw new AggregateError(
          [error, restoreError],
          `Skin replacement failed; previous assets remain at ${preservedBackupDir}`,
        );
      }
    }
    throw error;
  } finally {
    if (stagingDir) {
      await rm(stagingDir, { force: true, recursive: true });
    }
    if (backupDir && !preserveBackup) {
      await rm(backupDir, { force: true, recursive: true });
    }
  }

  return {
    ...plan,
    stagedKeys: plan.copies.map((copy) => copy.inputKey),
  };
}
