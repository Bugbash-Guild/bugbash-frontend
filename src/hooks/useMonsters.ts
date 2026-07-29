// src/hooks/useMonsters.ts
'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { AwakeningState, Monster, MonsterFormStage } from '@/types/monster';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

type AllMonstersDto = {
    monsters: {
        id: string;
        slug?: string;
        name: string;
        emoji: string;
        rarity: string;
        artworkByStage?: Partial<Record<MonsterFormStage, string>>;
        prAcquirable?: boolean;
    }[];
};
type OwnedMonstersDto = {
    monsters: {
        id: string;
        ownedMonsterId?: string | number;
        acquiredAt?: string;
        slug?: string;
        soulCount: number;
        level: number;
        awakeningState: AwakeningState;
        formStage: MonsterFormStage;
        assetUrl?: string | null;
        artworkByStage?: Partial<Record<MonsterFormStage, string>>;
        attribute: string;
        attributeName: string;
        attributeEmoji: string;
    }[];
};

type Compendium = {
    monsters: Monster[];
    /**
     * owned の取得に失敗した状態（401以外）。この間 isOwned は信頼できない。
     * 以前は黙って空配列にフォールバックしており、エラー表示なしで
     * 「全モンスター未所持」に見えていた（issue #122）。
     */
    ownedDegraded: boolean;
};

const fetchCompendium = async (): Promise<Compendium> => {
    let ownedDegraded = false;
    const [allData, ownedData] = await Promise.all([
        fetchJson<AllMonstersDto>('/api/monsters/all', undefined, 'monsters/all'),
        fetchJson<OwnedMonstersDto>('/api/monsters/owned', undefined, 'monsters/owned').catch(
            (error: unknown) => {
                if (isUnauthorizedApiError(error)) throw error;
                ownedDegraded = true;
                return { monsters: [] };
            },
        ),
    ]);

    const ownedMap = new Map(ownedData.monsters.map((m) => [m.id, m]));

    const monsters = allData.monsters.map((m) => {
        const owned = ownedMap.get(m.id);
        return {
            id: m.id,
            ownedMonsterId: owned?.ownedMonsterId,
            acquiredAt: owned?.acquiredAt,
            slug: owned?.slug ?? m.slug,
            name: m.name,
            emoji: m.emoji,
            rarity: m.rarity as Monster['rarity'],
            prAcquirable: m.prAcquirable,
            isOwned: ownedMap.has(m.id),
            attribute: owned?.attribute,
            attributeName: owned?.attributeName,
            attributeEmoji: owned?.attributeEmoji,
            soulCount: owned?.soulCount ?? 0,
            level: owned?.level ?? 1,
            awakeningState: owned?.awakeningState,
            formStage: owned?.formStage,
            assetUrl: owned?.assetUrl,
            artworkByStage: owned?.artworkByStage ?? m.artworkByStage,
        };
    });

    return { monsters, ownedDegraded };
};

export function useMonsters() {
    const { data, error, isLoading, mutate } = useSWR<Compendium>(
        'monsters-compendium',
        fetchCompendium,
        { revalidateOnFocus: true },
    );
    useRedirectOnUnauthorized(error);

    return {
        monsters: data?.monsters ?? [],
        ownedDegraded: data?.ownedDegraded ?? false,
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error) : null,
        refetch: () => mutate(),
    };
}
