import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSkinArtworkComparison,
  buildSkinCatalogLines,
  buildSkinRevivalSchedule,
} from "./skinCatalog";
import type { MonsterSkinCatalogItem, OwnedSkinCatalogItem } from "./skinCatalog";

const skins: MonsterSkinCatalogItem[] = [
  {
    assetBasePath: "monsters/cache-phantom/skins/kernel-panic",
    initialReleaseMonth: "2026-08",
    lineName: "Kernel Panic線",
    monsterSlug: "cache-phantom",
    priceRune: 880,
    revivalMonth: "2027-02",
    skinId: "kernel-panic",
    tier: "DX",
  },
  {
    assetBasePath: "monsters/token-mimic/skins/cold-boot",
    initialReleaseMonth: "2026-09",
    lineName: "Cold Boot線",
    monsterSlug: "token-mimic",
    priceRune: 320,
    revivalMonth: null,
    skinId: "cold-boot",
    tier: "STD",
  },
  {
    assetBasePath: "monsters/cache-phantom/skins/kernel-panic-lg",
    initialReleaseMonth: "2026-08",
    lineName: "Kernel Panic線",
    monsterSlug: "cache-phantom",
    priceRune: 1800,
    revivalMonth: "2027-08",
    skinId: "kernel-panic-lg",
    tier: "LG",
  },
];

const ownedSkins: OwnedSkinCatalogItem[] = [
  {
    equipped: true,
    masteryLevel: 4,
    skinId: "kernel-panic",
  },
];

describe("skin catalog presentation", () => {
  it("groups API items by line and puts owned-monster demand first", () => {
    const lines = buildSkinCatalogLines(skins, ownedSkins, new Set(["cache-phantom"]));

    assert.deepEqual(
      lines.map((line) => ({
        lineName: line.lineName,
        skinIds: line.skins.map((skin) => skin.skinId),
      })),
      [
        {
          lineName: "Kernel Panic線",
          skinIds: ["kernel-panic", "kernel-panic-lg"],
        },
        {
          lineName: "Cold Boot線",
          skinIds: ["cold-boot"],
        },
      ],
    );
    assert.equal(lines[0].skins[0].owned, true);
    assert.equal(lines[0].skins[0].equipped, true);
    assert.equal(lines[0].skins[0].masteryLevel, 4);
    assert.equal(lines[1].skins[0].targetMonsterOwned, false);
  });

  it("derives before and after artwork only from the API asset base path", () => {
    assert.deepEqual(
      buildSkinArtworkComparison(
        "monsters/cache-phantom/skins/kernel-panic",
        "https://assets.example.test/",
      ),
      {
        before: "https://assets.example.test/monsters/cache-phantom/skins/kernel-panic/base.webp",
        after:
          "https://assets.example.test/monsters/cache-phantom/skins/kernel-panic/berserk-final.webp",
      },
    );
  });

  it("builds a calm chronological revival schedule and omits unscheduled skins", () => {
    assert.deepEqual(
      buildSkinRevivalSchedule(skins).map(({ lineName, revivalMonth, skinId }) => ({
        lineName,
        revivalMonth,
        skinId,
      })),
      [
        {
          lineName: "Kernel Panic線",
          revivalMonth: "2027-02",
          skinId: "kernel-panic",
        },
        {
          lineName: "Kernel Panic線",
          revivalMonth: "2027-08",
          skinId: "kernel-panic-lg",
        },
      ],
    );
  });
});
