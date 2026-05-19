import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveBackendPath } from './_proxyPath.ts';

describe('resolveBackendPath', () => {
    it('maps default API paths to the same backend API path', () => {
        assert.equal(resolveBackendPath(['shop', 'items']), '/api/shop/items');
        assert.equal(resolveBackendPath(['summon', 'pull10']), '/api/summon/pull10');
        assert.equal(resolveBackendPath(['inventory', 'item-1', 'use']), '/api/inventory/item-1/use');
    });

    it('keeps v1 backend aliases for existing frontend paths', () => {
        assert.equal(resolveBackendPath(['hero', 'stats']), '/api/v1/hero/stats');
        assert.equal(resolveBackendPath(['hero', 'activities']), '/api/v1/hero/activities');
        assert.equal(resolveBackendPath(['leaderboard']), '/api/v1/leaderboard');
        assert.equal(
            resolveBackendPath(['github', 'app', 'installation']),
            '/api/v1/github/app/installation',
        );
    });

    it('maps frontend-only aliases to their backend path', () => {
        assert.equal(resolveBackendPath(['monsters', 'all']), '/api/monsters');
    });
});
