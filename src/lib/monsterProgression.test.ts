import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canEvolveMonster,
  canLevelUpMonster,
  getMonsterLevelUpCost,
  isMonsterAwakened,
  MONSTER_EVOLUTION_LEVEL,
  MONSTER_MAX_LEVEL,
} from "./monsterProgression.ts";

describe("monster progression rules", () => {
  it("allows normal monsters to evolve from level 50", () => {
    assert.equal(MONSTER_EVOLUTION_LEVEL, 50);
    assert.equal(
      canEvolveMonster({ isOwned: true, level: 49, awakeningState: "NORMAL" }),
      false,
    );
    assert.equal(
      canEvolveMonster({ isOwned: true, level: 50, awakeningState: "NORMAL" }),
      true,
    );
  });

  it("does not evolve unowned or already awakened monsters", () => {
    assert.equal(
      canEvolveMonster({
        isOwned: false,
        level: MONSTER_EVOLUTION_LEVEL,
        awakeningState: "NORMAL",
      }),
      false,
    );
    assert.equal(
      canEvolveMonster({
        isOwned: true,
        level: MONSTER_EVOLUTION_LEVEL,
        awakeningState: "AWAKENED",
      }),
      false,
    );
    assert.equal(
      canEvolveMonster({
        isOwned: true,
        level: MONSTER_EVOLUTION_LEVEL,
        awakeningState: "BERSERK",
      }),
      false,
    );
  });

  it("allows awakened and berserk monsters to keep leveling until level 100", () => {
    assert.equal(MONSTER_MAX_LEVEL, 100);
    assert.equal(
      canLevelUpMonster({ isOwned: true, level: MONSTER_MAX_LEVEL - 1 }),
      true,
    );
    assert.equal(
      canLevelUpMonster({ isOwned: true, level: MONSTER_MAX_LEVEL }),
      false,
    );
    assert.equal(
      canLevelUpMonster({ isOwned: false, level: MONSTER_MAX_LEVEL - 1 }),
      false,
    );
  });

  it("detects awakened branches separately from normal monsters", () => {
    assert.equal(isMonsterAwakened({ awakeningState: "NORMAL" }), false);
    assert.equal(isMonsterAwakened({ awakeningState: "AWAKENED" }), true);
    assert.equal(isMonsterAwakened({ awakeningState: "BERSERK" }), true);
    assert.equal(isMonsterAwakened({}), false);
  });

  it("keeps the existing soul cost formula", () => {
    assert.equal(getMonsterLevelUpCost(1), 3);
    assert.equal(getMonsterLevelUpCost(50), 150);
  });
});
