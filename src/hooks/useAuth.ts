'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { fetchWithEarly } from '@/lib/earlyFetch';

import { clearSessionHint, hasSessionHint, setSessionHint } from './useAuthSession';
import {
    classifyAuthProbeResponse,
    normalizeAuthStatus,
    type AuthProbeResult,
} from './useAuthStatus';

export const AUTH_STATUS_KEY = '/api/auth/status';

/** バックエンド停止時の自動再接続間隔。 */
const BACKEND_DOWN_RETRY_MS = 30_000;

/*
 * 「未ログイン」と「バックエンドに届かない」を区別して返す。
 * 以前は非 2xx を一律 null（＝未ログイン）に丸めていたため、本番停止が
 * ログアウトに見え、/login → OAuth → 生の Cloud Run エラーページへ
 * 誘導していた（2026-08-15 の停止で実際に起きた導線）。
 */
const fetcher = async (url: string): Promise<AuthProbeResult> => {
    try {
        const res = await fetchWithEarly(url, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });
        return await classifyAuthProbeResponse(res);
    } catch {
        // fetch 自体の失敗（DNS・接続拒否・ネットワーク断）
        return { kind: 'unreachable' };
    }
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
    const { data } = useSWR<AuthProbeResult>(AUTH_STATUS_KEY, fetcher, {
        dedupingInterval: 2000,
        revalidateOnFocus: true,
        // 停止中だけ自動で再接続を試みる（復旧したら画面が自力で戻る）
        refreshInterval: (latest) =>
            latest?.kind === 'unreachable' ? BACKEND_DOWN_RETRY_MS : 0,
    });

    // バックエンドに届かない。未ログインではないので、目印も楽観描画も触らない
    // （セッションは生きているかもしれない — 復旧すればそのまま続きから使える）。
    const backendDown = data?.kind === 'unreachable';
    // 実レスポンスが届くまで data は undefined。unreachable は「確定」に数えない。
    const isResolved = data !== undefined && data.kind === 'status';
    const resolved = normalizeAuthStatus(isResolved ? data.status : null);

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

    const logout = async () => {
        clearSessionHint();
        try {
            // rewrite 経由でバックエンドの /logout（Spring Security）に届く。
            // サーバ側でセッション破棄と bb.authed の削除まで行われる。
            // 成功時の 302 は追わず、こちらでフル遷移する（SWR キャッシュに
            // 残った本人データをクライアント側に持ち越さないため）。
            // 前提: バックエンドの CSRF は無効（SecurityConfig）。有効化する
            // 場合はこの POST にトークンを載せる改修が必要になる。
            await fetch('/logout', { method: 'POST', redirect: 'manual' });
        } catch {
            // ネットワーク断でもローカルの目印は消えているので /login に送る。
            // セッション自体はサーバ側の期限で失効する。
        }
        window.location.href = '/login';
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
        /**
         * バックエンドに届かない（停止・過負荷・誤設定）。未ログインとは別物。
         * true の間、AuthGate は /login へ送らず接続エラー画面を出し、
         * /login はログインボタンを止める（押しても中間層の生エラーに落ちるだけ）。
         */
        backendDown,
        login,
        logout,
    };
}
