import type { Metadata } from "next";

import { TITLE_TEMPLATE } from "@/lib/siteMetadata";

/**
 * /shop のタブ名。ページ本体は "use client" で metadata を持てない。
 *
 * このページの h1 はショップ内の 1 タブ名（「育成アイテム」）なので、
 * タブ名にはサイドバーの jaLabel「ショップ」を採る — /shop/runes・
 * /shop/skins・/pass と並んだときに、ここが売り場の入口だと分かる。
 *
 * template を明示しているのは、子ルート（/shop/runes・/shop/skins）へ
 * 接尾辞を引き継ぐため（素の文字列 title だと子の「| BugBash」が消える）。
 */
export const metadata: Metadata = {
  title: { default: "ショップ", template: TITLE_TEMPLATE },
  description:
    "育成アイテム・ルーン・見た目・冒険者パスをまとめた購入画面です。支払いに使うものは各タブに表示しています。",
};

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
