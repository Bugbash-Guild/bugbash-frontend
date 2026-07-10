import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  discoverSkinCandidates,
  finalizeSkinSelection,
  parseSkinReviewCliOptions,
  planSkinSelection,
} from "./skinCandidateReview";

const validMetadata = async () => ({
  format: "png",
  hasAlpha: true,
  height: 1254,
  width: 1254,
});

async function createCandidateTree(root: string) {
  for (const stage of APPENDIX_A_SKIN_STAGES) {
    const stageDir = path.join(root, stage);
    await mkdir(stageDir, { recursive: true });
    await writeFile(path.join(stageDir, "candidate-b.png"), `${stage}-b`);
    await writeFile(path.join(stageDir, "candidate-a.png"), `${stage}-a`);
  }
}

describe("skin candidate review", () => {
  it("discovers validated PNG candidates for all Appendix A stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    await createCandidateTree(root);

    const catalogue = await discoverSkinCandidates({
      candidateDir: root,
      inspectImage: validMetadata,
    });

    assert.deepEqual(Object.keys(catalogue.byStage), APPENDIX_A_SKIN_STAGES);
    assert.deepEqual(
      catalogue.byStage.base.map((candidate) => candidate.id),
      ["candidate-a.png", "candidate-b.png"],
    );
  });

  it("rejects an incomplete candidate batch before opening review", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    await mkdir(path.join(root, "base"), { recursive: true });
    await writeFile(path.join(root, "base/candidate-a.png"), "base");

    await assert.rejects(
      () =>
        discoverSkinCandidates({
          candidateDir: root,
          inspectImage: validMetadata,
        }),
      /missing candidates for stages/,
    );
  });

  it("rejects candidates that do not satisfy Appendix A image metadata", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    await createCandidateTree(root);

    await assert.rejects(
      () =>
        discoverSkinCandidates({
          candidateDir: root,
          inspectImage: async () => ({
            format: "png",
            hasAlpha: true,
            height: 512,
            width: 512,
          }),
        }),
      /must be PNG 1254x1254 RGBA/,
    );
  });

  it("accepts only discovered selections and requires all six stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    await createCandidateTree(root);
    const catalogue = await discoverSkinCandidates({
      candidateDir: root,
      inspectImage: validMetadata,
    });

    assert.throws(
      () => planSkinSelection(catalogue, { base: "../outside.png" }),
      /selection is required|unknown candidate/,
    );

    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );
    const plan = planSkinSelection(catalogue, selections);
    assert.equal(plan.length, 6);
    assert.equal(plan[0].stage, "base");
    assert.equal(plan[0].candidate.id, "candidate-a.png");
  });

  it("stages selected files before build and optional R2 upload", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDir = path.join(root, "candidates");
    const sourceDir = path.join(root, "source");
    await createCandidateTree(candidateDir);
    const catalogue = await discoverSkinCandidates({
      candidateDir,
      inspectImage: validMetadata,
    });
    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );
    const calls: string[] = [];

    const result = await finalizeSkinSelection({
      catalogue,
      force: false,
      inspectImage: validMetadata,
      monsterSlug: "token-mimic",
      publish: true,
      runBuild: async () => {
        await access(
          path.join(
            sourceDir,
            "monsters/token-mimic/skins/kernel-panic/base.png",
          ),
        );
        calls.push("build");
      },
      runUpload: async () => calls.push("upload"),
      selections,
      skinId: "kernel-panic",
      sourceDir,
    });

    assert.deepEqual(calls, ["build", "upload"]);
    assert.equal(
      result.assetBasePath,
      "monsters/token-mimic/skins/kernel-panic",
    );
  });

  it("stops after the local build when R2 upload is disabled", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDir = path.join(root, "candidates");
    await createCandidateTree(candidateDir);
    const catalogue = await discoverSkinCandidates({
      candidateDir,
      inspectImage: validMetadata,
    });
    const calls: string[] = [];

    await finalizeSkinSelection({
      catalogue,
      force: false,
      inspectImage: validMetadata,
      monsterSlug: "token-mimic",
      publish: false,
      runBuild: async () => {
        calls.push("build");
      },
      runUpload: async () => assert.fail("upload must not run"),
      selections: Object.fromEntries(
        APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
      ),
      skinId: "kernel-panic",
      sourceDir: path.join(root, "source"),
    });

    assert.deepEqual(calls, ["build"]);
  });

  it("resumes the same approved skin after an R2 upload failure", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDir = path.join(root, "candidates");
    const sourceDir = path.join(root, "source");
    await createCandidateTree(candidateDir);
    const catalogue = await discoverSkinCandidates({
      candidateDir,
      inspectImage: validMetadata,
    });
    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );
    const commonOptions = {
      catalogue,
      force: false,
      inspectImage: validMetadata,
      monsterSlug: "token-mimic",
      publish: true,
      selections,
      skinId: "kernel-panic",
      sourceDir,
    };
    let buildCalls = 0;
    let uploadCalls = 0;

    await assert.rejects(
      () =>
        finalizeSkinSelection({
          ...commonOptions,
          runBuild: async () => {
            buildCalls += 1;
          },
          runUpload: async () => {
            uploadCalls += 1;
            throw new Error("R2 unavailable");
          },
        }),
      /R2 unavailable/,
    );

    await finalizeSkinSelection({
      ...commonOptions,
      runBuild: async () => {
        buildCalls += 1;
      },
      runUpload: async () => {
        uploadCalls += 1;
      },
    });

    assert.equal(buildCalls, 2);
    assert.equal(uploadCalls, 2);
  });

  it("locks one skin across publication and never mixes concurrent selections", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDirA = path.join(root, "candidates-a");
    const candidateDirB = path.join(root, "candidates-b");
    const sourceDir = path.join(root, "source");
    await createCandidateTree(candidateDirA);
    await createCandidateTree(candidateDirB);
    for (const stage of APPENDIX_A_SKIN_STAGES) {
      await writeFile(
        path.join(candidateDirB, stage, "candidate-a.png"),
        `${stage}-other`,
      );
    }
    const [catalogueA, catalogueB] = await Promise.all(
      [candidateDirA, candidateDirB].map((candidateDir) =>
        discoverSkinCandidates({ candidateDir, inspectImage: validMetadata }),
      ),
    );
    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );
    let releaseBuild: (() => void) | undefined;
    let markBuildStarted: (() => void) | undefined;
    const buildStarted = new Promise<void>((resolve) => {
      markBuildStarted = resolve;
    });
    const buildReleased = new Promise<void>((resolve) => {
      releaseBuild = resolve;
    });
    const firstPublication = finalizeSkinSelection({
      catalogue: catalogueA,
      force: false,
      inspectImage: validMetadata,
      monsterSlug: "token-mimic",
      publish: false,
      runBuild: async () => {
        markBuildStarted?.();
        await buildReleased;
      },
      runUpload: async () => undefined,
      selections,
      skinId: "kernel-panic",
      sourceDir,
    });
    await buildStarted;

    await assert.rejects(
      () =>
        finalizeSkinSelection({
          catalogue: catalogueB,
          force: false,
          inspectImage: validMetadata,
          monsterSlug: "token-mimic",
          publish: false,
          runBuild: async () => undefined,
          runUpload: async () => undefined,
          selections,
          skinId: "kernel-panic",
          sourceDir,
        }),
      /publication is already running/,
    );

    releaseBuild?.();
    await firstPublication;
    for (const stage of APPENDIX_A_SKIN_STAGES) {
      assert.equal(
        await readFile(
          path.join(
            sourceDir,
            "monsters/token-mimic/skins/kernel-panic",
            `${stage}.png`,
          ),
          "utf8",
        ),
        `${stage}-a`,
      );
    }
  });

  it("replaces a different complete skin only when force is explicit", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDirA = path.join(root, "candidates-a");
    const candidateDirB = path.join(root, "candidates-b");
    const sourceDir = path.join(root, "source");
    await createCandidateTree(candidateDirA);
    await createCandidateTree(candidateDirB);
    for (const stage of APPENDIX_A_SKIN_STAGES) {
      await writeFile(
        path.join(candidateDirB, stage, "candidate-a.png"),
        `${stage}-replacement`,
      );
    }
    const [catalogueA, catalogueB] = await Promise.all(
      [candidateDirA, candidateDirB].map((candidateDir) =>
        discoverSkinCandidates({ candidateDir, inspectImage: validMetadata }),
      ),
    );
    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );
    const commonOptions = {
      inspectImage: validMetadata,
      monsterSlug: "token-mimic",
      publish: false,
      runBuild: async () => undefined,
      runUpload: async () => undefined,
      selections,
      skinId: "kernel-panic",
      sourceDir,
    };

    await finalizeSkinSelection({
      ...commonOptions,
      catalogue: catalogueA,
      force: false,
    });
    await assert.rejects(
      () =>
        finalizeSkinSelection({
          ...commonOptions,
          catalogue: catalogueB,
          force: false,
        }),
      /destination already exists/,
    );
    await finalizeSkinSelection({
      ...commonOptions,
      catalogue: catalogueB,
      force: true,
    });

    for (const stage of APPENDIX_A_SKIN_STAGES) {
      assert.equal(
        await readFile(
          path.join(
            sourceDir,
            "monsters/token-mimic/skins/kernel-panic",
            `${stage}.png`,
          ),
          "utf8",
        ),
        `${stage}-replacement`,
      );
    }
  });

  it("revalidates copied candidates before staging them as source assets", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-review-"));
    const candidateDir = path.join(root, "candidates");
    const sourceDir = path.join(root, "source");
    await createCandidateTree(candidateDir);
    const catalogue = await discoverSkinCandidates({
      candidateDir,
      inspectImage: validMetadata,
    });
    const selections = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
    );

    await assert.rejects(
      () =>
        finalizeSkinSelection({
          catalogue,
          force: false,
          inspectImage: async () => ({
            format: "png",
            hasAlpha: true,
            height: 512,
            width: 512,
          }),
          monsterSlug: "token-mimic",
          publish: false,
          runBuild: async () => assert.fail("build must not run"),
          runUpload: async () => assert.fail("upload must not run"),
          selections,
          skinId: "kernel-panic",
          sourceDir,
        }),
      /must be PNG 1254x1254 RGBA/,
    );
    await assert.rejects(() =>
      access(
        path.join(
          sourceDir,
          "monsters/token-mimic/skins/kernel-panic/base.png",
        ),
      ),
    );
  });

  it("enables R2 upload by default for the localhost review command", () => {
    assert.deepEqual(
      parseSkinReviewCliOptions(
        [
          "--monster",
          "token-mimic",
          "--skin",
          "kernel-panic",
          "--candidates",
          "generated/kernel-panic",
          "--port",
          "4317",
        ],
        "/repo",
      ),
      {
        candidateDir: path.join("/repo", "generated/kernel-panic"),
        force: false,
        monsterSlug: "token-mimic",
        port: 4317,
        publish: true,
        skinId: "kernel-panic",
        sourceDir: path.join("/repo", "game-assets/source"),
      },
    );
  });

  it("disables R2 upload only when --no-upload is explicit", () => {
    const options = parseSkinReviewCliOptions(
      [
        "--monster",
        "token-mimic",
        "--skin",
        "kernel-panic",
        "--candidates",
        "generated/kernel-panic",
        "--no-upload",
      ],
      "/repo",
    );

    assert.equal(options.publish, false);
  });
});
