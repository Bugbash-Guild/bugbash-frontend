"use client";

import Link from "next/link";

import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { useWallet } from "@/hooks/useWallet";
import { formatSummonCurrencyCost } from "@/lib/summonPity";

/**
 * 通常召喚ページに置く限定召喚への案内。
 *
 * 限定召喚はルーンの最大の吸収先（30ルーン/回・天井60回）なのに、
 * 入口が召喚ページ**最下部の中立ボタン1つ**しかなく、しかも
 * 「コインが足りないときは」の注記の後ろにあった。
 * 収益上いちばん見せたい棚を、ページ内で最も弱い場所に置いていた。
 *
 * 出すのは事実だけ — 開催名・単価・（引けるなら）引ける回数。
 * 残り時間・在庫演出・「今なら」は置かない。
 * 開示APIが未取得のあいだは何も出さない（値を仮置きしない）。
 */
export function LimitedSummonBanner({ enabled }: { enabled: boolean }) {
  const { disclosure } = useSummonDisclosure(enabled, "limited");
  const { wallet } = useWallet(enabled);

  const cost = disclosure?.singlePullCost ?? null;
  if (disclosure == null || cost == null || cost <= 0) return null;

  const balance = wallet?.runeBalance;
  const affordable =
    Number.isFinite(balance ?? NaN) && (balance as number) >= cost
      ? Math.floor((balance as number) / cost)
      : null;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-rune-border bg-rune-bg px-4 py-3 max-w-4xl">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-rune-border px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-rune">
            💎 RUNE
          </span>
          <span className="truncate text-[13px] font-semibold text-text">
            {disclosure.name}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-text-dim">
          1回 {formatSummonCurrencyCost(cost, disclosure.currency)}
          {affordable != null && (
            <>
              <span className="mx-1.5 text-text-faint">·</span>
              <b className="tabular-nums text-rune">×{affordable}</b> ぶん引けます
            </>
          )}
        </p>
      </div>
      <Link
        className="shrink-0 rounded-[4px] border border-rune-border bg-rune-bg px-4 py-1.5 text-[12px] font-semibold text-rune transition-[filter] hover:brightness-125"
        href="/summon/limited"
      >
        限定召喚へ →
      </Link>
    </div>
  );
}
