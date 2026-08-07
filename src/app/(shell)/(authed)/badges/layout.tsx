import type { Metadata } from "next";

/**
 * /badges のタブ名。ページ本体は "use client" で metadata を持てない。
 * h1 は「バッジ」だが、サイドバーの jaLabel「実績バッジ」を採る
 * （タブ 1 行だけを見たときに何のバッジか分かる）。
 */
export const metadata: Metadata = {
  title: "実績バッジ",
  description:
    "GitHub活動で得た実績バッジと、プロフィールに表示する見た目を管理する画面です。",
};

export default function BadgesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
