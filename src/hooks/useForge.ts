"use client";

import { useRef, useState } from "react";

import useSWR from "swr";

import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { readBillingErrorMessage } from "@/lib/billing/runeCheckout";
import { ForgeIdempotencyKeys } from "@/lib/forge";
import { fetchJson, isUnauthorizedApiError } from "@/lib/apiError";
import type {
  ForgeLevelDef,
  ForgeUpgradeRequest,
  ForgeUpgradeResponse,
  OwnedMonsterSkin,
  OwnedMonsterSkinsResponse,
} from "@/types/forge";
import { useRedirectOnUnauthorized } from "./useRedirectOnUnauthorized";

export type ForgeMutationError = {
  action: "balance" | "refresh" | "retry" | "target";
  message: string;
};

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `forge-${Date.now()}`;
}

function visibleError(error: unknown): string | null {
  if (!error || isUnauthorizedApiError(error)) return null;
  return error instanceof Error ? error.message : String(error);
}

function isOptimisticLockConflict(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    (message.includes("ランク") && message.includes("更新")) ||
    normalized.includes("expectedfromrank") ||
    normalized.includes("optimistic")
  );
}

export function useForge(enabled: boolean) {
  const router = useRouter();
  const skins = useSWR<OwnedMonsterSkinsResponse>(
    enabled ? "/api/skins/owned" : null,
    (url: string) => fetchJson<OwnedMonsterSkinsResponse>(url, { cache: "no-store" }, url),
    { shouldRetryOnError: false },
  );
  const definitions = useSWR<ForgeLevelDef[]>(
    enabled ? "/api/forge/level-defs?track=MONSTER" : null,
    (url: string) => fetchJson<ForgeLevelDef[]>(url, { cache: "no-store" }, url),
    { shouldRetryOnError: false },
  );
  const { wallet, loading: walletLoading, error: walletError, refetch: refetchWallet } =
    useWallet(enabled);
  const [mutationError, setMutationError] = useState<ForgeMutationError | null>(null);
  const [upgradingSkinId, setUpgradingSkinId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const idempotencyKeys = useRef<ForgeIdempotencyKeys | null>(null);

  if (idempotencyKeys.current == null) {
    idempotencyKeys.current = new ForgeIdempotencyKeys(createBrowserIdempotencyKey);
  }

  useRedirectOnUnauthorized(skins.error);
  useRedirectOnUnauthorized(definitions.error);

  async function upgrade(skin: OwnedMonsterSkin): Promise<ForgeUpgradeResponse | null> {
    if (inFlight.current) return null;

    const expectedFromRank = skin.masteryLevel;
    const idempotencyKey = idempotencyKeys.current!.get(skin.skinId, expectedFromRank);
    inFlight.current = true;
    setMutationError(null);
    setUpgradingSkinId(skin.skinId);

    try {
      const request: ForgeUpgradeRequest = {
        expectedFromRank,
        idempotencyKey,
        targetRefId: skin.skinId,
        targetType: "HERO_SKIN",
      };
      const response = await fetch("/api/forge/upgrade", {
        body: JSON.stringify(request),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const message = await readBillingErrorMessage(response);
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        if (isOptimisticLockConflict(message)) {
          setMutationError({
            action: "refresh",
            message: "このスキンの工房ランクが更新されています。情報を再読み込みしてください。",
          });
          return null;
        }
        if (message.includes("所有済みスキン")) {
          setMutationError({
            action: "target",
            message: "このスキンは所有済みではないため強化できません。",
          });
          return null;
        }
        if (message.includes("ルーン") && message.includes("不足")) {
          setMutationError({
            action: "balance",
            message: "ルーンが足りません。残高を確認してください。",
          });
          return null;
        }
        setMutationError({
          action: "retry",
          message: "結果を確認できませんでした。同じ内容でもう一度実行できます。",
        });
        return null;
      }

      const result = (await response.json()) as ForgeUpgradeResponse;
      idempotencyKeys.current!.markSucceeded(skin.skinId, expectedFromRank);
      await Promise.all([skins.mutate(), refetchWallet()]);
      return result;
    } catch {
      setMutationError({
        action: "retry",
        message: "通信結果を確認できません。同じ内容でもう一度実行できます。",
      });
      return null;
    } finally {
      inFlight.current = false;
      setUpgradingSkinId(null);
    }
  }

  return {
    error: visibleError(skins.error) ?? visibleError(definitions.error) ?? walletError,
    levelDefs: definitions.data ?? [],
    loading: skins.isLoading || definitions.isLoading || walletLoading,
    mutationError,
    ownedSkins: skins.data?.skins ?? [],
    refetch: () => Promise.all([skins.mutate(), definitions.mutate(), refetchWallet()]),
    upgradingSkinId,
    upgrade,
    wallet,
  };
}
