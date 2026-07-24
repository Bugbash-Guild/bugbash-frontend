"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { usePityCounter } from "@/hooks/usePityCounter";
import { useSummon } from "@/hooks/useSummon";
import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { useSummonHistory } from "@/hooks/useSummonHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { DisclosureModal } from "@/components/billing/DisclosureModal";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ItemVisual } from "@/components/ItemVisual";
import { MainWrapper } from "@/components/MainWrapper";
import { PityMeter } from "@/components/summon/PityMeter";
import {
  formatSummonCurrencyCost,
  selectEffectivePityDisclosure,
} from "@/lib/summonPity";
import { getSummonItemDisplay } from "./summonDisplay";
import type {
  ItemRarity,
  SummonHistoryEntry,
  SummonItem,
  SummonOnceResponse,
  SummonTenResponse,
} from "@/types/summon";

const RARITY_COLOR: Record<ItemRarity, string> = {
  N: "text-text-dim",
  R: "text-accent-2",
  SR: "text-purple",
  SSR: "text-gold",
};

const RARITY_BG: Record<ItemRarity, string> = {
  N: "bg-bg-elev-2",
  R: "bg-[#0e1a2e]",
  SR: "bg-[#1a0e2e]",
  SSR: "bg-[#2a1e06]",
};

type SummonResult =
  | { type: "once"; data: SummonOnceResponse }
  | { type: "ten"; data: SummonTenResponse };

