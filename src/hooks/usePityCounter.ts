'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { PityCounterResponse } from '@/types/summon';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string): Promise<PityCounterResponse> => {
    return fetchJson<PityCounterResponse>(url, { cache: 'no-store' }, 'summon/pity');
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
    useRedirectOnUnauthorized(error);

    return {
        pity: data ?? null,
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
