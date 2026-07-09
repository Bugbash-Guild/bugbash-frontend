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

export type CreateSubscriptionCheckoutRequest = {
  plan: "ADVENTURER_PASS";
  idempotencyKey: string;
};

export type CreateSubscriptionCheckoutResponse = {
  subscriptionId: string;
  checkoutUrl: string;
};
