// src/components/HeroCard.tsx
'use client';

import type { Hero } from '@/types/hero';
import { useMemo } from 'react';

function isFiniteNum(n: number) {
    return Number.isFinite(n) && !Number.isNaN(n);
}

export function HeroCard({ hero }: { hero: Hero }) {
    const { experience } = hero;

    const {
        level,
        expForCurrent,
        expForNext,
        progressPctStr,
        remainingStr,
        showProgress,
    } = useMemo(() => {
        const lvl = experience > 0 ? Math.log(experience) / Math.log(1.1) : 0;
        const safeLevel = isFiniteNum(lvl) && lvl >= 0 ? lvl : 0;

        const currentLevelInt = Math.floor(safeLevel);
        const nextLevelInt = currentLevelInt + 1;

        const expForCurrent = Math.pow(1.1, currentLevelInt);
        const expForNext = Math.pow(1.1, nextLevelInt);

        let progressRatio = 0;
        let showProgress = true;

        if (
            !isFiniteNum(expForCurrent) ||
            !isFiniteNum(expForNext) ||
            expForNext <= expForCurrent
        ) {
            showProgress = false;
        } else {
            const denom = expForNext - expForCurrent;
            const raw = (experience - expForCurrent) / denom;
            progressRatio = Math.min(1, Math.max(0, raw));
        }

        const progressPctStr = (progressRatio * 100).toFixed(1);

        let remainingStr = '';
        const remaining = expForNext - experience;
        if (isFiniteNum(remaining) && remaining > 0) {
            remainingStr = remaining.toFixed(2);
        } else if (showProgress) {
            remainingStr = '0.00';
        } else {
            remainingStr = '—';
        }

        return {
            level: safeLevel,
            expForCurrent,
            expForNext,
            progressRatio,
            progressPctStr,
            remainingStr,
            showProgress,
        };
    }, [experience]);

    return (
        <div
            className="
        fixed top-1/4 right-1/10 z-50
        w-[420px] max-w-[95vw]
        p-8
      "
            role="region"
            aria-label="Hero info"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-5xl font-bold text-zinc-800 dark:text-white">
                        Level {level.toFixed(0)}
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4 text-lg">
                <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Experience</span>
                    <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-100">
            {Number.isFinite(experience) ? experience.toFixed(0) : '—'}
          </span>
                </div>

                {showProgress ? (
                    <div className="mt-2">
                        <div
                            className="h-4 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-700/70 overflow-hidden"
                            role="progressbar"
                            aria-label="Progress to next level"
                            aria-valuenow={parseFloat(progressPctStr)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-[width] duration-700"
                                style={{ width: `${progressPctStr}%` }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
                                Next level in{' '}
                                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                                    {remainingStr}
                                </span>{' '}
                                XP
                            </div>
                            <span>{progressPctStr}%</span>
                        </div>
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Progress unavailable
                    </p>
                )}
            </div>
        </div>
    );
}
