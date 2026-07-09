import type { AgeGroup, AgeVerificationRequest } from "@/types/billing";

export const AGE_VERIFICATION_STORAGE_KEY = "bb.ageVerified";

export type AgeGroupOption = {
  description: string;
  label: string;
  value: AgeGroup;
};

export const AGE_GROUP_OPTIONS: AgeGroupOption[] = [
  {
    description: "冒険者パスを含むすべての課金機能を利用できます。",
    label: "18歳以上",
    value: "ADULT",
  },
  {
    description: "30日間の購入上限が適用されます。",
    label: "16〜17歳",
    value: "AGE_16_17",
  },
  {
    description: "30日間の購入上限が適用されます。",
    label: "16歳未満",
    value: "UNDER_16",
  },
];

type AgeVerificationStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function readAgeVerified(storage: AgeVerificationStorage): boolean {
  return storage.getItem(AGE_VERIFICATION_STORAGE_KEY) === "true";
}

export function markAgeVerified(storage: AgeVerificationStorage): void {
  storage.setItem(AGE_VERIFICATION_STORAGE_KEY, "true");
}

export function clearAgeVerification(storage: AgeVerificationStorage): void {
  storage.removeItem(AGE_VERIFICATION_STORAGE_KEY);
}

export function buildAgeVerificationRequest(ageGroup: AgeGroup): AgeVerificationRequest {
  return { ageGroup };
}

export function formatMonthlyLimitJpy(monthlyLimitJpy: number): string {
  return `¥${monthlyLimitJpy.toLocaleString("ja-JP")}`;
}
