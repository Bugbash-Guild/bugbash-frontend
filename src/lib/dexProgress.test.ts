import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAcquisitionHint, buildDexProgress, isSummonOnly } from "./dexProgress";
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

describe("buildDexProgress", () => {
  it("counts the summon-only slots separately from the whole dex", () => {
    const progress = buildDexProgress([
      monster({ id: "a", isOwned: true, prAcquirable: true }),
      monster({ id: "b", prAcquirable: true }),
      monster({ id: "c", isOwned: true, prAcquirable: false }),
      monster({ id: "d", prAcquirable: false }),
      monster({ id: "e", prAcquirable: false }),
    ]);

    assert.deepEqual(progress, {
      discovered: 2,
      summonOnlyDiscovered: 1,
      summonOnlyTotal: 3,
      total: 5,
    });
  });

  it("reports zero summon-only when the API has not sent the flag", () => {
    const progress = buildDexProgress([monster({ isOwned: true }), monster()]);
    assert.equal(progress.summonOnlyTotal, 0);
    assert.equal(progress.total, 2);
    assert.equal(progress.discovered, 1);
  });

  it("treats only an explicit false as summon-only", () => {
    assert.equal(isSummonOnly(monster({ prAcquirable: false })), true);
    assert.equal(isSummonOnly(monster({ prAcquirable: true })), false);
    assert.equal(isSummonOnly(monster()), false);
  });
});

describe("buildAcquisitionHint", () => {
  it("says nothing for monsters already owned", () => {
    assert.equal(buildAcquisitionHint(monster({ isOwned: true, prAcquirable: false })), null);
    assert.equal(buildAcquisitionHint(monster({ isOwned: true, prAcquirable: true })), null);
  });

  it("points summon-only slots at the limited banner and marks them paid", () => {
    const hint = buildAcquisitionHint(monster({ prAcquirable: false }));
    assert.deepEqual(hint, {
      paid: true,
      route: { href: "/summon/limited", label: "限定召喚で狙う" },
      text: "召喚専用",
    });
  });

  it("tells free slots to merge a PR and offers no purchase route", () => {
    const hint = buildAcquisitionHint(monster({ prAcquirable: true }));
    assert.equal(hint?.paid, false);
    assert.equal(hint?.route, null);
    assert.equal(hint?.text, "PR をマージすると出会えます");
  });

  it("guesses nothing when the flag has not loaded", () => {
    assert.equal(buildAcquisitionHint(monster()), null);
  });
});
