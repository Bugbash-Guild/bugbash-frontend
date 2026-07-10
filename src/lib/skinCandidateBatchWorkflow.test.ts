import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import type { SkinCandidateBatchCliOptions } from "./skinCandidateBatchCli";
import {
  buildSkinCandidateReviewArgs,
  runSkinCandidateBatchWorkflow,
} from "./skinCandidateBatchWorkflow";
import type { SkinCandidateGeneratorRequest } from "./skinCandidateGenerator";

const validMetadata = async () => ({
  format: "png",
  hasAlpha: true,
  height: 1254,
  width: 1254,
});

async function createReferenceLineage(sourceDir: string) {
  const monsterDir = path.join(sourceDir, "monsters/token-mimic");
  await mkdir(monsterDir, { recursive: true });
  await Promise.all(
    APPENDIX_A_SKIN_STAGES.map((stage) =>
      writeFile(path.join(monsterDir, `${stage}.png`), stage),
    ),
  );
}

function options(root: string): SkinCandidateBatchCliOptions {
  return {
    candidateCount: 3,
    candidateDir: path.join(root, "generated/kernel-panic"),
    force: false,
    generatorArgs: ["--model", "production"],
    generatorCommand: "/tools/generator",
    monsterSlug: "token-mimic",
    openReview: true,
    port: 4173,
    publish: true,
    review: true,
    skinId: "kernel-panic",
    sourceDir: path.join(root, "source"),
    styleGuidePath: path.join(root, "docs/monster-style-guide.md"),
    theme: "Kernel Panic",
  };
}

describe("skin candidate batch workflow", () => {
  it("starts review only after all generated candidates are validated", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-flow-"));
    const cliOptions = options(root);
    await createReferenceLineage(cliOptions.sourceDir);
    let generated = 0;
    let reviewArgs: string[] | null = null;
    const requests: SkinCandidateGeneratorRequest[] = [];

    const result = await runSkinCandidateBatchWorkflow(cliOptions, {
      inspectImage: validMetadata,
      launchReview: async (args) => {
        for (const stage of APPENDIX_A_SKIN_STAGES) {
          assert.equal(
            (await readdir(path.join(cliOptions.candidateDir, stage))).length,
            3,
          );
        }
        reviewArgs = args;
      },
      readStyleGuide: async () => `
## BugBash House Style Lock

\`\`\`text
BugBash Guild house style: keep it collectible.
\`\`\`
`,
      runGenerator: async ({ outputPath, request }) => {
        generated += 1;
        requests.push(request);
        assert.equal(
          request.referenceImagesByStage.base.endsWith("base.png"),
          true,
        );
        await writeFile(outputPath, request.candidateId);
      },
    });

    assert.equal(generated, 18);
    assert.equal(result.generatedFiles.length, 18);
    assert.deepEqual(reviewArgs, buildSkinCandidateReviewArgs(cliOptions));
    const evoRequest = requests.find(
      (request) =>
        request.stage === "evo" && request.candidateId === "candidate-01",
    );
    assert.deepEqual(
      Object.keys(evoRequest?.generatedCandidateImagesByStage ?? {}),
      ["base"],
    );
    const berserkRequest = requests.find(
      (request) =>
        request.stage === "berserk" && request.candidateId === "candidate-01",
    );
    assert.deepEqual(
      Object.keys(berserkRequest?.generatedCandidateImagesByStage ?? {}),
      ["base", "evo"],
    );
  });

  it("builds review args that preserve publication safety options", () => {
    const cliOptions = {
      ...options("/repo"),
      force: true,
      openReview: false,
      publish: false,
    };

    assert.deepEqual(buildSkinCandidateReviewArgs(cliOptions), [
      "run",
      "assets:review:skin",
      "--",
      "--monster",
      "token-mimic",
      "--skin",
      "kernel-panic",
      "--candidates",
      "/repo/generated/kernel-panic",
      "--source",
      "/repo/source",
      "--port",
      "4173",
      "--force",
      "--no-upload",
    ]);
  });
});
