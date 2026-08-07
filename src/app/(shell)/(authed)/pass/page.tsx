"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import {
  CancelPassModal,
  formatPeriodEndDate,
} from "@/components/billing/CancelPassModal";
import { SubscriptionStatusSummary } from "@/components/billing/SubscriptionStatusSummary";
import { LegalFooter } from "@/components/LegalFooter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ShopTabs } from "@/components/ShopTabs";
import { useAuth } from "@/hooks/useAuth";
import { trackFunnelEvent, useTrackScreenView } from "@/hooks/useFunnelTracking";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import { clearAgeVerification, readVerifiedAgeGroup } from "@/lib/billing/ageVerification";
import { writePendingOrder } from "@/lib/billing/pendingGrant";
import { readBillingErrorMessage } from "@/lib/billing/runeCheckout";
import {
  buildSubscriptionCheckoutRequest,
  clearSubscriptionCheckoutIdempotencyKey,
  buildPassBenefits,
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
  const { isAuthenticated } = useAuth();
  const {
    error: subscriptionError,
    loading: subscriptionLoading,
    refetch: refetchSubscription,
    subscription,
    updateSubscription,
  } = useSubscription(isAuthenticated);
  const {
    error: planError,
    plan,
    refetch: refetchPlan,
  } = useSubscriptionPlan();

  useTrackScreenView("PASS_VIEWED");

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

  // /shop/runes と同じく、申告済みなら再申告を求めない（訪問のたびに
  // モーダルが出る画面間の不一致を解消）。強制はサーバ側ゲートが行う。
  useEffect(() => {
    setVerifiedAgeGroup(readVerifiedAgeGroup(window.localStorage));
  }, []);

  /*
    Esc・Tab循環・背後のスクロールロックは共通フックへ。
    この画面は年齢確認 → 加入確認、解約確認と複数のモーダルが入れ替わるが、
    スクロールロックは参照カウントなので、入れ替わりの瞬間に背後が動き出したり
    ロックが残ったりしない。
  */
  const checkoutPanelRef = useModalDismiss({
    // PSP へ送り出す準備中は閉じない（遷移直前に消えて操作不能に見えるのを防ぐ）
    dismissible: !checkoutInFlight,
    onDismiss: () => setConfirmOpen(false),
    open: confirmOpen,
  });


  const effectiveSubscription = subscription ?? EMPTY_SUBSCRIPTION;
  // 価格も特典もサーバの値。届いていなければ「—」を出し、既定値で埋めない。
  const priceText = formatPassPrice(plan);
  const benefits = buildPassBenefits(plan);
  const presentation = useMemo(
    () => toPassStatusPresentation(effectiveSubscription),
    [effectiveSubscription],
  );
  const eligibility = useMemo(
    () => getPassCheckoutEligibility(verifiedAgeGroup),
    [verifiedAgeGroup],
  );
  const subscribed = effectiveSubscription.entitled;
  // 解約予定の受け皿文。日付は subscription API の currentPeriodEnd のみを使い、
  // 届いていなければ日付なしの文言に落とす（日付を推測して埋めない）。
  const cancelScheduledPeriodEndDate = formatPeriodEndDate(
    effectiveSubscription.currentPeriodEnd,
  );
  const cancelScheduledNote = cancelScheduledPeriodEndDate
    ? `現在の期間末（${cancelScheduledPeriodEndDate}）まで特典は有効です。期間終了後に再加入できます。`
    : "現在の期間末まで特典は有効です。期間終了後に再加入できます。";


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
      trackFunnelEvent("CHECKOUT_STARTED", { kind: "subscription" });
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
    <>
      <ConsoleTopbar command="./manage-adventurer-pass" path="~/pass" showWallet />
      <div className="min-h-screen px-4 py-5 md:px-9 md:py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-text">冒険者パス</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              継続特典の内容、加入状態、解約予定をこの画面で確認できます。
            </p>
          </div>
          <ShopTabs current="pass" />
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

        {/* 価格・特典が読めないと「加入確認へ」は押せないまま（既定値で埋めない
            方針のため）。黙って disabled にせず、失敗の事実と再試行の道を出す。 */}
        {planError && (
          <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
            パスの価格・特典を読み込めませんでした。
            <button
              className="ml-3 underline underline-offset-4"
              onClick={() => void refetchPlan()}
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
                <div className="text-[28px] font-semibold text-text">
                  {priceText ?? "—"}
                </div>
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
              {benefits.map((benefit) => (
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
                        onClick={() => {
                          setCancelError(null);
                          setCancelConfirmOpen(true);
                        }}
                        type="button"
                      >
                        解約する
                      </button>
                    )}
                    {/* 解約予定の受け皿。状態の意味（いつまで有効か・その後
                        どうなるか）だけを言う。
                        「更新を再開する」ボタンは置かない: 解約時点で
                        BE が KOMOJU 側のサブスクリプションを削除しており
                        （CancelSubscriptionUseCase → KomojuPaymentGateway の
                        DELETE /subscriptions/{id}）、BE内フラグだけ戻しても
                        実際の更新・課金は走らない。「更新されます」と表示
                        しながら更新されない課金上の嘘になるため、再開は
                        期間終了後の再加入（チェックアウト）に一本化する。 */}
                    {effectiveSubscription.cancelScheduled && (
                      <p className="border border-line bg-bg px-3 py-3 text-[12px] leading-6 text-text-dim">
                        {cancelScheduledNote}
                      </p>
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
                      disabled={!eligibility.allowed || subscriptionLoading || priceText == null}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!checkoutInFlight) setConfirmOpen(false);
          }}
          role="presentation"
        >
          {/* dialog はオーバーレイではなくパネル（中身の箱）が名乗る */}
          <section
            aria-labelledby="subscription-checkout-title"
            aria-modal="true"
            className="w-full max-w-lg border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
            ref={checkoutPanelRef}
            role="dialog"
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
                <span className="text-text">{priceText ?? "—"}</span>
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
                {benefits.map((benefit) => (
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
              {/* 初期フォーカスはキャンセル側に。毎月自動更新が始まる決済遷移を
                  Enter 連打で走らせない */}
              <button
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-autofocus
                disabled={checkoutInFlight}
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={checkoutInFlight || !agreementChecked || priceText == null}
                onClick={() => void submitSubscriptionCheckout()}
                type="button"
              >
                {checkoutInFlight ? "遷移準備中…" : "決済へ進む"}
              </button>
            </div>
          </section>
        </div>
      )}

      <CancelPassModal
        currentPeriodEnd={effectiveSubscription.currentPeriodEnd}
        error={cancelError}
        inFlight={cancelInFlight}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => void submitCancel()}
        open={cancelConfirmOpen}
      />

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
    </>
  );
}
