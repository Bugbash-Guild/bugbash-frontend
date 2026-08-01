import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRewardSummary,
  formatCoinBreakdown,
  formatDailyPolicyNote,
  formatRewardTotals,
} from "./rewardSummary";
import type { Activity } from "@/types/activity";

function activity(
  id: number,
  opts: {
    coin?: number;
    coinDetail?: Record<string, unknown>;
    levelAfter?: number;
    metadata?: Record<string, unknown> | undefined;
    items?: { itemId: string; name: string; quantity: number }[];
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
    rewards.push({
      detail: opts.coinDetail ?? {},
      occurredAt: "",
      quantity: opts.coin,
      rewardType: "coin" as const,
    });
  if (opts.soul != null)
    rewards.push({ detail: {}, occurredAt: "", quantity: opts.soul, rewardType: "soul" as const });
  for (const item of opts.items ?? [])
    rewards.push({
      detail: { iconEmoji: "💎", itemId: item.itemId, name: item.name },
      occurredAt: "",
      quantity: item.quantity,
      rewardType: "item" as const,
    });

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

    assert.deepEqual(s.totals, {
      coin: 300,
      itemCount: 0,
      monsterCount: 3,
      soul: 15,
      xp: 300,
    });
    assert.equal(s.entries.length, 2);
    assert.equal(s.hiddenCount, 1, "打ち切った件数は表に出す");
  });

  it("surfaces dropped materials so the evolution stone is not a silent drop", () => {
    // 以前は付与だけで記録が無く、次にインベントリを見るまで気づけなかった。
    const s = buildRewardSummary([
      activity(1, {
        items: [{ itemId: "evolution-stone", name: "進化の輝石", quantity: 1 }],
        xp: 100,
      }),
      activity(2, {
        items: [{ itemId: "evolution-stone", name: "進化の輝石", quantity: 1 }],
        xp: 100,
      }),
    ]);

    assert.equal(s.totals.itemCount, 2);
    assert.equal(s.entries[0]?.items[0]?.name, "進化の輝石");
    assert.equal(s.entries[0]?.items[0]?.quantity, 1);
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
    assert.deepEqual(s.totals, {
      coin: 0,
      itemCount: 0,
      monsterCount: 0,
      soul: 0,
      xp: 0,
    });
    assert.equal(s.entries.length, 1);
  });
});

describe("formatRewardTotals", () => {
  it("omits zero rows and uses the display currency names", () => {
    assert.deepEqual(
      formatRewardTotals({
        coin: 900,
        itemCount: 2,
        monsterCount: 5,
        soul: 50,
        xp: 700,
      }),
      ["+700 XP", "+900 ギルドコイン", "+50 魂", "素材 2 個", "5 体"],
    );
    assert.deepEqual(
      formatRewardTotals({
        coin: 0,
        itemCount: 0,
        monsterCount: 0,
        soul: 0,
        xp: 100,
      }),
      ["+100 XP"],
    );
    assert.deepEqual(
      formatRewardTotals({ coin: 0, itemCount: 0, monsterCount: 0, soul: 0, xp: 0 }),
      [],
    );
  });
});

describe("formatCoinBreakdown", () => {
  const detail = {
    base: 100,
    dailyPolicyPercent: 100,
    largePrBonus: 0,
    streakBonus: 300,
  };

  it("names what was added on top of the base", () => {
    assert.equal(formatCoinBreakdown(detail), "基本 100 · ストリーク +300");
    assert.equal(
      formatCoinBreakdown({ ...detail, largePrBonus: 50 }),
      "基本 100 · 大規模PR +50 · ストリーク +300",
    );
  });

  it("says nothing when only the base was granted", () => {
    assert.equal(formatCoinBreakdown({ ...detail, streakBonus: 0 }), null);
  });

  it("says nothing when the backend did not send a breakdown", () => {
    assert.equal(formatCoinBreakdown(null), null);
  });

  it("reads the breakdown from the backend instead of inferring it from the total", () => {
    // 合計から差分を推測すると捏造になる。BEの値をそのまま使う。
    const summary = buildRewardSummary([
      activity(1, { coin: 400, coinDetail: detail, xp: 100 }),
    ]);
    assert.deepEqual(summary.entries[0]?.coinDetail, detail);
  });
});

describe("formatDailyPolicyNote", () => {
  const base = { base: 100, dailyPolicyPercent: 100, largePrBonus: 0, streakBonus: 0 };

  it("stays silent when nothing was reduced", () => {
    assert.equal(formatDailyPolicyNote(base), null);
    assert.equal(formatDailyPolicyNote(null), null);
  });

  it("explains the reduction on the pull that was actually reduced", () => {
    assert.equal(
      formatDailyPolicyNote({ ...base, dailyPolicyPercent: 50 }),
      "同日のマージ本数が多いため、資源が 50% になっています",
    );
  });

  it("says plainly when nothing was granted at all", () => {
    assert.equal(
      formatDailyPolicyNote({ ...base, dailyPolicyPercent: 0 }),
      "同日のマージ本数が多いため、このPRでは資源が付与されていません",
    );
  });
});
