import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getMonsterArtwork } from './monsterArtwork.ts';

describe('monster artwork catalog', () => {
    it('resolves the adopted base monsters by display name', () => {
        assert.equal(getMonsterArtwork({ name: 'Branch Pup' })?.src, '/monsters/branch-pup.png');
        assert.equal(
            getMonsterArtwork({ name: 'Timeout Jelly' })?.src,
            '/monsters/timeout-jelly.png',
        );
        assert.equal(getMonsterArtwork({ name: 'Flag Gecko' })?.src, '/monsters/flag-gecko.png');
    });

    it('resolves likely backend aliases for the same monster families', () => {
        assert.equal(
            getMonsterArtwork({ id: 'git-branch-kitsune' })?.src,
            '/monsters/branch-pup.png',
        );
        assert.equal(
            getMonsterArtwork({ name: 'Timeout Jellyfish' })?.src,
            '/monsters/timeout-jelly.png',
        );
        assert.equal(
            getMonsterArtwork({ id: 'feature_flag_chameleon' })?.src,
            '/monsters/flag-gecko.png',
        );
    });

    it('falls back when a monster has no adopted artwork yet', () => {
        assert.equal(getMonsterArtwork({ id: 'unknown-slime', name: 'Unknown Slime' }), null);
    });
});
