import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDisclosureFacts,
  buildDisclosureRows,
  formatDisclosurePercent,
  formatDisclosureStockPolicyLabel,
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
  it("rounds API probabilities to two decimals without replacing the values", () => {
    assert.equal(formatDisclosurePercent(2.75), "2.75%");
    assert.equal(formatDisclosurePercent(3), "3.00%");
    // BE は weight から浮動小数で計算するため、素の連結だと尾が出る
    assert.equal(formatDisclosurePercent(47.150000000000006), "47.15%");
  });

  it("keeps item order and probability values from the disclosure API", () => {
    assert.deepEqual(buildDisclosureRows(disclosure), [
      {
        assetUrl: "/game-assets/items/a.webp",
        itemId: "monster:queen",
        name: "Queen",
        probability: "2.75%",
        rarity: "SSR",
        weight: "275",
      },
      {
        assetUrl: null,
        itemId: "soul:fire:small",
        // 表示名辞書に無いIDは生値のままフォールバックする（隠さない）
        name: "soul:fire:small",
        probability: "47.25%",
        rarity: "R",
        weight: "4,725",
      },
    ]);
  });

  it("builds disclosure facts from API fields including nullable ten-pull and pass pity", () => {
    assert.deepEqual(buildDisclosureFacts(disclosure), [
      { label: "1回", value: "30 ルーン" },
      { label: "10連", value: "300 ルーン" },
      { label: "天井", value: "60回" },
      { label: "パス天井", value: "50回" },
      { label: "保証", value: "目玉SSR確定" },
      { label: "在庫方針", value: "シーズン復刻予定" },
    ]);

    assert.deepEqual(
      buildDisclosureFacts({
        ...disclosure,
        adventurerPassHardPityPull: null,
        currency: "GUILD_COIN",
        guaranteeType: "SR_OR_ABOVE",
        softPityPull: 40,
        stockPolicy: "UNLIMITED",
        tenPullCost: null,
      }),
      [
        { label: "1回", value: "30 ギルドコイン" },
        { label: "10連", value: "なし" },
        { label: "天井", value: "60回" },
        { label: "ソフト天井", value: "40回" },
        { label: "保証", value: "SR以上確定" },
        { label: "在庫方針", value: "在庫制限なし" },
      ],
    );
  });

  it("falls back to raw enum values it cannot translate instead of hiding them", () => {
    assert.equal(formatDisclosureStockPolicyLabel("UNLIMITED"), "在庫制限なし");
    assert.equal(
      formatDisclosureStockPolicyLabel("SEASONAL_RERUN"),
      "シーズン復刻予定",
    );
    assert.equal(
      formatDisclosureStockPolicyLabel("MYSTERY_POLICY"),
      "MYSTERY_POLICY",
    );

    const facts = buildDisclosureFacts({
      ...disclosure,
      guaranteeType: "MYSTERY_GUARANTEE",
      stockPolicy: "MYSTERY_POLICY",
    });
    assert.deepEqual(facts.slice(-2), [
      { label: "保証", value: "MYSTERY_GUARANTEE" },
      { label: "在庫方針", value: "MYSTERY_POLICY" },
    ]);
  });
});
