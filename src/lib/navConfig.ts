/**
 * サイドバー/モバイルドロワー共通のナビゲーション定義（single source of truth）。
 *
 * グルーピングは D-1 の第一原則「名声(緑) と 課金(琥珀) の系統分離」に従う:
 * - NAVIGATION = 名声圏（毎日の周回ループ + 実績閲覧）
 * - SHOP       = 課金圏（買う・磨く）。glyph は琥珀（paid）
 *
 * 低頻度のアカウント系（/mints, /mypage/billing, legal）はサイドバー本体ではなく
 * HERO_STATUS フッターのメニューに置く（navConfig とは別、SideBar 内で定義）。
 */
export type NavItem = {
  glyph: string;
  label: string;
  href: string;
  paid?: boolean;
};

export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "NAVIGATION",
    items: [
      { glyph: "⌂", label: "~/home", href: "/" },
      { glyph: "◆", label: "~/monsters", href: "/monsters" },
      { glyph: "▣", label: "~/items", href: "/items" },
      { glyph: "≡", label: "~/summon", href: "/summon" },
      { glyph: "☄", label: "~/summon/limited", href: "/summon/limited", paid: true },
      { glyph: "◉", label: "~/badges", href: "/badges" },
      { glyph: "▲", label: "~/leaderboard", href: "/leaderboard" },
    ],
  },
  {
    label: "SHOP",
    items: [
      { glyph: "$", label: "~/shop", href: "/shop", paid: true },
      { glyph: "✦", label: "~/pass", href: "/pass", paid: true },
      { glyph: "⚒", label: "~/forge", href: "/forge", paid: true },
    ],
  },
];

/** HERO_STATUS フッターメニューの項目（アカウント圏）。 */
export const ACCOUNT_MENU_ITEMS: NavItem[] = [
  { glyph: "▦", label: "記念プレート工房", href: "/mints" },
  { glyph: "⛭", label: "課金・アカウント設定", href: "/mypage/billing" },
];

/** フッターに active 縁取りを出す「アカウント圏」パス。 */
export const ACCOUNT_PATHS = ["/mints", "/mypage/billing"];

/**
 * より具体的な href を優先する active 判定
 * （/summon と /summon/limited が両方ナビに載るため必要）。
 */
export function isNavActive(
  pathname: string,
  href: string,
  allHrefs: string[],
): boolean {
  if (href === "/") return pathname === "/";
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;
  const moreSpecific = allHrefs.some(
    (other) =>
      other !== href && other.startsWith(href) && pathname.startsWith(other),
  );
  return !moreSpecific;
}
