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
  /**
   * ルーン（現金由来）で買うときに、その買い物が**何に効いて何に効かないか**を
   * 述べる注記。
   *
   * 以前はルーン建てなら一律に「見た目や時短のためのもので、ステータス・報酬・
   * 順位には影響しません」と表示していた。しかしこの画面のルーン建て商品は
   * 属性魂パックで、魂は相棒のレベルに直接使え、レベルアップは +100
   * ギルドコインを生む。つまり「ステータスに影響しない」も「報酬に影響しない」も
   * 事実と違っていた。
   *
   * 順位だけは本当に影響しない（Leaderboard は heroes.experience 順で、
   * experience は PR マージでしか増えない。HeroRepositoryImpl.findTopRanked）。
   * 言えることだけを言う。
   */
  cosmeticNotice: string | null;
  insufficientMessage: string | null;
  priceLabel: string;
  showRuneTopUpLink: boolean;
};

/** 見た目だけを変える商品（スキン・記念プレート・フォージ）向けの注記。 */
const COSMETIC_NOTICE =
  "この購入で変わるのは見た目だけです。ステータス・報酬・順位には影響しません。";

/**
 * 育成に効く商品（魂パック・進化素材）向けの注記。
 *
 * 「影響しない」と言えるのは順位と実績バッジだけなので、その2つだけを述べる。
 * バッジ側は BE が活動由来の魂で到達できたかを見て進行を判定する
 * （LevelUpMonsterUseCase / EvolveMonsterUseCase の活動由来ガード）。
 */
const GROWTH_NOTICE =
  "この購入は育成を早めるためのものです。ランキングと実績バッジには影響しません（どちらもPRの活動でのみ進みます）。";

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

/** 相棒の強さに効く商品か（魂パック＝レベル、進化素材＝進化）。 */
function isGrowthItem(item: ShopItem): boolean {
  return item.category === "SOUL_PACK" || item.category === "EVOLUTION";
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
      // 育成系（魂パック・進化素材）と見た目系で言えることが違う。
      // この画面に並ぶルーン建て商品は現状すべて育成系だが、将来
      // 見た目系が混ざったときに嘘にならないよう、カテゴリで分ける。
      cosmeticNotice: isGrowthItem(item) ? GROWTH_NOTICE : COSMETIC_NOTICE,
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
