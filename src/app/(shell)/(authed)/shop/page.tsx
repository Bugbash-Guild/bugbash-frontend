"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mutate } from "swr";

import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { useInventory } from "@/hooks/useInventory";
import { usePurchase } from "@/hooks/usePurchase";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ConsoleEmptyState } from "@/components/ConsoleEmptyState";
import { InlineActionResult } from "@/components/InlineActionResult";
import { TermLoading } from "@/components/TermLoading";
import { ShopTabs } from "@/components/ShopTabs";
import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  mapShopPurchaseErrorMessage,
} from "@/lib/shopPresentation";
import type { ShopItem } from "@/types/shop";

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
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


  async function handleConfirm() {
    if (!selected) return;
    try {
      const res = await purchase(selected.itemId);
      setSelected(null);
      resetPurchase();
      setSuccessFlash(`${res.itemName}（所持: ${res.itemQuantity}）`);
      await Promise.all([refetchShop(), refetchInventory(), mutate("/api/billing/wallet")]);
    } catch {
      // エラーは usePurchase の error state からモーダル内に表示される
    }
  }

  return (
    <>
      <ConsoleTopbar command="./browse --shop-items" path="~/shop" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6 min-h-screen">
        <div className="mb-4">
          <ShopTabs current="items" />
        </div>

        {successFlash && (
          /*
            以前は3秒で消えるフラッシュだけで、買ったアイテムをどこで使うのかに
            繋がっていなかった（購入 → 何も起きない → 離脱）。
            消さずに次の行動への導線を残す。
          */
          <div className="mb-4">
            <InlineActionResult
              action={{ href: "/monsters", label: "相棒に使う" }}
              title="購入しました"
              tone="success"
            >
              {successFlash}
            </InlineActionResult>
          </div>
        )}

        {loading ? (
          <TermLoading lines={["query shop.items --currency=all"]} />
        ) : items.length === 0 ? (
          <ConsoleEmptyState
            action={{ href: "/summon", label: "召喚へ" }}
            glyph="▣"
            message="現在販売中のアイテムはありません。入荷までお待ちください。"
          />
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
    </>
  );
}
