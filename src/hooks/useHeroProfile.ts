"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/apiError";
import type { PublicHeroProfile } from "@/types/hero";

/**
 * 公開プロフィール（トロフィールーム）データ。認証不要。
 * 非公開/存在しない Hero では 404 になり、profile は null を返す。
 */
export function usePublicHeroProfile(heroId: string | null | undefined) {
  const { data, error, isLoading } = useSWR<PublicHeroProfile>(
    heroId ? `/api/heroes/${encodeURIComponent(heroId)}/profile` : null,
    (url: string) => fetchJson<PublicHeroProfile>(url, { cache: "no-store" }, "public hero profile"),
    { shouldRetryOnError: false },
  );

  return {
    profile: data ?? null,
    loading: isLoading,
    // 404（非公開/未存在）は「公開プロフィールなし」として扱い、致命的エラー表示にしない。
    unavailable: Boolean(error),
  };
}
