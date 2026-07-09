"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type { SubscriptionStatus } from "@/types/billing";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string) => {
  return fetchJson<SubscriptionStatus>(
    url,
    { cache: "no-store" },
    "billing/subscription",
  );
};

export function useSubscription(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionStatus>(
    enabled ? "/api/billing/subscription" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(error);

  return {
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    loading: isLoading,
    refetch: () => mutate(),
    subscription: data ?? null,
    updateSubscription: (next: SubscriptionStatus) => mutate(next, false),
  };
}
