import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPassPityUpsell,
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

  it("swaps the soft ceiling too, so the boost window shown is the real one", () => {
    // ハードだけ差し替えると、加入者に実際とは違う区間を見せる。
    const withSoft = { ...disclosure, adventurerPassSoftPityPull: 45 };

    assert.equal(selectEffectivePityDisclosure(withSoft, true).softPityPull, 45);
    assert.equal(selectEffectivePityDisclosure(withSoft, false).softPityPull, 55);
  });

  it("does not invent a shortened ceiling the server never sent", () => {
    const withoutPassValues = {
      ...disclosure,
      adventurerPassHardPityPull: null,
      adventurerPassSoftPityPull: null,
    };
    const effective = selectEffectivePityDisclosure(withoutPassValues, true);

    assert.equal(effective.hardPityPull, 70);
    assert.equal(effective.softPityPull, 55);
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
    assert.equal(formatSummonCurrencyCost(300, "GUILD_COIN"), "300 ギルドコイン");
    assert.equal(
      formatSummonCurrencyCost(3000, "GUILD_COIN"),
      "3,000 ギルドコイン",
    );
    assert.equal(formatSummonCurrencyCost(30, "RUNE"), "30 ルーン");
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

describe("buildPassPityUpsell", () => {
  it("shows the pass hard pity and the difference for non-subscribers", () => {
    const upsell = buildPassPityUpsell(disclosure, false);

    assert.deepEqual(upsell, {
      currentHardPityPull: 70,
      passHardPityPull: 60,
      reducedBy: 10,
      text: "アドベンチャラーパス加入中は天井 60 回（10回少ない）",
    });
  });

  it("shows nothing to subscribers, who already have the shorter pity applied", () => {
    assert.equal(buildPassPityUpsell(disclosure, true), null);
  });

  it("shows nothing when the API does not provide a pass hard pity", () => {
    assert.equal(
      buildPassPityUpsell(
        { ...disclosure, adventurerPassHardPityPull: null },
        false,
      ),
      null,
    );
  });

  it("shows nothing when the pass would not shorten the pity", () => {
    assert.equal(
      buildPassPityUpsell(
        { ...disclosure, adventurerPassHardPityPull: 70 },
        false,
      ),
      null,
    );
    assert.equal(
      buildPassPityUpsell(
        { ...disclosure, adventurerPassHardPityPull: 80 },
        false,
      ),
      null,
    );
  });
});
