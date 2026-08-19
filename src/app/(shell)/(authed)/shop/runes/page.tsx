import { redirect } from "next/navigation";

/**
 * 旧ルーン購入ページ。ショップの1枚化（チャージ売り場は /shop の先頭）に伴い、
 * ブックマーク・外部リンク互換のためだけに残しているリダイレクト。
 * アプリ内のリンクは全て /shop を直接指しているので、通常ここは踏まれない。
 */
export default function LegacyRuneShopRedirect() {
  redirect("/shop");
}
