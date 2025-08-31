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
        return monsters.slice(1, 3); // 最大3体まで表示
    }, [monsters]);

    const heroLevel = useMemo(() => {
        const { experience } = hero;
        if (!experience || experience <= 0) return 1;

        const lvl = Math.log(experience) / Math.log(1.1);
        return Number.isFinite(lvl) && lvl >= 1 ? Math.floor(lvl) : 1;
    }, [hero.experience]);

    const getMonsterPosition = useMemo(() => {
        return (index: number, emoji: string) => {
            // 空を飛ぶ系のモンスター（鳥、ドラゴン、羽根系）
            const flyingTypes = ['🦅', '🦋', '🐉', '🦇', '🐲', '🕊️', '🪶'];
            // 地面系のモンスター
            const groundTypes = ['🐺', '🐅', '🦁', '🐗', '🐻', '🐸', '🐢', '🦎'];

            const isFlying = true;
            const isGround = false;

            if (isFlying) {
                // 空中配置（上部）- 広いスペースに散らばるように
                const positions = ['left-16', 'right-16', 'left-1/4', 'right-1/4', 'left-1/3', 'right-1/3'];
                return `absolute top-8 ${positions[index % positions.length]}`;
            } else if (isGround) {
                // 地面配置（下部）- 広いスペースに散らばるように
                const positions = ['left-20', 'right-20', 'left-1/4', 'right-1/4', 'left-1/3', 'right-1/3'];
                return `absolute bottom-12 ${positions[index % positions.length]}`;
            } else {
                // 中間配置（勇者の横）- 左右に広く配置
                const positions = ['left-12', 'right-12', 'left-1/5', 'right-1/5'];
                return `absolute top-1/2 -translate-y-1/2 ${positions[index % positions.length]}`;
            }
        };
    }, []);

    const { hasFlying, hasGround } = useMemo(() => {
        const flyingTypes = ['🦅', '🦋', '🐉', '🦇', '🐲', '🕊️', '🪶'];
        const groundTypes = ['🐺', '🐅', '🦁', '🐗', '🐻', '🐸', '🐢', '🦎'];

        return {
            hasFlying: true,
            hasGround: false
        };
    }, [displayMonsters]);

    return (
        <div
            className="
                fixed top-16 left-64 right-96 z-40
                h-[500px]
                relative
            "
            role="region"
            aria-label="Hero party playground"
        >
            {/* 背景 - 自然な遊び場風 */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-green-100 to-green-300 rounded-3xl opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-400/40 to-transparent rounded-b-3xl" />

            {/* 勇者 - 最下部配置 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="relative w-[300px] h-[300px]">
                    <img
                        src="/hero_toka.png"
                        alt="勇者"
                        width={200}
                        height={200}
                        className="w-200 h-100 rounded-lg object-cover hover:scale-110 transition-transform duration-200 cursor-pointer"
                    />
                </div>
            </div>

            {/* モンスター仲間たち - 周囲に自然配置 */}
            {displayMonsters.map((monster, index) => (
                <div
                    key={monster.id}
                    className={getMonsterPosition(index, monster.emoji)}
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

            {/* 雲の装飾（空飛ぶモンスターがいる場合） */}
            {hasFlying && (
                <>
                    <div className="absolute top-8 left-16 text-white/60 text-3xl animate-pulse">☁️</div>
                    <div className="absolute top-12 right-24 text-white/40 text-2xl animate-pulse" style={{animationDelay: '1s'}}>☁️</div>
                    <div className="absolute top-16 left-1/3 text-white/30 text-2xl animate-pulse" style={{animationDelay: '2s'}}>☁️</div>
                </>
            )}

            {/* 草の装飾（地面モンスターがいる場合） */}
            {hasGround && (
                <>
                    <div className="absolute bottom-8 left-16 text-green-600/60 text-2xl">🌱</div>
                    <div className="absolute bottom-12 right-20 text-green-500/60 text-xl">🌿</div>
                    <div className="absolute bottom-6 left-1/4 text-green-600/40 text-xl">🌱</div>
                    <div className="absolute bottom-16 right-1/3 text-green-500/50 text-lg">🌿</div>
                    <div className="absolute bottom-4 left-2/3 text-green-600/30 text-xl">🌱</div>
                </>
            )}
        </div>
    );
}
