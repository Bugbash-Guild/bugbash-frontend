"use client";

import Link from "next/link";

import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ConsoleEmptyState } from "@/components/ConsoleEmptyState";
import { TermLoading } from "@/components/TermLoading";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const RANK_COLORS: Record<number, string> = {
  1: "var(--gold)",
  2: "#b0bec5",
  3: "#cd7f32",
};

const RANK_GLYPHS: Record<number, string> = {
  1: "◆",
  2: "◇",
  3: "▸",
};

export default function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const { entries, loading } = useLeaderboard(isAuthenticated);
  // heroId == githubId は確立済みの契約（home が /api/heroes/{githubId}/... を使用）
  const selfHeroId = user?.githubId ?? null;



  return (
    <>
      <ConsoleTopbar command="./rank --all --sort xp" path="~/leaderboard" showWallet />
      <div className="px-9 py-6 min-h-screen">

        {loading ? (
          <TermLoading lines={["query leaderboard --sort xp"]} />
        ) : (
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            {/* table header */}
            <div className="grid px-4 py-2.5 border-b border-line text-[10px] text-text-faint uppercase tracking-[0.12em]"
              style={{ gridTemplateColumns: "3rem 1fr 4rem 6rem 5rem" }}>
              <span>RANK</span>
              <span>HERO</span>
              <span className="text-right">LV</span>
              <span className="text-right">TOTAL XP</span>
              <span className="text-right">STREAK</span>
            </div>

            {entries.length === 0 && (
              <ConsoleEmptyState
                className="m-4"
                glyph="▲"
                message="まだランキングがありません。PR をマージした勇者から順に載ります。"
                action={{ label: "自分のホームへ", href: "/" }}
              />
            )}

            {entries.map((entry) => {
              const rankColor = RANK_COLORS[entry.rank] ?? "var(--text-dim)";
              const glyph = RANK_GLYPHS[entry.rank] ?? "·";
              const login = entry.githubLogin ?? entry.heroId;

              const isSelf = selfHeroId != null && entry.heroId === selfHeroId;
              return (
                <div
                  key={entry.heroId}
                  className={[
                    "grid px-4 py-3 border-b border-line last:border-b-0 items-center transition-colors",
                    isSelf
                      ? "border-l-2 border-l-accent bg-accent/[0.06]"
                      : "hover:bg-bg-elev-2",
                  ].join(" ")}
                  style={{ gridTemplateColumns: "3rem 1fr 4rem 6rem 5rem" }}
                >
                  {/* rank */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold" style={{ color: rankColor }}>
                      {glyph}
                    </span>
                    <span className="text-[12px] text-text-faint">{entry.rank}</span>
                  </div>

                  {/* hero */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 text-[12px] font-bold text-bg"
                      style={{ background: rankColor }}
                    >
                      {login[0]?.toUpperCase() ?? "?"}
                    </div>
                    <Link className="text-[13px] text-text truncate hover:text-accent" href={`/heroes/${encodeURIComponent(entry.heroId)}`}>{login}</Link>
                    {isSelf && (
                      <span className="shrink-0 rounded-[2px] border border-accent/40 bg-accent/[0.08] px-1.5 py-px text-[9px] font-bold tracking-[0.1em] text-accent">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* level */}
                  <div className="text-right text-[13px] font-semibold text-accent">
                    {entry.level}
                  </div>

                  {/* xp */}
                  <div className="text-right text-[13px] text-text-dim">
                    {entry.totalExperience.toLocaleString()}
                  </div>

                  {/* streak */}
                  <div className="text-right text-[12px] text-text-faint">
                    {entry.streakDays > 1 ? (
                      <span className="text-gold">{entry.streakDays}d active</span>
                    ) : (
                      <span>{entry.streakDays}d</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
