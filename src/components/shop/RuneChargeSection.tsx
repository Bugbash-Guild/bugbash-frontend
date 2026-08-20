"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";

import { AgeVerificationModal } from "@/components/billing/AgeVerificationModal";
import { trackFunnelEvent } from "@/hooks/useFunnelTracking";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useRuneProducts } from "@/hooks/useRuneProducts";
import { useWallet } from "@/hooks/useWallet";
import { clearAgeVerification, readAgeVerified } from "@/lib/billing/ageVerification";
import { writePendingOrder } from "@/lib/billing/pendingGrant";
import {
  buildLimitedSummonEquivalentText,
  findCheapestRuneProductIds,
  isExactPityPack,
} from "@/lib/billing/runeConversion";
import {
  buildCheckoutRequest,
  buildRuneProductCards,
  clearCheckoutIdempotencyKey,
  getOrCreateCheckoutIdempotencyKey,
  mapBillingCheckoutError,
  readBillingErrorMessage,
} from "@/lib/billing/runeCheckout";
import {
  formatCapJpy,
  parseSpendingLimitResponse,
  type SpendingLimitView,
} from "@/lib/billing/spendingLimit";
import type { CreateCheckoutResponse, RuneProduct } from "@/types/billing";

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `checkout-${Date.now()}`;
}

const SPENDING_LIMIT_URL = "/api/billing/spending-limit";

async function fetchSpendingLimit(url: string): Promise<SpendingLimitView | null> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`spending-limit fetch failed: ${response.status}`);
  return parseSpendingLimitResponse(await response.json());
}

/**
 * ルーンのチャージ売り場（旧 /shop/runes の中身）。
 *
 * ショップを1枚に畳んだ後も、決済まわりの機構 — 年齢ゲート・冪等キー・
 * pending order の記録・確認モーダル — はここに閉じる。ページ側は
 * 置くだけでよく、属性パックなどアイテム購入のモーダルとは独立に動く。
 *
 * 表示の約束（ルーン購入ページ時代から変えない）:
 * - 「1ルーン = ¥N」は実データで全SKU同一単価と検証できたときだけ
 * - 「天井ちょうど1回分」は 1回コスト×天井回数 に一致する事実タグ
 * - 購入上限はBEの実値のみ。取れないときは行ごと出さない
 */
