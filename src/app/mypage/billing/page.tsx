"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit3, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import { SubscriptionStatusSummary } from "@/components/billing/SubscriptionStatusSummary";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import {
  canSubmitRetirement,
  formatPurchaseDate,
  getPurchaseStatusPresentation,
  type PurchaseStatusTone,
} from "@/lib/billing/mypageBilling";
import { toPassStatusPresentation } from "@/lib/billing/subscriptionPass";
import type { SubscriptionStatus } from "@/types/billing";

const EMPTY_SUBSCRIPTION: SubscriptionStatus = {
  cancelScheduled: false,
  currentPeriodEnd: null,
  entitled: false,
  plan: null,
  status: "NONE",
};

const PURCHASE_STATUS_CLASS: Record<PurchaseStatusTone, string> = {
  danger: "border-pink/40 bg-pink/10 text-pink",
  muted: "border-line bg-bg-elev-2 text-text-dim",
  pending: "border-gold/40 bg-gold/10 text-gold",
  success: "border-accent/40 bg-accent/10 text-accent",
};

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("ja-JP", {
    currency,
    style: "currency",
  }).format(amount);

type RetireResult = {
  expiredPaidRuneBalance: number;
  expiredRuneBalance: number;
  retiredAt: string;
  status: string;
};

export default function BillingManagementPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    error: walletError,
    loading: walletLoading,
    refetch: refetchWallet,
    wallet,
  } = useWallet(isAuthenticated);
  const {
    error: subscriptionError,
    loading: subscriptionLoading,
    refetch: refetchSubscription,
    subscription,
    updateSubscription,
  } = useSubscription(isAuthenticated);
  const {
    error: ordersError,
    loading: ordersLoading,
    orders,
    refetch: refetchOrders,
  } = usePurchaseOrders(isAuthenticated);

  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelInFlight, setCancelInFlight] = useState(false);
  const [lossConsentChecked, setLossConsentChecked] = useState(false);
  const [retireConfirmOpen, setRetireConfirmOpen] = useState(false);
  const [retireError, setRetireError] = useState<string | null>(null);
  const [retireInFlight, setRetireInFlight] = useState(false);
  const [retireResult, setRetireResult] = useState<RetireResult | null>(null);
  const cancelInFlightRef = useRef(false);
  const retireInFlightRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-[13px] text-text-dim">
          <span className="size-4 animate-spin rounded-full border border-accent border-t-transparent" />
          authenticating…
        </div>
      </div>
    );
  }

  const effectiveSubscription = subscription ?? EMPTY_SUBSCRIPTION;
  const subscriptionPresentation = toPassStatusPresentation(effectiveSubscription);

  async function cancelSubscription() {
    if (cancelInFlightRef.current) return;
    cancelInFlightRef.current = true;
    setCancelError(null);
    setCancelInFlight(true);

    try {
      const response = await fetch("/api/billing/subscription", { method: "DELETE" });
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        setCancelError("解約予定を保存できませんでした。時間をおいて再度お試しください。");
        return;
      }

      const next = (await response.json()) as SubscriptionStatus;
      await updateSubscription(next);
      setCancelConfirmOpen(false);
    } catch {
      setCancelError("解約予定を保存できませんでした。時間をおいて再度お試しください。");
    } finally {
      cancelInFlightRef.current = false;
      setCancelInFlight(false);
    }
  }

  async function retireAccount() {
    if (
      retireInFlightRef.current ||
      !canSubmitRetirement(lossConsentChecked, retireInFlight)
    ) {
      return;
    }
    retireInFlightRef.current = true;
    setRetireError(null);
    setRetireInFlight(true);

    try {
      const response = await fetch("/api/v1/hero/retire", { method: "POST" });
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        setRetireError("退会処理を完了できませんでした。時間をおいて再度お試しください。");
        return;
      }

      setRetireResult((await response.json()) as RetireResult);
      setRetireConfirmOpen(false);
    } catch {
      setRetireError("退会処理を完了できませんでした。時間をおいて再度お試しください。");
    } finally {
      retireInFlightRef.current = false;
      setRetireInFlight(false);
    }
  }

  return (
    <MainWrapper mobileFullWidth>
      <ConsoleTopbar command="./account-billing" path="~/mypage/billing" showWallet />
      <div className="min-h-screen px-4 py-5 sm:px-7 lg:px-9 lg:py-6">
        <Link
          className="mb-3 inline-block text-[12px] text-accent hover:underline md:hidden"
          href="/"
        >
          ← ホームへ
        </Link>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-text">残高・課金履歴・管理</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              残高、購入履歴、冒険者パス、年齢設定を確認できます。
            </p>
          </div>
        </div>

        <div className="grid max-w-6xl grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="border border-line bg-bg-elev p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                  WALLET
                </div>
                <h2 className="text-[16px] font-semibold text-text">残高</h2>
              </div>
              <button
                aria-label="残高を再読み込み"
                className="p-2 text-text-dim hover:bg-bg-elev-2 hover:text-text disabled:opacity-40"
                disabled={walletLoading}
                onClick={() => void refetchWallet()}
                title="残高を再読み込み"
                type="button"
              >
                <FiRefreshCw className={walletLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {walletError ? (
              <p className="mt-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
                残高を読み込めませんでした。
              </p>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
                {[
                  ["ギルドコイン", wallet?.guildCoinBalance],
                  ["ルーン合計", wallet?.runeBalance],
                  ["有償ルーン", wallet?.paidRuneBalance],
                  ["無償ルーン", wallet?.freeRuneBalance],
                ].map(([label, value]) => (
                  <div key={label} className="bg-bg px-3 py-3">
                    <dt className="text-[10px] text-text-faint">{label}</dt>
                    <dd className="mt-1 text-[17px] font-semibold text-text">
                      {typeof value === "number" ? value.toLocaleString("ja-JP") : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="border border-line bg-bg-elev p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              SUBSCRIPTION
            </div>
            <h2 className="text-[16px] font-semibold text-text">冒険者パス</h2>

            {subscriptionError ? (
              <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
                パス状態を読み込めませんでした。
                <button
                  className="ml-3 underline underline-offset-4"
                  onClick={() => void refetchSubscription()}
                  type="button"
                >
                  再読み込み
                </button>
              </div>
            ) : (
              <SubscriptionStatusSummary
                loading={subscriptionLoading}
                subscription={effectiveSubscription}
              />
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {subscriptionPresentation.cancelButtonVisible && (
                <button
                  className="border border-pink/50 px-3 py-2 text-[12px] font-semibold text-pink hover:bg-pink hover:text-bg"
                  onClick={() => setCancelConfirmOpen(true)}
                  type="button"
                >
                  解約する
                </button>
              )}
              <Link
                className="border border-line px-3 py-2 text-[12px] text-text-dim hover:bg-bg-elev-2 hover:text-text"
                href="/pass"
              >
                パス詳細
              </Link>
            </div>
          </section>

          <section className="border border-line bg-bg-elev p-5 xl:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                  PURCHASE HISTORY
                </div>
                <h2 className="text-[16px] font-semibold text-text">課金履歴</h2>
              </div>
              <button
                aria-label="課金履歴を再読み込み"
                className="p-2 text-text-dim hover:bg-bg-elev-2 hover:text-text disabled:opacity-40"
                disabled={ordersLoading}
                onClick={() => void refetchOrders()}
                title="課金履歴を再読み込み"
                type="button"
              >
                <FiRefreshCw className={ordersLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {ordersError ? (
              <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
                課金履歴を読み込めませんでした。決済内容はKOMOJUからのメールでも確認できます。
              </div>
            ) : ordersLoading ? (
              <div className="mt-4 h-28 border border-line bg-bg" />
            ) : orders.length === 0 ? (
              <p className="mt-4 border border-line bg-bg px-3 py-5 text-[12px] text-text-dim">
                課金履歴はまだありません。
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto border border-line">
                <table className="w-full min-w-[680px] border-collapse text-left text-[12px]">
                  <thead className="bg-bg-elev-2 text-text-faint">
                    <tr>
                      <th className="px-3 py-2 font-normal">日時</th>
                      <th className="px-3 py-2 font-normal">商品</th>
                      <th className="px-3 py-2 text-right font-normal">ルーン</th>
                      <th className="px-3 py-2 text-right font-normal">金額</th>
                      <th className="px-3 py-2 font-normal">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const status = getPurchaseStatusPresentation(order.status);
                      return (
                        <tr key={order.orderId} className="border-t border-line bg-bg">
                          <td className="whitespace-nowrap px-3 py-3 text-text-dim">
                            {formatPurchaseDate(order.paidAt ?? order.createdAt)}
                          </td>
                          <td className="px-3 py-3 text-text">{order.runeProductId}</td>
                          <td className="px-3 py-3 text-right text-text">
                            {order.runeAmount.toLocaleString("ja-JP")}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-text">
                            {formatAmount(order.amountJpyTaxIncluded, order.currency)}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-block border px-2 py-1 ${PURCHASE_STATUS_CLASS[status.tone]}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-line bg-bg-elev p-5 xl:col-span-2">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              ACCOUNT &amp; LEGAL
            </div>
            <h2 className="text-[16px] font-semibold text-text">アカウント・法定情報</h2>

            <div className="mt-4 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
              <div className="bg-bg p-4">
                <h3 className="text-[13px] font-semibold text-text">年齢区分</h3>
                <p className="mt-2 text-[11px] leading-5 text-text-dim">
                  現在の年齢区分を再申告し、購入上限を更新します。
                </p>
                <button
                  className="mt-4 inline-flex items-center gap-2 border border-accent px-3 py-2 text-[12px] text-accent hover:bg-accent hover:text-bg"
                  onClick={() => setAgeGateOpen(true)}
                  type="button"
                >
                  <FiEdit3 />
                  年齢区分を変更
                </button>
              </div>

              <div className="bg-bg p-4">
                <h3 className="text-[13px] font-semibold text-text">退会</h3>
                <p className="mt-2 text-[11px] leading-5 text-text-dim">
                  退会すると未使用ルーンは失効し、払い戻しできません。
                </p>
                {retireResult ? (
                  <div className="mt-4 border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] text-accent">
                    退会処理が完了しました。失効ルーン: {retireResult.expiredRuneBalance.toLocaleString("ja-JP")}
                  </div>
                ) : (
                  <button
                    className="mt-4 inline-flex items-center gap-2 border border-pink/50 px-3 py-2 text-[12px] text-pink hover:bg-pink hover:text-bg"
                    onClick={() => {
                      setLossConsentChecked(false);
                      setRetireError(null);
                      setRetireConfirmOpen(true);
                    }}
                    type="button"
                  >
                    <FiTrash2 />
                    退会手続き
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
              <Link className="text-accent hover:underline" href="/legal/tokushoho">
                特定商取引法に基づく表示
              </Link>
              <Link className="text-accent hover:underline" href="/legal/prepaid">
                前払式支払手段の表示
              </Link>
              <Link className="text-accent hover:underline" href="/legal/terms">
                利用規約
              </Link>
            </div>
          </section>
        </div>

        <LegalFooter />
      </div>

      {cancelConfirmOpen && (
        <div
          aria-labelledby="billing-cancel-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
        >
          <section className="w-full max-w-lg border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <h2 id="billing-cancel-title" className="text-[17px] font-semibold text-text">
                冒険者パスを解約しますか?
              </h2>
              <button
                aria-label="閉じる"
                className="p-1 text-text-dim hover:text-text"
                disabled={cancelInFlight}
                onClick={() => setCancelConfirmOpen(false)}
                type="button"
              >
                <FiX />
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-text-dim">
              解約後も現在の期間末までは特典を利用できます。日割返金はありません。
            </p>
            {cancelError && <p className="mt-3 text-[12px] text-pink">{cancelError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="border border-line px-3 py-2 text-[12px] text-text-dim"
                disabled={cancelInFlight}
                onClick={() => setCancelConfirmOpen(false)}
                type="button"
              >
                戻る
              </button>
              <button
                className="border border-pink/50 px-3 py-2 text-[12px] font-semibold text-pink hover:bg-pink hover:text-bg disabled:opacity-40"
                disabled={cancelInFlight}
                onClick={() => void cancelSubscription()}
                type="button"
              >
                {cancelInFlight ? "保存中…" : "解約を確定"}
              </button>
            </div>
          </section>
        </div>
      )}

      {retireConfirmOpen && (
        <div
          aria-labelledby="retire-account-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
        >
          <section className="w-full max-w-lg border border-pink/40 bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <h2 id="retire-account-title" className="text-[17px] font-semibold text-text">
                退会を確定しますか?
              </h2>
              <button
                aria-label="閉じる"
                className="p-1 text-text-dim hover:text-text"
                disabled={retireInFlight}
                onClick={() => setRetireConfirmOpen(false)}
                type="button"
              >
                <FiX />
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-text-dim">
              この操作は取り消せません。冒険者パスが有効な場合は期間末解約が予約されます。
            </p>
            <label className="mt-4 flex cursor-pointer gap-3 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] leading-5 text-text">
              <input
                checked={lossConsentChecked}
                className="mt-1 accent-[var(--pink)]"
                onChange={(event) => setLossConsentChecked(event.target.checked)}
                type="checkbox"
              />
              <span>未使用ルーンは失効し払い戻しできないことに同意します。</span>
            </label>
            {retireError && <p className="mt-3 text-[12px] text-pink">{retireError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="border border-line px-3 py-2 text-[12px] text-text-dim"
                disabled={retireInFlight}
                onClick={() => setRetireConfirmOpen(false)}
                type="button"
              >
                戻る
              </button>
              <button
                className="bg-pink px-3 py-2 text-[12px] font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canSubmitRetirement(lossConsentChecked, retireInFlight)}
                onClick={() => void retireAccount()}
                type="button"
              >
                {retireInFlight ? "処理中…" : "退会を確定"}
              </button>
            </div>
          </section>
        </div>
      )}

      <AgeVerificationModal
        onClose={() => setAgeGateOpen(false)}
        onVerified={() => setAgeGateOpen(false)}
        open={ageGateOpen}
      />
    </MainWrapper>
  );
}
