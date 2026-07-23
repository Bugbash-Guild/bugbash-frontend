"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainWrapper } from "@/components/MainWrapper";
import { SkinMasteryCostTable } from "@/components/forge/SkinMasteryCostTable";
import { SkinMasteryPanel } from "@/components/forge/SkinMasteryPanel";
import { SkinTargetList } from "@/components/forge/SkinTargetList";
import { useAuth } from "@/hooks/useAuth";
import { useForge } from "@/hooks/useForge";
import { useHero } from "@/hooks/useHero";
import { buildForgeCostTable, canUpgradeForge, selectForgeStages } from "@/lib/forge";

export default function ForgePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (selectedSkinId != null && ownedSkins.some((skin) => skin.skinId === selectedSkinId)) {
      return;
    }
    setSelectedSkinId(ownedSkins[0]?.skinId ?? null);
  }, [ownedSkins, selectedSkinId]);

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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="text-[13px] text-text-dim">authenticating…</span>
      </div>
    );
  }

  return (
    <MainWrapper>
      <div className="min-h-full px-5 py-6 sm:px-9">
        <div className="text-[13px] text-text-dim">
          <span className="text-accent">{user?.username ?? "hero"}@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/forge</span>
          <span className="text-text-faint">$ </span>
          <span className="text-text">./skin-mastery --track=monster</span>
          <span className="ml-1 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
        </div>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.12em] text-text-faint">COSMETIC FORGE</p>
            <h1 className="mt-1 text-[24px] font-semibold text-text">スキン工房</h1>
            <p className="mt-1 text-[12px] text-text-dim">
              所有済みスキンの外観を段階的に調律します。
            </p>
          </div>
          <div className="border border-line bg-bg-elev px-3 py-2 text-[11px]">
            <span className="text-text-faint">RUNES </span>
            <span className="font-semibold text-accent">
              {wallet?.runeBalance.toLocaleString("ja-JP") ?? "—"} R
            </span>
          </div>
        </header>

        {notice && (
          <div className="mt-5 border border-accent/30 bg-accent/10 px-3 py-3 text-[11px] text-accent">
            {notice}
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
          <p className="mt-8 text-[12px] text-text-faint">forge definitions loading…</p>
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
              ) : (
                <div className="border border-dashed border-line-strong bg-bg-elev px-5 py-12 text-center text-[12px] text-text-dim">
                  スキンを入手すると、ここで見た目を強化できます。
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
    </MainWrapper>
  );
}
