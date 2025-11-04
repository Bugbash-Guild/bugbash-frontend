// src/app/components/HeroParty.tsx
'use client';

import type { FC } from 'react';
import { useMemo } from 'react';
import Image from 'next/image';

import type { Monster } from '~/types/monster';

// 定数
const MONSTER_SLICE_START = 1; // スライス開始位置
const MONSTER_SLICE_END = 3; // スライス終了位置（1〜2の2体）

type Props = {
    monsters?: Monster[];
};

export const HeroParty: FC<Props> = ({ monsters = [] }) => {
    const displayMonsters = useMemo(() => {
        return monsters.slice(MONSTER_SLICE_START, MONSTER_SLICE_END);
    }, [monsters]);

    return (
        <div
            className="fixed top-16 left-64 right-96 z-40 h-[500px]"
            role="region"
            aria-label="Hero party playground"
        >
            {/* 勇者 - 最下部配置 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="relative w-[300px] h-[300px]">
                    <Image
                        src="/hero_toka.png"
                        alt="勇者"
                        width={200}
                        height={200}
                        draggable={false}
                        className="w-200 h-100 rounded-lg object-cover hover:scale-110 transition-transform duration-200 cursor-pointer select-none"
                    />
                </div>
            </div>

            {/* モンスター仲間たち - 勇者の左右に配置 */}
            {displayMonsters.map((monster, index) => {
                const isLeft = index === 0;
                const positionClass = isLeft
                    ? 'absolute top-1/2 -translate-y-1/2 left-1/4'
                    : 'absolute top-1/2 -translate-y-1/2 right-1/4';

                return (
                    <div key={monster.id} className={positionClass}>
                        <div className="relative group">
                            <div className="text-7xl hover:scale-110 transition-transform duration-200 cursor-pointer select-none">
                                {monster.emoji}
                            </div>
                            {/* モンスター名表示（ホバー時） */}
                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                {monster.name}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* 仲間がいない場合の表示 */}
            {displayMonsters.length === 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-16 text-center">
                    <div className="text-8xl opacity-50 mb-6">💤</div>
                    <p className="text-xl text-zinc-500 dark:text-zinc-400">
                        仲間を探しに行こう！
                    </p>
                </div>
            )}
        </div>
    );
};
