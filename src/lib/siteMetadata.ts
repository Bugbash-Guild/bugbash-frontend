/**
 * タブ名（<title>）の共通定義。
 *
 * root layout が `%s | BugBash` の template を持つので、各ルートの layout は
 * `title: "図鑑・育成"` と**素の文字列**を書くだけで接尾辞が付く。
 * ページ本体はほぼ全て "use client" で metadata を持てないため、タブ名の
 * 置き場所は「そのルートの layout.tsx」に統一する（探す場所を1つにする）。
 *
 * ⚠️ Next.js のタイトル解決の癖:
 * template は「title を宣言した segment の**子**」に引き継がれるが、
 * 文字列の title を宣言した segment は子への template を **null に落とす**
 * （resolveTitle が string 由来の template を持たないため）。
 * したがって **自分もページを持ち、かつ子ルートも持つ** layout
 * （/shop・/summon）では、素の文字列ではなく
 *   title: { default: "ショップ", template: TITLE_TEMPLATE }
 * と書いて template を明示的に引き継ぐこと。ここを直書き文字列にすると
 * 接尾辞を変えたときに子ルート（/shop/runes 等）だけ古い表記が残る。
 */
export const SITE_NAME = "BugBash";

export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
