import type { Metadata } from "next";

import { TITLE_TEMPLATE } from "@/lib/siteMetadata";

/**
 * /summon のタブ名。ページ本体は "use client" で metadata を持てない。
 *
 * 名前はサイドバーの「召喚」ではなく h1 の「通常召喚」を採る。
 * 子ルートに /summon/limited（限定召喚）があり、タブに並んだときに
 * どちらの召喚を開いているか読めることを優先した。
 *
 * template を明示しているのは、子ルートへ接尾辞を引き継ぐため
 * （素の文字列 title だと /summon/limited の「| BugBash」が消える）。
 */
export const metadata: Metadata = {
  title: { default: "通常召喚", template: TITLE_TEMPLATE },
  description:
    "ギルドコインで魂や進化の素材を引く召喚画面です。相棒モンスターはPRのマージや限定召喚で仲間になります。",
};

export default function SummonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
