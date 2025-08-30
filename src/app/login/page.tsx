// src/app/login/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {LoginButton} from "@/app/login/components/LoginButton";

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, loading, login } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) router.replace('/');
    }, [loading, isAuthenticated, router]);

    return (
        <main className="min-h-screen flex flex-col justify-center items-center gap-6">
            <h1 className="text-2xl font-bold">ログインしてください</h1>
            {loading ? <p>認証確認中...</p> : <LoginButton onLogin={login} />}
        </main>
    );
}
