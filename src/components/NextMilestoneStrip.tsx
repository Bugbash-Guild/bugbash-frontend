import Link from "next/link";

import { RARITY_COLOR } from "@/constants/rarity";
import { buildNextMilestone, type NextMilestone } from "@/lib/nextMilestone";
import type { Monster } from "@/types/monster";

/**
 * 「次の節目」1行。マージも未読報酬も無い日でも、home に向かう先の事実と
 * 押せるリンクが残るようにする。
 *
 * 出すのは home が既に持っているデータから導ける事実だけで、新しい API は
 * 呼ばない（選び方の詳細は src/lib/nextMilestone.ts）。図鑑の未発見枠は
 * /monsters と同じく「???」のまま伏せ、リンク先も名声圏（図鑑 /
 * リーダーボード）だけ — ここから課金導線は張らない。
 */
function milestoneBody(milestone: NextMilestone) {
  switch (milestone.kind) {
    case "dex-next":
      return (
        <>
          図鑑{" "}
          <b className="tabular-nums text-text">
            {milestone.discovered}/{milestone.total}
          </b>
          <span className="mx-1.5 text-text-faint">—</span>
          次の未発見:{" "}
          <span
            className="text-[9px] font-bold"
            style={{ color: RARITY_COLOR[milestone.rarity] ?? "var(--text-faint)" }}
          >
            {milestone.rarity}
          </span>{" "}
          <span className="text-text-faint">???</span>
          {milestone.prAcquirable && (
            <span className="text-text-faint">（PR マージで出会えます）</span>
          )}
        </>
      );
    case "dex-summon-only":
      return (
        <>
          図鑑{" "}
          <b className="tabular-nums text-text">
            {milestone.discovered}/{milestone.total}
          </b>
          <span className="mx-1.5 text-text-faint">—</span>
          未発見はのこり{" "}
          <b className="tabular-nums text-text">{milestone.remaining}</b> 体
          <span className="text-text-faint">（いずれも召喚専用）</span>
        </>
      );
    case "level":
      return (
        <>
          Lv.<b className="tabular-nums text-text">{milestone.nextLevel}</b> まであと{" "}
          <b className="tabular-nums text-accent">
            {milestone.xpToNext.toLocaleString("ja-JP")}
          </b>{" "}
          XP
        </>
      );
  }
}

const MILESTONE_LINK: Record<NextMilestone["kind"], { href: string; label: string }> = {
  "dex-next": { href: "/monsters", label: "図鑑を見る" },
  "dex-summon-only": { href: "/monsters", label: "図鑑を見る" },
  level: { href: "/leaderboard", label: "リーダーボードを見る" },
};

export function NextMilestoneStrip({
  heroLevel,
  loading,
  monsters,
  ownedDegraded,
  xpToNextLevel,
}: {
  heroLevel: number | null | undefined;
  /** 図鑑データの取得中は出さない（level→dex に差し替わるチラつきを防ぐ）。 */
  loading: boolean;
  monsters: Monster[];
  ownedDegraded: boolean;
  xpToNextLevel: number | null | undefined;
}) {
  if (loading) return null;

  const milestone = buildNextMilestone({
    heroLevel,
    monsters,
    ownedDegraded,
    xpToNextLevel,
  });
  if (milestone == null) return null;

  const link = MILESTONE_LINK[milestone.kind];

  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-line bg-bg-elev px-4 py-3">
      <p className="text-[12px] text-text-dim">
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-faint">
          NEXT
        </span>
        <span className="mx-2 text-text-faint">·</span>
        {milestoneBody(milestone)}
      </p>
      <Link
        className="shrink-0 text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
        href={link.href}
      >
        {link.label} →
      </Link>
    </div>
  );
}
