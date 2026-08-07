"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SummonResultGrid,
  type SummonResultGridItem,
} from "@/components/summon/SummonResultGrid";
import { SUMMON_CURRENCY_SYMBOL } from "@/lib/summonDisplay";
import {
  buildSummonResultPityText,
  formatSummonCurrencyCost,
} from "@/lib/summonPity";
import type { SummonDisclosureResponse } from "@/types/summon";

export type LimitedResultItem = SummonResultGridItem;

export type LimitedResultDisplay = {
  items: LimitedResultItem[];
  newPullCount?: number;
  reconciled: boolean;
  runesRemaining?: number;
};

type LimitedSummonResultModalProps = {
  onClose: () => void;
  /**
   * 天井残数の算出用（パス加入者は短縮後の値を渡す）。
   * 未着なら null で、残数の代わりに生カウンタの事実だけを出す。
   */
  pityDisclosure: Pick<
    SummonDisclosureResponse,
    "guaranteeType" | "hardPityPull" | "softPityPull"
  > | null;
  result: LimitedResultDisplay;
};

export function LimitedSummonResultModal({
  onClose,
  pityDisclosure,
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

            {/* 結果グリッドは通常召喚と共通（SR以上サマリ・レア別リビール込み） */}
            <SummonResultGrid items={result.items} />

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-text-faint">
              {/* 生カウンタ「pity: N pulls」は引き算を利用者に強いる。
                  メーターと同じ計算で「天井まであとN回」と言い切る。 */}
              {result.newPullCount != null && (
                <span>
                  {buildSummonResultPityText(
                    result.newPullCount,
                    pityDisclosure,
                  )}
                </span>
              )}
              {result.runesRemaining != null && (
                // 通貨記号は summonDisplay の辞書に統一（通常側の ◈ との揺れ解消）
                <span>
                  残高: {SUMMON_CURRENCY_SYMBOL.RUNE}{" "}
                  {formatSummonCurrencyCost(result.runesRemaining, "RUNE")}
                </span>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                className="flex-1 border border-accent/40 py-2 text-center text-[12px] text-accent transition-colors hover:bg-accent/[0.08]"
                href="/monsters"
              >
                図鑑で確認 →
              </Link>
              <button
                className="flex-1 border border-line py-2 text-[12px] text-text-dim hover:border-accent hover:text-accent"
                onClick={onClose}
                type="button"
              >
                続けて引く
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
