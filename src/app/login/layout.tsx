import type { Metadata } from "next";

/**
 * /login のタブ名。ページ本体は "use client" で metadata を持てない。
 * ここは (authed) 配下ではないので noindex を掛けない —
 * 未ログインでも到達できる唯一の入口で、検索結果に出て意味がある。
 */
export const metadata: Metadata = {
  title: "ログイン",
  description:
    "GitHubアカウントでBugBashにログインします。要求する権限は read:user と user:email のみです。",
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
