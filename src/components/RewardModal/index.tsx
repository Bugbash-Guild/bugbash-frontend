'use client';

import { useEffect } from 'react';

import { MonsterVisual } from '@/components/MonsterVisual';
import { RARITY_COLOR } from '@/constants/rarity';
import {
    buildRewardSummary,
    formatRewardTotals,
    type RewardEntry,
} from '@/lib/rewardSummary';
import type { Activity, MonsterDetail } from '@/types/activity';

type Props = {
    activities: Activity[];
    onClose: () => void;
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
 */
export function RewardModal({ activities, onClose }: Props) {
    const summary = buildRewardSummary(activities);
    const totals = formatRewardTotals(summary.totals);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                aria-modal="true"
                className="relative z-10 flex max-h-[85vh] w-[440px] max-w-full flex-col overflow-hidden rounded-[8px] border border-line"
                onClick={(e) => e.stopPropagation()}
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

                {/* claim */}
                <div className="shrink-0 border-t border-line px-4 py-3">
                    <button
                        className="w-full rounded-[4px] py-2.5 text-[13px] font-semibold tracking-[0.05em] transition-opacity hover:opacity-80"
                        onClick={onClose}
                        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                        type="button"
                    >
                        {summary.leveledUp ? 'CLAIM & LEVEL UP' : 'CLAIM'}
                    </button>
                </div>
            </div>
        </div>
    );
}
