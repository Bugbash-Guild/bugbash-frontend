export const RETURN_POLL_TIMEOUT_MS = 90_000;

const RETURN_POLL_DELAYS_MS = [2_000, 3_000, 5_000, 8_000, 10_000];

export type BillingReturnStatus = "confirmed" | "direct" | "pending" | "timeout";

export function getReturnPollDelayMs(attempt: number): number {
  return RETURN_POLL_DELAYS_MS[Math.min(attempt, RETURN_POLL_DELAYS_MS.length - 1)];
}

export function shouldStopReturnPolling(startedAt: number, now: number): boolean {
  return now - startedAt >= RETURN_POLL_TIMEOUT_MS;
}

export function buildBillingReturnMessage(
  status: BillingReturnStatus,
  grantedRunes?: number,
): string {
  if (status === "direct") {
    return "決済画面から戻った後は、この画面で反映状況を確認できます。";
  }

  if (status === "confirmed") {
    return `+${grantedRunes ?? 0}ルーンが残高に反映されました。`;
  }

  if (status === "timeout") {
    // タイムアウト時点では「決済が成立したかどうか」自体が分からない
    // （PSP 画面で離脱したケースを含む）。無条件に「付与されます」と
    // 約束すると、成立していなかったときに待たせ続ける嘘になる。
    return (
      "この画面ではまだ反映を確認できていません。決済が完了していれば数分以内に付与されます。" +
      "完了していない場合は付与されません。購入履歴で確認するか、もう一度購入してください。"
    );
  }

  return "決済を受け付けました。ルーンの反映には少し時間がかかります。";
}
