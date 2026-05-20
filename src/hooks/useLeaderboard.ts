'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { LeaderboardEntry } from '@/types/leaderboard';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string) => {
    return fetchJson<LeaderboardEntry[]>(url, { cache: 'no-store' }, 'leaderboard');
};

export function useLeaderboard(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<LeaderboardEntry[]>(
        enabled ? '/api/leaderboard' : null,
        fetcher,
        {
            refreshInterval: 60_000,
            revalidateOnFocus: true,
        }
    );
    useRedirectOnUnauthorized(error);

    return {
        entries: data ?? [],
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
