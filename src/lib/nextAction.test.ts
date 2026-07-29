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
    assert.equal(rows[0]?.currency, "coin");
    assert.equal(rows[0]?.count, 54);
    assert.equal(rows[0]?.href, "/summon");
    assert.equal(rows[1]?.currency, "rune");
    assert.equal(rows[1]?.count, 11);
    assert.equal(rows[1]?.href, "/summon/limited");
  });

  it("keeps the coin row first so the free path is never buried under the paid one", () => {
    const rows = buildNextActions(full);
    assert.deepEqual(
      rows.map((row) => row.currency),
      ["coin", "rune"],
    );
  });

  it("omits a currency that cannot afford a single pull", () => {
    assert.deepEqual(
      buildNextActions({ ...full, runeBalance: 29 }).map((r) => r.currency),
      ["coin"],
    );
    assert.deepEqual(
      buildNextActions({ ...full, guildCoinBalance: 0 }).map((r) => r.currency),
      ["rune"],
    );
    assert.deepEqual(
      buildNextActions({ ...full, guildCoinBalance: 0, runeBalance: 0 }),
      [],
    );
  });

  it("omits a currency whose cost has not loaded yet rather than guessing", () => {
    assert.deepEqual(
      buildNextActions({ ...full, limitedPullCost: null }).map((r) => r.currency),
      ["coin"],
    );
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
