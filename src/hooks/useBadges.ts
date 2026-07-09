"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type {
  BadgeCatalogItem,
  BadgeProgress,
  ForgeLevelDef,
} from "@/types/badge";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async <T>(url: string) =>
  fetchJson<T>(url, { cache: "no-store" }, url);

function visibleError(error: unknown): string | null {
  if (!error || isUnauthorizedApiError(error)) return null;
  return error instanceof Error ? error.message : String(error);
}

export function useBadges(enabled: boolean) {
  const catalog = useSWR<BadgeCatalogItem[]>(
    enabled ? "/api/badges/catalog" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  const progress = useSWR<BadgeProgress[]>(
    enabled ? "/api/heroes/me/badges/progress" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  const levelDefs = useSWR<ForgeLevelDef[]>(
    enabled ? "/api/forge/level-defs?track=BADGE" : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  useRedirectOnUnauthorized(catalog.error);
  useRedirectOnUnauthorized(progress.error);
  useRedirectOnUnauthorized(levelDefs.error);

  return {
    catalog: catalog.data ?? [],
    catalogError: visibleError(catalog.error),
    levelDefs: levelDefs.data ?? [],
    levelDefsError: visibleError(levelDefs.error),
    levelDefsLoading: levelDefs.isLoading,
    loading: catalog.isLoading || progress.isLoading || levelDefs.isLoading,
    progress: progress.data ?? [],
    progressError: visibleError(progress.error),
    refetchAll: () =>
      Promise.all([catalog.mutate(), progress.mutate(), levelDefs.mutate()]),
    refetchProgress: () => progress.mutate(),
  };
}
