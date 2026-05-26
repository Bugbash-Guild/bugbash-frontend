type MonsterProgressionInput = {
  awakeningState?: string;
  isOwned: boolean;
  level: number;
};

export const MONSTER_EVOLUTION_LEVEL = 50;
export const MONSTER_MAX_LEVEL = 100;

export function canEvolveMonster(monster: MonsterProgressionInput) {
  return (
    monster.isOwned &&
    monster.level >= MONSTER_EVOLUTION_LEVEL &&
    monster.awakeningState === "NORMAL"
  );
}

export function canLevelUpMonster(
  monster: Pick<MonsterProgressionInput, "isOwned" | "level">,
) {
  return monster.isOwned && monster.level < MONSTER_MAX_LEVEL;
}

export function isMonsterAwakened(
  monster: Pick<MonsterProgressionInput, "awakeningState">,
) {
  return (
    monster.awakeningState !== undefined && monster.awakeningState !== "NORMAL"
  );
}

export function getMonsterLevelUpCost(level: number) {
  return level * 3;
}
