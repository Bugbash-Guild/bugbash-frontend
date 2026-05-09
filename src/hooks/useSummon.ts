'use client';

import { useState } from 'react';

import type { SummonOnceResponse, SummonTenResponse } from '@/types/summon';

type SummonError = {
    status: number;
    message: string;
};

export function useSummon() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<SummonError | null>(null);

    function reset() {
        setError(null);
    }

    async function pullOnce(): Promise<SummonOnceResponse> {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/summon/pull', { method: 'POST' });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ error: `${res.status}` }));
                const errMsg = (errBody as { error?: string }).error ?? `HTTP ${res.status}`;
                const err: SummonError = { status: res.status, message: errMsg };
                setError(err);
                throw err;
            }
            return res.json() as Promise<SummonOnceResponse>;
        } finally {
            setLoading(false);
        }
    }

    async function pullTen(): Promise<SummonTenResponse> {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/summon/pull10', { method: 'POST' });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ error: `${res.status}` }));
                const errMsg = (errBody as { error?: string }).error ?? `HTTP ${res.status}`;
                const err: SummonError = { status: res.status, message: errMsg };
                setError(err);
                throw err;
            }
            return res.json() as Promise<SummonTenResponse>;
        } finally {
            setLoading(false);
        }
    }

    return { pullOnce, pullTen, loading, error, reset };
}
