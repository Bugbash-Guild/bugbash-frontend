"use client";

import { useCallback, useEffect, useState } from "react";

import {
  findFunnelBottleneck,
  formatConversionPercent,
  formatConversionPopulation,
  funnelStepLabel,
  hasAnyFunnelData,
  type FunnelSummary,
} from "@/lib/funnelReport";

const TOKEN_STORAGE_KEY = "bb.admin.funnelToken";
const DAY_OPTIONS = [1, 7, 30, 90];

/**
 * 課金導線の集計。
 *
 * トークンは**画面で入力させ、sessionStorage に置く**。サーバ側の環境変数に
 * 持たせると、認証の無いこのページを開いた全員が事業数値を引ける。
 * タブを閉じれば消える置き場所にして、共有端末に残さない。
 */
function readStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export default function AdminFunnelPage() {
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(readStoredToken());
  }, []);

  const load = useCallback(
    async (currentToken: string, currentDays: number) => {
      if (!currentToken) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/funnel?days=${currentDays}`, {
          cache: "no-store",
          headers: { "X-BugBash-Admin-Token": currentToken },
        });
        if (response.status === 403) {
          setSummary(null);
          setError("トークンが違います。");
          return;
        }
        if (!response.ok) {
          setSummary(null);
          setError(`集計を取得できませんでした（${response.status}）。`);
          return;
        }
        setSummary((await response.json()) as FunnelSummary);
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, currentToken);
      } catch {
        setSummary(null);
        setError("集計を取得できませんでした。");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const stored = readStoredToken();
    if (stored) void load(stored, days);
  }, [days, load]);

  const bottleneck = summary ? findFunnelBottleneck(summary) : null;
  const measured = summary ? hasAnyFunnelData(summary) : false;

  return (
    <div className="px-4 py-5 md:px-9 md:py-6">
      <div className="mb-5 text-[13px] text-text-dim">
        <span className="text-accent">admin@bugbash</span>
        <span className="text-text-faint">:</span>
        <span className="text-accent-2">~/admin/funnel</span>
        <span className="text-text-faint">$ </span>
        <span>funnel --days={days}</span>
      </div>

      <div className="mb-5">
        <h1 className="text-[24px] font-semibold text-text">課金導線</h1>
        <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
          各段階に到達した<b className="text-text">人数</b>と、隣り合う段階の到達率。
          到達率は<b className="text-text">同じ人が両方を通ったか</b>で数えます
          （前段を通らずに後段へ来た人は分子に入りません）。
          分母がいない区間は 0% ではなく — と表示します
          （「誰も進んでいない」と「まだ誰も来ていない」は別のことなので）。
          未ログインの記録は人数を辿れないため、到達率には含まれません。
        </p>
      </div>

      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void load(token, days);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-text-faint">
            運用トークン
          </span>
          <input
            className="w-full max-w-md border border-line bg-bg px-3 py-2 text-[12px] text-text"
            onChange={(event) => setToken(event.target.value)}
            placeholder="X-BugBash-Admin-Token"
            type="password"
            value={token}
          />
        </label>
        <div className="flex border border-line text-[11px]">
          {DAY_OPTIONS.map((option, index) => (
            <button
              className={[
                "px-3 py-2",
                index > 0 ? "border-l border-line" : "",
                option === days ? "bg-bg-elev-2 font-semibold text-text" : "text-text-dim",
              ].join(" ")}
              key={option}
              onClick={() => setDays(option)}
              type="button"
            >
              {option}日
            </button>
          ))}
        </div>
        <button
          className="border border-line bg-bg-elev px-3 py-2 text-[12px] text-text hover:bg-bg-elev-2 disabled:opacity-40"
          disabled={loading || token.length === 0}
          type="submit"
        >
          {loading ? "取得中…" : "取得"}
        </button>
      </form>

      {error && (
        <div className="mb-5 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
          {error}
        </div>
      )}

      {summary && !measured && (
        <div className="mb-5 border border-line bg-bg-elev px-3 py-3 text-[12px] leading-6 text-text-dim">
          この期間の記録がまだありません。導線が悪いのではなく、
          <b className="text-text">まだ誰も通っていない</b>状態です。
        </div>
      )}

      {summary && measured && bottleneck && (
        <div className="mb-5 border border-gold/40 bg-gold/[0.07] px-4 py-3">
          <div className="text-[10px] tracking-[0.12em] text-gold">最も失っている区間</div>
          <div className="mt-1 text-[14px] text-text">
            {funnelStepLabel(bottleneck.conversion.from)} →{" "}
            {funnelStepLabel(bottleneck.conversion.to)}
            <span className="ml-3 text-text-dim">
              {bottleneck.lostHeroes.toLocaleString("ja-JP")} 人が進んでいない（
              {formatConversionPopulation(bottleneck.conversion)} ・到達率{" "}
              {formatConversionPercent(bottleneck.conversion.percent)}）
            </span>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid max-w-4xl grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="min-w-0 border border-line bg-bg-elev p-4">
            <div className="mb-3 text-[10px] tracking-[0.12em] text-text-faint">到達人数</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-[12px]">
                <thead>
                  <tr className="text-text-faint">
                    <th className="pb-2 text-left font-normal">段階</th>
                    <th className="pb-2 text-right font-normal">人数</th>
                    <th className="pb-2 text-right font-normal">回数</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.steps.map((step) => (
                    <tr className="border-t border-line" key={step.name}>
                      <td className="py-2 text-text">{funnelStepLabel(step.name)}</td>
                      <td className="py-2 text-right text-text">
                        {step.heroCount.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2 text-right text-text-dim">
                        {step.eventCount.toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="min-w-0 border border-line bg-bg-elev p-4">
            <div className="mb-3 text-[10px] tracking-[0.12em] text-text-faint">到達率</div>
            <ul className="space-y-2 text-[12px]">
              {summary.conversions.map((conversion) => (
                <li
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-2 first:border-t-0 first:pt-0"
                  key={`${conversion.from}-${conversion.to}`}
                >
                  <span className="min-w-0 text-text-dim">
                    {funnelStepLabel(conversion.from)} → {funnelStepLabel(conversion.to)}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-text">
                      {formatConversionPercent(conversion.percent)}
                    </span>
                    {/* 率だけだと2人中2人の100%が大勝利に見える */}
                    <span className="ml-2 text-[10px] text-text-faint">
                      {formatConversionPopulation(conversion)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
