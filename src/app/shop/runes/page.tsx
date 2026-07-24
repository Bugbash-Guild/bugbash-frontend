"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useRuneProducts } from "@/hooks/useRuneProducts";
import { useWallet } from "@/hooks/useWallet";
import { clearAgeVerification, readAgeVerified } from "@/lib/billing/ageVerification";
import { writePendingOrder } from "@/lib/billing/pendingGrant";
import {
  buildCheckoutRequest,
  buildRuneProductCards,
  clearCheckoutIdempotencyKey,
  getOrCreateCheckoutIdempotencyKey,
  mapBillingCheckoutError,
  readBillingErrorMessage,
} from "@/lib/billing/runeCheckout";
import type { CreateCheckoutResponse, RuneProduct } from "@/types/billing";

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `checkout-${Date.now()}`;
}

export default function RuneShopPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    error: productsError,
    loading: productsLoading,
    products,
    refetch: refetchProducts,
  } = useRuneProducts(isAuthenticated);
  const { loading: walletLoading, wallet } = useWallet(isAuthenticated);

  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [monthlyLimitJpy, setMonthlyLimitJpy] = useState<number | null>(null);
  const [pendingAgeProduct, setPendingAgeProduct] = useState<RuneProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RuneProduct | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const productCards = useMemo(() => buildRuneProductCards(products), [products]);
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const selectedCard = selectedProduct
    ? buildRuneProductCards([selectedProduct])[0]
    : null;
  const checkoutInFlight = checkoutProductId !== null;

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

  function beginPurchase(product: RuneProduct) {
    setCheckoutError(null);
    if (!readAgeVerified(window.localStorage)) {
      setPendingAgeProduct(product);
      setAgeGateOpen(true);
      return;
    }

    setSelectedProduct(product);
  }

  async function submitCheckout(product: RuneProduct) {
    if (!wallet || checkoutInFlight) return;

    setCheckoutError(null);
    setCheckoutProductId(product.id);

    const idempotencyKey = getOrCreateCheckoutIdempotencyKey(
      window.sessionStorage,
      product.id,
      createBrowserIdempotencyKey,
    );

    try {
      const response = await fetch("/api/billing/checkout", {
        body: JSON.stringify(buildCheckoutRequest(product.id, idempotencyKey)),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const serverMessage = await readBillingErrorMessage(response);
        const presentation = mapBillingCheckoutError(response.status, serverMessage);
        setCheckoutError(presentation.message);

        if (presentation.action === "login") {
          router.replace("/login");
        }

        if (presentation.action === "ageGate") {
          clearAgeVerification(window.localStorage);
          setPendingAgeProduct(product);
          setSelectedProduct(null);
          setAgeGateOpen(true);
        }
        return;
      }

      const checkout = (await response.json()) as CreateCheckoutResponse;
      clearCheckoutIdempotencyKey(window.sessionStorage, product.id);
      writePendingOrder(window.sessionStorage, {
        createdAt: Date.now(),
        orderId: checkout.orderId,
        runeBalanceBefore: wallet.runeBalance,
        type: "rune",
      });
      window.location.href = checkout.checkoutUrl;
    } catch {
      setCheckoutError("一時的なエラーが発生しました。同じ内容でもう一度お試しください。");
    } finally {
      setCheckoutProductId(null);
    }
  }

  return (
    <MainWrapper>
      <ConsoleTopbar command="./buy-runes" path="~/shop/runes" showWallet />
      <div className="min-h-screen px-9 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-text">ルーン購入</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              価格は税込総額です。購入後の反映には少し時間がかかる場合があります。
            </p>
          </div>
        </div>

        {monthlyLimitJpy !== null && (
          <div className="mb-4 border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] text-accent">
            30日間の購入上限: ¥{monthlyLimitJpy.toLocaleString("ja-JP")}
          </div>
        )}

        {productsError && (
          <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
            商品一覧を読み込めませんでした。
            <button
              className="ml-3 underline underline-offset-4"
              onClick={() => void refetchProducts()}
              type="button"
            >
              再読み込み
            </button>
          </div>
        )}

        {productsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-36 border border-line bg-bg-elev" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productCards.map((card) => {
              const product = productsById.get(card.id);
              if (!product) return null;

              return (
                <button
                  className="min-h-36 border border-line bg-bg-elev p-4 text-left transition-colors hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={checkoutInFlight}
                  key={card.id}
                  onClick={() => beginPurchase(product)}
                  type="button"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                      RUNE PACK
                    </span>
                    {card.firstPurchaseOnly && (
                      <span className="border border-gold/40 px-2 py-0.5 text-[10px] text-gold">
                        初回限定・おひとり様1回
                      </span>
                    )}
                  </div>
                  <div className="text-[24px] font-semibold text-text">{card.runeText}</div>
                  <div className="mt-2 text-[12px] text-text-dim">{card.bonusText}</div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-[15px] font-semibold text-accent">{card.price}</span>
                    <span className="text-[11px] text-text-faint">{card.unitPrice}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <LegalFooter />
      </div>

      {selectedProduct && selectedCard && (
        <div
          aria-labelledby="rune-checkout-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!checkoutInFlight) setSelectedProduct(null);
          }}
          role="dialog"
        >
          <section
            className="w-full max-w-md border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                CHECKOUT
              </div>
              <h2 id="rune-checkout-title" className="text-[17px] font-semibold text-text">
                {selectedCard.runeText} を購入しますか?
              </h2>
              <p className="mt-2 text-[12px] leading-6 text-text-dim">
                {selectedCard.price}。KOMOJU の決済画面へ移動します。
              </p>
            </div>

            <div className="space-y-2 border border-line bg-bg px-3 py-3 text-[12px]">
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">内訳</span>
                <span className="text-text">{selectedCard.bonusText}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">単価</span>
                <span className="text-text">{selectedCard.unitPrice}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-faint">現在の残高</span>
                <span className="text-text">
                  {wallet ? `${wallet.runeBalance.toLocaleString("ja-JP")}ルーン` : "取得中"}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] leading-5 text-text-faint">
              決済確認後、Webhook 反映を待って残高へ反映されます。反映前にこの画面では増えた扱いにしません。
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/tokushoho">
                特定商取引法に基づく表示
              </Link>
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/prepaid">
                前払式支払手段の表示
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
                onClick={() => setSelectedProduct(null)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={checkoutInFlight || walletLoading || !wallet}
                onClick={() => void submitCheckout(selectedProduct)}
                type="button"
              >
                {checkoutProductId === selectedProduct.id ? "遷移準備中…" : "決済へ進む"}
              </button>
            </div>
          </section>
        </div>
      )}

      <AgeVerificationModal
        onClose={() => setAgeGateOpen(false)}
        onVerified={(result) => {
          setMonthlyLimitJpy(result.monthlyLimitJpy);
          setAgeGateOpen(false);
          if (pendingAgeProduct) {
            setSelectedProduct(pendingAgeProduct);
            setPendingAgeProduct(null);
          }
        }}
        open={ageGateOpen}
      />
    </MainWrapper>
  );
}
