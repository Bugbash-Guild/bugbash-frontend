"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { InlineActionResult } from "@/components/InlineActionResult";
import { SkinMasteryCostTable } from "@/components/forge/SkinMasteryCostTable";
import { BalanceShortfall } from "@/components/BalanceShortfall";
import { SkinMasteryPanel } from "@/components/forge/SkinMasteryPanel";
import { SkinTargetList } from "@/components/forge/SkinTargetList";
import { TermLoading } from "@/components/TermLoading";
import { useAuth } from "@/hooks/useAuth";
import { useForge } from "@/hooks/useForge";
import { useHero } from "@/hooks/useHero";
import { buildForgeCostTable, canUpgradeForge, selectForgeStages } from "@/lib/forge";

export default function ForgePage() {
  const { isAuthenticated } = useAuth();
  const { hero } = useHero(isAuthenticated);
  const {
    error,
    levelDefs,
    loading,
    mutationError,
    ownedSkins,
    refetch,
    upgradingSkinId,
    upgrade,
    wallet,
  } = useForge(isAuthenticated);
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const skinParamAppliedRef = useRef(false);
  // ?skin= はスキン起点（カタログ詳細・図鑑のコスメバッジ）からの到達。
  // スキン詳細は固有URLを持たない（カタログ内モーダル）ため、復路は一覧へ。
  const arrivedFromSkin = searchParams.get("skin") != null;

  // 選択の一元的な調停: 現在の選択が有効ならそのまま。無効なら、
  // 初回に限り ?skin= クエリを優先し（monsters のコスメバッジからの遷移）、
  // それ以外は先頭を自動選択する。2つの effect に分けると同一レンダーで
  // 自動選択がクエリ適用を上書きし得るため、1つの effect に統合している。
  useEffect(() => {
    if (selectedSkinId != null && ownedSkins.some((skin) => skin.skinId === selectedSkinId)) {
      return;
    }
    if (ownedSkins.length === 0) {
      if (selectedSkinId != null) setSelectedSkinId(null);
      return;
    }
    if (!skinParamAppliedRef.current) {
      skinParamAppliedRef.current = true;
      const requested = searchParams.get("skin");
      if (requested && ownedSkins.some((skin) => skin.skinId === requested)) {
        setSelectedSkinId(requested);
        return;
      }
    }
    setSelectedSkinId(ownedSkins[0].skinId);
  }, [ownedSkins, selectedSkinId, searchParams]);

  const selectedSkin = ownedSkins.find((skin) => skin.skinId === selectedSkinId) ?? null;
  const costRows = useMemo(() => buildForgeCostTable(levelDefs), [levelDefs]);
  const stages = useMemo(
    () => selectForgeStages(levelDefs, selectedSkin?.masteryLevel ?? 0),
    [levelDefs, selectedSkin?.masteryLevel],
  );
  const upgradeDisabled =
    selectedSkin == null ||
    wallet == null ||
    !canUpgradeForge({
      currentRank: selectedSkin?.masteryLevel ?? 0,
      expectedRank: selectedSkin?.masteryLevel ?? -1,
      isOwned: selectedSkin != null,
      next: stages.next,
      runeBalance: wallet?.runeBalance ?? 0,
    }) ||
    upgradingSkinId != null;

  async function handleUpgrade() {
    if (selectedSkin == null || upgradeDisabled) return;

    const result = await upgrade(selectedSkin);
    if (result) {
      setNotice(`${selectedSkin.lineName}をSt${result.forgeRank}に強化しました。`);
    }
  }


  return (
    <>
      <ConsoleTopbar command="./skin-mastery --track=monster" path="~/forge" showWallet />
      <div className="min-h-full px-5 py-6 sm:px-9">
        {arrivedFromSkin && (
          <nav aria-label="パンくず" className="mb-3 text-[11px]">
            <Link
              className="text-text-dim underline underline-offset-4 hover:text-text"
              href="/shop/skins"
            >
              ← スキン一覧へ
            </Link>
          </nav>
        )}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.12em] text-text-faint">COSMETIC FORGE</p>
            <h1 className="mt-1 text-[24px] font-semibold text-text">スキン工房</h1>
            <p className="mt-1 text-[12px] text-text-dim">
              所有済みスキンの外観を段階的に調律します。
            </p>
          </div>
        </header>

        {/* 強化の成否は「起きたことの確定表示」なので、他画面と同じ
            InlineActionResult に寄せる（role="status" / aria-live が付き、
            読み上げにも乗る。以前はただの div で無音だった） */}
        {notice && (
          <div className="mt-5">
            <InlineActionResult title={notice} tone="success" />
          </div>
        )}
        {error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] text-pink">
            <span>工房情報を取得できませんでした。</span>
            <button className="text-text underline underline-offset-4 hover:text-accent" onClick={() => void refetch()} type="button">
              再読み込み
            </button>
          </div>
        )}
        {mutationError?.action === "refresh" && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-accent-2/30 bg-accent-2/10 px-3 py-3 text-[11px] text-accent-2">
            <span>{mutationError.message}</span>
            <button className="text-text underline underline-offset-4 hover:text-accent" onClick={() => void refetch()} type="button">
              情報を再読み込み
            </button>
          </div>
        )}

        {loading && ownedSkins.length === 0 ? (
          // 待ちの表現をアプリ全体（TermLoading）に揃える
          <TermLoading className="mt-8" lines={["query forge.levels", "query skins --owned"]} />
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <SkinTargetList
              onSelect={(skinId) => {
                setNotice(null);
                setSelectedSkinId(skinId);
              }}
              selectedSkinId={selectedSkinId}
              skins={ownedSkins}
            />
            <div className="min-w-0">
              {selectedSkin ? (
                <>
                  <SkinMasteryPanel
                    apex={stages.apex}
                    current={stages.current}
                    disabled={upgradeDisabled}
                    error={mutationError?.action === "refresh" ? null : mutationError?.message ?? null}
                    next={stages.next}
                    onUpgrade={() => void handleUpgrade()}
                    skin={selectedSkin}
                    totalPrsMerged={hero?.totalPrsMerged ?? 0}
                    upgrading={upgradingSkinId === selectedSkin.skinId}
                  />
                  {stages.next != null &&
                    wallet != null &&
                    wallet.runeBalance < stages.next.runeCost && (
                      <div className="mt-3">
                        <BalanceShortfall
                          balance={wallet.runeBalance}
                          currency="rune"
                          required={stages.next.runeCost}
                        />
                      </div>
                    )}
                </>
              ) : (
                // スキンが1つも無いと、この画面は何も操作できない行き止まりになる。
                // 入手先（カタログ）への出口を同じ場所に置く。CTA は緑（名声圏）を
                // 使わず、コスメ＝琥珀のトーンのままにしておく
                <div className="border border-dashed border-line-strong bg-bg-elev px-5 py-12 text-center">
                  <p className="text-[12px] text-text-dim">
                    スキンを入手すると、ここで見た目を強化できます。
                  </p>
                  <Link
                    className="mt-3 inline-flex min-h-9 items-center rounded-[4px] border border-rune-border bg-rune-bg px-4 text-[12px] font-semibold text-rune transition-[filter] hover:brightness-125"
                    href="/shop/skins"
                  >
                    スキン一覧を見る →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5">
          <SkinMasteryCostTable rows={costRows} />
        </div>
        <p className="mt-4 text-[10px] text-text-faint">
          ルーンが不足している場合は <Link className="text-accent underline underline-offset-4" href="/shop/runes">ルーンショップ</Link> を確認してください。
        </p>
      </div>
    </>
  );
}
