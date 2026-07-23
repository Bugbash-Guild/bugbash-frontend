"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAward,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiRefreshCw,
  FiSave,
  FiTool,
  FiX,
} from "react-icons/fi";

import { BadgeCosmeticConfirmModal } from "@/components/badges/BadgeCosmeticConfirmModal";
import { LegalFooter } from "@/components/LegalFooter";
import { MainWrapper } from "@/components/MainWrapper";
import { BadgePrestigeGrid } from "@/components/prestige/BadgePrestigeGrid";
import { WalletBadge } from "@/components/WalletBadge";
import { useAuth } from "@/hooks/useAuth";
import { useBadges } from "@/hooks/useBadges";
import { useCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { useWallet } from "@/hooks/useWallet";
import {
  BADGE_VISIBILITY_TIP_STORAGE_KEY,
  buildBadgeCosmeticRequest,
  clearBadgeCosmeticIdempotencyKey,
  getNextBadgeForgeLevel,
  getOrCreateBadgeCosmeticIdempotencyKey,
  mapBadgeMutationError,
  type BadgeMutationError,
} from "@/lib/badges";
import { readBillingErrorMessage } from "@/lib/billing/runeCheckout";
import type { BadgeCosmeticResponse, BadgeProgress } from "@/types/badge";

function createBrowserIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `badge-${Date.now()}`;
}

