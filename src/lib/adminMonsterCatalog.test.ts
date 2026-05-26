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
      emoji: "🫧",
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
      emoji: "❔",
      rarity: "N",
    });

    assert.equal(
      previews.every((preview) => preview.hasArtwork === false),
      true,
    );
  });

  it("sorts monsters by rarity and name for scan-friendly review", () => {
    const catalog = buildAdminMonsterCatalog([
      { id: "n-2", name: "Zeta Slime", emoji: "🟢", rarity: "N" },
      { id: "ssr-1", name: "Alpha Dragon", emoji: "🐉", rarity: "SSR" },
      { id: "sr-1", name: "Beta Mage", emoji: "🧙", rarity: "SR" },
      { id: "n-1", name: "Alpha Slime", emoji: "🟢", rarity: "N" },
    ]);

    assert.deepEqual(
      catalog.map((monster) => monster.id),
      ["ssr-1", "sr-1", "n-1", "n-2"],
    );
    assert.equal(catalog[0].stagePreviews.length, 6);
  });
});
