import Link from "next/link";

import { SHOP_TAB_GROUPS, type ShopTabKey } from "@/lib/shopNav";

/**
 * ショップ4画面共通のナビゲーション（サイドバーは ~/shop 1項目に集約し、
 * リーフの切替はページ内タブが担う）。
 *
 * 「ルーンを用意する」と「手持ちの資源をつかう」で段を分け、現金を使う
 * 導線だけを課金圏の琥珀で示す。押す前に「現金がかかるのか」が読めることを
 * 優先する。各画面が何をする場所かは、その画面の見出しが述べる
 * （`shopNav` の purpose / cost）。
 */
export function ShopTabs({ current }: { current: ShopTabKey }) {
  return (
    <div className="min-w-0">
      <nav aria-label="ショップ" className="flex flex-wrap gap-x-5 gap-y-3">
        {SHOP_TAB_GROUPS.map((group) => (
          <div className="min-w-0" key={group.key}>
            <p className="mb-1 text-[9px] tracking-[0.14em] text-text-faint">
              {group.label}
            </p>
            <div className="flex border border-line text-[11px]">
              {group.tabs.map((tab, index) => {
                const border = index > 0 ? "border-l border-line" : "";
                const money = tab.usesRealMoney ? "text-rune" : "text-text";
                return tab.key === current ? (
                  <span
                    aria-current="page"
                    className={`bg-bg-elev-2 px-3 py-2 font-semibold ${money} ${border}`}
                    key={tab.key}
                  >
                    {tab.label}
                  </span>
                ) : (
                  <Link
                    className={`px-3 py-2 text-text-dim transition-colors hover:text-text ${border}`}
                    href={tab.href}
                    key={tab.key}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
