import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSummonItemDisplay } from './summonDisplay.ts';

describe('summon display catalog', () => {
    it('knows all backend-seeded normal summon items', () => {
        assert.deepEqual(getSummonItemDisplay('soul-pack-s'), {
            name: '魂パック・小',
        });
        assert.deepEqual(getSummonItemDisplay('soul-pack-m'), {
            name: '魂パック・中',
        });
        assert.deepEqual(getSummonItemDisplay('soul-pack-l'), {
            name: '魂パック・大',
        });
        assert.deepEqual(getSummonItemDisplay('evolution-stone'), {
            name: '進化の輝石',
        });
        assert.deepEqual(getSummonItemDisplay('purification-proof'), {
            name: '浄化の証',
        });
        assert.deepEqual(getSummonItemDisplay('abyss-proof'), {
            name: '深淵の証',
        });
    });

    it('keeps API-provided item asset URLs with the display metadata', () => {
        assert.deepEqual(
            getSummonItemDisplay(
                'evolution-stone',
                'https://assets.example.test/items/evolution-stone.webp',
            ),
            {
                name: '進化の輝石',
                assetUrl: 'https://assets.example.test/items/evolution-stone.webp',
            },
        );
    });
});
