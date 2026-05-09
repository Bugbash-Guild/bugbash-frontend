'use client';

import useSWR from 'swr';

import type { SummonHistoryResponse } from '@/types/summon';

const fetcher = async (url: string): Promise<SummonHistoryResponse> => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status}: ${txt}`);
    }
    return res.json() as Promise<SummonHistoryResponse>;
};

export function useSummonHistory(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<SummonHistoryResponse>(
        enabled ? '/api/summon/history' : null,
        fetcher,
    );

    return {
        entries: data?.entries ?? [],
        loading: isLoading,
        error: error ? String((error as Error).message ?? error) : null,
        refetch: () => mutate(),
    };
}
