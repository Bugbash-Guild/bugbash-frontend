'use client';

import useSWR from 'swr';
import type { ListShopResponse } from '@/types/shop';

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return (await res.json()) as ListShopResponse;
};

export function useShop(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<ListShopResponse>(
        enabled ? '/api/shop/items' : null,
        fetcher,
    );

    return {
        items: data?.items ?? [],
        guildCoinBalance: data?.guildCoinBalance ?? 0,
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
