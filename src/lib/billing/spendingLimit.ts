/**
 * 月次課金上限の自己設定（マネタイズ設計v3 §5-F）。
 *
 * 成人: 既定¥50,000を本人が変更・撤廃できる。引き上げ・撤廃は24時間後に
 * 反映（衝動ではなく意思で上げる形）、引き下げは即時。
 * 未成年: 年齢区分の上限が常に天井（引き下げのみ可能）。
 * 数値・時刻は全てBEの応答をそのまま使う — FEに上限額の定数を持たない。
 */

export type SpendingLimitView = {
  ageGroup: string;
  defaultCapJpy: number;
  /** いま適用されている上限。null = 無制限 */
  effectiveCapJpy: number | null;
  isCustom: boolean;
  /** 反映待ちの変更後上限（null = 無制限へ変更）。pendingEffectiveAt が無ければ保留なし */
  pendingCapJpy: number | null;
  pendingEffectiveAt: string | null;
  raiseDelayHours: number;
};

function asNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

export function parseSpendingLimitResponse(data: unknown): SpendingLimitView | null {
  if (typeof data !== "object" || data == null) return null;
  const record = data as Record<string, unknown>;
  const defaultCapJpy = asNonNegativeInt(record.defaultCapJpy);
  const raiseDelayHours = asNonNegativeInt(record.raiseDelayHours);
  if (defaultCapJpy == null || raiseDelayHours == null || typeof record.ageGroup !== "string") {
    return null;
  }
  return {
    ageGroup: record.ageGroup,
    defaultCapJpy,
    effectiveCapJpy: asNonNegativeInt(record.effectiveCapJpy),
    isCustom: record.isCustom === true,
    pendingCapJpy: asNonNegativeInt(record.pendingCapJpy),
    pendingEffectiveAt:
      typeof record.pendingEffectiveAt === "string" ? record.pendingEffectiveAt : null,
    raiseDelayHours,
  };
}

/** 「¥50,000」/「無制限」。金額の言い方はここで統一する。 */
export function formatCapJpy(capJpy: number | null): string {
  return capJpy == null ? "無制限" : `¥${capJpy.toLocaleString("ja-JP")}`;
}

export type SpendingLimitPresentation = {
  /** 例: 「¥50,000（既定） / 月」「無制限（自己設定）」 */
  currentText: string;
  /** 反映待ちの説明。無ければ null */
  pendingText: string | null;
  /** ルールの説明（遅延時間はBEの値から組む） */
  ruleText: string;
  /** 無制限を選べるか（成人のみ） */
  canRemoveCap: boolean;
};

export function buildSpendingLimitPresentation(view: SpendingLimitView): SpendingLimitPresentation {
  const source = view.isCustom ? "自己設定" : "既定";
  const pendingText =
    view.pendingEffectiveAt != null
      ? `${formatCapJpy(view.pendingCapJpy)} へ変更 — ${formatJst(view.pendingEffectiveAt)}に反映されます`
      : null;
  return {
    canRemoveCap: view.ageGroup === "ADULT",
    currentText: `${formatCapJpy(view.effectiveCapJpy)}（${source}） / 月`,
    pendingText,
    ruleText:
      view.ageGroup === "ADULT"
        ? `引き上げ・撤廃は${view.raiseDelayHours}時間後に反映されます。引き下げは即時です。`
        : `年齢区分の上限（${formatCapJpy(view.defaultCapJpy)}）より下にのみ設定できます。引き下げは即時、引き上げは${view.raiseDelayHours}時間後に反映されます。`,
  };
}

/** ISO時刻 → 「2026/08/10 15:00（日本時間）」。不正な時刻は原文のまま出す。 */
export function formatJst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
  return `${formatted}（日本時間）`;
}

export function mapSpendingLimitUpdateError(status: number, serverMessage: string): string {
  if (status === 401) return "セッションが切れました。再度ログインしてください。";
  if (serverMessage.includes("年齢確認")) return "先に年齢区分の申告が必要です。";
  if (serverMessage.includes("年齢区分の上限")) return serverMessage;
  if (serverMessage.includes("以上で設定")) return serverMessage;
  return "上限を変更できませんでした。時間をおいて再度お試しください。";
}
