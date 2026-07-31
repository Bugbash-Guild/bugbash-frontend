"use client";

import useSWR from "swr";

import { isUnauthorizedApiError } from "@/lib/apiError";
import { fetchMasterJson } from "@/lib/masterData";
import type { SummonDisclosureResponse } from "@/types/summon";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

type SummonDisclosureScope = "limited" | "normal";

const disclosureUrl = (scope: SummonDisclosureScope): string =>
  scope === "limited" ? "/api/summon/limited/disclosure" : "/api/summon/disclosure";

const fetcher = async (url: string) => {
  return fetchMasterJson<SummonDisclosureResponse>(url, "summon/disclosure");
};

export function useSummonDisclosure(enabled: boolean, scope: SummonDisclosureScope = "normal") {
  const url = disclosureUrl(scope);
  const { data, error, isLoading, mutate } = useSWR<SummonDisclosureResponse>(
    enabled ? url : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(error);

  return {
    disclosure: data ?? null,
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
