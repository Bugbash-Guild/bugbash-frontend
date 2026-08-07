import type {
  PityCounterResponse,
  SummonDisclosureResponse,
} from "@/types/summon";

export type PityMeterTone = "hard" | "normal" | "soft";

export type PityMeterPresentation = {
  hardPityPull: number;
  label: string;
  progressPercent: number;
  remaining: number;
  softPityNote: string | null;
  softPityText: string | null;
  tone: PityMeterTone;
};

/**
 * API が返す通貨コード（GUILD_COIN / RUNE）はそのままユーザーに見せない。
 * 同じ通貨がトップバーでは 🪙、ここでは GUILD_COIN、報酬モーダルでは G と
 * 3通りに呼ばれていたため、表示名を1箇所に集約する。
 */
const CURRENCY_LABEL: Record<string, string> = {
  GUILD_COIN: "ギルドコイン",
  RUNE: "ルーン",
};

export function formatSummonCurrencyLabel(currency: string): string {
  return CURRENCY_LABEL[currency] ?? currency;
}

/**
 * 天井到達時に何が確定するかは、開示APIの guaranteeType だけが正。
 * かつては一律「SSR確定」と表示していたが、通常召喚の実際の保証は
 * SR以上（SR_OR_ABOVE）であり、画面が実装より強い約束をしていた。
 * FEに届いている値だけを翻訳し、未知の値は生値のまま見せる
 * （盛らない・隠さない）。
 */
const GUARANTEE_LABEL: Record<string, string> = {
  FEATURED_SSR: "目玉SSR確定",
  SR_OR_ABOVE: "SR以上確定",
};

export function formatSummonGuaranteeLabel(guaranteeType: string): string {
  return GUARANTEE_LABEL[guaranteeType] ?? guaranteeType;
}

export function formatSummonCurrencyCost(
  cost: number,
  currency: string,
): string {
  return `${cost.toLocaleString("ja-JP")} ${formatSummonCurrencyLabel(currency)}`;
}

export function selectEffectivePityDisclosure(
  disclosure: SummonDisclosureResponse,
  passEntitled: boolean,
): SummonDisclosureResponse {
  if (!passEntitled) return disclosure;
  /*
    天井は硬・軟の両方が短縮される。ハードだけ差し替えると、
    加入者に「ソフト60 / ハード70」という実際とは違う区間を見せてしまう。
    サーバが送っていない値は差し替えない（推測しない）。
  */
  const hardPityPull = disclosure.adventurerPassHardPityPull ?? disclosure.hardPityPull;
  const softPityPull = disclosure.adventurerPassSoftPityPull ?? disclosure.softPityPull;
  if (
    hardPityPull === disclosure.hardPityPull &&
    softPityPull === disclosure.softPityPull
  ) {
    return disclosure;
  }
  return { ...disclosure, hardPityPull, softPityPull };
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
  pity: Pick<PityCounterResponse, "isHardPity" | "isSoftPity" | "pullCount">,
  disclosure: Pick<
    SummonDisclosureResponse,
    "guaranteeType" | "hardPityPull" | "softPityPull"
  >,
): PityMeterPresentation {
  const hardPityPull = disclosure.hardPityPull;
  const remaining = Math.max(hardPityPull - pity.pullCount, 0);
  const progressPercent = Number(
    Math.min(100, (pity.pullCount / hardPityPull) * 100).toFixed(1),
  );
  const guaranteeLabel = formatSummonGuaranteeLabel(disclosure.guaranteeType);

  return {
    hardPityPull,
    label:
      pity.isHardPity || remaining === 0
        ? `次回${guaranteeLabel}（天井 ${hardPityPull.toLocaleString("ja-JP")}）`
        : `あと${remaining.toLocaleString("ja-JP")}回で${guaranteeLabel}（天井 ${hardPityPull.toLocaleString(
            "ja-JP",
          )}）`,
    progressPercent,
    remaining,
    /*
      ソフト天井は「その回数目からSR以上の重みが上がる」仕組みだが、
      チップの「ソフト天井 60」だけでは 60 が何なのか伝わらない。
      閾値は開示APIの値をそのまま使う（FEへの定数転記はしない）。
      値が来ないプール（限定など）は仕組み自体が無いので、何も説明しない。
    */
    softPityNote: disclosure.softPityPull
      ? `${disclosure.softPityPull.toLocaleString(
          "ja-JP",
        )}回目からSR以上が出やすくなります`
      : null,
    softPityText: disclosure.softPityPull
      ? `ソフト天井 ${disclosure.softPityPull.toLocaleString("ja-JP")}`
      : null,
    tone: pity.isHardPity ? "hard" : pity.isSoftPity ? "soft" : "normal",
  };
}

/**
 * 召喚結果モーダルに添える天井カウンタの一行。
 * 従来の「pity: 45 pulls」は生カウンタで、天井まで何回かは
 * ユーザーが引き算するしかなかった。残数で言い切る。
 * 残数と保証文言は buildPityMeterPresentation を再利用して、
 * メーター表示と食い違わないようにする。
 */
export function buildSummonResultPityText(
  newPullCount: number,
  disclosure: Pick<
    SummonDisclosureResponse,
    "guaranteeType" | "hardPityPull" | "softPityPull"
  > | null,
): string {
  if (disclosure == null) {
    // 天井値が届いていなければ残数は計算できない。事実（回数）だけを出す
    return `天井カウンタ ${newPullCount.toLocaleString("ja-JP")} 回`;
  }
  const presentation = buildPityMeterPresentation(
    // 召喚結果レスポンスは isHardPity を持たないため false 固定で渡し、
    // 残数 0 のときだけ「次回◯◯確定」へ倒す（サーバ判定の isHardPity は
    // メーター側が pity API から受け取って扱う）
    { isHardPity: false, pullCount: newPullCount },
    disclosure,
  );
  if (presentation.remaining === 0) return presentation.label;
  return `天井まであと${presentation.remaining.toLocaleString("ja-JP")}回`;
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
