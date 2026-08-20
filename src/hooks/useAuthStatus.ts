export interface User {
    githubId?: string;
    username: string;
}

/**
 * /api/auth/status の観測結果。「未ログイン」と「バックエンドに届かない」を
 * 区別する — 2026-08-15 の本番停止では、この区別が無いために停止が
 * 「ログアウトされた」ように見え、/login → OAuth → 生の Cloud Run
 * エラーページへ誘導してしまった。
 *
 * - status: バックエンドが意味のある応答を返した（生きている）。
 *   null は「未認証と答えた」（401/403）。
 * - unreachable: 停止・過負荷・誤設定。ログアウト扱いにしてはいけない
 *   （セッションは生きているかもしれない）。
 */
export type AuthProbeResult =
    | { kind: 'status'; status: AuthStatus | null }
    | { kind: 'unreachable' };

/**
 * 応答を AuthProbeResult に分類する。fetch 自体の失敗（ネットワーク断）は
 * 呼び出し側が catch して unreachable にすること。
 *
 * 401/403 だけを「未認証」と読む。それ以外の非 2xx（5xx・404 等）と
 * 「200 だが JSON でない」応答（中間層のエラーページ）は unreachable。
 */
export const classifyAuthProbeResponse = async (
    response: Response,
): Promise<AuthProbeResult> => {
    if (response.status === 401 || response.status === 403) {
        return { kind: 'status', status: null };
    }
    if (!response.ok) return { kind: 'unreachable' };
    try {
        return { kind: 'status', status: (await response.json()) as AuthStatus };
    } catch {
        return { kind: 'unreachable' };
    }
};

export interface AuthStatus {
    authenticated?: boolean;
    githubId?: unknown;
    username?: unknown;
}

export interface NormalizedAuthStatus {
    isAuthenticated: boolean;
    user: User | null;
}

export const normalizeAuthStatus = (status: AuthStatus | null): NormalizedAuthStatus => {
    if (status?.authenticated !== true || typeof status.username !== 'string') {
        return { isAuthenticated: false, user: null };
    }

    return {
        isAuthenticated: true,
        user: {
            username: status.username,
            ...(typeof status.githubId === 'string' ? { githubId: status.githubId } : {}),
        },
    };
};
