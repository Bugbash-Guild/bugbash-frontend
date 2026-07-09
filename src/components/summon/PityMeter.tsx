"use client";

import { buildPityMeterPresentation } from "@/lib/summonPity";
import type { PityCounterResponse, SummonDisclosureResponse } from "@/types/summon";

type PityMeterProps = {
  disclosure: SummonDisclosureResponse | null;
  error?: string | null;
  loading?: boolean;
  pity: PityCounterResponse | null;
};

const BAR_TONE_CLASS = {
  hard: "bg-pink",
  normal: "bg-accent-dim",
  soft: "bg-gold",
} as const;

const BADGE_TONE_CLASS = {
  hard: "border-pink/40 bg-pink/10 text-pink",
  normal: "border-line bg-bg text-text-faint",
  soft: "border-gold/40 bg-gold/10 text-gold",
} as const;

export function PityMeter({ disclosure, error, loading = false, pity }: PityMeterProps) {
  if (loading) {
    return <div className="h-28 border border-line bg-bg-elev" />;
  }

  if (error) {
    return (
      <div className="border border-pink/30 bg-pink/10 p-3 text-[12px] text-pink">
        天井情報を読み込めませんでした。
      </div>
    );
  }

  if (!pity || !disclosure) {
    return (
      <div className="border border-line bg-bg-elev p-4 text-[12px] text-text-faint">
        天井情報を確認しています。
      </div>
    );
  }

  const presentation = buildPityMeterPresentation(pity, disclosure);

  return (
    <div className="border border-line rounded p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.12em] text-text-faint">
        PITY COUNTER
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[32px] font-semibold tabular-nums text-text">
          {pity.pullCount}
        </span>
        <span className="text-[13px] text-text-dim">
          / {presentation.hardPityPull.toLocaleString("ja-JP")} pulls
        </span>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-elev-2">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            BAR_TONE_CLASS[presentation.tone],
          ].join(" ")}
          style={{ width: `${presentation.progressPercent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={["border px-2 py-0.5", BADGE_TONE_CLASS[presentation.tone]].join(" ")}>
          {presentation.label}
        </span>
        {presentation.softPityText && (
          <span className="border border-line bg-bg px-2 py-0.5 text-text-faint">
            {presentation.softPityText}
          </span>
        )}
      </div>
    </div>
  );
}
