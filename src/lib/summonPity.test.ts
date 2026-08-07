import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPassPityUpsell,
  buildPityMeterPresentation,
  buildSummonResultPityText,
  formatSummonCurrencyCost,
  formatSummonGuaranteeLabel,
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
      label: "あと25回でSR以上確定（天井 70）",
      progressPercent: 64.3,
      remaining: 25,
      softPityNote: "55回目からSR以上が出やすくなります",
      softPityText: "ソフト天井 55",
      tone: "normal",
    });
  });

  it("labels the ceiling with the disclosed guarantee instead of a blanket SSR promise", () => {
    // 通常召喚の保証は SR_OR_ABOVE（SR以上）。「SSR確定」は実装より
    // 強い約束＝約束違反だったので、SSR という語自体が出ないことを固定する
    const presentation = buildPityMeterPresentation(
      { isHardPity: false, isSoftPity: false, pullCount: 45 },
      disclosure,
    );

    assert.equal(presentation.label.includes("SSR"), false);
    assert.equal(presentation.label.includes("SR以上確定"), true);
  });

  it("promises the featured SSR only when the disclosure guarantees it", () => {
    const limited = {
      ...disclosure,
      guaranteeType: "FEATURED_SSR",
      softPityPull: null,
    };
    const presentation = buildPityMeterPresentation(
      { isHardPity: true, isSoftPity: false, pullCount: 59 },
      limited,
    );

    assert.equal(presentation.label, "次回目玉SSR確定（天井 70）");
  });

  it("falls back to the raw guarantee value instead of inventing a promise", () => {
    const unknown = { ...disclosure, guaranteeType: "MYSTERY_GUARANTEE" };
    const presentation = buildPityMeterPresentation(
      { isHardPity: false, isSoftPity: false, pullCount: 45 },
      unknown,
    );

    assert.equal(presentation.label, "あと25回でMYSTERY_GUARANTEE（天井 70）");
  });

  it("translates known guarantee types and passes unknown ones through", () => {
    assert.equal(formatSummonGuaranteeLabel("SR_OR_ABOVE"), "SR以上確定");
    assert.equal(formatSummonGuaranteeLabel("FEATURED_SSR"), "目玉SSR確定");
    assert.equal(formatSummonGuaranteeLabel("NEW_TYPE"), "NEW_TYPE");
  });

  it("explains the soft ceiling with the API threshold, and stays silent without one", () => {
    const pity: PityCounterResponse = {
      isHardPity: false,
      isSoftPity: false,
      poolKey: "NORMAL",
      pullCount: 10,
    };

    assert.equal(
      buildPityMeterPresentation(pity, disclosure).softPityNote,
      "55回目からSR以上が出やすくなります",
    );

    // ソフト天井の値が来ないプール（限定など）は仕組み自体が無いので、
    // 「出やすくなる」という説明を一切出さない（事実でない期待を作らない）
    const withoutSoft = buildPityMeterPresentation(pity, {
      ...disclosure,
      softPityPull: null,
    });
    assert.equal(withoutSoft.softPityNote, null);
    assert.equal(withoutSoft.softPityText, null);
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
        pullCount: 70,
      },
      disclosure,
    );

    assert.equal(presentation.label, "次回SR以上確定（天井 70）");
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

describe("buildSummonResultPityText", () => {
  it("shows the remaining pulls to the ceiling instead of the raw counter", () => {
    // 「pity: 45 pulls」は天井まで何回かをユーザーに引き算させる表示だった
    assert.equal(buildSummonResultPityText(45, disclosure), "天井まであと25回");
    assert.equal(buildSummonResultPityText(69, disclosure), "天井まであと1回");
  });

  it("reuses the guarantee label when the counter is at the ceiling", () => {
    assert.equal(
      buildSummonResultPityText(70, disclosure),
      "次回SR以上確定（天井 70）",
    );
  });

  it("shows only the raw count when the disclosure has not arrived", () => {
    // 天井値が無いのに残数をでっち上げない。事実（回数）だけを出す
    assert.equal(buildSummonResultPityText(45, null), "天井カウンタ 45 回");
  });
});
