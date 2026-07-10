import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, it } from "node:test";

import {
  gameAssetPublicationLockDir,
  withGameAssetPublicationLock,
} from "./skinAssetPublication";

type RunningChild = {
  child: ChildProcess;
  completion: Promise<{ code: number | null; stderr: string }>;
};

function startLockProcess(
  publicationKey: string,
  markerFile: string,
  releaseFile: string,
  skinId: string,
): RunningChild {
  const fixture = path.join(
    process.cwd(),
    "src/lib/testFixtures/skinPublicationLockProcess.ts",
  );
  const child = spawn(
    process.execPath,
    [
      "--import",
      "tsx",
      fixture,
      publicationKey,
      markerFile,
      releaseFile,
      skinId,
    ],
    { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe"] },
  );
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });
  const completion = new Promise<{ code: number | null; stderr: string }>(
    (resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve({ code, stderr }));
    },
  );
  return { child, completion };
}

async function waitForFile(filePath: string) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      await access(filePath);
      return;
    } catch {
      await delay(10);
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

describe("skin asset publication", () => {
  it("holds one shared pipeline lock across different skins and Node processes", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "bugbash-publication-lock-"),
    );
    const publicationKey = path.join(root, "shared-pipeline");
    const firstMarker = path.join(root, "first.locked");
    const firstRelease = path.join(root, "first.release");
    const secondMarker = path.join(root, "second.locked");
    const secondRelease = path.join(root, "second.release");
    const first = startLockProcess(
      publicationKey,
      firstMarker,
      firstRelease,
      "kernel-panic",
    );

    try {
      await waitForFile(firstMarker);
      await writeFile(secondRelease, "release immediately");
      const second = startLockProcess(
        publicationKey,
        secondMarker,
        secondRelease,
        "neon-stack",
      );
      const secondResult = await second.completion;

      assert.equal(secondResult.code, 1);
      assert.match(secondResult.stderr, /publication is already running/);
      await assert.rejects(() => access(secondMarker));

      await writeFile(firstRelease, "release");
      assert.equal((await first.completion).code, 0);
    } finally {
      first.child.kill();
      await writeFile(firstRelease, "release");
    }
  });

  it("reclaims an old lock left before owner metadata was written", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "bugbash-publication-lock-"),
    );
    const publicationKey = path.join(root, "orphaned-pipeline");
    const lockDir = gameAssetPublicationLockDir(publicationKey);
    await mkdir(lockDir);
    await utimes(lockDir, new Date(0), new Date(0));
    let actionCalls = 0;

    await withGameAssetPublicationLock(
      { label: "token-mimic/kernel-panic", publicationKey },
      async () => {
        actionCalls += 1;
      },
    );

    assert.equal(actionCalls, 1);
    await assert.rejects(() => access(lockDir));
  });

  it("does not reclaim a fresh ownerless lock during the metadata grace period", async () => {
    const publicationKey = `fresh-ownerless-${Date.now()}`;
    const lockDir = gameAssetPublicationLockDir(publicationKey);
    await mkdir(lockDir);

    try {
      await assert.rejects(
        () =>
          withGameAssetPublicationLock(
            { label: "token-mimic/kernel-panic", publicationKey },
            async () => assert.fail("fresh lock must remain exclusive"),
          ),
        /publication is already running/,
      );
    } finally {
      await rm(lockDir, { force: true, recursive: true });
    }
  });
});
