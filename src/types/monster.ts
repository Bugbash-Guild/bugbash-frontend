// src/types/monster.ts
export type AwakeningState = 'NORMAL' | 'AWAKENED' | 'BERSERK';
export type MonsterFormStage =
    | 'BASE'
    | 'EVO'
    | 'AWAKENED'
    | 'AWAKENED_FINAL'
    | 'BERSERK'
    | 'BERSERK_FINAL';

/** 次に到達する育成の節目。BE の ProgressionGateKind と対応する。 */
export type ProgressionGateKind =
    | 'BASIC_EVOLUTION'
    | 'BRANCH_EVOLUTION'
    | 'FINAL_EVOLUTION';

/** 儀式1件の要件。「何をいくつ使い、いま何個持っているか」。 */
export type RitualRequirement = {
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    ownedQuantity: number;
    /** 実行に必要な Lv。レベル条件が無い操作（路線変更）では null。 */
    requiredLevel: number | null;
};

/**
 * 育成のコストと次の節目。すべて BE 由来。
 *
 * フロント側で式を持たないこと。以前は `level * 3` を直書きしていたため、
 * 実コスト（5 + ⌊Lv/2⌋）と食い違い、Lv1 は押すと 422、Lv3 以降は
 * 「払えるのにボタンが押せない」状態になっていた。
 */
export type MonsterProgression = {
    /** 次の1レベルに必要な魂。Lv上限なら null。 */
    nextLevelUpSoulCost: number | null;
    maxLevel: number;
    nextGateKind: ProgressionGateKind | null;
    nextGateLevel: number | null;
    soulsToNextGate: number | null;
    branchEvolution: RitualRequirement | null;
    finalEvolution: RitualRequirement | null;
    pathChange: RitualRequirement | null;
};

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
    /** 所持している場合のみ届く。未所持の枠には育成コストが存在しない。 */
    progression?: MonsterProgression;
};
