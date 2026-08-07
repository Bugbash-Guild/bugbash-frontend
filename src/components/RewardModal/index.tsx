'use client';

import Link from 'next/link';

import { MonsterVisual } from '@/components/MonsterVisual';
import { RARITY_COLOR } from '@/constants/rarity';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import {
    buildRewardSummary,
    formatCoinBreakdown,
    formatDailyPolicyNote,
    formatRewardTotals,
    type RewardEntry,
} from '@/lib/rewardSummary';
import type { Activity, MonsterDetail } from '@/types/activity';

type Props = {
    activities: Activity[];
    /**
     * 既読化（acknowledge）を伴う閉じ方。CLAIM ボタンと「次の一歩」リンク
     * だけがこれを呼ぶ。報酬を「受け取った」と本人が明示した操作だけが
     * 未読を消す。
     */
    onClaim: () => void;
    /**
     * 既読化しない閉じ方（背景クリック・Esc・「あとで受け取る」）。
     * モーダルが閉じるだけで未読は残り、次にホームを開いたとき（または
     * 次のセッション開始時）にまた表示される。誤クリック1回で報酬明細が
     * 二度と見られなくなる事故を防ぐ（UX-BLUEPRINT §4）。
     */
    onDismiss: () => void;
};

function rarityColor(rarity: string): string {
    return RARITY_COLOR[rarity] ?? 'var(--text-dim)';
}

/** 迎えたモンスター。ここがこの画面の主役なので、他より大きく強く出す。 */
function MonsterAcquired({ monster }: { monster: MonsterDetail }) {
    const c = rarityColor(monster.rarity);
    const isTop = monster.rarity === 'SSR' || monster.rarity === 'SR';

    return (
        <div
            className="flex items-center gap-2.5 rounded-[4px] border px-2.5 py-2"
            style={{ background: `${c}12`, borderColor: `${c}55` }}
        >
            <div className="size-9 shrink-0 overflow-hidden rounded-[3px] border" style={{ borderColor: `${c}44` }}>
                <MonsterVisual className="size-full" name={monster.name} sizes="36px" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <span
                        className={`truncate font-semibold ${isTop ? 'text-[16px]' : 'text-[14px]'}`}
                        style={{ color: c }}
                    >
                        {monster.name}
                    </span>
                    <span
                        className="shrink-0 rounded-[2px] border px-1 py-px text-[9px] font-bold tracking-[0.08em]"
                        style={{ borderColor: `${c}66`, color: c }}
                    >
                        {monster.rarity}
                    </span>
                </div>
                <div className="text-[10px] text-text-faint">図鑑に追加されました</div>
            </div>
        </div>
    );
}

