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

const MONSTER_FORM_STAGES = [
  "BASE",
  "EVO",
  "AWAKENED",
  "AWAKENED_FINAL",
  "BERSERK",
  "BERSERK_FINAL",
] as const;

type MonsterFormStage = (typeof MONSTER_FORM_STAGES)[number];
type MonsterArtworkByStage = Record<MonsterFormStage, MonsterArtwork>;

const EVOLUTION_LEVEL = 30;
const FINAL_FORM_LEVEL = 80;

const MONSTER_ARTWORK: MonsterArtworkEntry[] = [
  {
    src: "/monsters/branch-pup.png",
    alt: "Branch Pup",
    aliases: [
      "branch pup",
      "git branch kitsune",
      "branch pup base",
      "git branch kitsune base",
    ],
  },
  {
    src: "/monsters/latency-polyp.png",
    alt: "Latency Polyp",
    aliases: [
      "timeout jelly",
      "timeout jellyfish",
      "latency polyp",
      "timeout jelly base",
    ],
  },
  {
    src: "/monsters/flag-gecko.png",
    alt: "Flag Gecko",
    aliases: [
      "flag gecko",
      "feature flag chameleon",
      "feature flag gecko",
      "flag gecko base",
    ],
  },
];

const NULL_POINTER_ARTWORK = {
  base: {
    src: "/monsters/null-pointer-axolotl.png",
    alt: "Null Pointer Axolotl",
  },
  evo: {
    src: "/monsters/dereference-newt.png",
    alt: "Dereference Newt",
  },
  awakened: {
    src: "/monsters/optional-guardian.png",
    alt: "Optional Guardian",
  },
  awakenedFinal: {
    src: "/monsters/safe-memory-oracle.png",
    alt: "Safe Memory Oracle",
  },
  berserk: {
    src: "/monsters/void-leech-axolotl.png",
    alt: "Void Leech Axolotl",
  },
  berserkFinal: {
    src: "/monsters/null-abyss-devourer.png",
    alt: "Null Abyss Devourer",
  },
} satisfies Record<string, MonsterArtwork>;

const NULL_POINTER_ARTWORK_BY_STAGE: MonsterArtworkByStage = {
  BASE: NULL_POINTER_ARTWORK.base,
  EVO: NULL_POINTER_ARTWORK.evo,
  AWAKENED: NULL_POINTER_ARTWORK.awakened,
  AWAKENED_FINAL: NULL_POINTER_ARTWORK.awakenedFinal,
  BERSERK: NULL_POINTER_ARTWORK.berserk,
  BERSERK_FINAL: NULL_POINTER_ARTWORK.berserkFinal,
};

const TOKEN_MIMIC_ARTWORK_BY_STAGE: MonsterArtworkByStage = {
  BASE: {
    src: "/monster-svgs/token-mimic.svg",
    alt: "Token Mimic",
  },
  EVO: {
    src: "/monster-svgs/session-mimic.svg",
    alt: "Session Mimic",
  },
  AWAKENED: {
    src: "/monster-svgs/vault-agent.svg",
    alt: "Vault Agent",
  },
  AWAKENED_FINAL: {
    src: "/monster-svgs/oauth-gateway.svg",
    alt: "OAuth Gateway",
  },
  BERSERK: {
    src: "/monster-svgs/token-exfiltrator.svg",
    alt: "Token Exfiltrator",
  },
  BERSERK_FINAL: {
    src: "/monster-svgs/shadow-iam-proxy.svg",
    alt: "Shadow IAM Proxy",
  },
};

const CACHE_TURTLE_ARTWORK_BY_STAGE: MonsterArtworkByStage = {
  BASE: {
    src: "/monster-svgs/cache-turtle.svg",
    alt: "Cache Turtle",
  },
  EVO: {
    src: "/monster-svgs/cache-runner.svg",
    alt: "Cache Runner",
  },
  AWAKENED: {
    src: "/monster-svgs/hot-cache-courier.svg",
    alt: "Hot Cache Courier",
  },
  AWAKENED_FINAL: {
    src: "/monster-svgs/edge-cache-monarch.svg",
    alt: "Edge Cache Monarch",
  },
  BERSERK: {
    src: "/monster-svgs/stale-cache-polyp.svg",
    alt: "Stale Cache Polyp",
  },
  BERSERK_FINAL: {
    src: "/monster-svgs/invalidation-maw.svg",
    alt: "Invalidation Maw",
  },
};

