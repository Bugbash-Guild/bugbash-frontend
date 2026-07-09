import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BADGE_PRESTIGE_COPY,
  COSMETIC_ONLY_COPY,
  buildBadgeCosmeticRequest,
  clearBadgeCosmeticIdempotencyKey,
  getBadgeProgressRatio,
  getNextBadgeForgeLevel,
  getOrCreateBadgeCosmeticIdempotencyKey,
  mapBadgeMutationError,
} from "./badges";
import type { BadgeProgress, ForgeLevelDef } from "@/types/badge";

class MemoryStorage
  implements Pick<Storage, "getItem" | "removeItem" | "setItem">
{
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

const badge: BadgeProgress = {
  artKey: "pr_slayer",
  category: "ACTIVITY",
  code: "pr_slayer",
  counter: 25,
  currentTier: 1,
  description: "PRを積み重ねた証",
  displayName: "討伐者の刻印",
  earnedAt: "2026-07-01T00:00:00Z",
  equippedSlot: null,
  forgeRank: 2,
  grade: 5,
  isVisible: true,
  nextThreshold: 50,
  tiers: [
    { threshold: 10, tier: 1 },
    { threshold: 50, tier: 2 },
  ],
};

const levelDefs: ForgeLevelDef[] = [
  {
    diffNote: "輪郭エフェクトを解放",
    effectTier: "T0",
    level: 1,
    runeCost: 40,
    track: "BADGE",
    unlockDimension: "FRM",
  },
  {
    diffNote: "発光を解放",
    effectTier: "T1",
    level: 2,
    runeCost: 80,
    track: "BADGE",
    unlockDimension: "FX",
  },
  {
    diffNote: "登場演出を解放",
    effectTier: "T1",
    level: 3,
    runeCost: 120,
    track: "BADGE",
    unlockDimension: "ANI",
  },
];

describe("badge presentation and mutation helpers", () => {
  it("keeps the prestige copy free of paid-currency language", () => {
    assert.equal(
      BADGE_PRESTIGE_COPY,
      "バッジのティアは GitHub 活動でのみ上がります",
    );
    assert.equal(BADGE_PRESTIGE_COPY.includes("ルーン"), false);
    assert.equal(BADGE_PRESTIGE_COPY.includes("購入"), false);
  });

  it("calculates progress within the current prestige tier", () => {
    assert.equal(getBadgeProgressRatio(badge), 0.375);
    assert.equal(
      getBadgeProgressRatio({ ...badge, counter: 80, nextThreshold: null }),
      1,
    );
  });

  it("selects the next cosmetic cost only from API level definitions", () => {
    assert.deepEqual(getNextBadgeForgeLevel(levelDefs, 2), levelDefs[2]);
    assert.equal(getNextBadgeForgeLevel(levelDefs, 3), null);
  });

  it("keeps one idempotency key per badge until success", () => {
    const storage = new MemoryStorage();
    const first = getOrCreateBadgeCosmeticIdempotencyKey(
      storage,
      badge.code,
      () => "idem-1",
    );
    const second = getOrCreateBadgeCosmeticIdempotencyKey(
      storage,
      badge.code,
      () => "idem-2",
    );

    assert.equal(first, "idem-1");
    assert.equal(second, "idem-1");
    assert.deepEqual(buildBadgeCosmeticRequest(badge.forgeRank, first), {
      expectedFromRank: 2,
      idempotencyKey: "idem-1",
    });

    clearBadgeCosmeticIdempotencyKey(storage, badge.code);
    assert.equal(
      getOrCreateBadgeCosmeticIdempotencyKey(
        storage,
        badge.code,
        () => "idem-3",
      ),
      "idem-3",
    );
  });

  it("maps badge errors without exposing server messages", () => {
    assert.deepEqual(mapBadgeMutationError(401, ""), {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    });
    assert.deepEqual(
      mapBadgeMutationError(
        422,
        "工房ランクが更新されています: expected=1, actual=2",
      ),
      {
        action: "refresh",
        message: "情報を更新しました。もう一度お試しください。",
      },
    );
    assert.deepEqual(
      mapBadgeMutationError(422, "獲得済みバッジのみ強化できます"),
      {
        action: "none",
        message: "このバッジはまだ獲得していません。",
      },
    );
    assert.deepEqual(mapBadgeMutationError(422, "ルーン残高が不足しています"), {
      action: "topUp",
      message: "ルーンが足りません。残高を確認してください。",
    });
    assert.deepEqual(
      mapBadgeMutationError(422, "装備スロット 1 は別のバッジで使用中です"),
      {
        action: "none",
        message: "その装備スロットは別のバッジで使用中です。",
      },
    );
    assert.deepEqual(mapBadgeMutationError(500, "internal error"), {
      action: "retry",
      message: "一時的なエラーが発生しました。時間をおいて再度お試しください。",
    });
  });

  it("uses the mandatory cosmetic-only confirmation copy", () => {
    assert.equal(
      COSMETIC_ONLY_COPY,
      "この購入で変わるのは見た目だけです。ステータス・報酬・順位には影響しません",
    );
  });
});