function EntryRow({ entry }: { entry: RewardEntry }) {
    const numbers = [
        entry.xp > 0 ? `+${entry.xp.toLocaleString('ja-JP')} XP` : null,
        entry.coin > 0 ? `+${entry.coin.toLocaleString('ja-JP')} ギルドコイン` : null,
        entry.soul > 0 ? `+${entry.soul.toLocaleString('ja-JP')} 魂` : null,
    ].filter(Boolean) as string[];
    const coinBreakdown = formatCoinBreakdown(entry.coinDetail);
    const dailyPolicyNote = formatDailyPolicyNote(entry.coinDetail);

    return (
        <div className="border-t border-line px-4 py-3 first:border-t-0">
            {/* どのPRの成果なのかを、報酬の直前に置く */}
            <div className="flex items-baseline gap-1.5 text-[11px]">
                <span className="shrink-0 text-accent">merged</span>
                {entry.repositoryName && entry.prNumber != null ? (
                    <span className="shrink-0 font-mono text-text-dim">
                        {entry.repositoryName}#{entry.prNumber}
                    </span>
                ) : (
                    <span className="shrink-0 text-text-faint">—</span>
                )}
                {entry.title && <span className="truncate text-text-faint">{entry.title}</span>}
            </div>

            {entry.monsters.length > 0 && (
                <div className="mt-2 space-y-1.5">
                    {entry.monsters.map((m, i) => (
                        <MonsterAcquired key={`${m.name}-${i}`} monster={m} />
                    ))}
                </div>
            )}

            {(numbers.length > 0 || entry.levelAfter != null) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-dim">
                    {numbers.map((n) => (
                        <span key={n}>{n}</span>
                    ))}
                    {entry.levelAfter != null && (
                        <span className="rounded-[2px] border border-gold/50 px-1.5 py-px text-[10px] font-bold tracking-[0.08em] text-gold">
                            Lv.{entry.levelAfter}
                        </span>
                    )}
                </div>
            )}

            {/* コインに何が乗ったのかを述べる。推測ではなくBEが分解した値。 */}
            {coinBreakdown && (
                <div className="mt-1 text-[10px] text-text-faint">{coinBreakdown}</div>
            )}

            {/*
              同日のPR本数による減衰は、これまでどこにも開示されていなかった。
              減衰した回にだけ、その場で理由を述べる（煽らず事実だけ）。
            */}
            {dailyPolicyNote && (
                <div className="mt-1 rounded-[3px] border border-line bg-bg px-2 py-1 text-[10px] text-text-dim">
                    {dailyPolicyNote}
                </div>
            )}
        </div>
    );
}

/**
 * 未読報酬モーダル。セッション開始時の「何を得たのか」に答える唯一の場所
 * （Job Story JS-1）。
 *
 * 構造は **PR単位**。以前は報酬単位のフラットな1列で、5PRで20行に膨らみ、
 * どのモンスターがどのPRから来たか分からず、SSRと「+10 魂」が同じ重さだった。
 * いまは 合計 → PRごとの成果（モンスターを主役に）→ 打ち切り件数 の順で、
 * 件数が増えても高さが線形に伸びない。
 *
 * 閉じ方は2系統に分かれる（UX-BLUEPRINT §4）:
 * - onClaim（CLAIM /「次の一歩」）だけが既読化する
 * - onDismiss（背景クリック / Esc /「あとで受け取る」）は閉じるだけ。
 *   以前はどの閉じ方でも既読化され、背景の誤クリック1回で報酬明細が
 *   永久に消えていた。
 */
