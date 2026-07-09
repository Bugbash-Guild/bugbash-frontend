"use client";

import { useWallet } from "@/hooks/useWallet";
import { buildWalletBadgeItems, type WalletBadgeItem } from "@/lib/walletBadge";

const TONE_CLASS: Record<WalletBadgeItem["tone"], string> = {
  accent: "text-accent",
  dim: "text-text-dim",
  gold: "text-gold",
};

export function WalletBadge({ enabled }: { enabled: boolean }) {
  const { wallet, loading, error } = useWallet(enabled);
  if (!enabled) return null;

  const items = wallet ? buildWalletBadgeItems(wallet) : [];

  return (
    <section
      aria-label="ウォレット残高"
      className="mb-5 border border-line bg-bg-elev px-3 py-2 text-[12px]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
          WALLET
        </span>

        {loading && (
          <span className="text-text-faint">syncing balances…</span>
        )}

        {!loading && error && (
          <span className="text-pink">残高を取得できません</span>
        )}

        {!loading &&
          !error &&
          items.map((item) => (
            <span key={item.label} className="inline-flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.08em] text-text-faint">
                {item.label}
              </span>
              <span className={`font-semibold tabular-nums ${TONE_CLASS[item.tone]}`}>
                {item.value}
              </span>
            </span>
          ))}
      </div>
    </section>
  );
}
