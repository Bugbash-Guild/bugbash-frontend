// src/hooks/useHero.ts
'use client';

import useSWR from 'swr';
import type { Hero } from '@/types/hero';

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return (await res.json()) as Hero;
};

export function useHero(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<Hero>(
        enabled ? '/api/hero/stats' : null,
        fetcher,
        {
            refreshInterval: 600_000, // 10分
            revalidateOnFocus: true,
            shouldRetryOnError: true,
        }
    );

    return {
        hero: data ?? null,
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