export function RuneChargeSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const {
    error: productsError,
    limitedHardPityPull,
    limitedSingleCostRune,
    loading: productsLoading,
    products,
    refetch: refetchProducts,
  } = useRuneProducts(isAuthenticated);
  const { loading: walletLoading, wallet } = useWallet(isAuthenticated);
  /*
   * 月次購入上限（自己設定制・設計v3 §5-F）。SWR キーは SpendingLimitCard と
   * 共有。金額はBEの実値だけを出し、読めなければ行ごと出さない。
   */
  const { data: spendingLimit } = useSWR(
    isAuthenticated ? SPENDING_LIMIT_URL : null,
    fetchSpendingLimit,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
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
  // 「天井1回分ちょうど」の事実タグ（1回コスト×天井回数に一致する商品のみ）
  const pityExactIds = useMemo(
    () =>
      new Set(
        products
          .filter((p) => isExactPityPack(p, limitedSingleCostRune, limitedHardPityPull))
          .map((p) => p.id),
      ),
    [products, limitedSingleCostRune, limitedHardPityPull],
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
    <section aria-labelledby="charge-heading" className="flex flex-col gap-2.5" id="charge">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span aria-hidden className="text-[10px] tracking-[0.14em] text-text-faint">
          CHARGE
        </span>
        <h2 className="text-[14px] font-semibold text-text" id="charge-heading">
          ルーンをチャージ
        </h2>
        <span className="text-[12px] text-text-dim">
          価格は税込総額です。反映には少し時間がかかる場合があります。
        </span>
      </div>

      {productsError && (
        <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[13px] text-pink">
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
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="h-32 border border-line bg-bg-elev" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          {productCards.map((card) => {
            const product = productsById.get(card.id);
            if (!product) return null;
            const pityExact = pityExactIds.has(card.id);

            return (
              <button
                className={`min-h-32 border p-3.5 text-left transition-colors hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  pityExact ? "border-gold/60 bg-bg-elev-2" : "border-line bg-bg-elev"
                }`}
                disabled={checkoutInFlight}
                key={card.id}
                onClick={() => beginPurchase(product)}
                type="button"
              >
                <div className="text-[20px] font-semibold text-text">{card.runeText}</div>
                {/* ボーナス内訳はボーナスのある商品だけ（円固定後は出ない） */}
                {card.bonusText != null && (
                  <div className="mt-1 text-[12px] text-text-dim">{card.bonusText}</div>
                )}
                <div className="mt-2 text-[16px] font-semibold text-accent">{card.price}</div>
                {/* 換算はコストが取得できた時だけ（割り切れないときは「約」つき） */}
                {summonEquivalentById.has(card.id) && (
                  <div className="mt-1 text-[11px] text-text-faint">
                    {summonEquivalentById.get(card.id)}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 empty:hidden">
                  {/* 円/ルーン最小という計算事実のバッジ。全SKU同一単価なら出ない */}
                  {cheapestProductIds.has(card.id) && (
                    <span className="border border-line-strong px-1.5 py-0.5 text-[11px] text-text-dim">
                      最安単価
                    </span>
                  )}
                  {/* 1回コスト×天井回数に一致する事実のタグ（値はAPI由来） */}
                  {pityExact && (
                    <span className="border border-gold/40 px-1.5 py-0.5 text-[11px] text-gold">
                      天井ちょうど1回分
                    </span>
                  )}
                  {card.firstPurchaseOnly && (
                    <span className="border border-gold/40 px-1.5 py-0.5 text-[11px] text-gold">
                      初回限定・おひとり様1回
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 上限の期間は暦月（毎月1日 JST リセット）。ローリング30日ではない。 */}
      {spendingLimit != null && (
        <p className="text-[12px] text-text-faint">
          今月の購入上限: {formatCapJpy(spendingLimit.effectiveCapJpy)}
          <Link
            className="ml-2 text-text-dim underline-offset-4 hover:underline"
            href="/mypage/billing"
          >
            変更はアカウント設定で
          </Link>
          <span className="ml-2">毎月1日（日本時間）リセット</span>
        </p>
      )}

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
              <p className="mt-2 text-[13px] leading-6 text-text-dim">
                {selectedCard.price}。KOMOJU の決済画面へ移動します。
              </p>
            </div>

            <div className="space-y-2 border border-line bg-bg px-3 py-3 text-[13px]">
              {selectedCard.bonusText != null && (
                <div className="flex justify-between gap-3">
                  <span className="text-text-faint">内訳</span>
                  <span className="text-text">{selectedCard.bonusText}</span>
                </div>
              )}
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

            <div className="mt-3 text-[12px] leading-5 text-text-faint">
              決済確認後、Webhook 反映を待って残高へ反映されます。反映前にこの画面では増えた扱いにしません。
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/tokushoho">
                特定商取引法に基づく表示
              </Link>
              <Link className="text-accent underline-offset-4 hover:underline" href="/legal/prepaid">
                前払式支払手段の表示
              </Link>
            </div>

            {checkoutError && (
              <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[13px] text-pink">
                {checkoutError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {/* 初期フォーカスはキャンセル側に。実際に課金が始まる決済遷移を
                  Enter 連打で走らせない */}
              <button
                className="border border-line px-3 py-1.5 text-[13px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-autofocus
                disabled={checkoutInFlight}
                onClick={() => setSelectedProduct(null)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
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
        onVerified={() => {
          // 上限行は自分の状態を持たず、SWR の再取得でBEの実値を映す
          void mutate(SPENDING_LIMIT_URL);
          setAgeGateOpen(false);
          if (pendingAgeProduct) {
            setSelectedProduct(pendingAgeProduct);
            setPendingAgeProduct(null);
          }
        }}
        open={ageGateOpen}
      />
    </section>
  );
}
