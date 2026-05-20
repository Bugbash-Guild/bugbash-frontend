// src/hooks/useHero.ts
'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { Hero } from '@/types/hero';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string) => {
    return fetchJson<Hero>(url, { cache: 'no-store' }, 'hero/stats');
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
    useRedirectOnUnauthorized(error);

    return {
        hero: data ?? null,
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
