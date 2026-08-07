import type { Metadata } from "next";

/**
 * /monsters のタブ名。ページ本体は "use client" で metadata を持てないため、
 * この server layout に置く（描画には関与せず children を素通しする）。
 * 名前はサイドバーの jaLabel に合わせる（h1 の "Monster Dex" ではなく、
 * ユーザーが実際にクリックした語を history に残すため）。
 */
export const metadata: Metadata = {
  title: "図鑑・育成",
  description:
    "集めたモンスターの図鑑と、手持ちの育成（進化・覚醒・スキン装備）を行う画面です。",
};

export default function MonstersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
