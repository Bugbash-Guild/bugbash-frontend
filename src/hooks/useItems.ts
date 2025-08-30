// src/hooks/useItems.ts
'use client';

import useSWR from 'swr';
import type { Item } from '@/types/item';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useItems() {
    const { data, error, isLoading, mutate } =
        useSWR<{ items: Item[] }>('/api/items', fetcher, {
            refreshInterval: 0,
            revalidateOnFocus: true,
        });

    return {
        items: data?.items ?? [],
        loading: isLoading,
        error: error ? String(error) : null,
        refetch: () => mutate(),
    };
}
