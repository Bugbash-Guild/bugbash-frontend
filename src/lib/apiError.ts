const UNAUTHORIZED_MESSAGE = 'ログイン期限が切れました。もう一度ログインしてください。';

export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class UnauthorizedApiError extends ApiError {
    constructor() {
        super(UNAUTHORIZED_MESSAGE, 401);
        this.name = 'UnauthorizedApiError';
    }
}

export const isUnauthorizedApiError = (error: unknown): error is UnauthorizedApiError =>
    error instanceof UnauthorizedApiError ||
    (error instanceof ApiError && error.status === 401);

export const createApiError = async (response: Response, context: string): Promise<ApiError> => {
    if (response.status === 401) return new UnauthorizedApiError();

    const body = await response.text();
    const detail = body ? `: ${body}` : '';
    return new ApiError(
        `${context} failed: ${response.status} ${response.statusText}${detail}`,
        response.status,
    );
};

/**
 * 配列を期待している応答が配列でなかったら空配列として扱う。
 *
 * 一覧系APIは配列を返す契約だが、契約外の応答（オブジェクト・null）が来ると
 * 呼び出し側の `.map` が throw し、**ページが丸ごと白画面になる**。
 * 実際に /monsters と /leaderboard がこれで落ちた。
 * 型注釈は「そう来るはず」の宣言であって保証ではないので、境界で受け止める。
 */
export const asArray = <T>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

export const fetchJson = async <T>(
    url: string,
    init?: RequestInit,
    context: string = url,
): Promise<T> => {
    const response = await fetch(url, init);
    if (!response.ok) throw await createApiError(response, context);
    return (await response.json()) as T;
};
