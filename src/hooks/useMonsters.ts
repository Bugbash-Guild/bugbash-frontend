// src/hooks/useMonsters.ts
'use client';

import useSWR from 'swr';
import type { Monster } from '@/types/monster';

type AllMonstersDto = {
    monsters: { id: string; name: string; emoji: string; rarity: string }[];
};
type OwnedMonstersDto = {
    monsters: { id: string; soulCount: number }[];
};

const fetchCompendium = async (): Promise<Monster[]> => {
    const [allRes, ownedRes] = await Promise.all([
        fetch('/api/monsters/all'),
        fetch('/api/monsters/owned'),
    ]);
    if (!allRes.ok) throw new Error(`monsters/all failed: ${allRes.status}`);

    const allData = (await allRes.json()) as AllMonstersDto;
    const ownedData = ownedRes.ok
        ? ((await ownedRes.json()) as OwnedMonstersDto)
        : { monsters: [] };

    const ownedMap = new Map(ownedData.monsters.map((m) => [m.id, m.soulCount]));

    return allData.monsters.map((m) => ({
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        rarity: m.rarity as Monster['rarity'],
        isOwned: ownedMap.has(m.id),
        soulCount: ownedMap.get(m.id) ?? 0,
    }));
};

export function useMonsters() {
    const { data, error, isLoading, mutate } = useSWR<Monster[]>(
        'monsters-compendium',
        fetchCompendium,
        { revalidateOnFocus: true },
    );

    return {
        monsters: data ?? [],
        loading: isLoading,
        error: error ? String(error) : null,
        refetch: () => mutate(),
    };
}
