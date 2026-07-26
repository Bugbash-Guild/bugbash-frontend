'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { mutate } from 'swr';

import { isUnauthorizedApiError } from '@/lib/apiError';

const AUTH_STATUS_KEY = '/api/auth/status';

export function useRedirectOnUnauthorized(error: unknown): void {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUnauthorizedApiError(error)) return;

        void mutate(AUTH_STATUS_KEY, { authenticated: false }, { revalidate: false });
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }, [error, pathname, router]);
}
