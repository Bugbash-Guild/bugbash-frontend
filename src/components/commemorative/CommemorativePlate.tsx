import { formatPlateEngraving } from "@/lib/commemorativeMint";
import type { CommemorativeMintPlate } from "@/types/commemorativeMint";

type CommemorativePlateProps = {
  className?: string;
  plate: Pick<
    CommemorativeMintPlate,
    | "achievement"
    | "achievedAt"
    | "achievedAtEstimated"
    | "recolor"
    | "repositoryFullName"
  > & { mintNumber?: number };
};

const RECOLOR_STYLE: Record<string, { border: string; glow: string; metal: string }> = {
  AZURE: {
    border: "#66c7e8",
    glow: "rgba(102,199,232,0.22)",
    metal: "#294852",
  },
  CRIMSON: {
    border: "#dc6d74",
    glow: "rgba(220,109,116,0.22)",
    metal: "#512d33",
  },
};

export function CommemorativePlate({ className, plate }: CommemorativePlateProps) {
  const engraving = formatPlateEngraving({ ...plate, mintNumber: plate.mintNumber ?? 0 });
  const serial = plate.mintNumber == null ? "PENDING" : engraving.mintNumber;
  const recolor = RECOLOR_STYLE[plate.recolor] ?? {
    border: "#b7b5aa",
    glow: "rgba(183,181,170,0.18)",
    metal: "#3a3d3b",
  };

  return (
    <article
      aria-label={`${engraving.achievement} 記念プレート ${serial} ${engraving.achievedLabel} ${engraving.achievedDate}`}
      className={`relative overflow-hidden rounded-[3px] border px-3 py-2 font-mono ${className ?? ""}`}
      style={{
        background: `linear-gradient(135deg, ${recolor.metal}, #151a18 55%, ${recolor.metal})`,
        borderColor: recolor.border,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 5px 16px ${recolor.glow}`,
      }}
    >
      <div aria-hidden className="absolute inset-1 rounded-[2px] border border-white/10" />
      <div className="relative flex items-center justify-between gap-2 text-[8px] tracking-[0.13em] text-white/55">
        <span>BUGBASH / COMMEMORATIVE</span>
        <span>{serial}</span>
      </div>
      <div className="relative mt-1 text-[11px] font-semibold tracking-wide text-white/90">
        {engraving.achievement}
      </div>
      <div className="relative mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-white/60">
        <span>{engraving.achievedLabel} / {engraving.achievedDate}</span>
        <span>{engraving.repository}</span>
      </div>
    </article>
  );
}
