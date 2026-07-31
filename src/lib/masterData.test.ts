import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isMasterDataUrl } from './masterData.ts';

describe('isMasterDataUrl', () => {
    it('accepts the master-data endpoints the backend marks cacheable', () => {
        for (const url of [
            '/api/badges/catalog',
            '/api/billing/rune-products',
            '/api/forge/level-defs',
            '/api/monsters',
            '/api/monsters/all',
            '/api/skins',
            '/api/summon/disclosure',
            '/api/summon/limited/disclosure',
        ]) {
            assert.equal(isMasterDataUrl(url), true, `should be master data: ${url}`);
        }
    });

    it('ignores the query string', () => {
        assert.equal(isMasterDataUrl('/api/forge/level-defs?track=BADGE'), true);
        assert.equal(isMasterDataUrl('/api/forge/level-defs?track=MONSTER'), true);
    });

    it('rejects hero-specific endpoints that share a prefix with a master one', () => {
        // これが前方一致だと /api/skins/owned までキャッシュ対象になり、
        // 装備を変えても最大5分間反映されない。
        assert.equal(isMasterDataUrl('/api/skins/owned'), false);
        assert.equal(isMasterDataUrl('/api/skins/equipped/slime'), false);
        assert.equal(isMasterDataUrl('/api/monsters/owned'), false);
    });

    it('rejects unrelated hero-specific endpoints', () => {
        for (const url of [
            '/api/auth/status',
            '/api/billing/wallet',
            '/api/heroes/me/badges/progress',
            '/api/heroes/me/commemorative-mints',
            '/api/inventory',
            '/api/v1/hero/stats',
        ]) {
            assert.equal(isMasterDataUrl(url), false, `should not be master data: ${url}`);
        }
    });
});
