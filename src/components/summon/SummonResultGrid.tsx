"use client";

import { useEffect, useState } from "react";

import { ItemVisual } from "@/components/ItemVisual";
import { cn } from "@/lib/cn";
import {
  countSummonItemsSrOrAbove,
  getSummonItemDisplay,
} from "@/lib/summonDisplay";
import type { ItemRarity } from "@/types/summon";

export type SummonResultGridItem = {
  assetUrl?: string | null;
  isNew?: boolean;
  itemId: string;
  rarity: ItemRarity;
};

/**
 * レア度ごとの枠色。限定結果モーダルで使っていた RARITY_CLASS を踏襲し、
 * SSR は gold 枠で強調する。レア度を実際より高く見せる色は使わない。
 */
const RARITY_CLASS: Record<ItemRarity, string> = {
  N: "border-line text-text-dim",
  R: "border-accent-2/50 text-accent-2",
  SR: "border-purple/50 text-purple",
  SSR: "border-gold/60 text-gold",
};

/*
 * SR/SSR セルだけ一拍遅らせるフェードイン遅延（ms）。
 *
 * 結果はこのコンポーネントが受け取った時点で**サーバ確定済みの事実**であり、
 * この遅延はその見せ方だけ。抽選にも結果にも一切影響しない
 * （疑似リーチや、結果が変わるように見える演出は作らない）。
 * 上のサマリ行が SR 以上の件数を最初から開示しているので、
 * フェードインは「溜め」ではなく単なる強調にとどまる。
 * 限定モーダルの「900ms → クリックで即開」と同じ作法で、
 * クリックすれば即座に全表示になる。
 */
const REVEAL_DELAY_MS: Record<ItemRarity, number> = {
  N: 0,
  R: 0,
  SR: 120,
  SSR: 240,
};

type SummonResultGridProps = {
  /** サーバが返した召喚結果（表示はこの配列の事実のみ）。 */
  items: SummonResultGridItem[];
};

/**
 * 召喚結果グリッド。通常召喚（summon/page.tsx）と限定召喚
 * （LimitedSummonResultModal）で二重実装だった結果表示の共通化。
 * grid-cols-2 sm:grid-cols-5、各セルにアイテム名、NEW バッジ、
 * 上部に「SR以上 N件」のサマリ行（0件なら出さない）。
 */
export function SummonResultGrid({ items }: SummonResultGridProps) {
  // マウント直後に true へ倒し、CSS transition でフェードインさせる
  const [entered, setEntered] = useState(false);
  // クリックでリビールをスキップして即全表示にする
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const srOrAboveCount = countSummonItemsSrOrAbove(items);

  return (
    // クリックはフェードインの省略のみ（内容は最初から DOM にあり、
    // 支援技術やコピー操作からは常に全件見えている）
    <div onClick={() => setSkipped(true)}>
      {srOrAboveCount > 0 && (
        <div className="mb-2 text-[11px]">
          <span className="inline-block border border-purple/40 bg-purple/10 px-2 py-0.5 font-semibold text-purple">
            SR以上 {srOrAboveCount}件
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {items.map((item, index) => {
          const display = getSummonItemDisplay(item.itemId, item.assetUrl);
          const delayMs = REVEAL_DELAY_MS[item.rarity];
          const delayed = delayMs > 0 && !skipped;
          return (
            <div
              className={cn(
                "min-h-32 border bg-bg p-3 text-center",
                RARITY_CLASS[item.rarity],
                delayMs > 0 &&
                  "transition-opacity duration-300 motion-reduce:transition-none",
                delayed && !entered && "opacity-0",
                skipped && "transition-none",
              )}
              key={`${item.itemId}-${index}`}
              style={delayed ? { transitionDelay: `${delayMs}ms` } : undefined}
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
    </div>
  );
}
