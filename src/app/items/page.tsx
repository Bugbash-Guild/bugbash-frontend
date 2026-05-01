"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useItems";
import { MainWrapper } from "@/components/MainWrapper";
import type { Item } from "@/types/item";

const ROWS = 4;
const COLS = 9;
const STORAGE_SLOTS = ROWS * COLS;
const HOTBAR_SLOTS = 9;

export default function ItemsPage() {
  const { isAuthenticated } = useAuth();
  const { items, loading, error } = useItems();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hotbarSelected, setHotbarSelected] = useState<number>(0);

  // fill storage slots
  const storageSlots: (Item | null)[] = Array.from({ length: STORAGE_SLOTS }, (_, i) => items[i] ?? null);
  // hotbar = first 9 items
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

        {/* main layout */}
        <div className="flex gap-6 items-start">
          {/* LEFT: storage + hotbar card */}
          <div className="bg-bg-elev border border-line rounded-[6px] p-3.5 shrink-0">
            {/* STORAGE label */}
            <div className="text-[10px] text-text-faint tracking-[0.12em] mb-2.5">STORAGE</div>

            {/* 4×9 grid */}
            <div className="flex flex-col gap-1">
              {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} className="flex gap-1">
                  {Array.from({ length: COLS }).map((_, c) => {
                    const idx = r * COLS + c;
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
              ))}
            </div>

            {/* HOTBAR divider */}
            <div className="mt-4 pt-3.5 border-t border-line">
              <div className="text-[10px] text-text-faint tracking-[0.12em] mb-2.5">HOTBAR · 1–9</div>
              <div className="flex gap-1">
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

          {/* RIGHT: selected item panel */}
          <div className="bg-bg-elev border border-line rounded-[6px] p-5 w-[200px] shrink-0">
            <div className="text-[10px] text-text-faint tracking-[0.12em] mb-3.5">SELECTED</div>

            {selectedItem ? (
              <>
                {/* portrait */}
                <div className="w-full aspect-square max-h-[140px] bg-bg-elev-2 border border-line rounded-[4px] flex items-center justify-center text-[72px] mb-3.5">
                  {selectedItem.emoji}
                </div>
                {/* name */}
                <div className="text-[14px] font-semibold mb-1">{selectedItem.name}</div>
                {/* qty */}
                <div className="flex justify-between text-[11px] text-text-faint mt-3">
                  <span>qty</span>
                  <span className="text-accent">×{selectedItem.qty}</span>
                </div>
                {/* use button */}
                <button className="mt-3.5 w-full py-2.5 bg-accent text-bg text-[12px] font-bold tracking-[0.05em] rounded-[4px] hover:opacity-90 transition-opacity">
                  USE [E]
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
      className="w-16 h-16 rounded-[4px] flex items-center justify-center relative cursor-pointer transition-all duration-[80ms]"
      style={{
        background: selected ? "var(--bg-elev)" : "var(--bg-elev-2)",
        border: `1px ${item ? "solid" : "dashed"} ${selected ? "rgba(126,231,135,0.55)" : "var(--line)"}`,
        boxShadow: selected ? "0 0 0 1px rgba(126,231,135,0.22), inset 0 0 12px rgba(126,231,135,0.1)" : "none",
      }}
    >
      {item && (
        <>
          <span className="text-[30px] select-none leading-none">{item.emoji}</span>
          <span
            className="absolute bottom-0.5 right-1 text-[11px] font-bold leading-none"
            style={{ textShadow: "1px 1px 0 #000" }}
          >
            {item.qty}
          </span>
        </>
      )}
    </div>
  );
}
