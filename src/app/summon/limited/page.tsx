"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DisclosureModal } from "@/components/billing/DisclosureModal";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { LimitedPullConfirmModal } from "@/components/summon/LimitedPullConfirmModal";
import {
  LimitedSummonResultModal,
  type LimitedResultDisplay,
} from "@/components/summon/LimitedSummonResultModal";
import { PityMeter } from "@/components/summon/PityMeter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useLimitedSummon } from "@/hooks/useLimitedSummon";
import { usePityCounter } from "@/hooks/usePityCounter";
import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { useSummonHistory } from "@/hooks/useSummonHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import {
  buildLimitedPullConfirmation,
  buildLimitedStockPolicyCopy,
  fetchLimitedSummonHistory,
  findAddedLimitedHistoryEntries,
  getFeaturedLimitedItem,
  LimitedSummonHttpError,
  type LimitedPullCount,
} from "@/lib/limitedSummon";
import { selectEffectivePityDisclosure } from "@/lib/summonPity";
import { getSummonItemDisplay } from "../summonDisplay";

export default function LimitedSummonPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    disclosure,
    error: disclosureError,
    loading: disclosureLoading,
  } = useSummonDisclosure(isAuthenticated, "limited");
  const {
    pity,
    error: pityError,
    refetch: refetchPity,
  } = usePityCounter(isAuthenticated, "limited");
  const {
    entries: historyEntries,
    error: historyError,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useSummonHistory(isAuthenticated, "limited");
  const {
    wallet,
    error: walletError,
    loading: walletLoading,
    refetch: refetchWallet,
  } = useWallet(isAuthenticated);
  const {
    subscription,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(isAuthenticated);
  const {
    error: pullError,
    loading: summoning,
    pull,
    reset,
  } = useLimitedSummon();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationMessage, setReconciliationMessage] = useState<
    string | null
  >(null);
  const [result, setResult] = useState<LimitedResultDisplay | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const featured = disclosure ? getFeaturedLimitedItem(disclosure) : null;
  const effectiveDisclosure =
    disclosure && subscription
      ? selectEffectivePityDisclosure(disclosure, subscription.entitled)
      : null;
  const featuredDisplay = featured
    ? getSummonItemDisplay(featured.itemId, featured.assetUrl)
    : null;
  const singleConfirmation =
    disclosure && wallet
      ? buildLimitedPullConfirmation(disclosure, wallet.runeBalance, 1)
      : null;
  const tenConfirmation =
    disclosure && wallet
      ? buildLimitedPullConfirmation(disclosure, wallet.runeBalance, 10)
      : null;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-[13px] text-text-dim">
          <span className="size-4 animate-spin rounded-full border border-accent border-t-transparent" />
          authenticating…
        </div>
      </div>
    );
  }

  const prerequisiteError =
    disclosureError ?? walletError ?? historyError ?? subscriptionError;
  const busy = summoning || reconciling || result != null;
  const dataReady =
    disclosure != null &&
    wallet != null &&
    !disclosureLoading &&
    !walletLoading &&
    !historyLoading &&
    !subscriptionLoading &&
    subscription != null &&
    prerequisiteError == null;

  async function refreshLimitedState() {
    await Promise.all([refetchPity(), refetchHistory(), refetchWallet()]);
  }

  async function reconcileUnknownResult(
    before: typeof historyEntries,
    pullCount: LimitedPullCount,
  ) {
    setReconciling(true);
    try {
      const after = await fetchLimitedSummonHistory(fetch);
      const added = findAddedLimitedHistoryEntries(before, after, pullCount);
      reset();
      if (!added) {
        setReconciliationMessage(
          "限定召喚履歴に新しい結果はありませんでした。残高を確認してから、もう一度お試しください。",
        );
        await refreshLimitedState();
        return;
      }

      setResult({
        items: added,
        reconciled: true,
      });
      await refreshLimitedState();
    } catch {
      reset();
      setReconciliationMessage(
        "召喚結果を確認できません。自動では再実行しません。時間をおいて履歴と残高をご確認ください。",
      );
    } finally {
      setReconciling(false);
    }
  }

  async function handlePull(pullCount: LimitedPullCount) {
    const historySnapshot = historyEntries;
    reset();
    setReconciliationMessage(null);
    try {
      const response = await pull(pullCount);
      setResult({
        items: response.results,
        newPullCount: response.newPullCount,
        reconciled: false,
        runesRemaining: response.runesRemaining,
      });
      await refreshLimitedState();
    } catch (cause) {
      if (!(cause instanceof LimitedSummonHttpError)) {
        await reconcileUnknownResult(historySnapshot, pullCount);
      }
    }
  }

  async function handleConfirmTen() {
    try {
      await handlePull(10);
    } finally {
      setConfirmOpen(false);
    }
  }

  return (
    <MainWrapper>
      <ConsoleTopbar command="./summon --currency=rune --limited" path="~/summon/limited" showWallet />
      <div className="min-h-screen px-5 py-6 sm:px-9">
        <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px]">
          <Link className="text-text-dim hover:text-accent" href="/summon">
            通常召喚へ
          </Link>
          <span className="text-text-faint">/</span>
          <button
            className="text-accent hover:underline"
            onClick={() => setDisclosureOpen(true)}
            type="button"
          >
            提供割合について
          </button>
        </div>

        <div className="grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="space-y-5">
            <section className="border border-gold/40 bg-bg-elev">
              <div className="border-b border-line px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-gold">
                LIMITED BANNER
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[112px_minmax(0,1fr)]">
                <div className="flex aspect-square items-center justify-center border border-line bg-bg">
                  <ItemVisual
                    alt={featuredDisplay?.name ?? "限定召喚の目玉アイテム"}
                    assetUrl={featuredDisplay?.assetUrl}
                    className="size-20"
                    priority
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-text-faint">
                    FEATURED SSR
                  </div>
                  <h1 className="mt-1 break-words text-[20px] font-semibold text-text">
                    {disclosure?.name ?? "限定召喚"}
                  </h1>
                  <p className="mt-2 text-[12px] leading-5 text-text-dim">
                    {disclosure?.description ??
                      "限定プールの情報を読み込んでいます。"}
                  </p>
                  {featuredDisplay && (
                    <div className="mt-3 text-[12px] text-gold">
                      目玉: {featuredDisplay.name}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-text-faint">
                    提供期間: 開催情報は運営告知をご確認ください。
                  </div>
                  {disclosure && (
                    <div className="mt-2 text-[11px] text-text-faint">
                      {buildLimitedStockPolicyCopy(disclosure.stockPolicy)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <PityMeter
              disclosure={effectiveDisclosure}
              error={pityError ?? disclosureError ?? subscriptionError}
              loading={disclosureLoading || subscriptionLoading}
              pity={pity}
            />

            {prerequisiteError && (
              <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] leading-5 text-pink">
                召喚情報を取得できないため、現在は召喚できません。再読み込みしてお試しください。
              </div>
            )}

            {(pullError || reconciliationMessage) && (
              <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] leading-5 text-pink">
                {pullError?.message ?? reconciliationMessage}
                {pullError?.showRuneTopUpLink && (
                  <Link
                    className="ml-3 text-text underline-offset-4 hover:underline"
                    href="/shop/runes"
                  >
                    ルーンを購入する
                  </Link>
                )}
              </div>
            )}

            {reconciling && (
              <div className="border border-accent/30 bg-accent/10 px-3 py-3 text-[12px] text-accent">
                結果を確認しています。自動で再実行はしません。
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="min-h-16 border border-accent px-4 py-3 text-left text-[13px] text-accent hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!dataReady || !singleConfirmation?.canAfford || busy}
                onClick={() => handlePull(1)}
                type="button"
              >
                <span className="block font-semibold">[ 召喚 × 1 ]</span>
                <span className="mt-1 block text-[11px] opacity-80">
                  {singleConfirmation?.costLabel ?? "コスト確認中"}
                </span>
              </button>
              <button
                className="min-h-16 border border-gold px-4 py-3 text-left text-[13px] text-gold hover:bg-gold hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!dataReady || !tenConfirmation?.canAfford || busy}
                onClick={() => setConfirmOpen(true)}
                type="button"
              >
                <span className="block font-semibold">[ 10連召喚 ]</span>
                <span className="mt-1 block text-[11px] opacity-80">
                  {tenConfirmation?.costLabel ?? "10連は未提供"}
                </span>
              </button>
            </div>

            {wallet &&
              ((singleConfirmation && !singleConfirmation.canAfford) ||
                (tenConfirmation && !tenConfirmation.canAfford)) && (
                <div className="text-[12px] text-pink">
                  {singleConfirmation && !singleConfirmation.canAfford
                    ? "ルーンが足りません。"
                    : "10連分のルーンが足りません。"}
                  <Link
                    className="ml-2 text-text underline-offset-4 hover:underline"
                    href="/shop/runes"
                  >
                    ルーンを購入する
                  </Link>
                </div>
              )}
          </div>

          <aside className="border border-line bg-bg-elev p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.12em] text-text-faint">
              RECENT LIMITED PULLS
            </div>
            {historyLoading ? (
              <div className="py-8 text-center text-[12px] text-text-faint">
                履歴を確認中…
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-text-faint">
                限定召喚履歴はまだありません
              </div>
            ) : (
              <div>
                {historyEntries.map((entry, index) => {
                  const display = getSummonItemDisplay(
                    entry.itemId,
                    entry.assetUrl,
                  );
                  return (
                    <div
                      className="flex items-center gap-3 border-b border-line py-2 last:border-b-0"
                      key={`${entry.itemId}-${entry.pulledAt}-${index}`}
                    >
                      <ItemVisual
                        alt={display.name}
                        assetUrl={display.assetUrl}
                        className="size-7"
                        sizes="28px"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] text-text">
                          {display.name}
                        </div>
                        <div className="text-[10px] text-text-faint">
                          {new Date(entry.pulledAt).toLocaleString("ja-JP")}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gold">
                        {entry.rarity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

        <LegalFooter />
      </div>

      <DisclosureModal
        disclosure={disclosure}
        error={disclosureError}
        loading={disclosureLoading}
        onClose={() => setDisclosureOpen(false)}
        open={disclosureOpen}
      />

      {confirmOpen && tenConfirmation && (
        <LimitedPullConfirmModal
          confirmation={tenConfirmation}
          loading={summoning}
          onCancel={() => {
            if (!summoning) setConfirmOpen(false);
          }}
          onConfirm={handleConfirmTen}
        />
      )}

      {result && (
        <LimitedSummonResultModal
          onClose={() => setResult(null)}
          result={result}
        />
      )}
    </MainWrapper>
  );
}
