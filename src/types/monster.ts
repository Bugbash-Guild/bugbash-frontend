// src/types/monster.ts
export type Monster = {
    id: string;
    name: string;
    emoji: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    soulCount: number;
    isOwned: boolean;
    level: number;
};

