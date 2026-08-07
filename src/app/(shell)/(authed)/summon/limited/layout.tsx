import type { Metadata } from "next";

/**
 * /summon/limited のタブ名。ページ本体は "use client" で metadata を持てない。
 * h1 は開催中プール名（動的・クライアント取得）なので、静的な既定値である
 * 「限定召喚」をタブ名に使う。
 */
export const metadata: Metadata = {
  title: "限定召喚",
  description:
    "ルーンで引く期間限定の召喚プールです。目玉と費用、天井までの残りを確認できます。",
};

export default function LimitedSummonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
