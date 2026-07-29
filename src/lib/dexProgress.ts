import type { Monster } from "@/types/monster";

/**
 * 図鑑の進捗。
 *
 * 「召喚専用」の内訳を別に数えるのは、未所持の枠が
 * 「働けば埋まる」のか「召喚でしか埋まらない」のかで
 * ユーザーの取れる行動が違うため（Job Story JS-7）。
 * 全体の N/M だけだと、その差が見えない。
 */
export type DexProgress = {
  discovered: number;
  /** 召喚専用のうち所持している数。 */
  summonOnlyDiscovered: number;
  /** 召喚専用の総数。0 なら内訳を出す意味がない。 */
  summonOnlyTotal: number;
  total: number;
};

/** PRマージでは入手できない＝召喚専用か。 */
export function isSummonOnly(monster: Monster): boolean {
  return monster.prAcquirable === false;
}

export function buildDexProgress(monsters: Monster[]): DexProgress {
  let discovered = 0;
  let summonOnlyTotal = 0;
  let summonOnlyDiscovered = 0;

  for (const monster of monsters) {
    if (monster.isOwned) discovered += 1;
    if (isSummonOnly(monster)) {
      summonOnlyTotal += 1;
      if (monster.isOwned) summonOnlyDiscovered += 1;
    }
  }

  return {
    discovered,
    summonOnlyDiscovered,
    summonOnlyTotal,
    total: monsters.length,
  };
}

export type AcquisitionHint = {
  /** 有料圏の導線を伴うか（色の使い分けに使う）。 */
  paid: boolean;
  route: { href: string; label: string } | null;
  text: string;
};

/**
 * 未所持の枠に出す入手経路。所持済みには何も出さない。
 *
 * `prAcquirable` が未取得（undefined）のときは推測しない。
 */
export function buildAcquisitionHint(monster: Monster): AcquisitionHint | null {
  if (monster.isOwned) return null;
  if (monster.prAcquirable == null) return null;

  if (monster.prAcquirable) {
    return {
      paid: false,
      route: null,
      text: "PR をマージすると出会えます",
    };
  }

  return {
    paid: true,
    route: { href: "/summon/limited", label: "限定召喚で狙う" },
    text: "召喚専用",
  };
}
