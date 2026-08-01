import type { DailyRewardTier } from "@/types/rewardPolicy";

/**
 * 減衰ルールの1行を人が読める形にする。
 *
 * 値はすべて BE 由来。ここでやるのは並べ替えと言い回しだけで、
 * しきい値も割合もフロントで決めない。
 */
export function formatTierRange(tier: DailyRewardTier): string {
  if (tier.toCount === null) {
    return `${tier.fromCount} 件目以降`;
  }
  if (tier.fromCount === tier.toCount) {
    return `${tier.fromCount} 件目`;
  }
  return `${tier.fromCount}〜${tier.toCount} 件目`;
}

/**
 * その段で何がどうなるかを述べる。
 *
 * 「減る」ことだけでなく「何は残るか」も書く。活動の記録とXPは必ず残るので、
 * 上限に当たっても働きが消えるわけではないことが分かるようにする。
 */
export function formatTierEffect(tier: DailyRewardTier): string {
  const parts: string[] = [];

  if (tier.resourcePercent >= 100) {
    parts.push("コイン・魂は満額");
  } else if (tier.resourcePercent > 0) {
    parts.push(`コイン・魂は ${tier.resourcePercent}%`);
  } else {
    parts.push("コイン・魂なし");
  }

  if (!tier.grantsMonster) {
    parts.push("モンスターなし");
  }
  if (tier.grantsMonster && !tier.grantsRareDrop) {
    parts.push("レアドロップなし");
  }

  return parts.join(" · ");
}
