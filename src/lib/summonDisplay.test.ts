import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    buildTenPullHonestyCopy,
    countSummonItemsSrOrAbove,
    formatDuplicateSoulText,
    getSummonItemDisplay,
    SUMMON_CURRENCY_SYMBOL,
} from './summonDisplay.ts';

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

    it('turns API-provided limited monster slugs into readable names', () => {
        assert.equal(getSummonItemDisplay('monster:seasonal-debugger').name, 'Seasonal Debugger');
    });
});

describe('summon currency symbols', () => {
    it('matches the topbar glyphs so the same currency never changes symbol per screen', () => {
        assert.equal(SUMMON_CURRENCY_SYMBOL.GUILD_COIN, '🪙');
        assert.equal(SUMMON_CURRENCY_SYMBOL.RUNE, '💎');
    });
});

describe('countSummonItemsSrOrAbove', () => {
    it('counts only SR and SSR from the server-returned results', () => {
        assert.equal(
            countSummonItemsSrOrAbove([
                { rarity: 'N' },
                { rarity: 'R' },
                { rarity: 'SR' },
                { rarity: 'SSR' },
                { rarity: 'SSR' },
            ]),
            3,
        );
    });

    it('returns zero when nothing is SR or above', () => {
        assert.equal(countSummonItemsSrOrAbove([{ rarity: 'N' }, { rarity: 'R' }]), 0);
        assert.equal(countSummonItemsSrOrAbove([]), 0);
    });
});

describe('buildTenPullHonestyCopy', () => {
    it('states the no-discount fact computed from disclosure values', () => {
        assert.equal(
            buildTenPullHonestyCopy({ singlePullCost: 30, tenPullCost: 300 }),
            '10連の割引はありません（300 = 30×10）',
        );
    });

    it('localizes large amounts', () => {
        assert.equal(
            buildTenPullHonestyCopy({ singlePullCost: 1000, tenPullCost: 10000 }),
            '10連の割引はありません（10,000 = 1,000×10）',
        );
    });

    it('says nothing while disclosure values are missing', () => {
        assert.equal(buildTenPullHonestyCopy(null), null);
        assert.equal(buildTenPullHonestyCopy({ singlePullCost: 30, tenPullCost: null }), null);
        assert.equal(buildTenPullHonestyCopy({ singlePullCost: 0, tenPullCost: 300 }), null);
    });

    it('says nothing when the 10-pull is not exactly ten singles (the copy would be false)', () => {
        assert.equal(buildTenPullHonestyCopy({ singlePullCost: 30, tenPullCost: 270 }), null);
        assert.equal(buildTenPullHonestyCopy({ singlePullCost: 30, tenPullCost: 330 }), null);
    });
});

describe('formatDuplicateSoulText', () => {
    it('names the attribute in Japanese with the exact amount from the server', () => {
        assert.equal(formatDuplicateSoulText(150, 'fire'), '+150 炎の魂');
        assert.equal(formatDuplicateSoulText(50, 'water'), '+50 水の魂');
        assert.equal(formatDuplicateSoulText(1000, 'dark'), '+1,000 闇の魂');
    });

    it('falls back honestly when the attribute is missing or unknown', () => {
        // 翻訳をでっち上げない: 未知スラッグはそのまま、属性なしは量だけ
        assert.equal(formatDuplicateSoulText(70, 'plasma'), '+70 plasmaの魂');
        assert.equal(formatDuplicateSoulText(70, null), '+70 魂');
        assert.equal(formatDuplicateSoulText(70), '+70 魂');
    });
});
