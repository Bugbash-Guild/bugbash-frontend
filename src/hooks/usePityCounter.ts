'use client';

import useSWR from 'swr';

import type { PityCounterResponse } from '@/types/summon';

const fetcher = async (url: string): Promise<PityCounterResponse> => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return res.json() as Promise<PityCounterResponse>;
};

export function usePityCounter(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<PityCounterResponse>(
        enabled ? '/api/summon/pity' : null,
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
            shouldRetryOnError: false,
        },
    );

    return {
        pity: data ?? null,
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
