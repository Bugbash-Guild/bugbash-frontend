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
    /** 所持インスタンスの取得日時（ISO）。新着ハイライトに使う。 */
    acquiredAt?: string;
    ownedMonsterId?: string | number;
    slug?: string;
    name: string;
    emoji: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    attribute?: string;
    attributeName?: string;
    attributeEmoji?: string;
    soulCount: number;
    isOwned: boolean;
    /**
     * PRマージで入手できるか。false は召喚専用。
     * 未所持の枠に「どうすれば埋まるのか」を出すために使う。
     */
    prAcquirable?: boolean;
    level: number;
    awakeningState?: AwakeningState;
    formStage?: MonsterFormStage;
    assetUrl?: string | null;
    artworkByStage?: Partial<Record<MonsterFormStage, string>>;
};
