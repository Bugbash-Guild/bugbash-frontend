import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { shouldUseUnoptimizedGameImage } from './gameImageOptimization';

const ASSET_HOST = 'https://assets.example.test';

afterEach(() => {
    delete process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
});

describe('game image optimization policy', () => {
    it('optimizes small icons from the configured asset host', () => {
        // ここが本題。R2 は 1254x1254 の webp しか持たないので、素で配ると
        // 28px のアイコン 1 個で 100KB 超を落とすことになる。
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        for (const sizes of ['28px', '32px', '48px', '80px']) {
            assert.equal(
                shouldUseUnoptimizedGameImage({ src: `${ASSET_HOST}/items/a.webp`, sizes }),
                false,
                `sizes=${sizes} should go through the optimizer`,
            );
        }
    });

    it('optimizes larger and responsive displays from the asset host', () => {
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: `${ASSET_HOST}/items/a.webp`, sizes: '160px' }),
            false,
        );
        assert.equal(
            shouldUseUnoptimizedGameImage({
                src: `${ASSET_HOST}/items/a.webp`,
                sizes: '(max-width: 768px) 50vw, 240px',
            }),
            false,
        );
    });

    it('skips the optimizer for remote hosts that remotePatterns does not cover', () => {
        // 最適化器に回すと 400 になり画像が出ない。素で配る方がまだ映る。
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: 'https://other.example.test/a.webp', sizes: '32px' }),
            true,
        );
    });

    it('skips the optimizer for every remote host when no asset host is configured', () => {
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: `${ASSET_HOST}/items/a.webp`, sizes: '32px' }),
            true,
        );
    });

    it('skips the optimizer for SVG, which next/image rejects with 400', () => {
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: '/monster-svgs/token-mimic.svg', sizes: '32px' }),
            true,
        );
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: `${ASSET_HOST}/a.svg`, sizes: '32px' }),
            true,
        );
    });

    it('optimizes same-origin local assets', () => {
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: '/monsters/branch-pup.png', sizes: '32px' }),
            false,
        );
    });

    it('lets call sites override the default policy', () => {
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        assert.equal(
            shouldUseUnoptimizedGameImage({
                src: `${ASSET_HOST}/items/a.webp`,
                sizes: '28px',
                unoptimized: true,
            }),
            true,
        );
        assert.equal(
            shouldUseUnoptimizedGameImage({
                src: '/monsters/branch-pup.png',
                sizes: '240px',
                unoptimized: true,
            }),
            true,
        );
        assert.equal(
            shouldUseUnoptimizedGameImage({ src: '/a.svg', sizes: '28px', unoptimized: false }),
            false,
        );
    });

    it('handles a missing or malformed src without throwing', () => {
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL = ASSET_HOST;
        assert.equal(shouldUseUnoptimizedGameImage({ sizes: '32px' }), false);
        assert.equal(shouldUseUnoptimizedGameImage({ src: 'http://', sizes: '32px' }), true);
    });
});
