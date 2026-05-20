import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatGuildCoinCost,
    getSummonItemDisplay,
    NORMAL_SUMMON_COST,
    NORMAL_SUMMON_RATES,
    NORMAL_SUMMON_SUMMARY,
} from './summonDisplay.ts';

describe('summon display catalog', () => {
    it('matches the current normal summon costs used by the backend', () => {
        assert.deepEqual(NORMAL_SUMMON_COST, {
            single: 300,
            ten: 3000,
        });
        assert.equal(formatGuildCoinCost(NORMAL_SUMMON_COST.single), '300');
        assert.equal(formatGuildCoinCost(NORMAL_SUMMON_COST.ten), '3,000');
    });

    it('describes the current normal summon pool including soul packs', () => {
        assert.equal(NORMAL_SUMMON_SUMMARY, '魂パック・進化素材アイテムが排出されます');
        assert.deepEqual(NORMAL_SUMMON_RATES, [
            { label: 'N', percent: 57.9 },
            { label: 'R', percent: 26.3 },
            { label: 'SR', percent: 7.4 },
            { label: 'SSR', percent: 8.4 },
        ]);
    });

    it('knows all backend-seeded normal summon items', () => {
        assert.deepEqual(getSummonItemDisplay('soul-pack-s'), {
            name: '魂パック・小',
            emoji: '💠',
        });
        assert.deepEqual(getSummonItemDisplay('soul-pack-m'), {
            name: '魂パック・中',
            emoji: '💙',
        });
        assert.deepEqual(getSummonItemDisplay('soul-pack-l'), {
            name: '魂パック・大',
            emoji: '💜',
        });
        assert.deepEqual(getSummonItemDisplay('evolution-stone'), {
            name: '進化の輝石',
            emoji: '💎',
        });
        assert.deepEqual(getSummonItemDisplay('purification-proof'), {
            name: '浄化の証',
            emoji: '🌟',
        });
        assert.deepEqual(getSummonItemDisplay('abyss-proof'), {
            name: '深淵の証',
            emoji: '⭐',
        });
    });
});
