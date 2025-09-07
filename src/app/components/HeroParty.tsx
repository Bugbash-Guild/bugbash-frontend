// src/app/components/HeroParty.tsx
'use client';

import type { Hero } from '@/types/hero';
import type { Monster } from '@/types/monster';
import { useMemo } from 'react';

type Props = {
    hero: Hero;
    monsters?: Monster[];
};

export function HeroParty({ hero, monsters = [] }: Props) {
    const displayMonsters = useMemo(() => {
        console.log('Monsters:', monsters);
        return monsters.slice(0, 3); // 最大3体まで表示
    }, [monsters]);

    const getMonsterPosition = (index: number) => {
        const positions = [
            'absolute left-12',      // 左上
            'absolute right-12',     // 右上
            'absolute bottom-12 left-12' // 左中央
        ];
        return positions[index] || positions[0];
    };


    return (
        <div
            className="
                fixed top-1/4 left-2/10 z-50
                w-[500px] max-w-[95vw]
                h-[500px]
                p-8
            "
            role="region"
            aria-label="Hero party playground"
        >

            {/* 勇者 - 最下部配置 */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
                <div className="relative w-[300px] h-[300px]">
                    <img
                        src="/hero_toka.png"
                        alt="勇者"
                        width={200}
                        height={200}
                        className="w-200 h-100 rounded-lg object-cover transition-transform duration-200"
                    />
                </div>
            </div>

            {/* モンスター仲間たち - 周囲に自然配置 */}
            {displayMonsters.map((monster, index) => (
                <div
                    key={monster.id}
                    className={getMonsterPosition(index)}
                >
                    <div className="relative group">
                        <div className="text-7xl hover:scale-110 transition-transform duration-200 cursor-pointer">
                            {monster.emoji}
                        </div>
                        {/* モンスター名表示（ホバー時） */}
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            {monster.name}
                        </div>
                    </div>
                </div>
            ))}

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
}
