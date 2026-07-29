'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { clearSessionHint, hasSessionHint, setSessionHint } from './useAuthSession';
import { normalizeAuthStatus, type AuthStatus } from './useAuthStatus';

export const AUTH_STATUS_KEY = '/api/auth/status';

const fetcher = async (url: string): Promise<AuthStatus | null> => {
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<AuthStatus>;
};

export function useAuth() {
    // Cookie は SSR 時に読めないため、初回レンダーでは false のまま置く。
    // レンダー中に document を触ると hydration mismatch になり、
    // 「サーバーはゲート / クライアントは本体」で React が警告を出す。
    // マウント直後に読み直すので、ネットワーク往復より十分速い。
    const [optimisticAuthenticated, setOptimisticAuthenticated] = useState(false);

    useEffect(() => {
        if (hasSessionHint()) setOptimisticAuthenticated(true);
    }, []);

    // フォーカス再検証の間隔は SWRProvider の既定（30 秒）に従う。
    const { data } = useSWR<AuthStatus | null>(AUTH_STATUS_KEY, fetcher, {
        dedupingInterval: 2000,
        revalidateOnFocus: true,
    });

    // 実レスポンスが届くまで data は undefined。
    const isResolved = data !== undefined;
    const resolved = normalizeAuthStatus(data ?? null);

    // 観測した結果を目印に反映する。未認証なら消すので、ログアウトや
    // セッション失効のあとに楽観描画が残り続けることはない。
    useEffect(() => {
        if (!isResolved) return;

        if (resolved.isAuthenticated) {
            setSessionHint();
            setOptimisticAuthenticated(true);
        } else {
            clearSessionHint();
            setOptimisticAuthenticated(false);
        }
    }, [isResolved, resolved.isAuthenticated]);

    const login = () => {
        // 相対パスにすることで Next.js rewrite 経由になり、
        // セッションクッキーがフロントエンドドメインに設定される
        clearSessionHint();
        window.location.href = '/oauth2/authorization/github';
    };

    return {
        // 未解決の間は先読みを信じる。誤っていても API は 401 を返すため、
        // 表示が一瞬進むだけで /login へ送られる。
        isAuthenticated: isResolved ? resolved.isAuthenticated : optimisticAuthenticated,
        // ユーザー情報は先読みしない（目印には username が無い）。
        user: resolved.user,
        loading: !isResolved && !optimisticAuthenticated,
        /**
         * `isAuthenticated` が実レスポンス由来かどうか。
         * 「認証済みなら別ページへ送る」側（/login）は先読みで動くと
         * 往復が生まれるため、確定を待つのにこれを使う。
         */
        isAuthResolved: isResolved,
        login,
    };
}
