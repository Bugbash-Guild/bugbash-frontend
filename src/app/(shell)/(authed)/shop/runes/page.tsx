"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import { LegalFooter } from "@/components/LegalFooter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ShopTabs } from "@/components/ShopTabs";
import { trackFunnelEvent, useTrackScreenView } from "@/hooks/useFunnelTracking";
import { useAuth } from "@/hooks/useAuth";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useRuneProducts } from "@/hooks/useRuneProducts";
import { useWallet } from "@/hooks/useWallet";
import { clearAgeVerification, readAgeVerified } from "@/lib/billing/ageVerification";
import { writePendingOrder } from "@/lib/billing/pendingGrant";
import {
  buildLimitedSummonEquivalentText,
  findCheapestRuneProductIds,
} from "@/lib/billing/runeConversion";
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
  useTrackScreenView("RUNE_SHOP_VIEWED");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    error: productsError,
    limitedSingleCostRune,
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


  const productCards = useMemo(() => buildRuneProductCards(products), [products]);
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  /*
   * ルーンの価値を「限定召喚 約N回ぶん」に言い換える（floor・約付き）。
   * BE が limitedSingleCostRune を返さない間は Map が空になり、行ごと出ない。
   */
  const summonEquivalentById = useMemo(() => {
    const map = new Map<string, string>();
    for (const runeProduct of products) {
      const text = buildLimitedSummonEquivalentText(
        runeProduct.totalRune,
        limitedSingleCostRune,
      );
      if (text != null) map.set(runeProduct.id, text);
    }
    return map;
  }, [products, limitedSingleCostRune]);
  // 円/ルーン最小の商品（実価格から計算した事実のみ。「お得」等の評価語は使わない）
  const cheapestProductIds = useMemo(
    () => findCheapestRuneProductIds(products),
    [products],
  );
  const selectedCard = selectedProduct
    ? buildRuneProductCards([selectedProduct])[0]
    : null;
  const selectedEquivalentText = selectedProduct
    ? (summonEquivalentById.get(selectedProduct.id) ?? null)
    : null;
  const checkoutInFlight = checkoutProductId !== null;

  // Esc・Tab循環・背後のスクロールロックは共通フックへ。open は描画条件と同じ式に
  // すること（ずれると、出ていないモーダルのために背後が固まる）。
  const checkoutPanelRef = useModalDismiss({
    // PSP へ送り出す準備中は閉じない（遷移直前に消えて操作不能に見えるのを防ぐ）
    dismissible: !checkoutInFlight,
    onDismiss: () => setSelectedProduct(null),
    open: selectedProduct != null && selectedCard != null,
  });


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
      // PSP画面へ送る直前。ここから先はこちらでは追えないので、
      // 「送り出した」ことだけを記録する（完了は復帰後に記録する）。
      trackFunnelEvent("CHECKOUT_STARTED", { kind: "rune", sku: product.sku });
      window.location.href = checkout.checkoutUrl;
    } catch {
      setCheckoutError("一時的なエラーが発生しました。同じ内容でもう一度お試しください。");
    } finally {
      setCheckoutProductId(null);
    }
  }

  return (
    <>
      <ConsoleTopbar command="./buy-runes" path="~/shop/runes" showWallet />
      <div className="min-h-screen px-4 py-5 md:px-9 md:py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-text">ルーン購入</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              価格は税込総額です。購入後の反映には少し時間がかかる場合があります。
            </p>
          </div>
          <ShopTabs current="runes" />
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
                    <span className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* 円/ルーン最小という計算事実のバッジ。煽り語は使わない */}
                      {cheapestProductIds.has(card.id) && (
                        <span className="border border-line-strong px-2 py-0.5 text-[10px] text-text-dim">
                          最安単価
                        </span>
                      )}
                      {card.firstPurchaseOnly && (
                        <span className="border border-gold/40 px-2 py-0.5 text-[10px] text-gold">
                          初回限定・おひとり様1回
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-[24px] font-semibold text-text">{card.runeText}</div>
                  <div className="mt-2 text-[12px] text-text-dim">{card.bonusText}</div>
                  {/* 換算はコストが取得できた時だけ（floor なので「約」を外さない） */}
                  {summonEquivalentById.has(card.id) && (
                    <div className="mt-1 text-[11px] text-text-faint">
                      {summonEquivalentById.get(card.id)}
                    </div>
                  )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!checkoutInFlight) setSelectedProduct(null);
          }}
          role="presentation"
        >
          {/* dialog はオーバーレイではなくパネル（中身の箱）が名乗る */}
          <section
            aria-labelledby="rune-checkout-title"
            aria-modal="true"
            className="w-full max-w-md border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
            ref={checkoutPanelRef}
            role="dialog"
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
              {/* カードと同じ換算をここでも（決済直前に事実を再掲する） */}
              {selectedEquivalentText != null && (
                <div className="flex justify-between gap-3">
                  <span className="text-text-faint">換算</span>
                  <span className="text-text">{selectedEquivalentText}</span>
                </div>
              )}
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
              {/* 初期フォーカスはキャンセル側に。実際に課金が始まる決済遷移を
                  Enter 連打で走らせない */}
              <button
                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-autofocus
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
    </>
  );
}
