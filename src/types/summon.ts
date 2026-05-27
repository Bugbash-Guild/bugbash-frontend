export type ItemRarity = 'N' | 'R' | 'SR' | 'SSR';

export type SummonItem = {
    itemId: string;
    rarity: ItemRarity;
    assetUrl?: string | null;
};

export type SummonOnceResponse = {
    itemId: string;
    rarity: ItemRarity;
    assetUrl?: string | null;
    newPullCount: number;
    coinsRemaining: number;
};

export type SummonTenResponse = {
    results: SummonItem[];
    newPullCount: number;
    coinsRemaining: number;
};

export type PityCounterResponse = {
    poolKey: string;
    pullCount: number;
    isSoftPity: boolean;
    isHardPity: boolean;
};

export type SummonHistoryEntry = {
    itemId: string;
    rarity: ItemRarity;
    assetUrl?: string | null;
    pulledAt: string;
};

export type SummonHistoryResponse = {
    entries: SummonHistoryEntry[];
};
