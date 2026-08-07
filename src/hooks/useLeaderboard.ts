'use client';

import useSWR from 'swr';

import { asArray, fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import { parseLeaderboardMe } from '@/lib/leaderboardMe';
import type { LeaderboardEntry, LeaderboardMe } from '@/types/leaderboard';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string) => {
    return fetchJson<LeaderboardEntry[]>(url, { cache: 'no-store' }, 'leaderboard');
};

const meFetcher = async (url: string): Promise<LeaderboardMe | null> => {
    // 契約外の形はここで null に畳む（行を出さないだけで一覧は生かす）
    return parseLeaderboardMe(await fetchJson<unknown>(url, { cache: 'no-store' }, 'leaderboard/me'));
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
        entries: asArray(data),
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}

/**
 * 自分の順位（GET /api/leaderboard/me）。
 *
 * 404（Hero 不在）・BE 未デプロイ・一時失敗はすべて `me: null` に畳む。
 * この行は一覧への「追記」なので、取れないときに一覧側へエラーを
 * 波及させない（エラー表示は一覧の取得側だけが持つ）。
 * 401 だけは他のフックと同じくログインへ送る。
 */
export function useLeaderboardMe(enabled: boolean) {
    const { data, error } = useSWR<LeaderboardMe | null>(
        enabled ? '/api/leaderboard/me' : null,
        meFetcher,
        {
            // 一覧と同じ周期で順位を追従させる
            refreshInterval: 60_000,
            revalidateOnFocus: true,
            shouldRetryOnError: false,
        }
    );
    useRedirectOnUnauthorized(error);

    return {
        me: error ? null : (data ?? null),
    };
}
