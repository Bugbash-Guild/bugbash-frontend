'use client';

import { useEffect, useRef } from 'react';

import { MonsterVisual } from '@/components/MonsterVisual';
import type { Activity, ActivityReward, MonsterDetail, XpDetail } from '@/types/activity';

type Props = {
    activities: Activity[];
    onClose: () => void;
};

function isXpDetail(d: unknown): d is XpDetail {
    return typeof d === 'object' && d !== null && 'levelBefore' in d && 'levelAfter' in d;
}

function isMonsterDetail(d: unknown): d is MonsterDetail {
    return typeof d === 'object' && d !== null && 'name' in d && 'emoji' in d;
}

function RewardLine({ reward }: { reward: ActivityReward }) {
    const { rewardType, quantity, detail } = reward;

    if (rewardType === 'xp') {
        const leveled = isXpDetail(detail) && detail.levelAfter > detail.levelBefore;
        return (
            <div className="flex items-center gap-2 text-[13px]">
                <span className="text-accent font-bold">+{quantity} XP</span>
                {leveled && isXpDetail(detail) && (
                    <span className="text-yellow-400 text-[11px] font-bold tracking-widest border border-yellow-400/50 px-1.5 py-0.5 rounded-[2px]">
                        LEVEL UP! Lv.{detail.levelAfter}
                    </span>
                )}
            </div>
        );
    }

    if (rewardType === 'monster' && isMonsterDetail(detail)) {
        const rarityColor: Record<string, string> = {
            N: '#9ca3af', R: '#60a5fa', SR: '#c084fc', SSR: '#fbbf24',
        };
        const c = rarityColor[detail.rarity] ?? '#9ca3af';
        return (
            <div className="flex items-center gap-2 text-[13px]">
                <MonsterVisual
                    className="size-7"
                    name={detail.name}
                    sizes="28px"
                />
                <span style={{ color: c }} className="font-semibold">{detail.name}</span>
                <span className="text-[10px] px-1 py-0.5 rounded border font-bold" style={{ color: c, borderColor: `${c}55` }}>
                    {detail.rarity}
                </span>
                <span className="text-text-faint text-[11px]">new monster!</span>
            </div>
        );
    }

    if (rewardType === 'soul') {
        return (
            <div className="text-[13px]">
                <span className="text-purple-400 font-bold">+{quantity}</span>
                <span className="text-text-dim"> soul</span>
            </div>
        );
    }

    if (rewardType === 'coin') {
        return (
            <div className="text-[13px]">
                <span className="text-yellow-400 font-bold">+{quantity}</span>
                <span className="text-text-dim"> G</span>
            </div>
        );
    }

    return null;
}

export function RewardModal({ activities, onClose }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const allRewards = activities.flatMap((a) => a.rewards);
    const sources = activities
        .map((a) => {
            const m = a.metadata as { prNumber?: number; repositoryFullName?: string; title?: string };
            return m.prNumber ? `#${m.prNumber} ${m.title ?? ''}` : null;
        })
        .filter(Boolean) as string[];

    const hasLevelUp = allRewards.some(
        (r) => r.rewardType === 'xp' && isXpDetail(r.detail) && r.detail.levelAfter > r.detail.levelBefore,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                ref={ref}
                className="relative z-10 w-[420px] max-w-[90vw] rounded-[8px] border border-line overflow-hidden"
                style={{ background: 'var(--bg-elev)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div
                    className="px-4 py-3 border-b border-line flex items-center gap-2"
                    style={{ background: hasLevelUp ? 'rgba(251,191,36,0.08)' : 'var(--bg-elev-2)' }}
                >
                    <span className="text-[10px] text-text-faint tracking-[0.12em] font-mono">
                        $ git log --reward --since=last-seen
                    </span>
                    <div className="flex-1" />
                    <span className="text-[11px] text-text-faint">{activities.length} PR{activities.length > 1 ? 's' : ''}</span>
                </div>

                {/* source PRs */}
                {sources.length > 0 && (
                    <div className="px-4 pt-3 pb-1 space-y-0.5">
                        {sources.slice(0, 3).map((s) => (
                            <div key={s} className="text-[11px] text-text-faint font-mono truncate">
                                <span className="text-accent">merged</span> {s}
                            </div>
                        ))}
                        {sources.length > 3 && (
                            <div className="text-[11px] text-text-faint">…and {sources.length - 3} more</div>
                        )}
                    </div>
                )}

                {/* rewards */}
                <div className="px-4 py-3 space-y-2">
                    <div className="text-[10px] text-text-faint tracking-[0.1em] mb-2">REWARDS</div>
                    {allRewards.map((r, i) => (
                        <RewardLine key={i} reward={r} />
                    ))}
                </div>

                {/* claim button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-[4px] text-[13px] font-semibold tracking-[0.05em] transition-opacity hover:opacity-80"
                        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                    >
                        {hasLevelUp ? 'CLAIM & LEVEL UP' : 'CLAIM'}
                    </button>
                </div>
            </div>
        </div>
    );
}
