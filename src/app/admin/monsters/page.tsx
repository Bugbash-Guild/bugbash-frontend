"use client";

import { useMemo } from "react";

import { MainWrapper } from "@/components/MainWrapper";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RARITY_COLOR } from "@/constants/rarity";
import { useMonsterCatalog } from "@/hooks/useMonsterCatalog";
import {
  buildAdminMonsterCatalog,
  type AdminMonsterCatalogItem,
  type AdminMonsterStagePreview,
} from "@/lib/adminMonsterCatalog";
import type { MonsterFormStage } from "@/types/monster";

const STAGE_TONE: Record<MonsterFormStage, string> = {
  BASE: "#7ee787",
  EVO: "#4fc9d3",
  AWAKENED: "#d2a8ff",
  AWAKENED_FINAL: "#f0d36a",
  BERSERK: "#fb7185",
  BERSERK_FINAL: "#f97316",
};

export default function AdminMonstersPage() {
  const { monsters, loading, error } = useMonsterCatalog();
  const catalog = useMemo(() => buildAdminMonsterCatalog(monsters), [monsters]);
  const artworkCount = catalog.reduce(
    (total, monster) =>
      total +
      monster.stagePreviews.filter((preview) => preview.hasArtwork).length,
    0,
  );
  const totalStageCount = catalog.length * 6;

  return (
    <MainWrapper>
      <div className="px-9 py-6">
        <div className="mb-5 text-[13px] text-text-dim">
          <span className="text-accent">admin@bugbash</span>
          <span className="text-text-faint">:</span>
          <span className="text-accent-2">~/admin/monsters</span>
          <span className="text-text-faint">$ </span>
          <span>catalog --all --forms</span>
          <span className="ml-0.5 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[28px] font-semibold">Monster Admin</div>
            <div className="mt-1 text-[12px] text-text-dim">
              {catalog.length} species · {artworkCount}/{totalStageCount} form
              slots
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {(["SSR", "SR", "R", "N"] as const).map((rarity) => {
              const count = catalog.filter(
                (monster) => monster.rarity === rarity,
              ).length;
              return (
                <span
                  key={rarity}
                  className="rounded-[4px] border px-2 py-1 font-bold tracking-[0.08em]"
                  style={{
                    borderColor: `${RARITY_COLOR[rarity]}55`,
                    color: RARITY_COLOR[rarity],
                    background: `${RARITY_COLOR[rarity]}12`,
                  }}
                >
                  {rarity} {count}
                </span>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-[13px] text-text-faint">
            loading catalog…
          </div>
        )}
        {error && (
          <div className="mb-4 text-[13px] text-pink">error: {error}</div>
        )}

        <div className="overflow-hidden rounded-[6px] border border-line bg-bg-elev">
          <div className="grid grid-cols-[210px_repeat(6,minmax(108px,1fr))] border-b border-line bg-bg-elev-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
            <div className="px-3 py-2">Species</div>
            <div className="px-2 py-2">Base</div>
            <div className="px-2 py-2">Evo</div>
            <div className="px-2 py-2">Awaken</div>
            <div className="px-2 py-2">Awaken Final</div>
            <div className="px-2 py-2">Berserk</div>
            <div className="px-2 py-2">Berserk Final</div>
          </div>

          {catalog.map((monster) => (
            <MonsterCatalogRow key={monster.id} monster={monster} />
          ))}
        </div>
      </div>
    </MainWrapper>
  );
}

function MonsterCatalogRow({ monster }: { monster: AdminMonsterCatalogItem }) {
  const rarityColor = RARITY_COLOR[monster.rarity];

  return (
    <div className="grid grid-cols-[210px_repeat(6,minmax(108px,1fr))] border-b border-line last:border-b-0">
      <div className="flex min-w-0 gap-3 border-r border-line px-3 py-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-[4px] border text-[24px]"
          style={{
            borderColor: `${rarityColor}55`,
            background: `${rarityColor}10`,
          }}
        >
          {monster.emoji}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">
            {monster.name}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em]"
              style={{
                borderColor: `${rarityColor}55`,
                color: rarityColor,
                background: `${rarityColor}14`,
              }}
            >
              {monster.rarity}
            </span>
            <span className="truncate text-[10px] text-text-faint">
              #{monster.id}
            </span>
          </div>
        </div>
      </div>

      {monster.stagePreviews.map((preview) => (
        <MonsterStageCell
          key={preview.formStage}
          monster={monster}
          preview={preview}
        />
      ))}
    </div>
  );
}

function MonsterStageCell({
  monster,
  preview,
}: {
  monster: AdminMonsterCatalogItem;
  preview: AdminMonsterStagePreview;
}) {
  const tone = STAGE_TONE[preview.formStage];

  return (
    <div className="min-w-0 border-r border-line px-2 py-3 last:border-r-0">
      <div
        className="relative mx-auto mb-2 flex aspect-square w-full max-w-[112px] items-center justify-center overflow-hidden rounded-[4px] border"
        style={{
          borderColor: preview.hasArtwork ? `${tone}44` : "var(--line)",
          background: preview.hasArtwork
            ? `radial-gradient(circle at 50% 36%, ${tone}22 0%, transparent 68%), var(--bg-elev-2)`
            : "var(--bg-elev-2)",
        }}
      >
        <MonsterVisual
          artworkByStage={monster.artworkByStage}
          assetUrl={monster.assetUrl}
          className="size-full"
          emoji={monster.emoji}
          emojiClassName="text-[42px] opacity-75"
          formStage={preview.formStage}
          id={monster.id}
          name={monster.name}
          sizes="112px"
        />
      </div>
      <div
        className="truncate text-center text-[10px] font-semibold"
        style={{ color: tone }}
      >
        {preview.label}
      </div>
      <div className="mt-0.5 text-center text-[9px] text-text-faint">
        {preview.hasArtwork ? "asset" : "emoji"}
      </div>
    </div>
  );
}
