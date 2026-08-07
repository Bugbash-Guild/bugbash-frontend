"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { mutate } from "swr";

import { trackFunnelEvent, useTrackScreenView } from "@/hooks/useFunnelTracking";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { usePityCounter } from "@/hooks/usePityCounter";
import { useSummon } from "@/hooks/useSummon";
import { useSummonDisclosure } from "@/hooks/useSummonDisclosure";
import { useSummonHistory } from "@/hooks/useSummonHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { DisclosureModal } from "@/components/billing/DisclosureModal";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { LimitedPullConfirmModal } from "@/components/summon/LimitedPullConfirmModal";
import { LimitedSummonBanner } from "@/components/summon/LimitedSummonBanner";
import { PityMeter } from "@/components/summon/PityMeter";
import {
  SummonResultGrid,
  type SummonResultGridItem,
} from "@/components/summon/SummonResultGrid";
import type { LimitedPullConfirmation } from "@/lib/limitedSummon";
import {
  buildPassPityUpsell,
  buildSummonResultPityText,
  formatSummonCurrencyCost,
  selectEffectivePityDisclosure,
} from "@/lib/summonPity";
import {
  buildTenPullHonestyCopy,
  getSummonItemDisplay,
  SUMMON_CURRENCY_SYMBOL,
} from "@/lib/summonDisplay";
import type {
  ItemRarity,
  SummonHistoryEntry,
  SummonOnceResponse,
  SummonTenResponse,
} from "@/types/summon";

const RARITY_COLOR: Record<ItemRarity, string> = {
  N: "text-text-dim",
  R: "text-accent-2",
  SR: "text-purple",
  SSR: "text-gold",
};

type SummonResult =
  | { type: "once"; data: SummonOnceResponse }
  | { type: "ten"; data: SummonTenResponse };

