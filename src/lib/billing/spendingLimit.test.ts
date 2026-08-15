import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSpendingLimitPresentation,
  formatCapJpy,
  mapSpendingLimitUpdateError,
  parseSpendingLimitResponse,
  type SpendingLimitView,
} from "./spendingLimit.ts";

const adultView: SpendingLimitView = {
  ageGroup: "ADULT",
  defaultCapJpy: 50000,
  effectiveCapJpy: 50000,
  isCustom: false,
  pendingCapJpy: null,
  pendingEffectiveAt: null,
  raiseDelayHours: 24,
};

describe("parseSpendingLimitResponse", () => {
  it("accepts the server shape and keeps null as unlimited", () => {
    const parsed = parseSpendingLimitResponse({
      ageGroup: "ADULT",
      defaultCapJpy: 50000,
      effectiveCapJpy: null,
      isCustom: true,
      pendingCapJpy: null,
      pendingEffectiveAt: null,
      raiseDelayHours: 24,
    });
    assert.ok(parsed != null);
    assert.equal(parsed.effectiveCapJpy, null);
    assert.equal(parsed.isCustom, true);
  });

  it("rejects contract-breaking payloads instead of guessing", () => {
    assert.equal(parseSpendingLimitResponse(null), null);
    assert.equal(parseSpendingLimitResponse([]), null);
    assert.equal(parseSpendingLimitResponse({ ageGroup: "ADULT" }), null);
  });
});

describe("buildSpendingLimitPresentation", () => {
  it("labels the default cap as such", () => {
    const p = buildSpendingLimitPresentation(adultView);
    assert.equal(p.currentText, "¥50,000（既定） / 月");
    assert.equal(p.pendingText, null);
    assert.equal(p.canRemoveCap, true);
  });

  it("shows unlimited as an explicit self-setting", () => {
    const p = buildSpendingLimitPresentation({
      ...adultView,
      effectiveCapJpy: null,
      isCustom: true,
    });
    assert.equal(p.currentText, "無制限（自己設定） / 月");
  });

  /*
    引き上げの保留は「いつから効くか」まで言う。時刻を言わない保留表示は
    「なぜまだ買えないのか」を説明できない。
  */
  it("describes a pending raise with its effective time", () => {
    const p = buildSpendingLimitPresentation({
      ...adultView,
      isCustom: true,
      pendingCapJpy: 100000,
      pendingEffectiveAt: "2026-08-10T06:00:00Z",
    });
    assert.ok(p.pendingText?.startsWith("¥100,000 へ変更 — "));
    assert.ok(p.pendingText?.includes("（日本時間）に反映されます"));
  });

  it("never offers cap removal to minors and states their ceiling", () => {
    const p = buildSpendingLimitPresentation({
      ...adultView,
      ageGroup: "AGE_16_17",
      defaultCapJpy: 20000,
      effectiveCapJpy: 20000,
    });
    assert.equal(p.canRemoveCap, false);
    assert.ok(p.ruleText.includes("¥20,000"));
  });
});

describe("formatCapJpy / mapSpendingLimitUpdateError", () => {
  it("formats caps and unlimited consistently", () => {
    assert.equal(formatCapJpy(50000), "¥50,000");
    assert.equal(formatCapJpy(null), "無制限");
  });

  it("passes through the server's specific validation messages", () => {
    assert.equal(
      mapSpendingLimitUpdateError(422, "年齢区分の上限（¥20000）を超える設定はできません"),
      "年齢区分の上限（¥20000）を超える設定はできません",
    );
    assert.equal(mapSpendingLimitUpdateError(401, "x"), "セッションが切れました。再度ログインしてください。");
  });
});
