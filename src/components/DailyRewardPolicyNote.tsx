"use client";

import { useDailyRewardPolicy } from "@/hooks/useDailyRewardPolicy";
import { formatTierEffect, formatTierRange } from "@/lib/rewardPolicyDisplay";

/**
 * 同日のPR本数による報酬減衰ルールの開示。
 *
 * このルールはこれまでどこにも書かれておらず、「同じPRをマージしたのに
 * 貰える量が違う」理由をユーザーが知る手段が無かった。
 *
 * 事実を述べるだけで、煽らない・急かさない（「早く出せ」とは言わない）。
 * 値が届かないあいだは何も出さない（仮の数字を置かない）。
 */
export function DailyRewardPolicyNote() {
  const { tiers } = useDailyRewardPolicy();

  if (tiers.length === 0) return null;

  return (
    <details className="rounded-[4px] border border-line bg-bg-elev-2 px-3 py-2">
      <summary className="cursor-pointer text-[11px] text-text-dim marker:text-text-faint">
        1日にたくさんマージしたときの報酬について
      </summary>
      <ul className="mt-2 space-y-1">
        {tiers.map((tier) => (
          <li
            className="flex flex-wrap items-baseline gap-x-2 text-[11px] leading-5"
            key={tier.key}
          >
            <span className="tabular-nums text-text">{formatTierRange(tier)}</span>
            <span className="text-text-dim">{formatTierEffect(tier)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10.5px] leading-5 text-text-faint">
        マージした事実と XP はどの段でも記録されます。多く出した日に損をさせるための
        ルールではなく、通貨の発行量を保つためのものです。
      </p>
    </details>
  );
}
