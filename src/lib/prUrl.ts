/**
 * GitHub の PR ページへのリンク。repositoryFullName は webhook の
 * repository.full_name 由来で owner/repo 形式だが、payload に欠けると
 * "" のまま届くことがあるため、形式を確認できた場合だけ URL を組む
 * （確認できない項目はリンク化せず、呼び出し側でテキスト表示に落とす）。
 * home の活動ログと図鑑の出自PR表示で同じ検証を使うため lib に置く。
 */
export function buildPrUrl(repositoryFullName: string, prNumber: number): string | null {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repositoryFullName)) return null;
  if (!Number.isFinite(prNumber)) return null;
  return `https://github.com/${repositoryFullName}/pull/${prNumber}`;
}

export type PrRef = {
  /** 「owner/repo#N」。表示用のテキスト。 */
  label: string;
  /** owner/repo 形式を検証できたときだけ入る。null ならリンク化しない。 */
  url: string | null;
};

/**
 * 出自PRの表示要素。repositoryFullName と prNumber が揃っていない
 * データ（BE未対応・欠損）は null を返し、呼び出し側は何も表示しない。
 * 欠けた値を推測して埋めない（値の非捏造）。
 */
export function buildPrRef(
  repositoryFullName: string | null | undefined,
  prNumber: number | null | undefined,
): PrRef | null {
  if (typeof repositoryFullName !== "string" || repositoryFullName.trim() === "") return null;
  if (typeof prNumber !== "number" || !Number.isFinite(prNumber)) return null;

  return {
    label: `${repositoryFullName}#${prNumber}`,
    url: buildPrUrl(repositoryFullName, prNumber),
  };
}
