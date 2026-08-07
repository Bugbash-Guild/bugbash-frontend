"use client";

import Link from "next/link";

import { useBadgeProgress } from "@/hooks/useBadges";
import { pickNearestBadgeMilestone } from "@/lib/badgeMilestone";

/**
 * home の実績進捗1行。/badges への入口がプロフィール経由の単線だったのを、
 * ここを2本目として解消する（UX-BLUEPRINT §2 / §5「実績進捗1行」）。
 *
 * データは /api/heroes/me/badges/progress の 1 リクエストだけ
 * （BadgeProgress はカタログ相当の displayName / tiers を含むため単独で足りる。
 * /badges が使う catalog / level-defs は home に持ち込まない）。
 *
 * 出すのは「次に到達が近い（残り最小の）バッジ 1 件」だけで、数値は API の
 * 実数のみ（選び方は src/lib/badgeMilestone.ts）。残りの単位はバッジごとに
 * 違う（PR数・日数・召喚回数など category 依存）ため、ここでは単位を
 * 名乗らず「あと N」にとどめ、内訳の説明は /badges 側に委ねる。
 * 期限・煽りは付けない（NextMilestoneStrip と同方針）。
 */
export function BadgeProgressStrip({ enabled }: { enabled: boolean }) {
  const { error, loading, progress } = useBadgeProgress(enabled);

  // 取得中は出さない（後から差し替わるチラつきを防ぐ。NextMilestoneStrip と同じ）
  if (loading) return null;
  // バッジ定義がそもそも無い環境では行ごと出さない（空の /badges へ誘わない）
  if (error == null && progress.length === 0) return null;

  // 取得に失敗しても /badges への入口自体は残す。その場合は数値を出さない
  // （読めなかった値を推測で埋めない＝静的1行に落とす）。全 Tier 到達済み
  // などで候補が無いときも同じ静的1行になる。
  const milestone = error == null ? pickNearestBadgeMilestone(progress) : null;

  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-line bg-bg-elev px-4 py-3">
      <p className="text-[12px] text-text-dim">
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-faint">
          BADGE
        </span>
        <span className="mx-2 text-text-faint">·</span>
        {milestone ? (
          <>
            {milestone.displayName}
            <span className="mx-1.5 text-text-faint">—</span>
            Tier <b className="tabular-nums text-text">{milestone.nextTier}</b>{" "}
            まであと{" "}
            <b className="tabular-nums text-accent">
              {milestone.remaining.toLocaleString("ja-JP")}
            </b>
            <span className="text-text-faint">
              （{milestone.counter.toLocaleString("ja-JP")}/
              {milestone.nextThreshold.toLocaleString("ja-JP")}）
            </span>
          </>
        ) : (
          <>GitHub 活動の実績（バッジ）</>
        )}
      </p>
      <Link
        className="shrink-0 text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
        href="/badges"
      >
        実績を見る →
      </Link>
    </div>
  );
}
