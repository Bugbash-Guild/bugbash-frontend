'use client';

import { useState } from 'react';

import type { PurchaseResponse } from '@/types/shop';

type PurchaseError = {
    status: number;
    message: string;
};

export function usePurchase() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<PurchaseError | null>(null);

    function reset() {
        setError(null);
    }

    async function purchase(itemId: string): Promise<PurchaseResponse> {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ error: `${res.status}` }));
                const errMsg = (errBody as { error?: string }).error ?? `HTTP ${res.status}`;
                const err: PurchaseError = { status: res.status, message: errMsg };
                setError(err);
                throw err;
            }
            return (await res.json()) as PurchaseResponse;
        } finally {
            setLoading(false);
        }
    }

    return { purchase, loading, error, reset };
}
