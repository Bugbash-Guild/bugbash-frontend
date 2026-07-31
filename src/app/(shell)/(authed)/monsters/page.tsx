"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { TermLoading } from "@/components/TermLoading";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RARITY_COLOR } from "@/constants/rarity";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useInventory } from "@/hooks/useInventory";
import { useMonsters } from "@/hooks/useMonsters";
import { usePartner } from "@/hooks/usePartner";
import { useSkinCatalog } from "@/hooks/useSkinCatalog";
import { useMyCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { matchMintToOwnedMonster } from "@/lib/commemorativeMint";
import { buildAcquisitionHint, buildDexProgress } from "@/lib/dexProgress";
import {
  canEvolveMonster,
  canLevelUpMonster,
  hasEnoughMaterial,
  isMonsterAwakened,
  isMonsterMaxLevel,
  meetsLevel,
} from "@/lib/monsterProgression";
import { InlineActionResult } from "@/components/InlineActionResult";
import type { CommemorativeMintPlate } from "@/types/commemorativeMint";
import type { AwakeningState, Monster, RitualRequirement } from "@/types/monster";

type RarityKey = "SSR" | "SR" | "R" | "N";
type FilterKey = "all" | RarityKey;

const RARITY_GROUPS: RarityKey[] = ["SSR", "SR", "R", "N"];
const FILTERS: FilterKey[] = ["all", "SSR", "SR", "R", "N"];

const AWAKENING_LABEL: Partial<Record<AwakeningState, string>> = {
  AWAKENED: "覚醒",
  BERSERK: "暴走",
};

/** 節目のレベルに届いたときに何が起きるか。到達済みの行に添える。 */
const GATE_READY_LABEL: Record<string, string> = {
  BASIC_EVOLUTION: "姿が変わりました",
  BRANCH_EVOLUTION: "進化の儀式を行えます",
  FINAL_EVOLUTION: "最終進化を行えます",
};

/**
 * 素材を消費する儀式のボタン。押す前に「何をいくつ使うか」を必ず出し、
 * 確認を挟んでから実行する（クリック即消費にしない）。
 */
function RitualAction({
  busy,
  confirming,
  label,
  level,
  requirement,
  tone,
  onCancel,
  onConfirm,
  onRequest,
}: {
  busy: boolean;
  confirming: boolean;
  label: string;
  level: number;
  requirement: RitualRequirement;
  tone: "purple" | "neutral";
  onCancel: () => void;
  onConfirm: () => void;
  onRequest: () => void;
}) {
  const enough = hasEnoughMaterial(requirement);
  const levelOk = meetsLevel(level, requirement.requiredLevel);
  const buttonClass =
    tone === "purple"
      ? "w-full rounded border border-purple/40 px-2 py-1 text-[10px] text-purple transition-opacity hover:bg-purple/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
      : "w-full rounded border border-line-strong px-2 py-1 text-[10px] text-text-dim transition-opacity hover:text-text disabled:cursor-not-allowed disabled:opacity-30";

  if (confirming) {
    return (
      <div className="space-y-1 rounded-[4px] border border-line-strong bg-bg-elev-2 p-2">
        <p className="text-[10px] leading-5 text-text">
          {label}を実行すると <b>{requirement.itemName}</b> を{" "}
          {requirement.requiredQuantity} 個消費します（所持 {requirement.ownedQuantity} 個）。
        </p>
        <div className="flex gap-1">
          <button className={buttonClass} disabled={busy} onClick={onConfirm} type="button">
            {busy ? "…" : `${label}する`}
          </button>
          <button
            className="w-full rounded border border-line px-2 py-1 text-[10px] text-text-dim hover:text-text"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            やめる
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        className={buttonClass}
        disabled={busy || !enough || !levelOk}
        onClick={onRequest}
        type="button"
      >
        {busy
          ? "…"
          : `${label}（${requirement.itemName} ×${requirement.requiredQuantity}）`}
      </button>
      {!levelOk && requirement.requiredLevel !== null && (
        <p className="text-[9.5px] leading-5 text-text-faint">
          Lv.{requirement.requiredLevel} から実行できます。
        </p>
      )}
      {levelOk && !enough && (
        <p className="rounded-[4px] border border-line bg-bg-elev-2 px-2 py-1 text-[9.5px] leading-5 text-text-dim">
          {requirement.itemName}が {requirement.requiredQuantity - requirement.ownedQuantity} 個
          足りません（所持 {requirement.ownedQuantity} 個）。
        </p>
      )}
    </>
  );
}

/** 進化段階（活動由来）。formStage から派生。 */
function evolutionStage(monster: Monster): number {
  switch (monster.formStage) {
    case "EVO":
      return 1;
    case "AWAKENED":
    case "BERSERK":
      return 2;
    case "AWAKENED_FINAL":
    case "BERSERK_FINAL":
      return 3;
    default:
      return 0;
  }
}

function RarityChip({ rarity }: { rarity: RarityKey }) {
  const c = RARITY_COLOR[rarity];
  return (
    <span
      className="inline-flex rounded-[2px] border px-[7px] py-px text-[9.5px] font-bold tracking-[0.1em]"
      style={{ color: c, background: `${c}1f`, borderColor: `${c}66` }}
    >
      {rarity}
    </span>
  );
}

export default function MonstersPage() {
  const { isAuthenticated } = useAuth();
  const { monsters, ownedDegraded, loading, error, refetch } = useMonsters();
  const { partnerId, setPartner } = usePartner();
  const { ownedSkins, skins: skinCatalog } = useSkinCatalog(isAuthenticated);
  const { items: inventoryItems, refetch: refetchInventory } = useInventory(isAuthenticated);
  // スキンが1つも無いモンスターに「スキンを見る」を出すと空棚に送ることになる。
  const slugsWithSkins = useMemo(
    () => new Set(skinCatalog.map((skin) => skin.monsterSlug)),
    [skinCatalog],
  );
  const { refetch: refetchHero } = useHero(isAuthenticated);
  // githubId (auth/status の応答) を待たず、最初のリクエスト波に乗せる
  const { mints } = useMyCommemorativeMints(isAuthenticated);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [levelingUp, setLevelingUp] = useState<string | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);
  const [changingPath, setChangingPath] = useState<string | null>(null);
  /*
   * 育成の結果は操作したカードの隣に出す。以前はページ最上部の <p> だけに出して
   * いたため、図鑑が縦に長いと下のカードで押した結果が画面外だった。
   * aria-live も付いていなかったので読み上げにも乗っていない（InlineActionResult が持つ）。
   */
  const [lastResult, setLastResult] = useState<{
    monsterId: string;
    tone: "success" | "error";
    message: string;
  } | null>(null);

  async function runAction(
    monsterId: string,
    action: "level-up" | "evolve" | "change-path",
    setBusy: (id: string | null) => void,
    describe: (body: Record<string, unknown>) => string,
  ) {
    setBusy(monsterId);
    setLastResult(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/${action}`, {
        method: "POST",
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setLastResult({
          monsterId,
          tone: "error",
          message: (body.error as string) ?? `Error ${res.status}`,
        });
      } else {
        setLastResult({ monsterId, tone: "success", message: describe(body) });
        /*
         * 素材を消費する操作があるのでインベントリも再検証する。以前は含めておらず、
         * 路線変更で証を1個使ったあとも画面上部の MATERIALS ストリップが
         * 古い個数を出し続けていた。
         */
        await Promise.all([
          refetch(),
          refetchHero(),
          refetchInventory(),
          mutate("/api/billing/wallet"),
        ]);
      }
    } catch {
      setLastResult({ monsterId, tone: "error", message: "Network error" });
    } finally {
      setBusy(null);
    }
  }

  const handleLevelUp = (id: string) =>
    runAction(id, "level-up", setLevelingUp, (b) => `Lv.${b.newLevel ?? "?"} に上昇！`);
  const handleEvolve = (id: string) =>
    runAction(id, "evolve", setEvolving, (b) => `覚醒：${b.awakeningState ?? "?"}`);
  const handleChangePath = (id: string) =>
    runAction(id, "change-path", setChangingPath, (b) => {
      const label = b.awakeningState
        ? (AWAKENING_LABEL[b.awakeningState as AwakeningState] ?? String(b.awakeningState))
        : "?";
      return `路線変更：${label}（証残数: ${b.itemRemaining ?? "?"}）`;
    });

  async function handleSetPartner(monsterId: string) {
    setLastResult(null);
    try {
      await setPartner(monsterId);
    } catch (error) {
      setLastResult({
        monsterId,
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "パートナーを設定できませんでした。もう一度お試しください。",
      });
    }
  }

  const dex = useMemo(
    () => [...monsters].sort((a, b) => a.id.localeCompare(b.id)),
    [monsters],
  );
  // 装備中スキンのマスタリー（コスメ・琥珀）を monsterSlug で引けるようにする
  const cosmeticBySlug = useMemo(() => {
    const map = new Map<string, { masteryLevel: number; lineName: string; skinId: string }>();
    for (const skin of ownedSkins) {
      if (skin.equipped) {
        map.set(skin.monsterSlug, {
          masteryLevel: skin.masteryLevel,
          lineName: skin.lineName,
          skinId: skin.skinId,
        });
      }
    }
    return map;
  }, [ownedSkins]);

  // 「今の収穫」が分かるように、直近24時間に迎えたモンスターへ NEW を出す
  const recentlyAcquiredIds = useMemo(() => {
    const threshold = Date.now() - 24 * 60 * 60 * 1000;
    return new Set(
      dex
        .filter((m) => {
          if (!m.acquiredAt) return false;
          const at = new Date(m.acquiredAt).getTime();
          return Number.isFinite(at) && at >= threshold;
        })
        .map((m) => m.id),
    );
  }, [dex]);

  const partnerMonster = dex.find((m) => m.id === partnerId) ?? null;
  const progress = buildDexProgress(dex);
  const ownedInstances = dex.reduce((sum, m) => sum + (m.isOwned ? 1 : 0), 0);

  const visibleGroups = RARITY_GROUPS.filter(
    (g) => filter === "all" || filter === g,
  ).map((g) => ({
    rarity: g,
    items: dex.filter((m) => m.rarity === g),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <ConsoleTopbar command="cat dex/*.card --format=detailed" path="~/monsters" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6">
        {/* page header + filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Monster Dex</h1>
            <p className="mt-1.5 text-[12.5px] leading-7 text-text-dim">
              discovered <b className="text-accent">{progress.discovered}</b> / {progress.total}
              {" · "}owned <b className="text-accent">{ownedInstances}</b> instances{" · "}
              進化/覚醒＝<span className="text-accent">活動由来</span>
            </p>
            {/* 召喚でしか埋まらない枠は別に数える（働けば埋まる枠と行動が違う） */}
            {progress.summonOnlyTotal > 0 && (
              <p className="mt-0.5 text-[11px] text-text-faint">
                うち召喚専用{" "}
                <b className="tabular-nums text-rune">
                  {progress.summonOnlyDiscovered}
                </b>
                {" / "}
                {progress.summonOnlyTotal}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="レアリティで絞り込み">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={[
                    "rounded-[4px] border px-3 py-1.5 text-[11px] transition-colors",
                    active
                      ? "border-accent/40 bg-accent/[0.08] text-accent"
                      : "border-line-strong text-text-dim hover:text-text",
                  ].join(" ")}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* 素材（育成の燃料）— 詳細は /items */}
        {inventoryItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[4px] border border-line bg-bg-elev px-3.5 py-2 text-[11px]">
            <span className="text-[9px] uppercase tracking-[0.12em] text-text-faint">MATERIALS</span>
            {inventoryItems.slice(0, 6).map((item) => (
              <span className="text-text-dim" key={item.itemId}>
                {item.name}
                <span className="ml-1 tabular-nums text-text">×{item.quantity}</span>
              </span>
            ))}
            <Link
              className="ml-auto text-[10px] text-text-faint underline underline-offset-4 hover:text-accent"
              href="/items"
            >
              インベントリ →
            </Link>
          </div>
        )}

        {/* FAVORITE / partner banner */}
        <div
          className="mt-4 flex items-center gap-3 rounded-[4px] border px-3.5 py-2.5 text-[12px]"
          style={{
            background: partnerMonster
              ? `${RARITY_COLOR[partnerMonster.rarity]}14`
              : "var(--bg-elev)",
            borderColor: partnerMonster
              ? `${RARITY_COLOR[partnerMonster.rarity]}88`
              : "var(--line)",
          }}
        >
          {partnerMonster ? (
            <>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                FAVORITE / 連れている
              </span>
              <MonsterVisual
                artworkByStage={partnerMonster.artworkByStage}
                assetUrl={partnerMonster.assetUrl}
                className="size-7 shrink-0"
                formStage={partnerMonster.formStage}
                id={partnerMonster.id}
                awakeningState={partnerMonster.awakeningState}
                level={partnerMonster.level}
                name={partnerMonster.name}
                sizes="28px"
              />
              <b
                className="shrink-0 whitespace-nowrap"
                style={{ color: RARITY_COLOR[partnerMonster.rarity] }}
              >
                {partnerMonster.name}
              </b>
              <span className="ml-auto min-w-0 truncate text-[10px] text-text-faint">
                カードをクリックで変更（獲得済みのみ）
              </span>
            </>
          ) : (
            <span className="text-text-faint">
              モンスターカードをクリックしてパートナー（連れ歩き）に設定できます。
            </span>
          )}
        </div>

        {/* messages */}
        {loading && <TermLoading className="mt-4" lines={["query dex --all", "join dex --owned"]} />}
        {error && <p className="mt-4 text-[13px] text-pink">error: {error}</p>}
        {ownedDegraded && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
            <span>所持情報を取得できませんでした — 所持状態・レベルは現在正しく表示されていません。</span>
            <button className="text-text underline underline-offset-4" onClick={() => void refetch()} type="button">
              再読み込み
            </button>
          </div>
        )}

        {/* grouped dex */}
        <div className="mt-4 space-y-2">
          {visibleGroups.map(({ rarity, items }) => {
            const got = items.filter((m) => m.isOwned).length;
            return (
              <section key={rarity} aria-label={`${rarity} monsters`}>
                <div className="mb-3.5 mt-8 flex items-center gap-2.5">
                  <RarityChip rarity={rarity} />
                  <span className="text-[11px] tabular-nums text-text-dim">
                    {got}/{items.length} discovered
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
                  {items.map((m) => (
                    <MonsterCard
                      key={m.id}
                      monster={m}
                      isPartner={m.id === partnerId}
                      cosmetic={m.slug ? (cosmeticBySlug.get(m.slug) ?? null) : null}
                      hasPurchasableSkin={m.slug ? slugsWithSkins.has(m.slug) : false}
                      isRecent={recentlyAcquiredIds.has(m.id)}
                      mint={matchMintToOwnedMonster(mints, m.ownedMonsterId)}
                      busy={{
                        levelingUp: levelingUp === m.id,
                        evolving: evolving === m.id,
                        changingPath: changingPath === m.id,
                      }}
                      result={lastResult?.monsterId === m.id ? lastResult : null}
                      onSetPartner={() => void handleSetPartner(m.id)}
                      onLevelUp={() => void handleLevelUp(m.id)}
                      onEvolve={() => void handleEvolve(m.id)}
                      onChangePath={() => void handleChangePath(m.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {!loading && visibleGroups.length === 0 && (
            <p className="mt-8 border border-dashed border-line-strong bg-bg-elev px-5 py-12 text-center text-[12px] text-text-faint">
              該当するモンスターがいません。
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function MonsterCard({
  monster: m,
  isPartner,
  cosmetic,
  hasPurchasableSkin,
  isRecent,
  mint,
  busy,
  result,
  onSetPartner,
  onLevelUp,
  onEvolve,
  onChangePath,
}: {
  monster: Monster;
  isPartner: boolean;
  cosmetic: { masteryLevel: number; lineName: string; skinId: string } | null;
  hasPurchasableSkin: boolean;
  isRecent: boolean;
  mint: CommemorativeMintPlate | undefined;
  busy: { levelingUp: boolean; evolving: boolean; changingPath: boolean };
  result: { tone: "success" | "error"; message: string } | null;
  onSetPartner: () => void;
  onLevelUp: () => void;
  onEvolve: () => void;
  onChangePath: () => void;
}) {
  const c = RARITY_COLOR[m.rarity];
  const awakened = isMonsterAwakened(m);
  const berserk = m.awakeningState === "BERSERK";
  const evoStage = evolutionStage(m);
  const canEvolve = canEvolveMonster(m);
  const canLevelUp = canLevelUpMonster(m);
  const acquisitionHint = buildAcquisitionHint(m);
  // 育成の数値はすべて BE 由来。届いていなければ操作もコストも出さない。
  const progression = m.progression;
  const levelUpCost = progression?.nextLevelUpSoulCost ?? null;
  const soulShortfall =
    levelUpCost !== null && m.soulCount < levelUpCost ? levelUpCost - m.soulCount : 0;

  /*
   * 素材を消費する操作は押す前に確認する。以前は確認なしのクリック即実行で、
   * 何をいくつ使うかも出していなかった（深淵の証は 20,000 コイン相当）。
   * ショップ・鋳造・工房が確認を持つのに育成だけ無かった非対称を埋める。
   */
  const [pendingRitual, setPendingRitual] = useState<"evolve" | "change-path" | null>(null);

  // art tint by activity state (green evolution / gold awaken / pink berserk)
  const artBorder = berserk
    ? "rgba(255,123,114,0.55)"
    : awakened
      ? "var(--grade-5)"
      : m.isOwned
        ? "var(--line)"
        : "var(--line)";
  const artShadow = berserk
    ? "inset 0 0 22px rgba(255,123,114,0.2)"
    : awakened
      ? "inset 0 0 22px rgba(255,240,192,0.26)"
      : "none";

  return (
    <div
      onClick={m.isOwned && !isPartner ? onSetPartner : undefined}
      className="relative rounded-[8px] p-3 transition-colors"
      style={{
        background: m.isOwned ? "var(--bg-elev)" : "var(--bg-elev-2)",
        borderStyle: m.isOwned ? "solid" : "dashed",
        borderWidth: isPartner ? 2 : 1,
        borderColor: isPartner ? c : m.isOwned ? `${c}66` : "var(--line-strong)",
        opacity: m.isOwned ? 1 : 0.5,
        boxShadow: isPartner
          ? `0 0 0 1px ${c}, 0 8px 24px rgba(0,0,0,0.4)`
          : m.isOwned && m.rarity === "SSR"
            ? `inset 0 0 22px ${c}1a`
            : "none",
        cursor: m.isOwned ? "pointer" : "not-allowed",
      }}
    >
      {isRecent && (
        <span className="absolute -top-2.5 left-2.5 rounded-[2px] border border-accent/50 bg-bg px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.1em] text-accent">
          NEW
        </span>
      )}
      {isPartner && (
        <span
          className="absolute -top-2.5 right-2.5 rounded-[2px] px-2 py-0.5 text-[9px] font-bold tracking-[0.1em]"
          style={{ background: c, color: "#0b0f0d" }}
        >
          ★ FAVORITE
        </span>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] text-text-faint">#{m.id.slice(0, 8)}</span>
        <RarityChip rarity={m.rarity} />
      </div>

      {/* portrait */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-[5px] border text-[54px]"
        style={{
          aspectRatio: "1 / 0.72",
          background: m.isOwned
            ? `radial-gradient(circle at 50% 42%, ${c}29 0%, transparent 68%), var(--bg-elev-2)`
            : "var(--bg-elev-2)",
          borderColor: artBorder,
          boxShadow: artShadow,
        }}
      >
        {m.isOwned ? (
          <MonsterVisual
            artworkByStage={m.artworkByStage}
            assetUrl={m.assetUrl}
            className="size-full"
            formStage={m.formStage}
            id={m.id}
            awakeningState={m.awakeningState}
            level={m.level}
            name={m.name}
            sizes="160px"
          />
        ) : (
          <span className="text-text-faint">?</span>
        )}
      </div>

      {/* name */}
      <div
        className="mt-2.5 text-[13px] font-semibold"
        style={{ color: m.isOwned ? "var(--text)" : "var(--text-faint)" }}
      >
        {m.isOwned ? m.name : "???"}
      </div>

      {/* meta */}
      <div className="mt-0.5 text-[10px] leading-6 text-text-faint">
        status:{" "}
        {m.isOwned ? (
          <span className="text-accent">caught · {m.attributeName ?? "soul"} × {m.soulCount}</span>
        ) : (
          <span className="text-pink">not_found</span>
        )}
      </div>

      {/*
        未所持の枠に「どうすれば埋まるのか」を出す（JS-7）。
        召喚専用は琥珀＋限定召喚への導線、PRで取れるものは緑で導線なし。
        prAcquirable が未取得のあいだは何も出さない（推測しない）。
      */}
      {acquisitionHint && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center rounded-[2px] border px-[7px] py-px text-[9px] font-bold tracking-[0.08em] ${
              acquisitionHint.paid
                ? "border-rune-border bg-rune-bg text-rune"
                : "border-accent/30 bg-accent/[0.08] text-accent"
            }`}
          >
            {acquisitionHint.text}
          </span>
          {acquisitionHint.route && (
            <Link
              className="text-[10px] text-rune underline underline-offset-2 hover:brightness-125"
              href={acquisitionHint.route.href}
              onClick={(event) => event.stopPropagation()}
            >
              {acquisitionHint.route.label} →
            </Link>
          )}
        </div>
      )}

      {/* activity-derived badges (green fame / gold awaken / pink berserk) */}
      {m.isOwned && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span
            className="inline-flex items-center gap-1 rounded-[2px] border border-accent/30 bg-accent/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-accent"
          >
            Lv.{m.level}
            {evoStage > 0 && <> · 進化{"★".repeat(evoStage)}</>}
          </span>
          {awakened && !berserk && (
            <span className="inline-flex items-center rounded-[2px] border border-grade-5/40 bg-grade-5/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-grade-5">
              覚醒
            </span>
          )}
          {berserk && (
            <span className="inline-flex items-center rounded-[2px] border border-pink/40 bg-pink/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-pink">
              暴走
            </span>
          )}
          {cosmetic && (
            <Link
              href={`/forge?skin=${encodeURIComponent(cosmetic.skinId)}`}
              onClick={(event) => event.stopPropagation()}
              title={`${cosmetic.lineName} スキン装備（コスメ・見た目のみ）— 工房で深化`}
              className="inline-flex items-center rounded-[2px] border border-rune-border bg-rune-bg px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-rune hover:brightness-125"
            >
              ⚒ St{cosmetic.masteryLevel} · COSMETIC
            </Link>
          )}
        </div>
      )}

      {/* management actions (real functionality, kept subtle) */}
      {m.isOwned && progression && (
        <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
          {/* 次の節目までの距離。「あと何をすれば何が起きるか」を常に1つ先に見せる。 */}
          {progression.nextGateLevel !== null && progression.soulsToNextGate !== null && (
            <p className="text-[9.5px] leading-5 text-text-faint">
              {progression.soulsToNextGate > 0
                ? `次の節目 Lv.${progression.nextGateLevel} まで ${progression.soulsToNextGate.toLocaleString("ja-JP")} ${m.attributeName ?? "soul"}`
                : `Lv.${progression.nextGateLevel} 到達 — ${GATE_READY_LABEL[progression.nextGateKind ?? "BASIC_EVOLUTION"]}`}
            </p>
          )}

          {canLevelUp && levelUpCost !== null && (
            <button
              type="button"
              onClick={onLevelUp}
              disabled={soulShortfall > 0 || busy.levelingUp}
              className="w-full rounded border border-accent/40 px-2 py-1 text-[10px] text-accent transition-opacity hover:bg-accent/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.levelingUp ? "…" : `Lv UP (${levelUpCost} ${m.attributeName ?? "soul"})`}
            </button>
          )}
          {/*
            押せない理由を書く。以前はボタンが薄くなるだけで、なぜ押せないのかを
            どこにも出していなかった（ショップ側は不足額を説明しているのに非対称だった）。
          */}
          {canLevelUp && soulShortfall > 0 && (
            <p className="rounded-[4px] border border-line bg-bg-elev-2 px-2 py-1 text-[9.5px] leading-5 text-text-dim">
              {m.attributeName ?? "soul"}の魂があと {soulShortfall.toLocaleString("ja-JP")} 必要です
              （所持 {m.soulCount.toLocaleString("ja-JP")}）。PR をマージするか魂パックで集められます。
            </p>
          )}

          {canEvolve && progression.branchEvolution && (
            <RitualAction
              busy={busy.evolving}
              confirming={pendingRitual === "evolve"}
              label="進化"
              level={m.level}
              requirement={progression.branchEvolution}
              tone="purple"
              onCancel={() => setPendingRitual(null)}
              onConfirm={() => {
                setPendingRitual(null);
                onEvolve();
              }}
              onRequest={() => setPendingRitual("evolve")}
            />
          )}
          {awakened && progression.pathChange && (
            <RitualAction
              busy={busy.changingPath}
              confirming={pendingRitual === "change-path"}
              label="路線変更"
              level={m.level}
              requirement={progression.pathChange}
              tone="neutral"
              onCancel={() => setPendingRitual(null)}
              onConfirm={() => {
                setPendingRitual(null);
                onChangePath();
              }}
              onRequest={() => setPendingRitual("change-path")}
            />
          )}
          {isMonsterMaxLevel(m) && !canEvolve && (
            <div className="rounded border border-line py-1 text-center text-[10px] font-bold tracking-widest text-text-faint">
              Lv.{progression.maxLevel}
            </div>
          )}

          {result && (
            <InlineActionResult
              title={result.tone === "success" ? "完了しました" : "実行できませんでした"}
              tone={result.tone}
            >
              {result.message}
            </InlineActionResult>
          )}
        </div>
      )}

      {/*
        愛着が湧いた相棒の隣に棚を置く（demand-first）。
        既にスキンを着せている相棒こそ次を見たい層なので、cosmetic の有無では隠さない。
        ただしそのモンスターのスキンが1つも無いなら出さない（空棚への導線は嘘のアフォーダンス）。
      */}
      {m.isOwned && m.slug && hasPurchasableSkin && (
        <Link
          className="mt-2 block rounded border border-rune-border bg-rune-bg px-2 py-1 text-center text-[10px] text-rune transition-[filter] hover:brightness-125"
          href={`/shop/skins?monster=${encodeURIComponent(m.slug)}`}
          onClick={(event) => event.stopPropagation()}
        >
          ◨ {cosmetic ? "別のスキンを見る" : "このモンスターのスキンを見る"}
        </Link>
      )}

      {mint && <CommemorativePlate className="mt-3" plate={mint} />}
    </div>
  );
}
