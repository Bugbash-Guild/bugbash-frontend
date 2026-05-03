export type RewardType = 'xp' | 'monster' | 'soul' | 'coin';

export type XpDetail = { levelBefore: number; levelAfter: number };
export type MonsterDetail = { name: string; rarity: string; emoji: string };

export type ActivityReward = {
    rewardType: RewardType;
    quantity: number;
    detail: XpDetail | MonsterDetail | Record<string, unknown>;
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
