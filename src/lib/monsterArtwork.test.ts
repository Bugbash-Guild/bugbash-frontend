import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getMonsterArtwork } from './monsterArtwork.ts';

describe('monster artwork catalog', () => {
    it('resolves the adopted base monsters by display name', () => {
        assert.equal(getMonsterArtwork({ name: 'Branch Pup' })?.src, '/monsters/branch-pup.png');
        assert.equal(
            getMonsterArtwork({ name: 'Latency Polyp' })?.src,
            '/monsters/latency-polyp.png',
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
            '/monsters/latency-polyp.png',
        );
        assert.equal(
            getMonsterArtwork({ id: 'feature_flag_chameleon' })?.src,
            '/monsters/flag-gecko.png',
        );
    });

    it('selects the Null Pointer family artwork from form stage', () => {
        assert.equal(
            getMonsterArtwork({ name: 'Null Pointer Axolotl', formStage: 'BASE' })?.src,
            '/monsters/null-pointer-axolotl.png',
        );
        assert.equal(
            getMonsterArtwork({ name: 'Null Pointer Axolotl', formStage: 'EVO' })?.src,
            '/monsters/dereference-newt.png',
        );
        assert.equal(
            getMonsterArtwork({
                name: 'Null Pointer Axolotl',
                formStage: 'AWAKENED',
            })?.src,
            '/monsters/optional-guardian.png',
        );
        assert.equal(
            getMonsterArtwork({
                name: 'Null Pointer Axolotl',
                formStage: 'AWAKENED_FINAL',
            })?.src,
            '/monsters/safe-memory-oracle.png',
        );
        assert.equal(
            getMonsterArtwork({
                name: 'Null Pointer Axolotl',
                formStage: 'BERSERK',
            })?.src,
            '/monsters/void-leech-axolotl.png',
        );
        assert.equal(
            getMonsterArtwork({
                name: 'Null Pointer Axolotl',
                formStage: 'BERSERK_FINAL',
            })?.src,
            '/monsters/null-abyss-devourer.png',
        );
    });

    it('can derive Null Pointer artwork from legacy level and awakening state data', () => {
        assert.equal(
            getMonsterArtwork({ name: 'Null Pointer Axolotl', level: 29, awakeningState: 'NORMAL' })
                ?.src,
            '/monsters/null-pointer-axolotl.png',
        );
        assert.equal(
            getMonsterArtwork({ name: 'Null Pointer Axolotl', level: 30, awakeningState: 'NORMAL' })
                ?.src,
            '/monsters/dereference-newt.png',
        );
        assert.equal(
            getMonsterArtwork({
                name: 'Null Pointer Axolotl',
                level: 80,
                awakeningState: 'AWAKENED',
            })?.src,
            '/monsters/safe-memory-oracle.png',
        );
    });

    it('falls back when a monster has no adopted artwork yet', () => {
        assert.equal(getMonsterArtwork({ id: 'unknown-slime', name: 'Unknown Slime' }), null);
    });
});
