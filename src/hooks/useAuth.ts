'use client';

import useSWR from 'swr';

import { normalizeAuthStatus, type AuthStatus } from './useAuthStatus';

const fetcher = async (url: string): Promise<AuthStatus | null> => {
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<AuthStatus>;
};

export function useAuth() {
    const { data, isLoading } = useSWR<AuthStatus | null>(
        '/api/auth/status',
        fetcher,
        { revalidateOnFocus: true, dedupingInterval: 2000 },
    );
    const authStatus = normalizeAuthStatus(data ?? null);

    const login = () => {
        // 相対パスにすることで Next.js rewrite 経由になり、
        // セッションクッキーがフロントエンドドメインに設定される
        window.location.href = '/oauth2/authorization/github';
    };

    return {
        isAuthenticated: authStatus.isAuthenticated,
        user: authStatus.user,
        loading: isLoading,
        login,
    };
}
