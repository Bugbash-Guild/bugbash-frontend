"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type {
  CommemorativeMintOffer,
  CommemorativeMintPlate,
} from "@/types/commemorativeMint";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

/**
 * 配列を期待している箇所で配列以外が来たら空として扱う。
 *
 * 記念プレートは monsters ページで map される。契約外の応答が来たときに
 * ここで throw すると図鑑が丸ごと白画面になる（RewardModal の #143 と同じ形）。
 */
function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function visibleError(error: unknown): string | null {
  if (!error || isUnauthorizedApiError(error)) return null;
  return error instanceof Error ? error.message : String(error);
}

const fetchPrivateMints = (url: string) =>
  fetchJson<CommemorativeMintOffer[]>(url, { cache: "no-store" }, "commemorative mints");

const fetchPublicMints = (url: string) =>
  fetchJson<CommemorativeMintPlate[]>(url, { cache: "no-store" }, "public commemorative mints");

export function useCommemorativeMints(enabled: boolean) {
  const result = useSWR<CommemorativeMintOffer[]>(
    enabled ? "/api/commemorative-mints" : null,
    fetchPrivateMints,
    { shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(result.error);

  return {
    error: visibleError(result.error),
    loading: result.isLoading,
    offers: asArray(result.data),
    refetch: () => result.mutate(),
  };
}

export function usePublicCommemorativeMints(heroId: string | null | undefined) {
  const result = useSWR<CommemorativeMintPlate[]>(
    heroId ? `/api/heroes/${encodeURIComponent(heroId)}/commemorative-mints` : null,
    fetchPublicMints,
    { shouldRetryOnError: false },
  );

  return {
    error: visibleError(result.error),
    loading: result.isLoading,
    mints: asArray(result.data),
    refetch: () => result.mutate(),
  };
}
