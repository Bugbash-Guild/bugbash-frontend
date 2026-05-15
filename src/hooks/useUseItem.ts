'use client';

import { useState } from 'react';

import type { UseItemResponse } from '@/types/inventory';

type UseItemError = {
    status: number;
    message: string;
};

export function useUseItem() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<UseItemError | null>(null);

    function reset() {
        setError(null);
    }

    async function consume(itemId: string): Promise<UseItemResponse> {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/inventory/${itemId}/use`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ error: `${res.status}` }));
                const errMsg = (errBody as { error?: string }).error ?? `HTTP ${res.status}`;
                const err: UseItemError = { status: res.status, message: errMsg };
                setError(err);
                throw err;
            }
            return (await res.json()) as UseItemResponse;
        } finally {
            setLoading(false);
        }
    }

    return { consume, loading, error, reset };
}
