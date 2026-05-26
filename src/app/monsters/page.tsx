"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useMonsters } from "@/hooks/useMonsters";
import { usePartner } from "@/hooks/usePartner";
import { MainWrapper } from "@/components/MainWrapper";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RARITY_COLOR, RARITY_ORDER } from "@/constants/rarity";
import { cn } from "@/lib/cn";

const AWAKENING_LABEL: Partial<Record<import('@/types/monster').AwakeningState, string>> = {
  AWAKENED: "✨覚醒",
  BERSERK: "🔥暴走",
};

export default function MonstersPage() {
  const { isAuthenticated } = useAuth();
  const { monsters, loading, error, refetch } = useMonsters();
  const { partnerId, setPartner } = usePartner();
  const { hero, refetch: refetchHero } = useHero(isAuthenticated);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [levelingUp, setLevelingUp] = useState<string | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);
  const [changingPath, setChangingPath] = useState<string | null>(null);

  const handleLevelUp = async (monsterId: string) => {
    setLevelingUp(monsterId);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/level-up`, { method: 'POST' });
      const body = await res.json() as { newLevel?: number; soulsRemaining?: number; guildCoinBalance?: number; error?: string };
      if (!res.ok) {
        setActionError(body.error ?? `Error ${res.status}`);
      } else {
        setSuccessMsg(`Lv.${body.newLevel ?? '?'} に上昇！`);
        await Promise.all([refetch(), refetchHero()]);
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLevelingUp(null);
    }
  };

  const handleChangePath = async (monsterId: string) => {
    setChangingPath(monsterId);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/change-path`, { method: 'POST' });
      const body = await res.json() as { awakeningState?: import('@/types/monster').AwakeningState; itemRemaining?: number; error?: string };
      if (!res.ok) {
        setActionError(body.error ?? `Error ${res.status}`);
      } else {
        const label = body.awakeningState ? (AWAKENING_LABEL[body.awakeningState] ?? body.awakeningState) : '?';
        setSuccessMsg(`路線変更：${label}（証残数: ${body.itemRemaining ?? '?'}）`);
        await Promise.all([refetch(), refetchHero()]);
      }
    } catch {
      setActionError('Network error');
    } finally {
      setChangingPath(null);
    }
  };

  const handleEvolve = async (monsterId: string) => {
    setEvolving(monsterId);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/evolve`, { method: 'POST' });
      const body = await res.json() as { awakeningState?: string; evolutionStonesRemaining?: number; error?: string };
      if (!res.ok) {
        setActionError(body.error ?? `Error ${res.status}`);
      } else {
        setSuccessMsg(`覚醒：${body.awakeningState ?? '?'}`);
        await Promise.all([refetch(), refetchHero()]);
      }
    } catch {
      setActionError('Network error');
    } finally {
      setEvolving(null);
    }
  };

  const dex = [...monsters].sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.id.localeCompare(b.id)
  );

  const partnerMonster = dex.find((m) => m.id === partnerId) ?? null;
  const discoveredCount = dex.filter((m) => m.isOwned).length;

  return (
    <MainWrapper>
      <div className="px-9 py-6">
        {/* prompt header */}
        <div className="text-[13px] text-text-dim mb-5">
          <span className="text-accent">{isAuthenticated ? "hero" : "guest"}@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/monsters</span>
          <span className="text-text-faint">$ </span>
          <span>cat dex/*.card --format=detailed</span>
          <span className="inline-block w-2 h-[14px] ml-0.5 bg-accent align-middle animate-pulse" />
        </div>

        {/* page header */}
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <div className="text-[28px] font-semibold">Monster Dex</div>
            <div className="text-[12px] text-text-dim mt-1">
              detailed view · sorted by rarity
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hero && (
              <div className="text-[13px] text-text-dim">
                🪙 <span className="text-accent font-semibold">{hero.guildCoinBalance}</span> G
              </div>
            )}
            <div className="text-[11px] text-text-faint">
              [&nbsp;<span className="text-accent">list</span>&nbsp;| grid | tree&nbsp;]
            </div>
          </div>
        </div>

        {/* loading / error */}
        {loading && <div className="text-text-faint text-[13px] mb-4">loading dex…</div>}
        {error && <div className="text-pink text-[13px] mb-4">error: {error}</div>}
        {successMsg && (
          <div className="text-accent text-[13px] mb-4 px-3 py-2 rounded border border-accent/30 bg-accent/10">
            ✓ {successMsg}
          </div>
        )}
        {actionError && (
          <div className="text-pink text-[13px] mb-4 px-3 py-2 rounded border border-pink/30 bg-pink/10">
            {actionError}
          </div>
        )}

        {/* PARTNER banner */}
        <div
          className="mb-4 px-3.5 py-2.5 rounded-[4px]"
          style={{
            background: partnerMonster
              ? `${RARITY_COLOR[partnerMonster.rarity]}10`
              : "var(--bg-elev)",
            border: partnerMonster
              ? `1px solid ${RARITY_COLOR[partnerMonster.rarity]}55`
              : "1px solid var(--line)",
          }}
        >
          {partnerMonster ? (
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-text-faint tracking-[0.12em]">PARTNER / パートナー</span>
              <MonsterVisual
                className="size-8"
                emoji={partnerMonster.emoji}
                emojiClassName="text-[22px]"
                formStage={partnerMonster.formStage}
                id={partnerMonster.id}
                awakeningState={partnerMonster.awakeningState}
                level={partnerMonster.level}
                name={partnerMonster.name}
                sizes="32px"
              />
              <div className="flex-1">
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: RARITY_COLOR[partnerMonster.rarity] }}
                >
                  {partnerMonster.name}
                </div>
                <div className="text-xs opacity-60 mt-0.5">
                  {partnerMonster.attributeEmoji ?? ''} {partnerMonster.soulCount} {partnerMonster.attributeName ?? ''}ソウル
                </div>
              </div>
              <span className="text-xs text-yellow-400 border border-yellow-400 px-2 py-0.5 rounded">
                ✨ パートナー中
              </span>
              <span className="text-[11px] text-text-faint">
                {discoveredCount} / {dex.length} discovered
              </span>
            </div>
          ) : (
            <div className="p-1 text-sm opacity-40">
              モンスターカードをクリックしてパートナーに設定しよう
            </div>
          )}
        </div>

        {/* 4-column dex grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(max(130px, calc((100% - 72px) / 7)), 1fr))" }}>
          {dex.map((m) => {
            const c = RARITY_COLOR[m.rarity];
            const isComp = m.id === partnerId;
            const isAwakened = m.awakeningState && m.awakeningState !== "NORMAL";
            const canEvolve = m.isOwned && m.level >= 30 && m.awakeningState === "NORMAL";
            return (
              <div
                key={m.id}
                className="rounded-[6px] p-3.5 relative transition-transform duration-[120ms]"
                style={{
                  background: m.isOwned ? "var(--bg-elev)" : "var(--bg-elev-2)",
                  border: `${isComp ? 2 : 1}px ${m.isOwned ? "solid" : "dashed"} ${
                    isComp ? c : m.isOwned ? `${c}66` : "var(--line-strong)"
                  }`,
                  opacity: m.isOwned ? 1 : 0.6,
                  boxShadow: isComp
                    ? `0 0 0 1px ${c}aa, 0 8px 24px ${c}33`
                    : m.isOwned && m.rarity === "SSR"
                    ? `inset 0 0 24px ${c}22`
                    : "none",
                  cursor: m.isOwned ? "pointer" : "not-allowed",
                }}
              >
                {/* PARTNER badge */}
                {isComp && (
                  <div
                    className="absolute -top-2 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-[2px] tracking-[0.1em]"
                    style={{ background: c, color: "var(--bg)" }}
                  >
                    ★ PARTNER
                  </div>
                )}

                {/* id + rarity */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-text-faint">#{m.id.slice(0, 8)}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-[0.1em]"
                    style={{ color: c, background: `${c}14`, border: `1px solid ${c}55` }}
                  >
                    {m.rarity}
                  </span>
                </div>

                {/* portrait */}
                <div
                  className="aspect-square rounded-[4px] flex items-center justify-center text-[64px] mb-2.5 border border-line relative overflow-hidden"
                  style={{
                    background: m.isOwned
                      ? `radial-gradient(circle at 50% 40%, ${c}1a 0%, transparent 70%), var(--bg-elev-2)`
                      : "var(--bg-elev-2)",
                  }}
                >
                  <MonsterVisual
                    className="size-full"
                    emoji={m.emoji}
                    emojiClassName={cn(
                      "text-[64px] select-none",
                      !m.isOwned && "brightness-0 opacity-35",
                    )}
                    formStage={m.formStage}
                    id={m.id}
                    imageClassName={!m.isOwned ? "brightness-0 opacity-35" : undefined}
                    awakeningState={m.awakeningState}
                    level={m.level}
                    name={m.name}
                    sizes="160px"
                  />
                  {!m.isOwned && (
                    <span className="absolute bottom-1 right-1.5 text-[9px] text-text-faint tracking-[0.1em] opacity-80">
                      ???
                    </span>
                  )}
                </div>

                {/* name */}
                <div
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: m.isOwned ? "var(--text)" : "var(--text-faint)" }}
                >
                  {m.isOwned ? m.name : "???"}
                </div>

                {/* stats */}
                <div className="text-[10px] text-text-faint leading-[1.5]">
                  <div className="whitespace-nowrap">
                    <span style={{ color: m.isOwned ? "var(--accent)" : "var(--pink)" }}>
                      {m.isOwned ? "所持中" : "未入手"}
                    </span>
                  </div>

                  {/* 属性 + ソウル + レベル（所持のみ） */}
                  {m.isOwned && (
                    <>
                      {m.attributeName && (
                        <div className="mt-1">
                          <span className="text-[9px] px-1 py-0.5 rounded opacity-60 bg-white/5">
                            {m.attributeEmoji} {m.attributeName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-50">
                          soul × {m.soulCount}
                        </span>
                        <span className="text-xs text-gray-400">Lv.{m.level}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 覚醒済みバッジ / 進化ボタン / レベルアップボタン */}
                {m.isOwned && (
                  isAwakened ? (
                    <div className="mt-1 space-y-1">
                      <div
                        className="text-[10px] text-center font-bold tracking-widest rounded py-0.5"
                        style={{
                          color: m.awakeningState === "BERSERK" ? "#f97316" : "#a78bfa",
                          border: `1px solid ${m.awakeningState === "BERSERK" ? "#f9731640" : "#a78bfa40"}`,
                        }}
                      >
                        {m.awakeningState && (AWAKENING_LABEL[m.awakeningState] ?? m.awakeningState)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleChangePath(m.id);
                        }}
                        disabled={changingPath === m.id}
                        className="w-full text-[10px] px-2 py-0.5 rounded border border-current opacity-60 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
                        style={{ color: m.awakeningState === "BERSERK" ? "#a78bfa" : "#f97316" }}
                      >
                        {changingPath === m.id ? "…" : "🔄 路線変更"}
                      </button>
                    </div>
                  ) : canEvolve ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleEvolve(m.id);
                      }}
                      disabled={evolving === m.id}
                      className="mt-1 w-full text-[10px] px-2 py-0.5 rounded border border-current opacity-80 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
                      style={{ color: "#a78bfa" }}
                    >
                      {evolving === m.id ? "…" : "💎 進化 (Lv MAX)"}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleLevelUp(m.id);
                      }}
                      disabled={m.soulCount < m.level * 3 || levelingUp === m.id}
                      className="mt-1 w-full text-[10px] px-2 py-0.5 rounded border border-current opacity-60 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
                      style={{ color: c }}
                    >
                      {levelingUp === m.id
                        ? "…"
                        : `Lv UP (${m.level * 3} ${m.attributeEmoji || ''})`}
                    </button>
                  )
                )}

                {/* パートナー設定ボタン / バッジ */}
                {m.isOwned && isComp && (
                  <div className="mt-1 text-xs text-yellow-400 text-center">✨ パートナー中</div>
                )}
                {m.isOwned && !isComp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void setPartner(m.id);
                    }}
                    className="mt-1 w-full text-xs px-2 py-0.5 rounded border border-current opacity-40 hover:opacity-90 transition-opacity"
                  >
                    パートナーに設定
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainWrapper>
  );
}
