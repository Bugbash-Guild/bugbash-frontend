import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShopSections,
  findVariantItem,
  variantItemsForAttribute,
} from "./shopSections";
import type { ShopItem } from "@/types/shop";

function soulPack(attribute: string, attributeLabel: string, size: string, sizeLabel: string, price: number): ShopItem {
  return {
    assetUrl: null,
    attribute,
    attributeLabel,
    category: "SOUL_PACK",
    currency: "RUNE",
    description: `${attributeLabel}属性に付与`,
    iconEmoji: "🔮",
    itemId: `${attribute}-soul-pack-${size}`,
    name: `${attributeLabel}の魂パック・${sizeLabel}`,
    price,
    sizeLabel,
    sizeSuffix: size,
    variantGroup: "attribute-soul-pack",
  };
}

function plain(itemId: string, name: string, category: ShopItem["category"], price: number): ShopItem {
  return {
    assetUrl: null,
    category,
    currency: "GUILD_COIN",
    description: "",
    iconEmoji: "▣",
    itemId,
    name,
    price,
  };
}

const ATTRS: [string, string][] = [
  ["fire", "炎"],
  ["water", "水"],
  ["thunder", "雷"],
  ["nature", "自然"],
  ["light", "光"],
  ["dark", "闇"],
];
const SIZES: [string, string, number][] = [
  ["s", "小", 30],
  ["m", "中", 80],
  ["l", "大", 210],
];

const allItems: ShopItem[] = [
  ...ATTRS.flatMap(([a, al]) => SIZES.map(([s, sl, p]) => soulPack(a, al, s, sl, p))),
  plain("soul-pack-s", "魂パック・小", "SOUL_PACK", 500),
  plain("soul-pack-m", "魂パック・中", "SOUL_PACK", 1500),
  plain("soul-pack-l", "魂パック・大", "SOUL_PACK", 3000),
  plain("evolution-stone", "進化の輝石", "EVOLUTION", 2000),
  plain("purification-proof", "浄化の証", "EVOLUTION", 5000),
  plain("abyss-proof", "深淵の証", "EVOLUTION", 20000),
];

describe("buildShopSections", () => {
  it("collapses the 18 attribute soul packs into a single 6x3 group", () => {
    const sections = buildShopSections(allItems);
    const soul = sections.find((s) => s.key === "SOUL_PACK");

    assert.equal(soul?.variantGroups.length, 1);
    assert.equal(soul?.variantGroups[0]?.attributes.length, 6);
    assert.equal(soul?.variantGroups[0]?.sizes.length, 3);
    assert.equal(soul?.variantGroups[0]?.itemsByVariant.size, 18);
  });

  it("keeps non-variant items of the same category as plain items", () => {
    const sections = buildShopSections(allItems);
    const soul = sections.find((s) => s.key === "SOUL_PACK");

    assert.deepEqual(
      soul?.items.map((i) => i.itemId),
      ["soul-pack-s", "soul-pack-m", "soul-pack-l"],
    );
  });

  it("groups by category and orders soul packs before evolution items", () => {
    const sections = buildShopSections(allItems);
    assert.deepEqual(
      sections.map((s) => s.key),
      ["SOUL_PACK", "EVOLUTION"],
    );
    assert.equal(sections[1]?.items.length, 3);
    assert.equal(sections[1]?.variantGroups.length, 0);
  });

  it("puts an unknown category into その他 rather than dropping it", () => {
    const sections = buildShopSections([
      ...allItems,
      { ...plain("mystery", "謎の品", "SOUL_PACK", 1), category: "FUTURE" as ShopItem["category"] },
    ]);
    const other = sections.find((s) => s.key === "FUTURE");
    assert.equal(other?.title, "その他");
    assert.equal(other?.items.length, 1);
  });

  it("treats an item missing attribute or size as a plain item, not a broken variant", () => {
    const halfBaked: ShopItem = {
      ...soulPack("fire", "炎", "s", "小", 30),
      itemId: "half-baked",
      sizeSuffix: null,
    };
    const sections = buildShopSections([halfBaked]);
    assert.equal(sections[0]?.variantGroups.length, 0);
    assert.deepEqual(sections[0]?.items.map((i) => i.itemId), ["half-baked"]);
  });

  it("does not duplicate axis values when many items share an attribute", () => {
    const sections = buildShopSections(allItems);
    const group = sections[0]?.variantGroups[0];
    assert.deepEqual(
      group?.attributes.map((a) => a.value),
      ["fire", "water", "thunder", "nature", "light", "dark"],
    );
    assert.deepEqual(group?.sizes.map((s) => s.label), ["小", "中", "大"]);
  });
});

describe("variantItemsForAttribute", () => {
  it("returns every size available for the chosen attribute in axis order", () => {
    const group = buildShopSections(allItems)[0]?.variantGroups[0];
    assert.ok(group);
    const rows = variantItemsForAttribute(group, "water");

    assert.deepEqual(
      rows.map((r) => [r.size.label, r.item.price]),
      [
        ["小", 30],
        ["中", 80],
        ["大", 210],
      ],
    );
  });

  it("skips combinations the API did not provide", () => {
    const partial = [
      soulPack("fire", "炎", "s", "小", 30),
      soulPack("fire", "炎", "l", "大", 210),
      soulPack("water", "水", "m", "中", 80),
    ];
    const group = buildShopSections(partial)[0]?.variantGroups[0];
    assert.ok(group);

    assert.deepEqual(
      variantItemsForAttribute(group, "fire").map((r) => r.size.value),
      ["s", "l"],
    );
    assert.equal(findVariantItem(group, "fire", "m"), undefined);
  });
});
