export type MonsterArtwork = {
    src: string;
    alt: string;
};

type MonsterArtworkEntry = MonsterArtwork & {
    aliases: string[];
};

const MONSTER_ARTWORK: MonsterArtworkEntry[] = [
    {
        src: '/monsters/branch-pup.png',
        alt: 'Branch Pup',
        aliases: ['branch pup', 'git branch kitsune', 'branch pup base', 'git branch kitsune base'],
    },
    {
        src: '/monsters/latency-polyp.png',
        alt: 'Latency Polyp',
        aliases: ['timeout jelly', 'timeout jellyfish', 'latency polyp', 'timeout jelly base'],
    },
    {
        src: '/monsters/flag-gecko.png',
        alt: 'Flag Gecko',
        aliases: [
            'flag gecko',
            'feature flag chameleon',
            'feature flag gecko',
            'flag gecko base',
        ],
    },
];

function normalizeMonsterKey(value: string): string {
    return value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

const MONSTER_ARTWORK_BY_KEY = new Map<string, MonsterArtwork>();

for (const artwork of MONSTER_ARTWORK) {
    const keys = [artwork.alt, ...artwork.aliases];
    for (const key of keys) {
        MONSTER_ARTWORK_BY_KEY.set(normalizeMonsterKey(key), {
            src: artwork.src,
            alt: artwork.alt,
        });
    }
}

export function getMonsterArtwork({
    id,
    name,
}: {
    id?: string | null;
    name?: string | null;
}): MonsterArtwork | null {
    for (const value of [id, name]) {
        if (!value) continue;
        const artwork = MONSTER_ARTWORK_BY_KEY.get(normalizeMonsterKey(value));
        if (artwork) return artwork;
    }
    return null;
}
