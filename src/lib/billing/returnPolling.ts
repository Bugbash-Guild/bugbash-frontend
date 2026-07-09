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
    return "反映に時間がかかっています。付与され次第、残高に反映されます。";
  }

  return "決済を受け付けました。ルーンの反映には少し時間がかかります。";
}
