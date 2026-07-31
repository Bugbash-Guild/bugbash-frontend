"use client";

import { useEffect } from "react";

import {
  createFunnelTracker,
  normalizeProperties,
  type FunnelEventName,
  type FunnelEventPayload,
} from "@/lib/analytics";

const ENDPOINT = "/api/analytics/events";

/**
 * ページを離れる瞬間でも届くように sendBeacon を優先する。
 * 使えない環境では keepalive つきの fetch に落とす。
 * どちらも**失敗を無視する** — 計測のためにアプリを止めない。
 */
function send(payload: { events: FunnelEventPayload[] }): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  void fetch(ENDPOINT, {
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => {
    // 握りつぶす。欠測は許容するが、計測起因の例外は許容しない。
    return undefined;
  });
}

/**
 * セッションを跨いで1つ。モジュールスコープに置くことで、
 * 「同じ画面を何度もマウントしたら何度も送る」を防ぐ。
 */
const tracker = createFunnelTracker({ send });

export function trackFunnelEvent(
  name: FunnelEventName,
  properties: Record<string, string | number | boolean | null | undefined> = {},
): void {
  tracker.track(name, normalizeProperties(properties));
  // 行動系はその場で送る。離脱直前の1件を落とさないため。
  tracker.flush();
}

/**
 * 画面の表示を1セッション1回だけ記録する。
 * 再レンダーやタブの往復で水増しすると、到達率の分母が壊れる。
 */
export function useTrackScreenView(
  name: FunnelEventName,
  properties: Record<string, string | number | boolean | null | undefined> = {},
): void {
  // properties は初回にだけ使う。依存に入れるとオブジェクト同一性で無限に再実行される。
  const serialized = JSON.stringify(normalizeProperties(properties));

  useEffect(() => {
    tracker.trackOnce(name, JSON.parse(serialized) as Record<string, string>);
    tracker.flush();
  }, [name, serialized]);
}
