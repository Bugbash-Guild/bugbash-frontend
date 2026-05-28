import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAdminMonsterCatalog,
  getAdminMonsterStagePreviews,
} from "./adminMonsterCatalog.ts";

describe("admin monster catalog", () => {
  it("builds six form-stage previews for every monster", () => {
    const previews = getAdminMonsterStagePreviews({
      id: "null-pointer-axolotl",
      name: "Null Pointer Axolotl",
      emoji: "N",
      rarity: "SR",
    });

    assert.deepEqual(
      previews.map((preview) => preview.formStage),
      ["BASE", "EVO", "AWAKENED", "AWAKENED_FINAL", "BERSERK", "BERSERK_FINAL"],
    );
    assert.equal(
      previews.every((preview) => preview.hasArtwork),
      true,
    );
  });

  it("keeps artwork detection behind the artwork resolver", () => {
    const previews = getAdminMonsterStagePreviews({
      id: "unknown-monster",
      name: "Unknown Monster",
      emoji: "?",
      rarity: "N",
    });

    assert.equal(
      previews.every((preview) => preview.hasArtwork === false),
      true,
    );
  });

  it("detects API-provided stage artwork without frontend catalog changes", () => {
    const previews = getAdminMonsterStagePreviews({
      id: "cdn-monster",
      name: "CDN Monster",
      emoji: "◇",
      rarity: "SR",
      artworkByStage: {
        BASE: "https://assets.example.test/monsters/cdn-monster/base.webp",
        BERSERK_FINAL:
          "https://assets.example.test/monsters/cdn-monster/berserk-final.webp",
      },
    });

    assert.equal(previews.find((preview) => preview.formStage === "BASE")?.hasArtwork, true);
    assert.equal(
      previews.find((preview) => preview.formStage === "BERSERK_FINAL")?.hasArtwork,
      true,
    );
    assert.equal(previews.find((preview) => preview.formStage === "EVO")?.hasArtwork, false);
  });

  it("sorts monsters by rarity and name for scan-friendly review", () => {
    const catalog = buildAdminMonsterCatalog([
      { id: "n-2", name: "Zeta Slime", emoji: "N2", rarity: "N" },
      { id: "ssr-1", name: "Alpha Dragon", emoji: "SSR", rarity: "SSR" },
      { id: "sr-1", name: "Beta Mage", emoji: "SR", rarity: "SR" },
      { id: "n-1", name: "Alpha Slime", emoji: "N1", rarity: "N" },
    ]);

    assert.deepEqual(
      catalog.map((monster) => monster.id),
      ["ssr-1", "sr-1", "n-1", "n-2"],
    );
    assert.equal(catalog[0].stagePreviews.length, 6);
  });
});
