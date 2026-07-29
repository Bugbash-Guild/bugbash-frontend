"use client";

import { useState } from "react";

import { ItemVisual } from "@/components/ItemVisual";
import {
  buildShopPurchasePresentation,
  type ShopBalances,
} from "@/lib/shopPresentation";
import {
  type ShopSection,
  type ShopVariantGroup,
  variantItemsForAttribute,
} from "@/lib/shopSections";
import type { ShopItem } from "@/types/shop";

/**
 * ショップの商品一覧。
 *
 * 以前は API が返す24件をそのままフラットなカードグリッドに並べていた。
 * うち18件は 6属性 × 3サイズ の組み合わせで、ほぼ同じ見た目のボタンが
 * 大量に生えて「何を選ぶ画面なのか」が読めなくなっていた。
 *
 * 用途で区切り（魂パック / 進化・路線変更）、組み合わせ商品は
 * 「属性を選ぶ → サイズを選ぶ」の1つのまとまりに畳む。
 */
function PriceTag({
  balances,
  item,
}: {
  balances: ShopBalances;
  item: ShopItem;
}) {
  const presentation = buildShopPurchasePresentation(item, balances);
  return (
    <span
      className={`text-[13px] font-semibold tabular-nums ${
        presentation.canAfford ? "text-text" : "text-pink"
      }`}
    >
      {presentation.priceLabel}
    </span>
  );
}

/** 単独商品の行。 */
function ItemRow({
  balances,
  item,
  onSelect,
}: {
  balances: ShopBalances;
  item: ShopItem;
  onSelect: (item: ShopItem) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-bg-elev-2"
      onClick={() => onSelect(item)}
      type="button"
    >
      <ItemVisual
        alt={item.name}
        assetUrl={item.assetUrl}
        className="size-8 shrink-0"
        sizes="32px"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-text">{item.name}</span>
        {item.description && (
          <span className="block truncate text-[11px] text-text-faint">{item.description}</span>
        )}
      </span>
      <PriceTag balances={balances} item={item} />
    </button>
  );
}

/**
 * 組み合わせ商品。属性を1つ選び、その属性のサイズ行だけを出す。
 * 18個のボタンが「6チップ + 3行」になる。
 */
function VariantGroupCard({
  balances,
  group,
  onSelect,
}: {
  balances: ShopBalances;
  group: ShopVariantGroup;
  onSelect: (item: ShopItem) => void;
}) {
  const [attribute, setAttribute] = useState(group.attributes[0]?.value ?? "");
  const rows = variantItemsForAttribute(group, attribute);
  const selectedLabel =
    group.attributes.find((a) => a.value === attribute)?.label ?? attribute;

  return (
    <div className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="px-4 text-[11px] text-text-faint">{group.title}</div>

      <div
        aria-label="属性を選ぶ"
        className="flex flex-wrap gap-1.5 px-4 pt-2"
        role="group"
      >
        {group.attributes.map((a) => {
          const active = a.value === attribute;
          return (
            <button
              aria-pressed={active}
              className={`rounded-[3px] border px-2.5 py-1 text-[12px] transition-colors ${
                active
                  ? "border-rune-border bg-rune-bg text-rune"
                  : "border-line text-text-dim hover:border-line-strong hover:text-text"
              }`}
              key={a.value}
              onClick={() => setAttribute(a.value)}
              type="button"
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {rows.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-text-faint">
            {selectedLabel}の在庫がありません。
          </p>
        ) : (
          rows.map(({ item, size }) => (
            <button
              className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left transition-colors hover:bg-bg-elev-2"
              key={item.itemId}
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="w-8 shrink-0 text-[13px] font-semibold text-text">
                {size.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-text-faint">
                {item.description || item.name}
              </span>
              <PriceTag balances={balances} item={item} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function ShopSectionList({
  balances,
  onSelect,
  sections,
}: {
  balances: ShopBalances;
  onSelect: (item: ShopItem) => void;
  sections: ShopSection[];
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          className="overflow-hidden rounded-lg border border-line bg-bg-elev"
          key={section.key}
        >
          <div className="border-b border-line px-4 py-2.5">
            <h2 className="text-[11px] uppercase tracking-[0.12em] text-text-faint">
              {section.title}
            </h2>
            {section.note && (
              <p className="mt-0.5 text-[11px] text-text-dim">{section.note}</p>
            )}
          </div>

          {section.variantGroups.length > 0 && (
            <div className="py-3">
              {section.variantGroups.map((group) => (
                <VariantGroupCard
                  balances={balances}
                  group={group}
                  key={group.key}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}

          {section.items.length > 0 && (
            <div className={section.variantGroups.length > 0 ? "border-t border-line" : ""}>
              {section.items.map((item) => (
                <ItemRow
                  balances={balances}
                  item={item}
                  key={item.itemId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
