'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { SummonHistoryResponse } from '@/types/summon';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string): Promise<SummonHistoryResponse> => {
    return fetchJson<SummonHistoryResponse>(url, { cache: 'no-store' }, 'summon/history');
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
    useRedirectOnUnauthorized(error);

    return {
        entries: data?.entries ?? [],
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
