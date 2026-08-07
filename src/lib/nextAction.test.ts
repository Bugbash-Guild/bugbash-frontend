import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNextActions } from "./nextAction";

const full = {
  guildCoinBalance: 16475,
  limitedPullCost: 30,
  normalPullCost: 300,
  runeBalance: 340,
};

describe("buildNextActions", () => {
  it("reports how many pulls each currency affords", () => {
    const rows = buildNextActions(full);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      count: 54,
      currency: "coin",
      currencyLabel: "ギルドコイン",
      href: "/summon",
      kind: "ready",
      subject: "召喚",
    });
    assert.equal(rows[1]?.kind, "ready");
    assert.equal(rows[1]?.currency, "rune");
    assert.equal(rows[1]?.kind === "ready" ? rows[1].count : null, 11);
    assert.equal(rows[1]?.href, "/summon/limited");
  });

  it("keeps the coin row first so the free path is never buried under the paid one", () => {
    const rows = buildNextActions(full);
    assert.deepEqual(
      rows.map((row) => row.currency),
      ["coin", "rune"],
    );
  });

  it("turns a short coin balance into a distance row instead of hiding the goal", () => {
    const rows = buildNextActions({ ...full, guildCoinBalance: 80 });

    assert.deepEqual(rows[0], {
      currency: "coin",
      currencyLabel: "ギルドコイン",
      href: "/summon",
      kind: "distance",
      shortfall: 220,
      subject: "召喚",
    });
    // コインが距離行になっても、ルーンの READY 行は変わらず後ろに並ぶ
    assert.equal(rows[1]?.kind, "ready");
    assert.equal(rows[1]?.currency, "rune");
  });

  it("reports the full cost as the distance when the coin balance is zero", () => {
    const rows = buildNextActions({ ...full, guildCoinBalance: 0, runeBalance: 0 });
    assert.equal(rows.length, 1);
    const first = rows[0];
    assert.equal(first?.kind, "distance");
    assert.equal(first?.kind === "distance" ? first.shortfall : null, 300);
  });

  it("never shows a rune distance row — a shortfall for the paid currency would be purchase pressure", () => {
    assert.deepEqual(
      buildNextActions({ ...full, runeBalance: 29 }).map((row) => [
        row.currency,
        row.kind,
      ]),
      [["coin", "ready"]],
    );
  });

  it("omits a currency whose cost has not loaded yet rather than guessing", () => {
    assert.deepEqual(
      buildNextActions({ ...full, limitedPullCost: null }).map((r) => r.currency),
      ["coin"],
    );
    // コストが未取得だと距離も計算できないので、コイン行ごと出さない
    assert.deepEqual(
      buildNextActions({ ...full, normalPullCost: undefined }).map(
        (r) => r.currency,
      ),
      ["rune"],
    );
  });

  it("omits a currency whose balance has not loaded yet", () => {
    assert.deepEqual(
      buildNextActions({ ...full, runeBalance: undefined }).map(
        (r) => r.currency,
      ),
      ["coin"],
    );
    assert.deepEqual(
      buildNextActions({ ...full, guildCoinBalance: null }).map(
        (r) => r.currency,
      ),
      ["rune"],
    );
  });

  it("treats a non-positive cost as unusable instead of dividing by zero", () => {
    assert.deepEqual(buildNextActions({ ...full, normalPullCost: 0 }).map((r) => r.currency), [
      "rune",
    ]);
    assert.deepEqual(
      buildNextActions({ ...full, limitedPullCost: -1 }).map((r) => r.currency),
      ["coin"],
    );
  });
});
