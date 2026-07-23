"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type {
  MonsterSkinCatalogItem,
  OwnedSkinCatalogItem,
} from "@/lib/skinCatalog";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

type MonsterSkinCatalogResponse = {
  skins: MonsterSkinCatalogItem[];
};

type OwnedMonsterSkinCatalogResponse = {
  skins: (OwnedSkinCatalogItem & {
    acquiredAt: string;
    assetBasePath: string;
    lineName: string;
    monsterSlug: string;
    tier: string;
  })[];
};

function visibleError(error: unknown): string | null {
  if (!error || isUnauthorizedApiError(error)) return null;
  return error instanceof Error ? error.message : String(error);
}

export function useSkinCatalog(enabled: boolean) {
  const catalog = useSWR<MonsterSkinCatalogResponse>(
    enabled ? "/api/skins" : null,
    (url: string) =>
      fetchJson<MonsterSkinCatalogResponse>(
        url,
        { cache: "no-store" },
        "skin catalog",
      ),
    { shouldRetryOnError: false },
  );
  const owned = useSWR<OwnedMonsterSkinCatalogResponse>(
    enabled ? "/api/skins/owned" : null,
    (url: string) =>
      fetchJson<OwnedMonsterSkinCatalogResponse>(
        url,
        { cache: "no-store" },
        "owned skins",
      ),
    { shouldRetryOnError: false },
  );

  useRedirectOnUnauthorized(catalog.error);
  useRedirectOnUnauthorized(owned.error);

  async function setEquipped(
    skin: MonsterSkinCatalogItem,
    currentlyEquipped: boolean,
  ): Promise<void> {
    const url = currentlyEquipped
      ? `/api/skins/equipped/${encodeURIComponent(skin.monsterSlug)}`
      : `/api/skins/${encodeURIComponent(skin.skinId)}/equip`;
    await fetchJson(
      url,
      { method: currentlyEquipped ? "DELETE" : "PUT" },
      currentlyEquipped ? "unequip skin" : "equip skin",
    );
    await owned.mutate();
  }

  return {
    error: visibleError(catalog.error) ?? visibleError(owned.error),
    loading: catalog.isLoading || owned.isLoading,
    ownedSkins: owned.data?.skins ?? [],
    refetch: () => Promise.all([catalog.mutate(), owned.mutate()]),
    setEquipped,
    skins: catalog.data?.skins ?? [],
  };
}
