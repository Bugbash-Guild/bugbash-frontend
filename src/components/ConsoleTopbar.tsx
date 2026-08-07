"use client";

import Link from "next/link";

import { useDrawer } from "@/components/shell/DrawerContext";
import { useAuth } from "@/hooks/useAuth";
import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { useWallet } from "@/hooks/useWallet";
import { runeChipTarget } from "@/lib/navConfig";

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
 *
 * <768px ではドロワーの ☰ を左端に持つ（モバイル一段化: 旧 AppShell の
 * ☰ ストリップ + topbar の二段 ≈100px → 一段 54px）。topbar を置かない
 * ページの保険は AppShell の FallbackNavStrip で、`data-console-topbar` が
 * その表示判定（:has）に使われるので消さないこと。
 */
export function ConsoleTopbar({ path, command, showWallet = false }: ConsoleTopbarProps) {
  const { available: drawerAvailable, openDrawer } = useDrawer();
  const { isAuthenticated, user } = useAuth();
  const { wallet } = useWallet(showWallet && isAuthenticated);
  // 限定召喚の開催判定。開示はマスタデータ（BE 5分キャッシュ + SWR 共有）
  // なので topbar から引いても安い。取れない間は「開催中」扱いにしない
  // （runeChipTarget が管理場所の /mypage/billing に落とす）。
  const { disclosure: limitedDisclosure } = useSummonDisclosure(
    showWallet && isAuthenticated,
    "limited",
  );
  const username = user?.username ?? (isAuthenticated ? "hero" : "guest");
  const runeTarget = runeChipTarget(limitedDisclosure?.singlePullCost);

  return (
    <div
      data-console-topbar
      className="sticky top-0 z-20 flex h-[54px] items-center gap-2 border-b border-line bg-bg/[0.86] px-4 backdrop-blur md:gap-4 md:px-6"
    >
      {/* shell 外（DrawerProvider 不在）では開けないドロワーの ☰ を出さない */}
      {drawerAvailable && (
        <button
          aria-label="ナビゲーションを開く"
          className="flex size-9 shrink-0 items-center justify-center rounded border border-line text-[16px] text-text-dim hover:text-text md:hidden"
          onClick={(event) => openDrawer(event.currentTarget)}
          type="button"
        >
          ☰
        </button>
      )}

      <div className="min-w-0 flex-1 truncate text-[13px] text-text-dim">
        <span className="text-accent">{username}@bugbash</span>
        <span className="text-text-faint">:</span>
        <span className="text-blue">{path}</span>
        {/* コマンド部はモバイルでは ☰ とウォレットに幅を譲る（現在地 path は残す） */}
        <span className="hidden md:inline">
          <span className="text-text-faint">$ </span>
          <span>{command}</span>
        </span>
        <span className="ml-0.5 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
      </div>

      {showWallet && isAuthenticated && (
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border border-coin-border bg-bg-elev-2 px-2 py-1.5 text-[12px] font-semibold tabular-nums text-coin md:gap-1.5 md:px-2.5 md:text-[13px]">
            <span>🪙</span>
            {wallet ? wallet.guildCoinBalance.toLocaleString("ja-JP") : "—"}
          </span>
          {/* 残高チップ = 「使い道 / 管理場所」への扉。開催の根拠（開示APIの
              正のコスト）が取れた時だけ限定召喚へ、平時は課金・アカウント設定へ */}
          <Link
            href={runeTarget.href}
            title={runeTarget.title}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border border-rune-border bg-bg-elev-2 px-2 py-1.5 text-[12px] font-semibold tabular-nums text-rune transition-[filter] hover:brightness-125 md:gap-1.5 md:px-2.5 md:text-[13px]"
          >
            <span>💎</span>
            {wallet ? wallet.runeBalance.toLocaleString("ja-JP") : "—"}
          </Link>
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
