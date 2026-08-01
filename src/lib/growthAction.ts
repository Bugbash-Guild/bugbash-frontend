import type { Monster } from "@/types/monster";

/**
 * 「育成でいま、できること」を1行だけ組み立てる。
 *
 * 育成はこの製品の中心だが、home には育成の入口が無く、
 * 「魂が貯まっている」「進化できる状態になっている」ことに気づく場所が
 * どこにも無かった（気づくには図鑑を開いて全カードを見るしかない）。
 *
 * 出すのは事実（何ができるか）と行き先だけ。期限も煽りも付けない。
 * できることが無いときは何も出さない（催促にしない）。
 */
export type GrowthActionKind = "level-up" | "ritual";

export type GrowthActionRow = {
    kind: GrowthActionKind;
    /** 対象のモンスター名。 */
    monsterName: string;
    /** 何ができるかの説明。 */
    detail: string;
    href: string;
};

/** 儀式の準備が整っているか（レベル条件と素材の両方）。 */
function ritualReady(monster: Monster): boolean {
    const requirement = monster.progression?.branchEvolution;
    if (!requirement) return false;

    const levelOk =
        requirement.requiredLevel === null ||
        monster.level >= requirement.requiredLevel;
    return levelOk && requirement.ownedQuantity >= requirement.requiredQuantity;
}

/** いま魂が足りていてレベルを上げられるか。 */
function levelUpReady(monster: Monster): boolean {
    const cost = monster.progression?.nextLevelUpSoulCost;
    return cost != null && monster.soulCount >= cost;
}

/**
 * 最優先の1件を返す。
 *
 * 儀式（進化）はレベルアップより希少で戻れない選択なので先に出す。
 * 同じ種類が複数あるときはレベルの高い個体を選ぶ（投資が大きいものを優先）。
 */
export function buildGrowthAction(monsters: Monster[]): GrowthActionRow | null {
    const owned = monsters.filter((m) => m.isOwned && m.progression);
    if (owned.length === 0) return null;

    const byLevelDesc = [...owned].sort((a, b) => b.level - a.level);

    const ritual = byLevelDesc.find(ritualReady);
    if (ritual) {
        const requirement = ritual.progression?.branchEvolution;
        return {
            detail: `Lv.${ritual.level} 到達 — ${requirement?.itemName ?? "素材"} で進化の儀式を行えます`,
            href: "/monsters",
            kind: "ritual",
            monsterName: ritual.name,
        };
    }

    const levelUp = byLevelDesc.find(levelUpReady);
    if (levelUp) {
        const cost = levelUp.progression?.nextLevelUpSoulCost ?? 0;
        const attribute = levelUp.attributeName ?? "soul";
        return {
            detail: `${attribute}の魂 ${cost.toLocaleString("ja-JP")} で Lv.${levelUp.level + 1} に上げられます`,
            href: "/monsters",
            kind: "level-up",
            monsterName: levelUp.name,
        };
    }

    return null;
}
