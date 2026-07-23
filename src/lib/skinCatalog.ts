export type SkinTier = "STD" | "DX" | "LG";

export type MonsterSkinCatalogItem = {
  assetBasePath: string;
  initialReleaseMonth: string;
  lineName: string;
  monsterSlug: string;
  priceRune: number;
  revivalMonth: string | null;
  skinId: string;
  tier: SkinTier;
};

export type OwnedSkinCatalogItem = {
  equipped: boolean;
  masteryLevel: number;
  skinId: string;
};

export type PresentedSkinCatalogItem = MonsterSkinCatalogItem & {
  equipped: boolean;
  masteryLevel: number;
  owned: boolean;
  targetMonsterOwned: boolean;
};

export type SkinCatalogLine = {
  lineName: string;
  skins: PresentedSkinCatalogItem[];
};

export type SkinRevivalEntry = Pick<
  MonsterSkinCatalogItem,
  "lineName" | "revivalMonth" | "skinId"
> & {
  revivalMonth: string;
};

export function buildSkinCatalogLines(
  skins: MonsterSkinCatalogItem[],
  ownedSkins: OwnedSkinCatalogItem[],
  ownedMonsterSlugs: ReadonlySet<string>,
): SkinCatalogLine[] {
  const ownedById = new Map(ownedSkins.map((skin) => [skin.skinId, skin]));
  const lines = new Map<string, PresentedSkinCatalogItem[]>();

  for (const skin of skins) {
    const owned = ownedById.get(skin.skinId);
    const presented = {
      ...skin,
      equipped: owned?.equipped ?? false,
      masteryLevel: owned?.masteryLevel ?? 0,
      owned: owned != null,
      targetMonsterOwned: ownedMonsterSlugs.has(skin.monsterSlug),
    };
    const line = lines.get(skin.lineName);
    if (line) {
      line.push(presented);
    } else {
      lines.set(skin.lineName, [presented]);
    }
  }

  return [...lines.entries()]
    .map(([lineName, lineSkins], originalIndex) => ({
      lineName,
      originalIndex,
      skins: [...lineSkins].sort(
        (left, right) =>
          Number(right.targetMonsterOwned) - Number(left.targetMonsterOwned),
      ),
    }))
    .sort(
      (left, right) =>
        Number(right.skins.some((skin) => skin.targetMonsterOwned)) -
          Number(left.skins.some((skin) => skin.targetMonsterOwned)) ||
        left.originalIndex - right.originalIndex,
    )
    .map(({ lineName, skins: lineSkins }) => ({ lineName, skins: lineSkins }));
}

export function buildSkinArtworkComparison(
  assetBasePath: string,
  assetsBaseUrl: string | null,
): { after: string; before: string } {
  const normalizedAssetsBaseUrl = assetsBaseUrl?.replace(/\/+$/u, "");

  if (normalizedAssetsBaseUrl) {
    return {
      before: `${normalizedAssetsBaseUrl}/${assetBasePath}/base.webp`,
      after: `${normalizedAssetsBaseUrl}/${assetBasePath}/berserk-final.webp`,
    };
  }

  return {
    before: `/game-assets/source/${assetBasePath}/base.png`,
    after: `/game-assets/source/${assetBasePath}/berserk-final.png`,
  };
}

export function buildSkinRevivalSchedule(
  skins: MonsterSkinCatalogItem[],
): SkinRevivalEntry[] {
  return skins
    .filter(
      (skin): skin is MonsterSkinCatalogItem & { revivalMonth: string } =>
        skin.revivalMonth != null,
    )
    .map(({ lineName, revivalMonth, skinId }) => ({
      lineName,
      revivalMonth,
      skinId,
    }))
    .sort(
      (left, right) =>
        left.revivalMonth.localeCompare(right.revivalMonth) ||
        left.lineName.localeCompare(right.lineName) ||
        left.skinId.localeCompare(right.skinId),
    );
}
