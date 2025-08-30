// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';

interface User {
  username: string;
}
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const checkAuthStatus = async () => {
    try {
      // ← ここは Next の BFF（同一オリジン）
      const response = await fetch('/api/auth/status', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({ isAuthenticated: true, user: userData, loading: false });
      } else {
        setAuthState({ isAuthenticated: false, user: null, loading: false });
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthState({ isAuthenticated: false, user: null, loading: false });
    }
  };

  useEffect(() => { checkAuthStatus(); }, []);

  const login = () => {
    // ログイン開始は “ブラウザ遷移” なので直接バックエンドへ
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
    window.location.href = `${base}/oauth2/authorization/github`;
  };

  return { ...authState, login, checkAuthStatus };
}
