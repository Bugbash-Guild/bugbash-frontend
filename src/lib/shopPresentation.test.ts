import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  shopBalanceForCurrency,
} from "./shopPresentation";
import type { ShopItem } from "@/types/shop";

const runeItem: ShopItem = {
  assetUrl: null,
  category: "SOUL_PACK",
  currency: "RUNE",
  description: "属性指定の魂パック",
  iconEmoji: "*",
  itemId: "soul-pack-fire",
  name: "火の魂パック",
  price: 80,
};

const guildCoinItem: ShopItem = {
  ...runeItem,
  currency: "GUILD_COIN",
  itemId: "evolution-stone",
  name: "進化石",
  price: 120,
};

describe("shop presentation helpers", () => {
  it("selects the balance that matches each shop item currency", () => {
    assert.equal(
      shopBalanceForCurrency("GUILD_COIN", { guildCoinBalance: 300, runeBalance: 40 }),
      300,
    );
    assert.equal(shopBalanceForCurrency("RUNE", { guildCoinBalance: 300, runeBalance: 40 }), 40);
  });

  it("formats shop currency labels without mixing coin and rune icons", () => {
    assert.equal(formatShopCurrencyAmount("GUILD_COIN", 120), "GC 120");
    assert.equal(formatShopCurrencyAmount("RUNE", 80), "80ルーン");
  });

  it("adds rune-only purchase guard copy and top-up guidance when balance is short", () => {
    assert.deepEqual(
      buildShopPurchasePresentation(runeItem, { guildCoinBalance: 300, runeBalance: 40 }),
      {
        canAfford: false,
        cosmeticNotice: "この購入は見た目や時短のためのものです。ステータス・報酬・順位には影響しません。",
        insufficientMessage: "ルーンが足りません（必要 80 / 保有 40）",
        priceLabel: "80ルーン",
        showRuneTopUpLink: true,
      },
    );
  });

  it("does not add rune purchase guidance to guild coin shortages", () => {
    assert.deepEqual(
      buildShopPurchasePresentation(guildCoinItem, { guildCoinBalance: 40, runeBalance: 500 }),
      {
        canAfford: false,
        cosmeticNotice: null,
        insufficientMessage: "ギルドコインが足りません。PRをマージして集めましょう。",
        priceLabel: "GC 120",
        showRuneTopUpLink: false,
      },
    );
  });
});
