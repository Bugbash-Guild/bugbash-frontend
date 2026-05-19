import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createProxyResponse } from './_proxyCore.ts';

describe('createProxyResponse', () => {
    it('converts backend login redirects into an unauthenticated JSON response', async () => {
        const backendResponse = new Response('', {
            status: 302,
            headers: {
                location: 'https://app.bugbashguild.com/login',
            },
        });

        const response = await createProxyResponse(backendResponse);

        assert.equal(response.status, 401);
        assert.equal(response.headers.get('content-type'), 'application/json');
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
