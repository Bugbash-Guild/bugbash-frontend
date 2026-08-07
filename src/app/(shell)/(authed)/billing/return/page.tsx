"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { trackFunnelEvent } from "@/hooks/useFunnelTracking";
import { useAuth } from "@/hooks/useAuth";
import { useRuneProducts } from "@/hooks/useRuneProducts";
import { buildLimitedSummonEquivalentText } from "@/lib/billing/runeConversion";
import {
  buildBillingReturnMessage,
  getReturnPollDelayMs,
  shouldStopReturnPolling,
  type BillingReturnStatus,
} from "@/lib/billing/returnPolling";
import {
  clearPendingOrder,
  detectRuneGrant,
  readPendingOrder,
  type PendingOrder,
} from "@/lib/billing/pendingGrant";
import type { BillingWallet, SubscriptionStatus } from "@/types/billing";

async function fetchWallet(): Promise<BillingWallet | null> {
  const response = await fetch("/api/billing/wallet", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as BillingWallet;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const response = await fetch("/api/billing/subscription", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as SubscriptionStatus;
}

export default function BillingReturnPage() {
  const { isAuthenticated } = useAuth();
  const [confirmedType, setConfirmedType] = useState<PendingOrder["type"] | null>(null);
  const [detectedRunes, setDetectedRunes] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<BillingReturnStatus>("direct");

  /*
   * 付与ルーンの召喚回数換算に使う。ルーン購入の復帰時だけ取りに行き
   * （マスタデータ・5分キャッシュ）、取れなければ換算行を出さないだけで
   * この画面の本務（反映確認）には影響させない。
   */
  const { limitedSingleCostRune } = useRuneProducts(
    isAuthenticated && (pendingOrder?.type === "rune" || confirmedType === "rune"),
  );


  useEffect(() => {
    if (!isAuthenticated) return;

    const stored = readPendingOrder(window.sessionStorage);
    setPendingOrder(stored);
    setStatus(stored ? "pending" : "direct");
    setPollStartedAt(stored ? Date.now() : null);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!pendingOrder || status !== "pending" || pollStartedAt === null) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        if (shouldStopReturnPolling(pollStartedAt, Date.now())) {
          setStatus("timeout");
          return;
        }

        if (pendingOrder.type === "rune") {
          const wallet = await fetchWallet();
          if (cancelled) return;

          if (wallet) {
            const detection = detectRuneGrant(pendingOrder, wallet.runeBalance);
            if (detection) {
              // 残高への反映を確認できた時点が「完了」。決済画面の
              // 戻りURLに来ただけでは完了と数えない（webhook待ちで失敗しうる）。
              trackFunnelEvent("CHECKOUT_COMPLETED", {
                grantedRunes: detection.grantedRunes,
                kind: "rune",
              });
              clearPendingOrder(window.sessionStorage);
              setConfirmedType("rune");
              setDetectedRunes(detection.grantedRunes);
              setPendingOrder(null);
              setStatus("confirmed");
              return;
            }
          }
        }

        if (pendingOrder.type === "subscription") {
          const subscription = await fetchSubscriptionStatus();
          if (cancelled) return;

          if (subscription?.entitled) {
            trackFunnelEvent("CHECKOUT_COMPLETED", { kind: "subscription" });
            clearPendingOrder(window.sessionStorage);
            setConfirmedType("subscription");
            setPendingOrder(null);
            setStatus("confirmed");
            return;
          }
        }

        setPollAttempt((attempt) => attempt + 1);
      })();
    }, getReturnPollDelayMs(pollAttempt));

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pendingOrder, pollAttempt, pollStartedAt, status]);


  const message =
    confirmedType === "subscription" && status === "confirmed"
      ? "冒険者パスが有効になりました。"
      : buildBillingReturnMessage(status, detectedRunes ?? undefined);

  // 反映を確認できた付与量の言い換え。データが揃わなければ null（何も足さない）。
  const grantedEquivalentText =
    confirmedType === "rune" && detectedRunes != null
      ? buildLimitedSummonEquivalentText(detectedRunes, limitedSingleCostRune)
      : null;

  return (
    <>
      <ConsoleTopbar command="./wait-for-ledger" path="~/billing/return" showWallet />
      <div className="min-h-screen px-4 py-5 md:px-9 md:py-6">
        <section className="max-w-2xl border border-line bg-bg-elev p-5">
          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
            BILLING RETURN
          </div>
          <h1 className="text-[20px] font-semibold text-text">反映状況</h1>
          <p className="mt-3 text-[13px] leading-6 text-text-dim">{message}</p>

          {status === "pending" && (
            <div className="mt-4 border border-line bg-bg px-3 py-2 text-[12px] text-text-dim">
              残高を確認しています。画面を閉じても、反映後はヘッダー下の通知で確認できます。
            </div>
          )}

          {status === "timeout" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg"
                onClick={() => {
                  setPollAttempt(0);
                  setPollStartedAt(Date.now());
                  setStatus("pending");
                }}
                type="button"
              >
                再確認する
              </button>
              <Link
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                href="/mypage/billing"
              >
                課金状況を確認
              </Link>
              {/*
                決済自体が成立していない可能性がある（PSP 画面で離脱など）。
                その場合はいくら待っても付与されないため、購入し直す道を
                ここに置く。強調はしない（買わせ直しの誘導ではなく回復手段）。
              */}
              <Link
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                href={pendingOrder?.type === "subscription" ? "/pass" : "/shop/runes"}
              >
                もう一度購入する
              </Link>
            </div>
          )}

          {status === "direct" && (
            <div className="mt-4">
              <Link
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                href="/shop/runes"
              >
                ルーン購入へ
              </Link>
            </div>
          )}

          {status === "confirmed" && (
            /*
              決済直後は「買ったものを使いたい」熱が最も高い地点。
              ルーン購入で /shop（コインのアイテム棚）に返していたため、
              買ったルーンの主要な使い道に繋がっていなかった。
            */
            <div className="mt-4">
              {/* 反映済みルーンの換算をCTAの隣に添える（取得できた時だけ） */}
              {confirmedType !== "subscription" && grantedEquivalentText != null && (
                <p className="mb-2 text-[11px] text-text-faint">
                  ＝ {grantedEquivalentText}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {confirmedType === "subscription" ? (
                  <Link
                    className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg"
                    href="/pass"
                  >
                    パス画面へ
                  </Link>
                ) : (
                  <>
                    <Link
                      className="border border-rune-border bg-rune-bg px-3 py-1.5 text-[12px] text-rune hover:brightness-125"
                      href="/summon/limited"
                    >
                      限定召喚へ →
                    </Link>
                    <Link
                      className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                      href="/shop"
                    >
                      ショップへ戻る
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
