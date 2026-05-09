'use client';

import useSWR from 'swr';

import type { SummonHistoryResponse } from '@/types/summon';

const fetcher = async (url: string): Promise<SummonHistoryResponse> => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return res.json() as Promise<SummonHistoryResponse>;
};

export function useSummonHistory(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<SummonHistoryResponse>(
        enabled ? '/api/summon/history' : null,
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
            shouldRetryOnError: false,
        },
    );

    return {
        entries: data?.entries ?? [],
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
