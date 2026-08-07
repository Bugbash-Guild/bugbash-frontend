import type { BadgeProgress } from "@/types/badge";

/**
 * home の実績進捗1行（/badges への第二入口）に出すバッジを選ぶ。
 *
 * 出すのは「次の Tier まで残りが最小」の 1 件だけ（UX-BLUEPRINT §5）。
 * 値は progress API の実数のみから組み、推測で補わない:
 * - nextThreshold が無い（全 Tier 到達済み）バッジは対象外
 * - nextThreshold に一致する Tier 定義が tiers に無いバッジは対象外
 *   （currentTier + 1 と推測して Tier 番号を作らない）
 * - 残りが 0 以下・数として読めない不整合データは対象外
 *   （「あと0」「あとNaN」を出さない）
 * 残りが同数のときは progress の並び（BE のバッジ定義順）で先勝ち。
 */
export type BadgeMilestone = {
  /** いまの到達値（counter の実数）。単位はバッジの category 依存。 */
  counter: number;
  displayName: string;
  /** 次に到達する Tier 番号（tiers 定義から引いた実値） */
  nextTier: number;
  /** 次の Tier の閾値 */
  nextThreshold: number;
  /** 次の Tier までの残り（nextThreshold - counter） */
  remaining: number;
};

export function pickNearestBadgeMilestone(
  progress: BadgeProgress[],
): BadgeMilestone | null {
  let best: BadgeMilestone | null = null;

  for (const badge of progress) {
    const nextThreshold = badge.nextThreshold;
    if (nextThreshold == null) continue;

    const nextTier = badge.tiers.find(
      (tier) => tier.threshold === nextThreshold,
    )?.tier;
    if (nextTier == null) continue;

    const remaining = nextThreshold - badge.counter;
    if (!Number.isFinite(remaining) || remaining <= 0) continue;

    if (best == null || remaining < best.remaining) {
      best = {
        counter: badge.counter,
        displayName: badge.displayName,
        nextTier,
        nextThreshold,
        remaining,
      };
    }
  }

  return best;
}
