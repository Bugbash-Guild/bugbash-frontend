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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/status`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          isAuthenticated: true,
          user: userData,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth2/authorization/github`;
  };

  return {
    ...authState,
    login,
    checkAuthStatus,
  };
}