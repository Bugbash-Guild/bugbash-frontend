"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ItemVisual } from "@/components/ItemVisual";
import { MainWrapper } from "@/components/MainWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useUseItem } from "@/hooks/useUseItem";
import type { InventoryItem, UseItemResponse } from "@/types/inventory";

const COLS = 9;
const MIN_STORAGE_SLOTS = 27;
const HOTBAR_SLOTS = 9;

const CATEGORY_LABEL: Record<InventoryItem["category"], string> = {
  EVOLUTION: "evolution",
  SOUL_PACK: "soul pack",
};

/** ルーン建てアイテム（琥珀・💎）。SOUL_PACK が該当。 */
function isRuneItem(item: InventoryItem): boolean {
  return item.category === "SOUL_PACK";
}

export default function ItemsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, loading, error, refetch } = useInventory(isAuthenticated);
  const { consume, loading: useLoading, error: useError, reset: resetUseError } = useUseItem();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [useResult, setUseResult] = useState<UseItemResponse | null>(null);
  const [refetching, setRefetching] = useState(false);
  const activeItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

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

  function selectSlot(idx: number) {
    setSelectedIdx(idx);
    setUseResult(null);
    resetUseError();
    activeItemIdRef.current = null;
  }

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

  const storageCount = Math.max(
    MIN_STORAGE_SLOTS,
    Math.ceil(items.length / COLS) * COLS,
  );
  const occupied = items.length;
  const selectedItem = items[selectedIdx] ?? null;

  return (
    <MainWrapper>
      <div className="px-9 py-6">
        {/* prompt header */}
        <div className="mb-5 text-[13px] text-text-dim">
          <span className="text-accent">hero@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-blue">~/items</span>
          <span className="text-text-faint">$ </span>
          <span>inv --grid</span>
          <span className="ml-0.5 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
        </div>

        {/* page header */}
        <div className="mb-4">
          <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Inventory</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-text-dim">
            <span>{storageCount} slots</span>
            <span className="text-text-faint">·</span>
            <span>
              <b className="text-accent">{occupied}</b> occupied
            </span>
            <span className="text-text-faint">·</span>
            <span className="inline-flex items-center gap-1 rounded-[3px] border border-rune-border bg-rune-bg px-1.5 py-px text-[9px] text-rune">
              💎
            </span>
            <span>はルーン建てアイテム</span>
          </p>
        </div>

        {loading && <p className="mb-4 text-[13px] text-text-faint">loading inventory…</p>}
        {error && <p className="mb-4 text-[13px] text-pink">error: {error}</p>}

        {/* layout: grids + selected panel */}
        <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* LEFT: storage + hotbar */}
          <div className="min-w-0 space-y-3">
            <div className="rounded-[6px] border border-line bg-bg-elev">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">STORAGE</span>
                <span className="text-[10px] text-text-faint">{occupied}/{storageCount}</span>
              </div>
              <div className="p-3.5">
                <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                  {Array.from({ length: storageCount }).map((_, idx) => (
                    <Slot
                      key={idx}
                      item={items[idx] ?? null}
                      selected={selectedIdx === idx}
                      onSelect={() => selectSlot(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[6px] border border-line bg-bg-elev">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                  HOTBAR · 1–{HOTBAR_SLOTS}
                </span>
                <span className="text-[10px] text-text-faint">[E] use</span>
              </div>
              <div className="p-3.5">
                <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${HOTBAR_SLOTS}, 1fr)` }}>
                  {Array.from({ length: HOTBAR_SLOTS }).map((_, idx) => (
                    <Slot
                      key={idx}
                      item={items[idx] ?? null}
                      selected={selectedIdx === idx}
                      hotIdx={idx + 1}
                      onSelect={() => selectSlot(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: selected item detail panel */}
          <div className="rounded-[6px] border border-line bg-bg-elev">
            <div className="border-b border-line px-4 py-2.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">SELECTED</span>
            </div>
            <div className="p-4">
              {selectedItem ? (
                <>
                  <div
                    className="flex aspect-square max-h-[150px] w-full items-center justify-center rounded-[5px] border border-line text-[64px]"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 40%, rgba(126,231,135,0.08) 0%, transparent 70%), var(--bg-elev-2)",
                    }}
                  >
                    <ItemVisual
                      alt={selectedItem.name}
                      assetUrl={selectedItem.assetUrl}
                      className="size-full"
                      imageClassName="p-3"
                      sizes="220px"
                    />
                  </div>

                  <div className="mt-3 flex items-start gap-2">
                    <span className="flex-1 text-[14px] font-semibold leading-tight">
                      {selectedItem.name}
                    </span>
                    {isRuneItem(selectedItem) && (
                      <span className="shrink-0 rounded-[3px] border border-rune-border bg-rune-bg px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] text-rune">
                        💎 RUNE
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-dim">
                    {selectedItem.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-text-faint">
                    <span>
                      kind: <span className="text-text">{CATEGORY_LABEL[selectedItem.category]}</span>
                    </span>
                    <span>
                      qty: <span className="tabular-nums text-accent">×{selectedItem.quantity}</span>
                    </span>
                  </div>

                  {selectedItem.category === "SOUL_PACK" ? (
                    <div className="mt-3.5 space-y-2">
                      <button
                        type="button"
                        disabled={useLoading || refetching || selectedItem.quantity === 0}
                        onClick={() => handleUseItem(selectedItem.itemId)}
                        className="w-full rounded-[4px] border border-accent bg-accent py-2 text-[12px] font-bold tracking-[0.05em] text-bg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {useLoading ? "使用中…" : "USE [E]"}
                      </button>

                      {useResult && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="space-y-1 rounded-[4px] border border-accent/20 bg-accent/[0.06] p-2.5 text-[11px]"
                        >
                          <div className="font-bold text-accent">使用しました</div>
                          <div className="text-text-faint">
                            <span className="capitalize">{useResult.attribute}</span> 属性に{" "}
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
                          className="rounded-[4px] border border-pink/20 bg-pink/[0.06] p-2.5 text-[11px] text-pink"
                        >
                          {useError.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3.5 rounded-[4px] border border-line bg-bg-elev-2 p-2.5 text-[11px] leading-relaxed text-text-faint">
                      このアイテムは{" "}
                      <Link className="text-accent underline underline-offset-2" href="/monsters">
                        モンスター画面
                      </Link>{" "}
                      で進化・覚醒に使用します。
                    </p>
                  )}
                </>
              ) : (
                <div className="text-[11px] leading-relaxed text-text-faint">
                  no item selected
                  <br />
                  <span className="opacity-60">click a slot to inspect</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainWrapper>
  );
}

function Slot({
  item,
  selected,
  hotIdx,
  onSelect,
}: {
  item: InventoryItem | null;
  selected: boolean;
  hotIdx?: number;
  onSelect: () => void;
}) {
  if (!item) {
    return (
      <div
        aria-hidden
        className="aspect-square rounded-[4px] border border-dashed border-line"
      />
    );
  }
  const rune = isRuneItem(item);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${item.name} ×${item.quantity}`}
      aria-pressed={selected}
      className="relative flex aspect-square items-center justify-center rounded-[4px] border transition-shadow"
      style={{
        background: selected ? "var(--bg-elev)" : "var(--bg-elev-2)",
        borderColor: selected
          ? "rgba(126,231,135,0.55)"
          : rune
            ? "var(--rune-border)"
            : "var(--line)",
        boxShadow: selected
          ? "0 0 0 2px rgba(126,231,135,0.15), inset 0 0 12px rgba(126,231,135,0.14)"
          : "none",
      }}
    >
      {hotIdx != null && (
        <span className="pointer-events-none absolute left-1 top-0.5 text-[9px] leading-none text-text-faint">
          {hotIdx}
        </span>
      )}
      {rune && (
        <span className="pointer-events-none absolute right-0.5 top-0.5 text-[8px] leading-none">
          💎
        </span>
      )}
      <ItemVisual
        alt={item.name}
        assetUrl={item.assetUrl}
        className="size-full"
        imageClassName="p-1"
        sizes="48px"
      />
      <span
        className="pointer-events-none absolute bottom-0.5 right-1 text-[10px] font-bold leading-none tabular-nums text-text"
        style={{ textShadow: "1px 1px 0 #000" }}
      >
        {item.quantity}
      </span>
    </button>
  );
}
