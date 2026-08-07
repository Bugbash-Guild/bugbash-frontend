import type { Metadata } from "next";

/**
 * /mypage/billing のタブ名。ページ本体は "use client" で metadata を持てない。
 * h1 は「残高・課金履歴・管理」だが、この画面への入口である
 * HERO_STATUS メニューのラベル「課金・アカウント設定」を採る
 * （クリックした語とタブ名を揃える）。
 */
export const metadata: Metadata = {
  title: "課金・アカウント設定",
  description: "残高、購入履歴、冒険者パス、年齢設定を確認できる画面です。",
};

export default function MypageBillingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
