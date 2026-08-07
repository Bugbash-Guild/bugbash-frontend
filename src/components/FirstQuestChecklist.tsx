"use client";

import Link from "next/link";

import type { Hero } from "@/types/hero";

type Quest = {
  key: string;
  label: string;
  done: boolean;
  action?: { label: string; href: string; external?: boolean };
};

/**
 * 新規アカウントの「クエスト0」（FTUE）。既存のフィールドのみで判定し、
 * 全クエスト完了後は表示しない。BE 依存なし・値の捏造なし。
 */
export function FirstQuestChecklist({
  hero,
  ownedMonsterCount,
  ownedDegraded,
}: {
  hero: Hero;
  ownedMonsterCount: number;
  ownedDegraded: boolean;
}) {
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : null;

  const quests: Quest[] = [
    {
      key: "install",
      label: "GitHub App を導入して追跡を開始する",
      done: hero.hasGithubAppInstalled,
      action:
        installUrl != null
          ? { label: "インストール", href: installUrl, external: true }
          : undefined,
    },
    {
      key: "first-pr",
      label: "最初の PR をマージして XP とコインを得る",
      done: hero.totalPrsMerged > 0,
      // App 導入済みなら、home 上部の TrackingReadyPanel（#tracking-ready）へ
      // 飛ばして「何をすると何が起きるか」を読める場所を示す。
      // パネルは導入済み && マージ0 のときだけ描画される＝この action が
      // 表示される条件（未達 && 導入済み）と一致する。
      action: hero.hasGithubAppInstalled
        ? { label: "仕組みを見る", href: "#tracking-ready" }
        : undefined,
    },
    {
      key: "first-monster",
      // 最初の相棒は PR のマージで仲間になる（通常召喚では出ない）。
      // 図鑑で「これから集まる相棒」を見せる（達成不能な召喚へは送らない）。
      label: "最初の相棒モンスターを迎える（PR マージで仲間になる）",
      // owned 取得が壊れている間は「未達」と断定しない（判定不能扱いで達成表示）
      done: ownedDegraded || ownedMonsterCount > 0,
      action: { label: "図鑑を見る", href: "/monsters" },
    },
  ];

  if (quests.every((quest) => quest.done)) return null;

  const doneCount = quests.filter((quest) => quest.done).length;

  return (
    <section
      aria-labelledby="first-quest-heading"
      className="mb-4 rounded-[6px] border border-accent/30 bg-accent/[0.04] p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"
          id="first-quest-heading"
        >
          QUEST 0 — 冒険のはじめかた
        </h2>
        <span className="text-[10px] tabular-nums text-text-faint">
          {doneCount}/{quests.length}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {quests.map((quest) => (
          <li className="flex items-center gap-2.5 text-[12px]" key={quest.key}>
            <span
              aria-hidden
              className={[
                "flex size-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px]",
                quest.done
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-line-strong text-transparent",
              ].join(" ")}
            >
              ✓
            </span>
            <span className={quest.done ? "text-text-faint line-through" : "text-text"}>
              {quest.label}
            </span>
            {!quest.done &&
              quest.action &&
              (quest.action.external ? (
                <a
                  className="ml-auto shrink-0 text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
                  href={quest.action.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {quest.action.label} →
                </a>
              ) : quest.action.href.startsWith("#") ? (
                // ページ内アンカーはルーティング不要なので素の <a>（Link だと
                // 同一ページ遷移として扱われる）
                <a
                  className="ml-auto shrink-0 text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
                  href={quest.action.href}
                >
                  {quest.action.label} →
                </a>
              ) : (
                <Link
                  className="ml-auto shrink-0 text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
                  href={quest.action.href}
                >
                  {quest.action.label} →
                </Link>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
