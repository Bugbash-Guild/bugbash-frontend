"use client";

import type { OwnedMonsterSkin } from "@/types/forge";

type SkinTargetListProps = {
  onSelect: (skinId: string) => void;
  selectedSkinId: string | null;
  skins: OwnedMonsterSkin[];
};

export function SkinTargetList({
  onSelect,
  selectedSkinId,
  skins,
}: SkinTargetListProps) {
  return (
    <section aria-labelledby="forge-targets-heading" className="border border-line bg-bg-elev">
      <div className="border-b border-line px-4 py-3">
        <p className="text-[10px] tracking-[0.12em] text-text-faint">OWNED SKINS</p>
        <h2 id="forge-targets-heading" className="mt-1 text-[14px] font-semibold text-text">
          強化対象
        </h2>
      </div>
      <div className="divide-y divide-line">
        {skins.map((skin) => {
          const selected = skin.skinId === selectedSkinId;
          return (
            <button
              aria-pressed={selected}
              className={`w-full border-l-2 px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-accent bg-accent/8"
                  : "border-transparent hover:bg-bg-elev-2"
              }`}
              key={skin.skinId}
              onClick={() => onSelect(skin.skinId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-text">{skin.lineName}</p>
                  <p className="mt-1 truncate text-[10px] text-text-faint">{skin.monsterSlug}</p>
                </div>
                <div className="shrink-0 text-right">
                  {skin.equipped && (
                    <span className="border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent">
                      EQUIPPED
                    </span>
                  )}
                  <p className="mt-1 text-[11px] font-semibold text-purple">St{skin.masteryLevel}</p>
                </div>
              </div>
            </button>
          );
        })}
        {skins.length === 0 && (
          <p className="px-4 py-8 text-center text-[11px] leading-5 text-text-dim">
            所有済みスキンはまだありません。
          </p>
        )}
      </div>
    </section>
  );
}
