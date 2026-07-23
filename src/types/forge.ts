export type ForgeTrack = "MONSTER" | "BADGE";

export type ForgeLevelDef = {
  diffNote: string;
  effectTier: string;
  level: number;
  runeCost: number;
  track: ForgeTrack;
  unlockDimension: string;
};

export type OwnedMonsterSkin = {
  acquiredAt: string;
  assetBasePath: string;
  equipped: boolean;
  lineName: string;
  masteryLevel: number;
  monsterSlug: string;
  skinId: string;
  tier: string;
};

export type OwnedMonsterSkinsResponse = {
  skins: OwnedMonsterSkin[];
};

export type ForgeUpgradeRequest = {
  expectedFromRank: number;
  idempotencyKey: string;
  targetRefId: string;
  targetType: "HERO_SKIN";
};

export type ForgeUpgradeResponse = {
  forgeRank: number;
  nextCost: number | null;
  paidRuneBalance: number;
  runeBalance: number;
  runeSpent: number;
  targetRefId: string;
  targetType: "HERO_SKIN";
  unlockedDimension: string;
};

export type ForgeCostRow = ForgeLevelDef & {
  cumulativeRuneCost: number;
};
