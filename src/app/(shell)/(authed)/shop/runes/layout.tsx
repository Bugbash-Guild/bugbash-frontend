import type { Metadata } from "next";

/**
 * /shop/runes のタブ名。ページ本体は "use client" で metadata を持てない。
 * h1 とショップタブのラベルが一致しているのでそのまま使う。
 */
export const metadata: Metadata = {
  title: "ルーン購入",
  description:
    "召喚やアイテムに使うルーンを、必要な分だけ購入する画面です。支払いは日本円です。",
};

export default function ShopRunesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
