import type {
  CommemorativeAchievement,
  CommemorativeMintDisplayState,
  CommemorativeMintOffer,
  CommemorativeMintPlate,
  CommemorativeMintRecolor,
} from "@/types/commemorativeMint";

const ACHIEVEMENT_LABELS: Record<CommemorativeAchievement, string> = {
  PR_MERGED_100: "100 PR マージ",
  MONSTER_LEVEL_100: "モンスター Lv.100",
  CODEX_COMPLETE: "図鑑コンプリート",
};

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function getMintDisplayState(
  offer: Pick<CommemorativeMintOffer, "mint" | "unlocked">,
): CommemorativeMintDisplayState {
  if (offer.mint != null) return "minted";
  return offer.unlocked ? "unlocked" : "locked";
}

export function isAllowedRecolor(
  recolor: string,
  allowedRecolors: readonly string[],
): boolean {
  return allowedRecolors.includes(recolor);
}

export function getMintPricePresentation(
  offer: Pick<CommemorativeMintOffer, "runeCost">,
  runeBalance: number,
) {
  return {
    affordable: runeBalance >= offer.runeCost,
    runeCost: offer.runeCost,
    text: `${offer.runeCost.toLocaleString("ja-JP")} ルーン`,
  };
}

function idempotencyStorageKey(
  achievement: string,
  recolor: string,
): string {
  return `bugbash.commemorative-mint.${achievement}.${recolor}`;
}

export function createMintIdempotencyKeyManager(
  storage: StorageLike,
  createKey: () => string,
) {
  return {
    clear(achievement: string, recolor: string) {
      storage.removeItem(idempotencyStorageKey(achievement, recolor));
    },
    get(achievement: string, recolor: string): string {
      const key = idempotencyStorageKey(achievement, recolor);
      const existing = storage.getItem(key);
      if (existing != null) return existing;
      const generated = createKey();
      storage.setItem(key, generated);
      return generated;
    },
  };
}

export function formatPlateEngraving(
  plate: Pick<
    CommemorativeMintPlate,
    "achievement" | "achievedAt" | "mintNumber" | "repositoryFullName"
  >,
) {
  const date = new Date(plate.achievedAt);
  const achievedDate = Number.isNaN(date.valueOf())
    ? "—"
    : `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCDate()).padStart(2, "0")}`;
  return {
    achievement: ACHIEVEMENT_LABELS[plate.achievement],
    achievedDate,
    mintNumber: `#${String(plate.mintNumber).padStart(6, "0")}`,
    repository: `REPOSITORY / ${plate.repositoryFullName ?? "—"}`,
  };
}

export function matchMintToOwnedMonster<T extends Pick<CommemorativeMintPlate, "subjectOwnedMonsterId">>(
  mints: readonly T[],
  ownedMonsterId: string | number | undefined,
): T | undefined {
  if (ownedMonsterId == null) return undefined;
  return mints.find(
    (mint) => String(mint.subjectOwnedMonsterId) === String(ownedMonsterId),
  );
}

export function getAchievementLabel(achievement: CommemorativeAchievement): string {
  return ACHIEVEMENT_LABELS[achievement];
}

export function getFirstAllowedRecolor(
  recolors: readonly CommemorativeMintRecolor[],
): CommemorativeMintRecolor | null {
  return recolors[0] ?? null;
}
