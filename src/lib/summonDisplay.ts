import type { ItemRarity, SummonDisclosureResponse } from '@/types/summon';

export type SummonItemDisplay = {
    name: string;
    assetUrl?: string;
};

/**
 * 通貨記号の正はトップバー（ConsoleTopbar）の 🪙 / 💎。
 * 通常召喚ページだけ残高を ◈ で表しており、同じ画面のトップバーと
 * 記号が食い違っていた。召喚まわりの表示はこの辞書だけを参照する。
 */
export const SUMMON_CURRENCY_SYMBOL = {
    GUILD_COIN: '🪙',
    RUNE: '💎',
} as const;

/**
 * SR以上（SR / SSR）の件数。サーバが返した結果配列を数えるだけで、
 * 演出側で件数を作ったり盛ったりしない。
 */
export function countSummonItemsSrOrAbove(items: readonly { rarity: ItemRarity }[]): number {
    return items.filter((item) => item.rarity === 'SR' || item.rarity === 'SSR').length;
}

/**
 * 「10連の割引はありません（300 = 30×10）」の一行。
 * 数値は開示APIの実額から計算し、確認できたときだけ言う。
 * 値が揃わない・10倍関係が崩れている（＝割引や割増がある）場合は
 * null を返して何も出さない（事実でない注記を出さない）。
 */
export function buildTenPullHonestyCopy(
    disclosure: Pick<SummonDisclosureResponse, 'singlePullCost' | 'tenPullCost'> | null,
): string | null {
    if (disclosure == null) return null;
    const single = disclosure.singlePullCost;
    const ten = disclosure.tenPullCost;
    if (ten == null || single <= 0) return null;
    if (ten !== single * 10) return null;
    return `10連の割引はありません（${ten.toLocaleString('ja-JP')} = ${single.toLocaleString('ja-JP')}×10）`;
}

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
