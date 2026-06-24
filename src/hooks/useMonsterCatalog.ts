"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/apiError";
import type { AdminMonsterInput } from "@/lib/adminMonsterCatalog";
import type { Monster, MonsterFormStage } from "@/types/monster";

type AllMonstersDto = {
  monsters: {
    id: string;
    slug?: string;
    name: string;
    emoji: string;
    rarity: string;
    artworkByStage?: AdminMonsterInput["artworkByStage"];
  }[];
};

const ADMIN_LOCAL_FORM_STAGES: MonsterFormStage[] = [
  "BASE",
  "EVO",
  "AWAKENED",
  "AWAKENED_FINAL",
  "BERSERK",
  "BERSERK_FINAL",
];

const FORM_STAGE_ASSET_NAME: Record<MonsterFormStage, string> = {
  BASE: "base",
  EVO: "evo",
  AWAKENED: "awakened",
  AWAKENED_FINAL: "awakened-final",
  BERSERK: "berserk",
  BERSERK_FINAL: "berserk-final",
};

const LOCAL_MONSTER_ASSET_SLUGS = [
  "accessibility-landmark-lemur",
  "api-gateway-manta",
  "build-cache-beaver",
  "cache-phantom",
  "circuit-breaker-armadillo",
  "config-drift-ibex",
  "cors-preflight-dragonfly",
  "cors-preflight-glider",
  "cron-scheduler-ram",
  "csp-header-scorpion",
  "css-specificity-peacock",
  "dependency-hydra",
  "deploy-canary-finch",
  "dns-resolver-hornbill",
  "dom-reflow-sloth",
  "feature-flag-chameleon",
  "flaky-test-frog",
  "git-branch-kitsune",
  "iac-drift-ibex",
  "idempotency-pangolin",
  "load-balancer-manta",
  "locale-collation-llama",
  "memory-leak-moth",
  "memory-leak-tarsier",
  "observability-owl",
  "pagination-pelican",
  "queue-worker-hedgehog",
  "race-condition-twins",
  "rate-limit-djinn",
  "regex-ferret",
  "sandbox-hermit",
  "schema-migration-golem",
  "schema-validator-lynx",
  "secret-rotation-peacock",
  "serialization-kraken",
  "shard-partition-mantis",
  "snapshot-walrus",
  "timeout-jellyfish",
  "tls-handshake-narwhal",
  "token-mimic",
  "wasm-trap-kangaroo",
  "webhook-bat",
  "websocket-seahorse",
] as const;

const DISPLAY_NAME_OVERRIDES: Partial<
  Record<(typeof LOCAL_MONSTER_ASSET_SLUGS)[number], string>
> = {
  "api-gateway-manta": "API Gateway Manta",
  "cors-preflight-dragonfly": "CORS Preflight Dragonfly",
  "cors-preflight-glider": "CORS Preflight Glider",
  "csp-header-scorpion": "CSP Header Scorpion",
  "css-specificity-peacock": "CSS Specificity Peacock",
  "dns-resolver-hornbill": "DNS Resolver Hornbill",
  "dom-reflow-sloth": "DOM Reflow Sloth",
  "iac-drift-ibex": "IaC Drift Ibex",
  "tls-handshake-narwhal": "TLS Handshake Narwhal",
  "wasm-trap-kangaroo": "WASM Trap Kangaroo",
};

const getAssetBaseUrl = (): string | null => {
  const value = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
  return value ? value.replace(/\/+$/g, "") : null;
};

const createLocalArtworkByStage = (
  slug: string,
): AdminMonsterInput["artworkByStage"] => {
  const assetBaseUrl = getAssetBaseUrl();

  return Object.fromEntries(
    ADMIN_LOCAL_FORM_STAGES.map((stage) => {
      const assetName = FORM_STAGE_ASSET_NAME[stage];
      return [
        stage,
        assetBaseUrl
          ? `${assetBaseUrl}/monsters/${slug}/${assetName}.webp`
          : `/game-assets/source/monsters/${slug}/${assetName}.png`,
      ];
    }),
  ) as AdminMonsterInput["artworkByStage"];
};

