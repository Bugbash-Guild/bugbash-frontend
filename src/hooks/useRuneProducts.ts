"use client";

import useSWR from "swr";

import { isUnauthorizedApiError } from "@/lib/apiError";
import {
  parseRuneProductsResponse,
  type RuneProductsPayload,
} from "@/lib/billing/runeConversion";
import { fetchMasterJson } from "@/lib/masterData";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

const fetcher = async (url: string) => {
  /*
   * BE 未対応の環境は素の配列、対応後は { products, limitedSingleCostRune }。
   * デプロイ順が前後しても壊れないよう、形の差はここで畳む
   * （parse は throw しないので fetcher 内で安全）。
   */
  return parseRuneProductsResponse(
    await fetchMasterJson<unknown>(url, "billing/rune-products"),
  );
};

export function useRuneProducts(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<RuneProductsPayload>(
    enabled ? "/api/billing/rune-products" : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  useRedirectOnUnauthorized(error);

  return {
    error: error && !isUnauthorizedApiError(error) ? String(error.message ?? error) : null,
    /** 限定召喚1回のルーンコスト。BE 未対応・不正値なら null（換算は非表示）。 */
    limitedSingleCostRune: data?.limitedSingleCostRune ?? null,
    loading: isLoading,
    products: data?.products ?? [],
    refetch: () => mutate(),
  };
}
