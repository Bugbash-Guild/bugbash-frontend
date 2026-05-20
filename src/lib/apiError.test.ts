import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createApiError, isUnauthorizedApiError } from './apiError.ts';

describe('createApiError', () => {
    it('normalizes 401 responses as unauthorized API errors', async () => {
        const error = await createApiError(
            new Response(JSON.stringify({ authenticated: false }), {
                status: 401,
                statusText: 'Unauthorized',
            }),
            'monsters/all',
        );

        assert.equal(isUnauthorizedApiError(error), true);
        assert.equal(error.message, 'ログイン期限が切れました。もう一度ログインしてください。');
    });

    it('keeps response details for non-authentication failures', async () => {
        const error = await createApiError(
            new Response('broken', {
                status: 500,
                statusText: 'Internal Server Error',
            }),
            'hero/stats',
        );

        assert.equal(isUnauthorizedApiError(error), false);
        assert.equal(error.message, 'hero/stats failed: 500 Internal Server Error: broken');
    });
});
