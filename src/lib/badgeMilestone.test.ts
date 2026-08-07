import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickNearestBadgeMilestone } from "./badgeMilestone";
import type { BadgeProgress } from "@/types/badge";

function badge(over: Partial<BadgeProgress> = {}): BadgeProgress {
  return {
    artKey: "art",
    category: "ACTIVITY",
    code: "pr_slayer",
    counter: 0,
    currentTier: 0,
    description: "",
    displayName: "PRスレイヤー",
    earnedAt: null,
    equippedSlot: null,
    forgeRank: 0,
    grade: 0,
    isVisible: true,
    nextThreshold: null,
    tiers: [],
    ...over,
  };
}

describe("pickNearestBadgeMilestone", () => {
  it("picks the badge with the smallest remaining and reports API facts only", () => {
    const milestone = pickNearestBadgeMilestone([
      badge({
        code: "far",
        counter: 1,
        displayName: "遠いバッジ",
        nextThreshold: 100,
        tiers: [{ threshold: 100, tier: 1 }],
      }),
      badge({
        code: "near",
        counter: 12,
        currentTier: 1,
        displayName: "近いバッジ",
        nextThreshold: 15,
        tiers: [
          { threshold: 10, tier: 1 },
          { threshold: 15, tier: 2 },
        ],
      }),
    ]);

    assert.deepEqual(milestone, {
      counter: 12,
      displayName: "近いバッジ",
      nextTier: 2,
      nextThreshold: 15,
      remaining: 3,
    });
  });

  it("skips badges that already reached their last tier (nextThreshold null)", () => {
    const milestone = pickNearestBadgeMilestone([
      badge({
        code: "maxed",
        counter: 999,
        nextThreshold: null,
        tiers: [{ threshold: 10, tier: 1 }],
      }),
      badge({
        code: "active",
        counter: 4,
        nextThreshold: 10,
        tiers: [{ threshold: 10, tier: 1 }],
      }),
    ]);

    assert.equal(milestone?.nextTier, 1);
    assert.equal(milestone?.remaining, 6);
  });

  it("does not invent a tier number when tiers lack the next threshold", () => {
    const milestone = pickNearestBadgeMilestone([
      badge({
        counter: 4,
        nextThreshold: 10,
        // 定義に 10 の段が無い — currentTier+1 と推測して出さない
        tiers: [{ threshold: 50, tier: 2 }],
      }),
    ]);

    assert.equal(milestone, null);
  });

  it("skips inconsistent rows instead of showing 'あと0'", () => {
    const milestone = pickNearestBadgeMilestone([
      badge({
        counter: 10,
        nextThreshold: 10,
        tiers: [{ threshold: 10, tier: 1 }],
      }),
      badge({
        counter: NaN,
        nextThreshold: 10,
        tiers: [{ threshold: 10, tier: 1 }],
      }),
    ]);

    assert.equal(milestone, null);
  });

  it("breaks ties by progress order (BE definition order wins)", () => {
    const milestone = pickNearestBadgeMilestone([
      badge({
        code: "first",
        counter: 7,
        displayName: "先に定義",
        nextThreshold: 10,
        tiers: [{ threshold: 10, tier: 1 }],
      }),
      badge({
        code: "second",
        counter: 17,
        displayName: "後に定義",
        nextThreshold: 20,
        tiers: [{ threshold: 20, tier: 2 }],
      }),
    ]);

    assert.equal(milestone?.displayName, "先に定義");
  });

  it("returns null for an empty progress list", () => {
    assert.equal(pickNearestBadgeMilestone([]), null);
  });
});
