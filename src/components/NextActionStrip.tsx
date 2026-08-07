"use client";

import Link from "next/link";

import { useWallet } from "@/hooks/useWallet";
import { buildNextActions, type NextActionRow } from "@/lib/nextAction";

/**
 * 「いま、できること / 次の目標」を通貨ごとに1行だけ提示する。
 *
 * 報酬（コイン）は活動で自動的に貯まるが、貯まったことに気づく場所がないため
 * 未使用のまま積み上がりやすい。何回ぶんあるか・あといくら足りないかという
 * 事実だけを述べ、期限・カウントダウン・煽り文句は付けない（D-1: 事実の進捗のみ）。
 *
 * 距離行（残高がコストに届かないとき）はコインだけに出す。ルーンの不足を
 * home で数え上げると購入圧になるためルーン行は従来どおり非表示
 * （BalanceShortfall と同じコイン/ルーン非対称）。PR換算の併記はしない —
 * 1PRあたりのコインはストリーク・PR規模・同日減衰で変動し、固定値が
 * 存在しないため（捏造になる）。
 *
 * ルーン行は収益導線。限定召喚はルーンの最大の吸収先なのに、入口が
 * 召喚ページ内の1リンクだけ（単線）だったため、サイドバーを増やさずに
 * home からの経路を1本増やす。
 *
 * 召喚コストは開示APIの値をそのまま使う（フロントに価格定数を持たない）。
 * 未取得のあいだは何も出さない＝値を仮置きしない。
 */
const TONE: Record<
  NextActionRow["currency"],
  { box: string; cta: string; num: string }
> = {
  // 名声圏＝緑 / 課金圏＝琥珀（色の専有を崩さない）
  coin: {
    box: "border-accent/30 bg-accent/[0.05]",
    cta: "border-accent/40 bg-accent/[0.08] text-accent",
    num: "text-accent",
  },
  rune: {
    box: "border-rune-border bg-rune-bg",
    cta: "border-rune-border bg-rune-bg text-rune",
    num: "text-rune",
  },
};

/**
 * 召喚コストは呼び出し側で取得して渡す。
 *
 * この帯は hero が来るまで描画されないので、以前は内部の
 * `useSummonDisclosure` が hero 取得後にようやく発火し、
 * home の初回表示で往復がもう 1 段増えていた（実測 851ms 開始）。
 * 取得を親へ上げて、hero と並列に走らせる。
 */
export function NextActionStrip({
  enabled,
  guildCoinBalance,
  limitedPullCost,
  normalPullCost,
}: {
  enabled: boolean;
  guildCoinBalance: number | null | undefined;
  limitedPullCost: number | null | undefined;
  normalPullCost: number | null | undefined;
}) {
  const { wallet } = useWallet(enabled);

  const rows = buildNextActions({
    guildCoinBalance,
    limitedPullCost,
    normalPullCost,
    runeBalance: wallet?.runeBalance,
  });

  if (rows.length === 0) return null;

  return (
    <div className="mb-3.5 space-y-2">
      {rows.map((row) => {
        if (row.kind === "distance") {
          // 距離行: まだ引けないので CTA ボタンは置かない（押しても引けない
          // ボタンは虚偽アフォーダンス）。集め方の事実だけ添える。
          return (
            <div
              className="rounded-[6px] border border-line bg-bg-elev px-4 py-3"
              key={row.currency}
            >
              <p className="text-[12px] text-text-dim">
                <span className="text-[10px] uppercase tracking-[0.14em] text-text-faint">
                  NEXT
                </span>
                <span className="mx-2 text-text-faint">·</span>
                {row.subject}まであと{" "}
                <b className="tabular-nums text-accent">
                  {row.shortfall.toLocaleString("ja-JP")}
                </b>{" "}
                {row.currencyLabel}
                <span className="text-text-faint">
                  {" "}
                  — PR をマージして集めましょう
                </span>
              </p>
            </div>
          );
        }

        const tone = TONE[row.currency];
        return (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-[6px] border px-4 py-3 ${tone.box}`}
            key={row.currency}
          >
            <p className="text-[12px] text-text-dim">
              <span className="text-[10px] uppercase tracking-[0.14em] text-text-faint">
                READY
              </span>
              <span className="mx-2 text-text-faint">·</span>
              {row.subject}{" "}
              <b className={`tabular-nums ${tone.num}`}>×{row.count}</b> ぶんの
              {row.currencyLabel}があります
            </p>
            <Link
              className={`shrink-0 rounded-[4px] border px-4 py-1.5 text-[12px] font-semibold transition-[filter] hover:brightness-110 ${tone.cta}`}
              href={row.href}
            >
              {row.subject}へ →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
