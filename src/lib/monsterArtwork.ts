export type MonsterArtwork = {
    src: string;
    alt: string;
};

type MonsterArtworkInput = {
    id?: string | null;
    name?: string | null;
    formStage?: string | null;
    level?: number | null;
    awakeningState?: string | null;
};

type MonsterArtworkEntry = MonsterArtwork & {
    aliases: string[];
};

type MonsterArtworkFamily = {
    aliases: string[];
    resolve: (input: MonsterArtworkInput) => MonsterArtwork;
};

const EVOLUTION_LEVEL = 30;
const FINAL_FORM_LEVEL = 80;

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

const NULL_POINTER_ARTWORK = {
    base: {
        src: '/monsters/null-pointer-axolotl.png',
        alt: 'Null Pointer Axolotl',
    },
    evo: {
        src: '/monsters/dereference-newt.png',
        alt: 'Dereference Newt',
    },
    awakened: {
        src: '/monsters/optional-guardian.png',
        alt: 'Optional Guardian',
    },
    awakenedFinal: {
        src: '/monsters/safe-memory-oracle.png',
        alt: 'Safe Memory Oracle',
    },
    berserk: {
        src: '/monsters/void-leech-axolotl.png',
        alt: 'Void Leech Axolotl',
    },
    berserkFinal: {
        src: '/monsters/null-abyss-devourer.png',
        alt: 'Null Abyss Devourer',
    },
} satisfies Record<string, MonsterArtwork>;

const MONSTER_ARTWORK_FAMILIES: MonsterArtworkFamily[] = [
    {
        aliases: [
            'null pointer axolotl',
            'null-pointer-axolotl',
            'null_pointer_axolotl',
            'null pointer',
            'null axolotl',
        ],
        resolve: (input) => {
            const formStage = resolveFormStage(input);

            return NULL_POINTER_ARTWORK_BY_STAGE[formStage];
        },
    },
];

function resolveFormStage({ awakeningState, formStage, level }: MonsterArtworkInput) {
    const explicitStage = formStage?.toUpperCase();
    if (isNullPointerArtworkStage(explicitStage)) return explicitStage;

    const currentLevel = level ?? 1;
    const state = awakeningState?.toUpperCase();

    if (state === 'AWAKENED') {
        return currentLevel >= FINAL_FORM_LEVEL ? 'AWAKENED_FINAL' : 'AWAKENED';
    }

    if (state === 'BERSERK') {
        return currentLevel >= FINAL_FORM_LEVEL ? 'BERSERK_FINAL' : 'BERSERK';
    }

    return currentLevel >= EVOLUTION_LEVEL ? 'EVO' : 'BASE';
}

function isNullPointerArtworkStage(
    value: string | undefined,
): value is keyof typeof NULL_POINTER_ARTWORK_BY_STAGE {
    return value !== undefined && value in NULL_POINTER_ARTWORK_BY_STAGE;
}

const NULL_POINTER_ARTWORK_BY_STAGE = {
    BASE: NULL_POINTER_ARTWORK.base,
    EVO: NULL_POINTER_ARTWORK.evo,
    AWAKENED: NULL_POINTER_ARTWORK.awakened,
    AWAKENED_FINAL: NULL_POINTER_ARTWORK.awakenedFinal,
    BERSERK: NULL_POINTER_ARTWORK.berserk,
    BERSERK_FINAL: NULL_POINTER_ARTWORK.berserkFinal,
};

function normalizeMonsterKey(value: string): string {
    return value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

const MONSTER_ARTWORK_BY_KEY = new Map<string, (input: MonsterArtworkInput) => MonsterArtwork>();

for (const artwork of MONSTER_ARTWORK) {
    const keys = [artwork.alt, ...artwork.aliases];
    for (const key of keys) {
        MONSTER_ARTWORK_BY_KEY.set(normalizeMonsterKey(key), () => ({
            src: artwork.src,
            alt: artwork.alt,
        }));
    }
}

for (const family of MONSTER_ARTWORK_FAMILIES) {
    for (const key of family.aliases) {
        MONSTER_ARTWORK_BY_KEY.set(normalizeMonsterKey(key), family.resolve);
    }
}

export function getMonsterArtwork(input: MonsterArtworkInput): MonsterArtwork | null {
    const { id, name } = input;
    for (const value of [id, name]) {
        if (!value) continue;
        const resolveArtwork = MONSTER_ARTWORK_BY_KEY.get(normalizeMonsterKey(value));
        if (resolveArtwork) return resolveArtwork(input);
    }
    return null;
}
