import type { Metadata } from "next";

/**
 * /admin/monsters のタブ名。ページ本体は "use client" で metadata を持てない。
 * 見出しが英語（Monster Admin）の管理画面なので、そのまま採る
 * （/monsters「図鑑・育成」との取り違えを避けたい画面でもある）。
 */
export const metadata: Metadata = {
  title: "Monster Admin",
  description:
    "モンスターの全種と、各フォームのアートワーク充足を確認する管理画面です。",
};

export default function AdminMonstersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
