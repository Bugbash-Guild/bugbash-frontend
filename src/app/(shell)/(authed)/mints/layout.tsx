import type { Metadata } from "next";

/**
 * /mints のタブ名。ページ本体は "use client" で metadata を持てない。
 * サイドバー非掲載（プロフィールの記念プレート棚から入る画面）なので
 * h1 に合わせる。
 */
export const metadata: Metadata = {
  title: "記念鋳造",
  description:
    "実績を記念するプレートを鋳造する画面です。能力値や名声には影響しません。",
};

export default function MintsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
