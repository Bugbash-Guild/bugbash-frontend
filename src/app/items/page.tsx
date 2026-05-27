"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useUseItem } from "@/hooks/useUseItem";
import { ItemVisual } from "@/components/ItemVisual";
import { MainWrapper } from "@/components/MainWrapper";
import type { InventoryItem, UseItemResponse } from "@/types/inventory";

const ROWS = 4;
const COLS = 12;
const STORAGE_SLOTS = ROWS * COLS;
const HOTBAR_SLOTS = 12;

export default function ItemsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, loading, error, refetch } = useInventory(isAuthenticated);
  const { consume, loading: useLoading, error: useError, reset: resetUseError } = useUseItem();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hotbarSelected, setHotbarSelected] = useState<number>(0);
  const [useResult, setUseResult] = useState<UseItemResponse | null>(null);
  const [refetching, setRefetching] = useState(false);
  const activeItemIdRef = useRef<string | null>(null);

  async function handleUseItem(itemId: string) {
    resetUseError();
    setUseResult(null);
    activeItemIdRef.current = itemId;
    const result = await consume(itemId).catch(() => null);
    if (result && activeItemIdRef.current === itemId) {
      setUseResult(result);
      setRefetching(true);
      try {
        await refetch();
      } finally {
        setRefetching(false);
      }
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

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

  const storageSlots: (InventoryItem | null)[] = Array.from(
    { length: STORAGE_SLOTS },
    (_, i) => items[i] ?? null,
  );
  const hotbarSlots: (InventoryItem | null)[] = Array.from(
    { length: HOTBAR_SLOTS },
    (_, i) => items[i] ?? null,
  );

  const totalQty = items.reduce((a, b) => a + b.quantity, 0);
  const occupied = items.length;

  const selectedItem =
    selectedIdx !== null ? storageSlots[selectedIdx] : hotbarSlots[hotbarSelected];

  return (
    <MainWrapper>
      <div className="px-9 py-6">
        {/* prompt header */}
        <div className="text-[13px] text-text-dim mb-5">
          <span className="text-accent">hero@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/items</span>
          <span className="text-text-faint">$ </span>
          <span>inv --grid</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        {/* page header */}
        <div className="mb-6">
          <div className="text-[28px] font-semibold">Inventory</div>
          <div className="text-[12px] text-text-dim mt-1">
            {occupied} stacks · {totalQty} items total
          </div>
        </div>

        {loading && <div className="text-text-faint text-[13px] mb-4">loading inventory…</div>}
        {error && <div className="text-pink text-[13px] mb-4">error: {error}</div>}

        {/* main layout: left grows, right is fixed-width panel */}
        <div className="flex gap-5 items-start">
          {/* LEFT: storage + hotbar */}
          <div className="bg-bg-elev border border-line rounded-[6px] p-3.5 flex-1 min-w-0">
            <div className="text-[10px] text-text-faint tracking-[0.12em] mb-2.5">STORAGE</div>

            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            >
              {Array.from({ length: STORAGE_SLOTS }).map((_, idx) => {
                const item = storageSlots[idx];
                const isSelected = selectedIdx === idx;
                return (
                  <Cell
                    key={idx}
                    item={item}
                    selected={isSelected}
                    onClick={() => {
                      setSelectedIdx(isSelected ? null : idx);
                      setHotbarSelected(-1);
                      setUseResult(null);
                      resetUseError();
                      activeItemIdRef.current = null;
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-4 pt-3.5 border-t border-line">
              <div className="text-[10px] text-text-faint tracking-[0.12em] mb-2.5">
                HOTBAR · 1–{HOTBAR_SLOTS}
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${HOTBAR_SLOTS}, 1fr)` }}
              >
                {hotbarSlots.map((item, i) => {
                  const isSelected = hotbarSelected === i && selectedIdx === null;
                  return (
                    <div key={i} className="relative">
                      <Cell
                        item={item}
                        selected={isSelected}
                        onClick={() => {
                          setHotbarSelected(i);
                          setSelectedIdx(null);
                          setUseResult(null);
                          resetUseError();
                          activeItemIdRef.current = null;
                        }}
                      />
                      <span className="absolute top-0.5 left-1 text-[9px] text-text-faint leading-none pointer-events-none">
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: selected item detail panel */}
          <div className="bg-bg-elev border border-line rounded-[6px] p-5 w-[280px] shrink-0">
            <div className="text-[10px] text-text-faint tracking-[0.12em] mb-3.5">SELECTED</div>

            {selectedItem ? (
              <>
                <div
                  className="w-full aspect-square rounded-[4px] flex items-center justify-center text-[96px] mb-4 border border-line"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 40%, rgba(126,231,135,0.1) 0%, transparent 70%), var(--bg-elev-2)",
                  }}
                >
                  <ItemVisual
                    alt={selectedItem.name}
                    assetUrl={selectedItem.assetUrl}
                    className="size-full"
                    emoji={selectedItem.iconEmoji}
                    emojiClassName="text-[96px]"
                    sizes="240px"
                  />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="text-[15px] font-semibold flex-1 leading-tight">
                    {selectedItem.name}
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-[0.1em] shrink-0"
                    style={{
                      color: "var(--accent-2)",
                      background: "rgba(79,201,211,0.1)",
                      border: "1px solid rgba(79,201,211,0.3)",
                    }}
                  >
                    {selectedItem.category}
                  </span>
                </div>

                <div className="text-[11px] text-text-faint leading-[1.65] mb-3">
                  {selectedItem.description}
                </div>

                <div className="border-t border-line my-3" />

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-faint">qty</span>
                    <span className="text-accent font-bold">×{selectedItem.quantity}</span>
                  </div>
                </div>

                {selectedItem.category === 'SOUL_PACK' && (
                  <div className="mt-4 space-y-2">
                    <button
                      disabled={useLoading || refetching || selectedItem.quantity === 0}
                      onClick={() => handleUseItem(selectedItem.itemId)}
                      className="w-full py-2 rounded-[4px] text-[12px] font-bold tracking-[0.05em] transition-all duration-[80ms] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'rgba(126,231,135,0.12)',
                        border: '1px solid rgba(126,231,135,0.35)',
                        color: 'var(--accent)',
                      }}
                    >
                      {useLoading ? '使用中…' : '使う'}
                    </button>

                    {useResult && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="rounded-[4px] p-2.5 text-[11px] space-y-1"
                        style={{ background: 'rgba(126,231,135,0.06)', border: '1px solid rgba(126,231,135,0.2)' }}
                      >
                        <div className="text-accent font-bold">✓ 使用しました</div>
                        <div className="text-text-faint">
                          <span className="capitalize">{useResult.attribute}</span> 属性に{' '}
                          <span className="text-accent">+{useResult.soulsAdded}</span> ソウル付与
                        </div>
                        <div className="text-text-faint">
                          合計: <span className="text-text">{useResult.soulsAfter}</span> ソウル
                        </div>
                      </div>
                    )}

                    {useError && (
                      <div
                        role="alert"
                        aria-live="assertive"
                        className="rounded-[4px] p-2.5 text-[11px]"
                        style={{ background: 'rgba(255,100,100,0.06)', border: '1px solid rgba(255,100,100,0.2)', color: 'var(--pink)' }}
                      >
                        {useError.message}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-text-faint leading-[1.6]">
                no item selected
                <br />
                <span className="text-text-faint/60">click a slot to inspect</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainWrapper>
  );
}

function Cell({
  item,
  selected,
  onClick,
}: {
  item: InventoryItem | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="aspect-square rounded-[4px] flex items-center justify-center relative cursor-pointer transition-all duration-[80ms]"
      style={{
        background: selected ? "var(--bg-elev)" : "var(--bg-elev-2)",
        border: `1px ${item ? "solid" : "dashed"} ${
          selected ? "rgba(126,231,135,0.55)" : "var(--line)"
        }`,
        boxShadow: selected
          ? "0 0 0 1px rgba(126,231,135,0.22), inset 0 0 12px rgba(126,231,135,0.1)"
          : "none",
      }}
    >
      {item && (
        <>
          <ItemVisual
            alt={item.name}
            assetUrl={item.assetUrl}
            className="size-full"
            emoji={item.iconEmoji}
            emojiClassName="text-[28px] select-none leading-none"
            imageClassName="p-1"
            sizes="48px"
          />
          <span
            className="absolute bottom-0.5 right-1 text-[10px] font-bold leading-none"
            style={{ textShadow: "1px 1px 0 #000" }}
          >
            {item.quantity}
          </span>
        </>
      )}
    </div>
  );
}
