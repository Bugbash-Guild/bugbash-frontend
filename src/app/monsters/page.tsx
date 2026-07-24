"use client";

import { useMemo, useState } from "react";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { MainWrapper } from "@/components/MainWrapper";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RARITY_COLOR } from "@/constants/rarity";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useMonsters } from "@/hooks/useMonsters";
import { usePartner } from "@/hooks/usePartner";
import { useSkinCatalog } from "@/hooks/useSkinCatalog";
import { usePublicCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { matchMintToOwnedMonster } from "@/lib/commemorativeMint";
import {
  canEvolveMonster,
  canLevelUpMonster,
  getMonsterLevelUpCost,
  isMonsterAwakened,
  MONSTER_EVOLUTION_LEVEL,
  MONSTER_MAX_LEVEL,
} from "@/lib/monsterProgression";
import type { CommemorativeMintPlate } from "@/types/commemorativeMint";
import type { AwakeningState, Monster } from "@/types/monster";

type RarityKey = "SSR" | "SR" | "R" | "N";
type FilterKey = "all" | RarityKey;

const RARITY_GROUPS: RarityKey[] = ["SSR", "SR", "R", "N"];
const FILTERS: FilterKey[] = ["all", "SSR", "SR", "R", "N"];

const AWAKENING_LABEL: Partial<Record<AwakeningState, string>> = {
  AWAKENED: "覚醒",
  BERSERK: "暴走",
};

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
  const { isAuthenticated, user } = useAuth();
  const { monsters, loading, error, refetch } = useMonsters();
  const { partnerId, setPartner } = usePartner();
  const { ownedSkins } = useSkinCatalog(isAuthenticated);
  const { refetch: refetchHero } = useHero(isAuthenticated);
  const { mints } = usePublicCommemorativeMints(user?.githubId);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [levelingUp, setLevelingUp] = useState<string | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);
  const [changingPath, setChangingPath] = useState<string | null>(null);

  async function runAction(
    monsterId: string,
    action: "level-up" | "evolve" | "change-path",
    setBusy: (id: string | null) => void,
    describe: (body: Record<string, unknown>) => string,
  ) {
    setBusy(monsterId);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/${action}`, {
        method: "POST",
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setActionError((body.error as string) ?? `Error ${res.status}`);
      } else {
        setSuccessMsg(describe(body));
        await Promise.all([refetch(), refetchHero()]);
      }
    } catch {
      setActionError("Network error");
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

  const dex = useMemo(
    () => [...monsters].sort((a, b) => a.id.localeCompare(b.id)),
    [monsters],
  );
  // 装備中スキンのマスタリー（コスメ・琥珀）を monsterSlug で引けるようにする
  const cosmeticBySlug = useMemo(() => {
    const map = new Map<string, { masteryLevel: number; lineName: string }>();
    for (const skin of ownedSkins) {
      if (skin.equipped) {
        map.set(skin.monsterSlug, {
          masteryLevel: skin.masteryLevel,
          lineName: skin.lineName,
        });
      }
    }
    return map;
  }, [ownedSkins]);

  const partnerMonster = dex.find((m) => m.id === partnerId) ?? null;
  const discoveredCount = dex.filter((m) => m.isOwned).length;
  const ownedInstances = dex.reduce((sum, m) => sum + (m.isOwned ? 1 : 0), 0);

  const visibleGroups = RARITY_GROUPS.filter(
    (g) => filter === "all" || filter === g,
  ).map((g) => ({
    rarity: g,
    items: dex.filter((m) => m.rarity === g),
  })).filter((group) => group.items.length > 0);

  return (
    <MainWrapper>
      <ConsoleTopbar command="cat dex/*.card --format=detailed" path="~/monsters" showWallet />
      <div className="px-9 py-6">
        {/* page header + filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Monster Dex</h1>
            <p className="mt-1.5 text-[12.5px] leading-7 text-text-dim">
              discovered <b className="text-accent">{discoveredCount}</b> / {dex.length}
              {" · "}owned <b className="text-accent">{ownedInstances}</b> instances{" · "}
              進化/覚醒＝<span className="text-accent">活動由来</span>
            </p>
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
        {loading && <p className="mt-4 text-[13px] text-text-faint">loading dex…</p>}
        {error && <p className="mt-4 text-[13px] text-pink">error: {error}</p>}
        {successMsg && (
          <p className="mt-4 rounded border border-accent/30 bg-accent/10 px-3 py-2 text-[13px] text-accent">
            {successMsg}
          </p>
        )}
        {actionError && (
          <p className="mt-4 rounded border border-pink/30 bg-pink/10 px-3 py-2 text-[13px] text-pink">
            {actionError}
          </p>
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
                      mint={matchMintToOwnedMonster(mints, m.ownedMonsterId)}
                      busy={{
                        levelingUp: levelingUp === m.id,
                        evolving: evolving === m.id,
                        changingPath: changingPath === m.id,
                      }}
                      onSetPartner={() => void setPartner(m.id)}
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
    </MainWrapper>
  );
}

function MonsterCard({
  monster: m,
  isPartner,
  cosmetic,
  mint,
  busy,
  onSetPartner,
  onLevelUp,
  onEvolve,
  onChangePath,
}: {
  monster: Monster;
  isPartner: boolean;
  cosmetic: { masteryLevel: number; lineName: string } | null;
  mint: CommemorativeMintPlate | undefined;
  busy: { levelingUp: boolean; evolving: boolean; changingPath: boolean };
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
  const levelUpCost = getMonsterLevelUpCost(m.level);

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
            <span
              title={`${cosmetic.lineName} スキン装備（コスメ・見た目のみ）`}
              className="inline-flex items-center rounded-[2px] border border-rune-border bg-rune-bg px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-rune"
            >
              ⚒ St{cosmetic.masteryLevel} · COSMETIC
            </span>
          )}
        </div>
      )}

      {/* management actions (real functionality, kept subtle) */}
      {m.isOwned && (
        <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
          {canLevelUp && (
            <button
              type="button"
              onClick={onLevelUp}
              disabled={m.soulCount < levelUpCost || busy.levelingUp}
              className="w-full rounded border border-accent/40 px-2 py-1 text-[10px] text-accent transition-opacity hover:bg-accent/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.levelingUp ? "…" : `Lv UP (${levelUpCost} ${m.attributeName ?? "soul"})`}
            </button>
          )}
          {canEvolve && (
            <button
              type="button"
              onClick={onEvolve}
              disabled={busy.evolving}
              className="w-full rounded border border-purple/40 px-2 py-1 text-[10px] text-purple transition-opacity hover:bg-purple/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.evolving ? "…" : `進化 (Lv${MONSTER_EVOLUTION_LEVEL}+)`}
            </button>
          )}
          {awakened && (
            <button
              type="button"
              onClick={onChangePath}
              disabled={busy.changingPath}
              className="w-full rounded border border-line-strong px-2 py-1 text-[10px] text-text-dim transition-opacity hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.changingPath ? "…" : "路線変更"}
            </button>
          )}
          {!canLevelUp && !canEvolve && m.level >= MONSTER_MAX_LEVEL && (
            <div className="rounded border border-line py-1 text-center text-[10px] font-bold tracking-widest text-text-faint">
              Lv.{MONSTER_MAX_LEVEL}
            </div>
          )}
        </div>
      )}

      {mint && <CommemorativePlate className="mt-3" plate={mint} />}
    </div>
  );
}
