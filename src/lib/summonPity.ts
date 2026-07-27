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

export type PassPityUpsell = {
  currentHardPityPull: number;
  passHardPityPull: number;
  reducedBy: number;
  text: string;
};

/**
 * 未加入者に「パスなら天井が何回になるか」を提示するための表示値。
 *
 * 加入者には既に `selectEffectivePityDisclosure` で短い天井が適用されているが、
 * 未加入者にはこの差が一切見えていなかった（＝価値を知らないまま買えない）。
 * 天井の数字を見ている、まさにその地点に事実だけを置く。
 * 煽り・カウントダウン・欠乏の演出はしない（数値と行き先のみ）。
 *
 * @returns 提示するものが無ければ null（加入済み / API未提供 / 短縮にならない）
 */
export function buildPassPityUpsell(
  disclosure: Pick<
    SummonDisclosureResponse,
    "hardPityPull" | "adventurerPassHardPityPull"
  >,
  passEntitled: boolean,
): PassPityUpsell | null {
  if (passEntitled) return null;

  const passHardPityPull = disclosure.adventurerPassHardPityPull;
  if (passHardPityPull == null) return null;

  const currentHardPityPull = disclosure.hardPityPull;
  const reducedBy = currentHardPityPull - passHardPityPull;
  if (reducedBy <= 0) return null;

  return {
    currentHardPityPull,
    passHardPityPull,
    reducedBy,
    text: `アドベンチャラーパス加入中は天井 ${passHardPityPull.toLocaleString(
      "ja-JP",
    )} 回（${reducedBy.toLocaleString("ja-JP")}回少ない）`,
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
