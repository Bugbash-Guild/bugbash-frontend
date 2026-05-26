"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/apiError";
import type { AdminMonsterInput } from "@/lib/adminMonsterCatalog";
import type { Monster } from "@/types/monster";

type AllMonstersDto = {
  monsters: { id: string; name: string; emoji: string; rarity: string }[];
};

const fetchMonsterCatalog = async (): Promise<AdminMonsterInput[]> => {
  const data = await fetchJson<AllMonstersDto>(
    "/api/monsters/all",
    undefined,
    "monsters/all",
  );

  return data.monsters.map((monster) => ({
    id: monster.id,
    name: monster.name,
    emoji: monster.emoji,
    rarity: monster.rarity as Monster["rarity"],
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
