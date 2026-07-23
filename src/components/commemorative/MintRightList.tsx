import { FiLock, FiTool } from "react-icons/fi";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import {
  getAchievementLabel,
  getMintDisplayState,
} from "@/lib/commemorativeMint";
import type { CommemorativeMintOffer } from "@/types/commemorativeMint";

type MintRightListProps = {
  offers: CommemorativeMintOffer[];
  onSelect: (offer: CommemorativeMintOffer) => void;
  selectedAchievement: string | null;
};

export function MintRightList({ offers, onSelect, selectedAchievement }: MintRightListProps) {
  return (
    <div className="space-y-2">
      {offers.map((offer) => {
        const state = getMintDisplayState(offer);
        const selected = selectedAchievement === offer.achievement;
        return (
          <button
            className={[
              "w-full border p-3 text-left transition-colors",
              selected ? "border-gold/70 bg-gold/10" : "border-line bg-bg-elev hover:border-text-faint",
              state === "locked" ? "opacity-60" : "",
            ].join(" ")}
            disabled={state === "locked"}
            key={offer.achievement}
            onClick={() => onSelect(offer)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-text">
                {state === "locked" ? <FiLock aria-hidden size={13} /> : <FiTool aria-hidden size={13} />}
                {getAchievementLabel(offer.achievement)}
              </span>
              <span className="text-[10px] text-text-faint">
                {state === "minted" ? "鋳造済み" : state === "unlocked" ? "鋳造可能" : "未達成"}
              </span>
            </div>
            {offer.mint && <CommemorativePlate className="mt-3" plate={offer.mint} />}
          </button>
        );
      })}
    </div>
  );
}
