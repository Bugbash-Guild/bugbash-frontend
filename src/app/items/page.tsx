"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useItems";
import { MainWrapper } from "@/components/MainWrapper";
import type { Item } from "@/types/item";

const ROWS = 4;
const COLS = 12;
const STORAGE_SLOTS = ROWS * COLS;
const HOTBAR_SLOTS = 12;

export default function ItemsPage() {
  const { isAuthenticated } = useAuth();
  const { items, loading, error } = useItems();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hotbarSelected, setHotbarSelected] = useState<number>(0);

  const storageSlots: (Item | null)[] = Array.from({ length: STORAGE_SLOTS }, (_, i) => items[i] ?? null);
  const hotbarSlots: (Item | null)[] = Array.from({ length: HOTBAR_SLOTS }, (_, i) => items[i] ?? null);

  const totalQty = items.reduce((a, b) => a + b.qty, 0);
  const occupied = items.length;

  const selectedItem =
    selectedIdx !== null ? storageSlots[selectedIdx] : hotbarSlots[hotbarSelected];

  return (
    <MainWrapper>
      <div className="px-9 py-6">
        {/* prompt header */}
        <div className="text-[13px] text-text-dim mb-5">
          <span className="text-accent">{isAuthenticated ? "hero" : "guest"}@bugbash</span>
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
          {/* LEFT: storage + hotbar — flex-1 to fill all available width */}
          <div className="bg-bg-elev border border-line rounded-[6px] p-3.5 flex-1 min-w-0">
            <div className="text-[10px] text-text-faint tracking-[0.12em] mb-2.5">STORAGE</div>

            {/* 4×12 grid — 1fr columns fill the card width */}
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
                    }}
                  />
                );
              })}
            </div>

            {/* HOTBAR — same 12-column grid */}
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
                {/* large artwork */}
                <div
                  className="w-full aspect-square rounded-[4px] flex items-center justify-center text-[96px] mb-4 border border-line"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 40%, rgba(126,231,135,0.1) 0%, transparent 70%), var(--bg-elev-2)",
                  }}
                >
                  {selectedItem.emoji}
                </div>

                {/* name + type badge */}
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
                    ITEM
                  </span>
                </div>

                {/* flavor text */}
                <div className="text-[11px] text-text-faint leading-[1.65] mb-3">
                  所持アイテム。使用すると即時効果が発動する。
                </div>

                <div className="border-t border-line my-3" />

                {/* stats table */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-faint">qty</span>
                    <span className="text-accent font-bold">×{selectedItem.qty}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-faint">type</span>
                    <span className="text-text-dim">消耗品</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-faint">rarity</span>
                    <span style={{ color: "var(--purple)" }}>★★☆☆</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-faint">weight</span>
                    <span className="text-text-dim">0.1 kg</span>
                  </div>
                </div>

                <div className="border-t border-line my-3" />

                {/* effect box */}
                <div
                  className="rounded-[4px] p-2.5 mb-4 text-[10px] leading-[1.75]"
                  style={{ background: "var(--bg-elev-2)", border: "1px solid var(--line)" }}
                >
                  <div className="text-[9px] text-text-faint tracking-[0.12em] mb-1.5">EFFECT</div>
                  <div className="text-text-dim">
                    経験値 <span className="text-accent font-bold">+100 XP</span>
                  </div>
                  <div className="text-text-faint/70 text-[10px] mt-0.5">
                    即時発動 · 取り消し不可
                  </div>
                </div>

                {/* actions */}
                <button className="w-full py-2.5 bg-accent text-bg text-[12px] font-bold tracking-[0.05em] rounded-[4px] hover:opacity-90 transition-opacity">
                  USE [E]
                </button>
                <button
                  className="mt-2 w-full py-2 text-[11px] text-text-faint tracking-[0.05em] rounded-[4px] border border-line hover:border-line-strong hover:text-text-dim transition-colors"
                >
                  DISCARD [Del]
                </button>
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
  item: Item | null;
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
          <span className="text-[28px] select-none leading-none">{item.emoji}</span>
          <span
            className="absolute bottom-0.5 right-1 text-[10px] font-bold leading-none"
            style={{ textShadow: "1px 1px 0 #000" }}
          >
            {item.qty}
          </span>
        </>
      )}
    </div>
  );
}
