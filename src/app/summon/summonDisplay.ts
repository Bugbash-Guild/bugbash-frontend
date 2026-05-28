import type { ItemRarity } from '@/types/summon';

export type SummonRate = {
    label: ItemRarity;
    percent: number;
};

export type SummonItemDisplay = {
    name: string;
    assetUrl?: string;
};

export const NORMAL_SUMMON_COST = {
    single: 300,
    ten: 3000,
} as const;

export const NORMAL_SUMMON_SUMMARY = '魂パック・進化素材アイテムが排出されます';

const NORMAL_SUMMON_RATE_WEIGHTS = [
    { label: 'N', weight: 55 },
    { label: 'R', weight: 25 },
    { label: 'SR', weight: 7 },
    { label: 'SSR', weight: 8 },
] as const satisfies ReadonlyArray<{
    label: ItemRarity;
    weight: number;
}>;

const NORMAL_SUMMON_TOTAL_WEIGHT = NORMAL_SUMMON_RATE_WEIGHTS.reduce(
    (total, rate) => total + rate.weight,
    0,
);

export const NORMAL_SUMMON_RATES: SummonRate[] = NORMAL_SUMMON_RATE_WEIGHTS.map((rate) => ({
    label: rate.label,
    percent: Number(((rate.weight / NORMAL_SUMMON_TOTAL_WEIGHT) * 100).toFixed(1)),
}));

const SUMMON_ITEM_DISPLAY: Record<string, SummonItemDisplay> = {
    'soul-pack-s': {
        name: '魂パック・小',
    },
    'soul-pack-m': {
        name: '魂パック・中',
    },
    'soul-pack-l': {
        name: '魂パック・大',
    },
    'evolution-stone': {
        name: '進化の輝石',
    },
    'purification-proof': {
        name: '浄化の証',
    },
    'abyss-proof': {
        name: '深淵の証',
    },
};

export function formatGuildCoinCost(cost: number): string {
    return cost.toLocaleString('en-US');
}

export function getSummonItemDisplay(itemId: string, assetUrl?: string | null): SummonItemDisplay {
    const display = SUMMON_ITEM_DISPLAY[itemId] ?? { name: itemId };
    if (!assetUrl) return display;
    return { ...display, assetUrl };
}
