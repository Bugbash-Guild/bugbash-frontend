"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type {
  CommemorativeMintOffer,
  CommemorativeMintPlate,
} from "@/types/commemorativeMint";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

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
    offers: result.data ?? [],
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
    mints: result.data ?? [],
    refetch: () => result.mutate(),
  };
}
