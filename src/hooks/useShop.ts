'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { ListShopResponse } from '@/types/shop';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string) => {
    return fetchJson<ListShopResponse>(url, { cache: 'no-store' }, 'shop/items');
};

export function useShop(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<ListShopResponse>(
        enabled ? '/api/shop/items' : null,
        fetcher,
    );
    useRedirectOnUnauthorized(error);

    return {
        items: data?.items ?? [],
        guildCoinBalance: data?.guildCoinBalance ?? 0,
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
