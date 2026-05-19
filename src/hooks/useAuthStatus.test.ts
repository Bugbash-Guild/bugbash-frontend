import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeAuthStatus } from './useAuthStatus.ts';

describe('normalizeAuthStatus', () => {
    it('treats authenticated=false as unauthenticated', () => {
        assert.deepEqual(normalizeAuthStatus({ authenticated: false }), {
            isAuthenticated: false,
            user: null,
        });
    });

    it('treats authenticated=true with username as authenticated', () => {
        assert.deepEqual(
            normalizeAuthStatus({ authenticated: true, username: 'octocat' }),
            {
                isAuthenticated: true,
                user: { username: 'octocat' },
            },
        );
    });

    it('treats malformed responses as unauthenticated', () => {
        assert.deepEqual(normalizeAuthStatus({ username: 'octocat' }), {
            isAuthenticated: false,
            user: null,
        });
    });
});
