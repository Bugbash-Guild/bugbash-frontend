import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createGameAssetManifest,
  getAssetContentType,
  getR2UploadKeys,
  getR2ObjectName,
  isBuiltGameAssetKey,
  isSupportedGameAssetInput,
  toWebpAssetKey,
} from "./gameAssetManifest";

describe("game asset manifest helpers", () => {
  it("normalizes supported asset paths into webp manifest keys", () => {
    assert.equal(
      toWebpAssetKey("monsters/token-mimic/BASE.PNG"),
      "monsters/token-mimic/BASE.webp",
    );
    assert.equal(
      toWebpAssetKey("items/evolution-stone.svg"),
      "items/evolution-stone.webp",
    );
    assert.equal(
      toWebpAssetKey("equipment/swords/debug-blade.webp"),
      "equipment/swords/debug-blade.webp",
    );
  });

  it("rejects unsafe or unsupported paths", () => {
    assert.equal(
      isSupportedGameAssetInput("monsters/token-mimic/base.png"),
      true,
    );
    assert.equal(
      isSupportedGameAssetInput("monsters/token-mimic/base.gif"),
      false,
    );
    assert.equal(isSupportedGameAssetInput("../secret.png"), false);
    assert.equal(isSupportedGameAssetInput("/tmp/secret.png"), false);
    assert.equal(isSupportedGameAssetInput("monsters/.DS_Store"), false);
  });

  it("accepts only safe generated webp asset keys", () => {
    assert.equal(isBuiltGameAssetKey("monsters/token-mimic/base.webp"), true);
    assert.equal(isBuiltGameAssetKey("items/evolution-stone.png"), false);
    assert.equal(isBuiltGameAssetKey("../secret.webp"), false);
    assert.equal(isBuiltGameAssetKey("monsters/.hidden/base.webp"), false);
  });

  it("creates a sorted unique manifest", () => {
    assert.deepEqual(
      createGameAssetManifest(
        [
          "items/evolution-stone.webp",
          "monsters/token-mimic/base.webp",
          "items/evolution-stone.webp",
        ],
        "2026-05-28T00:00:00.000Z",
      ),
      {
        version: 1,
        generatedAt: "2026-05-28T00:00:00.000Z",
        assets: [
          "items/evolution-stone.webp",
          "monsters/token-mimic/base.webp",
        ],
      },
    );
  });

  it("maps upload content types and R2 object names", () => {
    assert.equal(
      getAssetContentType("asset-manifest.json"),
      "application/json; charset=utf-8",
    );
    assert.equal(
      getAssetContentType("monsters/token-mimic/base.webp"),
      "image/webp",
    );
    assert.equal(
      getR2ObjectName(
        "bugbash-assets-prod",
        "/prod/",
        "monsters/token-mimic/base.webp",
      ),
      "bugbash-assets-prod/prod/monsters/token-mimic/base.webp",
    );
    assert.equal(
      getR2ObjectName("bugbash-assets-prod", "", "asset-manifest.json"),
      "bugbash-assets-prod/asset-manifest.json",
    );
  });

  it("uploads manifest after all image assets", () => {
    assert.deepEqual(
      getR2UploadKeys({
        version: 1,
        generatedAt: "2026-05-28T00:00:00.000Z",
        assets: [
          "items/evolution-stone.webp",
          "monsters/token-mimic/base.webp",
        ],
      }),
      [
        "items/evolution-stone.webp",
        "monsters/token-mimic/base.webp",
        "asset-manifest.json",
      ],
    );
  });
});
