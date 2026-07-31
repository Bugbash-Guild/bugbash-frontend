import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canEvolveMonster,
  canLevelUpMonster,
  hasEnoughMaterial,
  isMonsterAwakened,
  isMonsterMaxLevel,
  meetsLevel,
} from "./monsterProgression.ts";
import type { MonsterProgression, RitualRequirement } from "@/types/monster";

const stone = (owned: number, requiredLevel: number | null): RitualRequirement => ({
  itemId: "evolution-stone",
  itemName: "進化の輝石",
  ownedQuantity: owned,
  requiredQuantity: 1,
  requiredLevel,
});

const progression = (
  overrides: Partial<MonsterProgression> = {},
): MonsterProgression => ({
  nextLevelUpSoulCost: 5,
  maxLevel: 100,
  nextGateKind: "BRANCH_EVOLUTION",
  nextGateLevel: 50,
  soulsToNextGate: 660,
  branchEvolution: null,
  finalEvolution: null,
  pathChange: null,
  ...overrides,
});

describe("monster progression rules", () => {
  it("drives evolution availability from the API requirement, not a local constant", () => {
    // BE が「Lv50 から・輝石1個」と言っているケース
    const requirement = stone(1, 50);

    assert.equal(
      canEvolveMonster({
        isOwned: true,
        level: 49,
        awakeningState: "NORMAL",
        progression: progression({ branchEvolution: requirement }),
      }),
      false,
    );
    assert.equal(
      canEvolveMonster({
        isOwned: true,
        level: 50,
        awakeningState: "NORMAL",
        progression: progression({ branchEvolution: requirement }),
      }),
      true,
    );
  });

  it("hides evolution when the API does not offer it (unowned or already evolved)", () => {
    // 進化済みのモンスターには BE が branchEvolution を返さない
    assert.equal(
      canEvolveMonster({
        isOwned: true,
        level: 50,
        awakeningState: "AWAKENED",
        progression: progression({ branchEvolution: null }),
      }),
      false,
    );
    assert.equal(
      canEvolveMonster({
        isOwned: false,
        level: 50,
        awakeningState: "NORMAL",
        progression: progression({ branchEvolution: stone(1, 50) }),
      }),
      false,
    );
  });

  it("shows no action while the progression payload has not arrived", () => {
    // 値が届く前に推測で操作を出さない（捏造しない方針）
    assert.equal(canEvolveMonster({ isOwned: true, level: 50 }), false);
    assert.equal(canLevelUpMonster({ isOwned: true, level: 50 }), false);
    assert.equal(isMonsterMaxLevel({ isOwned: true, level: 100 }), false);
  });

  it("treats a null level-up cost as the level cap", () => {
    assert.equal(
      canLevelUpMonster({
        isOwned: true,
        level: 99,
        progression: progression({ nextLevelUpSoulCost: 54 }),
      }),
      true,
    );
    assert.equal(
      canLevelUpMonster({
        isOwned: true,
        level: 100,
        progression: progression({ nextLevelUpSoulCost: null }),
      }),
      false,
    );
    assert.equal(
      canLevelUpMonster({
        isOwned: false,
        level: 99,
        progression: progression({ nextLevelUpSoulCost: 54 }),
      }),
      false,
    );
  });

  it("reports the level cap only when the cost is null and the level matches", () => {
    assert.equal(
      isMonsterMaxLevel({
        isOwned: true,
        level: 100,
        progression: progression({ nextLevelUpSoulCost: null }),
      }),
      true,
    );
    assert.equal(
      isMonsterMaxLevel({
        isOwned: true,
        level: 99,
        progression: progression({ nextLevelUpSoulCost: 54 }),
      }),
      false,
    );
  });

  it("detects awakened branches separately from normal monsters", () => {
    assert.equal(isMonsterAwakened({ awakeningState: "NORMAL" }), false);
    assert.equal(isMonsterAwakened({ awakeningState: "AWAKENED" }), true);
    assert.equal(isMonsterAwakened({ awakeningState: "BERSERK" }), true);
    assert.equal(isMonsterAwakened({}), false);
  });

  it("checks material stock and level gate independently", () => {
    assert.equal(hasEnoughMaterial(stone(0, 50)), false);
    assert.equal(hasEnoughMaterial(stone(1, 50)), true);

    // 路線変更のように Lv 条件が無い操作は requiredLevel が null で来る
    assert.equal(meetsLevel(1, null), true);
    assert.equal(meetsLevel(49, 50), false);
    assert.equal(meetsLevel(50, 50), true);
  });
});
