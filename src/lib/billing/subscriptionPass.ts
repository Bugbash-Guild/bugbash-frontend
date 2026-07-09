import type {
  AgeGroup,
  CreateSubscriptionCheckoutRequest,
  SubscriptionStatus,
} from "@/types/billing";

export const ADVENTURER_PASS_PLAN = "ADVENTURER_PASS";
export const ADVENTURER_PASS_PRICE_JPY = 780;
export const SUBSCRIPTION_CHECKOUT_IDEMPOTENCY_KEY =
  "bb.checkout.subscription.ADVENTURER_PASS";

export const ADVENTURER_PASS_BENEFITS = [
  "月150ルーン付与",
  "PRマージ時の相棒魂×2",
  "通常召喚 天井80→70",
  "限定召喚 天井60→50",
] as const;

type SubscriptionCheckoutStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type PassStatusPresentation = {
  benefits: string[];
  cancelButtonVisible: boolean;
  periodEndText: string | null;
  statusLabel: string;
  statusTone: "active" | "inactive" | "scheduled";
};

export type PassCheckoutEligibility = {
  allowed: boolean;
  reason: string | null;
};

export type SubscriptionCheckoutErrorAction = "ageGate" | "login" | "none";

export type SubscriptionCheckoutErrorPresentation = {
  action: SubscriptionCheckoutErrorAction;
  message: string;
};

export function formatPassPrice(): string {
  return `¥${ADVENTURER_PASS_PRICE_JPY.toLocaleString("ja-JP")}/月（税込）`;
}

export function subscriptionCheckoutIdempotencyStorageKey(): string {
  return SUBSCRIPTION_CHECKOUT_IDEMPOTENCY_KEY;
}

export function readSubscriptionCheckoutIdempotencyKey(
  storage: SubscriptionCheckoutStorage,
): string | null {
  return storage.getItem(subscriptionCheckoutIdempotencyStorageKey());
}

export function getOrCreateSubscriptionCheckoutIdempotencyKey(
  storage: SubscriptionCheckoutStorage,
  createId: () => string,
): string {
  const existing = readSubscriptionCheckoutIdempotencyKey(storage);
  if (existing) return existing;

  const created = createId();
  storage.setItem(subscriptionCheckoutIdempotencyStorageKey(), created);
  return created;
}

export function clearSubscriptionCheckoutIdempotencyKey(
  storage: SubscriptionCheckoutStorage,
): void {
  storage.removeItem(subscriptionCheckoutIdempotencyStorageKey());
}

export function buildSubscriptionCheckoutRequest(
  idempotencyKey: string,
): CreateSubscriptionCheckoutRequest {
  return {
    idempotencyKey,
    plan: ADVENTURER_PASS_PLAN,
  };
}

export function getPassCheckoutEligibility(ageGroup: AgeGroup | null): PassCheckoutEligibility {
  if (ageGroup === "ADULT") {
    return {
      allowed: true,
      reason: null,
    };
  }

  if (ageGroup === null) {
    return {
      allowed: false,
      reason: "冒険者パスの加入には年齢確認が必要です。",
    };
  }

  return {
    allowed: false,
    reason: "冒険者パスは18歳以上の方のみご加入いただけます。",
  };
}

function formatPeriodEnd(currentPeriodEnd: string | null): string | null {
  if (!currentPeriodEnd) return null;

  const date = new Date(currentPeriodEnd);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.toLocaleDateString("ja-JP", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}まで`;
}

export function toPassStatusPresentation(
  subscription: SubscriptionStatus,
): PassStatusPresentation {
  const periodEnd = formatPeriodEnd(subscription.currentPeriodEnd);
  const benefits = [...ADVENTURER_PASS_BENEFITS];

  if (!subscription.entitled) {
    return {
      benefits,
      cancelButtonVisible: false,
      periodEndText: null,
      statusLabel: "未加入",
      statusTone: "inactive",
    };
  }

  if (subscription.cancelScheduled) {
    return {
      benefits,
      cancelButtonVisible: false,
      periodEndText: periodEnd
        ? `${periodEnd}特典は有効です。それ以降更新されません。`
        : "期間末まで特典は有効です。それ以降更新されません。",
      statusLabel: "解約予定",
      statusTone: "scheduled",
    };
  }

  return {
    benefits,
    cancelButtonVisible: true,
    periodEndText: periodEnd ? `${periodEnd}有効` : null,
    statusLabel: "加入中",
    statusTone: "active",
  };
}

export function mapSubscriptionCheckoutError(
  status: number,
  errorMessage: string,
): SubscriptionCheckoutErrorPresentation {
  if (status === 401) {
    return {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    };
  }

  const normalized = errorMessage.toLowerCase();
  if (
    normalized.includes("age") ||
    normalized.includes("minor") ||
    errorMessage.includes("年齢") ||
    errorMessage.includes("未成年")
  ) {
    return {
      action: "ageGate",
      message: "冒険者パスは18歳以上の方のみご加入いただけます。",
    };
  }

  return {
    action: "none",
    message: "一時的なエラーが発生しました。時間をおいて再度お試しください。",
  };
}
