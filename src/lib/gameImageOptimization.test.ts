import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shouldUseUnoptimizedGameImage } from './gameImageOptimization';

describe('game image optimization policy', () => {
  it('uses unoptimized delivery for fixed small game icons', () => {
    assert.equal(shouldUseUnoptimizedGameImage({ src: 'https://assets.example.test/items/a.webp', sizes: '28px' }), true);
    assert.equal(shouldUseUnoptimizedGameImage({ src: 'https://assets.example.test/items/a.webp', sizes: '80px' }), true);
  });

  it('keeps Next image optimization for larger or responsive displays', () => {
    assert.equal(shouldUseUnoptimizedGameImage({ src: 'https://assets.example.test/items/a.webp', sizes: '160px' }), false);
    assert.equal(
      shouldUseUnoptimizedGameImage({
        src: 'https://assets.example.test/items/a.webp',
        sizes: '(max-width: 768px) 50vw, 240px',
      }),
      false,
    );
  });

  it('keeps Next image optimization for legacy local fallback assets', () => {
    assert.equal(shouldUseUnoptimizedGameImage({ src: '/monsters/branch-pup.png', sizes: '32px' }), false);
    assert.equal(shouldUseUnoptimizedGameImage({ src: '/monster-svgs/token-mimic.svg', sizes: '32px' }), false);
  });

  it('allows call sites to override the default policy', () => {
    assert.equal(
      shouldUseUnoptimizedGameImage({
        src: 'https://assets.example.test/items/a.webp',
        sizes: '28px',
        unoptimized: false,
      }),
      false,
    );
    assert.equal(shouldUseUnoptimizedGameImage({ src: '/monsters/branch-pup.png', sizes: '240px', unoptimized: true }), true);
  });
});
