"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiTool } from "react-icons/fi";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { MintRightList } from "@/components/commemorative/MintRightList";
import { MainWrapper } from "@/components/MainWrapper";
import { WalletBadge } from "@/components/WalletBadge";
import { useAuth } from "@/hooks/useAuth";
import { useCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { useWallet } from "@/hooks/useWallet";
import {
  createMintIdempotencyKeyManager,
  getFirstAllowedRecolor,
  getMintDisplayState,
  getMintPricePresentation,
  isAllowedRecolor,
  mapMintPurchaseFailure,
} from "@/lib/commemorativeMint";
import type {
  CommemorativeMintOffer,
  CommemorativeMintPlate,
  CommemorativeMintRecolor,
} from "@/types/commemorativeMint";

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `commemorative-mint-${Date.now()}`;
}

function buildPreview(
  offer: CommemorativeMintOffer,
  recolor: CommemorativeMintRecolor,
) {
  if (offer.achievedAt == null || offer.achievedAtEstimated == null) return null;

  return {
    achievement: offer.achievement,
    achievedAt: offer.achievedAt,
    achievedAtEstimated: offer.achievedAtEstimated,
    repositoryFullName: offer.repositoryFullName,
    recolor,
  };
}

export default function MintsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { error, loading, offers, refetch } = useCommemorativeMints(isAuthenticated);
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(isAuthenticated);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [selectedRecolor, setSelectedRecolor] = useState<CommemorativeMintRecolor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.achievement === selectedAchievement) ?? null,
    [offers, selectedAchievement],
  );

  useEffect(() => {
    const fallback = offers.find(
      (offer) => getMintDisplayState(offer) === "unlocked",
    ) ?? offers.find((offer) => offer.unlocked);
    if (selectedOffer == null && fallback) {
      setSelectedAchievement(fallback.achievement);
    }
  }, [offers, selectedOffer]);

  useEffect(() => {
    if (selectedOffer == null) return;
    if (!isAllowedRecolor(selectedRecolor ?? "", selectedOffer.allowedRecolors)) {
      setSelectedRecolor(getFirstAllowedRecolor(selectedOffer.allowedRecolors));
    }
  }, [selectedOffer, selectedRecolor]);

  if (authLoading || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-text-dim">authenticating…</div>;
  }

  const unlockedOffers = offers.filter((offer) => offer.unlocked);
  const lockedOffers = offers.filter((offer) => !offer.unlocked);
  const price = selectedOffer && wallet
    ? getMintPricePresentation(selectedOffer, wallet.runeBalance)
    : null;
  const preview = selectedOffer && selectedRecolor
    ? buildPreview(selectedOffer, selectedRecolor)
    : null;
  const selectedState = selectedOffer ? getMintDisplayState(selectedOffer) : "locked";

  function selectOffer(offer: CommemorativeMintOffer) {
    setNotice(null);
    setPurchaseError(null);
    setSelectedAchievement(offer.achievement);
    setSelectedRecolor(getFirstAllowedRecolor(offer.allowedRecolors));
  }

  async function reconcileMintState(options: {
    offers: boolean;
    wallet: boolean;
  }) {
    const refreshes = [
      ...(options.offers ? [refetch()] : []),
      ...(options.wallet ? [refetchWallet()] : []),
    ];
    try {
      await Promise.all(refreshes);
    } catch {
      // Reconciliation is best-effort only. It must never trigger another POST.
    }
  }

  async function purchase() {
    if (
      inFlight ||
      selectedOffer == null ||
      selectedRecolor == null ||
      selectedState !== "unlocked" ||
      !isAllowedRecolor(selectedRecolor, selectedOffer.allowedRecolors)
    ) return;

    setInFlight(true);
    setPurchaseError(null);
    setNotice(null);
    const manager = createMintIdempotencyKeyManager(
      window.sessionStorage,
      createBrowserIdempotencyKey,
    );
    const idempotencyKey = manager.get(selectedOffer.achievement, selectedRecolor);

    try {
      const response = await fetch("/api/commemorative-mints", {
        body: JSON.stringify({
          achievement: selectedOffer.achievement,
          idempotencyKey,
          recolor: selectedRecolor,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const failure = mapMintPurchaseFailure(response.status);
        if (failure.clearIdempotencyKey) {
          manager.clear(selectedOffer.achievement, selectedRecolor);
        }
        if (failure.routeToLogin) {
          router.replace("/login");
          return;
        }
        setPurchaseError(failure.message);
        await reconcileMintState({
          offers: failure.refreshOffers,
          wallet: failure.refreshWallet,
        });
        return;
      }

      const minted = (await response.json()) as CommemorativeMintPlate;
      manager.clear(selectedOffer.achievement, selectedRecolor);
      await reconcileMintState({ offers: true, wallet: true });
      setNotice(`記念プレート ${minted.mintNumber} を鋳造しました。`);
    } catch {
      setPurchaseError("通信結果を確認できません。同じ内容で再試行できます。");
    } finally {
      setInFlight(false);
    }
  }

  return (
    <MainWrapper>
      <div className="mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[13px] text-text-dim">
              <span className="text-accent">hero@bugbash</span><span className="text-text-faint">:</span><span className="text-accent-2">~/mints</span><span className="text-text-faint">$ </span>./commemorate
            </div>
            <h1 className="mt-5 text-[20px] font-semibold text-text">記念鋳造</h1>
            <p className="mt-1 text-[12px] text-text-dim">実績を記念するプレートです。能力値や名声には影響しません。</p>
          </div>
          <WalletBadge enabled={isAuthenticated} />
        </header>

        {error && <div className="mt-5 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">鋳造権を読み込めませんでした。</div>}
        {notice && <div className="mt-5 flex items-center gap-2 border border-accent/30 bg-accent/10 px-3 py-3 text-[12px] text-accent"><FiCheck aria-hidden size={14} />{notice}</div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="earned-mints-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="earned-mints-heading" className="text-[13px] font-semibold text-text">獲得した鋳造権</h2>
              <span className="text-[10px] text-text-faint">いつでも鋳造できます</span>
            </div>
            {loading ? <div className="mt-3 h-32 animate-pulse border border-line bg-bg-elev" /> : unlockedOffers.length ? <div className="mt-3"><MintRightList offers={unlockedOffers} onSelect={selectOffer} selectedAchievement={selectedAchievement} /></div> : <p className="mt-3 border border-line bg-bg-elev p-4 text-[12px] text-text-faint">まだ鋳造可能な実績はありません。</p>}

            <h2 className="mt-6 text-[13px] font-semibold text-text-dim">未達成の実績</h2>
            {lockedOffers.length > 0 && <div className="mt-3"><MintRightList offers={lockedOffers} onSelect={selectOffer} selectedAchievement={selectedAchievement} /></div>}
          </section>

          <section aria-labelledby="mint-preview-heading" className="border border-line bg-bg-elev p-5">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-gold"><FiTool aria-hidden size={14} />MINT PREVIEW</div>
            <h2 id="mint-preview-heading" className="mt-2 text-[17px] font-semibold text-text">自動刻印プレート</h2>
            {selectedOffer && preview ? (
              <>
                <CommemorativePlate className="mt-5" plate={selectedOffer.mint ?? preview} />
                {selectedState === "unlocked" && (
                  <>
                    <fieldset className="mt-5">
                      <legend className="text-[11px] text-text-dim">リカラー</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedOffer.allowedRecolors.map((recolor) => (
                          <button className={[
                            "border px-3 py-1.5 text-[11px]",
                            selectedRecolor === recolor ? "border-gold bg-gold/10 text-gold" : "border-line text-text-dim hover:text-text",
                          ].join(" ")} key={recolor} onClick={() => setSelectedRecolor(recolor)} type="button">{recolor}</button>
                        ))}
                      </div>
                    </fieldset>
                    <div className="mt-5 border-y border-line py-3 text-[12px] text-text-dim">
                      <div className="flex justify-between"><span>鋳造費用</span><span className="text-text">{price?.text ?? "取得中"}</span></div>
                      <div className="mt-1 flex justify-between"><span>ルーン残高</span><span className="text-text">{wallet?.runeBalance.toLocaleString("ja-JP") ?? "—"}</span></div>
                    </div>
                    {purchaseError && <p className="mt-3 text-[11px] text-pink">{purchaseError}</p>}
                    <button className="mt-5 w-full border border-gold bg-gold/10 px-4 py-2 text-[12px] font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-40" disabled={inFlight || walletLoading || price?.affordable !== true} onClick={() => void purchase()} type="button">{inFlight ? "鋳造中…" : price?.affordable === false ? "ルーンが不足しています" : "このプレートを鋳造"}</button>
                  </>
                )}
                {selectedState === "minted" && <p className="mt-5 text-[12px] text-accent">この実績のプレートは鋳造済みです。</p>}
              </>
            ) : <p className="mt-5 text-[12px] text-text-faint">鋳造可能な実績を選択してください。</p>}
          </section>
        </div>
      </div>
    </MainWrapper>
  );
}
