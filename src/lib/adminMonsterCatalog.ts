import { RARITY_ORDER } from "../constants/rarity";
import { getMonsterArtwork } from "./monsterArtwork";
import type { Monster, MonsterFormStage } from "../types/monster";

export type AdminMonsterInput = Pick<
  Monster,
  "emoji" | "id" | "name" | "rarity"
> &
  Pick<Monster, "artworkByStage" | "assetUrl" | "slug">;

export type AdminMonsterStagePreview = {
  formStage: MonsterFormStage;
  label: string;
  hasArtwork: boolean;
};

export type AdminMonsterCatalogItem = AdminMonsterInput & {
  stagePreviews: AdminMonsterStagePreview[];
};

export const ADMIN_MONSTER_FORM_STAGES: {
  formStage: MonsterFormStage;
  label: string;
}[] = [
  { formStage: "BASE", label: "Base" },
  { formStage: "EVO", label: "Evo" },
  { formStage: "AWAKENED", label: "Awaken" },
  { formStage: "AWAKENED_FINAL", label: "Awaken Final" },
  { formStage: "BERSERK", label: "Berserk" },
  { formStage: "BERSERK_FINAL", label: "Berserk Final" },
];

export function getAdminMonsterStagePreviews(
  monster: AdminMonsterInput,
): AdminMonsterStagePreview[] {
  return ADMIN_MONSTER_FORM_STAGES.map(({ formStage, label }) => ({
    formStage,
    label,
    hasArtwork:
      getMonsterArtwork({
        formStage,
        assetUrl: monster.assetUrl,
        artworkByStage: monster.artworkByStage,
        id: monster.id,
        name: monster.name,
      }) !== null,
  }));
}

export function buildAdminMonsterCatalog(
  monsters: AdminMonsterInput[],
): AdminMonsterCatalogItem[] {
  return [...monsters]
    .sort((a, b) => {
      const rarityDelta = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      if (rarityDelta !== 0) return rarityDelta;

      return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    })
    .map((monster) => ({
      ...monster,
      stagePreviews: getAdminMonsterStagePreviews(monster),
    }));
}
