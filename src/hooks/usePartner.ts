// src/hooks/usePartner.ts
'use client';

import useSWR from 'swr';

type PartnerResponse = { monsterId: string | null };

const fetcher = async (url: string): Promise<PartnerResponse> => {
    const res = await fetch(url);
    if (!res.ok) return { monsterId: null };
    return res.json() as Promise<PartnerResponse>;
};

export function usePartner() {
    const { data, mutate } = useSWR<PartnerResponse>('/api/hero/partner', fetcher, {
        revalidateOnFocus: true,
    });

    const setPartner = async (monsterId: string): Promise<void> => {
        const res = await fetch('/api/hero/partner', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monsterId }),
        });
        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? `パートナー設定に失敗しました (HTTP ${res.status})`);
        }
        await mutate();
    };

    return {
        partnerId: data?.monsterId ?? null,
        setPartner,
    };
}
