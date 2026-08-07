"use client";

import Link from "next/link";
import useSWR from "swr";

import { fetchMasterJson } from "@/lib/masterData";
import { SHOP_TAB_GROUPS, type ShopTabKey } from "@/lib/shopNav";
import type { MonsterSkinCatalogItem } from "@/lib/skinCatalog";

type SkinCatalogResponse = {
  skins: MonsterSkinCatalogItem[];
};

/**
 * ショップ4画面共通のナビゲーション（サイドバーは ~/shop 1項目に集約し、
 * リーフの切替はページ内タブが担う）。
 *
 * 「ルーンを用意する」と「手持ちの資源をつかう」で段を分け、現金を使う
 * 導線だけを課金圏の琥珀で示す。押す前に「現金がかかるのか」が読めることを
 * 優先する。各画面が何をする場所かは、その画面の見出しが述べる
 * （`shopNav` の purpose / cost）。
 *
 * スキンタブの「準備中」注記: カタログが0件と**確認できたときだけ**付ける
 * （取得前・取得失敗時は何も言わない）。/api/skins はマスタデータ
 * （BE の Cache-Control 5分 + SWR キーを useSkinCatalog と共有）なので、
 * タブのための追加コストはほぼない。スキンが公開されれば注記は自動で消える。
 */
export function ShopTabs({ current }: { current: ShopTabKey }) {
  const { data } = useSWR<SkinCatalogResponse>(
    "/api/skins",
    (url: string) => fetchMasterJson<SkinCatalogResponse>(url, "skin catalog"),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const skinsPreparing = data != null && data.skins.length === 0;

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
                const preparingNote = tab.key === "skins" && skinsPreparing && (
                  <span className="ml-1 text-[9px] font-normal text-text-faint">
                    準備中
                  </span>
                );
                return tab.key === current ? (
                  <span
                    aria-current="page"
                    className={`bg-bg-elev-2 px-3 py-2 font-semibold ${money} ${border}`}
                    key={tab.key}
                  >
                    {tab.label}
                    {preparingNote}
                  </span>
                ) : (
                  <Link
                    className={`px-3 py-2 text-text-dim transition-colors hover:text-text ${border}`}
                    href={tab.href}
                    key={tab.key}
                  >
                    {tab.label}
                    {preparingNote}
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
