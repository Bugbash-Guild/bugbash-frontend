import type { BillingWallet } from "@/types/billing";

export type WalletBadgeItem = {
  label: string;
  tone: "accent" | "dim" | "gold";
  value: string;
};

type WalletBadgeSource = BillingWallet & Record<string, unknown>;

export function formatWalletAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

export function buildWalletBadgeItems(wallet: WalletBadgeSource): WalletBadgeItem[] {
  return [
    {
      label: "GC",
      tone: "gold",
      value: formatWalletAmount(wallet.guildCoinBalance),
    },
    {
      label: "RUNE",
      tone: "accent",
      value: formatWalletAmount(wallet.runeBalance),
    },
    {
      label: "paid",
      tone: "dim",
      value: formatWalletAmount(wallet.paidRuneBalance),
    },
    {
      label: "free",
      tone: "dim",
      value: formatWalletAmount(wallet.freeRuneBalance),
    },
  ];
}
