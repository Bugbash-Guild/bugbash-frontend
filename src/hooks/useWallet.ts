"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type { BillingWallet } from "@/types/billing";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string) => {
  return fetchJson<BillingWallet>(url, { cache: "no-store" }, "billing/wallet");
};

export function useWallet(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<BillingWallet>(
    enabled ? "/api/billing/wallet" : null,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );
  useRedirectOnUnauthorized(error);

  return {
    wallet: data ?? null,
    loading: isLoading,
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    refetch: () => mutate(),
  };
}
