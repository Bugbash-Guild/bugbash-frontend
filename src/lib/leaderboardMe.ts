import type { LeaderboardEntry, LeaderboardMe } from "@/types/leaderboard";

/** 有限数だけ通す。契約外の応答から NaN を画面に持ち込まないための関門。 */
function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * /api/leaderboard/me の応答検証。数値が欠けた応答は null に畳み、
 * 自分の行を出さないだけに留める（「rank: NaN」を描くくらいなら出さない）。
 */
export function parseLeaderboardMe(data: unknown): LeaderboardMe | null {
  if (typeof data !== "object" || data == null) return null;
  const record = data as Record<string, unknown>;

  const rank = asFiniteNumber(record.rank);
  const level = asFiniteNumber(record.level);
  const experience = asFiniteNumber(record.experience);
  const totalHeroes = asFiniteNumber(record.totalHeroes);
  if (rank == null || rank < 1 || level == null || experience == null || totalHeroes == null) {
    return null;
  }

  return {
    experience,
    githubLogin: typeof record.githubLogin === "string" ? record.githubLogin : null,
    level,
    rank,
    totalHeroes,
  };
}

/**
 * 一覧の末尾に「…」区切りで自分の行を足すべきか。
 *
 * - 自分が一覧に載っているなら足さない（既存の自分ハイライトで足りる）
 * - selfHeroId が無いと行のリンク先（/heroes/{heroId}）も一覧内の自分判定も
 *   組めないので足さない
 * - 一覧が空のときは「…」で切る相手がいないので足さない
 */
export function shouldAppendSelfRow(
  entries: LeaderboardEntry[],
  selfHeroId: string | null,
  me: LeaderboardMe | null,
): boolean {
  if (me == null || selfHeroId == null) return false;
  if (entries.length === 0) return false;
  return !entries.some((entry) => entry.heroId === selfHeroId);
}

/**
 * 一覧の凡例1行。件数の定数を FE に直書きせず、実際に届いた件数
 * （visibleCount）と /me の totalHeroes から言える事実だけを言う。
 */
export function buildLeaderboardLegend(
  visibleCount: number,
  totalHeroes: number | null,
): string | null {
  if (!Number.isFinite(visibleCount) || visibleCount <= 0) return null;

  const visibleText = visibleCount.toLocaleString("ja-JP");
  if (totalHeroes != null && Number.isFinite(totalHeroes) && totalHeroes > visibleCount) {
    return `全${totalHeroes.toLocaleString("ja-JP")}人中、上位${visibleText}名を表示`;
  }
  if (totalHeroes != null && totalHeroes === visibleCount) {
    // 全員が載っているのに「上位N名」と言うと打ち切りがあるように読める
    return `全${visibleText}人を表示`;
  }
  return `上位${visibleText}名を表示`;
}
