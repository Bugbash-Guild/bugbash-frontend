"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiAward } from "react-icons/fi";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { usePublicCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { usePublicHeroBadges } from "@/hooks/useBadges";
import type { PublicHeroBadge } from "@/types/badge";

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 mt-9 flex items-baseline gap-3">
      <h2 className="text-[13px] font-bold tracking-[0.18em] text-text-dim">{title}</h2>
      <span className="h-px flex-1 bg-line" />
      {note && <span className="text-[10px] text-text-faint">{note}</span>}
    </div>
  );
}

function BadgeWallItem({ badge }: { badge: PublicHeroBadge }) {
  const earnedDate = badge.earnedAt ? badge.earnedAt.slice(0, 10) : null;
  return (
    <article className="flex items-center gap-3 rounded-[6px] border border-line bg-bg-elev px-4 py-3.5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-[8px] border border-accent/40 bg-accent/[0.08] text-accent">
        <FiAward aria-hidden size={22} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-text">{badge.displayName}</span>
          {badge.currentTier > 0 && (
            <span className="text-[9px] font-bold tracking-[0.14em] text-accent">
              TIER {badge.currentTier}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px]">
          {badge.grade > 0 && (
            <span className="inline-flex items-center gap-1 rounded-[2px] border border-rune-border bg-rune-bg px-[7px] py-px font-bold tracking-[0.08em] text-rune">
              ⚒ GRADE {badge.grade}
            </span>
          )}
          {earnedDate && (
            <span className="tabular-nums text-text-faint">獲得 {earnedDate}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function PublicHeroPage() {
  const params = useParams<{ heroId: string }>();
  const heroId = params.heroId;
  const {
    badges,
    error: badgesError,
    loading: badgesLoading,
  } = usePublicHeroBadges(heroId);
  const {
    error: mintsError,
    loading: mintsLoading,
    mints,
  } = usePublicCommemorativeMints(heroId);

  const handle = heroId;
  const topTier = badges.reduce((max, b) => Math.max(max, b.currentTier), 0);
  // 名声由来の称号（購入不可）: 最高ティアのバッジ上位2件を表示
  const honors = [...badges]
    .sort((a, b) => b.currentTier - a.currentTier || b.grade - a.grade)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* public topbar */}
      <div className="sticky top-0 z-20 flex h-[54px] items-center justify-between gap-4 border-b border-line bg-bg/[0.86] px-6 backdrop-blur">
        <div className="truncate text-[13px] text-text-dim">
          <span className="text-accent">visitor@github</span>
          <span className="text-text-faint">:</span>
          <span className="text-blue">~</span>
          <span className="text-text-faint">$ </span>
          <span>curl bugbash.dev/@{handle}</span>
        </div>
        <Link
          className="shrink-0 rounded-[4px] border border-line px-3 py-1.5 text-[11px] text-text-dim transition-colors hover:text-accent"
          href="/leaderboard"
        >
          ランキングへ戻る
        </Link>
      </div>

      <div className="mx-auto max-w-[1080px] px-7 pb-16">
        {/* identity */}
        <div className="flex flex-wrap items-end gap-5 border-b border-line py-8">
          <div
            className="flex size-[76px] shrink-0 items-center justify-center rounded-[10px] text-[30px] font-extrabold text-bg"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--blue))",
              boxShadow: "0 10px 26px rgba(126,231,135,0.22), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            {handle.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="text-[26px] font-extrabold tracking-[-0.01em]">
              <span className="font-normal text-text-faint">@</span>
              {handle}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {honors.map((b) => (
                <span
                  key={b.code}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-accent/40 bg-accent/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-accent"
                >
                  ⚔ {b.displayName.toUpperCase()}
                </span>
              ))}
              <span className="text-[10px] text-text-faint">
                称号は実績由来 — 購入では手に入りません
              </span>
            </div>
          </div>
        </div>

        {/* stat row (public, real) */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { k: "BADGES", v: String(badges.length), s: "earned" },
            { k: "TOP TIER", v: topTier > 0 ? `T${topTier}` : "—", s: "highest" },
            { k: "CASTS", v: String(mints.length), s: "記念鋳造" },
          ].map((stat) => (
            <div
              key={stat.k}
              className="min-w-[150px] flex-1 rounded-[4px] border border-line bg-bg-elev px-4 py-3"
            >
              <div className="text-[9px] tracking-[0.16em] text-text-faint">{stat.k}</div>
              <div className="mt-1 text-[20px] font-bold tabular-nums text-accent">{stat.v}</div>
              <div className="mt-0.5 text-[10px] text-text-dim">{stat.s}</div>
            </div>
          ))}
        </div>

        {/* badges */}
        <SectionHeading note="ティアは活動でのみ上昇" title="BADGES" />
        {badgesLoading && <p className="text-[12px] text-text-faint">loading badges…</p>}
        {badgesError && <p className="text-[12px] text-pink">バッジを読み込めませんでした。</p>}
        {!badgesLoading &&
          !badgesError &&
          (badges.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {badges.map((badge) => (
                <BadgeWallItem badge={badge} key={badge.code} />
              ))}
            </div>
          ) : (
            <p className="border border-line bg-bg-elev p-5 text-[12px] text-text-faint">
              公開中のバッジはまだありません。
            </p>
          ))}

        {/* commemorative casts */}
        <SectionHeading note="記念鋳造 · 刻印は自動（偽造不可）" title="COMMEMORATIVE CASTS" />
        {mintsLoading && <p className="text-[12px] text-text-faint">loading collection…</p>}
        {mintsError && <p className="text-[12px] text-pink">公開コレクションを読み込めませんでした。</p>}
        {!mintsLoading &&
          !mintsError &&
          (mints.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {mints.map((mint) => (
                <CommemorativePlate key={mint.mintNumber} plate={mint} />
              ))}
            </div>
          ) : (
            <p className="border border-line bg-bg-elev p-5 text-[12px] text-text-faint">
              公開中の記念プレートはありません。
            </p>
          ))}

        {/* footer */}
        <div className="mt-11 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-[10.5px] text-text-faint">
            BugBash — GitHubの活動がそのまま冒険になる。このページの名声表示（ティア・実績）は購入で変化しません。
          </p>
          <Link
            className="rounded-[4px] border border-accent/40 bg-accent/[0.08] px-4 py-2 text-[12px] font-semibold text-accent transition-[filter] hover:brightness-110"
            href="/"
          >
            自分の冒険を始める →
          </Link>
        </div>
      </div>
    </div>
  );
}
