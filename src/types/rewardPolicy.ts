/** 減衰の段（BE: DailyRewardPolicy）。 */
export type DailyRewardTierKey = 'NORMAL' | 'REDUCED' | 'ACTIVITY_ONLY';

/**
 * 同日のPR本数による報酬減衰の1段ぶん（BE: DailyRewardTierDto）。
 *
 * しきい値も割合もフロントで持たない。この値をそのまま並べる。
 */
export type DailyRewardTier = {
    key: DailyRewardTierKey;
    /** この段が始まる本数（1始まり）。 */
    fromCount: number;
    /** この段が終わる本数。上限が無ければ null。 */
    toCount: number | null;
    /** 資源（コイン・魂）の付与率。100 = 減衰なし。 */
    resourcePercent: number;
    grantsMonster: boolean;
    grantsRareDrop: boolean;
};

export type DailyRewardPolicyResponse = {
    tiers: DailyRewardTier[];
};
