import type { ShopItem, ShopItemCurrency } from "@/types/shop";

export type ShopBalances = {
  guildCoinBalance: number;
  runeBalance: number;
};

export type ShopPurchasePresentation = {
  canAfford: boolean;
  cosmeticNotice: string | null;
  insufficientMessage: string | null;
  priceLabel: string;
  showRuneTopUpLink: boolean;
};

export function shopBalanceForCurrency(
  currency: ShopItemCurrency,
  balances: ShopBalances,
): number {
  return currency === "RUNE" ? balances.runeBalance : balances.guildCoinBalance;
}

export function formatShopCurrencyAmount(currency: ShopItemCurrency, amount: number): string {
  if (currency === "RUNE") return `${amount.toLocaleString("ja-JP")}ルーン`;
  return `GC ${amount.toLocaleString("ja-JP")}`;
}

export function buildShopPurchasePresentation(
  item: ShopItem,
  balances: ShopBalances,
): ShopPurchasePresentation {
  const balance = shopBalanceForCurrency(item.currency, balances);
  const canAfford = balance >= item.price;
  const priceLabel = formatShopCurrencyAmount(item.currency, item.price);

  if (item.currency === "RUNE") {
    return {
      canAfford,
      cosmeticNotice:
        "この購入は見た目や時短のためのものです。ステータス・報酬・順位には影響しません。",
      insufficientMessage: canAfford
        ? null
        : `ルーンが足りません（必要 ${item.price.toLocaleString("ja-JP")} / 保有 ${balance.toLocaleString(
            "ja-JP",
          )}）`,
      priceLabel,
      showRuneTopUpLink: !canAfford,
    };
  }

  return {
    canAfford,
    cosmeticNotice: null,
    insufficientMessage: canAfford
      ? null
      : "ギルドコインが足りません。PRをマージして集めましょう。",
    priceLabel,
    showRuneTopUpLink: false,
  };
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

  if (status === 401) {
    return "セッションが切れました。再度ログインしてください。";
  }

  return "一時的なエラーが発生しました。時間をおいて再度お試しください。";
}
