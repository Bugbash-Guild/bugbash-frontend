export type RewardType = 'xp' | 'monster' | 'soul' | 'coin' | 'item';

export type XpDetail = { levelBefore: number; levelAfter: number };

/**
 * ギルドコインの内訳（BE: RewardSnapshot.Coin）。
 *
 * 合計だけだと、同じ「PRをマージした」で 100 と 450 が並んだときに
 * 理由を説明できない。UI側で差分から推測すると捏造になるので、
 * BE が分解した値をそのまま出す。
 */
export type CoinDetail = {
    base: number;
    largePrBonus: number;
    streakBonus: number;
    /** 同日のPR本数による減衰率（100 = 減衰なし）。 */
    dailyPolicyPercent: number;
};

/** 属性ソウルの内訳（BE: RewardSnapshot.Soul）。 */
export type SoulDetail = {
    attribute: string;
    partner: number;
    monsterBonus: number;
    adventurerPassMultiplier: number;
};
export type MonsterDetail = { name: string; rarity: string; emoji: string };

/**
 * 素材アイテムのドロップ（BE: RewardSnapshot.Item）。
 *
 * 進化の輝石は以前サイレントドロップで、入手経路がユーザーから追跡できず
 * 「PRを頑張ると進化に近づく」という因果が切れていた。
 */
export type ItemDetail = { itemId: string; name: string; iconEmoji: string };

export type ActivityReward = {
    rewardType: RewardType;
    quantity: number;
    detail:
        | XpDetail
        | MonsterDetail
        | CoinDetail
        | SoulDetail
        | ItemDetail
        | Record<string, unknown>;
    occurredAt: string;
};

export type PrMergedMetadata = {
    prNumber: number;
    repositoryFullName: string;
    title: string;
};

export type Activity = {
    id: number;
    activityType: string;
    groupKey: string | null;
    metadata: PrMergedMetadata | Record<string, unknown>;
    heroXpAfter: number;
    heroLevelAfter: number;
    rewards: ActivityReward[];
    occurredAt: string;
};

export type ActivitiesResponse = {
    activities: Activity[];
    nextCursor: string | null;
    hasMore: boolean;
};
