'use client';

import useSWR from 'swr';

interface User {
    username: string;
}

const fetcher = async (): Promise<User | null> => {
    const res = await fetch('/api/auth/status', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<User>;
};

export function useAuth() {
    const { data, isLoading } = useSWR<User | null>(
        '/api/auth/status',
        fetcher,
        { revalidateOnFocus: true, dedupingInterval: 2000 },
    );

    const login = () => {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
        window.location.href = `${base}/oauth2/authorization/github`;
    };

    const user = data ?? null;
    const isAuthenticated = user !== null;
    const loading = isLoading;

    return { isAuthenticated, user, loading, login };
}
