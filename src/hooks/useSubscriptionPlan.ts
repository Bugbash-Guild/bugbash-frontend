"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/apiError";
import type { SubscriptionPlanInfo } from "@/types/billing";

const fetcher = async (url: string) =>
  fetchJson<SubscriptionPlanInfo>(url, { cache: "no-store" }, "billing/subscription/plan");

/**
 * パスの価格と特典をサーバから取る。
 *
 * 以前は価格 780 円と特典の文言がフロントに直書きされていた。サーバの
 * 定義を変えても表示は変わらないため、実際の請求額と違う金額を見せられる
 * 状態だった。読み込めなかったときに既定値へ落とすことは**しない**
 * （それでは直書きと同じ）。
 *
 * 未ログインでも読める公開情報なので、認証状態に関係なく取得する。
 */
export function useSubscriptionPlan() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionPlanInfo>(
    "/api/billing/subscription/plan",
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    error: error ? String(error.message ?? error) : null,
    loading: isLoading,
    plan: data ?? null,
    refetch: () => mutate(),
  };
}
