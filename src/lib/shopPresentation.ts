import type { ShopItem, ShopItemCurrency } from "@/types/shop";

/**
 * 残高。**まだ分かっていない**ことを null で表す。
 *
 * 以前は未取得を 0 に丸めていたため、残高が届いていないだけで
 * 全商品が赤（買えない）になり、購入ボタンまで塞がっていた。
 * 「お金があるのに買えない画面」を出すのは、ショップとして最悪の誤りである。
 */
export type ShopBalances = {
  guildCoinBalance: number | null;
  runeBalance: number | null;
};

/** 買えるか。分からないなら分からないと言う（買えないとは言わない）。 */
export type ShopAffordability = "affordable" | "insufficient" | "unknown";

export type ShopPurchasePresentation = {
  affordability: ShopAffordability;
  cosmeticNotice: string | null;
  insufficientMessage: string | null;
  priceLabel: string;
  showRuneTopUpLink: boolean;
};

export function shopBalanceForCurrency(
  currency: ShopItemCurrency,
  balances: ShopBalances,
): number | null {
  return currency === "RUNE" ? balances.runeBalance : balances.guildCoinBalance;
}

export function formatShopCurrencyAmount(currency: ShopItemCurrency, amount: number): string {
  // 通貨の呼び名は全画面で統一する（以前はここだけ "GC" だった）。
  if (currency === "RUNE") return `${amount.toLocaleString("ja-JP")} ルーン`;
  return `${amount.toLocaleString("ja-JP")} ギルドコイン`;
}

export function buildShopPurchasePresentation(
  item: ShopItem,
  balances: ShopBalances,
): ShopPurchasePresentation {
  const balance = shopBalanceForCurrency(item.currency, balances);
  const affordability: ShopAffordability =
    balance == null ? "unknown" : balance >= item.price ? "affordable" : "insufficient";
  const priceLabel = formatShopCurrencyAmount(item.currency, item.price);
  const insufficient = affordability === "insufficient";

  if (item.currency === "RUNE") {
    return {
      affordability,
      cosmeticNotice:
        "この購入は見た目や時短のためのものです。ステータス・報酬・順位には影響しません。",
      insufficientMessage:
        insufficient && balance != null
          ? `ルーンが足りません（必要 ${item.price.toLocaleString("ja-JP")} / 保有 ${balance.toLocaleString(
              "ja-JP",
            )}）`
          : null,
      priceLabel,
      showRuneTopUpLink: insufficient,
    };
  }

  return {
    affordability,
    cosmeticNotice: null,
    insufficientMessage: insufficient
      ? "ギルドコインが足りません。PRをマージして集めましょう。"
      : null,
    priceLabel,
    showRuneTopUpLink: false,
  };
}

/**
 * 購入を止めるのは「足りないと分かっているとき」だけ。
 * 分からないときは押させる — 最終的な判定はサーバが持っている。
 */
export function isShopPurchaseBlocked(presentation: ShopPurchasePresentation): boolean {
  return presentation.affordability === "insufficient";
}

export function mapShopPurchaseErrorMessage(
  item: ShopItem,
  balances: ShopBalances,
  status: number,
): string {
  const presentation = buildShopPurchasePresentation(item, balances);
  if (status === 422 && presentation.insufficientMessage) {
    return presentation.insufficientMessage;
  }

  if (status === 422) {
    return formatShopCurrencyAmount(item.currency, item.price) + " が足りませんでした。";
  }

  if (status === 401) {
    return "セッションが切れました。再度ログインしてください。";
  }

  return "一時的なエラーが発生しました。時間をおいて再度お試しください。";
}
