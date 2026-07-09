import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertSkinAssetImageMetadata,
  validateSkinAssetInputKeys,
} from "./gameAssetSkinValidation";

const skinStages = [
  "base",
  "evo",
  "awakened",
  "awakened-final",
  "berserk",
  "berserk-final",
] as const;

describe("game asset skin validation", () => {
  it("accepts a complete Appendix A skin asset set", () => {
    assert.doesNotThrow(() => {
      validateSkinAssetInputKeys([
        "monsters/token-mimic/base.png",
        ...skinStages.map(
          (stage) => `monsters/token-mimic/skins/kernel-panic/${stage}.png`,
        ),
      ]);
    });
  });

  it("rejects skin asset sets that are missing required form stages", () => {
    assert.throws(
      () =>
        validateSkinAssetInputKeys([
          "monsters/token-mimic/skins/kernel-panic/base.png",
        ]),
      /missing required stages: evo, awakened, awakened-final, berserk, berserk-final/,
    );
  });

  it("rejects skin assets outside the Appendix A path contract", () => {
    assert.throws(
      () =>
        validateSkinAssetInputKeys([
          "monsters/token-mimic/skins/kernel_panic/base.png",
        ]),
      /Appendix A skin path/,
    );
    assert.throws(
      () =>
        validateSkinAssetInputKeys([
          "monsters/token-mimic/skins/kernel-panic/base.jpg",
        ]),
      /Appendix A skin path/,
    );
    assert.throws(
      () =>
        validateSkinAssetInputKeys([
          "monsters/token-mimic/skins/kernel-panic/final.png",
        ]),
      /Appendix A skin path/,
    );
  });

  it("requires Appendix A skin PNGs to be 1254 square with alpha", () => {
    const key = "monsters/token-mimic/skins/kernel-panic/base.png";

    assert.doesNotThrow(() => {
      assertSkinAssetImageMetadata(key, {
        format: "png",
        width: 1254,
        height: 1254,
        hasAlpha: true,
      });
    });

    assert.throws(
      () =>
        assertSkinAssetImageMetadata(key, {
          format: "png",
          width: 512,
          height: 1254,
          hasAlpha: true,
        }),
      /PNG 1254x1254 RGBA/,
    );
    assert.throws(
      () =>
        assertSkinAssetImageMetadata(key, {
          format: "png",
          width: 1254,
          height: 1254,
          hasAlpha: false,
        }),
      /PNG 1254x1254 RGBA/,
    );
  });

  it("does not apply skin metadata rules to non-skin assets", () => {
    assert.doesNotThrow(() => {
      assertSkinAssetImageMetadata("monsters/token-mimic/base.png", {
        format: "png",
        width: 512,
        height: 512,
        hasAlpha: false,
      });
    });
  });
});
