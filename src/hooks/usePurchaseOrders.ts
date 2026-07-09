"use client";

import useSWR from "swr";

import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type { PurchaseOrderHistory } from "@/types/billing";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string) =>
  fetchJson<PurchaseOrderHistory[]>(url, { cache: "no-store" }, "billing/orders");

export function usePurchaseOrders(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<PurchaseOrderHistory[]>(
    enabled ? "/api/billing/orders?limit=50" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(error);

  return {
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    loading: isLoading,
    orders: data ?? [],
    refetch: () => mutate(),
  };
}
