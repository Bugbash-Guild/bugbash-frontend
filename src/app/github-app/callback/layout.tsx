import type { Metadata } from "next";

/**
 * /github-app/callback のタブ名。ページ本体は "use client" で metadata を
 * 持てない。h1 は導入結果（完了・承認待ち・失敗）で変わるので、
 * 状態に依らない画面の役割をタブ名にする。
 *
 * (authed) 配下ではないため noindex は継承されないが、ここは GitHub から
 * クエリ付きで戻ってくる中継画面で、単体では読む価値がない。
 * 検索結果に出しても誤って踏まれるだけなので個別に noindex を掛ける。
 */
export const metadata: Metadata = {
  title: "GitHub App 連携",
  description: "GitHub App の導入結果を確認する画面です。",
  robots: { index: false },
};

export default function GitHubAppCallbackLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
