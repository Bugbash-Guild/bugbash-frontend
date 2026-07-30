import type { ShopItem, ShopItemCurrency } from "@/types/shop";

/**
 * ショップの情報構造。
 *
 * API は属性魂パックを 6属性 × 3サイズ = 18件のフラットな商品として返す。
 * それを18枚のカードとして並べると、ほぼ同じ見た目のボタンが大量に生えて
 * 「何を選ぶ画面なのか」が読めなくなる（実際そうなっていた）。
 *
 * これは18種類の商品ではなく **1種類の商品 × 2つのパラメータ** なので、
 * 「属性を選ぶ → サイズを選ぶ」という1つのまとまりに畳む。
 * 畳む判断は BE が渡す variantGroup / attribute / sizeSuffix に従い、
 * itemId の文字列解析はしない。
 */
export type ShopVariantAxisValue = {
  label: string;
  value: string;
};

export type ShopVariantGroup = {
  /** 属性の選択肢（API に存在する順・重複なし）。 */
  attributes: ShopVariantAxisValue[];
  currency: ShopItemCurrency;
  /** `${attribute}:${size}` → 商品。 */
  itemsByVariant: Map<string, ShopItem>;
  key: string;
  /** サイズの選択肢（API に存在する順・重複なし）。 */
  sizes: ShopVariantAxisValue[];
  title: string;
};

export type ShopSection = {
  /** バリエーションに畳めなかった単独商品。 */
  items: ShopItem[];
  key: string;
  note: string | null;
  title: string;
  variantGroups: ShopVariantGroup[];
};

const SECTION_META: Record<string, { note: string | null; order: number; title: string }> = {
  SOUL_PACK: {
    note: "魂は相棒のレベルアップに使います。",
    order: 1,
    title: "魂パック",
  },
  EVOLUTION: {
    note: "進化と路線変更に使う素材です。",
    order: 2,
    title: "進化・路線変更",
  },
};

const VARIANT_GROUP_TITLE: Record<string, string> = {
  "attribute-soul-pack": "属性を指定して付与",
};

function variantKey(attribute: string, size: string): string {
  return `${attribute}:${size}`;
}

function pushUnique(list: ShopVariantAxisValue[], value: string, label: string): void {
  if (list.some((entry) => entry.value === value)) return;
  list.push({ label, value });
}

/** バリエーションに畳める商品か（属性とサイズの両方が揃っているもののみ）。 */
function isVariant(item: ShopItem): boolean {
  return (
    item.variantGroup != null &&
    item.variantGroup !== "" &&
    item.attribute != null &&
    item.sizeSuffix != null
  );
}

export function buildShopSections(items: ShopItem[]): ShopSection[] {
  const sections = new Map<string, ShopSection>();
  const groups = new Map<string, ShopVariantGroup>();

  for (const item of items) {
    const categoryKey = item.category ?? "OTHER";
    const meta = SECTION_META[categoryKey];
    const section =
      sections.get(categoryKey) ??
      ({
        items: [],
        key: categoryKey,
        note: meta?.note ?? null,
        title: meta?.title ?? "その他",
        variantGroups: [],
      } satisfies ShopSection);
    sections.set(categoryKey, section);

    if (!isVariant(item)) {
      section.items.push(item);
      continue;
    }

    const groupKey = `${categoryKey}/${item.variantGroup}`;
    let group = groups.get(groupKey);
    if (!group) {
      group = {
        attributes: [],
        currency: item.currency,
        itemsByVariant: new Map(),
        key: groupKey,
        sizes: [],
        title: VARIANT_GROUP_TITLE[item.variantGroup as string] ?? "バリエーションを選ぶ",
      };
      groups.set(groupKey, group);
      section.variantGroups.push(group);
    }
    pushUnique(group.attributes, item.attribute as string, item.attributeLabel ?? (item.attribute as string));
    pushUnique(group.sizes, item.sizeSuffix as string, item.sizeLabel ?? (item.sizeSuffix as string));
    group.itemsByVariant.set(variantKey(item.attribute as string, item.sizeSuffix as string), item);
  }

  return [...sections.values()].sort(
    (a, b) => (SECTION_META[a.key]?.order ?? 99) - (SECTION_META[b.key]?.order ?? 99),
  );
}

export function findVariantItem(
  group: ShopVariantGroup,
  attribute: string,
  size: string,
): ShopItem | undefined {
  return group.itemsByVariant.get(variantKey(attribute, size));
}

/** その属性で買える全サイズ（存在しない組み合わせは落とす）。 */
export function variantItemsForAttribute(
  group: ShopVariantGroup,
  attribute: string,
): { item: ShopItem; size: ShopVariantAxisValue }[] {
  return group.sizes
    .map((size) => ({ item: findVariantItem(group, attribute, size.value), size }))
    .filter((entry): entry is { item: ShopItem; size: ShopVariantAxisValue } => entry.item != null);
}
