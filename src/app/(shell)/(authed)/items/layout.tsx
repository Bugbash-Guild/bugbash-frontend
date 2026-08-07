import type { Metadata } from "next";

/**
 * /items のタブ名。ページ本体は "use client" で metadata を持てない。
 * h1 は "Inventory" だが、この画面への導線ラベル（/monsters の
 * 「インベントリ →」）に合わせて日本語にする — タブ一覧を日本語で
 * 走査できるようにするため。
 */
export const metadata: Metadata = {
  title: "インベントリ",
  description: "手持ちの魂や進化の素材を一覧で確認する持ち物の画面です。",
};

export default function ItemsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
