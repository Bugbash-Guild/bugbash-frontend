"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { useInventory } from "@/hooks/useInventory";
import { usePurchase } from "@/hooks/usePurchase";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { WalletBadge } from "@/components/WalletBadge";
import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  mapShopPurchaseErrorMessage,
} from "@/lib/shopPresentation";
import type { ShopItem } from "@/types/shop";

export default function ShopPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    items,
    guildCoinBalance,
    runeBalance,
    loading,
    refetch: refetchShop,
  } = useShop(isAuthenticated);
  const { refetch: refetchInventory } = useInventory(isAuthenticated);
  const { purchase, loading: purchasing, error: purchaseError, reset: resetPurchase } = usePurchase();

  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);
  const selectedPresentation = selected
    ? buildShopPurchasePresentation(selected, { guildCoinBalance, runeBalance })
    : null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!successFlash) return;
    const t = setTimeout(() => setSuccessFlash(null), 3000);
    return () => clearTimeout(t);
  }, [successFlash]);

  function closeModal() {
    if (purchasing) return;
    setSelected(null);
    resetPurchase();
  }

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, purchasing]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-text-dim text-[13px]">
          <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
          authenticating…
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    if (!selected) return;
    try {
      const res = await purchase(selected.itemId);
      setSelected(null);
      resetPurchase();
      setSuccessFlash(`${res.itemName} を購入しました(所持: ${res.itemQuantity})`);
      await Promise.all([refetchShop(), refetchInventory(), mutate("/api/billing/wallet")]);
    } catch {
      // エラーは usePurchase の error state からモーダル内に表示される
    }
  }

  return (
    <MainWrapper>
      <div className="px-9 py-6 min-h-screen">
        {/* header */}
        <div className="text-[13px] text-text-dim mb-4">
          <span className="text-accent">root@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/shop</span>
          <span className="text-text-faint">$ </span>
          <span>./browse --shop-items</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        <nav aria-label="ショップ種別" className="mb-4 inline-flex border border-line text-[11px]">
          <Link className="px-3 py-2 text-text-dim hover:text-text" href="/shop/runes">
            RUNES
          </Link>
          <Link
            className="border-x border-line px-3 py-2 text-text-dim hover:text-accent-2"
            href="/shop/skins"
          >
            SKINS
          </Link>
          <span aria-current="page" className="bg-bg-elev-2 px-3 py-2 text-accent">
            ITEMS
          </span>
        </nav>

        <WalletBadge enabled={isAuthenticated} />

        {successFlash && (
          <div className="mb-4 px-3 py-2 bg-accent/10 border border-accent/40 rounded text-[12px] text-accent">
            {successFlash}
          </div>
        )}

        {loading ? (
          <div className="text-text-faint text-[13px]">loading shop…</div>
        ) : items.length === 0 ? (
          <div className="text-text-faint text-[13px]">商品がありません</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const presentation = buildShopPurchasePresentation(item, {
                guildCoinBalance,
                runeBalance,
              });
              return (
                <button
                  key={item.itemId}
                  onClick={() => setSelected(item)}
                  className="text-left bg-bg-elev border border-line rounded-lg p-4 hover:bg-bg-elev-2 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <ItemVisual
                      alt={item.name}
                      assetUrl={item.assetUrl}
                      className="size-9"
                      sizes="36px"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-text font-semibold">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-text-faint mt-1 line-clamp-2">
                        {item.description}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span
                          className={[
                            "text-[13px] font-semibold",
                            presentation.canAfford ? "text-text" : "text-pink",
                          ].join(" ")}
                        >
                          {presentation.priceLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <LegalFooter />
      </div>

      {/* purchase confirm modal */}
      {selected && selectedPresentation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shop-purchase-title"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-bg-elev border border-line rounded-lg w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <ItemVisual
                alt={selected.name}
                assetUrl={selected.assetUrl}
                className="size-8"
                sizes="32px"
              />
              <div>
                <div id="shop-purchase-title" className="text-[14px] text-text font-semibold">
                  {selected.name} を購入しますか?
                </div>
                <div className="text-[11px] text-text-faint">
                  {formatShopCurrencyAmount(selected.currency, selected.price)} を消費します
                </div>
              </div>
            </div>
            <div className="text-[12px] text-text-dim mb-4">{selected.description}</div>

            {selectedPresentation.cosmeticNotice && (
              <div className="mb-3 border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] leading-5 text-accent">
                {selectedPresentation.cosmeticNotice}
              </div>
            )}

            {selectedPresentation.insufficientMessage && (
              <div className="mb-3 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] leading-5 text-pink">
                {selectedPresentation.insufficientMessage}
                {selectedPresentation.showRuneTopUpLink && (
                  <Link className="ml-3 text-text underline-offset-4 hover:underline" href="/shop/runes">
                    ルーンを購入する
                  </Link>
                )}
              </div>
            )}

            {purchaseError && (
              <div className="mb-3 px-3 py-2 bg-pink/10 border border-pink/30 rounded text-[12px] text-pink">
                {mapShopPurchaseErrorMessage(
                  selected,
                  { guildCoinBalance, runeBalance },
                  purchaseError.status,
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                disabled={purchasing}
                className="px-3 py-1.5 text-[12px] text-text-dim border border-line rounded hover:bg-bg-elev-2"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                disabled={purchasing || !selectedPresentation.canAfford}
                className="px-3 py-1.5 text-[12px] text-bg bg-accent rounded hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {purchasing ? "購入中…" : "購入する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainWrapper>
  );
}
