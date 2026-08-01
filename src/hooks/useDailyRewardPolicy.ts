'use client';

import useSWR from 'swr';

import { fetchMasterJson } from '@/lib/masterData';
import type { DailyRewardPolicyResponse } from '@/types/rewardPolicy';

const KEY = '/api/rewards/daily-policy';

/** ルールはリリースでしか変わらないので、遷移ごとに取り直さない。 */
const DEDUPING_INTERVAL_MS = 5 * 60 * 1000;

const fetcher = (url: string) =>
    fetchMasterJson<DailyRewardPolicyResponse>(url, 'rewards/daily-policy');

/**
 * 同日のPR本数による報酬減衰ルール。
 *
 * しきい値も割合もフロントに持たない（BE の開示APIから受け取る）。
 * 取得できないあいだは何も出さない＝仮の数字を置かない。
 */
export function useDailyRewardPolicy() {
    const { data, error, isLoading } = useSWR<DailyRewardPolicyResponse>(KEY, fetcher, {
        dedupingInterval: DEDUPING_INTERVAL_MS,
        revalidateOnFocus: false,
    });

    return {
        tiers: data?.tiers ?? [],
        loading: isLoading,
        error: error ? String(error) : null,
    };
}
