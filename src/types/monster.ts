// src/types/monster.ts
export type AwakeningState = 'NORMAL' | 'AWAKENED' | 'BERSERK';

export type Monster = {
    id: string;
    name: string;
    emoji: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    attribute?: string;
    attributeName?: string;
    attributeEmoji?: string;
    soulCount: number;
    isOwned: boolean;
    level: number;
    awakeningState?: AwakeningState;
};
