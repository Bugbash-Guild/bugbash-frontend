'use client';

import useSWR from 'swr';
import type { LeaderboardEntry } from '@/types/leaderboard';

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return (await res.json()) as LeaderboardEntry[];
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

    return {
        entries: data ?? [],
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
