import type { Metadata } from "next";

import { TITLE_TEMPLATE } from "@/lib/siteMetadata";

/**
 * /shop のタブ名。ページ本体は "use client" で metadata を持てない。
 *
 * ショップは1枚（ルーンのチャージ → 使い道 → コイン → パス）。
 * template を明示しているのは、子ルート（/shop/skins）へ接尾辞を
 * 引き継ぐため（素の文字列 title だと子の「| BugBash」が消える）。
 */
export const metadata: Metadata = {
  title: { default: "ショップ", template: TITLE_TEMPLATE },
  description:
    "ルーンのチャージから使い道、コインのアイテム、冒険者パスまでを1画面にまとめた購入画面です。",
};

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
