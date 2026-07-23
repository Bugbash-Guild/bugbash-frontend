"use client";

import type { ForgeLevelDef, OwnedMonsterSkin } from "@/types/forge";
import { buildApexParticleSlots, FORGE_COSMETIC_ONLY_COPY } from "@/lib/forge";

type SkinMasteryPanelProps = {
  apex: ForgeLevelDef | undefined;
  current: ForgeLevelDef | undefined;
  disabled: boolean;
  error: string | null;
  next: ForgeLevelDef | undefined;
  onUpgrade: () => void;
  skin: OwnedMonsterSkin;
  totalPrsMerged: number;
  upgrading: boolean;
};

export function SkinMasteryPanel({
  apex,
  current,
  disabled,
  error,
  next,
  onUpgrade,
  skin,
  totalPrsMerged,
  upgrading,
}: SkinMasteryPanelProps) {
  const totalStages = apex?.level ?? 0;
  const particleSlots = buildApexParticleSlots(totalPrsMerged);

  return (
    <section aria-labelledby="mastery-heading" className="border border-line bg-bg-elev p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.12em] text-purple">SKIN MASTERY</p>
          <h2 id="mastery-heading" className="mt-1 text-[20px] font-semibold text-text">
            {skin.lineName}
          </h2>
          <p className="mt-1 text-[11px] text-text-faint">{skin.monsterSlug} · {skin.tier}</p>
        </div>
        <div className="border border-purple/35 bg-purple/10 px-2.5 py-1 text-[12px] font-semibold text-purple">
          St{skin.masteryLevel}
        </div>
      </div>

      <div aria-label={`工房ランク ${skin.masteryLevel} / ${totalStages}`} className="mt-6 grid grid-cols-10 gap-1.5">
        {Array.from({ length: totalStages }, (_, index) => index + 1).map((stage) => (
          <div
            className={`h-5 border ${
              stage <= skin.masteryLevel
                ? "border-accent bg-accent shadow-[0_0_10px_rgba(126,231,135,0.35)]"
                : stage === skin.masteryLevel + 1
                  ? "border-purple bg-purple/15"
                  : "border-line-strong bg-bg-elev-2"
            }`}
            key={stage}
            title={`St${stage}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[9px] tracking-[0.08em] text-text-faint">
        <span>ORIGIN</span>
        <span>APEX St{apex?.level ?? "?"}</span>
      </div>

      <div className="mt-6 grid gap-3 border-y border-line py-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] tracking-[0.1em] text-text-faint">CURRENT EFFECT</p>
          <p className="mt-1 text-[12px] text-text-dim">
            {current?.diffNote ?? "標準のスキン外観"}
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.1em] text-text-faint">NEXT EFFECT</p>
          <p className="mt-1 text-[12px] text-text">
            {next?.diffNote ?? "すべての工房段階を完了しました"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.1em] text-text-faint">NEXT COST</p>
          <p className="mt-1 text-[17px] font-semibold text-accent">
            {next ? `${next.runeCost.toLocaleString("ja-JP")} R` : "MAX"}
          </p>
        </div>
        <button
          className="min-h-10 bg-accent px-4 py-2 text-[12px] font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={disabled}
          onClick={onUpgrade}
          type="button"
        >
          {upgrading ? "forging…" : next ? `St${next.level} に強化` : "Apex到達"}
        </button>
      </div>
      <p className="mt-3 text-[10px] leading-5 text-text-faint">{FORGE_COSMETIC_ONLY_COPY}</p>
      <aside
        aria-label="安全な強化について"
        className="mt-3 border-l-2 border-accent-2 bg-accent-2/5 px-3 py-2 text-[10px] leading-5 text-text-dim"
      >
        <span className="font-semibold text-accent-2">SAFE UPGRADE — </span>
        見た目だけの調律です。古い表示のまま上書きしません。通信が途切れても同じ操作が二重に反映されないよう保護します。
        自動では再実行しません。状態を確認してから、必要なときだけもう一度押してください。
      </aside>

      {error && <p className="mt-3 border border-pink/30 bg-pink/10 px-3 py-2 text-[11px] text-pink">{error}</p>}

      <div className="relative mt-5 overflow-hidden border border-gold/35 bg-gold/5 px-4 py-3">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-5 gap-5 p-3">
          {particleSlots.map((slot) => (
            <span
              className="size-1 animate-pulse self-center justify-self-center rounded-full bg-gold shadow-[0_0_10px_rgba(227,179,65,0.9)]"
              key={slot}
            />
          ))}
        </div>
        <div className="relative">
          <p className="text-[10px] tracking-[0.12em] text-gold">APEX PREVIEW · St{apex?.level ?? "?"}</p>
          <p className="mt-1 text-[11px] leading-5 text-text-dim">
            {apex?.diffNote ?? "最終段階の外観はサーバー定義の読込後に表示されます。"}
          </p>
          <p className="mt-2 text-[10px] text-gold/80">
            PR SIGNAL: {totalPrsMerged.toLocaleString("ja-JP")} merged · {particleSlots.length} active particles
          </p>
        </div>
      </div>
    </section>
  );
}
