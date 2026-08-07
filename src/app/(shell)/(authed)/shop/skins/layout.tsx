import type { Metadata } from "next";

/**
 * /shop/skins のタブ名。ページ本体は "use client" で metadata を持てない。
 * ショップタブのラベルは「見た目」だが、タブ単独で読めるよう h1 の
 * 「スキンカタログ」を採る。
 */
export const metadata: Metadata = {
  title: "スキンカタログ",
  description:
    "相棒の見た目を変えるスキンのカタログです。強さや報酬は変わりません。",
};

export default function ShopSkinsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
