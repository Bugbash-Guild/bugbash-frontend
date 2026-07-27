"use client";

import Link from "next/link";

import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";

/**
 * 「いま、できること」を1つだけ提示する。
 *
 * 報酬（コイン）は活動で自動的に貯まるが、貯まったことに気づく場所がないため
 * 未使用のまま積み上がりやすい。何回ぶんあるかという事実だけを述べ、
 * 期限・カウントダウン・煽り文句は付けない（D-1: 事実の進捗のみ）。
 *
 * 召喚コストは開示APIの値をそのまま使う（フロントに価格定数を持たない）。
 * 未取得のあいだは何も出さない＝値を仮置きしない。
 */
export function NextActionStrip({
  enabled,
  guildCoinBalance,
}: {
  enabled: boolean;
  guildCoinBalance: number;
}) {
  const { disclosure } = useSummonDisclosure(enabled, "normal");

  const cost = disclosure?.singlePullCost ?? null;
  if (cost == null || cost <= 0) return null;

  const summonable = Math.floor(guildCoinBalance / cost);
  if (summonable < 1) return null;

  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-accent/30 bg-accent/[0.05] px-4 py-3">
      <p className="text-[12px] text-text-dim">
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-faint">READY</span>
        <span className="mx-2 text-text-faint">·</span>
        召喚 <b className="tabular-nums text-accent">×{summonable}</b> ぶんのギルドコインがあります
      </p>
      <Link
        className="shrink-0 rounded-[4px] border border-accent/40 bg-accent/[0.08] px-4 py-1.5 text-[12px] font-semibold text-accent transition-[filter] hover:brightness-110"
        href="/summon"
      >
        召喚へ →
      </Link>
    </div>
  );
}
