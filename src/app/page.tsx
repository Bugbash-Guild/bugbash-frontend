"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useActivities, isMonsterDetail, isPrMergedMetadata, isXpDetail } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useMonsters } from "@/hooks/useMonsters";
import { useRewardNotification } from "@/hooks/useRewardNotification";
import { GameAssetFallback } from "@/components/GameAssetFallback";
import { MainWrapper } from "@/components/MainWrapper";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RewardModal } from "@/components/RewardModal";

import { RARITY_COLOR } from "@/constants/rarity";

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

const HERO_ASCII = [
  "    ╔═══╗    ",
  "    ║ ◆ ║    ",
  "    ╚═══╝    ",
  "   /|   |\\   ",
  "  / | <> | \\ ",
  " /  |   |  \\ ",
  "    |   |    ",
  "   /     \\   ",
  "  /       \\  ",
];

function GithubAppBanner() {
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : "#";

  return (
    <div className="mb-4 border border-gold/40 rounded-[6px] p-3.5 flex items-center justify-between gap-4"
      style={{ background: "rgba(227,179,65,0.06)" }}>
      <div>
        <div className="text-[12px] font-semibold text-gold">GitHub App をインストールしてください</div>
        <div className="text-[11px] text-text-faint mt-0.5">
          PRをマージするとXPを獲得できます。インストールすることで自動的に追跡が開始されます。
        </div>
      </div>
      <a
        href={installUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-4 py-1.5 rounded text-[12px] font-semibold text-bg bg-gold hover:opacity-90 transition-opacity"
      >
        インストール
      </a>
    </div>
  );
}

function DevPanel({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleGrant() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dev/grant-resources", { method: "POST" });
      const data = await res.json() as Record<string, unknown>;
      if (res.ok) {
        const coins = typeof data.guildCoinGranted === "number" ? data.guildCoinGranted : "?";
        const souls = typeof data.soulsGrantedPerAttribute === "number" ? data.soulsGrantedPerAttribute : "?";
        setMsg(`+${coins} GUILD_COIN · +${souls} souls/attr · items added`);
        onSuccess();
      } else {
        setMsg(`Error: ${String(data.error ?? res.status)}`);
      }
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 border border-dashed border-line rounded p-3 text-[11px]">
      <div className="text-[9px] uppercase tracking-[0.12em] text-text-faint mb-2">
        DEV TOOLS
      </div>
      <button
        onClick={() => void handleGrant()}
        disabled={loading}
        className="px-3 py-1 border border-accent text-accent rounded text-[11px] hover:bg-accent hover:text-bg disabled:opacity-40 transition-colors"
      >
        {loading ? "付与中…" : "[ リソース付与 +10k coins +500 souls ]"}
      </button>
      {msg && <div className="mt-2 text-text-dim">{msg}</div>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { hero, loading: heroLoading, refetch: refetchHero } = useHero(isAuthenticated);
  const { monsters } = useMonsters();
  const { activities, loading: activitiesLoading } = useActivities();
  const { unread, acknowledge } = useRewardNotification(isAuthenticated);

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

  const username = user?.username ?? "hero";
  const pct = hero ? (hero.progressRatio * 100).toFixed(1) : "0.0";
  const filledSegments = hero ? Math.round(hero.progressRatio * 60) : 0;

  return (
    <>
    <MainWrapper>
      <div className="px-9 py-6 min-h-screen">
        {/* prompt header */}
        <div className="text-[13px] text-text-dim mb-4">
          <span className="text-accent">{username}@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/home</span>
          <span className="text-text-faint">$ </span>
          <span>./hero --render --interactive</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        {process.env.NODE_ENV === "development" && (
          <DevPanel onSuccess={() => void refetchHero()} />
        )}

        {/* GitHub App install banner */}
        {!heroLoading && hero && !hero.hasGithubAppInstalled && (
          <GithubAppBanner />
        )}

        {/* GitHub App manage link — shown when already installed */}
        {!heroLoading && hero?.hasGithubAppInstalled && (
          <div className="text-[11px] text-text-faint text-right mb-3">
            <a
              href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? ""}/installations/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-dim transition-colors"
            >
              + GitHub App にリポジトリを追加
            </a>
          </div>
        )}

        {heroLoading || !hero ? (
          <div className="text-text-faint text-[13px]">loading hero…</div>
        ) : (
          <>
            {/* HERO PANEL */}
            <div className="bg-bg-elev border border-line rounded-lg p-6 grid gap-7 mb-3.5 relative overflow-hidden"
              style={{ gridTemplateColumns: "auto 1fr" }}>
              {/* ambient glow */}
              <div className="absolute -top-28 -right-24 w-80 h-80 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(126,231,135,0.1), transparent 60%)" }} />

              {/* LEFT: hero card */}
              <div className="w-[240px] min-h-[340px] rounded-[10px] border border-line-strong relative overflow-hidden flex flex-col"
                style={{
                  background: "linear-gradient(180deg, var(--bg-elev-2) 0%, var(--bg) 100%)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 0 30px rgba(126,231,135,0.07)",
                }}>
                {/* level pill */}
                <div className="absolute top-2.5 left-2.5 z-10 text-[9px] text-accent px-2 py-0.5 rounded-[2px] font-bold tracking-[0.12em]"
                  style={{ background: "rgba(11,15,13,0.8)", border: "1px solid rgba(126,231,135,0.33)" }}>
                  Lv.{hero.level}
                </div>
                {/* HERO badge */}
                <div className="absolute top-2.5 right-2.5 z-10 text-[9px] text-gold px-2 py-0.5 rounded-[2px] font-bold tracking-[0.12em]"
                  style={{ background: "rgba(11,15,13,0.8)", border: "1px solid rgba(227,179,65,0.33)" }}>
                  HERO
                </div>

                {/* hero art */}
                <div className="flex-1 flex items-center justify-center px-4 pt-10 pb-4 relative">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(126,231,135,0.13) 0%, transparent 70%)" }} />
                  </div>
                  <pre className="text-[13px] leading-[1.15] text-accent select-none relative z-10 whitespace-pre">
                    {HERO_ASCII.join("\n")}
                  </pre>
                </div>

                {/* name plate */}
                <div className="px-3.5 py-2.5 border-t border-line"
                  style={{ background: "rgba(11,15,13,0.67)" }}>
                  <div className="text-[16px] font-semibold text-text">{username}</div>
                  <div className="text-[12px] text-text-faint mt-1 tracking-[0.05em]">click to equip →</div>
                </div>
              </div>

              {/* RIGHT: HERO STATUS */}
              <div className="flex flex-col justify-between min-w-0 relative z-10">
                <div>
                  <div className="text-[11px] text-text-faint tracking-[0.16em] font-semibold">HERO STATUS</div>
                  <div className="flex items-baseline gap-3.5 mt-1.5">
                    <div className="text-[80px] font-bold leading-none tracking-[-0.04em] text-text">
                      Lv<span className="text-accent">.{hero.level}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold text-accent border border-accent/[0.27]"
                      style={{ background: "rgba(126,231,135,0.094)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"
                        style={{ boxShadow: "0 0 6px #7ee787" }} />
                      ACTIVE
                    </div>
                  </div>
                  <div className="text-[13px] text-text-dim mt-2">
                    {hero.totalExperience.toLocaleString()} XP earned
                    <span className="text-text-faint mx-2">·</span>
                    {hero.totalPrsMerged} PRs merged
                    <span className="text-text-faint mx-2">·</span>
                    {hero.streakDays}d streak
                  </div>

                  {/* ATK / DEF / LUCK */}
                  <div className="flex gap-2.5 mt-4">
                    {[
                      { k: "ATK", v: 42, c: "var(--gold)" },
                      { k: "DEF", v: 46, c: "var(--accent-2)" },
                      { k: "LUCK", v: 36, c: "var(--purple)" },
                    ].map((s) => (
                      <div key={s.k} className="flex-1 px-3 py-2 bg-bg-elev-2 border border-line rounded">
                        <div className="text-[9px] text-text-faint tracking-[0.14em]">{s.k}</div>
                        <div className="text-[22px] font-semibold leading-[1.1] mt-0.5" style={{ color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XP progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-[14px] text-text-dim mb-2">
                    <span>
                      <span className="text-text font-semibold">{hero.currentLevelExperience}</span>
                      {" / "}{hero.experienceForNextLevel} XP
                    </span>
                    <span className="text-accent">{pct}%</span>
                  </div>
                  {/* 60-segment bar */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <span key={i} className="flex-1 h-2.5 rounded-[1px]"
                        style={{
                          background: i < filledSegments ? "var(--accent)" : "var(--bg-elev-2)",
                          boxShadow: i < filledSegments ? "0 0 5px rgba(126,231,135,0.67)" : "none",
                        }} />
                    ))}
                  </div>
                  <div className="text-[13px] text-text-faint mt-2">
                    <span className="text-text-dim">{hero.experienceToNextLevel} XP</span> to Lv.{hero.level + 1}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 2fr" }}>
              {/* 2×2 stat boxes */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "PRs merged",      value: String(hero.totalPrsMerged),  delta: "lifetime",                          color: "var(--accent)" },
                  { label: "monsters caught",  value: String(monsters.length || 0), delta: `${monsters.length || 0}/20 dex`,    color: "var(--purple)" },
                  { label: "SSR rate",         value: "4.2%",                       delta: "lifetime",                           color: "var(--gold)" },
                  { label: "streak",           value: `${hero.streakDays}d`,         delta: hero.streakDays > 1 ? "active" : "keep it up!", color: "var(--accent-2)" },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-elev border border-line rounded-[6px] px-3.5 py-3">
                    <div className="text-[11px] text-text-faint tracking-[0.1em] mb-2">{s.label.toUpperCase()}</div>
                    <div className="text-[32px] font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] text-text-dim mt-1.5">{s.delta}</div>
                  </div>
                ))}
              </div>

              {/* activity log */}
              <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-line flex items-center justify-between">
                  <span className="text-[10px] text-text-faint tracking-[0.12em]">git log --activity</span>
                  <span className="text-[10px] text-text-faint">{activities.length} events</span>
                </div>
                {activitiesLoading && (
                  <div className="px-3.5 py-4 text-[12px] text-text-faint">loading…</div>
                )}
                {!activitiesLoading && activities.length === 0 && (
                  <div className="px-3.5 py-4 text-[12px] text-text-faint">
                    まだアクティビティがありません — PRをマージしよう
                  </div>
                )}
                {activities.slice(0, 6).map((a, i) => {
                  const xpReward = a.rewards.find((r) => r.rewardType === "xp");
                  const monsterReward = a.rewards.find((r) => r.rewardType === "monster");
                  const xpGained = xpReward?.quantity ?? 0;
                  const xpDetail = xpReward && isXpDetail(xpReward.detail) ? xpReward.detail : null;
                  const isLevelUp = xpDetail ? xpDetail.levelAfter > xpDetail.levelBefore : false;
                  const monster = monsterReward && isMonsterDetail(monsterReward.detail) ? monsterReward.detail : null;
                  const meta = isPrMergedMetadata(a.metadata) ? a.metadata : null;
                  const repoName = meta?.repositoryFullName.split("/")[1] ?? "—";
                  return (
                    <div key={a.id} className={`px-3.5 py-3 flex gap-3 ${i < Math.min(activities.length, 6) - 1 ? "border-b border-line" : ""}`}>
                      <div className="w-8 h-8 rounded-[4px] shrink-0 bg-bg-elev-2 border border-line flex items-center justify-center text-base">
                        {monster ? (
                          <MonsterVisual
                            className="size-full"
                            name={monster.name}
                            sizes="32px"
                          />
                        ) : (
                          <GameAssetFallback alt="activity" className="size-full" kind="activity" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-text flex items-center gap-1.5 flex-wrap">
                          <span className="text-gold">+{xpGained} XP</span>
                          {monster && (
                            <>
                              <span className="text-text-faint">·</span>
                              <span className="font-medium">{monster.name}</span>
                              <span className="text-[9px] font-bold" style={{ color: RARITY_COLOR[monster.rarity] ?? "var(--text-faint)" }}>{monster.rarity}</span>
                            </>
                          )}
                          {isLevelUp && <span className="text-[9px] font-bold text-gold">LV.UP ↑{xpDetail!.levelAfter}</span>}
                        </div>
                        <div className="text-[11px] text-text-dim truncate mt-0.5">
                          {meta && (
                            <span className="text-accent-2 mr-1">{repoName}#{meta.prNumber}</span>
                          )}
                          <span className="text-text-faint">{meta?.title}</span>
                        </div>
                        <div className="text-[10px] text-text-faint mt-0.5">{formatTimeAgo(a.occurredAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </MainWrapper>
    {unread.length > 0 && (
      <RewardModal activities={unread} onClose={() => void acknowledge()} />
    )}
    </>
  );
}
