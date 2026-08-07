import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNextMilestone } from "./nextMilestone";
import type { Monster } from "@/types/monster";

function monster(over: Partial<Monster> = {}): Monster {
  return {
    emoji: "◆",
    id: over.id ?? "m-1",
    isOwned: false,
    level: 1,
    name: "テスト",
    rarity: "R",
    soulCount: 0,
    ...over,
  };
}

const heroBits = { heroLevel: 12, xpToNextLevel: 1240 };

describe("buildNextMilestone", () => {
  it("points at the first unowned slot in dex order (id ascending, like /monsters)", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [
        // 配列順ではこれが先頭だが、図鑑（id 昇順）では "b" が先
        monster({ id: "c", prAcquirable: true }),
        monster({ id: "a", isOwned: true, prAcquirable: true }),
        monster({ id: "b", prAcquirable: true, rarity: "SR" }),
      ],
      ownedDegraded: false,
    });

    assert.deepEqual(milestone, {
      discovered: 1,
      kind: "dex-next",
      prAcquirable: true,
      rarity: "SR",
      total: 3,
    });
  });

  it("prefers a PR-acquirable slot over an earlier summon-only one (free path first)", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [
        monster({ id: "a", prAcquirable: false, rarity: "SSR" }),
        monster({ id: "b", prAcquirable: true, rarity: "N" }),
      ],
      ownedDegraded: false,
    });

    assert.equal(milestone?.kind, "dex-next");
    assert.equal(milestone?.kind === "dex-next" ? milestone.rarity : null, "N");
  });

  it("claims nothing about acquisition when the flag has not loaded", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [monster({ id: "a" })],
      ownedDegraded: false,
    });

    assert.equal(milestone?.kind, "dex-next");
    assert.equal(
      milestone?.kind === "dex-next" ? milestone.prAcquirable : "sentinel",
      undefined,
    );
  });

  it("states the remaining count when only summon-only slots are left", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [
        monster({ id: "a", isOwned: true, prAcquirable: true }),
        monster({ id: "b", prAcquirable: false }),
        monster({ id: "c", prAcquirable: false }),
      ],
      ownedDegraded: false,
    });

    assert.deepEqual(milestone, {
      discovered: 1,
      kind: "dex-summon-only",
      remaining: 2,
      total: 3,
    });
  });

  it("falls back to the level milestone when the dex is complete", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [monster({ id: "a", isOwned: true })],
      ownedDegraded: false,
    });

    assert.deepEqual(milestone, { kind: "level", nextLevel: 13, xpToNext: 1240 });
  });

  it("does not trust dex facts while owned data is degraded", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [monster({ id: "a" }), monster({ id: "b" })],
      ownedDegraded: true,
    });

    assert.equal(milestone?.kind, "level");
  });

  it("falls back to the level milestone while the dex has not loaded", () => {
    const milestone = buildNextMilestone({
      ...heroBits,
      monsters: [],
      ownedDegraded: false,
    });

    assert.deepEqual(milestone, { kind: "level", nextLevel: 13, xpToNext: 1240 });
  });

  it("returns null instead of guessing when level fields are unreadable", () => {
    const base = { monsters: [], ownedDegraded: false };
    assert.equal(
      buildNextMilestone({ ...base, heroLevel: NaN, xpToNextLevel: 100 }),
      null,
    );
    assert.equal(
      buildNextMilestone({ ...base, heroLevel: 12, xpToNextLevel: undefined }),
      null,
    );
    assert.equal(
      buildNextMilestone({ ...base, heroLevel: 12, xpToNextLevel: 0 }),
      null,
    );
  });
});
