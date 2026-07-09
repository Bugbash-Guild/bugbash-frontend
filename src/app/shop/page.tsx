"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { useInventory } from "@/hooks/useInventory";
import { usePurchase } from "@/hooks/usePurchase";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import type { ShopItem } from "@/types/shop";

export default function ShopPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, guildCoinBalance, loading, refetch: refetchShop } = useShop(isAuthenticated);
  const { refetch: refetchInventory } = useInventory(isAuthenticated);
  const { purchase, loading: purchasing, error: purchaseError, reset: resetPurchase } = usePurchase();

  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

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
      await Promise.all([refetchShop(), refetchInventory()]);
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
          <span>./browse --currency guild_coin</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        {/* balance bar */}
        <div className="mb-5 flex items-center gap-3 text-[12px] text-text-dim">
          <span className="text-text-faint uppercase tracking-[0.12em]">balance</span>
          <span className="text-gold font-semibold">GC {guildCoinBalance.toLocaleString()}</span>
        </div>

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
              const canAfford = guildCoinBalance >= item.price;
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
                        <span className="text-[12px] text-gold">GC</span>
                        <span
                          className={[
                            "text-[13px] font-semibold",
                            canAfford ? "text-text" : "text-pink",
                          ].join(" ")}
                        >
                          {item.price.toLocaleString()}
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
      {selected && (
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
                  GC {selected.price.toLocaleString()} を消費します
                </div>
              </div>
            </div>
            <div className="text-[12px] text-text-dim mb-4">{selected.description}</div>

            {purchaseError && (
              <div className="mb-3 px-3 py-2 bg-pink/10 border border-pink/30 rounded text-[12px] text-pink">
                {purchaseError.message}
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
                disabled={purchasing || guildCoinBalance < selected.price}
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
