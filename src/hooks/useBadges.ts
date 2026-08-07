"use client";

import useSWR from "swr";

import { asArray, fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import { fetchMasterJson } from "@/lib/masterData";
import type {
  BadgeCatalogItem,
  BadgeProgress,
  ForgeLevelDef,
  PublicHeroBadge,
} from "@/types/badge";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

/** ヒーロー固有データ。常に最新が要るので毎回取り直す。 */
const fetcher = async <T>(url: string) =>
  fetchJson<T>(url, { cache: "no-store" }, url);

/** バッジ定義・工房レベル定義はマスタデータ（詳細は src/lib/masterData.ts）。 */
const masterFetcher = async <T>(url: string) => fetchMasterJson<T>(url);

function visibleError(error: unknown): string | null {
  if (!error || isUnauthorizedApiError(error)) return null;
  return error instanceof Error ? error.message : String(error);
}

export function useBadges(enabled: boolean) {
  const catalog = useSWR<BadgeCatalogItem[]>(
    enabled ? "/api/badges/catalog" : null,
    masterFetcher,
    { shouldRetryOnError: false },
  );
  const progress = useSWR<BadgeProgress[]>(
    enabled ? "/api/heroes/me/badges/progress" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  const levelDefs = useSWR<ForgeLevelDef[]>(
    enabled ? "/api/forge/level-defs?track=BADGE" : null,
    masterFetcher,
    { shouldRetryOnError: false },
  );

  useRedirectOnUnauthorized(catalog.error);
  useRedirectOnUnauthorized(progress.error);
  useRedirectOnUnauthorized(levelDefs.error);

  return {
    catalog: asArray(catalog.data),
    catalogError: visibleError(catalog.error),
    levelDefs: asArray(levelDefs.data),
    levelDefsError: visibleError(levelDefs.error),
    levelDefsLoading: levelDefs.isLoading,
    loading: catalog.isLoading || progress.isLoading || levelDefs.isLoading,
    progress: asArray(progress.data),
    progressError: visibleError(progress.error),
    refetchAll: () =>
      Promise.all([catalog.mutate(), progress.mutate(), levelDefs.mutate()]),
    refetchProgress: () => progress.mutate(),
  };
}

/**
 * home の実績進捗行（BadgeProgressStrip）用の軽量版。progress 1 本だけを取る。
 *
 * BadgeProgress はカタログ相当のフィールド（displayName / tiers）を含む
 * ため、この 1 リクエストで「次の Tier まであと N」を組める。home の初回
 * リクエスト波にバッジ系 3 本（catalog / progress / level-defs）を足さない
 * ための分離。SWR キーは useBadges の progress と同一なので、home → /badges
 * と遷移してもキャッシュは共有され、二重取得にならない。
 */
export function useBadgeProgress(enabled: boolean) {
  const progress = useSWR<BadgeProgress[]>(
    enabled ? "/api/heroes/me/badges/progress" : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  useRedirectOnUnauthorized(progress.error);

  return {
    error: visibleError(progress.error),
    loading: progress.isLoading,
    progress: asArray(progress.data),
  };
}

/** 公開プロフィール向けの獲得済みバッジ（認証不要 / GET /api/heroes/{id}/badges）。 */
export function usePublicHeroBadges(heroId: string | null | undefined) {
  const { data, error, isLoading } = useSWR<PublicHeroBadge[]>(
    heroId ? `/api/heroes/${encodeURIComponent(heroId)}/badges` : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  return {
    badges: asArray(data),
    error: visibleError(error),
    loading: isLoading,
  };
}
