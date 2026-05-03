'use client';

import { useEffect, useState } from 'react';

import type { Activity, ActivitiesResponse } from '@/types/activity';

export function useRewardNotification(isAuthenticated: boolean) {
    const [unread, setUnread] = useState<Activity[]>([]);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/hero/activities?unreadOnly=true&limit=50');
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
        setUnread([]);
        await fetch('/api/hero/acknowledge', { method: 'POST' });
    };

    return { unread, checked, acknowledge };
}
