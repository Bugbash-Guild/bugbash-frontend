export type PurchaseStatusTone = "danger" | "muted" | "pending" | "success";

export type PurchaseStatusPresentation = {
  label: string;
  tone: PurchaseStatusTone;
};

const PURCHASE_STATUS: Record<string, PurchaseStatusPresentation> = {
  CANCELED: { label: "キャンセル済み", tone: "muted" },
  FAILED: { label: "決済失敗", tone: "danger" },
  PAID: { label: "支払い済み", tone: "success" },
  PENDING: { label: "反映待ち", tone: "pending" },
  REFUNDED: { label: "返金済み", tone: "muted" },
};

export function getPurchaseStatusPresentation(
  status: string,
): PurchaseStatusPresentation {
  return PURCHASE_STATUS[status] ?? { label: status, tone: "muted" };
}

export function formatPurchaseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function canSubmitRetirement(
  lossConsentChecked: boolean,
  retireInFlight: boolean,
): boolean {
  return lossConsentChecked && !retireInFlight;
}
