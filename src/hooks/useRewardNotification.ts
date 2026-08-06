'use client';

import useSWR from 'swr';

import { fetchWithEarly } from '@/lib/earlyFetch';
import type { Activity, ActivitiesResponse } from '@/types/activity';

const UNREAD_KEY = '/api/hero/activities?unreadOnly=true&limit=50';

/**
 * マージは GitHub 側（外部）で起きるため、開きっぱなしの画面にも
 * 届く必要がある。以前はマウント時 1 回の fetch のみで、ホストが
 * 遷移をまたいで生存するシェルにいるため、セッション中のマージは
 * リロードするまで一切表示されなかった（コアループの儀式が本番で
 * 発火しない）。ポーリング + フォーカス時再検証で 1 分以内に届く。
 */
const REFRESH_INTERVAL_MS = 60_000;

const fetcher = async (url: string): Promise<Activity[]> => {
    const res = await fetchWithEarly(url);
    // 失敗は throw して SWR に「前回の正常値を保持」させる。[] を返すと
    // 一時的な 5xx でも成功扱いでキャッシュされ、開いているモーダルが
    // 未読のまま消えて次の成功ポーリングで再登場（二重の祝い）してしまう。
    if (!res.ok) throw new Error(`unread activities fetch failed: ${res.status}`);
    const data = (await res.json()) as ActivitiesResponse;
    return data.activities;
};

export function useRewardNotification(isAuthenticated: boolean) {
    const { data, mutate } = useSWR<Activity[]>(
        isAuthenticated ? UNREAD_KEY : null,
        fetcher,
        {
            refreshInterval: REFRESH_INTERVAL_MS,
            revalidateOnFocus: true,
        },
    );

    const unread = data ?? [];
    const checked = data !== undefined;

    const acknowledge = async () => {
        // 楽観クリア + 失敗時ロールバック（issue #127）。async mutate に
        // 包むことで POST 完了までキーがロックされ、途中に始まった
        // フォーカス再検証が古い未読を書き戻してモーダルを再表示する
        // 競合を防ぐ。
        try {
            await mutate(
                async () => {
                    const res = await fetch('/api/hero/acknowledge', { method: 'POST' });
                    if (!res.ok) throw new Error(`acknowledge failed: ${res.status}`);
                    return [];
                },
                { optimisticData: [], revalidate: false, rollbackOnError: true },
            );
        } catch {
            // ロールバック済み。未読は残っているので次の操作でまた開ける
        }
    };

    return { unread, checked, acknowledge };
}
