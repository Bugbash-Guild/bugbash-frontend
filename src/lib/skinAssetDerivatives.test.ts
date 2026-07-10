import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";

import sharp from "sharp";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import {
  generateSkinAssetDerivatives,
  planSkinAssetDerivatives,
  SKIN_DERIVATIVE_PROFILES,
} from "./skinAssetDerivatives";

const execFileAsync = promisify(execFile);

describe("skin asset derivatives", () => {
  it("plans card OGP and widget outputs for every Appendix A stage", () => {
    const plans = APPENDIX_A_SKIN_STAGES.flatMap((stage) =>
      planSkinAssetDerivatives(
        `monsters/token-mimic/skins/kernel-panic/${stage}.png`,
      ),
    );

    assert.equal(plans.length, 18);
    assert.deepEqual(
      plans.slice(0, 3).map((plan) => plan.outputKey),
      [
        "derived/skins/card/monsters/token-mimic/skins/kernel-panic/base.webp",
        "derived/skins/ogp/monsters/token-mimic/skins/kernel-panic/base.webp",
        "derived/skins/widget/monsters/token-mimic/skins/kernel-panic/base.webp",
      ],
    );
  });

  it("does not create derivatives for non-skin assets", () => {
    assert.deepEqual(
      planSkinAssetDerivatives("monsters/token-mimic/base.png"),
      [],
    );
    assert.deepEqual(planSkinAssetDerivatives("items/evolution-stone.png"), []);
  });

  it("writes transparent WebP files at each profile size", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-derived-"));
    const inputPath = path.join(root, "base.png");
    const outDir = path.join(root, "dist");
    await sharp({
      create: {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        channels: 4,
        height: 1254,
        width: 1254,
      },
    })
      .png()
      .toFile(inputPath);

    const outputs = await generateSkinAssetDerivatives({
      inputKey: "monsters/token-mimic/skins/kernel-panic/base.png",
      inputPath,
      outDir,
      quality: 82,
    });

    assert.equal(outputs.length, 3);
    for (const output of outputs) {
      const metadata = await sharp(
        path.join(outDir, output.outputKey),
      ).metadata();
      const profile = SKIN_DERIVATIVE_PROFILES[output.profile];
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.width, profile.width);
      assert.equal(metadata.height, profile.height);
      assert.equal(metadata.hasAlpha, true);
    }
  });

  it("adds all derivatives to the build manifest consumed by the R2 uploader", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bugbash-skin-build-"));
    const sourceDir = path.join(root, "source");
    const skinDir = path.join(
      sourceDir,
      "monsters/token-mimic/skins/kernel-panic",
    );
    const outDir = path.join(root, "dist");
    await mkdir(skinDir, { recursive: true });
    await Promise.all(
      APPENDIX_A_SKIN_STAGES.map((stage) =>
        sharp({
          create: {
            background: { alpha: 0, b: 0, g: 0, r: 0 },
            channels: 4,
            height: 1254,
            width: 1254,
          },
        })
          .png()
          .toFile(path.join(skinDir, `${stage}.png`)),
      ),
    );

    await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/build-game-assets.ts",
        "--source",
        sourceDir,
        "--out",
        outDir,
      ],
      { cwd: process.cwd() },
    );

    const manifest = JSON.parse(
      await readFile(path.join(outDir, "asset-manifest.json"), "utf8"),
    ) as { assets: string[] };
    assert.equal(manifest.assets.length, 24);
    assert.equal(
      manifest.assets.includes(
        "derived/skins/ogp/monsters/token-mimic/skins/kernel-panic/awakened-final.webp",
      ),
      true,
    );
  });
});
