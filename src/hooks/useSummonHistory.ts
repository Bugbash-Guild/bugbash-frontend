"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type { SummonHistoryResponse } from "@/types/summon";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string): Promise<SummonHistoryResponse> => {
  return fetchJson<SummonHistoryResponse>(
    url,
    { cache: "no-store" },
    "summon/history",
  );
};

type SummonHistoryScope = "limited" | "normal";

export function useSummonHistory(
  enabled: boolean,
  scope: SummonHistoryScope = "normal",
) {
  const url =
    scope === "limited"
      ? "/api/summon/history?poolKey=LIMITED&limit=10"
      : "/api/summon/history";
  const { data, error, isLoading, mutate } = useSWR<SummonHistoryResponse>(
    enabled ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      shouldRetryOnError: false,
    },
  );
  useRedirectOnUnauthorized(error);

  return {
    entries: data?.entries ?? [],
    loading: isLoading,
    error:
      error && !isUnauthorizedApiError(error)
        ? String(error.message ?? error)
        : null,
    refetch: async () => (await mutate())?.entries ?? [],
  };
}
