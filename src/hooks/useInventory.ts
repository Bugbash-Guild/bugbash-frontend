'use client';

import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { ListInventoryResponse } from '@/types/inventory';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

const fetcher = async (url: string) => {
    return fetchJson<ListInventoryResponse>(url, { cache: 'no-store' }, 'inventory');
};

export function useInventory(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR<ListInventoryResponse>(
        enabled ? '/api/inventory' : null,
        fetcher,
    );
    useRedirectOnUnauthorized(error);

    return {
        items: data?.items ?? [],
        loading: isLoading,
        error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
        refetch: () => mutate(),
    };
}
