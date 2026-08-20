import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classifyAuthProbeResponse, normalizeAuthStatus } from './useAuthStatus.ts';

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

describe('classifyAuthProbeResponse', () => {
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
            headers: { 'content-type': 'application/json' },
            status,
        });

    it('reads a 2xx JSON body as a live answer', async () => {
        const result = await classifyAuthProbeResponse(
            json({ authenticated: true, username: 'octocat' }),
        );
        assert.deepEqual(result, {
            kind: 'status',
            status: { authenticated: true, username: 'octocat' },
        });
    });

    it('reads 401/403 as "the backend answered: unauthenticated"', async () => {
        for (const status of [401, 403]) {
            const result = await classifyAuthProbeResponse(new Response(null, { status }));
            assert.deepEqual(result, { kind: 'status', status: null }, `status ${status}`);
        }
    });

    it('reads 5xx as unreachable, never as logged-out', async () => {
        // 2026-08-15: 本番停止が「ログアウト」に化けて /login → 生エラーへ誘導した
        for (const status of [500, 502, 503, 504]) {
            const result = await classifyAuthProbeResponse(
                new Response('Server Error', { status }),
            );
            assert.deepEqual(result, { kind: 'unreachable' }, `status ${status}`);
        }
    });

    it('reads other non-2xx (e.g. 404 from a misroute) as unreachable', async () => {
        const result = await classifyAuthProbeResponse(new Response('not found', { status: 404 }));
        assert.deepEqual(result, { kind: 'unreachable' });
    });

    it('reads a 200 that is not JSON (intermediary error page) as unreachable', async () => {
        const result = await classifyAuthProbeResponse(
            new Response('<html>Service unavailable</html>', {
                headers: { 'content-type': 'text/html' },
                status: 200,
            }),
        );
        assert.deepEqual(result, { kind: 'unreachable' });
    });
});
