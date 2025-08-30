// src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import type { Item } from '@/types/item';

const ITEMS: Item[] = [
    { id: 'i1', name: 'Potion', emoji: '🧪', qty: 12 },
    { id: 'i2', name: 'Elixir', emoji: '⚗️', qty: 3 },
    { id: 'i3', name: 'Bomb', emoji: '💣', qty: 5 },
    { id: 'i4', name: 'Key', emoji: '🗝️', qty: 1 },
    { id: 'i5', name: 'Apple', emoji: '🍎', qty: 9 },
];

export async function GET() {
    return NextResponse.json({ items: ITEMS });
}
