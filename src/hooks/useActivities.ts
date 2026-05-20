'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { ActivitiesResponse, Activity, MonsterDetail, PrMergedMetadata, XpDetail } from '@/types/activity';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string): Promise<Activity[]> => {
    const data = await fetchJson<ActivitiesResponse>(url, undefined, 'hero/activities');
    return data.activities;
};

export function useActivities() {
    const { data, error, isLoading, mutate } = useSWR<Activity[]>(
        '/api/hero/activities',
        fetcher,
        { revalidateOnFocus: true },
    );
    useRedirectOnUnauthorized(error);

    return {
        activities: data ?? [],
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error) : null,
        refetch: () => mutate(),
    };
}

export function isPrMergedMetadata(m: unknown): m is PrMergedMetadata {
    return typeof m === 'object' && m !== null && 'prNumber' in m;
}

export function isMonsterDetail(d: unknown): d is MonsterDetail {
    return typeof d === 'object' && d !== null && 'emoji' in d;
}

export function isXpDetail(d: unknown): d is XpDetail {
    return typeof d === 'object' && d !== null && 'levelBefore' in d;
}
