'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

import { isUnauthorizedApiError } from '@/lib/apiError';

const AUTH_STATUS_KEY = '/api/auth/status';

export function useRedirectOnUnauthorized(error: unknown): void {
    const router = useRouter();

    useEffect(() => {
        if (!isUnauthorizedApiError(error)) return;

        void mutate(AUTH_STATUS_KEY, { authenticated: false }, { revalidate: false });
        router.replace('/login');
    }, [error, router]);
}
