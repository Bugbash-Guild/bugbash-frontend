import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PENDING_GRANT_EXPIRES_MS,
  PENDING_ORDER_STORAGE_KEY,
  buildPendingGrantMessage,
  detectRuneGrant,
  readPendingOrder,
  writePendingOrder,
} from "./pendingGrant";

class MemoryStorage implements Pick<Storage, "getItem" | "removeItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("pending grant helpers", () => {
  it("round-trips pending order state through the UX storage key", () => {
    const storage = new MemoryStorage();
    const pendingOrder = {
      createdAt: 1_000,
      orderId: "order-1",
      runeBalanceBefore: 120,
      type: "rune" as const,
    };

    assert.equal(PENDING_ORDER_STORAGE_KEY, "bb.pendingOrder");

    writePendingOrder(storage, pendingOrder);

    assert.deepEqual(readPendingOrder(storage, 1_000), pendingOrder);
  });

  it("expires stale pending orders after 30 minutes", () => {
    const storage = new MemoryStorage();

    writePendingOrder(storage, {
      createdAt: 1_000,
      orderId: "order-1",
      runeBalanceBefore: 120,
      type: "rune",
    });

    assert.equal(readPendingOrder(storage, 1_000 + PENDING_GRANT_EXPIRES_MS + 1), null);
    assert.equal(storage.getItem(PENDING_ORDER_STORAGE_KEY), null);
  });

  it("detects a rune grant only from a real balance increase", () => {
    const pendingOrder = {
      createdAt: 1_000,
      orderId: "order-1",
      runeBalanceBefore: 120,
      type: "rune" as const,
    };

    assert.equal(detectRuneGrant(pendingOrder, 120), null);
    assert.equal(detectRuneGrant(pendingOrder, 119), null);
    assert.deepEqual(detectRuneGrant(pendingOrder, 150), { grantedRunes: 30 });
  });

  it("keeps pending and detected copy away from prohibited optimistic wording", () => {
    const pending = buildPendingGrantMessage({ status: "pending", type: "rune" });
    const detected = buildPendingGrantMessage({
      grantedRunes: 30,
      status: "detected",
      type: "rune",
    });

    const prohibitedOptimisticCopy = ["付与", "済み"].join("");

    assert.equal(pending.includes(prohibitedOptimisticCopy), false);
    assert.equal(detected.includes(prohibitedOptimisticCopy), false);
    assert.equal(pending, "ルーンの反映待ちです。残高に反映されるまで少しお待ちください。");
    assert.equal(detected, "+30ルーンが反映されました。");
  });
});
