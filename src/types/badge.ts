export type BadgeTier = {
  threshold: number;
  tier: number;
};

export type BadgeCatalogItem = {
  artKey: string;
  category: string;
  code: string;
  description: string;
  displayName: string;
  tiers: BadgeTier[];
};

export type BadgeProgress = BadgeCatalogItem & {
  counter: number;
  currentTier: number;
  earnedAt: string | null;
  equippedSlot: number | null;
  forgeRank: number;
  grade: number;
  isVisible: boolean;
  nextThreshold: number | null;
};

export type BadgeDisplaySettings = {
  code: string;
  equippedSlot: number | null;
  isVisible: boolean;
};

export type ForgeLevelDef = {
  diffNote: string;
  effectTier: string;
  level: number;
  runeCost: number;
  track: "BADGE" | "MONSTER";
  unlockDimension: string;
};

export type BadgeCosmeticRequest = {
  expectedFromRank: number;
  idempotencyKey: string;
};

export type BadgeCosmeticResponse = {
  forgeRank: number;
  nextCost: number | null;
  paidRuneBalance: number;
  runeBalance: number;
  runeSpent: number;
  targetRefId: string;
  targetType: "HERO_BADGE";
  unlockedDimension: string;
};
