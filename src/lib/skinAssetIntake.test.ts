import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  parseSkinAssetIntakeCliOptions,
  planSkinAssetIntake,
  stageSkinAssetIntake,
} from "./skinAssetIntake";

describe("skin asset intake planning", () => {
  it("plans Appendix A copies for every approved skin stage", () => {
    const plan = planSkinAssetIntake({
      candidateDir: "/tmp/approved/kernel-panic",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir: "/repo/game-assets/source",
    });

    assert.equal(
      plan.assetBasePath,
      "monsters/token-mimic/skins/kernel-panic",
    );
    assert.deepEqual(
      plan.copies.map((copy) => copy.stage),
      APPENDIX_A_SKIN_STAGES,
    );
    assert.deepEqual(
      plan.copies.map((copy) => copy.inputKey),
      APPENDIX_A_SKIN_STAGES.map(
        (stage) => `monsters/token-mimic/skins/kernel-panic/${stage}.png`,
      ),
    );
    assert.equal(
      plan.copies[0].fromPath,
      path.join("/tmp/approved/kernel-panic", "base.png"),
    );
    assert.equal(
      plan.copies[0].toPath,
      path.join(
        "/repo/game-assets/source",
        "monsters/token-mimic/skins/kernel-panic/base.png",
      ),
    );
  });

  it("rejects folder names that would violate Appendix A kebab-case paths", () => {
    assert.throws(
      () =>
        planSkinAssetIntake({
          candidateDir: "/tmp/approved/kernel_panic",
          monsterSlug: "token_mimic",
          skinId: "kernel-panic",
          sourceDir: "/repo/game-assets/source",
        }),
      /lower kebab-case/,
    );

    assert.throws(
      () =>
        planSkinAssetIntake({
          candidateDir: "/tmp/approved/kernel_panic",
          monsterSlug: "token-mimic",
          skinId: "KernelPanic",
          sourceDir: "/repo/game-assets/source",
        }),
      /lower kebab-case/,
    );
  });

  it("copies approved candidate files into the Appendix A skin source path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-intake-"));
    const candidateDir = path.join(root, "approved");
    const sourceDir = path.join(root, "source");

    await mkdir(candidateDir, { recursive: true });
    await Promise.all(
      APPENDIX_A_SKIN_STAGES.map((stage) =>
        writeFile(path.join(candidateDir, `${stage}.png`), `${stage}-bytes`),
      ),
    );

    const result = await stageSkinAssetIntake({
      candidateDir,
      force: false,
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
    });

    assert.deepEqual(
      result.stagedKeys,
      APPENDIX_A_SKIN_STAGES.map(
        (stage) => `monsters/token-mimic/skins/kernel-panic/${stage}.png`,
      ),
    );
    assert.equal(
      await readFile(
        path.join(
          sourceDir,
          "monsters/token-mimic/skins/kernel-panic/base.png",
        ),
        "utf8",
      ),
      "base-bytes",
    );
  });

  it("refuses to overwrite staged skin assets unless force is explicit", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-intake-"));
    const candidateDir = path.join(root, "approved");
    const sourceDir = path.join(root, "source");
    const destination = path.join(
      sourceDir,
      "monsters/token-mimic/skins/kernel-panic/base.png",
    );

    await mkdir(candidateDir, { recursive: true });
    await mkdir(path.dirname(destination), { recursive: true });
    await Promise.all(
      APPENDIX_A_SKIN_STAGES.map((stage) =>
        writeFile(path.join(candidateDir, `${stage}.png`), `${stage}-bytes`),
      ),
    );
    await writeFile(destination, "existing");

    await assert.rejects(
      () =>
        stageSkinAssetIntake({
          candidateDir,
          force: false,
          monsterSlug: "token-mimic",
          skinId: "kernel-panic",
          sourceDir,
        }),
      /already exists/,
    );
    assert.equal(await readFile(destination, "utf8"), "existing");
  });

  it("checks all selected candidate files before copying any assets", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-intake-"));
    const candidateDir = path.join(root, "approved");
    const sourceDir = path.join(root, "source");
    const destination = path.join(
      sourceDir,
      "monsters/token-mimic/skins/kernel-panic/base.png",
    );

    await mkdir(candidateDir, { recursive: true });
    await writeFile(path.join(candidateDir, "base.png"), "base-bytes");

    await assert.rejects(
      () =>
        stageSkinAssetIntake({
          candidateDir,
          force: false,
          monsterSlug: "token-mimic",
          skinId: "kernel-panic",
          sourceDir,
        }),
      /Skin asset candidate file is missing/,
    );
    await assert.rejects(() => access(destination), /ENOENT/);
  });

  it("parses CLI options with the default game asset source directory", () => {
    assert.deepEqual(
      parseSkinAssetIntakeCliOptions(
        [
          "--monster",
          "token-mimic",
          "--skin",
          "kernel-panic",
          "--from",
          "approved/kernel-panic",
          "--force",
          "--dry-run",
        ],
        "/repo",
      ),
      {
        candidateDir: path.join("/repo", "approved/kernel-panic"),
        dryRun: true,
        force: true,
        monsterSlug: "token-mimic",
        skinId: "kernel-panic",
        sourceDir: path.join("/repo", "game-assets/source"),
      },
    );
  });

  it("requires the owner-selected candidate directory", () => {
    assert.throws(
      () =>
        parseSkinAssetIntakeCliOptions(
          ["--monster", "token-mimic", "--skin", "kernel-panic"],
          "/repo",
        ),
      /--from is required/,
    );
  });
});
