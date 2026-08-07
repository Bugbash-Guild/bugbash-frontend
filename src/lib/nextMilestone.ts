import type { Monster } from "@/types/monster";

/**
 * home の「次の節目」1行を選ぶ。
 *
 * マージも未読報酬も無い日に home から押せるもの・向かう先が消えないよう、
 * すでに手元にあるデータだけから事実をひとつ選ぶ。新しい API は呼ばない・
 * 値を仮置きしない・期限や煽りは付けない（NextActionStrip と同方針）。
 *
 * 図鑑の未発見枠の名前はここでも伏せる。/monsters は未所持を「???」で
 * 隠して発見の演出にしているので、home が先に名前を明かすとそれが壊れる。
 * 開示するのは図鑑自身がすでに開示している事実（枠数・レアリティ・
 * 入手経路）だけ。
 */
export type NextMilestone =
  | {
      discovered: number;
      kind: "dex-next";
      /**
       * true = PRマージで出会える（マスタの prAcquirable そのまま）。
       * undefined = フラグ未取得。何も主張しない（推測しない）。
       */
      prAcquirable: true | undefined;
      rarity: Monster["rarity"];
      total: number;
    }
  | {
      discovered: number;
      kind: "dex-summon-only";
      /** 残りの未発見数（すべて召喚専用）。 */
      remaining: number;
      total: number;
    }
  | {
      kind: "level";
      nextLevel: number;
      xpToNext: number;
    };

function dexMilestone(
  monsters: Monster[],
  ownedDegraded: boolean,
): NextMilestone | null {
  // 所持情報の取得が壊れている間は isOwned を信用しない（issue #122 と同方針）。
  if (ownedDegraded || monsters.length === 0) return null;

  // /monsters（図鑑）と同じ並び順（id 昇順）で「次」を決める。
  // 並びが違うと、図鑑を開いたときに指した枠が見つからない。
  const ordered = [...monsters].sort((a, b) => a.id.localeCompare(b.id));
  const unowned = ordered.filter((monster) => !monster.isOwned);
  if (unowned.length === 0) return null;

  const discovered = monsters.length - unowned.length;

  // 無償で埋まる枠を優先する（コイン行を先に出すのと同じ
  // 「無償経路を埋もれさせない」原則）。フラグ未取得の枠は
  // 召喚専用と断定できないので候補に含める。
  const freeNext = unowned.find((monster) => monster.prAcquirable !== false);
  if (freeNext) {
    return {
      discovered,
      kind: "dex-next",
      prAcquirable: freeNext.prAcquirable === true ? true : undefined,
      rarity: freeNext.rarity,
      total: monsters.length,
    };
  }

  // 残りが全部召喚専用のときは、個別の枠ではなく残数の事実を述べる
  // （home から課金枠を「次の目標」として名指ししない）。
  return {
    discovered,
    kind: "dex-summon-only",
    remaining: unowned.length,
    total: monsters.length,
  };
}

function levelMilestone(
  level: number | null | undefined,
  xpToNext: number | null | undefined,
): NextMilestone | null {
  // 値が読めないときは行ごと出さない（"NaN XP" を出すくらいなら消す）。
  if (!Number.isFinite(level ?? NaN) || !Number.isFinite(xpToNext ?? NaN)) {
    return null;
  }
  if ((xpToNext as number) <= 0) return null;
  return {
    kind: "level",
    nextLevel: (level as number) + 1,
    xpToNext: xpToNext as number,
  };
}

export function buildNextMilestone(input: {
  heroLevel: number | null | undefined;
  monsters: Monster[];
  /** 所持情報の取得が壊れている（401以外の失敗）間は図鑑の節目を出さない。 */
  ownedDegraded: boolean;
  xpToNextLevel: number | null | undefined;
}): NextMilestone | null {
  // 図鑑の節目を優先。図鑑が完成している/読めないときだけレベルに落とす。
  return (
    dexMilestone(input.monsters, input.ownedDegraded) ??
    levelMilestone(input.heroLevel, input.xpToNextLevel)
  );
}
