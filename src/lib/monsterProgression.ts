import type { MonsterProgression, RitualRequirement } from "@/types/monster";

type MonsterProgressionInput = {
    awakeningState?: string;
    isOwned: boolean;
    level: number;
    progression?: MonsterProgression;
};

/*
 * 育成の数値はすべて BE（MonsterProgressionRules）由来で、ここには式も
 * しきい値も置かない。
 *
 * 以前はこのファイルが `level * 3`・進化 Lv50・上限 Lv100 を直書きしていたが、
 * 実際のコストは `5 + ⌊Lv/2⌋` だったため、画面の表示と消費が食い違っていた:
 *   - Lv1: 「3魂」と出しつつ実コストは5魂 → 押すと 422
 *   - Lv50: 「150魂」と出しつつ実コストは30魂 → 払えるのにボタンが無効
 * パス価格を直書きから API 由来に直したのと同じ理由で、ここも API に寄せる。
 */

/** 進化（②分岐）を実行できるか。要件が届いていなければ false（＝ボタンを出さない）。 */
export function canEvolveMonster(monster: MonsterProgressionInput) {
    const requirement = monster.progression?.branchEvolution;
    if (!monster.isOwned || !requirement) return false;

    return meetsLevel(monster.level, requirement.requiredLevel);
}

/** レベルアップできるか。上限に達していると BE が費用を null で返す。 */
export function canLevelUpMonster(monster: MonsterProgressionInput) {
    return monster.isOwned && monster.progression?.nextLevelUpSoulCost != null;
}

export function isMonsterAwakened(
    monster: Pick<MonsterProgressionInput, "awakeningState">,
) {
    return (
        monster.awakeningState !== undefined &&
        monster.awakeningState !== "NORMAL"
    );
}

/** 上限に達しているか。進化も強化もできない「打ち止め」の表示に使う。 */
export function isMonsterMaxLevel(monster: MonsterProgressionInput) {
    const progression = monster.progression;
    if (!progression) return false;

    return (
        progression.nextLevelUpSoulCost === null &&
        monster.level >= progression.maxLevel
    );
}

/** 素材が足りているか。レベル条件は別途 [meetsLevel] で見る。 */
export function hasEnoughMaterial(requirement: RitualRequirement) {
    return requirement.ownedQuantity >= requirement.requiredQuantity;
}

/** 必要 Lv を満たしているか。requiredLevel が null の操作は Lv 条件なし。 */
export function meetsLevel(level: number, requiredLevel: number | null) {
    return requiredLevel === null || level >= requiredLevel;
}