export default function SummonPage() {
  const { isAuthenticated } = useAuth();
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

  useTrackScreenView("SUMMON_VIEWED");

  /*
    天井は「課金に踏み切るか離脱するか」が分かれる一点なので、
    到達を単独で記録する。到達した状態で何度も描画されるため、
    到達したときに一度だけ送る。
  */
  const reachedPity = pity?.isHardPity === true || pity?.isSoftPity === true;
  const pityKind = pity?.isHardPity === true ? "hard" : "soft";
  useEffect(() => {
    if (!reachedPity) return;
    trackFunnelEvent("PITY_REACHED", { kind: pityKind, pool: "normal" });
  }, [pityKind, reachedPity]);

  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [result, setResult] = useState<SummonResult | null>(null);
  const [tenConfirmOpen, setTenConfirmOpen] = useState(false);

  // コイン建てでも 10 連は誤タップ 1 回で 3,000 コインが消えるため、
  // 有料（ルーン）側と同じ確認モーダルを挟む。通貨が安いからといって
  // 保護水準を下げない（限定側だけ確認がある非対称の解消）。
  const coinBalance = hero?.guildCoinBalance ?? 0;
  // 残高不足で単発を押すとサーバエラーになるだけなので、押せなくする
  // （10連が確認モーダルで守られているのに単発だけ素通しだった）。
  const singlePullCost = disclosure?.singlePullCost ?? null;
  // hero 未着の間は 0 残高として「コイン不足」を誤表示しない（10連と同じ扱い）
  const canAffordSingle =
    hero == null || singlePullCost == null || coinBalance >= singlePullCost;
  const tenConfirmation: LimitedPullConfirmation | null = useMemo(() => {
    const cost = disclosure?.tenPullCost;
    // hero 未着だと残高 0 と表示してしまうため、揃うまで確認は出さない
    if (disclosure == null || cost == null || hero == null) return null;
    return {
      balanceLabel: formatSummonCurrencyCost(coinBalance, disclosure.currency),
      canAfford: coinBalance >= cost,
      cost,
      costLabel: formatSummonCurrencyCost(cost, disclosure.currency),
      pullCount: 10,
    };
  }, [coinBalance, disclosure, hero]);
  const effectiveDisclosure =
    disclosure && subscription
      ? selectEffectivePityDisclosure(disclosure, subscription.entitled)
      : null;
  const passPityUpsell =
    disclosure && subscription
      ? buildPassPityUpsell(disclosure, subscription.entitled)
      : null;
  // 「割引なし」は開示APIの実額（10連 = 単価×10）を確認できたときだけ出す
  const tenPullHonestyCopy = buildTenPullHonestyCopy(disclosure);

  // 結果グリッド（限定と共通）に渡す配列。単発も同じグリッドで表示する
  const resultItems: SummonResultGridItem[] = useMemo(() => {
    if (result == null) return [];
    if (result.type === "once") {
      const { assetUrl, isNew, itemId, rarity } = result.data;
      return [{ assetUrl, isNew, itemId, rarity }];
    }
    return result.data.results;
  }, [result]);

  // Esc の自前ハンドラは共通フックへ集約（Tab 循環と背後のスクロールロックも同時に入る）。
  // 結果モーダルは「閉じる」だけが取り消しなので、Esc は setResult(null) に対応させる。
  const resultPanelRef = useModalDismiss({
    onDismiss: () => setResult(null),
    open: result != null,
  });


  async function handlePullOnce() {
    reset();
    setResult(null);
    try {
      const data = await pullOnce();
      trackFunnelEvent("SUMMON_EXECUTED", { kind: "once" });
      setResult({ type: "once", data });
      await Promise.all([
        refetchPity(),
        refetchHistory(),
        refetchHero(),
        mutate("/api/billing/wallet"),
        // コイン召喚は魂・進化素材（＝持ち物）を出す。結果モーダルの
        // 「持ち物で確認 →」で最新の在庫が見えるよう inventory を再検証する。
        mutate("/api/inventory"),
      ]);
    } catch {
      // error displayed via summonError state
    }
  }

  async function handlePullTen() {
    reset();
    setResult(null);
    try {
      const data = await pullTen();
      trackFunnelEvent("SUMMON_EXECUTED", { kind: "ten" });
      setResult({ type: "ten", data });
      await Promise.all([
        refetchPity(),
        refetchHistory(),
        refetchHero(),
        mutate("/api/billing/wallet"),
        mutate("/api/inventory"),
      ]);
    } catch {
      // error displayed via summonError state
    }
  }

  async function handleConfirmTen() {
    await handlePullTen();
    setTenConfirmOpen(false);
  }

  return (
    <>
      <ConsoleTopbar command="./summon --currency=coin" path="~/summon" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6 min-h-screen">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 max-w-4xl">
          <div>
            <h1 className="flex items-center gap-2 text-[24px] font-semibold text-text">
              通常召喚
              <span className="rounded-[3px] border border-coin-border bg-coin-bg px-2 py-0.5 text-[11px] font-semibold text-coin">
                {SUMMON_CURRENCY_SYMBOL.GUILD_COIN} COIN
              </span>
            </h1>
            <p className="mt-1 text-[12px] text-text-dim">
              ギルドコイン（活動で獲得）で魂や進化の素材を引きます。相棒モンスターは
              PR のマージや限定召喚で仲間になります。
            </p>
          </div>
        </div>

        <LimitedSummonBanner enabled={isAuthenticated} />

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

            {/* coin balance（記号はトップバーと同じ 🪙 に統一。◈ は廃止） */}
            <div className="flex items-center gap-2 text-[13px] px-1">
              <span className="text-text-faint">残高</span>
              <span className="text-gold font-semibold">
                {SUMMON_CURRENCY_SYMBOL.GUILD_COIN}{" "}
                {(hero?.guildCoinBalance ?? 0).toLocaleString("ja-JP")}
              </span>
              <span className="text-text-faint">ギルドコイン</span>
            </div>

            {/* 開示APIが取れないときは（ボタンを黙って無効化するのでなく）
                限定側と同じ警告帯で理由を言う。確率を確認できない状態では引かせない */}
            {(disclosureError || subscriptionError) && (
              <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] leading-5 text-pink">
                召喚情報を取得できないため、現在は召喚できません。再読み込みしてお試しください。
              </div>
            )}

            {/* summon buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePullOnce}
                disabled={summoning || !effectiveDisclosure || !canAffordSingle}
                className="flex-1 rounded border border-accent bg-accent py-3.5 text-[14px] font-semibold text-bg transition-[filter] hover:brightness-110 disabled:opacity-40"
              >
                {summoning ? "召喚中…" : canAffordSingle ? "[ 召喚 × 1 ]" : "コイン不足"}
              </button>
              <button
                onClick={() => setTenConfirmOpen(true)}
                disabled={summoning || !effectiveDisclosure || !tenConfirmation}
                className="flex-1 rounded border border-gold py-3.5 text-[13px] text-gold transition-colors hover:bg-gold hover:text-bg disabled:opacity-40"
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

            {tenPullHonestyCopy && (
              <p className="text-[11px] text-text-faint px-1">
                {tenPullHonestyCopy}
              </p>
            )}

            {/* pity counter */}
            <PityMeter
              disclosure={effectiveDisclosure}
              passUpsell={passPityUpsell}
              error={pityError ?? disclosureError ?? subscriptionError}
              loading={disclosureLoading || subscriptionLoading}
              pity={pity}
            />

            <p className="text-[10.5px] text-text-faint px-1">
              コインが足りないときは — PR をマージして集めましょう（購入はできません）。
            </p>

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
              <div className="text-[12px] text-text-faint py-8 text-center leading-6">
                {/* SPでは召喚パネルは左でなく上に積まれるため「左の」と言わない */}
                まだ召喚履歴がありません。
                <br />
                [ 召喚 × 1 ] から魂や進化素材を引けます。
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

        <div className="max-w-4xl">
          <LegalFooter />
        </div>

        {tenConfirmOpen && tenConfirmation && (
          <LimitedPullConfirmModal
            confirmation={tenConfirmation}
            // 召喚が返ってから再取得完了までの間に summoning=false の瞬間があり、
            // 結果モーダルを閉じると armed 状態の確認ボタンが露出して二重召喚
            // できてしまう。結果表示中も無効のままにする
            loading={summoning || result != null}
            onCancel={() => {
              if (!summoning) setTenConfirmOpen(false);
            }}
            onConfirm={() => void handleConfirmTen()}
          />
        )}

        {/* ── Result modal ── */}
        {result && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setResult(null)}
            role="presentation"
          >
            <div
              ref={resultPanelRef}
              role="dialog"
              aria-modal="true"
              aria-label="召喚結果"
              className="bg-bg-elev border border-line-strong rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint mb-4">
                {result.type === "once" ? "SUMMON RESULT" : "10× SUMMON RESULT"}
              </div>

              {/* 結果グリッドは限定召喚と共通（名前表示・SR以上サマリ・
                  SSR枠強調・レア別リビール込み） */}
              <SummonResultGrid items={resultItems} />

              <div className="mt-4 text-[11px] text-text-dim space-y-0.5">
                {/* 生カウンタ（pity: N pulls）は天井まで何回かをユーザーに
                    引き算させていた。メーターと同じ計算で残数を言い切る */}
                <div className="text-text">
                  {buildSummonResultPityText(
                    result.data.newPullCount,
                    effectiveDisclosure,
                  )}
                </div>
                <div>
                  {/* 記号はトップバーと同じ 🪙（summonDisplay の辞書）に統一 */}
                  残高:{" "}
                  <span className="text-gold">
                    {SUMMON_CURRENCY_SYMBOL.GUILD_COIN}{" "}
                    {formatSummonCurrencyCost(
                      result.data.coinsRemaining,
                      "GUILD_COIN",
                    )}
                  </span>
                </div>
              </div>

              {/* 限定モーダルの「図鑑で確認 / 続けて引く」と同じ2択。
                  通常プールの排出先は魂・素材なので、確認先は持ち物にする */}
              <div className="mt-4 flex gap-2">
                <Link
                  className="flex-1 rounded border border-accent/40 py-2 text-center text-[13px] text-accent transition-colors hover:bg-accent/[0.08]"
                  href="/items"
                >
                  [ 持ち物で確認 → ]
                </Link>
                {/* 初期フォーカスは「閉じるだけ」のこちらへ。確認ボタンを連打した
                    流れで Enter が残ると、先頭の持ち物リンクで画面外へ飛ばされる */}
                <button
                  data-autofocus
                  onClick={() => setResult(null)}
                  className="flex-1 py-2 rounded border border-line text-text-dim text-[13px] hover:border-accent hover:text-accent transition-colors"
                >
                  [ 続けて引く ]
                </button>
              </div>
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
    </>
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
