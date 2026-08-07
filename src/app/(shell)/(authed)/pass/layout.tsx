import type { Metadata } from "next";

/**
 * /pass のタブ名。ページ本体は "use client" で metadata を持てない。
 * サイドバー非掲載（ショップのタブから入る画面）なので、名前は h1 に合わせる。
 */
export const metadata: Metadata = {
  title: "冒険者パス",
  description:
    "継続特典の内容、加入状態、解約予定を確認できる月額プランの画面です。",
};

export default function PassLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
