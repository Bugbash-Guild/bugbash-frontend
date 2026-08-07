import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RETURN_POLL_TIMEOUT_MS,
  buildBillingReturnMessage,
  getReturnPollDelayMs,
  shouldStopReturnPolling,
} from "./returnPolling";

describe("billing return polling helpers", () => {
  it("backs off from two seconds and caps checks at ten seconds", () => {
    assert.deepEqual(
      [0, 1, 2, 3, 4, 5].map((attempt) => getReturnPollDelayMs(attempt)),
      [2_000, 3_000, 5_000, 8_000, 10_000, 10_000],
    );
  });

  it("stops the return page polling after ninety seconds", () => {
    assert.equal(RETURN_POLL_TIMEOUT_MS, 90_000);
    assert.equal(shouldStopReturnPolling(1_000, 90_999), false);
    assert.equal(shouldStopReturnPolling(1_000, 91_000), true);
  });

  it("keeps return copy away from optimistic grant wording", () => {
    const prohibitedOptimisticCopy = ["付与", "済み"].join("");

    for (const status of ["direct", "pending", "confirmed", "timeout"] as const) {
      assert.equal(buildBillingReturnMessage(status, 30).includes(prohibitedOptimisticCopy), false);
    }

    assert.equal(
      buildBillingReturnMessage("pending"),
      "決済を受け付けました。ルーンの反映には少し時間がかかります。",
    );
    assert.equal(buildBillingReturnMessage("confirmed", 30), "+30ルーンが残高に反映されました。");
    assert.equal(
      buildBillingReturnMessage("timeout"),
      "この画面ではまだ反映を確認できていません。決済が完了していれば数分以内に付与されます。" +
        "完了していない場合は付与されません。購入履歴で確認するか、もう一度購入してください。",
    );
  });

  it("timeout copy admits the payment may not have completed", () => {
    // タイムアウトは「決済が成立したか不明」な状態。成立していない可能性に
    // 触れず付与だけを約束する文言（旧: 付与され次第〜）への回帰を防ぐ。
    const message = buildBillingReturnMessage("timeout");

    assert.equal(message.includes("完了していない場合は付与されません"), true);
    assert.equal(message.includes("もう一度購入"), true);
    assert.equal(message.includes("付与され次第"), false);
  });
});
