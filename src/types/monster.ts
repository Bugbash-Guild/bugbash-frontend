// src/types/monster.ts
export type Monster = {
    id: string;
    name: string;
    emoji: string;      // 画像の代わりに絵文字で簡易表示
    rarity: 'N' | 'R' | 'SR' | 'SSR';
};

