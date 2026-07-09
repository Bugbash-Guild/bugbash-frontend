import type { SummonDisclosureResponse } from "@/types/summon";

export type DisclosureFact = {
  label: string;
  value: string;
};

export type DisclosureRow = {
  assetUrl?: string | null;
  itemId: string;
  probability: string;
  rarity: string;
  weight: string;
};

export function formatDisclosurePercent(probabilityPercent: number): string {
  return `${probabilityPercent}%`;
}

export function formatDisclosureCost(cost: number | null | undefined, currency: string): string {
  if (cost == null) return "なし";
  return `${cost.toLocaleString("ja-JP")} ${currency}`;
}

export function formatDisclosurePulls(pulls: number | null | undefined): string | null {
  if (pulls == null) return null;
  return `${pulls.toLocaleString("ja-JP")}回`;
}

export function buildDisclosureRows(disclosure: SummonDisclosureResponse): DisclosureRow[] {
  return disclosure.items.map((item) => ({
    assetUrl: item.assetUrl ?? null,
    itemId: item.itemId,
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
    { label: "保証", value: disclosure.guaranteeType },
    { label: "在庫方針", value: disclosure.stockPolicy },
  );

  return facts;
}
