import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  isShopPurchaseBlocked,
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
    assert.equal(formatShopCurrencyAmount("GUILD_COIN", 120), "120 ギルドコイン");
    assert.equal(formatShopCurrencyAmount("RUNE", 80), "80 ルーン");
  });

  it("adds rune-only purchase guard copy and top-up guidance when balance is short", () => {
    assert.deepEqual(
      buildShopPurchasePresentation(runeItem, { guildCoinBalance: 300, runeBalance: 40 }),
      {
        affordability: "insufficient",
        cosmeticNotice:
          "この購入は育成を早めるためのものです。ランキングと実績バッジには影響しません（どちらもPRの活動でのみ進みます）。",
        insufficientMessage: "ルーンが足りません（必要 80 / 保有 40）",
        priceLabel: "80 ルーン",
        showRuneTopUpLink: true,
      },
    );
  });

  /*
    魂パックは相棒のレベルに直接使え、レベルアップは +100 ギルドコインを生む。
    「ステータス・報酬には影響しません」と述べていた頃の文言に戻さないための番人。
  */
  it("never claims a growth item leaves stats or rewards untouched", () => {
    for (const category of ["SOUL_PACK", "EVOLUTION"] as const) {
      const notice = buildShopPurchasePresentation(
        { ...runeItem, category },
        { guildCoinBalance: 300, runeBalance: 999 },
      ).cosmeticNotice;
      assert.ok(notice != null);
      assert.ok(!notice.includes("ステータス"), `${category}: ステータスへの言及は事実と違う`);
      assert.ok(!notice.includes("報酬"), `${category}: 報酬への言及は事実と違う`);
      assert.ok(!notice.includes("見た目"), `${category}: 見た目だけの購入ではない`);
    }
  });

  it("says the balance is unknown instead of claiming it is zero", () => {
    // 残高が届いていないだけで「買えない」と表示すると、金を持っている
    // ユーザーの前で全商品を赤くして購入を塞ぐことになる。
    const presentation = buildShopPurchasePresentation(runeItem, {
      guildCoinBalance: null,
      runeBalance: null,
    });

    assert.equal(presentation.affordability, "unknown");
    assert.equal(presentation.insufficientMessage, null);
    assert.equal(presentation.showRuneTopUpLink, false);
    assert.equal(isShopPurchaseBlocked(presentation), false, "分からないなら押させる");
  });

  it("blocks the purchase only when the shortage is actually known", () => {
    const short = buildShopPurchasePresentation(runeItem, {
      guildCoinBalance: 300,
      runeBalance: 40,
    });
    const enough = buildShopPurchasePresentation(runeItem, {
      guildCoinBalance: 300,
      runeBalance: 400,
    });

    assert.equal(isShopPurchaseBlocked(short), true);
    assert.equal(isShopPurchaseBlocked(enough), false);
    assert.equal(enough.affordability, "affordable");
  });

  it("does not add rune purchase guidance to guild coin shortages", () => {
    assert.deepEqual(
      buildShopPurchasePresentation(guildCoinItem, { guildCoinBalance: 40, runeBalance: 500 }),
      {
        affordability: "insufficient",
        cosmeticNotice: null,
        insufficientMessage: "ギルドコインが足りません。PRをマージして集めましょう。",
        priceLabel: "120 ギルドコイン",
        showRuneTopUpLink: false,
      },
    );
  });
});