export function RewardModal({ activities, onClaim, onDismiss }: Props) {
    const summary = buildRewardSummary(activities);
    const totals = formatRewardTotals(summary.totals);
    // マージの喜びが最高潮のこの瞬間に行き止まりだったのを、次の一歩に繋ぐ。
    // 新しい相棒がいれば図鑑へ、いなくても得た XP・魂・コインは相棒の育成に
    // 使うので、どちらも図鑑（＝育成の場）へ手渡す。
    const acquiredMonster = summary.entries.some((entry) => entry.monsters.length > 0);
    const nextStep = acquiredMonster
        ? { href: '/monsters', label: '図鑑で新しい相棒を見る →' }
        : { href: '/monsters', label: '相棒を育てにいく →' };

    // Esc は「閉じるだけ」で既読化しない（onClaim ではなく onDismiss を渡す）。
    // 未読は残り、次にホームを開いたとき（または次のセッション）にまた表示される。
    // Tab の循環・初期フォーカス・背後のスクロールロックも同時にここが持つ。
    const panelRef = useModalDismiss({ onDismiss });

    return (
        // 背景クリックも Esc と同じ「閉じるだけ」。誤クリックで報酬明細を
        // 失わせない（既読化は下部の CLAIM /「次の一歩」だけ）。
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onDismiss}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                // 見出し要素（h2）を持たない画面なので、aria-labelledby ではなく
                // aria-label で名前を与える（MobileNavDrawer と同じ流儀）。
                // ヘッダの `$ git log …` を参照させると読み上げが記号列になる。
                aria-label="未受け取りの報酬"
                aria-modal="true"
                className="relative z-10 flex max-h-[85vh] w-[440px] max-w-full flex-col overflow-hidden rounded-[8px] border border-line"
                onClick={(e) => e.stopPropagation()}
                ref={panelRef}
                role="dialog"
                style={{ background: 'var(--bg-elev)' }}
            >
                {/* header */}
                <div
                    className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3"
                    style={{
                        background: summary.leveledUp
                            ? 'rgba(251,191,36,0.08)'
                            : 'var(--bg-elev-2)',
                    }}
                >
                    <span className="font-mono text-[10px] tracking-[0.12em] text-text-faint">
                        $ git log --reward --since=last-seen
                    </span>
                    <div className="flex-1" />
                    <span className="text-[11px] text-text-faint">
                        {summary.prCount} PR{summary.prCount > 1 ? 's' : ''}
                    </span>
                </div>

                {/* レベルアップは最上位の見出しとして独立させる */}
                {summary.maxLevelAfter != null && (
                    <div className="shrink-0 border-b border-gold/30 bg-gold/[0.07] px-4 py-3">
                        <div className="text-[10px] tracking-[0.14em] text-gold">LEVEL UP</div>
                        <div className="text-[26px] font-bold leading-tight text-gold">
                            Lv.{summary.maxLevelAfter}
                        </div>
                    </div>
                )}

                {/* 合計を先に出す。ここだけ読めば結論が分かる */}
                {totals.length > 0 && (
                    <div className="shrink-0 border-b border-line px-4 py-2.5">
                        <div className="mb-1 text-[10px] tracking-[0.1em] text-text-faint">TOTAL</div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text">
                            {totals.map((t, i) => (
                                <span key={t}>
                                    {i > 0 && <span className="mr-2 text-text-faint">·</span>}
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRごとの内訳（スクロールするのはここだけ） */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {summary.entries.map((entry) => (
                        <EntryRow entry={entry} key={entry.id} />
                    ))}
                    {summary.hiddenCount > 0 && (
                        <div className="border-t border-line px-4 py-2.5 text-[11px] text-text-faint">
                            ほか {summary.hiddenCount} 件（合計には含まれています）
                        </div>
                    )}
                </div>

                {/* claim — 既読化するのはこの2つ（CLAIM と「次の一歩」）だけ */}
                <div className="shrink-0 space-y-2 border-t border-line px-4 py-3">
                    <button
                        className="w-full rounded-[4px] py-2.5 text-[13px] font-semibold tracking-[0.05em] transition-opacity hover:opacity-80"
                        onClick={onClaim}
                        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                        type="button"
                    >
                        {summary.leveledUp ? 'CLAIM & LEVEL UP' : 'CLAIM'}
                    </button>
                    {/* onClaim も呼ぶことで、遷移と同時に既読化する */}
                    <Link
                        className="block w-full rounded-[4px] border border-accent/40 py-2 text-center text-[12px] text-accent transition-[filter] hover:brightness-110"
                        href={nextStep.href}
                        onClick={onClaim}
                    >
                        {nextStep.label}
                    </Link>
                    {/*
                      背景クリック・Esc と同じ「閉じるだけ」を、明示的な選択肢
                      としても置く。挙動だけ黙って変えると「閉じたのに消えない」
                      に見えるため、また表示されることをラベルで先に宣言する。

                      data-autofocus をここに置くのは、このモーダルが本人の操作
                      なしに（セッション開始時に自動で）開くため。初期フォーカスが
                      CLAIM だと、別の入力のつもりで押した Enter 一回で明細が
                      既読化されて二度と読めなくなる。既定のフォーカスは常に
                      「失わない側」に置く。
                    */}
                    <button
                        className="block w-full py-1 text-center text-[11px] text-text-faint transition-colors hover:text-text-dim"
                        data-autofocus
                        onClick={onDismiss}
                        type="button"
                    >
                        あとで受け取る（次回また表示されます）
                    </button>
                </div>
            </div>
        </div>
    );
}
