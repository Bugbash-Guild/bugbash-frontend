export const PENDING_ORDER_STORAGE_KEY = "bb.pendingOrder";
export const PENDING_GRANT_EXPIRES_MS = 30 * 60 * 1000;

export type PendingOrder = {
  createdAt: number;
  orderId: string;
  runeBalanceBefore?: number;
  type: "rune" | "subscription";
};

type PendingOrderStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function isPendingOrder(value: unknown): value is PendingOrder {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PendingOrder>;
  return (
    typeof candidate.createdAt === "number" &&
    typeof candidate.orderId === "string" &&
    (candidate.type === "rune" || candidate.type === "subscription")
  );
}

export function writePendingOrder(
  storage: PendingOrderStorage,
  pendingOrder: PendingOrder,
): void {
  storage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(pendingOrder));
}

export function clearPendingOrder(storage: PendingOrderStorage): void {
  storage.removeItem(PENDING_ORDER_STORAGE_KEY);
}

export function readPendingOrder(
  storage: PendingOrderStorage,
  now: number = Date.now(),
): PendingOrder | null {
  const serialized = storage.getItem(PENDING_ORDER_STORAGE_KEY);
  if (!serialized) return null;

  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!isPendingOrder(parsed)) {
      clearPendingOrder(storage);
      return null;
    }

    if (now - parsed.createdAt > PENDING_GRANT_EXPIRES_MS) {
      clearPendingOrder(storage);
      return null;
    }

    return parsed;
  } catch {
    clearPendingOrder(storage);
    return null;
  }
}

export function detectRuneGrant(
  pendingOrder: PendingOrder,
  runeBalance: number,
): { grantedRunes: number } | null {
  if (pendingOrder.type !== "rune") return null;
  if (typeof pendingOrder.runeBalanceBefore !== "number") return null;
  if (runeBalance <= pendingOrder.runeBalanceBefore) return null;

  return { grantedRunes: runeBalance - pendingOrder.runeBalanceBefore };
}

export function buildPendingGrantMessage(input: {
  grantedRunes?: number;
  status: "detected" | "expired" | "pending";
  type: PendingOrder["type"];
}): string {
  if (input.status === "detected" && input.type === "rune") {
    return `+${input.grantedRunes ?? 0}ルーンが反映されました。`;
  }

  if (input.status === "expired") {
    return "反映に時間がかかっています。決済メールをご確認のうえ、必要なら再度お試しください。";
  }

  if (input.type === "subscription") {
    return "冒険者パスの反映待ちです。特典が有効になるまで少しお待ちください。";
  }

  return "ルーンの反映待ちです。残高に反映されるまで少しお待ちください。";
}
