// src/hooks/useMonsters.ts
'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { AwakeningState, Monster } from '@/types/monster';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

type AllMonstersDto = {
    monsters: { id: string; name: string; emoji: string; rarity: string }[];
};
type OwnedMonstersDto = {
    monsters: {
        id: string;
        soulCount: number;
        level: number;
        awakeningState: AwakeningState;
        attribute: string;
        attributeName: string;
        attributeEmoji: string;
    }[];
};

const fetchCompendium = async (): Promise<Monster[]> => {
    const [allData, ownedData] = await Promise.all([
        fetchJson<AllMonstersDto>('/api/monsters/all', undefined, 'monsters/all'),
        fetchJson<OwnedMonstersDto>('/api/monsters/owned', undefined, 'monsters/owned').catch(
            (error: unknown) => {
                if (isUnauthorizedApiError(error)) throw error;
                return { monsters: [] };
            },
        ),
    ]);

    const ownedMap = new Map(ownedData.monsters.map((m) => [m.id, m]));

    return allData.monsters.map((m) => {
        const owned = ownedMap.get(m.id);
        return {
            id: m.id,
            name: m.name,
            emoji: m.emoji,
            rarity: m.rarity as Monster['rarity'],
            isOwned: ownedMap.has(m.id),
            attribute: owned?.attribute,
            attributeName: owned?.attributeName,
            attributeEmoji: owned?.attributeEmoji,
            soulCount: owned?.soulCount ?? 0,
            level: owned?.level ?? 1,
            awakeningState: owned?.awakeningState,
        };
    });
};

export function useMonsters() {
    const { data, error, isLoading, mutate } = useSWR<Monster[]>(
        'monsters-compendium',
        fetchCompendium,
        { revalidateOnFocus: true },
    );
    useRedirectOnUnauthorized(error);

    return {
        monsters: data ?? [],
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error) : null,
        refetch: () => mutate(),
    };
}
