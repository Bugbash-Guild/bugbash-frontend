import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findFunnelBottleneck,
  formatConversionPercent,
  formatConversionPopulation,
  funnelStepLabel,
  hasAnyFunnelData,
  type FunnelSummary,
} from "./funnelReport";

function summary(
  steps: Record<string, number>,
  conversions: [string, string, number | null, number?, number?][],
): FunnelSummary {
  return {
    conversions: conversions.map(([from, to, percent, fromHeroCount, reachedHeroCount]) => ({
      from,
      fromHeroCount: fromHeroCount ?? 0,
      percent,
      reachedHeroCount: reachedHeroCount ?? 0,
      to,
    })),
    days: 7,
    steps: Object.entries(steps).map(([name, heroCount]) => ({
      eventCount: heroCount,
      heroCount,
      name,
    })),
  };
}

describe("formatConversionPercent", () => {
  it("shows an em dash rather than 0% when there is no denominator", () => {
    // 「誰も進んでいない」と「まだ誰も来ていない」は取るべき行動が正反対。
    assert.equal(formatConversionPercent(null), "—");
    assert.equal(formatConversionPercent(0), "0.0%");
    assert.equal(formatConversionPercent(42.35), "42.4%");
  });
});

describe("funnelStepLabel", () => {
  it("translates known steps and still shows unknown ones", () => {
    assert.equal(funnelStepLabel("CHECKOUT_COMPLETED"), "決済完了");
    // 出さないと「計測されていない」と「表示していない」の区別がつかない。
    assert.equal(funnelStepLabel("SOMETHING_NEW"), "SOMETHING_NEW");
  });
});

describe("findFunnelBottleneck", () => {
  it("picks the step that loses the most people, not the worst rate", () => {
    const s = summary(
      {
        CHECKOUT_STARTED: 5,
        RUNE_SHOP_VIEWED: 10,
        SUMMON_EXECUTED: 600,
        SUMMON_VIEWED: 1000,
      },
      [
        ["SUMMON_VIEWED", "SUMMON_EXECUTED", 60, 1000, 600],
        ["RUNE_SHOP_VIEWED", "CHECKOUT_STARTED", 50, 10, 5],
      ],
    );

    const worst = findFunnelBottleneck(s);

    // 率はどちらも似ているが、失っている人数は 400 対 5。
    assert.equal(worst?.conversion.from, "SUMMON_VIEWED");
    assert.equal(worst?.lostHeroes, 400);
  });

  it("returns nothing when no step has a measurable denominator", () => {
    const s = summary({ SUMMON_VIEWED: 0 }, [["SUMMON_VIEWED", "SUMMON_EXECUTED", null]]);
    assert.equal(findFunnelBottleneck(s), null);
  });

  it("ignores steps where nobody was lost", () => {
    const s = summary({ SUMMON_EXECUTED: 10, SUMMON_VIEWED: 10 }, [
      ["SUMMON_VIEWED", "SUMMON_EXECUTED", 100, 10, 10],
    ]);
    assert.equal(findFunnelBottleneck(s), null);
  });

  it("counts people who did not advance, not the difference in step totals", () => {
    // 前段を通らずに後段へ来た人が混ざると、失った人数が過小に見える。
    const s = summary(
      // 段階ごとの総人数だけ見ると 10 → 40 で「増えている」ように見える
      { PITY_REACHED: 10, RUNE_SHOP_VIEWED: 40 },
      [["PITY_REACHED", "RUNE_SHOP_VIEWED", 30, 10, 3]],
    );

    assert.equal(findFunnelBottleneck(s)?.lostHeroes, 7);
  });
});

describe("formatConversionPopulation", () => {
  it("shows the denominator so a 2-person 100% is not read as a win", () => {
    assert.equal(
      formatConversionPopulation({
        from: "A",
        fromHeroCount: 88,
        percent: 27.3,
        reachedHeroCount: 24,
        to: "B",
      }),
      "88人中 24人",
    );
  });
});

describe("hasAnyFunnelData", () => {
  it("distinguishes not-measured-yet from genuinely zero", () => {
    assert.equal(hasAnyFunnelData(summary({ SUMMON_VIEWED: 0 }, [])), false);
    assert.equal(hasAnyFunnelData(summary({ SUMMON_VIEWED: 1 }, [])), true);
  });
});
