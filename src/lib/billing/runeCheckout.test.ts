import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHECKOUT_IDEMPOTENCY_KEY_PREFIX,
  buildCheckoutRequest,
  buildRuneProductCards,
  clearCheckoutIdempotencyKey,
  formatJpy,
  formatRuneUnitPrice,
  getOrCreateCheckoutIdempotencyKey,
  mapBillingCheckoutError,
  readCheckoutIdempotencyKey,
} from "./runeCheckout";
import type { RuneProduct } from "@/types/billing";

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

const products: RuneProduct[] = [
  {
    bonusRune: 0,
    firstPurchaseOnly: false,
    id: "rune_60",
    priceJpyTaxIncluded: 240,
    runeAmount: 60,
    sku: "rune_60",
    totalRune: 60,
  },
  {
    bonusRune: 140,
    firstPurchaseOnly: true,
    id: "rune_starter",
    priceJpyTaxIncluded: 480,
    runeAmount: 30,
    sku: "rune_starter",
    totalRune: 170,
  },
];

describe("rune checkout helpers", () => {
  it("formats prices and rune unit price from rune-products API values", () => {
    assert.equal(formatJpy(480), "¥480（税込）");
    assert.equal(formatJpy(1200), "¥1,200（税込）");
    assert.equal(formatRuneUnitPrice(products[1]), "¥2.8/ルーン");
  });

  it("keeps first-purchase products first without changing API amounts", () => {
    assert.deepEqual(buildRuneProductCards(products), [
      {
        bonusText: "30 + ボーナス140",
        firstPurchaseOnly: true,
        id: "rune_starter",
        price: "¥480（税込）",
        runeText: "170ルーン",
        unitPrice: "¥2.8/ルーン",
      },
      {
        bonusText: "60 + ボーナス0",
        firstPurchaseOnly: false,
        id: "rune_60",
        price: "¥240（税込）",
        runeText: "60ルーン",
        unitPrice: "¥4.0/ルーン",
      },
    ]);
  });

  it("stores one idempotency key per product until checkout succeeds", () => {
    const storage = new MemoryStorage();
    const productId = "rune_60";

    assert.equal(CHECKOUT_IDEMPOTENCY_KEY_PREFIX, "bb.checkout.");
    assert.equal(readCheckoutIdempotencyKey(storage, productId), null);

    const first = getOrCreateCheckoutIdempotencyKey(storage, productId, () => "idem-1");
    const second = getOrCreateCheckoutIdempotencyKey(storage, productId, () => "idem-2");

    assert.equal(first, "idem-1");
    assert.equal(second, "idem-1");
    assert.equal(readCheckoutIdempotencyKey(storage, productId), "idem-1");

    clearCheckoutIdempotencyKey(storage, productId);
    assert.equal(readCheckoutIdempotencyKey(storage, productId), null);
  });

  it("builds the checkout request body accepted by the backend", () => {
    assert.deepEqual(buildCheckoutRequest("rune_60", "idem-1"), {
      idempotencyKey: "idem-1",
      runeProductId: "rune_60",
    });
  });

  it("maps checkout errors without exposing backend English messages", () => {
    assert.deepEqual(mapBillingCheckoutError(401, ""), {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "first purchase already claimed"), {
      action: "none",
      message: "初回限定パックはお一人様1回までです。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "商品 rune_starter は初回購入限定です（すでに購入済み）"), {
      action: "none",
      message: "初回限定パックはお一人様1回までです。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "age verification required"), {
      action: "ageGate",
      message: "購入には年齢確認が必要です。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "初回課金前に年齢確認が必要です"), {
      action: "ageGate",
      message: "購入には年齢確認が必要です。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "monthly spending cap exceeded"), {
      action: "none",
      message: "30日間の購入上限を超えるため購入できません。上限は毎日少しずつ回復します。",
    });
    assert.deepEqual(mapBillingCheckoutError(422, "課金上限を超えます（当月上限 ¥5000 / 当月購入 ¥4800）"), {
      action: "none",
      message: "30日間の購入上限を超えるため購入できません。上限は毎日少しずつ回復します。",
    });
  });
});
