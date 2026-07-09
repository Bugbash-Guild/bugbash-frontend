"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type { RuneProduct } from "@/types/billing";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string) => {
  return fetchJson<RuneProduct[]>(url, { cache: "no-store" }, "billing/rune-products");
};

export function useRuneProducts(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<RuneProduct[]>(
    enabled ? "/api/billing/rune-products" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(error);

  return {
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    loading: isLoading,
    products: data ?? [],
    refetch: () => mutate(),
  };
}
