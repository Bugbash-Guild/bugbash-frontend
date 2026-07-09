import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDisclosureFacts,
  buildDisclosureRows,
  formatDisclosurePercent,
} from "./disclosure";
import type { SummonDisclosureResponse } from "@/types/summon";

const disclosure: SummonDisclosureResponse = {
  adventurerPassHardPityPull: 50,
  currency: "RUNE",
  description: "Season line",
  guaranteeType: "FEATURED_SSR",
  hardPityPull: 60,
  items: [
    {
      assetUrl: "/game-assets/items/a.webp",
      itemId: "monster:queen",
      probabilityPercent: 2.75,
      rarity: "SSR",
      weight: 275,
    },
    {
      assetUrl: null,
      itemId: "soul:fire:small",
      probabilityPercent: 47.25,
      rarity: "R",
      weight: 4725,
    },
  ],
  name: "Season Pool",
  poolKey: "LIMITED",
  singlePullCost: 30,
  softPityPull: null,
  stockPolicy: "SEASONAL_RERUN",
  tenPullCost: 300,
  totalWeight: 10000,
};

describe("summon disclosure presentation", () => {
  it("formats API probability values without replacing them with frontend constants", () => {
    assert.equal(formatDisclosurePercent(2.75), "2.75%");
    assert.equal(formatDisclosurePercent(3), "3%");
  });

  it("keeps item order and probability values from the disclosure API", () => {
    assert.deepEqual(buildDisclosureRows(disclosure), [
      {
        assetUrl: "/game-assets/items/a.webp",
        itemId: "monster:queen",
        probability: "2.75%",
        rarity: "SSR",
        weight: "275",
      },
      {
        assetUrl: null,
        itemId: "soul:fire:small",
        probability: "47.25%",
        rarity: "R",
        weight: "4,725",
      },
    ]);
  });

  it("builds disclosure facts from API fields including nullable ten-pull and pass pity", () => {
    assert.deepEqual(buildDisclosureFacts(disclosure), [
      { label: "1回", value: "30 RUNE" },
      { label: "10連", value: "300 RUNE" },
      { label: "天井", value: "60回" },
      { label: "パス天井", value: "50回" },
      { label: "保証", value: "FEATURED_SSR" },
      { label: "在庫方針", value: "SEASONAL_RERUN" },
    ]);

    assert.deepEqual(
      buildDisclosureFacts({
        ...disclosure,
        adventurerPassHardPityPull: null,
        softPityPull: 40,
        tenPullCost: null,
      }),
      [
        { label: "1回", value: "30 RUNE" },
        { label: "10連", value: "なし" },
        { label: "天井", value: "60回" },
        { label: "ソフト天井", value: "40回" },
        { label: "保証", value: "FEATURED_SSR" },
        { label: "在庫方針", value: "SEASONAL_RERUN" },
      ],
    );
  });
});