export default function SummonPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hero, refetch: refetchHero } = useHero(isAuthenticated);
  const {
    pity,
    error: pityError,
    refetch: refetchPity,
  } = usePityCounter(isAuthenticated);
  const {
    disclosure,
    error: disclosureError,
    loading: disclosureLoading,
  } = useSummonDisclosure(isAuthenticated, "normal");
  const {
    subscription,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(isAuthenticated);
  const { entries, refetch: refetchHistory } =
    useSummonHistory(isAuthenticated);
  const {
    pullOnce,
    pullTen,
    loading: summoning,
    error: summonError,
    reset,
  } = useSummon();

  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [result, setResult] = useState<SummonResult | null>(null);
  const effectiveDisclosure =
    disclosure && subscription
      ? selectEffectivePityDisclosure(disclosure, subscription.entitled)
      : null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!result) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setResult(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-text-dim text-[13px]">
          <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
          authenticating…
        </div>
      </div>
    );
  }

  async function handlePullOnce() {
    reset();
    setResult(null);
    try {
      const data = await pullOnce();
      setResult({ type: "once", data });
      await Promise.all([refetchPity(), refetchHistory(), refetchHero()]);
    } catch {
      // error displayed via summonError state
    }
  }

  async function handlePullTen() {
    reset();
    setResult(null);
    try {
      const data = await pullTen();
      setResult({ type: "ten", data });
      await Promise.all([refetchPity(), refetchHistory(), refetchHero()]);
    } catch {
      // error displayed via summonError state
    }
  }

  return (
    <MainWrapper>
      <ConsoleTopbar command="./summon --currency=coin" path="~/summon" showWallet />
      <div className="px-9 py-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* ── Left: summon panel ── */}
          <div className="space-y-4">
            {/* pool info */}
            <div className="border border-line rounded p-4">
              <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint mb-3">
                GACHA POOL
              </div>
              <div className="text-[15px] text-text font-semibold mb-1">
                {disclosure?.name ?? "通常召喚"}
              </div>
              <div className="text-[12px] text-text-dim mb-3">
                {disclosure?.description ?? "提供割合を確認しています。"}
              </div>
              <button
                className="border border-line px-3 py-1.5 text-[12px] text-accent hover:border-accent hover:bg-accent hover:text-bg"
                onClick={() => setDisclosureOpen(true)}
                type="button"
              >
                提供割合について
              </button>
            </div>

            {/* pity counter */}
            <PityMeter
              disclosure={effectiveDisclosure}
              error={pityError ?? disclosureError ?? subscriptionError}
              loading={disclosureLoading || subscriptionLoading}
              pity={pity}
            />

            {/* coin balance */}
            <div className="flex items-center gap-2 text-[13px] px-1">
              <span className="text-text-faint">残高</span>
              <span className="text-gold font-semibold">
                ◈ {(hero?.guildCoinBalance ?? 0).toLocaleString()}
              </span>
              <span className="text-text-faint">GUILD_COIN</span>
            </div>

            {/* summon buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePullOnce}
                disabled={summoning || !effectiveDisclosure}
                className="flex-1 py-3 rounded border border-accent text-accent text-[13px] hover:bg-accent hover:text-bg disabled:opacity-40 transition-colors"
              >
                {summoning ? "召喚中…" : "[ 召喚 × 1 ]"}
              </button>
              <button
                onClick={handlePullTen}
                disabled={summoning || !effectiveDisclosure}
                className="flex-1 py-3 rounded border border-gold text-gold text-[13px] hover:bg-gold hover:text-bg disabled:opacity-40 transition-colors"
              >
                {summoning ? "召喚中…" : "[ 10連召喚 ]"}
              </button>
            </div>

            <div className="text-[11px] text-text-faint px-1">
              {disclosure
                ? `1回: ${formatSummonCurrencyCost(
                    disclosure.singlePullCost,
                    disclosure.currency,
                  )} · 10連: ${formatSummonCurrencyCost(
                    disclosure.tenPullCost ?? disclosure.singlePullCost,
                    disclosure.currency,
                  )}${disclosure.tenPullCost == null ? "（未提供）" : ""}`
                : "召喚コストを確認しています"}
            </div>

            <Link
              className="block border border-line px-3 py-2 text-center text-[12px] text-gold hover:border-gold"
              href="/summon/limited"
            >
              限定召喚へ
            </Link>

            {/* error */}
            {summonError && (
              <div className="border border-pink/30 rounded p-3 text-[12px] text-pink">
                {summonError.message}
              </div>
            )}
          </div>

          {/* ── Right: history ── */}
          <div className="border border-line rounded p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint mb-3">
              SUMMON HISTORY
            </div>
            {entries.length === 0 ? (
              <div className="text-[12px] text-text-faint py-8 text-center">
                まだ召喚履歴がありません
              </div>
            ) : (
              <div className="space-y-0">
                {entries.slice(0, 20).map((entry) => (
                  <HistoryRow
                    key={`${entry.itemId}-${entry.pulledAt}`}
                    entry={entry}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Result modal ── */}
        {result && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setResult(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="召喚結果"
              className="bg-bg-elev border border-line-strong rounded-lg p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint mb-4">
                {result.type === "once" ? "SUMMON RESULT" : "10× SUMMON RESULT"}
              </div>

              {result.type === "once" ? (
                <SingleResult data={result.data} />
              ) : (
                <TenResult data={result.data} />
              )}

              <div className="mt-4 text-[11px] text-text-dim space-y-0.5">
                <div>
                  pity:{" "}
                  <span className="text-text">
                    {result.data.newPullCount} pulls
                  </span>
                </div>
                <div>
                  残高:{" "}
                  <span className="text-gold">
                    ◈ {result.data.coinsRemaining.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className="mt-4 w-full py-2 rounded border border-line text-text-dim text-[13px] hover:border-accent hover:text-accent transition-colors"
              >
                [ 閉じる ]
              </button>
            </div>
          </div>
        )}

        <DisclosureModal
          disclosure={disclosure}
          error={disclosureError}
          loading={disclosureLoading}
          onClose={() => setDisclosureOpen(false)}
          open={disclosureOpen}
        />
      </div>
    </MainWrapper>
  );
}

function SingleResult({ data }: { data: SummonOnceResponse }) {
  const display = getSummonItemDisplay(data.itemId, data.assetUrl);
  return (
    <div className={`rounded-lg p-6 text-center ${RARITY_BG[data.rarity]}`}>
      <ItemVisual
        alt={display.name}
        assetUrl={display.assetUrl}
        className="mx-auto mb-2 size-14"
        sizes="56px"
      />
      <div
        className={`text-[20px] font-bold mb-1 ${RARITY_COLOR[data.rarity]}`}
      >
        {data.rarity}
      </div>
      <div className="text-[15px] text-text">{display.name}</div>
    </div>
  );
}

function TenResult({ data }: { data: SummonTenResponse }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {data.results.map((item, i) => (
        <SummonCard key={`${item.itemId}-${i}`} item={item} />
      ))}
    </div>
  );
}

function SummonCard({ item }: { item: SummonItem }) {
  const display = getSummonItemDisplay(item.itemId, item.assetUrl);
  return (
    <div
      className={`rounded p-2 text-center border border-line ${RARITY_BG[item.rarity]}`}
    >
      <ItemVisual
        alt={display.name}
        assetUrl={display.assetUrl}
        className="mx-auto size-7"
        sizes="28px"
      />
      <div
        className={`text-[10px] font-bold mt-0.5 ${RARITY_COLOR[item.rarity]}`}
      >
        {item.rarity}
      </div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: SummonHistoryEntry }) {
  const display = getSummonItemDisplay(entry.itemId, entry.assetUrl);
  const dt = new Date(entry.pulledAt);
  const label = dt.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-[12px]">
      <ItemVisual
        alt={display.name}
        assetUrl={display.assetUrl}
        className="size-5"
        sizes="20px"
      />
      <span
        className={`w-8 text-center font-semibold ${RARITY_COLOR[entry.rarity]}`}
      >
        {entry.rarity}
      </span>
      <span className="text-text flex-1">{display.name}</span>
      <span className="text-text-faint shrink-0">{label}</span>
    </div>
  );
}
