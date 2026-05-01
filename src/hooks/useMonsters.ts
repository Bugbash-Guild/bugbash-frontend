// src/hooks/useMonsters.ts
'use client';

import useSWR from 'swr';
import type { Monster } from '@/types/monster';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return res.json();
};

export function useMonsters() {
    const { data, error, isLoading, mutate } =
        useSWR<{ monsters: Monster[] }>('/api/monsters/owned', fetcher, {
            refreshInterval: 0,
            revalidateOnFocus: true,
        });

    return {
        monsters: data?.monsters ?? [],
        loading: isLoading,
        error: error ? String(error) : null,
        refetch: () => mutate(),
    };
}
