"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import { SubscriptionStatusSummary } from "@/components/billing/SubscriptionStatusSummary";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { clearAgeVerification } from "@/lib/billing/ageVerification";
import { writePendingOrder } from "@/lib/billing/pendingGrant";
import { readBillingErrorMessage } from "@/lib/billing/runeCheckout";
import {
  buildSubscriptionCheckoutRequest,
  clearSubscriptionCheckoutIdempotencyKey,
  formatPassPrice,
  getOrCreateSubscriptionCheckoutIdempotencyKey,
  getPassCheckoutEligibility,
  mapSubscriptionCheckoutError,
  toPassStatusPresentation,
} from "@/lib/billing/subscriptionPass";
import type {
  AgeGroup,
  CreateSubscriptionCheckoutResponse,
  SubscriptionStatus,
} from "@/types/billing";

const EMPTY_SUBSCRIPTION: SubscriptionStatus = {
  cancelScheduled: false,
  currentPeriodEnd: null,
  entitled: false,
  plan: null,
  status: "NONE",
};

const STATUS_TONE_CLASS: Record<ReturnType<typeof toPassStatusPresentation>["statusTone"], string> = {
  active: "border-accent/40 bg-accent/10 text-accent",
  inactive: "border-line bg-bg text-text-dim",
  scheduled: "border-gold/40 bg-gold/10 text-gold",
};

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `subscription-${Date.now()}`;
}

