import type {
  AgeGroup,
  CreateSubscriptionCheckoutRequest,
  SubscriptionPlanInfo,
  SubscriptionStatus,
} from "@/types/billing";

export const ADVENTURER_PASS_PLAN = "ADVENTURER_PASS";
export const SUBSCRIPTION_CHECKOUT_IDEMPOTENCY_KEY =
  "bb.checkout.subscription.ADVENTURER_PASS";

type SubscriptionCheckoutStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type PassStatusPresentation = {
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

/**
 * 価格の表示。サーバから届いていなければ null を返す。
 *
 * 以前は 780 円を直書きしていたため、サーバ側の価格を変えても
 * 表示は変わらず、**実際の請求額と違う金額を見せたまま課金させる**
 * 状態を作れてしまった。既定値へ落とさないのはそのため。
 */
export function formatPassPrice(plan: SubscriptionPlanInfo | null): string | null {
  if (plan == null) return null;
  return `¥${plan.priceJpyTaxIncluded.toLocaleString("ja-JP")}/月（税込）`;
}

/**
 * 特典の表示。数値はすべてサーバの値で、文言の形だけここにある。
 * 天井はパス有無の両方をサーバから受け取るので、差分をここで計算しない。
 */
export function buildPassBenefits(plan: SubscriptionPlanInfo | null): string[] {
  if (plan == null) return [];
  return [
    `月${plan.monthlyRuneGrant.toLocaleString("ja-JP")}ルーン付与`,
    `PRマージ時の相棒魂×${plan.partnerSoulMultiplier}`,
    `通常召喚 天井${plan.normalHardPityThreshold}→${plan.normalPassHardPityThreshold}`,
    `通常召喚 確率上昇の開始${plan.normalSoftPityThreshold}→${plan.normalPassSoftPityThreshold}`,
    `限定召喚 天井${plan.limitedHardPityPull}→${plan.limitedPassHardPityPull}`,
  ];
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

  if (!subscription.entitled) {
    return {
      cancelButtonVisible: false,
      periodEndText: null,
      statusLabel: "未加入",
      statusTone: "inactive",
    };
  }

  if (subscription.cancelScheduled) {
    return {
      cancelButtonVisible: false,
      periodEndText: periodEnd
        ? `${periodEnd}特典は有効です。それ以降更新されません。`
        : "期間末まで特典は有効です。それ以降更新されません。",
      statusLabel: "解約予定",
      statusTone: "scheduled",
    };
  }

  return {
    cancelButtonVisible: true,
    periodEndText: periodEnd ? `${periodEnd}有効` : null,
    statusLabel: "加入中",
    statusTone: "active",
  };
}

/*
 * 「更新を再開する」（resume）用のエラーマッパーは意図的に存在しない。
 * 解約時に BE が KOMOJU 側サブスクリプションを削除するため（
 * CancelSubscriptionUseCase → KomojuPaymentGateway）、フラグを戻すだけの
 * resume API は「更新されます」と表示しながら課金・更新が走らない嘘になる。
 * 再開は期間終了後の再加入（チェックアウト）に一本化している。
 */

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
