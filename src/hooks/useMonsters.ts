// src/hooks/useMonsters.ts
'use client';

import useSWR from 'swr';
import type { Monster } from '@/types/monster';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMonsters() {
    const { data, error, isLoading, mutate } =
        useSWR<{ monsters: Monster[] }>('/api/monsters', fetcher, {
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