export default function BadgesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    catalog,
    catalogError,
    levelDefs,
    levelDefsError,
    levelDefsLoading,
    loading,
    progress,
    progressError,
    refetchAll,
    refetchProgress,
  } = useBadges(isAuthenticated);
  const { offers: commemorativeOffers } = useCommemorativeMints(isAuthenticated);
  const {
    error: walletError,
    loading: walletLoading,
    refetch: refetchWallet,
    wallet,
  } = useWallet(isAuthenticated);

  const [confirmBadge, setConfirmBadge] = useState<BadgeProgress | null>(null);
  const [cosmeticError, setCosmeticError] = useState<BadgeMutationError | null>(
    null,
  );
  const [cosmeticInFlight, setCosmeticInFlight] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [settingsInFlight, setSettingsInFlight] = useState<string | null>(null);
  const [showVisibilityTip, setShowVisibilityTip] = useState(false);
  const [slotDrafts, setSlotDrafts] = useState<Record<string, string>>({});
  const cosmeticInFlightRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (window.localStorage.getItem(BADGE_VISIBILITY_TIP_STORAGE_KEY)) return;

    window.localStorage.setItem(BADGE_VISIBILITY_TIP_STORAGE_KEY, "1");
    setShowVisibilityTip(true);
  }, [isAuthenticated]);

  const earnedBadges = useMemo(
    () => progress.filter((badge) => badge.earnedAt != null),
    [progress],
  );
  const selectedLevel = confirmBadge
    ? getNextBadgeForgeLevel(levelDefs, confirmBadge.forgeRank)
    : null;
  const prerequisiteError =
    catalogError ?? progressError ?? levelDefsError ?? walletError;
  const workshopReady =
    !loading &&
    !walletLoading &&
    prerequisiteError == null &&
    levelDefs.length > 0 &&
    wallet != null;

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

  function openCosmeticConfirm(badge: BadgeProgress) {
    setCosmeticError(null);
    setNotice(null);
    setConfirmBadge(badge);
  }

  async function submitCosmeticUpgrade() {
    if (
      cosmeticInFlightRef.current ||
      confirmBadge == null ||
      selectedLevel == null
    ) {
      return;
    }

    cosmeticInFlightRef.current = true;
    setCosmeticError(null);
    setCosmeticInFlight(true);
    const badgeCode = confirmBadge.code;
    const idempotencyKey = getOrCreateBadgeCosmeticIdempotencyKey(
      window.sessionStorage,
      badgeCode,
      createBrowserIdempotencyKey,
    );

    try {
      const response = await fetch(
        `/api/heroes/me/badges/${encodeURIComponent(badgeCode)}/cosmetic`,
        {
          body: JSON.stringify(
            buildBadgeCosmeticRequest(confirmBadge.forgeRank, idempotencyKey),
          ),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      );

      if (!response.ok) {
        const serverMessage = await readBillingErrorMessage(response);
        const mapped = mapBadgeMutationError(response.status, serverMessage);
        if (response.status < 500) {
          clearBadgeCosmeticIdempotencyKey(window.sessionStorage, badgeCode);
        }
        if (mapped.action === "login") {
          router.replace("/login");
          return;
        }
        if (mapped.action === "refresh") {
          await refetchProgress();
          setConfirmBadge(null);
          setNotice(mapped.message);
          return;
        }
        setCosmeticError(mapped);
        return;
      }

      const result = (await response.json()) as BadgeCosmeticResponse;
      clearBadgeCosmeticIdempotencyKey(window.sessionStorage, badgeCode);
      await Promise.all([refetchProgress(), refetchWallet()]);
      setConfirmBadge(null);
      setNotice(
        `${confirmBadge.displayName}の見た目をコスメLv.${result.forgeRank}に更新しました。`,
      );
    } catch {
      setCosmeticError({
        action: "retry",
        message: "通信結果を確認できません。同じ内容で再試行できます。",
      });
    } finally {
      cosmeticInFlightRef.current = false;
      setCosmeticInFlight(false);
    }
  }

  async function updateBadgeSetting(
    badge: BadgeProgress,
    kind: "display" | "equip",
    body:
      | { equippedSlot: number | null; isVisible: boolean }
      | { slot: number | null },
  ) {
    if (settingsInFlight != null) return;

    setSettingsInFlight(badge.code);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/heroes/me/badges/${encodeURIComponent(badge.code)}/${kind}`,
        {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
          method: "PUT",
        },
      );
      if (!response.ok) {
        const serverMessage = await readBillingErrorMessage(response);
        const mapped = mapBadgeMutationError(response.status, serverMessage);
        if (mapped.action === "login") {
          router.replace("/login");
          return;
        }
        setNotice(mapped.message);
        return;
      }

      await refetchProgress();
      setNotice(
        kind === "display"
          ? "プロフィールへの表示設定を更新しました。"
          : "プロフィールの装備スロットを更新しました。",
      );
    } catch {
      setNotice("設定を保存できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSettingsInFlight(null);
    }
  }

  function saveEquippedSlot(badge: BadgeProgress) {
    const draft =
      slotDrafts[badge.code] ?? badge.equippedSlot?.toString() ?? "";
    const slot = draft === "" ? null : Number(draft);
    if (slot != null && (!Number.isInteger(slot) || slot < 1)) {
      setNotice("装備スロットには1以上の整数を入力してください。");
      return;
    }
    void updateBadgeSetting(badge, "equip", { slot });
  }

  return (
    <MainWrapper>
      <div className="min-h-screen">
        <header className="mx-auto max-w-6xl px-5 py-6 sm:px-9">
          <div className="text-[13px] text-text-dim">
            <span className="text-accent">hero@bugbash</span>
            <span className="text-text-faint">:</span>
            <span className="text-accent-2">~/badges</span>
            <span className="text-text-faint">$ </span>
            <span className="text-text">./inspect-achievements</span>
          </div>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-semibold text-text">バッジ</h1>
              <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
                GitHub活動で得た実績と、プロフィールに表示する見た目を管理します。
              </p>
              {!loading && (
                <p className="mt-1 text-[10px] text-text-faint">
                  カタログ {catalog.length}件 / 獲得済み {earnedBadges.length}件
                </p>
              )}
            </div>
            <WalletBadge enabled={isAuthenticated} />
          </div>
        </header>

        {(catalogError || progressError) && (
          <div className="mx-auto mb-5 max-w-6xl px-5 sm:px-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink">
              <span>バッジ情報を読み込めませんでした。</span>
              <button
                className="flex items-center gap-2 text-text hover:text-accent"
                onClick={() => void refetchAll()}
                type="button"
              >
                <FiRefreshCw aria-hidden size={14} />
                再読み込み
              </button>
            </div>
          </div>
        )}

        <BadgePrestigeGrid
          badges={progress}
          loading={loading && progress.length === 0}
          mintReadyAchievements={commemorativeOffers
            .filter((offer) => offer.unlocked && offer.mint == null)
            .map((offer) => offer.achievement)}
        />

        <section
          aria-labelledby="badge-workshop-heading"
          className="mx-auto max-w-6xl px-5 py-7 sm:px-9"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-purple">
                COSMETIC WORKSHOP
              </div>
              <h2
                id="badge-workshop-heading"
                className="mt-1 text-[17px] font-semibold text-text"
              >
                工房（見た目）
              </h2>
              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-text-dim">
                獲得済みバッジの装飾、公開設定、プロフィールの装備位置を管理します。
              </p>
            </div>
            <Link
              className="text-[11px] text-text-dim underline-offset-4 hover:text-accent hover:underline"
              href="/shop/runes"
            >
              ルーン残高を確認
            </Link>
          </div>

          {showVisibilityTip && (
            <div className="mt-4 flex max-w-xl items-start gap-3 border border-accent-2/30 bg-accent-2/10 px-3 py-3 text-[11px] leading-5 text-accent-2">
              <FiInfo aria-hidden className="mt-0.5 shrink-0" size={15} />
              <span className="flex-1">
                バッジは既定で公開されます。非公開にもできます。
              </span>
              <button
                aria-label="公開設定の案内を閉じる"
                className="shrink-0 hover:text-text"
                onClick={() => setShowVisibilityTip(false)}
                type="button"
              >
                <FiX aria-hidden size={15} />
              </button>
            </div>
          )}

          {notice && (
            <div className="mt-4 flex items-start gap-2 border border-accent/30 bg-accent/10 px-3 py-3 text-[11px] leading-5 text-accent">
              <FiCheck aria-hidden className="mt-0.5 shrink-0" size={14} />
              {notice}
            </div>
          )}

          {(levelDefsError ||
            walletError ||
            (!levelDefsLoading && levelDefs.length === 0)) && (
            <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] leading-5 text-pink">
              工房情報を取得できないため、現在は見た目を強化できません。設定変更は引き続き利用できます。
            </div>
          )}

          {!loading && earnedBadges.length === 0 ? (
            <div className="mt-5 border border-line bg-bg-elev px-4 py-8 text-center">
              <FiAward
                aria-hidden
                className="mx-auto text-text-faint"
                size={24}
              />
              <p className="mt-3 text-[12px] text-text-dim">
                獲得済みのバッジはまだありません。GitHub活動を続けるとここに追加されます。
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {earnedBadges.map((badge) => {
                const nextLevel = getNextBadgeForgeLevel(
                  levelDefs,
                  badge.forgeRank,
                );
                const settingBusy = settingsInFlight === badge.code;
                return (
                  <article
                    key={badge.code}
                    className="border border-purple/25 bg-bg-elev p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center border border-purple/40 bg-purple/10 text-purple">
                        <FiAward aria-hidden size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="break-words text-[13px] font-semibold text-text">
                              {badge.displayName}
                            </h3>
                            <div className="mt-1 text-[10px] text-text-faint">
                              COSMETIC Lv.{badge.forgeRank}
                            </div>
                          </div>
                          {levelDefsLoading ? (
                            <span className="border border-line px-2 py-1 text-[10px] text-text-faint">
                              確認中
                            </span>
                          ) : levelDefsError || levelDefs.length === 0 ? (
                            <span className="border border-pink/30 px-2 py-1 text-[10px] text-pink">
                              取得不可
                            </span>
                          ) : nextLevel ? (
                            <button
                              className="flex min-h-9 items-center gap-2 bg-purple px-3 py-2 text-[11px] font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!workshopReady || cosmeticInFlight}
                              onClick={() => openCosmeticConfirm(badge)}
                              type="button"
                            >
                              <FiTool aria-hidden size={14} />
                              {nextLevel.runeCost.toLocaleString("ja-JP")}
                              ルーンで強化
                            </button>
                          ) : (
                            <span className="border border-purple/30 px-2 py-1 text-[10px] text-purple">
                              MAX
                            </span>
                          )}
                        </div>
                        {nextLevel && (
                          <p className="mt-2 text-[11px] leading-5 text-text-dim">
                            次: {nextLevel.diffNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-line pt-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex min-h-10 items-center justify-between gap-3 text-[11px] text-text-dim">
                          <span className="flex items-center gap-2">
                            {badge.isVisible ? (
                              <FiEye aria-hidden />
                            ) : (
                              <FiEyeOff aria-hidden />
                            )}
                            プロフィールに表示
                          </span>
                          <input
                            aria-label={`${badge.displayName}をプロフィールに表示する`}
                            checked={badge.isVisible}
                            className="size-4 accent-[var(--accent-2)]"
                            disabled={settingBusy}
                            onChange={(event) =>
                              void updateBadgeSetting(badge, "display", {
                                equippedSlot: badge.equippedSlot,
                                isVisible: event.target.checked,
                              })
                            }
                            role="switch"
                            type="checkbox"
                          />
                        </label>

                        <div>
                          <label
                            className="text-[10px] text-text-faint"
                            htmlFor={`slot-${badge.code}`}
                          >
                            装備スロット（空欄で解除）
                          </label>
                          <div className="mt-1 flex gap-2">
                            <input
                              className="min-w-0 flex-1 border border-line bg-bg px-2 py-2 text-[11px] text-text outline-none focus:border-accent-2"
                              disabled={settingBusy}
                              id={`slot-${badge.code}`}
                              inputMode="numeric"
                              min={1}
                              onChange={(event) =>
                                setSlotDrafts((current) => ({
                                  ...current,
                                  [badge.code]: event.target.value,
                                }))
                              }
                              placeholder="未装備"
                              step={1}
                              type="number"
                              value={
                                slotDrafts[badge.code] ??
                                badge.equippedSlot ??
                                ""
                              }
                            />
                            <button
                              aria-label={`${badge.displayName}の装備スロットを保存`}
                              className="flex size-9 shrink-0 items-center justify-center border border-line text-text-dim hover:border-accent-2 hover:text-accent-2 disabled:opacity-50"
                              disabled={settingBusy}
                              onClick={() => saveEquippedSlot(badge)}
                              title="装備スロットを保存"
                              type="button"
                            >
                              {settingBusy ? (
                                <span className="size-3.5 animate-spin rounded-full border border-text-dim border-t-transparent" />
                              ) : (
                                <FiSave aria-hidden size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <LegalFooter />
        </section>
      </div>

      {confirmBadge && selectedLevel && wallet && (
        <BadgeCosmeticConfirmModal
          badge={confirmBadge}
          error={cosmeticError?.message ?? null}
          inFlight={cosmeticInFlight}
          level={selectedLevel}
          onClose={() => {
            if (!cosmeticInFlight) {
              setConfirmBadge(null);
              setCosmeticError(null);
            }
          }}
          onConfirm={() => void submitCosmeticUpgrade()}
          runeBalance={wallet.runeBalance}
          showRetry={cosmeticError?.action === "retry"}
          showTopUp={cosmeticError?.action === "topUp"}
        />
      )}
    </MainWrapper>
  );
}
