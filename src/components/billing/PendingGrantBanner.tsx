"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useWallet } from "@/hooks/useWallet";
import {
  PENDING_GRANT_EXPIRES_MS,
  buildPendingGrantMessage,
  clearPendingOrder,
  detectRuneGrant,
  readPendingOrder,
  type PendingOrder,
} from "@/lib/billing/pendingGrant";

const WALLET_POLL_INTERVAL_MS = 15_000;
const DETECTED_MESSAGE_VISIBLE_MS = 8_000;

export function PendingGrantBanner() {
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [detectedRunes, setDetectedRunes] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const { wallet } = useWallet(pendingOrder?.type === "rune", {
    refreshIntervalMs: WALLET_POLL_INTERVAL_MS,
  });

  useEffect(() => {
    setPendingOrder(readPendingOrder(window.sessionStorage));
  }, []);

  useEffect(() => {
    if (!pendingOrder) return;

    const remainingMs = Math.max(
      PENDING_GRANT_EXPIRES_MS - (Date.now() - pendingOrder.createdAt),
      0,
    );
    const timeoutId = window.setTimeout(() => {
      clearPendingOrder(window.sessionStorage);
      setPendingOrder(null);
      setExpired(true);
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [pendingOrder]);

  useEffect(() => {
    if (!wallet || !pendingOrder) return;

    const detection = detectRuneGrant(pendingOrder, wallet.runeBalance);
    if (!detection) return;

    clearPendingOrder(window.sessionStorage);
    setPendingOrder(null);
    setDetectedRunes(detection.grantedRunes);

    const timeoutId = window.setTimeout(() => {
      setDetectedRunes(null);
    }, DETECTED_MESSAGE_VISIBLE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pendingOrder, wallet]);

  if (!pendingOrder && detectedRunes === null && !expired) return null;

  const message =
    detectedRunes !== null
      ? buildPendingGrantMessage({
          grantedRunes: detectedRunes,
          status: "detected",
          type: "rune",
        })
      : expired
        ? buildPendingGrantMessage({ status: "expired", type: "rune" })
        : buildPendingGrantMessage({
            status: "pending",
            type: pendingOrder?.type ?? "rune",
          });

  return (
    <div
      aria-live="polite"
      className={[
        "border-b border-line px-4 py-2 text-[12px]",
        detectedRunes !== null
          ? "bg-accent/10 text-accent"
          : expired
            ? "bg-gold/10 text-gold"
            : "bg-bg-elev-2 text-text-dim",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
          BILLING
        </span>
        <span>{message}</span>
        {expired && (
          <Link className="text-text underline-offset-4 hover:underline" href="/mypage/billing">
            課金状況を確認
          </Link>
        )}
      </div>
    </div>
  );
}
