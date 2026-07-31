import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADVENTURER_PASS_PLAN,
  buildPassBenefits,
  buildSubscriptionCheckoutRequest,
  clearSubscriptionCheckoutIdempotencyKey,
  formatPassPrice,
  getOrCreateSubscriptionCheckoutIdempotencyKey,
  getPassCheckoutEligibility,
  mapSubscriptionCheckoutError,
  readSubscriptionCheckoutIdempotencyKey,
  subscriptionCheckoutIdempotencyStorageKey,
  toPassStatusPresentation,
} from "./subscriptionPass";
import type { SubscriptionPlanInfo, SubscriptionStatus } from "@/types/billing";

class MemoryStorage implements Pick<Storage, "getItem" | "removeItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

/** サーバから届く値。フロントはこれ以外の数値を表示してはいけない。 */
const planInfo: SubscriptionPlanInfo = {
  limitedHardPityPull: 60,
  limitedPassHardPityPull: 50,
  monthlyRuneGrant: 150,
  normalHardPityThreshold: 80,
  normalPassHardPityThreshold: 70,
  normalPassSoftPityThreshold: 50,
  normalSoftPityThreshold: 60,
  partnerSoulMultiplier: 2,
  plan: "ADVENTURER_PASS",
  priceJpyTaxIncluded: 780,
};

const notSubscribed: SubscriptionStatus = {
  cancelScheduled: false,
  currentPeriodEnd: null,
  entitled: false,
  plan: null,
  status: "NONE",
};

const activeSubscription: SubscriptionStatus = {
  cancelScheduled: false,
  currentPeriodEnd: "2026-08-09T12:00:00Z",
  entitled: true,
  plan: "ADVENTURER_PASS",
  status: "ACTIVE",
};

describe("subscription pass helpers", () => {
  it("shows the price the server actually charges, not a built-in one", () => {
    assert.equal(ADVENTURER_PASS_PLAN, "ADVENTURER_PASS");
    assert.equal(formatPassPrice(planInfo), "¥780/月（税込）");
    // 価格が変わったらそのまま表示に出る（直書きなら出ない）
    assert.equal(
      formatPassPrice({ ...planInfo, priceJpyTaxIncluded: 980 }),
      "¥980/月（税込）",
    );
  });

  it("says nothing rather than guessing when the plan has not loaded", () => {
    // 既定値へ落とすと、実際の請求額と違う金額を見せることになる。
    assert.equal(formatPassPrice(null), null);
    assert.deepEqual(buildPassBenefits(null), []);
  });

  it("builds every benefit line from server values", () => {
    assert.deepEqual(buildPassBenefits(planInfo), [
      "月150ルーン付与",
      "PRマージ時の相棒魂×2",
      "通常召喚 天井80→70",
      "通常召喚 確率上昇の開始60→50",
      "限定召喚 天井60→50",
    ]);
    assert.deepEqual(
      buildPassBenefits({
        ...planInfo,
        limitedPassHardPityPull: 40,
        monthlyRuneGrant: 200,
      }),
      [
        "月200ルーン付与",
        "PRマージ時の相棒魂×2",
        "通常召喚 天井80→70",
        "通常召喚 確率上昇の開始60→50",
        "限定召喚 天井60→40",
      ],
    );
  });

  it("reports a non-subscriber as such, with no cancel button to press", () => {
    assert.deepEqual(toPassStatusPresentation(notSubscribed), {
      cancelButtonVisible: false,
      periodEndText: null,
      statusLabel: "未加入",
      statusTone: "inactive",
    });
  });

  it("requires adult age verification before subscription checkout", () => {
    assert.deepEqual(getPassCheckoutEligibility(null), {
      allowed: false,
      reason: "冒険者パスの加入には年齢確認が必要です。",
    });
    assert.deepEqual(getPassCheckoutEligibility("AGE_16_17"), {
      allowed: false,
      reason: "冒険者パスは18歳以上の方のみご加入いただけます。",
    });
    assert.deepEqual(getPassCheckoutEligibility("UNDER_16"), {
      allowed: false,
      reason: "冒険者パスは18歳以上の方のみご加入いただけます。",
    });
    assert.deepEqual(getPassCheckoutEligibility("ADULT"), {
      allowed: true,
      reason: null,
    });
  });

  it("summarizes active and cancel-scheduled subscriptions without hiding cancellation", () => {
    assert.deepEqual(toPassStatusPresentation(activeSubscription), {
      cancelButtonVisible: true,
      periodEndText: "2026年8月9日まで有効",
      statusLabel: "加入中",
      statusTone: "active",
    });

    assert.deepEqual(
      toPassStatusPresentation({
        ...activeSubscription,
        cancelScheduled: true,
        status: "CANCEL_SCHEDULED",
      }),
      {
        cancelButtonVisible: false,
        periodEndText: "2026年8月9日まで特典は有効です。それ以降更新されません。",
        statusLabel: "解約予定",
        statusTone: "scheduled",
      },
    );
  });

  it("stores one idempotency key for the adventurer pass checkout intent", () => {
    const storage = new MemoryStorage();

    assert.equal(
      subscriptionCheckoutIdempotencyStorageKey(),
      "bb.checkout.subscription.ADVENTURER_PASS",
    );
    assert.equal(readSubscriptionCheckoutIdempotencyKey(storage), null);

    const first = getOrCreateSubscriptionCheckoutIdempotencyKey(storage, () => "sub-1");
    const second = getOrCreateSubscriptionCheckoutIdempotencyKey(storage, () => "sub-2");

    assert.equal(first, "sub-1");
    assert.equal(second, "sub-1");
    assert.equal(readSubscriptionCheckoutIdempotencyKey(storage), "sub-1");

    clearSubscriptionCheckoutIdempotencyKey(storage);
    assert.equal(readSubscriptionCheckoutIdempotencyKey(storage), null);
  });

  it("builds the backend checkout request body for the pass plan", () => {
    assert.deepEqual(buildSubscriptionCheckoutRequest("sub-1"), {
      idempotencyKey: "sub-1",
      plan: "ADVENTURER_PASS",
    });
  });

  it("maps checkout errors without exposing backend English messages", () => {
    assert.deepEqual(mapSubscriptionCheckoutError(401, ""), {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    });
    assert.deepEqual(mapSubscriptionCheckoutError(422, "age verification required"), {
      action: "ageGate",
      message: "冒険者パスは18歳以上の方のみご加入いただけます。",
    });
    assert.deepEqual(mapSubscriptionCheckoutError(500, "subscription backend failed"), {
      action: "none",
      message: "一時的なエラーが発生しました。時間をおいて再度お試しください。",
    });
  });
});
