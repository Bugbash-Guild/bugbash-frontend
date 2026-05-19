import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';

import { proxyRequest } from './_proxy.ts';
import { createProxyResponse } from './_proxyCore.ts';

describe('createProxyResponse', () => {
    it('converts backend login redirects into an unauthenticated JSON response', async () => {
        const backendResponse = new Response('', {
            status: 302,
            headers: {
                location: 'https://app.bugbashguild.com/login',
                'set-cookie': 'JSESSIONID=expired; Path=/; Max-Age=0; Secure; HttpOnly',
            },
        });

        const response = await createProxyResponse(backendResponse);

        assert.equal(response.status, 401);
        assert.equal(response.headers.get('content-type'), 'application/json');
        assert.equal(
            response.headers.get('set-cookie'),
            'JSESSIONID=expired; Path=/; Max-Age=0; Secure; HttpOnly',
        );
        assert.deepEqual(await response.json(), { authenticated: false });
    });

    it('forwards set-cookie from the backend response', async () => {
        const backendResponse = new Response(JSON.stringify({ authenticated: true }), {
            status: 200,
            headers: {
                'content-type': 'application/json',
                'set-cookie': 'JSESSIONID=abc; Path=/; Secure; HttpOnly',
            },
        });

        const response = await createProxyResponse(backendResponse);

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get('set-cookie'),
            'JSESSIONID=abc; Path=/; Secure; HttpOnly',
        );
        assert.deepEqual(await response.json(), { authenticated: true });
    });
});

describe('proxyRequest', () => {
    it('does not forward an empty request body for body-less POST requests', async () => {
        const originalFetch = globalThis.fetch;
        const originalBackendOrigin = process.env.BACKEND_ORIGIN;
        let forwardedRequest: { input: RequestInfo | URL; init?: RequestInit } | undefined;

        globalThis.fetch = (async (input, init) => {
            forwardedRequest = { input, init };
            return new Response('{}', {
                headers: { 'content-type': 'application/json' },
            });
        }) as typeof fetch;
        process.env.BACKEND_ORIGIN = 'https://backend.example.com';

        try {
            const req = new NextRequest('https://app.bugbashguild.com/api/summon/pull', {
                method: 'POST',
            });

            await proxyRequest(req, '/api/summon/pull', 'POST', '');

            assert.equal(forwardedRequest?.init?.body, undefined);
            assert.equal(
                new Headers(forwardedRequest?.init?.headers).get('content-type'),
                null,
            );
        } finally {
            globalThis.fetch = originalFetch;
            if (originalBackendOrigin === undefined) {
                delete process.env.BACKEND_ORIGIN;
            } else {
                process.env.BACKEND_ORIGIN = originalBackendOrigin;
            }
        }
    });
});
