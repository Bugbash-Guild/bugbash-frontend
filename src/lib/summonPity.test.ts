import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPityMeterPresentation,
  formatSummonCurrencyCost,
  mapSummonPullErrorMessage,
  selectEffectivePityDisclosure,
} from "./summonPity";
import type {
  PityCounterResponse,
  SummonDisclosureResponse,
} from "@/types/summon";

const disclosure: SummonDisclosureResponse = {
  adventurerPassHardPityPull: 60,
  currency: "GUILD_COIN",
  description: "API provided copy",
  guaranteeType: "SR_OR_ABOVE",
  hardPityPull: 70,
  items: [],
  name: "通常召喚",
  poolKey: "NORMAL",
  singlePullCost: 300,
  softPityPull: 55,
  stockPolicy: "UNLIMITED",
  tenPullCost: 3000,
  totalWeight: 100,
};

describe("summon pity presentation", () => {
  it("uses disclosure hard pity instead of frontend constants", () => {
    const pity: PityCounterResponse = {
      isHardPity: false,
      isSoftPity: false,
      poolKey: "NORMAL",
      pullCount: 45,
    };

    assert.deepEqual(buildPityMeterPresentation(pity, disclosure), {
      hardPityPull: 70,
      label: "あと25回でSSR確定（天井 70）",
      progressPercent: 64.3,
      softPityText: "ソフト天井 55",
      tone: "normal",
    });
  });

  it("selects the API-provided pass pity for entitled subscribers", () => {
    const effective = selectEffectivePityDisclosure(disclosure, true);

    assert.equal(effective.hardPityPull, 60);
    assert.equal(
      selectEffectivePityDisclosure(disclosure, false).hardPityPull,
      70,
    );
  });

  it("keeps pity copy factual without urgency wording", () => {
    const presentation = buildPityMeterPresentation(
      {
        isHardPity: true,
        isSoftPity: true,
        poolKey: "NORMAL",
        pullCount: 70,
      },
      disclosure,
    );

    assert.equal(presentation.label, "次回SSR確定（天井 70）");
    assert.equal(presentation.tone, "hard");
    assert.equal(presentation.label.includes("今すぐ"), false);
  });

  it("formats summon costs from disclosure currency values", () => {
    assert.equal(formatSummonCurrencyCost(300, "GUILD_COIN"), "300 GUILD_COIN");
    assert.equal(
      formatSummonCurrencyCost(3000, "GUILD_COIN"),
      "3,000 GUILD_COIN",
    );
    assert.equal(formatSummonCurrencyCost(30, "RUNE"), "30 RUNE");
  });

  it("maps pull errors without exposing backend English messages", () => {
    assert.equal(
      mapSummonPullErrorMessage(401, ""),
      "セッションが切れました。再度ログインしてください。",
    );
    assert.equal(
      mapSummonPullErrorMessage(422, "insufficient guild coin balance"),
      "ギルドコインが足りません。PRをマージして集めましょう。",
    );
    assert.equal(
      mapSummonPullErrorMessage(500, "summon backend failed"),
      "召喚結果を確認できませんでした。履歴を確認してから再度お試しください。",
    );
  });
});
