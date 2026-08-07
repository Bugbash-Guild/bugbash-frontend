import type { Metadata } from "next";

/**
 * /admin/funnel のタブ名。ページ本体は "use client" で metadata を持てない。
 * 名前は h1 に合わせる（プロンプト行の ~/admin/funnel が管理画面である
 * ことを示すので、タブ名側で「管理」を足さない）。
 */
export const metadata: Metadata = {
  title: "課金導線",
  description: "各段階に到達した人数と、隣り合う段階の到達率を見る管理画面です。",
};

export default function AdminFunnelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
