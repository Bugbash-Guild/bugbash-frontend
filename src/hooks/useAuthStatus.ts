export interface User {
    username: string;
}

export interface AuthStatus {
    authenticated?: boolean;
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
        user: { username: status.username },
    };
};
