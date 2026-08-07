import type { Metadata } from "next";

/**
 * /legal/tokushoho のタブ名。このページ本体は server component なので
 * page.tsx にも書けるが、タブ名の置き場所は全ルートで layout に揃える
 * （"use client" なページと混在するため、探す場所を 1 つにする）。
 *
 * (authed) 配下ではないので noindex は掛からない — 購入前に外から
 * 参照できるべき表示なので、検索結果に出てよい。
 */
export const metadata: Metadata = {
  title: "特定商取引法に基づく表示",
  description:
    "BugBashの特定商取引法に基づく表示です（弁護士レビュー中のため、現在は項目構造のみ掲載）。",
};

export default function TokushohoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
