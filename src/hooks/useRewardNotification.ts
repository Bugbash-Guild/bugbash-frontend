'use client';

import { useEffect, useState } from 'react';

import { fetchWithEarly } from '@/lib/earlyFetch';
import type { Activity, ActivitiesResponse } from '@/types/activity';

export function useRewardNotification(isAuthenticated: boolean) {
    const [unread, setUnread] = useState<Activity[]>([]);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchUnread = async () => {
            try {
                const res = await fetchWithEarly('/api/hero/activities?unreadOnly=true&limit=50');
                if (!res.ok) return;
                const data = (await res.json()) as ActivitiesResponse;
                if (data.activities.length > 0) {
                    setUnread(data.activities);
                }
            } finally {
                setChecked(true);
            }
        };

        void fetchUnread();
    }, [isAuthenticated]);

    const acknowledge = async () => {
        // 楽観クリア + 失敗時ロールバック（fire-and-forget だと失敗時に
        // 通知がローカルから消えたままサーバ上は未読のまま残る — issue #127）
        const previous = unread;
        setUnread([]);
        try {
            const res = await fetch('/api/hero/acknowledge', { method: 'POST' });
            if (!res.ok) setUnread(previous);
        } catch {
            setUnread(previous);
        }
    };

    return { unread, checked, acknowledge };
}
