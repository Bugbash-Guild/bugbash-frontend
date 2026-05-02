"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMonsters } from "@/hooks/useMonsters";
import { MainWrapper } from "@/components/MainWrapper";

import { RARITY_COLOR, RARITY_ORDER } from "@/constants/rarity";

const FULL_DEX = [
  { id: "01", name: "オーク",       emoji: "🐗", rarity: "N",   requiredLevel: 1  },
  { id: "02", name: "ゴブリン",     emoji: "👹", rarity: "N",   requiredLevel: 1  },
  { id: "03", name: "スライム",     emoji: "🟢", rarity: "N",   requiredLevel: 1  },
  { id: "04", name: "ウルフ",       emoji: "🐺", rarity: "R",   requiredLevel: 5  },
  { id: "05", name: "エルフ",       emoji: "🧝", rarity: "R",   requiredLevel: 5  },
  { id: "06", name: "スケルトン",   emoji: "💀", rarity: "R",   requiredLevel: 8  },
  { id: "07", name: "ゾンビ",       emoji: "🧟", rarity: "R",   requiredLevel: 10 },
  { id: "08", name: "トロール",     emoji: "👿", rarity: "R",   requiredLevel: 12 },
  { id: "09", name: "ベアー",       emoji: "🐻", rarity: "R",   requiredLevel: 15 },
  { id: "10", name: "ウィザード",   emoji: "🧙", rarity: "SR",  requiredLevel: 18 },
  { id: "11", name: "オーガ",       emoji: "👹", rarity: "SR",  requiredLevel: 20 },
  { id: "12", name: "グリフォン",   emoji: "🦅", rarity: "SR",  requiredLevel: 22 },
  { id: "13", name: "タイガー",     emoji: "🐅", rarity: "SR",  requiredLevel: 25 },
  { id: "14", name: "ダークエルフ", emoji: "🧝‍♀️", rarity: "SR",  requiredLevel: 28 },
  { id: "15", name: "ディアウルフ", emoji: "🐺", rarity: "SR",  requiredLevel: 30 },
  { id: "16", name: "ワイバーン",   emoji: "🦇", rarity: "SR",  requiredLevel: 32 },
  { id: "17", name: "デーモン",     emoji: "😈", rarity: "SSR", requiredLevel: 35 },
  { id: "18", name: "ドラゴン",     emoji: "🐉", rarity: "SSR", requiredLevel: 40 },
  { id: "19", name: "バンパイア",   emoji: "🧛", rarity: "SSR", requiredLevel: 45 },
  { id: "20", name: "フェニックス", emoji: "🔥", rarity: "SSR", requiredLevel: 50 },
] as const;


export default function MonstersPage() {
  const { isAuthenticated } = useAuth();
  const { monsters, loading, error } = useMonsters();
  const [companion, setCompanion] = useState<string>("18");

  // merge owned data with full dex — match by name (backend uses UUIDs, not numeric IDs)
  const ownedByName: Record<string, { count: number; emoji: string }> = {};
  monsters.forEach((m) => {
    if (!ownedByName[m.name]) ownedByName[m.name] = { count: 0, emoji: m.emoji };
    ownedByName[m.name].count += 1;
  });

  const dex = FULL_DEX.map((m) => {
    const owned = ownedByName[m.name];
    return {
      ...m,
      emoji: owned ? owned.emoji : m.emoji,
      owned: owned?.count ?? 0,
      discovered: !!owned,
    };
  }).sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.id.localeCompare(b.id)
  );

  const companionMon = dex.find((m) => m.id === companion);
  const discoveredCount = dex.filter((m) => m.discovered).length;

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
          <div className="text-[11px] text-text-faint">
            [&nbsp;<span className="text-accent">list</span>&nbsp;| grid | tree&nbsp;]
          </div>
        </div>

        {/* loading / error */}
        {loading && <div className="text-text-faint text-[13px] mb-4">loading dex…</div>}
        {error && <div className="text-pink text-[13px] mb-4">error: {error}</div>}

        {/* FAVORITE banner */}
        {companionMon && (
          <div
            className="mb-4 px-3.5 py-2.5 rounded-[4px] flex items-center gap-3"
            style={{
              background: `${RARITY_COLOR[companionMon.rarity]}10`,
              border: `1px solid ${RARITY_COLOR[companionMon.rarity]}55`,
            }}
          >
            <span className="text-[9px] text-text-faint tracking-[0.12em]">FAVORITE / 連れている</span>
            <span className="text-[22px]">{companionMon.emoji}</span>
            <span className="text-[13px] font-semibold" style={{ color: RARITY_COLOR[companionMon.rarity] }}>
              {companionMon.name}
            </span>
            <span className="flex-1 text-text-faint text-[10px]">← クリックで連れているモンスターを変更</span>
            <span className="text-[11px] text-text-faint">
              {discoveredCount} / {FULL_DEX.length} discovered
            </span>
          </div>
        )}

        {/* 4-column dex grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(max(130px, calc((100% - 72px) / 7)), 1fr))" }}>
          {dex.map((m) => {
            const c = RARITY_COLOR[m.rarity];
            const isComp = m.id === companion;
            return (
              <div
                key={m.id}
                onClick={() => { if (m.discovered) setCompanion(m.id); }}
                className="rounded-[6px] p-3.5 relative transition-transform duration-[120ms]"
                style={{
                  background: "var(--bg-elev)",
                  border: `${isComp ? 2 : 1}px ${m.discovered ? "solid" : "dashed"} ${
                    isComp ? c : m.discovered ? `${c}66` : "var(--line)"
                  }`,
                  opacity: m.discovered ? 1 : 0.5,
                  boxShadow: isComp
                    ? `0 0 0 1px ${c}aa, 0 8px 24px ${c}33`
                    : m.discovered && m.rarity === "SSR"
                    ? `inset 0 0 24px ${c}22`
                    : "none",
                  cursor: m.discovered ? "pointer" : "not-allowed",
                }}
              >
                {/* FAVORITE badge */}
                {isComp && (
                  <div
                    className="absolute -top-2 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-[2px] tracking-[0.1em]"
                    style={{ background: c, color: "var(--bg)" }}
                  >
                    ★ FAVORITE
                  </div>
                )}

                {/* id + rarity */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-text-faint">#{m.id}</span>
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
                  {m.discovered ? m.emoji : "?"}
                </div>

                {/* name */}
                <div
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: m.discovered ? "var(--text)" : "var(--text-faint)" }}
                >
                  {m.discovered ? m.name : "???"}
                </div>

                {/* stats */}
                <div className="text-[10px] text-text-faint leading-[1.5]">
                  <div className="whitespace-nowrap">Lv.{m.requiredLevel}+</div>
                  <div className="whitespace-nowrap">
                    <span style={{ color: m.discovered ? "var(--accent)" : "var(--pink)" }}>
                      {m.discovered ? `×${m.owned}` : "not_found"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainWrapper>
  );
}
