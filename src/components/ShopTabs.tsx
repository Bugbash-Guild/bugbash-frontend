import Link from "next/link";

type ShopTab = "runes" | "skins" | "items";

const TABS: { key: ShopTab; label: string; href: string }[] = [
  { key: "runes", label: "RUNES", href: "/shop/runes" },
  { key: "skins", label: "SKINS", href: "/shop/skins" },
  { key: "items", label: "ITEMS", href: "/shop" },
];

/**
 * ショップ3画面共通のタブ（サイドバーは ~/shop 1項目に集約し、
 * リーフの切替はページ内タブが担う）。active は課金圏の琥珀。
 */
export function ShopTabs({ current }: { current: ShopTab }) {
  return (
    <nav aria-label="ショップ種別" className="inline-flex border border-line text-[11px]">
      {TABS.map((tab, index) =>
        tab.key === current ? (
          <span
            aria-current="page"
            className={[
              "bg-bg-elev-2 px-3 py-2 font-semibold text-rune",
              index === 1 ? "border-x border-line" : "",
            ].join(" ")}
            key={tab.key}
          >
            {tab.label}
          </span>
        ) : (
          <Link
            className={[
              "px-3 py-2 text-text-dim transition-colors hover:text-text",
              index === 1 ? "border-x border-line" : "",
            ].join(" ")}
            href={tab.href}
            key={tab.key}
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}
