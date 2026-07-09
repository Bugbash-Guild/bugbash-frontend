import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canSubmitRetirement,
  formatPurchaseDate,
  getPurchaseStatusPresentation,
} from "@/lib/billing/mypageBilling";

describe("mypage billing presentation", () => {
  it("maps purchase order states to user-facing labels without implying pending grants completed", () => {
    assert.deepEqual(getPurchaseStatusPresentation("PENDING"), {
      label: "反映待ち",
      tone: "pending",
    });
    assert.deepEqual(getPurchaseStatusPresentation("PAID"), {
      label: "支払い済み",
      tone: "success",
    });
    assert.deepEqual(getPurchaseStatusPresentation("REFUNDED"), {
      label: "返金済み",
      tone: "muted",
    });
    assert.deepEqual(getPurchaseStatusPresentation("FAILED"), {
      label: "決済失敗",
      tone: "danger",
    });
  });

  it("keeps unknown server states visible without inventing a successful state", () => {
    assert.deepEqual(getPurchaseStatusPresentation("REVIEWING"), {
      label: "REVIEWING",
      tone: "muted",
    });
  });

  it("formats valid timestamps and preserves a fallback for invalid values", () => {
    assert.match(formatPurchaseDate("2026-07-01T00:01:00Z"), /2026/);
    assert.equal(formatPurchaseDate("not-a-date"), "日時不明");
  });

  it("requires explicit loss consent and no in-flight request before retirement", () => {
    assert.equal(canSubmitRetirement(false, false), false);
    assert.equal(canSubmitRetirement(true, true), false);
    assert.equal(canSubmitRetirement(true, false), true);
  });
});
