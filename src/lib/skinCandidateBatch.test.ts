import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  deriveSkinIdFromTheme,
  planSkinCandidateBatch,
} from "./skinCandidateBatch";
import { parseSkinCandidateBatchCliOptions } from "./skinCandidateBatchCli";
import { generateSkinCandidateBatch } from "./skinCandidateBatchGeneration";

const validMetadata = async () => ({
  format: "png",
  hasAlpha: true,
  height: 1254,
  width: 1254,
});

async function createReferenceLineage(sourceDir: string, monsterSlug: string) {
  const monsterDir = path.join(sourceDir, "monsters", monsterSlug);
  await mkdir(monsterDir, { recursive: true });
  await Promise.all(
    APPENDIX_A_SKIN_STAGES.map((stage) =>
      writeFile(path.join(monsterDir, `${stage}.png`), `${stage}-reference`),
    ),
  );
}

describe("skin candidate batch", () => {
  it("derives an Appendix A skin id from the owner-selected theme", () => {
    assert.equal(deriveSkinIdFromTheme("  Kernel Panic  "), "kernel-panic");
    assert.match(deriveSkinIdFromTheme("夏祭り"), /^theme-[a-f0-9]{10}$/);
  });

  it("plans three generated candidates for every Appendix A stage", () => {
    const plan = planSkinCandidateBatch({
      candidateCount: 3,
      candidateDir: "/repo/generated/skins/token-mimic/kernel-panic",
      houseStyleLock: "BugBash Guild house style: keep it collectible.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir: "/repo/game-assets/source",
      theme: "Kernel Panic",
    });

    assert.equal(plan.jobs.length, 18);
    assert.deepEqual(
      [...new Set(plan.jobs.map((job) => job.stage))],
      APPENDIX_A_SKIN_STAGES,
    );
    assert.deepEqual(
      plan.jobs.slice(0, 3).map((job) => job.outputPath),
      ["candidate-01.png", "candidate-02.png", "candidate-03.png"].map(
        (fileName) =>
          path.join(
            "/repo/generated/skins/token-mimic/kernel-panic/base",
            fileName,
          ),
      ),
    );
    assert.equal(
      plan.referenceImages.base,
      "/repo/game-assets/source/monsters/token-mimic/base.png",
    );
  });

  it("rejects candidate output that overlaps the source asset tree", () => {
    const common = {
      candidateCount: 3,
      houseStyleLock: "BugBash Guild house style: keep it collectible.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir: "/repo/game-assets/source",
      theme: "Kernel Panic",
    };

    assert.throws(
      () =>
        planSkinCandidateBatch({
          ...common,
          candidateDir: "/repo/game-assets/source/generated",
        }),
      /must not overlap the game asset source directory/,
    );
    assert.throws(
      () =>
        planSkinCandidateBatch({
          ...common,
          candidateDir: "/repo/game-assets",
        }),
      /must not overlap the game asset source directory/,
    );
  });

  it("parses a theme and monster into the zero-handwork batch defaults", () => {
    const options = parseSkinCandidateBatchCliOptions(
      ["--monster", "token-mimic", "--theme", "Kernel Panic"],
      "/repo",
      {
        BUGBASH_SKIN_GENERATOR_ARGS_JSON: '["--model","production"]',
        BUGBASH_SKIN_GENERATOR_COMMAND: "/tools/skin-generator",
      },
    );

    assert.deepEqual(options, {
      candidateCount: 3,
      candidateDir: "/repo/generated/skins/token-mimic/kernel-panic",
      force: false,
      generatorArgs: ["--model", "production"],
      generatorCommand: "/tools/skin-generator",
      monsterSlug: "token-mimic",
      openReview: true,
      port: 4173,
      publish: true,
      review: true,
      skinId: "kernel-panic",
      sourceDir: "/repo/game-assets/source",
      styleGuidePath: "/repo/docs/monster-style-guide.md",
      theme: "Kernel Panic",
    });
  });

  it("validates batch cost and generator configuration before generation", () => {
    assert.throws(
      () =>
        parseSkinCandidateBatchCliOptions(
          ["--monster", "token-mimic", "--theme", "   "],
          "/repo",
          { BUGBASH_SKIN_GENERATOR_COMMAND: "/tools/generator" },
        ),
      /--theme must not be empty/,
    );
    assert.throws(
      () =>
        parseSkinCandidateBatchCliOptions(
          ["--monster", "token-mimic", "--theme", "Kernel Panic"],
          "/repo",
          {},
        ),
      /BUGBASH_SKIN_GENERATOR_COMMAND/,
    );
    assert.throws(
      () =>
        parseSkinCandidateBatchCliOptions(
          [
            "--monster",
            "token-mimic",
            "--theme",
            "Kernel Panic",
            "--count",
            "0",
          ],
          "/repo",
          { BUGBASH_SKIN_GENERATOR_COMMAND: "/tools/generator" },
        ),
      /--count must be an integer from 1 to 9/,
    );
  });

  it("publishes a complete validated batch with an audit manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-batch-"));
    const sourceDir = path.join(root, "source");
    const candidateDir = path.join(root, "generated/kernel-panic");
    await createReferenceLineage(sourceDir, "token-mimic");
    const plan = planSkinCandidateBatch({
      candidateCount: 3,
      candidateDir,
      houseStyleLock: "BugBash Guild house style: keep it collectible.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
      theme: "Kernel Panic",
    });

    const result = await generateSkinCandidateBatch({
      force: false,
      generate: async (job, outputPath) => {
        await writeFile(outputPath, `${job.stage}/${job.candidateId}`);
      },
      inspectImage: validMetadata,
      plan,
    });

    assert.equal(result.generatedFiles.length, 18);
    assert.deepEqual(await readdir(path.join(candidateDir, "base")), [
      "candidate-01.png",
      "candidate-02.png",
      "candidate-03.png",
    ]);
    const manifest = JSON.parse(
      await readFile(path.join(candidateDir, ".batch.json"), "utf8"),
    );
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.theme, "Kernel Panic");
    assert.equal(manifest.jobs.length, 18);
    assert.equal(manifest.jobs[0].promptSha256.length, 64);
  });

  it("checks the complete reference lineage before invoking the generator", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-batch-"));
    const sourceDir = path.join(root, "source");
    await mkdir(path.join(sourceDir, "monsters/token-mimic"), {
      recursive: true,
    });
    await writeFile(
      path.join(sourceDir, "monsters/token-mimic/base.png"),
      "base",
    );
    const plan = planSkinCandidateBatch({
      candidateCount: 1,
      candidateDir: path.join(root, "generated/kernel-panic"),
      houseStyleLock: "BugBash Guild house style.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
      theme: "Kernel Panic",
    });
    let generatorCalls = 0;

    await assert.rejects(
      () =>
        generateSkinCandidateBatch({
          force: false,
          generate: async () => {
            generatorCalls += 1;
          },
          inspectImage: validMetadata,
          plan,
        }),
      /Monster reference image is missing/,
    );

    assert.equal(generatorCalls, 0);
  });

  it("allows legacy reference dimensions while keeping generated output strict", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-batch-"));
    const sourceDir = path.join(root, "source");
    const candidateDir = path.join(root, "generated/kernel-panic");
    await createReferenceLineage(sourceDir, "token-mimic");
    const plan = planSkinCandidateBatch({
      candidateCount: 1,
      candidateDir,
      houseStyleLock: "BugBash Guild house style.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
      theme: "Kernel Panic",
    });

    await generateSkinCandidateBatch({
      force: false,
      generate: async (_job, outputPath) => writeFile(outputPath, "generated"),
      inspectImage: async (filePath) =>
        filePath.startsWith(sourceDir)
          ? {
              format: "png",
              hasAlpha: true,
              height: 1024,
              width: 1536,
            }
          : validMetadata(),
      plan,
    });

    assert.equal((await readdir(path.join(candidateDir, "base"))).length, 1);
  });

  it("keeps the previous candidate batch when forced regeneration fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-batch-"));
    const sourceDir = path.join(root, "source");
    const candidateDir = path.join(root, "generated/kernel-panic");
    await createReferenceLineage(sourceDir, "token-mimic");
    await mkdir(candidateDir, { recursive: true });
    await writeFile(
      path.join(candidateDir, "previous.txt"),
      "approved old batch",
    );
    const plan = planSkinCandidateBatch({
      candidateCount: 1,
      candidateDir,
      houseStyleLock: "BugBash Guild house style.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
      theme: "Kernel Panic",
    });

    await assert.rejects(
      () =>
        generateSkinCandidateBatch({
          force: true,
          generate: async () => {
            throw new Error("provider unavailable");
          },
          inspectImage: validMetadata,
          plan,
        }),
      /provider unavailable/,
    );

    assert.equal(
      await readFile(path.join(candidateDir, "previous.txt"), "utf8"),
      "approved old batch",
    );
    await assert.rejects(
      () => access(path.join(candidateDir, "base")),
      /ENOENT/,
    );
  });

  it("does not publish generated images that violate Appendix A metadata", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-batch-"));
    const sourceDir = path.join(root, "source");
    const candidateDir = path.join(root, "generated/kernel-panic");
    await createReferenceLineage(sourceDir, "token-mimic");
    const plan = planSkinCandidateBatch({
      candidateCount: 1,
      candidateDir,
      houseStyleLock: "BugBash Guild house style.",
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
      theme: "Kernel Panic",
    });

    await assert.rejects(
      () =>
        generateSkinCandidateBatch({
          force: false,
          generate: async (_job, outputPath) => writeFile(outputPath, "bad"),
          inspectImage: async (filePath) =>
            filePath.startsWith(sourceDir)
              ? validMetadata()
              : {
                  format: "png",
                  hasAlpha: true,
                  height: 512,
                  width: 512,
                },
          plan,
        }),
      /must be PNG 1254x1254 RGBA/,
    );

    await assert.rejects(() => access(candidateDir), /ENOENT/);
  });
});