const RACE_CONDITION_TWINS_ARTWORK_BY_STAGE: MonsterArtworkByStage = {
  BASE: {
    src: "/monster-svgs/race-condition-twins.svg",
    alt: "Race Condition Twins",
  },
  EVO: {
    src: "/monster-svgs/thread-sprinters.svg",
    alt: "Thread Sprinters",
  },
  AWAKENED: {
    src: "/monster-svgs/sync-mediators.svg",
    alt: "Sync Mediators",
  },
  AWAKENED_FINAL: {
    src: "/monster-svgs/deterministic-arbiters.svg",
    alt: "Deterministic Arbiters",
  },
  BERSERK: {
    src: "/monster-svgs/deadlock-knot.svg",
    alt: "Deadlock Knot",
  },
  BERSERK_FINAL: {
    src: "/monster-svgs/starvation-hydra.svg",
    alt: "Starvation Hydra",
  },
};

const MONSTER_ARTWORK_FAMILIES: MonsterArtworkFamily[] = [
  createArtworkFamily(
    [
      "null pointer axolotl",
      "null-pointer-axolotl",
      "null_pointer_axolotl",
      "null pointer",
      "null axolotl",
    ],
    NULL_POINTER_ARTWORK_BY_STAGE,
  ),
  createArtworkFamily(
    [
      "token mimic",
      "token-mimic",
      "token_mimic",
      "auth token mimic",
      "authentication token mimic",
    ],
    TOKEN_MIMIC_ARTWORK_BY_STAGE,
  ),
  createArtworkFamily(
    [
      "cache turtle",
      "cache-turtle",
      "cache_turtle",
      "cache monster",
      "cache turtle line",
    ],
    CACHE_TURTLE_ARTWORK_BY_STAGE,
  ),
  createArtworkFamily(
    [
      "race condition twins",
      "race-condition-twins",
      "race_condition_twins",
      "race condition",
      "thread race twins",
    ],
    RACE_CONDITION_TWINS_ARTWORK_BY_STAGE,
  ),
];

function createArtworkFamily(
  aliases: string[],
  artworkByStage: MonsterArtworkByStage,
): MonsterArtworkFamily {
  return {
    aliases,
    resolve: (input) => artworkByStage[resolveFormStage(input)],
  };
}

function resolveFormStage({
  awakeningState,
  formStage,
  level,
}: MonsterArtworkInput): MonsterFormStage {
  const explicitStage = formStage?.toUpperCase();
  if (isMonsterFormStage(explicitStage)) return explicitStage;

  const currentLevel = level ?? 1;
  const state = awakeningState?.toUpperCase();

  if (state === "AWAKENED") {
    return currentLevel >= FINAL_FORM_LEVEL ? "AWAKENED_FINAL" : "AWAKENED";
  }

  if (state === "BERSERK") {
    return currentLevel >= FINAL_FORM_LEVEL ? "BERSERK_FINAL" : "BERSERK";
  }

  return currentLevel >= EVOLUTION_LEVEL ? "EVO" : "BASE";
}

function isMonsterFormStage(
  value: string | undefined,
): value is MonsterFormStage {
  return MONSTER_FORM_STAGES.includes(value as MonsterFormStage);
}

function normalizeMonsterKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const MONSTER_ARTWORK_BY_KEY = new Map<
  string,
  (input: MonsterArtworkInput) => MonsterArtwork
>();

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

export function getMonsterArtwork(
  input: MonsterArtworkInput,
): MonsterArtwork | null {
  const { id, name } = input;
  for (const value of [id, name]) {
    if (!value) continue;
    const resolveArtwork = MONSTER_ARTWORK_BY_KEY.get(
      normalizeMonsterKey(value),
    );
    if (resolveArtwork) return resolveArtwork(input);
  }
  return null;
}
