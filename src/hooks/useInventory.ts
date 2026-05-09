'use client';

import useSWR from 'swr';
import type { ListInventoryResponse } from '@/types/inventory';

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return (await res.json()) as ListInventoryResponse;
};

export function useInventory(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<ListInventoryResponse>(
        enabled ? '/api/inventory' : null,
        fetcher,
    );

    return {
        items: data?.items ?? [],
        loading: isLoading,
        error: error ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
