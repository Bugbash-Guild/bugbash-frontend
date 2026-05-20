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

export const fetchJson = async <T>(
    url: string,
    init?: RequestInit,
    context: string = url,
): Promise<T> => {
    const response = await fetch(url, init);
    if (!response.ok) throw await createApiError(response, context);
    return (await response.json()) as T;
};
