"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useMonsters } from "@/hooks/useMonsters";
import { usePartner } from "@/hooks/usePartner";
import { MainWrapper } from "@/components/MainWrapper";
import { RARITY_COLOR, RARITY_ORDER } from "@/constants/rarity";

export default function MonstersPage() {
  const { isAuthenticated } = useAuth();
  const { monsters, loading, error, refetch } = useMonsters();
  const { partnerId, setPartner } = usePartner();
  const { hero } = useHero(isAuthenticated);
  const [levelUpError, setLevelUpError] = useState<string | null>(null);
  const [levelingUp, setLevelingUp] = useState<string | null>(null);

  const handleLevelUp = async (monsterId: string) => {
    setLevelingUp(monsterId);
    setLevelUpError(null);
    try {
      const res = await fetch(`/api/monsters/${monsterId}/level-up`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setLevelUpError(body.error ?? `Error ${res.status}`);
      } else {
        await refetch();
      }
    } catch {
      setLevelUpError('Network error');
    } finally {
      setLevelingUp(null);
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
        {levelUpError && (
          <div className="text-pink text-[13px] mb-4 px-3 py-2 rounded border border-pink/30 bg-pink/10">
            {levelUpError}
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
              <span className="text-[22px]">{partnerMonster.emoji}</span>
              <div className="flex-1">
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: RARITY_COLOR[partnerMonster.rarity] }}
                >
                  {partnerMonster.name}
                </div>
                <div className="text-xs opacity-60 mt-0.5">
                  {partnerMonster.attributeEmoji} {partnerMonster.soulCount} {partnerMonster.attributeName}ソウル
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
            return (
              <div
                key={m.id}
                className="rounded-[6px] p-3.5 relative transition-transform duration-[120ms]"
                style={{
                  background: "var(--bg-elev)",
                  border: `${isComp ? 2 : 1}px ${m.isOwned ? "solid" : "dashed"} ${
                    isComp ? c : m.isOwned ? `${c}66` : "var(--line)"
                  }`,
                  opacity: m.isOwned ? 1 : 0.5,
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
                  className="aspect-square rounded-[4px] flex items-center justify-center text-[64px] mb-2.5 border border-line"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${c}1a 0%, transparent 70%), var(--bg-elev-2)`,
                  }}
                >
                  {m.isOwned ? m.emoji : "?"}
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
                          {m.attributeEmoji || '🔮'} {m.soulCount}
                        </span>
                        <span className="text-xs text-gray-400">Lv.{m.level}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* レベルアップボタン / MAXバッジ */}
                {m.isOwned && (
                  m.level >= 30 ? (
                    <div className="mt-1 text-[10px] text-center text-yellow-400 font-bold tracking-widest border border-yellow-400/40 rounded py-0.5">
                      MAX
                    </div>
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
