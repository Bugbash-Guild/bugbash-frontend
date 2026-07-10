import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { access, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, it } from "node:test";

type RunningChild = {
  child: ChildProcess;
  completion: Promise<{ code: number | null; stderr: string }>;
};

function startLockProcess(
  sourceDir: string,
  markerFile: string,
  releaseFile: string,
): RunningChild {
  const fixture = path.join(
    process.cwd(),
    "src/lib/testFixtures/skinPublicationLockProcess.ts",
  );
  const child = spawn(
    process.execPath,
    ["--import", "tsx", fixture, sourceDir, markerFile, releaseFile],
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
  it("holds the target lock across separate Node processes", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "bugbash-publication-lock-"),
    );
    const sourceDir = path.join(root, "source");
    const firstMarker = path.join(root, "first.locked");
    const firstRelease = path.join(root, "first.release");
    const secondMarker = path.join(root, "second.locked");
    const secondRelease = path.join(root, "second.release");
    const first = startLockProcess(sourceDir, firstMarker, firstRelease);

    try {
      await waitForFile(firstMarker);
      await writeFile(secondRelease, "release immediately");
      const second = startLockProcess(sourceDir, secondMarker, secondRelease);
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
});
