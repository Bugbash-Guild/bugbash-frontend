import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AGE_GROUP_OPTIONS,
  AGE_VERIFICATION_GROUP_STORAGE_KEY,
  AGE_VERIFICATION_STORAGE_KEY,
  buildAgeVerificationRequest,
  clearAgeVerification,
  formatMonthlyLimitJpy,
  markAgeVerified,
  readAgeVerified,
  readVerifiedAgeGroup,
} from "./ageVerification";

class MemoryStorage implements Pick<Storage, "getItem" | "removeItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("age verification helpers", () => {
  it("defines the self-declaration age groups accepted by the backend", () => {
    assert.deepEqual(
      AGE_GROUP_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      [
        { label: "18歳以上", value: "ADULT" },
        { label: "16〜17歳", value: "AGE_16_17" },
        { label: "16歳未満", value: "UNDER_16" },
      ],
    );
  });

  it("stores only the local confirmation flag expected by the UX design", () => {
    const storage = new MemoryStorage();

    assert.equal(AGE_VERIFICATION_STORAGE_KEY, "bb.ageVerified");
    assert.equal(readAgeVerified(storage), false);

    markAgeVerified(storage);
    assert.equal(readAgeVerified(storage), true);

    clearAgeVerification(storage);
    assert.equal(readAgeVerified(storage), false);
  });

  it("remembers the declared age group for display gating across pages", () => {
    const storage = new MemoryStorage();

    assert.equal(AGE_VERIFICATION_GROUP_STORAGE_KEY, "bb.ageVerifiedGroup");
    assert.equal(readVerifiedAgeGroup(storage), null);

    markAgeVerified(storage, "AGE_16_17");
    assert.equal(readVerifiedAgeGroup(storage), "AGE_16_17");

    // クリアで両方消える（フラグだけ残って群が消える、の逆も作らない）
    clearAgeVerification(storage);
    assert.equal(readAgeVerified(storage), false);
    assert.equal(readVerifiedAgeGroup(storage), null);
  });

  it("ignores tampered or legacy group values instead of trusting them", () => {
    const storage = new MemoryStorage();

    // 旧バージョンで保存された「フラグのみ」の状態 → 群は不明として扱う
    markAgeVerified(storage);
    assert.equal(readVerifiedAgeGroup(storage), null);

    // 手で書き換えられた不正値は無視する（表示用とはいえ変な状態を作らない）
    storage.setItem(AGE_VERIFICATION_GROUP_STORAGE_KEY, "SUPER_ADULT");
    assert.equal(readVerifiedAgeGroup(storage), null);
  });

  it("builds the backend request without extra personal data", () => {
    assert.deepEqual(buildAgeVerificationRequest("AGE_16_17"), {
      ageGroup: "AGE_16_17",
    });
  });

  it("formats the monthly limit returned by the server", () => {
    assert.equal(formatMonthlyLimitJpy(5000), "¥5,000");
    assert.equal(formatMonthlyLimitJpy(20000), "¥20,000");
    assert.equal(formatMonthlyLimitJpy(50000), "¥50,000");
  });
});
