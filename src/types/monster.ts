// src/types/monster.ts
export type AwakeningState = 'NORMAL' | 'AWAKENED' | 'BERSERK';
export type MonsterFormStage =
    | 'BASE'
    | 'EVO'
    | 'AWAKENED'
    | 'AWAKENED_FINAL'
    | 'BERSERK'
    | 'BERSERK_FINAL';

/**
 * 所持個体の出自（どの PR のマージで仲間になったか）。
 * BE が値を持たない個体（召喚出身・旧データ・未デプロイ環境）では
 * フィールドごと欠けるか null。欠けているときは何も表示しない。
 */
export type MonsterAcquisition = {
    repositoryFullName: string | null;
    prNumber: number | null;
    prTitle: string | null;
};

export type Monster = {
    id: string;
    /** 所持インスタンスの取得日時（ISO）。新着ハイライトに使う。 */
    acquiredAt?: string;
    /** 所持個体の出自PR。未所持・データ欠損時は undefined/null。 */
    acquisition?: MonsterAcquisition | null;
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
