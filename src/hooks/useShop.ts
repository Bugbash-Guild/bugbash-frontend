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
        // 未取得を 0 に丸めない。0 に丸めると「残高が届いていないだけ」で
        // 全商品が買えない扱いになる（実際そう見えていた）。
        guildCoinBalance: data?.guildCoinBalance ?? null,
        runeBalance: data?.runeBalance ?? null,
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
