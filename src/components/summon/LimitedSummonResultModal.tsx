"use client";

import { useEffect, useState } from "react";

import { ItemVisual } from "@/components/ItemVisual";
import { getSummonItemDisplay } from "@/app/summon/summonDisplay";
import type { ItemRarity } from "@/types/summon";

export type LimitedResultItem = {
  assetUrl?: string | null;
  isNew?: boolean;
  itemId: string;
  rarity: ItemRarity;
};

export type LimitedResultDisplay = {
  items: LimitedResultItem[];
  newPullCount?: number;
  reconciled: boolean;
  runesRemaining?: number;
};

const RARITY_CLASS: Record<ItemRarity, string> = {
  N: "border-line text-text-dim",
  R: "border-accent-2/50 text-accent-2",
  SR: "border-purple/50 text-purple",
  SSR: "border-gold/60 text-gold",
};

type LimitedSummonResultModalProps = {
  onClose: () => void;
  result: LimitedResultDisplay;
};

export function LimitedSummonResultModal({
  onClose,
  result,
}: LimitedSummonResultModalProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (revealed) onClose();
      else setRevealed(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, revealed]);

  return (
    <div
      aria-labelledby="limited-result-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto border border-line bg-bg-elev p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              LIMITED SUMMON RESULT
            </div>
            <h2
              className="text-[17px] font-semibold text-text"
              id="limited-result-title"
            >
              {revealed ? "召喚結果" : "召喚結果を展開中…"}
            </h2>
          </div>
          {!revealed && (
            <button
              className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              onClick={() => setRevealed(true)}
              type="button"
            >
              演出をスキップ
            </button>
          )}
        </div>

        {!revealed ? (
          <div className="relative h-44 overflow-hidden border border-line bg-bg">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gold motion-safe:animate-pulse" />
            <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-text-faint">
              resolving summon data
            </div>
          </div>
        ) : (
          <>
            {result.reconciled && (
              <div className="mb-4 border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] leading-5 text-accent">
                通信後の限定召喚履歴から結果を確認しました。
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {result.items.map((item, index) => {
                const display = getSummonItemDisplay(
                  item.itemId,
                  item.assetUrl,
                );
                return (
                  <div
                    className={`min-h-32 border bg-bg p-3 text-center ${RARITY_CLASS[item.rarity]}`}
                    key={`${item.itemId}-${index}`}
                  >
                    <ItemVisual
                      alt={display.name}
                      assetUrl={display.assetUrl}
                      className="mx-auto size-12"
                      sizes="48px"
                    />
                    <div className="mt-2 text-[10px] font-semibold">
                      {item.rarity}
                    </div>
                    <div className="mt-1 break-words text-[11px] leading-4 text-text">
                      {display.name}
                    </div>
                    {item.isNew && (
                      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-accent">
                        NEW
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-text-faint">
              {result.newPullCount != null && (
                <span>pity: {result.newPullCount} pulls</span>
              )}
              {result.runesRemaining != null && (
                <span>
                  残高: {result.runesRemaining.toLocaleString("ja-JP")} RUNE
                </span>
              )}
            </div>

            <button
              className="mt-5 w-full border border-line py-2 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              onClick={onClose}
              type="button"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
