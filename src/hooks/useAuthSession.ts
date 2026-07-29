/**
 * 「たぶんログイン済み」を同期的に知るための先読み層。
 *
 * なぜ必要か: AuthGate は判定中に children を返さないため、
 * `/api/auth/status` が解決するまでページ側の fetch が 1 本も始まらない。
 * 実測（BE +150ms）では auth/status が 323→556ms、残り 11 本が 604ms 開始と、
 * 往復 1 回分が丸ごと直列化していた。
 *
 * これはセキュリティ境界ではない（CLAUDE.md「各ページでログイン状態の確認は
 * 逐一行わない」）。実データは常に API 側の 401 で守られ、401 を踏んだ時点で
 * `useRedirectOnUnauthorized` が /login に送る。ここで先読みするのは
 * 「描画を始めてよいか」だけで、ユーザー情報は必ず実レスポンスから取る。
 *
 * 目印は Cookie 1 本に統一している（タブをまたいでも、リロードしても残る）。
 * 付けるのは 2 箇所:
 *   - BE の OAuth2SuccessHandler … OAuth 直後の初回着地を速くする
 *   - FE が authenticated:true を観測したとき … 既存セッションにも効かせる
 */
const SESSION_HINT_COOKIE = 'bb.authed';

/** セッションと厳密に一致させる必要はない。切れていれば観測時に消す。 */
const SESSION_HINT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const canUseCookies = (): boolean => typeof document !== 'undefined';

export const hasSessionHint = (): boolean => {
    if (!canUseCookies()) return false;

    return document.cookie
        .split(';')
        .some((entry) => entry.trim().startsWith(`${SESSION_HINT_COOKIE}=1`));
};

export const setSessionHint = (): void => {
    if (!canUseCookies()) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
        `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=${SESSION_HINT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

export const clearSessionHint = (): void => {
    if (!canUseCookies()) return;
    document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};
