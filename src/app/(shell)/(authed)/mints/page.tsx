"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiTool } from "react-icons/fi";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { MintRightList } from "@/components/commemorative/MintRightList";
import { BalanceShortfall } from "@/components/BalanceShortfall";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { InlineActionResult } from "@/components/InlineActionResult";
import { useAuth } from "@/hooks/useAuth";
import { useCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { useWallet } from "@/hooks/useWallet";
import {
  createMintIdempotencyKeyManager,
  formatMintNumber,
  getAchievementLabel,
  getAchievementRequirement,
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
  const { isAuthenticated, user } = useAuth();
  const { error, loading, offers, refetch } = useCommemorativeMints(isAuthenticated);
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(isAuthenticated);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [selectedRecolor, setSelectedRecolor] = useState<CommemorativeMintRecolor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);
  // 即POSTしない: 費用と残高の変化を見せてから鋳造する（事実開示の確認ステップ）
  const [confirming, setConfirming] = useState(false);


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

  useEffect(() => {
    if (!confirming) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !inFlight) setConfirming(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, inFlight]);

  // 鋳造したプレートが並ぶ自分のプロフィール棚。githubId が取れない間は
  // リンクを組めないので出さない（存在しない宛先へ誘導しない）。
  const selfShelfHref = user?.githubId ? `/heroes/${user.githubId}` : null;

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
      setConfirming(false);
      setNotice(`記念プレート ${formatMintNumber(minted.mintNumber)} を鋳造しました。`);
    } catch {
      setPurchaseError("通信結果を確認できません。同じ内容で再試行できます。");
    } finally {
      setInFlight(false);
    }
  }

  return (
    <>
      <ConsoleTopbar command="./commemorate" path="~/mints" showWallet />
      <div className="mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-text">記念鋳造</h1>
            <p className="mt-1 text-[12px] text-text-dim">実績を記念するプレートです。能力値や名声には影響しません。</p>
          </div>
        </header>

        {error && <div className="mt-5 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">鋳造権を読み込めませんでした。</div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="earned-mints-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="earned-mints-heading" className="text-[13px] font-semibold text-text">獲得した鋳造権</h2>
              <span className="text-[10px] text-text-faint">いつでも鋳造できます</span>
            </div>
            {loading ? <div className="mt-3 h-32 animate-pulse border border-line bg-bg-elev" /> : unlockedOffers.length ? <div className="mt-3"><MintRightList offers={unlockedOffers} onSelect={selectOffer} selectedAchievement={selectedAchievement} /></div> : <p className="mt-3 border border-line bg-bg-elev p-4 text-[12px] text-text-faint">まだ鋳造可能な実績はありません。</p>}

            <h2 className="mt-6 text-[13px] font-semibold text-text-dim">未達成の実績</h2>
            {lockedOffers.length > 0 && (
              <>
                <div className="mt-3"><MintRightList offers={lockedOffers} onSelect={selectOffer} selectedAchievement={selectedAchievement} /></div>
                {/* 未達成は選べない代わりに、達成条件の事実をその場に開示する */}
                <ul className="mt-2 space-y-1 text-[10px] leading-5 text-text-faint">
                  {lockedOffers.map((offer) => (
                    <li key={offer.achievement}>
                      {getAchievementLabel(offer.achievement)} — {getAchievementRequirement(offer.achievement)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="mint-preview-heading" className="border border-line bg-bg-elev p-5">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-gold"><FiTool aria-hidden size={14} />MINT PREVIEW</div>
            <h2 id="mint-preview-heading" className="mt-2 text-[17px] font-semibold text-text">自動刻印プレート</h2>
            {notice && (
              /* 完了は操作した場所の隣で告げ、飾った棚への出口を付ける */
              <div className="mt-4">
                <InlineActionResult
                  action={selfShelfHref ? { href: selfShelfHref, label: "プロフィールの棚で見る" } : undefined}
                  title="鋳造が完了しました"
                  tone="success"
                >
                  {notice}
                </InlineActionResult>
              </div>
            )}
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
                    {price?.affordable === false && (
                      <div className="mt-3">
                        <BalanceShortfall
                          balance={wallet?.runeBalance}
                          currency="rune"
                          required={selectedOffer.runeCost}
                        />
                      </div>
                    )}
                    <button
                      className="mt-5 w-full border border-gold bg-gold/10 px-4 py-2 text-[12px] font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={inFlight || walletLoading || price?.affordable !== true}
                      onClick={() => {
                        setPurchaseError(null);
                        setConfirming(true);
                      }}
                      type="button"
                    >
                      {inFlight ? "鋳造中…" : price?.affordable === false ? "ルーンが不足しています" : "このプレートを鋳造"}
                    </button>
                  </>
                )}
                {selectedState === "minted" && !notice && <p className="mt-5 text-[12px] text-accent">この実績のプレートは鋳造済みです。</p>}
              </>
            ) : selectedOffer && selectedState === "locked" ? (
              /* 未達成の対象が選ばれた場合: 事実（鋳造不可）と達成条件のみを述べる */
              <div className="mt-5 text-[12px] text-text-dim">
                <p>「{getAchievementLabel(selectedOffer.achievement)}」は未達成のため鋳造できません。</p>
                <p className="mt-1 text-[11px] text-text-faint">
                  達成条件: {getAchievementRequirement(selectedOffer.achievement)}
                </p>
              </div>
            ) : <p className="mt-5 text-[12px] text-text-faint">鋳造可能な実績を選択してください。</p>}
          </section>
        </div>
      </div>

      {/* 鋳造確認モーダル: 実費用と、引かれる前後の残高を事実として見せてから実行する */}
      {confirming && selectedOffer && selectedRecolor && (
        <div
          aria-labelledby="mint-confirm-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            if (!inFlight) setConfirming(false);
          }}
          role="dialog"
        >
          <div
            className="w-full max-w-md border border-line bg-bg-elev p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[10px] tracking-[0.12em] text-gold">MINT CONFIRM</p>
            <h2 className="mt-1 text-[15px] font-semibold text-text" id="mint-confirm-title">
              記念プレートを鋳造しますか?
            </h2>
            <p className="mt-1 text-[11px] text-text-dim">
              {getAchievementLabel(selectedOffer.achievement)} ・ リカラー {selectedRecolor}
            </p>
            <div className="mt-4 border-y border-line py-3 text-[12px] text-text-dim">
              <div className="flex justify-between gap-3">
                <span>鋳造費用</span>
                <span className="text-text">{selectedOffer.runeCost.toLocaleString("ja-JP")} ルーン</span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span>現在の残高</span>
                <span className="text-text">
                  {wallet != null ? `${wallet.runeBalance.toLocaleString("ja-JP")} ルーン` : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span>鋳造後の残高</span>
                <span className="text-text">
                  {wallet != null && wallet.runeBalance >= selectedOffer.runeCost
                    ? `${(wallet.runeBalance - selectedOffer.runeCost).toLocaleString("ja-JP")} ルーン`
                    : "—"}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-text-faint">
              プレートは実績の記念品です。能力値や名声には影響しません。
            </p>
            {purchaseError && <p className="mt-3 text-[11px] text-pink">{purchaseError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="border border-line px-3 py-2 text-[12px] text-text-dim hover:text-text"
                disabled={inFlight}
                onClick={() => setConfirming(false)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="border border-gold bg-gold/10 px-4 py-2 text-[12px] font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-40"
                disabled={inFlight || (wallet != null && wallet.runeBalance < selectedOffer.runeCost)}
                onClick={() => void purchase()}
                type="button"
              >
                {inFlight ? "鋳造中…" : "鋳造する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
