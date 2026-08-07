"use client";

import Link from "next/link";

import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ConsoleEmptyState } from "@/components/ConsoleEmptyState";
import { TermLoading } from "@/components/TermLoading";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard, useLeaderboardMe } from "@/hooks/useLeaderboard";
import { buildLeaderboardLegend, shouldAppendSelfRow } from "@/lib/leaderboardMe";

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

/*
 * 一覧の行と圏外の自分の行で同じ行様式を使うための共通コンポーネント。
 * 行全体を /heroes/{heroId} へのリンクにする（従来は名前だけが
 * クリック可能で、当たり判定が13pxの文字列しかなかった）。
 * streakDays は /me 応答に存在しないため null を受け、無い値は「—」で
 * 埋める（推測して数字を置かない）。
 */
function HeroRow({
  heroId,
  isSelf,
  level,
  login,
  rank,
  streakDays,
  totalExperience,
}: {
  heroId: string;
  isSelf: boolean;
  level: number;
  login: string;
  rank: number;
  streakDays: number | null;
  totalExperience: number;
}) {
  const rankColor = RANK_COLORS[rank] ?? "var(--text-dim)";
  const glyph = RANK_GLYPHS[rank] ?? "·";

  return (
    <Link
      href={`/heroes/${encodeURIComponent(heroId)}`}
      className={[
        "group grid grid-cols-[2.5rem_1fr_3rem] px-4 py-3 border-b border-line last:border-b-0 items-center transition-colors sm:grid-cols-[3rem_1fr_4rem_6rem] lg:grid-cols-[3rem_1fr_4rem_6rem_5rem]",
        isSelf
          ? "border-l-2 border-l-accent bg-accent/[0.06]"
          : "hover:bg-bg-elev-2",
      ].join(" ")}
    >
      {/* rank */}
      <div className="flex items-center gap-1.5">
        <span className="text-[14px] font-bold" style={{ color: rankColor }}>
          {glyph}
        </span>
        <span className="text-[12px] text-text-faint">{rank}</span>
      </div>

      {/* hero */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* 頭文字タイルは login の重複表示なので、読み上げからは外す */}
        <div
          aria-hidden
          className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 text-[12px] font-bold text-bg"
          style={{ background: rankColor }}
        >
          {login[0]?.toUpperCase() ?? "?"}
        </div>
        <span className="text-[13px] text-text truncate group-hover:text-accent">{login}</span>
        {isSelf && (
          <span className="shrink-0 rounded-[2px] border border-accent/40 bg-accent/[0.08] px-1.5 py-px text-[9px] font-bold tracking-[0.1em] text-accent">
            YOU
          </span>
        )}
      </div>

      {/* level */}
      <div className="text-right text-[13px] font-semibold text-accent">
        {level}
      </div>

      {/* xp — 桁区切りは他画面と同じ ja-JP 固定。素の toLocaleString() は
          閲覧者のブラウザ言語で区切り文字が変わり、同じ画面内で表記が割れる */}
      <div className="hidden text-right text-[13px] text-text-dim sm:block">
        {totalExperience.toLocaleString("ja-JP")}
      </div>

      {/* streak（/me には無いフィールドなので、自分の圏外行では出さない） */}
      <div className="hidden text-right text-[12px] text-text-faint lg:block">
        {streakDays == null ? (
          <span>—</span>
        ) : streakDays > 1 ? (
          <span className="text-gold">{streakDays}d active</span>
        ) : (
          <span>{streakDays}d</span>
        )}
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const { entries, loading, error, refetch } = useLeaderboard(isAuthenticated);
  /*
   * 自分の順位。圏外のときだけ末尾に行を足す。404（Hero不在）・BE未対応・
   * 取得失敗はフック側で null に畳まれるため、ここでは分岐が増えない
   * （me が無い＝行を足さないだけで、一覧の表示は変わらない）。
   */
  const { me } = useLeaderboardMe(isAuthenticated);
  // heroId == githubId は確立済みの契約（home が /api/heroes/{githubId}/... を使用）
  const selfHeroId = user?.githubId ?? null;

  const showSelfRow = shouldAppendSelfRow(entries, selfHeroId, me);
  // 件数の定数を直書きせず、届いた件数と /me の総数から言える事実だけを凡例にする
  const legend = buildLeaderboardLegend(entries.length, me?.totalHeroes ?? null);

  return (
    <>
      <ConsoleTopbar command="./rank --all --sort xp" path="~/leaderboard" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6 min-h-screen">
        {/* 他画面（Monster Dex / Inventory / バッジ）と同じく見出しを持たせる。
            この画面だけ h1 が無く、行の意味を説明する文も無かった */}
        <div className="mb-4">
          <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Leaderboard</h1>
          <p className="mt-1.5 text-[12.5px] text-text-dim">
            累計XP順。行を選ぶとその勇者の公開プロフィールへ移動します。
          </p>
        </div>

        {error && entries.length === 0 ? (
          // 取得失敗を「まだ誰もいない」空状態として見せない（嘘の状態の一掃）。
          // 定期再検証の失敗で手元に前回データが残っている間は、エラーで
          // 塗り潰さずそのまま表示を続ける（次の再検証で自然に回復する）。
          <div className="flex flex-wrap items-center justify-between gap-3 border border-pink/30 bg-pink/10 px-4 py-4 text-[12px] text-pink">
            <span>ランキングの読み込みに失敗しました。</span>
            {/* 取得のやり直しは他画面と同じ「再読み込み」。「再試行」は
                変更操作（強化・鋳造）のやり直しに使い分けられている */}
            <button
              className="text-text underline underline-offset-4 hover:text-accent"
              onClick={() => void refetch()}
              type="button"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            {/* table header */}
            {/* 5列固定だと390pxで溢れるため、狭い幅では XP と STREAK を畳む
                （行側の対応する列も同じブレークポイントで hidden にしている） */}
            <div className="grid grid-cols-[2.5rem_1fr_3rem] px-4 py-2.5 border-b border-line text-[10px] text-text-faint uppercase tracking-[0.12em] sm:grid-cols-[3rem_1fr_4rem_6rem] lg:grid-cols-[3rem_1fr_4rem_6rem_5rem]">
              <span>RANK</span>
              <span>HERO</span>
              <span className="text-right">LV</span>
              <span className="hidden text-right sm:block">TOTAL XP</span>
              <span className="hidden text-right lg:block">STREAK</span>
            </div>

            {/* 読み込み中も枠と列見出しを残す。以前は表ごと TermLoading に
                差し替えていたため、データ到着でページが一段ずれていた */}
            {loading ? (
              <TermLoading className="px-4 py-4" lines={["query leaderboard --sort xp"]} />
            ) : (
              <>
                {entries.length === 0 && (
                  <ConsoleEmptyState
                    className="m-4"
                    glyph="▲"
                    message="まだランキングがありません。PR をマージした勇者から順に載ります。"
                    action={{ label: "自分のホームへ", href: "/" }}
                  />
                )}

                {entries.map((entry) => (
                  <HeroRow
                    key={entry.heroId}
                    heroId={entry.heroId}
                    isSelf={selfHeroId != null && entry.heroId === selfHeroId}
                    level={entry.level}
                    login={entry.githubLogin ?? entry.heroId}
                    rank={entry.rank}
                    streakDays={entry.streakDays}
                    totalExperience={entry.totalExperience}
                  />
                ))}

                {/* 圏外の自分。表示中の一覧に自分が居ないときだけ「…」区切りで足す */}
                {showSelfRow && me != null && selfHeroId != null && (
                  <>
                    <div
                      aria-hidden
                      className="border-b border-line px-4 py-1 text-center text-[11px] tracking-[0.4em] text-text-faint"
                    >
                      …
                    </div>
                    <HeroRow
                      heroId={selfHeroId}
                      isSelf
                      level={me.level}
                      login={me.githubLogin ?? user?.username ?? selfHeroId}
                      rank={me.rank}
                      streakDays={null}
                      totalExperience={me.experience}
                    />
                  </>
                )}

                {/* 凡例: 実際に届いた件数から言える事実のみ（定数の直書きはしない）。
                    この行がある間は直前の行が :last-child でなくなり border-b を
                    持つため、こちら側に border-t を足すと線が二重になる。 */}
                {legend != null && (
                  <div className="px-4 py-2 text-[10px] text-text-faint">
                    {legend} · 60秒ごとに自動更新
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