const toTitleCaseMonsterName = (slug: string): string =>
  DISPLAY_NAME_OVERRIDES[slug as (typeof LOCAL_MONSTER_ASSET_SLUGS)[number]] ??
  slug
    .split("-")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const createLocalMonsterCatalogAddition = (
  slug: (typeof LOCAL_MONSTER_ASSET_SLUGS)[number],
): AdminMonsterInput => ({
  id: slug,
  slug,
  name: toTitleCaseMonsterName(slug),
  emoji: "◆",
  rarity: "SR",
  artworkByStage: createLocalArtworkByStage(slug),
});

const LOCAL_MONSTER_CATALOG_ADDITIONS: AdminMonsterInput[] =
  LOCAL_MONSTER_ASSET_SLUGS.map(createLocalMonsterCatalogAddition);

const mergeArtworkByStage = (
  monster: AdminMonsterInput,
  local: AdminMonsterInput,
): AdminMonsterInput["artworkByStage"] =>
  Object.fromEntries(
    ADMIN_LOCAL_FORM_STAGES.map((stage) => [
      stage,
      monster.artworkByStage?.[stage] ?? local.artworkByStage?.[stage],
    ]),
  ) as AdminMonsterInput["artworkByStage"];

const normalizeCatalogMatchKey = (value: string): string =>
  value.normalize("NFKC").toLowerCase();

const getCatalogMatchKeys = (monster: AdminMonsterInput): string[] =>
  [monster.id, monster.slug, monster.name]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .map(normalizeCatalogMatchKey);

const mergeLocalMonsterCatalogAdditions = (
  monsters: AdminMonsterInput[],
): AdminMonsterInput[] => {
  const localByKey = new Map(
    LOCAL_MONSTER_CATALOG_ADDITIONS.flatMap((monster) =>
      getCatalogMatchKeys(monster).map((key) => [key, monster] as const),
    ),
  );

  const mergedMonsters = monsters.map((monster) => {
    const local = getCatalogMatchKeys(monster)
      .map((key) => localByKey.get(key))
      .find((value): value is AdminMonsterInput => value !== undefined);

    if (!local) return monster;

    return {
      ...monster,
      artworkByStage: mergeArtworkByStage(monster, local),
    };
  });

  const existingKeys = new Set(
    mergedMonsters.flatMap((monster) => getCatalogMatchKeys(monster)),
  );

  return [
    ...mergedMonsters,
    ...LOCAL_MONSTER_CATALOG_ADDITIONS.filter(
      (monster) =>
        !existingKeys.has(normalizeCatalogMatchKey(monster.id)) &&
        (!monster.slug ||
          !existingKeys.has(normalizeCatalogMatchKey(monster.slug))),
    ),
  ];
};

const fetchMonsterCatalog = async (): Promise<AdminMonsterInput[]> => {
  const data = await fetchJson<AllMonstersDto>(
    "/api/monsters/all",
    undefined,
    "monsters/all",
  );

  return mergeLocalMonsterCatalogAdditions(
    data.monsters.map((monster) => ({
      id: monster.id,
      slug: monster.slug,
      name: monster.name,
      emoji: monster.emoji,
      rarity: monster.rarity as Monster["rarity"],
      artworkByStage: monster.artworkByStage,
    })),
  );
};

export function useMonsterCatalog() {
  const { data, error, isLoading, mutate } = useSWR<AdminMonsterInput[]>(
    "admin-monster-catalog",
    fetchMonsterCatalog,
    { revalidateOnFocus: true },
  );

  return {
    monsters: data ?? LOCAL_MONSTER_CATALOG_ADDITIONS,
    loading: isLoading,
    error: error ? String(error) : null,
    refetch: () => mutate(),
  };
}
