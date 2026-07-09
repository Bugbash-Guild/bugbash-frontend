export type SummonItemDisplay = {
    name: string;
    assetUrl?: string;
};

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

function getLimitedMonsterName(itemId: string): string | null {
    if (!itemId.startsWith('monster:')) return null;
    const slug = itemId.slice('monster:'.length);
    if (!slug) return null;
    return slug
        .split('-')
        .filter(Boolean)
        .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(' ');
}

export function getSummonItemDisplay(itemId: string, assetUrl?: string | null): SummonItemDisplay {
    const display = SUMMON_ITEM_DISPLAY[itemId] ?? {
        name: getLimitedMonsterName(itemId) ?? itemId,
    };
    if (!assetUrl) return display;
    return { ...display, assetUrl };
}
