export type ItemRarity = 'N' | 'R' | 'SR' | 'SSR';

export type SummonItem = {
    itemId: string;
    rarity: ItemRarity;
};

export type SummonOnceResponse = {
    itemId: string;
    rarity: ItemRarity;
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
    pulledAt: string;
};

export type SummonHistoryResponse = {
    entries: SummonHistoryEntry[];
};
