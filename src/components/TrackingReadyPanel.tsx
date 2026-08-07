/**
 * GitHub App 導入済み・かつマージ実績 0 のときだけ home に出す「待機中」パネル。
 *
 * 導入直後は画面に何も変化がなく、「本当に動いているのか」が分からない
 * （追跡は始まっているのに OFFLINE に見える）。ここで
 *  - 何をすると何が起きるか（author の PR マージで記録される）
 *  - 何は起きないか（過去のマージ分は遡って加算されない）
 *  - 報酬の減衰則（同日のマージ本数で1件あたりの資源が減ることがある）
 * を先に開示する。数値の約束（「数秒で反映」等）はコードから保証できない
 * ので書かない。減衰則の文言は src/lib/rewardSummary.ts の
 * formatDailyPolicyNote が報酬明細に出す事実と同じ範囲に留める。
 *
 * リポジトリ追加リンクは従来 home 右上に単独で出していたものをここへ吸収
 * （このパネルが出ている間は page.tsx 側の小リンクを出さない）。
 * id="tracking-ready" は FirstQuestChecklist の step2 から飛ぶアンカー。
 */
export function TrackingReadyPanel() {
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : null;

  return (
    <section
      aria-labelledby="tracking-ready-heading"
      className="mb-4 rounded-[6px] border border-accent/30 bg-accent/[0.04] p-4"
      id="tracking-ready"
    >
      <h2
        className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"
        id="tracking-ready-heading"
      >
        TRACKING READY — 最初のマージを待っています
      </h2>
      <p className="mt-2 text-[12px] leading-6 text-text">
        あなたが author の PR がマージされると、自動で記録されてホームに反映されます。
        <span className="text-text-dim">
          過去のマージ分は対象外です（導入後のマージから追跡が始まります）。
        </span>
      </p>
      {/* 減衰則は報酬が減った瞬間に初めて知ると不信になるので、先に1行だけ開示 */}
      <p className="mt-1 text-[10px] leading-5 text-text-faint">
        同じ日のマージ本数が多いと、1件あたりの付与資源が減ることがあります。減った場合は報酬明細にその理由が表示されます。
      </p>
      {installUrl && (
        <a
          className="mt-2 inline-block text-[11px] text-accent underline underline-offset-4 hover:brightness-110"
          href={installUrl}
          rel="noreferrer noopener"
          target="_blank"
        >
          + GitHub App にリポジトリを追加 →
        </a>
      )}
    </section>
  );
}
