"use client";

import useSWR from "swr";

import { ApiError, fetchJson } from "@/lib/apiError";
import type { PublicHeroProfile } from "@/types/hero";

/**
 * 公開プロフィール（トロフィールーム）データ。認証不要。
 *
 * 404（非公開/未存在）は仕様どおりの応答なので notFound として返し、
 * 通信・サーバ失敗（unavailable）と区別する。以前は両者を unavailable
 * ひとつに畳んでいて、取得失敗が「何も持たないヒーロー」の骨ページに
 * 化ける嘘の状態を作っていた。
 */
export function usePublicHeroProfile(heroId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<PublicHeroProfile>(
    heroId ? `/api/heroes/${encodeURIComponent(heroId)}/profile` : null,
    (url: string) => fetchJson<PublicHeroProfile>(url, { cache: "no-store" }, "public hero profile"),
    { shouldRetryOnError: false },
  );

  const notFound = error instanceof ApiError && error.status === 404;
  return {
    profile: data ?? null,
    loading: isLoading,
    /** 404 = 非公開または存在しない（エラー表示にしない）。 */
    notFound,
    /** 通信/サーバ失敗。再試行できるよう retry を添える。 */
    unavailable: Boolean(error) && !notFound,
    retry: () => mutate(),
  };
}
