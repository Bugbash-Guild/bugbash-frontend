import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  createSkinCandidateGeneratorRequest,
  runSkinCandidateGeneratorCommand,
} from "./skinCandidateGenerator";

describe("skin candidate generator driver", () => {
  it("sends the prompt and all six reference images in a versioned request", () => {
    const referenceImages = Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [
        stage,
        `/repo/game-assets/source/monsters/token-mimic/${stage}.png`,
      ]),
    );

    const request = createSkinCandidateGeneratorRequest({
      candidateId: "candidate-02",
      generatedCandidateImages: {
        base: "/tmp/generated/base/candidate-02.png",
        evo: "/tmp/generated/evo/candidate-02.png",
      },
      monsterSlug: "token-mimic",
      prompt: "production prompt",
      referenceImages,
      skinId: "kernel-panic",
      stage: "berserk-final",
      theme: "Kernel Panic",
    });

    assert.equal(request.schemaVersion, 1);
    assert.deepEqual(request.generatedCandidateImagesByStage, {
      base: "/tmp/generated/base/candidate-02.png",
      evo: "/tmp/generated/evo/candidate-02.png",
    });
    assert.equal(
      request.primaryReferenceImage,
      referenceImages["berserk-final"],
    );
    assert.deepEqual(request.referenceImagesByStage, referenceImages);
    assert.deepEqual(request.output, {
      alpha: true,
      format: "png",
      height: 1254,
      width: 1254,
    });
  });

  it("passes JSON on stdin and writes only generator stdout to the output file", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-generator-"));
    const capturedRequest = path.join(root, "request.json");
    const outputPath = path.join(root, "candidate.png");
    const script = `
      const fs = require("node:fs");
      let request = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { request += chunk; });
      process.stdin.on("end", () => {
        fs.writeFileSync(process.argv[1], request);
        process.stderr.write("driver log\\n");
        process.stdout.write(Buffer.from("png-bytes"));
      });
    `;
    const request = {
      schemaVersion: 1 as const,
      candidateId: "candidate-01",
      generatedCandidateImagesByStage: {},
      monsterSlug: "token-mimic",
      output: {
        alpha: true as const,
        format: "png" as const,
        height: 1254 as const,
        width: 1254 as const,
      },
      primaryReferenceImage: "/repo/base.png",
      prompt: "prompt",
      referenceImagesByStage: Object.fromEntries(
        APPENDIX_A_SKIN_STAGES.map((stage) => [stage, `/repo/${stage}.png`]),
      ),
      skinId: "kernel-panic",
      stage: "base" as const,
      theme: "Kernel Panic",
    };

    await runSkinCandidateGeneratorCommand({
      args: ["-e", script, capturedRequest],
      command: process.execPath,
      outputPath,
      request,
    });

    assert.equal(await readFile(outputPath, "utf8"), "png-bytes");
    assert.deepEqual(
      JSON.parse(await readFile(capturedRequest, "utf8")),
      request,
    );
  });

  it("removes partial output and reports stderr when the driver fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-generator-"));
    const outputPath = path.join(root, "candidate.png");

    await assert.rejects(
      () =>
        runSkinCandidateGeneratorCommand({
          args: [
            "-e",
            'process.stdout.write("partial"); process.stderr.write("quota exceeded"); process.exit(7)',
          ],
          command: process.execPath,
          outputPath,
          request: createSkinCandidateGeneratorRequest({
            candidateId: "candidate-01",
            monsterSlug: "token-mimic",
            prompt: "prompt",
            referenceImages: Object.fromEntries(
              APPENDIX_A_SKIN_STAGES.map((stage) => [
                stage,
                `/repo/${stage}.png`,
              ]),
            ),
            skinId: "kernel-panic",
            stage: "base",
            theme: "Kernel Panic",
          }),
        }),
      /exited with code 7: quota exceeded/,
    );

    await assert.rejects(() => readFile(outputPath), /ENOENT/);
  });
});
