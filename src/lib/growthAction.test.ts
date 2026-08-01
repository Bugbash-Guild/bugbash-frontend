import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildGrowthAction } from "./growthAction.ts";
import type { Monster, MonsterProgression } from "@/types/monster";

function progression(
    overrides: Partial<MonsterProgression> = {},
): MonsterProgression {
    return {
        branchEvolution: null,
        finalEvolution: null,
        maxLevel: 100,
        nextGateKind: "BRANCH_EVOLUTION",
        nextGateLevel: 50,
        nextLevelUpSoulCost: 10,
        pathChange: null,
        soulsToNextGate: 100,
        ...overrides,
    };
}

function monster(overrides: Partial<Monster> = {}): Monster {
    return {
        attributeName: "炎",
        emoji: "🐉",
        id: "m1",
        isOwned: true,
        level: 10,
        name: "ドラゴン",
        progression: progression(),
        rarity: "SSR",
        soulCount: 0,
        ...overrides,
    };
}

const stone = (owned: number) => ({
    itemId: "evolution-stone",
    itemName: "進化の輝石",
    ownedQuantity: owned,
    requiredLevel: 50,
    requiredQuantity: 1,
});

describe("buildGrowthAction", () => {
    it("says nothing when there is nothing to do (does not nag)", () => {
        assert.equal(buildGrowthAction([]), null);
        assert.equal(
            buildGrowthAction([monster({ soulCount: 0 })]),
            null,
            "魂が足りないなら何も出さない",
        );
    });

    it("ignores monsters that are not owned", () => {
        assert.equal(
            buildGrowthAction([monster({ isOwned: false, soulCount: 999 })]),
            null,
        );
    });

    it("shows nothing until the progression payload arrives", () => {
        // 値が届く前に推測で行を出さない
        assert.equal(
            buildGrowthAction([monster({ progression: undefined, soulCount: 999 })]),
            null,
        );
    });

    it("offers a level up when the souls are already there", () => {
        const row = buildGrowthAction([
            monster({ level: 10, soulCount: 10, progression: progression({ nextLevelUpSoulCost: 10 }) }),
        ]);

        assert.equal(row?.kind, "level-up");
        assert.equal(row?.monsterName, "ドラゴン");
        assert.equal(row?.detail, "炎の魂 10 で Lv.11 に上げられます");
        assert.equal(row?.href, "/monsters");
    });

    it("prefers the evolution ritual over a plain level up", () => {
        // 儀式は戻れない選択なので、単なるレベルアップより先に知らせる
        const row = buildGrowthAction([
            monster({ id: "a", name: "スライム", level: 20, soulCount: 999 }),
            monster({
                id: "b",
                level: 50,
                name: "ドラゴン",
                progression: progression({ branchEvolution: stone(1), soulsToNextGate: 0 }),
                soulCount: 0,
            }),
        ]);

        assert.equal(row?.kind, "ritual");
        assert.equal(row?.monsterName, "ドラゴン");
        assert.equal(
            row?.detail,
            "Lv.50 到達 — 進化の輝石 で進化の儀式を行えます",
        );
    });

    it("does not offer the ritual while the material is missing", () => {
        const row = buildGrowthAction([
            monster({
                level: 50,
                progression: progression({ branchEvolution: stone(0), soulsToNextGate: 0 }),
                soulCount: 0,
            }),
        ]);

        assert.equal(row, null, "輝石が無いなら儀式は案内しない");
    });

    it("does not offer the ritual before the required level", () => {
        const row = buildGrowthAction([
            monster({
                level: 49,
                progression: progression({ branchEvolution: stone(1) }),
                soulCount: 0,
            }),
        ]);

        assert.equal(row, null);
    });

    it("picks the most invested monster when several qualify", () => {
        const row = buildGrowthAction([
            monster({ id: "a", level: 12, name: "スライム", soulCount: 999 }),
            monster({ id: "b", level: 40, name: "ドラゴン", soulCount: 999 }),
        ]);

        assert.equal(row?.monsterName, "ドラゴン");
    });
});
