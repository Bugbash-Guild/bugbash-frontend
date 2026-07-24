"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GameAssetFallback } from "@/components/GameAssetFallback";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useMonsters } from "@/hooks/useMonsters";
import { usePurchase } from "@/hooks/usePurchase";
import { useSkinCatalog } from "@/hooks/useSkinCatalog";
import { useWallet } from "@/hooks/useWallet";
import {
  buildSkinArtworkComparison,
  buildSkinCatalogLines,
  buildSkinRevivalSchedule,
} from "@/lib/skinCatalog";
import type {
  MonsterSkinCatalogItem,
  PresentedSkinCatalogItem,
  SkinTier,
} from "@/lib/skinCatalog";

const TIER_CLASSES: Record<SkinTier, string> = {
  STD: "border-[#687974] bg-[#687974]/10 text-[#9db0aa]",
  DX: "border-[#8fa9ae] bg-[#8fa9ae]/10 text-[#b9d2d6]",
  LG: "border-[#c6a76a] bg-[#c6a76a]/10 text-[#e0c38a]",
};

function SkinArtwork({
  alt,
  label,
  src,
}: {
  alt: string;
  label: string;
  src: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] tracking-[0.1em] text-text-faint">{label}</p>
      <div className="relative aspect-square overflow-hidden border border-line bg-bg">
        {failed ? (
          <GameAssetFallback
            alt={alt}
            className="absolute inset-0 size-full"
            kind="monster"
          />
        ) : (
          <Image
            alt={alt}
            className="object-contain p-1"
            fill
            onError={() => setFailed(true)}
            sizes="(max-width: 640px) 36vw, 150px"
            src={src}
          />
        )}
      </div>
    </div>
  );
}

function ArtworkComparison({
  assetBasePath,
  lineName,
}: Pick<MonsterSkinCatalogItem, "assetBasePath" | "lineName">) {
  const artwork = buildSkinArtworkComparison(
    assetBasePath,
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? null,
  );

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <SkinArtwork alt={`${lineName} 変身前`} label="変身前" src={artwork.before} />
      <span aria-hidden className="text-[14px] text-text-faint">
        →
      </span>
      <SkinArtwork alt={`${lineName} 変身後`} label="変身後" src={artwork.after} />
    </div>
  );
}

