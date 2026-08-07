/**
 * シェル（サイドバー/モバイルドロワー/トップバー）共通のナビゲーション定義
 * （single source of truth）。
 *
 * 方針: **サイドバーには「セッションの起点」だけを置く**。
 * 実際の利用は次の4つで始まる — 何が起きた?(home) / 集めたものを見る(monsters) /
 * 引く(summon) / 比べる(leaderboard)。課金の入口は shop 1つ。
 *
 * 「自分」（プロフィール・実績バッジ・アカウント設定）はナビの世界には
 * 置かず、フッターの HERO_STATUS ゾーンに集約する — 自分の名前と Lv が
 * 出ている場所が自分のページへの扉、というオーナー判断（2026-08-07）。
 * 以前ナビ2番目に注入していた ~/@username はこのゾーンへ移った。
 *
 * 起点にならない画面（items・badges・forge・mints・pass・summon/limited・billing）は
 * 廃止せず、それが必要になる文脈から入る:
 *   - items   → monsters の素材ストリップから
 *   - badges  → HERO_STATUS メニュー / home の実績行 / プロフィールのバッジ壁から
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
  /**
   * 日本語の補助ラベル（SideBar が 10px faint で併記）。
   * 英語コマンド表記はコンソール美学として維持し、置き換えではなく
   * 併記で初見の解読コストだけを消す（UX-BLUEPRINT-2026-08 §2）。
   */
  jaLabel?: string;
  href: string;
  paid?: boolean;
};

export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "NAVIGATION",
    items: [
      { glyph: "⌂", label: "~/home", jaLabel: "ホーム", href: "/" },
      { glyph: "◆", label: "~/monsters", jaLabel: "図鑑・育成", href: "/monsters" },
      { glyph: "≡", label: "~/summon", jaLabel: "召喚", href: "/summon" },
      { glyph: "▲", label: "~/leaderboard", jaLabel: "ランキング", href: "/leaderboard" },
    ],
  },
  {
    label: "SHOP",
    items: [
      { glyph: "$", label: "~/shop", jaLabel: "ショップ", href: "/shop", paid: true },
    ],
  },
];

/**
 * HERO_STATUS フッターメニューの項目（「自分」ゾーン）。
 * 実績バッジをここに常設する — 入口が home の実績行とプロフィール内リンク
 * だけでは「どこから行くのか」が分からないというフィードバックへの回答。
 */
export const ACCOUNT_MENU_ITEMS: NavItem[] = [
  { glyph: "⚔", label: "実績バッジ", href: "/badges" },
  { glyph: "⛭", label: "課金・アカウント設定", href: "/mypage/billing" },
];

/**
 * フッターに active 縁取りを出す「自分」ゾーンのパス。
 * 自分の公開プロフィール（/heroes/{自分のid}）は動的なので SideBar 側で判定。
 */
export const ACCOUNT_PATHS = ["/mypage/billing", "/badges", "/mints"];

/**
 * より具体的な href を優先する active 判定。
 * サイドバー非掲載のページは、その入口となるセクションを active にする
 * （例: /items・/forge 閲覧中は ~/monsters、/pass は ~/shop）。
 *
 * /forge が ~/shop でなく ~/monsters なのは、工房が「買う」ではなく
 * 手持ちを「育てる」文脈のため。入口も monsters の ⚒ バッジ側にある（§2）。
 */
const SECTION_OF: Record<string, string> = {
  "/items": "/monsters",
  "/forge": "/monsters",
  "/pass": "/shop",
};

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

export type RuneChipTarget = {
  href: "/summon/limited" | "/mypage/billing";
  title: string;
};

/**
 * トップバー（ConsoleTopbar）のルーン残高チップの行き先。
 *
 * 残高の隣に「使い道 / 管理場所」への扉を置く: 限定召喚が開催中なら
 * その売り場（/summon/limited）、平時は残高の管理場所（/mypage/billing）。
 *
 * 開催中の判定根拠は限定開示APIの singlePullCost（正のコストが返る =
 * 引ける池が実在する。LimitedSummonBanner と同じ述語）だけ。
 * 未取得・取得失敗・コスト0以下の間は「開催中」を名乗らない —
 * 事実で裏づけられない誘導はしない方針なので、迷ったら管理場所に落とす。
 */
export function runeChipTarget(
  limitedSinglePullCost: number | null | undefined,
): RuneChipTarget {
  const limitedLive =
    typeof limitedSinglePullCost === "number" && limitedSinglePullCost > 0;
  return limitedLive
    ? { href: "/summon/limited", title: "ルーン残高 — 限定召喚が開催中" }
    : { href: "/mypage/billing", title: "ルーン残高 — 課金・アカウント設定で管理" };
}
