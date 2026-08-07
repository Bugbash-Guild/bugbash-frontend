"use client";

import Link from "next/link";
import { useState } from "react";

import { useActivities, isMonsterDetail, isPrMergedMetadata, isXpDetail } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useMonsters } from "@/hooks/useMonsters";
import { useMyCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { BadgeProgressStrip } from "@/components/BadgeProgressStrip";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { FirstQuestChecklist } from "@/components/FirstQuestChecklist";
import { NextActionStrip } from "@/components/NextActionStrip";
import { NextMilestoneStrip } from "@/components/NextMilestoneStrip";
import { TermLoading } from "@/components/TermLoading";
import { TrackingReadyPanel } from "@/components/TrackingReadyPanel";
import { GameAssetFallback } from "@/components/GameAssetFallback";
import { MonsterVisual } from "@/components/MonsterVisual";
import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";

import { RARITY_COLOR } from "@/constants/rarity";
import { getMonsterArtwork } from "@/lib/monsterArtwork";
// 検証ロジック（owner/repo 形式のときだけリンク化）は図鑑の出自PR表示と共通
import { buildPrUrl } from "@/lib/prUrl";

/** 活動ログの折りたたみ時に見せる件数。 */
const ACTIVITY_PREVIEW_COUNT = 6;

/** BE: HandlePrMergedUseCase.STREAK_BONUS_DAYS_THRESHOLD / COIN_STREAK_BONUS と対応。 */
const STREAK_BONUS_DAYS = 7;
const STREAK_BONUS_COINS = 300;

function formatTimeAgo(isoString: string): string {
  // 値が欠けている/壊れていると "NaN日前" と自信満々に表示されてしまう。
  // 仮の値を置かない方針なので、読めないときは "—" を返す。
  const at = new Date(isoString).getTime();
  if (!Number.isFinite(at)) return "—";
  const diff = Date.now() - at;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

/**
 * 相対時刻だけだと「120日前」でいつの出来事か分からなくなる。
 * ホバー（title）と <time dateTime> に絶対時刻を持たせて、
 * 見た目の簡潔さを保ったまま日付を失わないようにする。
 * 読めない値では null を返し、何も足さない（formatTimeAgo と同方針）。
 */
function formatAbsoluteTime(isoString: string): string | null {
  const at = new Date(isoString);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleString("ja-JP", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  });
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

  return (
    <div className="mb-4 border border-gold/40 rounded-[6px] p-3.5 flex items-center justify-between gap-4"
      style={{ background: "rgba(227,179,65,0.06)" }}>
      <div>
        <div className="text-[12px] font-semibold text-gold">GitHub App をインストールしてください</div>
        <div className="text-[11px] text-text-faint mt-0.5">
          PRをマージするとXPを獲得できます。インストールすることで自動的に追跡が開始されます。
        </div>
      </div>
      {appSlug ? (
        <a
          href={`https://github.com/apps/${appSlug}/installations/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-1.5 rounded text-[12px] font-semibold text-bg bg-gold hover:opacity-90 transition-opacity"
        >
          インストール
        </a>
      ) : (
        // slug 未設定＝ゲーム開始経路が存在しない構成ミス。href="#" の
        // 死んだボタンで隠さず、はっきり見えるようにする（P0: 流入ゼロ化の原因）
        <span className="shrink-0 px-4 py-1.5 rounded text-[11px] border border-pink/40 text-pink">
          導入リンク未設定（NEXT_PUBLIC_GITHUB_APP_SLUG）
        </span>
      )}
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
  const { isAuthenticated, user } = useAuth();
  const { hero, loading: heroLoading, refetch: refetchHero } = useHero(isAuthenticated);
  const { monsters, ownedDegraded, loading: monstersLoading } = useMonsters();
  const { activities, loading: activitiesLoading } = useActivities();
  // 活動ログは既定で直近6件。全件はユーザーの操作でだけ展開する
  // （黙って打ち切らない・勝手に長くしない）。
  const [showAllActivities, setShowAllActivities] = useState(false);
  // githubId (auth/status の応答) を待たず、最初のリクエスト波に乗せる
  const { mints: commemorativeMints } = useMyCommemorativeMints(isAuthenticated);
  // NextActionStrip は hero が来てから描画されるが、コスト取得はそれを待つ理由が
  // ないのでここで並列に始める（待つと往復が 1 段増える）。
  const { disclosure: normalSummon } = useSummonDisclosure(isAuthenticated, "normal");
  const { disclosure: limitedSummon } = useSummonDisclosure(isAuthenticated, "limited");



  const username = user?.username ?? "hero";
  // progressRatio が欠けていると "NaN%" とバーの塗り 0 が並ぶ。
  // 仮の値を置かず、読めないときは "—" にする（formatTimeAgo と同方針）。
  const progressRatio = Number.isFinite(hero?.progressRatio)
    ? Math.min(1, Math.max(0, hero!.progressRatio))
    : null;
  const pct = progressRatio == null ? null : (progressRatio * 100).toFixed(1);
  const filledSegments = progressRatio == null ? 0 : Math.round(progressRatio * 60);
  const totalSpecies = monsters.length;
  const discoveredSpecies = monsters.filter((m) => m.isOwned).length;
  const ownedMonsters = discoveredSpecies;

  return (
    <>
      <ConsoleTopbar command="./hero --render --interactive" path="~/home" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6 min-h-screen">
        {process.env.NODE_ENV === "development" && (
          <DevPanel onSuccess={() => void refetchHero()} />
        )}

        {/* GitHub App install banner */}
        {!heroLoading && hero && !hero.hasGithubAppInstalled && (
          <GithubAppBanner />
        )}

        {/* GitHub App manage link — shown when already installed.
            slug 未設定だと https://github.com/apps//installations/new という
            壊れた URL になるため、その場合はリンク自体を出さない。
            マージ実績 0 の間は TrackingReadyPanel が同じリンクを持つので、
            こちらは出さない（同じ導線を2箇所に並べない） */}
        {!heroLoading &&
          hero?.hasGithubAppInstalled &&
          hero.totalPrsMerged > 0 &&
          process.env.NEXT_PUBLIC_GITHUB_APP_SLUG && (
            <div className="text-right mb-3">
              {/* 文字だけの当たり判定（11px・1行）だと指で狙えない。
                  最小44px高のヒット領域を持たせ、末尾の → は
                  TrackingReadyPanel の同一導線と表記を揃えるため */}
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded px-2 text-[11px] text-text-faint transition-colors hover:text-text-dim"
              >
                + GitHub App にリポジトリを追加 →
              </a>
            </div>
          )}

        {heroLoading || !hero ? (
          <TermLoading lines={["query hero.stats", "render holo-card"]} />
        ) : (
          <>
            {/* 導入済みだが最初のマージがまだ＝画面上なにも変化が起きない期間。
                「動いているのか」「何をすれば何が起きるか」をここで開示する */}
            {hero.hasGithubAppInstalled && hero.totalPrsMerged === 0 && (
              <TrackingReadyPanel />
            )}

            <FirstQuestChecklist
              hero={hero}
              ownedDegraded={ownedDegraded}
              ownedMonsterCount={ownedMonsters}
            />

            <NextActionStrip
              enabled={isAuthenticated}
              guildCoinBalance={hero.guildCoinBalance}
              limitedPullCost={limitedSummon?.singlePullCost}
              normalPullCost={normalSummon?.singlePullCost}
            />

            {/* マージも未読報酬も無い日でも「次の節目」が1行残るようにする */}
            <NextMilestoneStrip
              heroLevel={hero.level}
              loading={monstersLoading}
              monsters={monsters}
              ownedDegraded={ownedDegraded}
              xpToNextLevel={hero.experienceToNextLevel}
            />

            {/* 実績（バッジ）の進捗1行 — /badges への第二入口（従来は
                プロフィール経由の単線）。目標系の行（距離行・節目行）の
                並びの末尾に置き、次に到達が近い1件だけを出す */}
            <BadgeProgressStrip enabled={isAuthenticated} />

            {/* HERO PANEL */}
            <div className="bg-bg-elev border border-line rounded-lg p-4 md:p-6 grid gap-5 md:gap-7 mb-3.5 relative overflow-hidden grid-cols-1 md:grid-cols-[auto_1fr]">
              {/* ambient glow */}
              <div className="absolute -top-28 -right-24 w-80 h-80 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(126,231,135,0.1), transparent 60%)" }} />

              {/* LEFT: hero card */}
              <div className="w-full max-w-[240px] mx-auto md:mx-0 min-h-[340px] rounded-[10px] border border-line-strong relative overflow-hidden flex flex-col"
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
                </div>
              </div>

              {/* RIGHT: HERO STATUS */}
              <div className="flex flex-col justify-between min-w-0 relative z-10">
                <div>
                  <div className="text-[11px] text-text-faint tracking-[0.16em] font-semibold">HERO STATUS</div>
                  {/* Lv 数字が大きいので、狭幅で TRACKING ピルがはみ出さないよう折り返す */}
                  <div className="flex flex-wrap items-baseline gap-3.5 mt-1.5">
                    <div className="text-[80px] font-bold leading-none tracking-[-0.04em] text-text">
                      Lv<span className="text-accent">.{hero.level}</span>
                    </div>
                    {hero.hasGithubAppInstalled ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold text-accent border border-accent/[0.27]"
                        style={{ background: "rgba(126,231,135,0.094)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"
                          style={{ boxShadow: "0 0 6px #7ee787" }} />
                        TRACKING
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-line px-2.5 py-1 text-[11px] font-semibold text-text-faint">
                        <span className="size-1.5 rounded-full bg-text-faint" />
                        OFFLINE
                      </div>
                    )}
                  </div>
                  {/* PR数とストリークは下の統計と重複するので、ここは総XPのみ */}
                  <div className="text-[13px] text-text-dim mt-2">
                    {hero.totalExperience.toLocaleString("ja-JP")} XP earned
                  </div>

                </div>

                {/*
                  正典 home.html はここに ATK/DEF/LUCK を置いているが、
                  その3値は FE の型にも BE の API にも存在しない（捏造になるので置かない）。
                  代わりに実在する4指標をここに上げ、空洞を実データで埋める。
                  下段はアクティビティログの全幅に使う。
                */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                    { label: "PRs merged",      value: String(hero.totalPrsMerged),  delta: "lifetime",                                     color: "var(--accent)" },
                    // この値は「所持している種類の数」（同種の重複は数えない）。
                    // 旧ラベル "monsters caught / instances" は個体数を示唆して
                    // いたが、home のデータに個体数は無い（種類単位で畳まれる）
                    { label: "species owned",    value: ownedDegraded ? "—" : String(ownedMonsters), delta: ownedDegraded ? "取得エラー" : "unique", color: "var(--purple)" },
                    { label: "dex progress",     value: ownedDegraded || !totalSpecies ? "—" : `${discoveredSpecies}/${totalSpecies}`, delta: "discovered", color: "var(--gold)" },
                    { label: "streak",           value: `${hero.streakDays}d`,         delta: hero.streakDays >= STREAK_BONUS_DAYS ? `+${STREAK_BONUS_COINS}コインが有効` : `${STREAK_BONUS_DAYS}日で+${STREAK_BONUS_COINS}コイン`, color: "var(--accent-2)" },
                  ].map((s) => (
                    <div key={s.label} className="bg-bg-elev border border-line rounded-[6px] px-3.5 py-3">
                      <div className="text-[11px] text-text-faint tracking-[0.1em] mb-2">{s.label.toUpperCase()}</div>
                      <div className="text-[32px] font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[11px] text-text-dim mt-1.5">{s.delta}</div>
                    </div>
                  ))}
                    {/* ストリークの仕組みを隠さない（煽りも入れない） */}
                  <p className="col-span-2 text-[10px] leading-5 text-text-faint sm:col-span-4">
                    ストリークは活動した日数です。{STREAK_BONUS_DAYS}日以上で、PRマージ1件あたり{STREAK_BONUS_COINS}コインが上乗せされます。
                    <span className="text-text-dim">土日は途切れの対象になりません</span>
                    （平日を空けると1日目に戻ります）。
                  </p>
                </div>

                {/* XP progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-[14px] text-text-dim mb-2">
                    <span>
                      <span className="text-text font-semibold">
                        {Number.isFinite(hero.currentLevelExperience)
                          ? hero.currentLevelExperience.toLocaleString("ja-JP")
                          : "—"}
                      </span>
                      {" / "}
                      {Number.isFinite(hero.experienceForNextLevel)
                        ? hero.experienceForNextLevel.toLocaleString("ja-JP")
                        : "—"}{" "}
                      XP
                    </span>
                    <span className="text-accent">{pct == null ? "—" : `${pct}%`}</span>
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
                  {/* 直上の "12,345 / 20,000 XP" と同じ行で読む数字なので、
                      桁区切りと欠損時の "—" を揃える（素の 7655 が並ばないように） */}
                  <div className="text-[13px] text-text-faint mt-2">
                    <span className="text-text-dim">
                      {Number.isFinite(hero.experienceToNextLevel)
                        ? hero.experienceToNextLevel.toLocaleString("ja-JP")
                        : "—"}{" "}
                      XP
                    </span>{" "}
                    to Lv.{hero.level + 1}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            {commemorativeMints.length > 0 && (
              <section className="mb-3.5 border border-line bg-bg-elev p-4 rounded-[6px]" aria-labelledby="commemorative-collection-heading">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="commemorative-collection-heading" className="text-[11px] tracking-[0.12em] text-gold">COMMEMORATIVE COLLECTION</h2>
                  <span className="text-[10px] text-text-faint">{commemorativeMints.length} plates</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {commemorativeMints.map((mint) => <CommemorativePlate key={mint.mintNumber} plate={mint} />)}
                </div>
              </section>
            )}
            <div className="grid gap-3.5">
              {/* activity log */}
              <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-line flex items-center justify-between">
                  <span className="text-[10px] text-text-faint tracking-[0.12em]">git log --activity</span>
                  {/* 打ち切っていることを黙らない: 折りたたみ中は「直近6件 / 取得済みN件」。
                      "全N件" とは言えない — BE の /hero/activities は既定 limit=20 の
                      ページングで、ここに届くのは常に直近分だけ（hasMore はフックが
                      畳んでいて FE 側に残っていない）。手元にある件数だけを言う */}
                  <span className="text-[10px] text-text-faint">
                    {activities.length > ACTIVITY_PREVIEW_COUNT
                      ? showAllActivities
                        ? `取得済み${activities.length}件`
                        : `直近${ACTIVITY_PREVIEW_COUNT}件 / 取得済み${activities.length}件`
                      : `${activities.length} events`}
                  </span>
                </div>
                {/* 待ちの表現をページ内で揃える（上の hero パネルは TermLoading） */}
                {activitiesLoading && (
                  <TermLoading className="px-3.5 py-4" lines={["query hero.activities"]} />
                )}
                {!activitiesLoading && activities.length === 0 && (
                  <div className="px-3.5 py-4 text-[12px] text-text-faint">
                    {hero?.hasGithubAppInstalled
                      ? "まだアクティビティがありません — PRをマージしよう"
                      : "追跡が始まっていません — GitHub App を導入すると、PRマージがここに流れます"}
                  </div>
                )}
                {(showAllActivities
                  ? activities
                  : activities.slice(0, ACTIVITY_PREVIEW_COUNT)
                ).map((a, i, visible) => {
                  const xpReward = a.rewards.find((r) => r.rewardType === "xp");
                  const monsterReward = a.rewards.find((r) => r.rewardType === "monster");
                  const xpGained = xpReward?.quantity ?? 0;
                  const xpDetail = xpReward && isXpDetail(xpReward.detail) ? xpReward.detail : null;
                  const isLevelUp = xpDetail ? xpDetail.levelAfter > xpDetail.levelBefore : false;
                  const monster = monsterReward && isMonsterDetail(monsterReward.detail) ? monsterReward.detail : null;
                  const meta = isPrMergedMetadata(a.metadata) ? a.metadata : null;
                  const repoName = meta?.repositoryFullName.split("/")[1] ?? "—";
                  const prUrl = meta ? buildPrUrl(meta.repositoryFullName, meta.prNumber) : null;
                  const occurredAbsolute = formatAbsoluteTime(a.occurredAt);
                  return (
                    <div key={a.id} className={`px-3.5 py-3 flex gap-3 ${i < visible.length - 1 ? "border-b border-line" : ""}`}>
                      <div className="w-8 h-8 rounded-[4px] shrink-0 bg-bg-elev-2 border border-line flex items-center justify-center text-base">
                        {monster ? (
                          getMonsterArtwork({ name: monster.name }) ? (
                            <MonsterVisual
                              className="size-full"
                              name={monster.name}
                              sizes="32px"
                            />
                          ) : (
                            // アートワークを解決できないモンスターは API 由来の絵文字で表示
                            // （従来は灰色プレースホルダに落ちていた）
                            <span aria-label={monster.name} role="img">
                              {monster.emoji}
                            </span>
                          )
                        ) : (
                          <GameAssetFallback alt="activity" className="size-full" kind="activity" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-text flex items-center gap-1.5 flex-wrap">
                          {/* 大きなPRでは4桁に届くので、他のXP表示と同じ桁区切りにする */}
                          <span className="text-gold">+{xpGained.toLocaleString("ja-JP")} XP</span>
                          {monster && (
                            <>
                              <span className="text-text-faint">·</span>
                              {/* 迎えたモンスターはその居場所（図鑑）へ繋ぐ */}
                              <Link
                                className="font-medium underline-offset-2 hover:underline"
                                href="/monsters"
                              >
                                {monster.name}
                              </Link>
                              <span className="text-[9px] font-bold" style={{ color: RARITY_COLOR[monster.rarity] ?? "var(--text-faint)" }}>{monster.rarity}</span>
                            </>
                          )}
                          {isLevelUp && <span className="text-[9px] font-bold text-gold">LV.UP ↑{xpDetail!.levelAfter}</span>}
                        </div>
                        <div className="text-[11px] text-text-dim truncate mt-0.5">
                          {meta &&
                            (prUrl ? (
                              // 元の PR へ。ログの行が GitHub 上の実体への往復口になる
                              <a
                                className="text-accent-2 mr-1 underline-offset-2 hover:underline"
                                href={prUrl}
                                rel="noreferrer noopener"
                                target="_blank"
                              >
                                {repoName}#{meta.prNumber}
                              </a>
                            ) : (
                              <span className="text-accent-2 mr-1">{repoName}#{meta.prNumber}</span>
                            ))}
                          {/* truncate で消える分を hover で読めるようにする
                              （図鑑カードの出自PRと同じ扱い） */}
                          <span className="text-text-faint" title={meta?.title}>{meta?.title}</span>
                        </div>
                        <div className="text-[10px] text-text-faint mt-0.5">
                          <time
                            dateTime={occurredAbsolute ? a.occurredAt : undefined}
                            title={occurredAbsolute ?? undefined}
                          >
                            {formatTimeAgo(a.occurredAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* 7件目以降があるときだけトグルを出す（無いのに出すのは虚偽） */}
                {!activitiesLoading && activities.length > ACTIVITY_PREVIEW_COUNT && (
                  <button
                    aria-expanded={showAllActivities}
                    className="w-full border-t border-line px-3.5 py-2 text-left text-[11px] text-text-dim transition-colors hover:bg-bg-elev-2 hover:text-text"
                    onClick={() => setShowAllActivities((open) => !open)}
                    type="button"
                  >
                    {showAllActivities
                      ? `[ 直近${ACTIVITY_PREVIEW_COUNT}件に戻す ▴ ]`
                      : `[ すべて表示 — 取得済み${activities.length}件 ▾ ]`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