export default function PassPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    error: subscriptionError,
    loading: subscriptionLoading,
    refetch: refetchSubscription,
    subscription,
    updateSubscription,
  } = useSubscription(isAuthenticated);

  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelInFlight, setCancelInFlight] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutInFlight, setCheckoutInFlight] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openConfirmAfterAge, setOpenConfirmAfterAge] = useState(false);
  const [verifiedAgeGroup, setVerifiedAgeGroup] = useState<AgeGroup | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const effectiveSubscription = subscription ?? EMPTY_SUBSCRIPTION;
  const presentation = useMemo(
    () => toPassStatusPresentation(effectiveSubscription),
    [effectiveSubscription],
  );
  const eligibility = useMemo(
    () => getPassCheckoutEligibility(verifiedAgeGroup),
    [verifiedAgeGroup],
  );
  const subscribed = effectiveSubscription.entitled;

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

  function requestAgeCheck() {
    setCheckoutError(null);
    setOpenConfirmAfterAge(true);
    setAgeGateOpen(true);
  }

  function openSubscriptionConfirm() {
    setCheckoutError(null);
    if (!eligibility.allowed) {
      if (verifiedAgeGroup === null) requestAgeCheck();
      return;
    }

    setAgreementChecked(false);
    setConfirmOpen(true);
  }

  async function submitSubscriptionCheckout() {
    if (checkoutInFlight || !agreementChecked) return;

    setCheckoutError(null);
    setCheckoutInFlight(true);

    const idempotencyKey = getOrCreateSubscriptionCheckoutIdempotencyKey(
      window.sessionStorage,
      createBrowserIdempotencyKey,
    );

    try {
      const response = await fetch("/api/billing/subscription/checkout", {
        body: JSON.stringify(buildSubscriptionCheckoutRequest(idempotencyKey)),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const serverMessage = await readBillingErrorMessage(response);
        const mapped = mapSubscriptionCheckoutError(response.status, serverMessage);
        setCheckoutError(mapped.message);

        if (mapped.action === "login") {
          router.replace("/login");
        }

        if (mapped.action === "ageGate") {
          clearAgeVerification(window.localStorage);
          setVerifiedAgeGroup(null);
          setConfirmOpen(false);
          setOpenConfirmAfterAge(true);
          setAgeGateOpen(true);
        }
        return;
      }

      const checkout = (await response.json()) as CreateSubscriptionCheckoutResponse;
      clearSubscriptionCheckoutIdempotencyKey(window.sessionStorage);
      writePendingOrder(window.sessionStorage, {
        createdAt: Date.now(),
        orderId: checkout.subscriptionId,
        type: "subscription",
      });
      window.location.href = checkout.checkoutUrl;
    } catch {
      setCheckoutError("一時的なエラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setCheckoutInFlight(false);
    }
  }

  async function submitCancel() {
    if (cancelInFlight) return;

    setCancelError(null);
    setCancelInFlight(true);

    try {
      const response = await fetch("/api/billing/subscription", {
        method: "DELETE",
      });

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
      setCancelInFlight(false);
    }
  }

  return (
    <MainWrapper>
      <ConsoleTopbar command="./manage-adventurer-pass" path="~/pass" showWallet />
      <div className="min-h-screen px-9 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-text">冒険者パス</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              継続特典の内容、加入状態、解約予定をこの画面で確認できます。
            </p>
          </div>
        </div>

        {subscriptionError && (
          <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
            パス状態を読み込めませんでした。
            <button
              className="ml-3 underline underline-offset-4"
              onClick={() => void refetchSubscription()}
              type="button"
            >
              再読み込み
            </button>
          </div>
        )}

        <div className="grid max-w-5xl grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-line bg-bg-elev p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              ADVENTURER PASS
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[28px] font-semibold text-text">{formatPassPrice()}</div>
                <div className="mt-2 text-[12px] leading-6 text-text-dim">
                  成人（18歳以上）の方のみご加入いただけます。
                </div>
              </div>
              <span
                className={[
                  "border px-3 py-1.5 text-[12px]",
                  STATUS_TONE_CLASS[presentation.statusTone],
                ].join(" ")}
              >
                {subscriptionLoading ? "確認中" : presentation.statusLabel}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {presentation.benefits.map((benefit) => (
                <div key={benefit} className="border border-line bg-bg px-3 py-3">
                  <span className="text-[12px] text-text">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border border-line bg-bg px-3 py-3 text-[12px] leading-6 text-text-dim">
              月額課金はKOMOJUのホスト画面で決済します。加入後の特典反映はWebhook確認後に行われます。
              日割返金はありません。
            </div>
          </section>

          <section className="border border-line bg-bg-elev p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              PASS STATUS
            </div>
            <h2 className="text-[16px] font-semibold text-text">現在の状態</h2>

            <SubscriptionStatusSummary
              loading={subscriptionLoading}
              subscription={effectiveSubscription}
            />

            {!subscriptionLoading && (
              <>
                {subscribed ? (
                  <div className="mt-5 space-y-3">
                    {presentation.cancelButtonVisible && (
                      <button
                        className="w-full border border-pink/50 px-3 py-2 text-[12px] font-semibold text-pink hover:bg-pink hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={cancelInFlight}
                        onClick={() => setCancelConfirmOpen(true)}
                        type="button"
                      >
                        解約する
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {eligibility.reason && (
                      <div className="border border-gold/40 bg-gold/10 px-3 py-2 text-[12px] leading-5 text-gold">
                        {eligibility.reason}
                      </div>
                    )}
                    {verifiedAgeGroup === null && (
                      <button
                        className="w-full border border-accent px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent hover:text-bg"
                        onClick={requestAgeCheck}
                        type="button"
                      >
                        年齢確認する
                      </button>
                    )}
                    <button
                      className="w-full bg-accent px-3 py-2 text-[12px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!eligibility.allowed || subscriptionLoading}
                      onClick={openSubscriptionConfirm}
                      type="button"
                    >
                      加入確認へ
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <LegalFooter />
      </div>

      {confirmOpen && (
        <div
          aria-labelledby="subscription-checkout-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!checkoutInFlight) setConfirmOpen(false);
          }}
          role="dialog"
        >
          <section
            className="w-full max-w-lg border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                SUBSCRIPTION CHECKOUT
              </div>
              <h2 id="subscription-checkout-title" className="text-[17px] font-semibold text-text">
                冒険者パスに加入しますか?
              </h2>
            </div>

            <div className="space-y-2 border border-line bg-bg px-3 py-3 text-[12px]">
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">金額</span>
                <span className="text-text">{formatPassPrice()}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">課金周期</span>
                <span className="text-text">毎月自動更新</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">次回請求</span>
                <span className="text-right text-text">初回決済日の1か月後</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">解約方法</span>
                <span className="max-w-72 text-right text-text">
                  このページからいつでも解約できます。日割返金はありません。
                </span>
              </div>
            </div>

            <div className="mt-3 border border-line bg-bg px-3 py-3">
              <div className="mb-2 text-[11px] text-text-faint">特典内容</div>
              <ul className="space-y-1 text-[12px] text-text">
                {presentation.benefits.map((benefit) => (
                  <li key={benefit}>・{benefit}</li>
                ))}
              </ul>
            </div>

            <label className="mt-4 flex cursor-pointer gap-3 text-[12px] leading-5 text-text-dim">
              <input
                checked={agreementChecked}
                className="mt-1 accent-[var(--accent)]"
                onChange={(event) => setAgreementChecked(event.target.checked)}
                type="checkbox"
              />
              <span>金額、課金周期、次回請求、解約条件、特典内容を確認しました。</span>
            </label>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/tokushoho">
                特定商取引法に基づく表示
              </Link>
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/terms">
                利用規約
              </Link>
            </div>

            {checkoutError && (
              <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
                {checkoutError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={checkoutInFlight}
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={checkoutInFlight || !agreementChecked}
                onClick={() => void submitSubscriptionCheckout()}
                type="button"
              >
                {checkoutInFlight ? "遷移準備中…" : "決済へ進む"}
              </button>
            </div>
          </section>
        </div>
      )}

      {cancelConfirmOpen && (
        <div
          aria-labelledby="subscription-cancel-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!cancelInFlight) setCancelConfirmOpen(false);
          }}
          role="dialog"
        >
          <section
            className="w-full max-w-md border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                CANCEL PASS
              </div>
              <h2 id="subscription-cancel-title" className="text-[17px] font-semibold text-text">
                冒険者パスを解約しますか?
              </h2>
              <p className="mt-2 text-[12px] leading-6 text-text-dim">
                解約予定にすると、現在の期間末までは特典を利用できます。それ以降は更新されません。
                日割返金はありません。
              </p>
            </div>

            {cancelError && (
              <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
                {cancelError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={cancelInFlight}
                onClick={() => setCancelConfirmOpen(false)}
                type="button"
              >
                戻る
              </button>
              <button
                className="border border-pink/50 px-3 py-1.5 text-[12px] font-semibold text-pink hover:bg-pink hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                disabled={cancelInFlight}
                onClick={() => void submitCancel()}
                type="button"
              >
                {cancelInFlight ? "保存中…" : "解約予定にする"}
              </button>
            </div>
          </section>
        </div>
      )}

      <AgeVerificationModal
        onClose={() => {
          setAgeGateOpen(false);
          setOpenConfirmAfterAge(false);
        }}
        onVerified={(result) => {
          setVerifiedAgeGroup(result.ageGroup);
          setAgeGateOpen(false);

          if (result.ageGroup === "ADULT" && openConfirmAfterAge) {
            setAgreementChecked(false);
            setConfirmOpen(true);
          } else if (result.ageGroup !== "ADULT") {
            setCheckoutError("冒険者パスは18歳以上の方のみご加入いただけます。");
          }

          setOpenConfirmAfterAge(false);
        }}
        open={ageGateOpen}
      />
    </MainWrapper>
  );
}
