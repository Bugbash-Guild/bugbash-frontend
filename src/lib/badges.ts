import type {
  BadgeCosmeticRequest,
  BadgeProgress,
  ForgeLevelDef,
} from "@/types/badge";

export const BADGE_PRESTIGE_COPY =
  "バッジのティアは GitHub 活動でのみ上がります";
export const COSMETIC_ONLY_COPY =
  "この購入で変わるのは見た目だけです。ステータス・報酬・順位には影響しません";
export const BADGE_VISIBILITY_TIP_STORAGE_KEY =
  "bb.badges.visibility-tip-dismissed";

const BADGE_COSMETIC_IDEMPOTENCY_PREFIX = "bb.badge-cosmetic.";

type BadgeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type BadgeMutationErrorAction =
  | "login"
  | "none"
  | "refresh"
  | "retry"
  | "topUp";

export type BadgeMutationError = {
  action: BadgeMutationErrorAction;
  message: string;
};

export function getBadgeProgressRatio(badge: BadgeProgress): number {
  if (badge.nextThreshold == null) return 1;

  const currentThreshold =
    badge.tiers.find((tier) => tier.tier === badge.currentTier)?.threshold ?? 0;
  const range = badge.nextThreshold - currentThreshold;
  if (range <= 0) return 1;

  return Math.max(0, Math.min(1, (badge.counter - currentThreshold) / range));
}

export function getNextBadgeForgeLevel(
  definitions: ForgeLevelDef[],
  forgeRank: number,
): ForgeLevelDef | null {
  return (
    definitions.find(
      (definition) =>
        definition.track === "BADGE" && definition.level === forgeRank + 1,
    ) ?? null
  );
}

function badgeCosmeticIdempotencyStorageKey(code: string): string {
  return `${BADGE_COSMETIC_IDEMPOTENCY_PREFIX}${code}`;
}

export function getOrCreateBadgeCosmeticIdempotencyKey(
  storage: BadgeStorage,
  code: string,
  createId: () => string,
): string {
  const storageKey = badgeCosmeticIdempotencyStorageKey(code);
  const existing = storage.getItem(storageKey);
  if (existing) return existing;

  const created = createId();
  storage.setItem(storageKey, created);
  return created;
}

export function clearBadgeCosmeticIdempotencyKey(
  storage: BadgeStorage,
  code: string,
): void {
  storage.removeItem(badgeCosmeticIdempotencyStorageKey(code));
}

export function buildBadgeCosmeticRequest(
  expectedFromRank: number,
  idempotencyKey: string,
): BadgeCosmeticRequest {
  return { expectedFromRank, idempotencyKey };
}

export function mapBadgeMutationError(
  status: number,
  serverMessage: string,
): BadgeMutationError {
  if (status === 401) {
    return {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    };
  }

  const normalized = serverMessage.toLowerCase();
  if (
    (serverMessage.includes("ランク") &&
      (serverMessage.includes("一致") || serverMessage.includes("更新"))) ||
    normalized.includes("expectedfromrank") ||
    normalized.includes("optimistic")
  ) {
    return {
      action: "refresh",
      message: "情報を更新しました。もう一度お試しください。",
    };
  }

  if (
    serverMessage.includes("獲得済み") ||
    serverMessage.includes("未獲得") ||
    normalized.includes("unearned")
  ) {
    return {
      action: "none",
      message: "このバッジはまだ獲得していません。",
    };
  }

  if (serverMessage.includes("グレード") || normalized.includes("grade")) {
    return {
      action: "none",
      message: "グレードは1段ずつ上げられます。",
    };
  }

  if (serverMessage.includes("スロット") && serverMessage.includes("使用中")) {
    return {
      action: "none",
      message: "その装備スロットは別のバッジで使用中です。",
    };
  }

  if (
    (serverMessage.includes("ルーン") && serverMessage.includes("不足")) ||
    normalized.includes("insufficient") ||
    normalized.includes("balance")
  ) {
    return {
      action: "topUp",
      message: "ルーンが足りません。残高を確認してください。",
    };
  }

  return {
    action: status >= 500 ? "retry" : "none",
    message: "一時的なエラーが発生しました。時間をおいて再度お試しください。",
  };
}
