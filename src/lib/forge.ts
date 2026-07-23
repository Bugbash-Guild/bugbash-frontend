import type { ForgeCostRow, ForgeLevelDef } from "@/types/forge";

export const FORGE_COSMETIC_ONLY_COPY =
  "この強化で変わるのは見た目だけです。ステータス・報酬・順位には影響しません。";

export const APEX_PARTICLE_LIMIT = 20;

const PRS_PER_APEX_PARTICLE = 20;

export function buildApexParticleSlots(totalPrsMerged: number): number[] {
  const particleCount = Math.min(
    Math.ceil(Math.max(0, totalPrsMerged) / PRS_PER_APEX_PARTICLE),
    APEX_PARTICLE_LIMIT,
  );

  return Array.from({ length: particleCount }, (_, index) => index);
}

export function buildForgeCostTable(
  definitions: ForgeLevelDef[],
): ForgeCostRow[] {
  let cumulativeRuneCost = 0;

  return [...definitions]
    .sort((left, right) => left.level - right.level)
    .map((definition) => {
      cumulativeRuneCost += definition.runeCost;
      return { ...definition, cumulativeRuneCost };
    });
}

export function selectForgeStages(
  definitions: ForgeLevelDef[],
  currentRank: number,
): {
  apex: ForgeLevelDef | undefined;
  current: ForgeLevelDef | undefined;
  next: ForgeLevelDef | undefined;
} {
  const ordered = [...definitions].sort((left, right) => left.level - right.level);

  return {
    apex: ordered.at(-1),
    current: ordered.find((definition) => definition.level === currentRank),
    next: ordered.find((definition) => definition.level === currentRank + 1),
  };
}

export type ForgeUpgradeEligibility = {
  currentRank: number;
  expectedRank: number;
  isOwned: boolean;
  next: ForgeLevelDef | undefined;
  runeBalance: number;
};

export function canUpgradeForge({
  currentRank,
  expectedRank,
  isOwned,
  next,
  runeBalance,
}: ForgeUpgradeEligibility): boolean {
  return (
    isOwned &&
    currentRank === expectedRank &&
    next !== undefined &&
    runeBalance >= next.runeCost
  );
}

export class ForgeIdempotencyKeys {
  private readonly pending = new Map<string, string>();

  constructor(private readonly createKey: () => string) {}

  get(skinId: string, expectedRank: number): string {
    const key = `${skinId}:${expectedRank}`;
    const existing = this.pending.get(key);
    if (existing) return existing;

    const created = this.createKey();
    this.pending.set(key, created);
    return created;
  }

  markSucceeded(skinId: string, expectedRank: number): void {
    this.pending.delete(`${skinId}:${expectedRank}`);
  }
}
