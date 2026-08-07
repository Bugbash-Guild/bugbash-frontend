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

/**
 * 鋳造権の解放条件。BE の判定実装
 * （ReconcileCommemorativeMintRightsUseCase: PR_MERGED_THRESHOLD=100 /
 * MONSTER_LEVEL_THRESHOLD=100 / prAcquirable 全種の PR 入手）と 1:1 の
 * 事実開示なので、BE の閾値を変えるときはここも同時に更新する。
 */
const ACHIEVEMENT_REQUIREMENTS: Record<CommemorativeAchievement, string> = {
  PR_MERGED_100: "マージされたPRが累計100件に到達すると解放されます。",
  MONSTER_LEVEL_100: "モンスター1体をLv.100まで育てると解放されます。",
  CODEX_COMPLETE: "PRで入手できる全モンスターを図鑑に登録すると解放されます。",
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

export type MintPurchaseFailure = {
  clearIdempotencyKey: boolean;
  message: string;
  refreshOffers: boolean;
  refreshWallet: boolean;
  retrySameContent: boolean;
  routeToLogin: boolean;
};

export function mapMintPurchaseFailure(status: number): MintPurchaseFailure {
  switch (status) {
    case 400:
      return {
        clearIdempotencyKey: false,
        message: "鋳造内容が最新の状態と一致しません。内容を確認してからもう一度操作してください。",
        refreshOffers: true,
        refreshWallet: false,
        retrySameContent: false,
        routeToLogin: false,
      };
    case 401:
      return {
        clearIdempotencyKey: false,
        message: "",
        refreshOffers: false,
        refreshWallet: false,
        retrySameContent: false,
        routeToLogin: true,
      };
    case 409:
      return {
        clearIdempotencyKey: true,
        message: "鋳造内容を確認する必要があります。最新の状態を確認して、内容を選び直してください。",
        refreshOffers: true,
        refreshWallet: true,
        retrySameContent: false,
        routeToLogin: false,
      };
    case 422:
      return {
        clearIdempotencyKey: false,
        message: "現在このプレートは鋳造できません。残高と鋳造権を確認してください。",
        refreshOffers: true,
        refreshWallet: true,
        retrySameContent: false,
        routeToLogin: false,
      };
    default:
      return {
        clearIdempotencyKey: false,
        message: "通信結果を確認できません。同じ内容で再試行できます。",
        refreshOffers: false,
        refreshWallet: false,
        retrySameContent: true,
        routeToLogin: false,
      };
  }
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

/** プレートの通し番号表記（刻印・完了表示で共通の形にする）。 */
export function formatMintNumber(mintNumber: number): string {
  return `#${String(mintNumber).padStart(6, "0")}`;
}

export function formatPlateEngraving(
  plate: Pick<
    CommemorativeMintPlate,
    | "achievement"
    | "achievedAt"
    | "achievedAtEstimated"
    | "mintNumber"
    | "repositoryFullName"
  >,
) {
  const date = new Date(plate.achievedAt);
  const achievedDate = Number.isNaN(date.valueOf())
    ? "—"
    : `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCDate()).padStart(2, "0")}`;
  return {
    achievement: ACHIEVEMENT_LABELS[plate.achievement],
    achievedDate,
    achievedLabel: plate.achievedAtEstimated ? "達成時期（推定）" : "達成日",
    mintNumber: formatMintNumber(plate.mintNumber),
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

/** 未達成の実績に対して「何をすれば鋳造できるか」の事実を返す。 */
export function getAchievementRequirement(
  achievement: CommemorativeAchievement,
): string {
  return ACHIEVEMENT_REQUIREMENTS[achievement];
}

export function getFirstAllowedRecolor(
  recolors: readonly CommemorativeMintRecolor[],
): CommemorativeMintRecolor | null {
  return recolors[0] ?? null;
}
