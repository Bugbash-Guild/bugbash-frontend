/**
 * サイドバー/モバイルドロワー共通のナビゲーション定義（single source of truth）。
 *
 * 方針: **サイドバーには「セッションの起点」だけを置く**。
 * 実際の利用は次の4つで始まる — 何が起きた?(home) / 集めたものを見る(monsters) /
 * 引く(summon) / 見せる・比べる(profile, leaderboard)。課金の入口は shop 1つ。
 *
 * 起点にならない画面（items・badges・forge・mints・pass・summon/limited・billing）は
 * 廃止せず、それが必要になる文脈から入る:
 *   - items   → monsters の素材ストリップから
 *   - badges  → プロフィールのバッジ壁から
 *   - forge   → monsters の ⚒ バッジ / スキン詳細の「マスタリーで深化」から
 *   - mints   → プロフィールの記念プレート棚から
 *   - pass    → shop のタブから
 *   - limited → summon ページ内のリンクから
 *   - billing → HERO_STATUS メニューから
 *
 * 系統分離（名声=緑 / 課金=琥珀）は、琥珀が shop 1項目だけになることで明確化される。
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
      { glyph: "≡", label: "~/summon", href: "/summon" },
      { glyph: "▲", label: "~/leaderboard", href: "/leaderboard" },
    ],
  },
  {
    label: "SHOP",
    items: [{ glyph: "$", label: "~/shop", href: "/shop", paid: true }],
  },
];

/** HERO_STATUS フッターメニューの項目（アカウント圏）。 */
export const ACCOUNT_MENU_ITEMS: NavItem[] = [
  { glyph: "⛭", label: "課金・アカウント設定", href: "/mypage/billing" },
];

/** フッターに active 縁取りを出す「アカウント圏」パス。 */
export const ACCOUNT_PATHS = ["/mypage/billing"];

/**
 * より具体的な href を優先する active 判定。
 * サイドバー非掲載のページは、その入口となるセクションを active にする
 * （例: /items 閲覧中は ~/monsters、/forge は ~/shop）。
 */
const SECTION_OF: Record<string, string> = {
  "/items": "/monsters",
  "/forge": "/shop",
  "/pass": "/shop",
};

/** プロフィール項目を active 扱いにするページ（バッジ壁・記念プレート棚の実体）。 */
export const PROFILE_ADJACENT_PATHS = ["/badges", "/mints"];

export function isNavActive(
  pathname: string,
  href: string,
  allHrefs: string[],
): boolean {
  if (SECTION_OF[pathname] != null) return SECTION_OF[pathname] === href;
  if (href === "/") return pathname === "/";
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;
  const moreSpecific = allHrefs.some(
    (other) =>
      other !== href && other.startsWith(href) && pathname.startsWith(other),
  );
  return !moreSpecific;
}
