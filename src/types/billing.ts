export type BillingWallet = {
  guildCoinBalance: number;
  runeBalance: number;
  paidRuneBalance: number;
  freeRuneBalance: number;
};

export type AgeGroup = "ADULT" | "AGE_16_17" | "UNDER_16";

export type AgeVerificationRequest = {
  ageGroup: AgeGroup;
};

export type AgeVerificationResponse = {
  ageGroup: AgeGroup;
  monthlyLimitJpy: number;
};

export type RuneProduct = {
  id: string;
  sku: string;
  priceJpyTaxIncluded: number;
  runeAmount: number;
  bonusRune: number;
  totalRune: number;
  firstPurchaseOnly: boolean;
};

export type CreateCheckoutRequest = {
  runeProductId: string;
  idempotencyKey: string;
};

export type CreateCheckoutResponse = {
  orderId: string;
  checkoutUrl: string;
};

export type SubscriptionStatus = {
  plan: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelScheduled: boolean;
  entitled: boolean;
};

/**
 * パスの価格と特典。値はすべてサーバの定義（GET /api/billing/subscription/plan）。
 * ここに書かれた数値をフロントで補完してはいけない。実際の請求額と違う
 * 金額を見せることになる。
 */
export type SubscriptionPlanInfo = {
  limitedHardPityPull: number;
  limitedPassHardPityPull: number;
  monthlyRuneGrant: number;
  normalHardPityThreshold: number;
  normalPassHardPityThreshold: number;
  normalPassSoftPityThreshold: number;
  normalSoftPityThreshold: number;
  partnerSoulMultiplier: number;
  plan: string;
  priceJpyTaxIncluded: number;
};

export type CreateSubscriptionCheckoutRequest = {
  plan: "ADVENTURER_PASS";
  idempotencyKey: string;
};

export type CreateSubscriptionCheckoutResponse = {
  subscriptionId: string;
  checkoutUrl: string;
};

export type PurchaseOrderHistory = {
  orderId: string;
  runeProductId: string;
  amountJpyTaxIncluded: number;
  runeAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
};
