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
    // 失敗時は「未読なし」として静かに次のポーリングへ。報酬モーダルは
    // 祝い事の演出であり、取得エラーを画面に出す場所ではない。
    if (!res.ok) return [];
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
        // 楽観クリア + 失敗時ロールバック（fire-and-forget だと失敗時に
        // 通知がローカルから消えたままサーバ上は未読のまま残る — issue #127）
        const previous = unread;
        void mutate([], { revalidate: false });
        try {
            const res = await fetch('/api/hero/acknowledge', { method: 'POST' });
            if (!res.ok) void mutate(previous, { revalidate: false });
        } catch {
            void mutate(previous, { revalidate: false });
        }
    };

    return { unread, checked, acknowledge };
}
