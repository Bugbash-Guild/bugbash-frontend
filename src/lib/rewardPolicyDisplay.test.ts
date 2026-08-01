import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatTierEffect, formatTierRange } from "./rewardPolicyDisplay.ts";
import type { DailyRewardTier } from "@/types/rewardPolicy";

function tier(overrides: Partial<DailyRewardTier> = {}): DailyRewardTier {
  return {
    fromCount: 1,
    grantsMonster: true,
    grantsRareDrop: true,
    key: "NORMAL",
    resourcePercent: 100,
    toCount: 3,
    ...overrides,
  };
}

describe("formatTierRange", () => {
  it("reads the bounds from the API instead of hardcoding thresholds", () => {
    assert.equal(formatTierRange(tier({ fromCount: 1, toCount: 3 })), "1〜3 件目");
    assert.equal(formatTierRange(tier({ fromCount: 4, toCount: 10 })), "4〜10 件目");
  });

  it("says 'onwards' when the tier has no upper bound", () => {
    assert.equal(
      formatTierRange(tier({ fromCount: 11, toCount: null })),
      "11 件目以降",
    );
  });

  it("does not repeat the number when the tier covers a single merge", () => {
    assert.equal(formatTierRange(tier({ fromCount: 5, toCount: 5 })), "5 件目");
  });
});

describe("formatTierEffect", () => {
  it("states the full-reward tier plainly", () => {
    assert.equal(formatTierEffect(tier()), "コイン・魂は満額");
  });

  it("names the reduction and what stops along with it", () => {
    assert.equal(
      formatTierEffect(
        tier({ grantsRareDrop: false, key: "REDUCED", resourcePercent: 50 }),
      ),
      "コイン・魂は 50% · レアドロップなし",
    );
  });

  it("says plainly when resources stop entirely", () => {
    assert.equal(
      formatTierEffect(
        tier({
          grantsMonster: false,
          grantsRareDrop: false,
          key: "ACTIVITY_ONLY",
          resourcePercent: 0,
        }),
      ),
      "コイン・魂なし · モンスターなし",
    );
  });

  it("does not mention rare drops separately once monsters already stopped", () => {
    // 「モンスターなし」の段でレアドロップの有無を並べても情報にならない
    const effect = formatTierEffect(
      tier({ grantsMonster: false, grantsRareDrop: false, resourcePercent: 0 }),
    );
    assert.equal(effect.includes("レアドロップ"), false);
  });
});
