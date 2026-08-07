import { getSummonItemDisplay } from "@/lib/summonDisplay";
import {
  formatSummonCurrencyCost,
  formatSummonGuaranteeLabel,
} from "@/lib/summonPity";
import type { SummonDisclosureResponse } from "@/types/summon";

export type DisclosureFact = {
  label: string;
  value: string;
};

export type DisclosureRow = {
  assetUrl?: string | null;
  itemId: string;
  name: string;
  probability: string;
  rarity: string;
  weight: string;
};

/*
  在庫方針の enum も生で出さない。文言は限定バナーの
  buildLimitedStockPolicyCopy（lib/limitedSummon.ts）と同じ意味に揃える。
  未知の値は生値をフォールバック表示する（隠さない）。
*/
const STOCK_POLICY_LABEL: Record<string, string> = {
  SEASONAL_RERUN: "シーズン復刻予定",
  UNLIMITED: "在庫制限なし",
};

export function formatDisclosureStockPolicyLabel(stockPolicy: string): string {
  return STOCK_POLICY_LABEL[stockPolicy] ?? stockPolicy;
}

/**
 * APIの確率は weight から計算された浮動小数で、そのまま連結すると
 * 「47.150000000000006%」のような尾が表示に出うる。表示は小数2桁に
 * 固定する（丸めるのは表示だけで、値の付け替えはしない）。
 */
export function formatDisclosurePercent(probabilityPercent: number): string {
  return `${probabilityPercent.toFixed(2)}%`;
}

export function formatDisclosureCost(cost: number | null | undefined, currency: string): string {
  if (cost == null) return "なし";
  // 通貨コード（GUILD_COIN 等）を生で出さない。表示名は summonPity の辞書に集約済み
  return formatSummonCurrencyCost(cost, currency);
}

export function formatDisclosurePulls(pulls: number | null | undefined): string | null {
  if (pulls == null) return null;
  return `${pulls.toLocaleString("ja-JP")}回`;
}

export function buildDisclosureRows(disclosure: SummonDisclosureResponse): DisclosureRow[] {
  return disclosure.items.map((item) => ({
    assetUrl: item.assetUrl ?? null,
    itemId: item.itemId,
    // 生ID（soul-pack-s / monster:xxx 等）を一覧の主表示にしない。
    // 結果画面・履歴と同じ表示名辞書を通し、未知のIDは生値のまま見せる
    name: getSummonItemDisplay(item.itemId, item.assetUrl).name,
    probability: formatDisclosurePercent(item.probabilityPercent),
    rarity: item.rarity,
    weight: item.weight.toLocaleString("ja-JP"),
  }));
}

export function buildDisclosureFacts(disclosure: SummonDisclosureResponse): DisclosureFact[] {
  const facts: DisclosureFact[] = [
    { label: "1回", value: formatDisclosureCost(disclosure.singlePullCost, disclosure.currency) },
    { label: "10連", value: formatDisclosureCost(disclosure.tenPullCost, disclosure.currency) },
    { label: "天井", value: `${disclosure.hardPityPull.toLocaleString("ja-JP")}回` },
  ];

  const passHardPity = formatDisclosurePulls(disclosure.adventurerPassHardPityPull);
  if (passHardPity) {
    facts.push({ label: "パス天井", value: passHardPity });
  }

  const softPity = formatDisclosurePulls(disclosure.softPityPull);
  if (softPity) {
    facts.push({ label: "ソフト天井", value: softPity });
  }

  facts.push(
    // 保証内容は天井メーターの表示（summonPity の辞書）と同じ文言にする。
    // ここが生enumだと「SR_OR_ABOVE って何？」が開示モーダルで放置される
    { label: "保証", value: formatSummonGuaranteeLabel(disclosure.guaranteeType) },
    { label: "在庫方針", value: formatDisclosureStockPolicyLabel(disclosure.stockPolicy) },
  );

  return facts;
}
