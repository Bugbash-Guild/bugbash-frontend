export type CommemorativeAchievement =
  | "PR_MERGED_100"
  | "MONSTER_LEVEL_100"
  | "CODEX_COMPLETE";

export type CommemorativeMintRecolor = string;

export type CommemorativeMintPlate = {
  mintNumber: number;
  achievement: CommemorativeAchievement;
  achievedAt: string;
  repositoryFullName: string | null;
  subjectOwnedMonsterId: number | null;
  recolor: CommemorativeMintRecolor;
  mintedAt: string;
};

export type CommemorativeMintOffer = {
  achievement: CommemorativeAchievement;
  unlocked: boolean;
  achievedAt: string | null;
  repositoryFullName: string | null;
  subjectOwnedMonsterId: number | null;
  runeCost: number;
  allowedRecolors: CommemorativeMintRecolor[];
  mint: CommemorativeMintPlate | null;
};

export type CommemorativeMintDisplayState = "locked" | "unlocked" | "minted";
