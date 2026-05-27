"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/apiError";
import type { AdminMonsterInput } from "@/lib/adminMonsterCatalog";
import type { Monster } from "@/types/monster";

type AllMonstersDto = {
  monsters: {
    id: string;
    slug?: string;
    name: string;
    emoji: string;
    rarity: string;
    artworkByStage?: AdminMonsterInput["artworkByStage"];
  }[];
};

const fetchMonsterCatalog = async (): Promise<AdminMonsterInput[]> => {
  const data = await fetchJson<AllMonstersDto>(
    "/api/monsters/all",
    undefined,
    "monsters/all",
  );

  return data.monsters.map((monster) => ({
    id: monster.id,
    slug: monster.slug,
    name: monster.name,
    emoji: monster.emoji,
    rarity: monster.rarity as Monster["rarity"],
    artworkByStage: monster.artworkByStage,
  }));
};

export function useMonsterCatalog() {
  const { data, error, isLoading, mutate } = useSWR<AdminMonsterInput[]>(
    "admin-monster-catalog",
    fetchMonsterCatalog,
    { revalidateOnFocus: true },
  );

  return {
    monsters: data ?? [],
    loading: isLoading,
    error: error ? String(error) : null,
    refetch: () => mutate(),
  };
}
