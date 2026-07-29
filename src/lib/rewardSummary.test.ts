import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRewardSummary, formatRewardTotals } from "./rewardSummary";
import type { Activity } from "@/types/activity";

function activity(
  id: number,
  opts: {
    coin?: number;
    levelAfter?: number;
    metadata?: Record<string, unknown> | undefined;
    monsters?: { name: string; rarity: string }[];
    soul?: number;
    xp?: number;
  } = {},
): Activity {
  const rewards = [];
  if (opts.xp != null)
    rewards.push({
      detail: { levelAfter: opts.levelAfter ?? 10, levelBefore: 10 },
      occurredAt: "",
      quantity: opts.xp,
      rewardType: "xp" as const,
    });
  for (const m of opts.monsters ?? [])
    rewards.push({
      detail: { emoji: "◆", name: m.name, rarity: m.rarity },
      occurredAt: "",
      quantity: 1,
      rewardType: "monster" as const,
    });
  if (opts.coin != null)
    rewards.push({ detail: {}, occurredAt: "", quantity: opts.coin, rewardType: "coin" as const });
  if (opts.soul != null)
    rewards.push({ detail: {}, occurredAt: "", quantity: opts.soul, rewardType: "soul" as const });

  return {
    activityType: "PR_MERGED",
    groupKey: null,
    heroLevelAfter: 10,
    heroXpAfter: 0,
    id,
    metadata:
      "metadata" in opts
        ? (opts.metadata as Record<string, unknown>)
        : { prNumber: id, repositoryFullName: "bugbash-guild/frontend", title: `feat: ${id}` },
    occurredAt: "",
    rewards,
  };
}

describe("buildRewardSummary", () => {
  it("groups rewards per PR instead of flattening them into one list", () => {
    const s = buildRewardSummary([
      activity(1, { coin: 400, monsters: [{ name: "ドラゴン", rarity: "SSR" }], soul: 10, xp: 100 }),
      activity(2, { coin: 100, monsters: [{ name: "狼", rarity: "R" }], soul: 10, xp: 100 }),
    ]);

    assert.equal(s.prCount, 2);
    assert.equal(s.entries.length, 2);
    assert.equal(s.entries[0]?.monsters[0]?.name, "ドラゴン");
    assert.equal(s.entries[0]?.coin, 400);
    assert.equal(s.entries[1]?.monsters[0]?.name, "狼");
    assert.equal(s.entries[0]?.repositoryName, "frontend");
    assert.equal(s.entries[0]?.prNumber, 1);
  });

  it("totals every currency across all PRs, including ones it does not list", () => {
    const s = buildRewardSummary(
      [1, 2, 3].map((i) => activity(i, { coin: 100, monsters: [{ name: "x", rarity: "N" }], soul: 5, xp: 100 })),
      2,
    );

    assert.deepEqual(s.totals, { coin: 300, monsterCount: 3, soul: 15, xp: 300 });
    assert.equal(s.entries.length, 2);
    assert.equal(s.hiddenCount, 1, "打ち切った件数は表に出す");
  });

  it("reports the highest level reached and whether any level up happened", () => {
    const none = buildRewardSummary([activity(1, { levelAfter: 10, xp: 100 })]);
    assert.equal(none.leveledUp, false);
    assert.equal(none.maxLevelAfter, null);

    const up = buildRewardSummary([
      activity(1, { levelAfter: 11, xp: 100 }),
      activity(2, { levelAfter: 13, xp: 100 }),
    ]);
    assert.equal(up.leveledUp, true);
    assert.equal(up.maxLevelAfter, 13);
  });

  it("puts the rarest monster first so the highlight is not buried", () => {
    const s = buildRewardSummary([
      activity(1, {
        monsters: [
          { name: "スライム", rarity: "N" },
          { name: "ドラゴン", rarity: "SSR" },
          { name: "狼", rarity: "R" },
        ],
      }),
    ]);
    assert.deepEqual(
      s.entries[0]?.monsters.map((m) => m.rarity),
      ["SSR", "R", "N"],
    );
  });

  it("survives missing metadata rather than throwing", () => {
    const s = buildRewardSummary([activity(1, { metadata: undefined, xp: 100 })]);
    assert.equal(s.entries[0]?.prNumber, null);
    assert.equal(s.entries[0]?.repositoryName, null);
    assert.equal(s.entries[0]?.title, null);
    assert.equal(s.totals.xp, 100);
  });

  it("handles an activity with no rewards at all", () => {
    const s = buildRewardSummary([activity(1)]);
    assert.deepEqual(s.totals, { coin: 0, monsterCount: 0, soul: 0, xp: 0 });
    assert.equal(s.entries.length, 1);
  });
});

describe("formatRewardTotals", () => {
  it("omits zero rows and uses the display currency names", () => {
    assert.deepEqual(
      formatRewardTotals({ coin: 900, monsterCount: 5, soul: 50, xp: 700 }),
      ["+700 XP", "+900 ギルドコイン", "+50 魂", "5 体"],
    );
    assert.deepEqual(formatRewardTotals({ coin: 0, monsterCount: 0, soul: 0, xp: 100 }), [
      "+100 XP",
    ]);
    assert.deepEqual(formatRewardTotals({ coin: 0, monsterCount: 0, soul: 0, xp: 0 }), []);
  });
});
