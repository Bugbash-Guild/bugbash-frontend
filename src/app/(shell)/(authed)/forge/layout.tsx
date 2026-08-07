import type { Metadata } from "next";

/**
 * /forge のタブ名。ページ本体は "use client" で metadata を持てない。
 * サイドバー非掲載（monsters やスキン詳細から入る画面）なので h1 に合わせる。
 */
export const metadata: Metadata = {
  title: "スキン工房",
  description: "所有済みスキンの外観を段階的に調律する工房の画面です。",
};

export default function ForgeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
