import type { Metadata } from "next";

/**
 * /billing/return のタブ名。ページ本体は "use client" で metadata を持てない。
 * 決済後に戻ってくる画面で、他タブと並ぶ時間が長いので h1 の「反映状況」を
 * そのまま出す。
 */
export const metadata: Metadata = {
  title: "反映状況",
  description: "購入後の残高反映を待って確認する画面です。",
};

export default function BillingReturnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
