// src/app/api/monsters/route.ts
import { NextResponse } from 'next/server';
import type { Monster } from '@/types/monster';

const MONSTERS: Monster[] = [
    { id: 'm1', name: 'Slime', emoji: '🟢', rarity: 'N' },
    { id: 'm2', name: 'Bat', emoji: '🦇', rarity: 'N' },
    { id: 'm3', name: 'Dragon', emoji: '🐉', rarity: 'SSR' },
    { id: 'm4', name: 'Ghost', emoji: '👻', rarity: 'R' },
    { id: 'm5', name: 'Phoenix', emoji: '🐦‍🔥', rarity: 'SR' },
];

export async function GET() {
    return NextResponse.json({ monsters: MONSTERS });
}
