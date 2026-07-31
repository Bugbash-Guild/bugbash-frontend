import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
    COMMON_AUTHED_URLS,
    DYNAMIC_ROUTE_URLS,
    EARLY_FETCH_SCRIPT,
    fetchWithEarly,
    ROUTE_URLS,
    takeEarlyResponse,
} from './earlyFetch.ts';

type MutableGlobal = {
    window?: unknown;
    fetch?: unknown;
};

const g = globalThis as MutableGlobal;

afterEach(() => {
    delete g.window;
    delete g.fetch;
});

describe('takeEarlyResponse', () => {
    it('returns null during SSR (no window)', () => {
        assert.equal(takeEarlyResponse('/api/auth/status'), null);
    });

    it('returns null when the store has no entry', () => {
        g.window = { __bbEarly: {} };
        assert.equal(takeEarlyResponse('/api/auth/status'), null);
    });

    it('hands the promise over exactly once (Response body is single-use)', () => {
        const promise = Promise.resolve('early' as unknown as Response);
        g.window = { __bbEarly: { '/api/auth/status': promise } };

        assert.equal(takeEarlyResponse('/api/auth/status'), promise);
        assert.equal(takeEarlyResponse('/api/auth/status'), null);
        // catch しておかないと未処理拒否になる（この promise は resolve 済みだが作法として）
        void promise.catch(() => undefined);
    });
});

describe('fetchWithEarly', () => {
    it('uses the early response when present', async () => {
        const early = { ok: true, marker: 'early' } as unknown as Response;
        g.window = { __bbEarly: { '/api/hero/stats': Promise.resolve(early) } };
        g.fetch = () => {
            throw new Error('should not fall back');
        };

        const res = await fetchWithEarly('/api/hero/stats');
        assert.equal(res, early);
    });

    it('falls back to a fresh fetch when the early one rejected', async () => {
        const fresh = { ok: true, marker: 'fresh' } as unknown as Response;
        g.window = {
            __bbEarly: { '/api/hero/stats': Promise.reject(new Error('network down')) },
        };
        g.fetch = () => Promise.resolve(fresh);

        const res = await fetchWithEarly('/api/hero/stats');
        assert.equal(res, fresh);
    });

    it('falls back to a fresh fetch when nothing was primed', async () => {
        const fresh = { ok: true, marker: 'fresh' } as unknown as Response;
        g.window = {};
        g.fetch = (url: string) => {
            assert.equal(url, '/api/inventory');
            return Promise.resolve(fresh);
        };

        const res = await fetchWithEarly('/api/inventory');
        assert.equal(res, fresh);
    });
});

describe('EARLY_FETCH_SCRIPT', () => {
    it('always primes auth/status but gates everything else behind the hint cookie', () => {
        const authIndex = EARLY_FETCH_SCRIPT.indexOf('/api/auth/status');
        const gateIndex = EARLY_FETCH_SCRIPT.indexOf('bb.authed=1');
        assert.ok(authIndex >= 0, 'auth/status must be primed');
        assert.ok(gateIndex >= 0, 'hint gate must exist');
        assert.ok(authIndex < gateIndex, 'auth/status must fire before the gate check');
    });

    it('contains every URL the route tables promise (typo guard)', () => {
        for (const url of COMMON_AUTHED_URLS) {
            assert.ok(EARLY_FETCH_SCRIPT.includes(url), `missing common URL: ${url}`);
        }
        for (const urls of Object.values(ROUTE_URLS)) {
            for (const url of urls) {
                assert.ok(EARLY_FETCH_SCRIPT.includes(url), `missing route URL: ${url}`);
            }
        }
        for (const { prefix, urls } of DYNAMIC_ROUTE_URLS) {
            assert.ok(EARLY_FETCH_SCRIPT.includes(prefix), `missing prefix: ${prefix}`);
            for (const url of urls) {
                assert.ok(EARLY_FETCH_SCRIPT.includes(url), `missing dynamic URL: ${url}`);
            }
        }
    });

    it('does not send cache:no-store, so backend Cache-Control can be honoured', () => {
        // マスタデータに付けた Cache-Control を先読み側で潰さないための回帰ガード
        assert.ok(!EARLY_FETCH_SCRIPT.includes('no-store'));
    });

    it('normalises a trailing slash so /monsters/ still primes the dex', () => {
        assert.ok(EARLY_FETCH_SCRIPT.includes('replace('), 'pathname must be normalised');
    });

    it('stays defensive: wrapped in try/catch and never references document before the guard', () => {
        assert.ok(EARLY_FETCH_SCRIPT.startsWith('(function(){try{'));
        assert.ok(EARLY_FETCH_SCRIPT.trimEnd().endsWith('catch(e){}})();'));
    });
});
