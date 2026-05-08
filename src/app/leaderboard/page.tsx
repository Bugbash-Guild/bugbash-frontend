"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { MainWrapper } from "@/components/MainWrapper";

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
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { entries, loading } = useLeaderboard(isAuthenticated);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-text-dim text-[13px]">
          <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
          authenticating…
        </div>
      </div>
    );
  }

  return (
    <MainWrapper>
      <div className="px-9 py-6 min-h-screen">
        {/* header */}
        <div className="text-[13px] text-text-dim mb-4">
          <span className="text-accent">root@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/leaderboard</span>
          <span className="text-text-faint">$ </span>
          <span>./rank --all --sort xp</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        {loading ? (
          <div className="text-text-faint text-[13px]">loading leaderboard…</div>
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
              <div className="px-4 py-8 text-[13px] text-text-faint text-center">
                まだデータがありません
              </div>
            )}

            {entries.map((entry) => {
              const rankColor = RANK_COLORS[entry.rank] ?? "var(--text-dim)";
              const glyph = RANK_GLYPHS[entry.rank] ?? "·";
              const login = entry.githubLogin ?? entry.heroId;

              return (
                <div
                  key={entry.heroId}
                  className="grid px-4 py-3 border-b border-line last:border-b-0 items-center hover:bg-bg-elev-2 transition-colors"
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
                    <span className="text-[13px] text-text truncate">{login}</span>
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
                      <span className="text-gold">{entry.streakDays}d 🔥</span>
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
    </MainWrapper>
  );
}
