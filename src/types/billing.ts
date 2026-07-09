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
