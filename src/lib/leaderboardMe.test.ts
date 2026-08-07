import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLeaderboardLegend,
  parseLeaderboardMe,
  shouldAppendSelfRow,
} from "./leaderboardMe";
import type { LeaderboardEntry, LeaderboardMe } from "@/types/leaderboard";

const me: LeaderboardMe = {
  experience: 12_000,
  githubLogin: "octocat",
  level: 8,
  rank: 42,
  totalHeroes: 300,
};

function entry(overrides: Partial<LeaderboardEntry> & { heroId: string }): LeaderboardEntry {
  return {
    githubLogin: null,
    level: 1,
    rank: 1,
    streakDays: 0,
    totalExperience: 100,
    ...overrides,
  };
}

describe("parseLeaderboardMe", () => {
  it("accepts the contract shape and normalizes githubLogin", () => {
    assert.deepEqual(
      parseLeaderboardMe({
        experience: 12_000,
        githubLogin: "octocat",
        level: 8,
        rank: 42,
        totalHeroes: 300,
      }),
      me,
    );
    // githubLogin: null はそのまま（heroId 等での代替は呼び出し側の責務）
    assert.equal(parseLeaderboardMe({ ...me, githubLogin: null })?.githubLogin, null);
    assert.equal(parseLeaderboardMe({ ...me, githubLogin: 123 })?.githubLogin, null);
  });

  it("rejects responses with missing or non-finite numbers", () => {
    assert.equal(parseLeaderboardMe(null), null);
    assert.equal(parseLeaderboardMe("oops"), null);
    assert.equal(parseLeaderboardMe({}), null);
    assert.equal(parseLeaderboardMe({ ...me, rank: undefined }), null);
    assert.equal(parseLeaderboardMe({ ...me, rank: Number.NaN }), null);
    assert.equal(parseLeaderboardMe({ ...me, rank: 0 }), null);
    assert.equal(parseLeaderboardMe({ ...me, level: "8" }), null);
    assert.equal(parseLeaderboardMe({ ...me, experience: null }), null);
    assert.equal(parseLeaderboardMe({ ...me, totalHeroes: undefined }), null);
  });
});

describe("shouldAppendSelfRow", () => {
  const entries = [entry({ heroId: "1" }), entry({ heroId: "2" })];

  it("appends only when the viewer is absent from the visible list", () => {
    assert.equal(shouldAppendSelfRow(entries, "99", me), true);
    assert.equal(shouldAppendSelfRow(entries, "2", me), false);
  });

  it("stays silent without /me data or a resolvable self heroId", () => {
    assert.equal(shouldAppendSelfRow(entries, "99", null), false);
    assert.equal(shouldAppendSelfRow(entries, null, me), false);
  });

  it("stays silent when the list itself is empty", () => {
    // 「…」で区切る相手がいない
    assert.equal(shouldAppendSelfRow([], "99", me), false);
  });
});

describe("buildLeaderboardLegend", () => {
  it("states the truncation fact from delivered counts, not hardcoded constants", () => {
    assert.equal(buildLeaderboardLegend(100, 1_234), "全1,234人中、上位100名を表示");
  });

  it("does not imply truncation when everyone is visible", () => {
    assert.equal(buildLeaderboardLegend(7, 7), "全7人を表示");
  });

  it("falls back to the visible count alone when the total is unknown", () => {
    assert.equal(buildLeaderboardLegend(100, null), "上位100名を表示");
    // total が矛盾している（表示数より少ない）ときも断言しない
    assert.equal(buildLeaderboardLegend(100, 50), "上位100名を表示");
  });

  it("says nothing for an empty list", () => {
    assert.equal(buildLeaderboardLegend(0, 10), null);
    assert.equal(buildLeaderboardLegend(Number.NaN, 10), null);
  });
});
