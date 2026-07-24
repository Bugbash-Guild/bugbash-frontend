"use client";

import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";

type ConsoleTopbarProps = {
  /** e.g. "~/home" */
  path: string;
  /** command echoed after the prompt, e.g. "./hero --render" */
  command: string;
  /** show the coin / rune wallet cluster on the right */
  showWallet?: boolean;
};

/**
 * デザイン D-1 共通トップバー: ターミナル風プロンプト + （任意で）ウォレット。
 * main のスクロール領域上端に sticky で貼り付く。
 */
export function ConsoleTopbar({ path, command, showWallet = false }: ConsoleTopbarProps) {
  const { isAuthenticated, user } = useAuth();
  const { wallet } = useWallet(showWallet && isAuthenticated);
  const username = user?.username ?? (isAuthenticated ? "hero" : "guest");

  return (
    <div className="sticky top-0 z-20 flex h-[54px] items-center justify-between gap-4 border-b border-line bg-bg/[0.86] px-6 backdrop-blur">
      <div className="truncate text-[13px] text-text-dim">
        <span className="text-accent">{username}@bugbash</span>
        <span className="text-text-faint">:</span>
        <span className="text-blue">{path}</span>
        <span className="text-text-faint">$ </span>
        <span>{command}</span>
        <span className="ml-0.5 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
      </div>

      {showWallet && isAuthenticated && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-coin-border bg-bg-elev-2 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-coin">
            <span>🪙</span>
            {wallet ? wallet.guildCoinBalance.toLocaleString("ja-JP") : "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-rune-border bg-bg-elev-2 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-rune">
            <span>💎</span>
            {wallet ? wallet.runeBalance.toLocaleString("ja-JP") : "—"}
          </span>
          <Link
            href="/shop/runes"
            title="ルーンを購入"
            aria-label="ルーンを購入"
            className="flex size-[30px] items-center justify-center rounded-[4px] border border-[#d99e1c] bg-gradient-to-b from-[#ffc74d] via-rune to-[#d99e1c] text-[15px] font-bold leading-none text-[#1a1206] transition-[filter] hover:brightness-105"
          >
            +
          </Link>
        </div>
      )}
    </div>
  );
}
