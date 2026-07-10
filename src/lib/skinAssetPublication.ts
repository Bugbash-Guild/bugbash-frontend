import { createHash, randomUUID } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  planSkinAssetIntake,
  type SkinAssetIntakeResult,
} from "./skinAssetIntake";

type GameAssetPublicationLockOptions = {
  label: string;
  publicationKey: string;
};

type StageApprovedSkinOptions = {
  approvedDir: string;
  force: boolean;
  monsterSlug: string;
  skinId: string;
  sourceDir: string;
};

type ExistingSkinState = "missing" | "matching" | "conflict";

export const BUGBASH_GAME_ASSET_PUBLICATION_KEY =
  "bugbash-frontend/shared-game-assets-pipeline-v1";

const LOCK_OWNER_FILE = "owner.json";
const OWNER_METADATA_GRACE_MS = 30_000;
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

export function gameAssetPublicationLockDir(publicationKey: string): string {
  const lockHash = createHash("sha256").update(publicationKey).digest("hex");
  return path.join(
    os.tmpdir(),
    `bugbash-game-asset-publication-${lockHash}.lock`,
  );
}

async function ownerlessLockIsStale(lockDir: string): Promise<boolean> {
  try {
    const lockStats = await stat(lockDir);
    return Date.now() - lockStats.mtimeMs >= OWNER_METADATA_GRACE_MS;
  } catch (error) {
    return errorCode(error) === "ENOENT";
  }
}

async function removeAbandonedLock(lockDir: string): Promise<boolean> {
  let owner: unknown;
  try {
    owner = JSON.parse(
      await readFile(path.join(lockDir, LOCK_OWNER_FILE), "utf8"),
    );
  } catch {
    if (!(await ownerlessLockIsStale(lockDir))) return false;
  }

  const ownerPid =
    typeof owner === "object" &&
    owner !== null &&
    "pid" in owner &&
    typeof owner.pid === "number" &&
    Number.isInteger(owner.pid) &&
    owner.pid > 0
      ? owner.pid
      : null;
  if (ownerPid !== null && isProcessRunning(ownerPid)) return false;
  if (ownerPid === null && !(await ownerlessLockIsStale(lockDir))) return false;

  const abandonedDir = `${lockDir}.abandoned-${randomUUID()}`;
  try {
    await rename(lockDir, abandonedDir);
  } catch (error) {
    return errorCode(error) === "ENOENT";
  }
  await rm(abandonedDir, { force: true, recursive: true });
  return true;
}

export async function withGameAssetPublicationLock<T>(
  { label, publicationKey }: GameAssetPublicationLockOptions,
  action: () => Promise<T>,
): Promise<T> {
  const lockDir = gameAssetPublicationLockDir(publicationKey);
  let acquired = false;

  for (let attempt = 0; attempt < 2 && !acquired; attempt += 1) {
    try {
      await mkdir(lockDir);
      acquired = true;
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
      if (attempt > 0 || !(await removeAbandonedLock(lockDir))) {
        throw new Error(`Game asset publication is already running (${label})`);
      }
    }
  }

  if (!acquired) {
    throw new Error(`Game asset publication is already running (${label})`);
  }

  try {
    await writeFile(
      path.join(lockDir, LOCK_OWNER_FILE),
      `${JSON.stringify({ label, pid: process.pid, startedAt: new Date().toISOString() })}\n`,
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

function intakeResult(
  plan: ReturnType<typeof planSkinAssetIntake>,
): SkinAssetIntakeResult {
  return {
    ...plan,
    stagedKeys: plan.copies.map((copy) => copy.inputKey),
  };
}

async function restorePreviousSkin(
  targetDir: string,
  backupDir: string,
  originalError: unknown,
): Promise<never> {
  try {
    await rm(targetDir, { force: true, recursive: true });
    await rename(backupDir, targetDir);
  } catch (restoreError) {
    throw new AggregateError(
      [originalError, restoreError],
      `Skin publication failed; previous assets remain at ${backupDir}`,
    );
  }
  throw originalError;
}

export async function withApprovedSkinStaged<T>(
  {
    approvedDir,
    force,
    monsterSlug,
    skinId,
    sourceDir,
  }: StageApprovedSkinOptions,
  action: (result: SkinAssetIntakeResult) => Promise<T>,
): Promise<T> {
  const plan = planSkinAssetIntake({
    candidateDir: approvedDir,
    monsterSlug,
    skinId,
    sourceDir,
  });
  const result = intakeResult(plan);
  const targetDir = path.dirname(plan.copies[0].toPath);
  const parentDir = path.dirname(targetDir);
  await mkdir(parentDir, { recursive: true });

  const state = await existingSkinState(targetDir, approvedDir);
  if (state === "matching") return action(result);
  if (state === "conflict" && !force) {
    throw new Error(`Skin asset destination already exists: ${targetDir}`);
  }

  let stagingDir: string | null = await mkdtemp(
    path.join(parentDir, `.${skinId}-approved-`),
  );
  let backupDir: string | null = null;

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
      backupDir = path.join(parentDir, `.${skinId}-backup-${randomUUID()}`);
      await rename(targetDir, backupDir);
    }

    try {
      await rename(stagingDir, targetDir);
      stagingDir = null;
    } catch (installError) {
      if (backupDir) {
        const previousAssets = backupDir;
        backupDir = null;
        try {
          await rename(previousAssets, targetDir);
        } catch (restoreError) {
          backupDir = previousAssets;
          throw new AggregateError(
            [installError, restoreError],
            `Skin replacement failed; previous assets remain at ${previousAssets}`,
          );
        }
      }
      throw installError;
    }
  } finally {
    if (stagingDir) {
      await rm(stagingDir, { force: true, recursive: true });
    }
  }

  let actionResult: T;
  try {
    actionResult = await action(result);
  } catch (actionError) {
    if (backupDir) {
      return restorePreviousSkin(targetDir, backupDir, actionError);
    }
    throw actionError;
  }

  if (backupDir) {
    await rm(backupDir, { force: true, recursive: true });
  }
  return actionResult;
}
