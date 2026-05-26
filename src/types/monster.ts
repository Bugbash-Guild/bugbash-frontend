// src/types/monster.ts
export type AwakeningState = 'NORMAL' | 'AWAKENED' | 'BERSERK';
export type MonsterFormStage =
    | 'BASE'
    | 'EVO'
    | 'AWAKENED'
    | 'AWAKENED_FINAL'
    | 'BERSERK'
    | 'BERSERK_FINAL';

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
    formStage?: MonsterFormStage;
};