export default function SkinCatalogPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    error,
    loading,
    ownedSkins,
    refetch,
    setEquipped,
    skins,
  } = useSkinCatalog(isAuthenticated);
  const { monsters } = useMonsters();
  const { wallet, refetch: refetchWallet } = useWallet(isAuthenticated);
  const {
    error: purchaseError,
    loading: purchasing,
    purchase,
    reset: resetPurchase,
  } = usePurchase();
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);
  const [confirmingPurchase, setConfirmingPurchase] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const monsterNames = useMemo(
    () =>
      new Map(
        monsters.map((monster) => [
          monster.slug ?? monster.id,
          monster.name,
        ]),
      ),
    [monsters],
  );
  const ownedMonsterSlugs = useMemo(
    () =>
      new Set(
        monsters
          .filter((monster) => monster.isOwned)
          .map((monster) => monster.slug ?? monster.id),
      ),
    [monsters],
  );
  const lines = useMemo(
    () => buildSkinCatalogLines(skins, ownedSkins, ownedMonsterSlugs),
    [ownedMonsterSlugs, ownedSkins, skins],
  );
  const revivalSchedule = useMemo(
    () => buildSkinRevivalSchedule(skins),
    [skins],
  );
  const selected =
    lines
      .flatMap((line) => line.skins)
      .find((skin) => skin.skinId === selectedSkinId) ?? null;

  function closeDetails() {
    if (purchasing || equipping) return;
    setSelectedSkinId(null);
    setConfirmingPurchase(false);
    setActionError(null);
    resetPurchase();
  }

  async function handlePurchase(skin: PresentedSkinCatalogItem) {
    try {
      await purchase(skin.skinId);
      await Promise.all([refetch(), refetchWallet()]);
      setConfirmingPurchase(false);
    } catch {
      // usePurchase exposes the response error in the confirmation panel.
    }
  }

  async function handleEquip(skin: PresentedSkinCatalogItem) {
    setEquipping(true);
    setActionError(null);
    try {
      await setEquipped(skin, skin.equipped);
    } catch {
      setActionError(
        skin.equipped
          ? "装備を外せませんでした。状態を確認して、もう一度操作してください。"
          : "装備できませんでした。状態を確認して、もう一度操作してください。",
      );
    } finally {
      setEquipping(false);
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-[13px] text-text-dim">
        authenticating…
      </div>
    );
  }

  return (
    <MainWrapper mobileFullWidth>
      <ConsoleTopbar command="./catalog --group=line --demand-first" path="~/shop/skins" showWallet />
      <div className="min-h-full px-5 py-6 sm:px-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.14em] text-text-faint">
              COSMETIC ARCHIVE
            </p>
            <h1 className="mt-1 text-[24px] font-semibold text-text">
              スキンカタログ
            </h1>
            <p className="mt-1 text-[12px] text-text-dim">
              所有モンスターに使える外装から先に表示します。強さや報酬は変わりません。
            </p>
          </div>
          <nav aria-label="ショップ種別" className="flex border border-line text-[11px]">
            <Link className="px-3 py-2 text-text-dim hover:text-text" href="/shop/runes">
              RUNES
            </Link>
            <span aria-current="page" className="border-x border-line bg-bg-elev-2 px-3 py-2 text-accent-2">
              SKINS
            </span>
            <Link className="px-3 py-2 text-text-dim hover:text-text" href="/shop">
              ITEMS
            </Link>
          </nav>
        </header>

        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] text-pink">
            <span>スキンカタログを取得できませんでした。</span>
            <button className="text-text underline underline-offset-4" onClick={() => void refetch()} type="button">
              再読み込み
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-[12px] text-text-faint">loading skin archive…</p>
        ) : lines.length === 0 ? (
          <div className="border border-dashed border-line-strong bg-bg-elev px-5 py-12 text-center text-[12px] text-text-dim">
            公開中のスキンはありません。
          </div>
        ) : (
          <div className="space-y-7">
            {lines.map((line) => (
              <section aria-labelledby={`line-${line.lineName}`} key={line.lineName}>
                <div className="mb-3 border-b border-line pb-3">
                  <p className="text-[9px] tracking-[0.12em] text-text-faint">SKIN LINE</p>
                  <h2 className="mt-1 text-[16px] font-semibold text-text" id={`line-${line.lineName}`}>
                    {line.lineName}
                  </h2>
                  <p className="mt-1 text-[10px] text-text-faint">
                    外装プロファイルを読み込み、変身の前後を比較します。
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {line.skins.map((skin) => (
                    <button
                      className={[
                        "border bg-bg-elev p-4 text-left transition-colors hover:bg-bg-elev-2",
                        skin.targetMonsterOwned
                          ? "border-line"
                          : "border-line/60 opacity-55 hover:opacity-80",
                      ].join(" ")}
                      key={skin.skinId}
                      onClick={() => {
                        setSelectedSkinId(skin.skinId);
                        setConfirmingPurchase(false);
                        setActionError(null);
                        resetPurchase();
                      }}
                      type="button"
                    >
                      <ArtworkComparison
                        assetBasePath={skin.assetBasePath}
                        lineName={skin.lineName}
                      />
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-text">
                            {monsterNames.get(skin.monsterSlug) ?? skin.monsterSlug}
                          </p>
                          <p className="mt-1 text-[9px] text-text-faint">
                            初出 {skin.initialReleaseMonth}
                          </p>
                        </div>
                        <span className={`shrink-0 border px-2 py-0.5 text-[9px] ${TIER_CLASSES[skin.tier]}`}>
                          {skin.tier}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                        <span className="text-[13px] font-semibold text-accent">
                          {skin.priceRune.toLocaleString("ja-JP")} R
                        </span>
                        {skin.owned ? (
                          <span className="text-[10px] text-accent">✓ 所有済み · St{skin.masteryLevel}</span>
                        ) : (
                          <span className="text-[10px] text-text-faint">詳細を見る →</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <section aria-labelledby="revival-heading" className="mt-8 border-y border-line bg-bg-elev px-4 py-4">
          <p className="text-[9px] tracking-[0.12em] text-text-faint">RETURN SCHEDULE</p>
          <h2 className="mt-1 text-[13px] font-semibold text-text" id="revival-heading">
            復刻カレンダー
          </h2>
          <p className="mt-1 text-[10px] leading-5 text-text-dim">
            初出時に案内された復刻月を、同一価格の予定として表示しています。
          </p>
          {revivalSchedule.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {revivalSchedule.map((entry) => (
                <span className="border border-line-strong bg-bg px-2.5 py-1.5 text-[10px] text-text-dim" key={`${entry.skinId}-${entry.revivalMonth}`}>
                  {entry.revivalMonth} · {entry.lineName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[10px] text-text-faint">復刻月が決まったラインはここに追加されます。</p>
          )}
        </section>

        <LegalFooter />
      </div>

      {selected && (
        <div
          aria-labelledby="skin-detail-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={closeDetails}
          role="dialog"
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-y-auto border border-line-strong bg-bg-elev p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] tracking-[0.12em] text-text-faint">FULL PREVIEW</p>
                <h2 className="mt-1 text-[19px] font-semibold text-text" id="skin-detail-title">
                  {selected.lineName}
                </h2>
                <p className="mt-1 text-[11px] text-text-dim">
                  {monsterNames.get(selected.monsterSlug) ?? selected.monsterSlug}
                </p>
              </div>
              <span className={`border px-2 py-1 text-[10px] ${TIER_CLASSES[selected.tier]}`}>
                {selected.tier}
              </span>
            </div>

            <div className="mt-5">
              <ArtworkComparison
                assetBasePath={selected.assetBasePath}
                lineName={selected.lineName}
              />
            </div>
            <p className="mt-4 border-l-2 border-line-strong pl-3 text-[11px] leading-5 text-text-dim">
              外装プロファイル「{selected.skinId}」。見た目だけを差し替え、モンスターの強さ・報酬・名声表示には影響しません。
            </p>
            <div className="mt-4 grid gap-2 border-y border-line py-3 text-[10px] text-text-dim sm:grid-cols-2">
              <p>初出 {selected.initialReleaseMonth}</p>
              <p>
                {selected.revivalMonth
                  ? `次回復刻 ${selected.revivalMonth}・同一価格`
                  : "次回復刻月は未定"}
              </p>
            </div>

            {actionError && (
              <p className="mt-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[11px] text-pink">
                {actionError}
              </p>
            )}

            {selected.owned ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-accent">✓ 所有済み · St{selected.masteryLevel}</p>
                  <Link className="mt-1 inline-block text-[10px] text-purple underline underline-offset-4" href="/forge">
                    マスタリーで深化 →
                  </Link>
                </div>
                <button
                  className="border border-accent-2/40 bg-accent-2/10 px-4 py-2 text-[11px] text-accent-2 disabled:opacity-45"
                  disabled={equipping}
                  onClick={() => void handleEquip(selected)}
                  type="button"
                >
                  {equipping
                    ? "更新中…"
                    : selected.equipped
                      ? "装備を外す"
                      : "このスキンを装備"}
                </button>
              </div>
            ) : confirmingPurchase ? (
              <div className="mt-5 border border-accent/30 bg-accent/5 p-4">
                <p className="text-[11px] font-semibold text-text">購入内容を確認</p>
                <div className="mt-3 grid gap-2 text-[10px] text-text-dim sm:grid-cols-2">
                  <p>価格 {selected.priceRune.toLocaleString("ja-JP")} R</p>
                  <p>現在残高 {wallet?.runeBalance.toLocaleString("ja-JP") ?? "—"} R</p>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-text-faint">
                  二重クリックを防ぎ、通信エラー時に自動で購入を繰り返しません。
                </p>
                {purchaseError && (
                  <p className="mt-3 text-[10px] text-pink">
                    購入できませんでした。残高と所有状態を確認してください。
                  </p>
                )}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button className="border border-line px-3 py-2 text-[11px] text-text-dim" disabled={purchasing} onClick={() => setConfirmingPurchase(false)} type="button">
                    戻る
                  </button>
                  <button
                    className="bg-accent px-4 py-2 text-[11px] font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={purchasing || wallet == null || wallet.runeBalance < selected.priceRune}
                    onClick={() => void handlePurchase(selected)}
                    type="button"
                  >
                    {purchasing ? "購入中…" : "この内容で購入"}
                  </button>
                </div>
                {wallet != null && wallet.runeBalance < selected.priceRune && (
                  <p className="mt-3 text-right text-[10px] text-pink">
                    ルーンが不足しています。{" "}
                    <Link className="text-text underline underline-offset-4" href="/shop/runes">
                      ルーンショップへ
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] tracking-[0.1em] text-text-faint">PRICE</p>
                  <p className="mt-1 text-[17px] font-semibold text-accent">
                    {selected.priceRune.toLocaleString("ja-JP")} R
                  </p>
                </div>
                <button className="bg-accent px-4 py-2 text-[11px] font-semibold text-bg" onClick={() => setConfirmingPurchase(true)} type="button">
                  購入を確認
                </button>
              </div>
            )}

            <button className="mt-5 w-full border border-line px-3 py-2 text-[11px] text-text-dim hover:text-text" disabled={purchasing || equipping} onClick={closeDetails} type="button">
              閉じる
            </button>
          </div>
        </div>
      )}
    </MainWrapper>
  );
}
