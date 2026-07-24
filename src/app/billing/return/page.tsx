"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { MainWrapper } from "@/components/MainWrapper";
import { useAuth } from "@/hooks/useAuth";
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
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [confirmedType, setConfirmedType] = useState<PendingOrder["type"] | null>(null);
  const [detectedRunes, setDetectedRunes] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<BillingReturnStatus>("direct");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-[13px] text-text-dim">
          <span className="h-4 w-4 animate-spin rounded-full border border-accent border-t-transparent" />
          authenticating…
        </div>
      </div>
    );
  }

  const message =
    confirmedType === "subscription" && status === "confirmed"
      ? "冒険者パスが有効になりました。"
      : buildBillingReturnMessage(status, detectedRunes ?? undefined);

  return (
    <MainWrapper>
      <ConsoleTopbar command="./wait-for-ledger" path="~/billing/return" showWallet />
      <div className="min-h-screen px-9 py-6">
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
            <div className="mt-4">
              <Link
                className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg"
                href={confirmedType === "subscription" ? "/pass" : "/shop"}
              >
                {confirmedType === "subscription" ? "パス画面へ" : "ショップへ戻る"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </MainWrapper>
  );
}
