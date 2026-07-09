import type {
  PityCounterResponse,
  SummonDisclosureResponse,
} from "@/types/summon";

export type PityMeterTone = "hard" | "normal" | "soft";

export type PityMeterPresentation = {
  hardPityPull: number;
  label: string;
  progressPercent: number;
  softPityText: string | null;
  tone: PityMeterTone;
};

export function formatSummonCurrencyCost(
  cost: number,
  currency: string,
): string {
  return `${cost.toLocaleString("ja-JP")} ${currency}`;
}

export function selectEffectivePityDisclosure(
  disclosure: SummonDisclosureResponse,
  passEntitled: boolean,
): SummonDisclosureResponse {
  if (!passEntitled || disclosure.adventurerPassHardPityPull == null)
    return disclosure;
  return {
    ...disclosure,
    hardPityPull: disclosure.adventurerPassHardPityPull,
  };
}

export function buildPityMeterPresentation(
  pity: PityCounterResponse,
  disclosure: Pick<SummonDisclosureResponse, "hardPityPull" | "softPityPull">,
): PityMeterPresentation {
  const hardPityPull = disclosure.hardPityPull;
  const remaining = Math.max(hardPityPull - pity.pullCount, 0);
  const progressPercent = Number(
    Math.min(100, (pity.pullCount / hardPityPull) * 100).toFixed(1),
  );

  return {
    hardPityPull,
    label:
      pity.isHardPity || remaining === 0
        ? `次回SSR確定（天井 ${hardPityPull.toLocaleString("ja-JP")}）`
        : `あと${remaining.toLocaleString("ja-JP")}回でSSR確定（天井 ${hardPityPull.toLocaleString(
            "ja-JP",
          )}）`,
    progressPercent,
    softPityText: disclosure.softPityPull
      ? `ソフト天井 ${disclosure.softPityPull.toLocaleString("ja-JP")}`
      : null,
    tone: pity.isHardPity ? "hard" : pity.isSoftPity ? "soft" : "normal",
  };
}

export function mapSummonPullErrorMessage(
  status: number,
  errorMessage: string,
): string {
  if (status === 401) {
    return "セッションが切れました。再度ログインしてください。";
  }

  const normalized = errorMessage.toLowerCase();
  if (
    normalized.includes("coin") ||
    normalized.includes("balance") ||
    normalized.includes("insufficient") ||
    errorMessage.includes("コイン") ||
    errorMessage.includes("残高")
  ) {
    return "ギルドコインが足りません。PRをマージして集めましょう。";
  }

  return "召喚結果を確認できませんでした。履歴を確認してから再度お試しください。";
}
