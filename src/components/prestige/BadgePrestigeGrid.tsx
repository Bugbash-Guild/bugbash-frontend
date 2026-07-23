import { FiAward, FiLock } from "react-icons/fi";
import Link from "next/link";

import { BADGE_PRESTIGE_COPY, getBadgeProgressRatio } from "@/lib/badges";
import type { BadgeProgress } from "@/types/badge";
import type { CommemorativeAchievement } from "@/types/commemorativeMint";

type BadgePrestigeGridProps = {
  badges: BadgeProgress[];
  loading: boolean;
  mintReadyAchievements?: readonly CommemorativeAchievement[];
};

const BADGE_MINT_ACHIEVEMENTS: Partial<Record<string, CommemorativeAchievement>> = {
  codex_keeper: "CODEX_COMPLETE",
  maxed_one: "MONSTER_LEVEL_100",
  pr_slayer: "PR_MERGED_100",
};

export function BadgePrestigeGrid({ badges, loading, mintReadyAchievements = [] }: BadgePrestigeGridProps) {
  return (
    <section
      aria-labelledby="badge-prestige-heading"
      className="border-y border-line bg-bg-elev"
    >
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-9">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-gold">
              ACHIEVEMENTS / PRESTIGE
            </div>
            <h2
              id="badge-prestige-heading"
              className="mt-1 text-[17px] font-semibold text-text"
            >
              実績と名声
            </h2>
          </div>
          <p className="border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] text-gold">
            {BADGE_PRESTIGE_COPY}
          </p>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse border border-line bg-bg"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => {
              const earned = badge.earnedAt != null;
              const progressRatio = getBadgeProgressRatio(badge);
              const achievement = BADGE_MINT_ACHIEVEMENTS[badge.code];
              const mintReady = achievement != null && mintReadyAchievements.includes(achievement);
              return (
                <article
                  key={badge.code}
                  className="border border-line bg-bg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "flex size-10 shrink-0 items-center justify-center border",
                        earned
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-line bg-bg-elev text-text-faint",
                      ].join(" ")}
                    >
                      {earned ? (
                        <FiAward aria-hidden size={19} />
                      ) : (
                        <FiLock aria-hidden size={17} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="break-words text-[13px] font-semibold text-text">
                          {badge.displayName}
                        </h3>
                        <span className="border border-line px-2 py-0.5 text-[10px] text-text-dim">
                          {badge.currentTier > 0
                            ? `TIER ${badge.currentTier}`
                            : "LOCKED"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-text-dim">
                        {badge.description}
                      </p>
                      {mintReady && (
                        <Link
                          className="mt-2 inline-flex items-center text-[10px] text-gold hover:underline"
                          href="/mints"
                        >
                          🔨 鋳造可能
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="text-text-faint">現在値</span>
                      <span className="text-text">
                        {badge.counter.toLocaleString("ja-JP")}
                        {badge.nextThreshold == null
                          ? " / 最高ティア"
                          : ` / 次 ${badge.nextThreshold.toLocaleString("ja-JP")}`}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden bg-bg-elev-2">
                      <div
                        aria-label={`${badge.displayName}の進捗 ${Math.round(progressRatio * 100)}%`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={Math.round(progressRatio * 100)}
                        className="h-full bg-gold"
                        role="progressbar"
                        style={{ width: `${progressRatio * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-text-faint">
                      獲得条件: {badge.description}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
