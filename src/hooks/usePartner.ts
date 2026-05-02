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
        await fetch('/api/hero/partner', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monsterId }),
        });
        await mutate();
    };

    return {
        partnerId: data?.monsterId ?? null,
        setPartner,
    };
}
