import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ForgeIdempotencyKeys,
  buildForgeCostTable,
  canUpgradeForge,
  selectForgeStages,
} from "./forge";
import type { ForgeLevelDef } from "@/types/forge";

const defs: ForgeLevelDef[] = [
  {
    track: "MONSTER",
    level: 3,
    runeCost: 27,
    unlockDimension: "FRM",
    diffNote: "frame unlocked",
    effectTier: "T0",
  },
  {
    track: "MONSTER",
    level: 1,
    runeCost: 11,
    unlockDimension: "PAL",
    diffNote: "palette unlocked",
    effectTier: "T0",
  },
  {
    track: "MONSTER",
    level: 2,
    runeCost: 19,
    unlockDimension: "PAL",
    diffNote: "palette improved",
    effectTier: "T0",
  },
  {
    track: "MONSTER",
    level: 10,
    runeCost: 71,
    unlockDimension: "SHOWCASE",
    diffNote: "Apex showcase",
    effectTier: "T0",
  },
];

describe("forge presentation helpers", () => {
  it("orders API costs and calculates cumulative totals without a frontend price curve", () => {
    assert.deepEqual(
      buildForgeCostTable(defs).map(({ level, runeCost, cumulativeRuneCost }) => ({
        level,
        runeCost,
        cumulativeRuneCost,
      })),
      [
        { level: 1, runeCost: 11, cumulativeRuneCost: 11 },
        { level: 2, runeCost: 19, cumulativeRuneCost: 30 },
        { level: 3, runeCost: 27, cumulativeRuneCost: 57 },
        { level: 10, runeCost: 71, cumulativeRuneCost: 128 },
      ],
    );
  });

  it("selects the current, next, and Apex stage from server definitions", () => {
    const stages = selectForgeStages(defs, 2);

    assert.equal(stages.current?.level, 2);
    assert.equal(stages.next?.level, 3);
    assert.equal(stages.apex?.level, 10);
  });

  it("reuses one idempotency key for a retry and rotates it after success or target version change", () => {
    let sequence = 0;
    const keys = new ForgeIdempotencyKeys(() => `forge-key-${++sequence}`);

    const initial = keys.get("skin-1", 2);
    assert.equal(keys.get("skin-1", 2), initial);

    keys.markSucceeded("skin-1", 2);
    assert.notEqual(keys.get("skin-1", 3), initial);
    assert.notEqual(keys.get("skin-2", 2), initial);
  });

  it("disables an upgrade for stale, maxed, underfunded, or missing targets", () => {
    assert.equal(
      canUpgradeForge({
        isOwned: true,
        currentRank: 2,
        expectedRank: 1,
        next: defs[0],
        runeBalance: 99,
      }),
      false,
    );
    assert.equal(
      canUpgradeForge({
        isOwned: true,
        currentRank: 10,
        expectedRank: 10,
        next: undefined,
        runeBalance: 99,
      }),
      false,
    );
    assert.equal(
      canUpgradeForge({
        isOwned: true,
        currentRank: 2,
        expectedRank: 2,
        next: defs[0],
        runeBalance: 26,
      }),
      false,
    );
    assert.equal(
      canUpgradeForge({
        isOwned: false,
        currentRank: 2,
        expectedRank: 2,
        next: defs[0],
        runeBalance: 99,
      }),
      false,
    );
  });
});
