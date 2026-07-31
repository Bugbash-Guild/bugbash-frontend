/**
 * ショップの案内構造。
 *
 * 以前のタブは RUNES / SKINS / ITEMS / PASS の4枚で、**在庫の種類**が
 * そのまま並んでいた。ユーザーが実際に知りたいのは
 * 「ここは現金がかかるのか」「何をする場所なのか」であって、
 * 在庫の種類ではない。RUNES と ITEMS の違いを、ラベルだけから
 * 判断させるのは無理がある。
 *
 * ここでは **資源を用意する場所** と **資源を使う場所** に分け、
 * 各タブに「何に使う場所か」と「何を支払うか」を持たせる。
 * 支払いを先に述べるのは、押してから現金決済だと気づく体験を避けるため。
 */
export type ShopTabKey = "items" | "pass" | "runes" | "skins";

export type ShopTabGroupKey = "charge" | "spend";

export type ShopTab = {
  /** 支払いに使うもの。押す前に現金かどうかが分かるように。 */
  cost: string;
  href: string;
  key: ShopTabKey;
  label: string;
  /** 何のための場所か（ラベルだけでは読めないため）。 */
  purpose: string;
  /** 現金（日本円）を使う導線か。課金圏の色分けに使う。 */
  usesRealMoney: boolean;
};

export type ShopTabGroup = {
  key: ShopTabGroupKey;
  label: string;
  tabs: ShopTab[];
};

export const SHOP_TAB_GROUPS: ShopTabGroup[] = [
  {
    key: "charge",
    label: "ルーンを用意する",
    tabs: [
      {
        cost: "日本円",
        href: "/shop/runes",
        key: "runes",
        label: "ルーン購入",
        purpose: "召喚やアイテムに使うルーンを、必要な分だけ購入します。",
        usesRealMoney: true,
      },
      {
        cost: "日本円（月額）",
        href: "/pass",
        key: "pass",
        label: "冒険者パス",
        purpose: "毎月ルーンが届く月額プランです。いつでも解約できます。",
        usesRealMoney: true,
      },
    ],
  },
  {
    key: "spend",
    label: "手持ちの資源をつかう",
    tabs: [
      {
        cost: "ギルドコイン / ルーン",
        href: "/shop",
        key: "items",
        label: "育成アイテム",
        purpose: "相棒のレベルアップと進化に使う道具です。",
        usesRealMoney: false,
      },
      {
        cost: "ルーン",
        href: "/shop/skins",
        key: "skins",
        label: "見た目",
        purpose: "相棒の見た目を変えます。能力は変わりません。",
        usesRealMoney: false,
      },
    ],
  },
];

export const SHOP_TABS: ShopTab[] = SHOP_TAB_GROUPS.flatMap((group) => group.tabs);

export function findShopTab(key: ShopTabKey): ShopTab {
  const tab = SHOP_TABS.find((candidate) => candidate.key === key);
  // 到達しない: key は ShopTabKey に閉じている。落ちるより気づけるように投げる。
  if (tab == null) throw new Error(`unknown shop tab: ${key}`);
  return tab;
}
