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

// グループ自体も保存する。/pass は「ADULT かどうか」で表示を分けるため、
// 申告済みフラグだけでは毎回モーダルを出し直すしかなかった（画面ごとの
// 挙動不一致）。これは表示用の記憶であり、加入可否の強制は常にサーバ側
// （CreateSubscriptionCheckoutUseCase の ADULT ゲート）が行う。
export const AGE_VERIFICATION_GROUP_STORAGE_KEY = "bb.ageVerifiedGroup";

const AGE_GROUP_VALUES: readonly AgeGroup[] = ["ADULT", "AGE_16_17", "UNDER_16"];

export function readAgeVerified(storage: AgeVerificationStorage): boolean {
  return storage.getItem(AGE_VERIFICATION_STORAGE_KEY) === "true";
}

export function readVerifiedAgeGroup(storage: AgeVerificationStorage): AgeGroup | null {
  if (!readAgeVerified(storage)) return null;
  const raw = storage.getItem(AGE_VERIFICATION_GROUP_STORAGE_KEY);
  return AGE_GROUP_VALUES.includes(raw as AgeGroup) ? (raw as AgeGroup) : null;
}

export function markAgeVerified(storage: AgeVerificationStorage, ageGroup?: AgeGroup): void {
  storage.setItem(AGE_VERIFICATION_STORAGE_KEY, "true");
  if (ageGroup) storage.setItem(AGE_VERIFICATION_GROUP_STORAGE_KEY, ageGroup);
}

export function clearAgeVerification(storage: AgeVerificationStorage): void {
  storage.removeItem(AGE_VERIFICATION_STORAGE_KEY);
  storage.removeItem(AGE_VERIFICATION_GROUP_STORAGE_KEY);
}

export function buildAgeVerificationRequest(ageGroup: AgeGroup): AgeVerificationRequest {
  return { ageGroup };
}

export function formatMonthlyLimitJpy(monthlyLimitJpy: number): string {
  return `¥${monthlyLimitJpy.toLocaleString("ja-JP")}`;
}
