import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildWalletBadgeItems, formatWalletAmount } from "./walletBadge";

describe("wallet badge presentation", () => {
  it("formats wallet amounts for scan-friendly display", () => {
    assert.equal(formatWalletAmount(0), "0");
    assert.equal(formatWalletAmount(1200), "1,200");
    assert.equal(formatWalletAmount(9876543), "9,876,543");
  });

  it("builds the public wallet balance rows without exposing internal debt", () => {
    const items = buildWalletBadgeItems({
      guildCoinBalance: 1200,
      runeBalance: 300,
      paidRuneBalance: 240,
      freeRuneBalance: 60,
      runeDebt: 999,
    });

    assert.deepEqual(items, [
      { label: "GC", tone: "gold", value: "1,200" },
      { label: "RUNE", tone: "accent", value: "300" },
      { label: "paid", tone: "dim", value: "240" },
      { label: "free", tone: "dim", value: "60" },
    ]);
    assert.equal(JSON.stringify(items).includes("runeDebt"), false);
    assert.equal(JSON.stringify(items).includes("999"), false);
  });
});
