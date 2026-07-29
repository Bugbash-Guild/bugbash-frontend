// src/hooks/useMonsters.ts
'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import { fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
import type { AwakeningState, Monster, MonsterFormStage } from '@/types/monster';
import { useRedirectOnUnauthorized } from './useRedirectOnUnauthorized';

type AllMonstersDto = {
    monsters: {
        id: string;
        slug?: string;
        name: string;
        emoji: string;
        rarity: string;
        artworkByStage?: Partial<Record<MonsterFormStage, string>>;
    }[];
};
type OwnedMonstersDto = {
    monsters: {
        id: string;
        ownedMonsterId?: string | number;
        acquiredAt?: string;
        slug?: string;
        soulCount: number;
        level: number;
        awakeningState: AwakeningState;
        formStage: MonsterFormStage;
        assetUrl?: string | null;
        artworkByStage?: Partial<Record<MonsterFormStage, string>>;
        attribute: string;
        attributeName: string;
        attributeEmoji: string;
    }[];
};

const CATALOG_KEY = '/api/monsters/all';
const OWNED_KEY = '/api/monsters/owned';

/** マスタデータはリリースでしか変わらないので、遷移ごとに取り直さない。 */
const CATALOG_DEDUPING_INTERVAL_MS = 5 * 60 * 1000;

const fetchCatalog = (url: string) => fetchJson<AllMonstersDto>(url, undefined, 'monsters/all');
const fetchOwned = (url: string) => fetchJson<OwnedMonstersDto>(url, undefined, 'monsters/owned');

export function useMonsters() {
    // マスタと所持を別キーにしている。以前は Promise.all で 1 つの
    // SWR キーにまとめていたため、
    //   - どちらか片方が遅いだけで図鑑全体が loading のまま
    //   - 遷移するたびにマスタ（全モンスター）も取り直し
    //   - 所持だけ再検証したいときもマスタが付いてくる
    // という状態だった。
    // dedupingInterval だけで抑えて revalidateIfStale は切らない。
    // 「セッション中ずっと取り直さない」にするとリリースで増えた
    // モンスターがリロードまで出てこないため。
    const catalog = useSWR<AllMonstersDto>(CATALOG_KEY, fetchCatalog, {
        dedupingInterval: CATALOG_DEDUPING_INTERVAL_MS,
        revalidateOnFocus: false,
    });

    const owned = useSWR<OwnedMonstersDto>(OWNED_KEY, fetchOwned, {
        revalidateOnFocus: true,
    });

    // 片方の非 401 エラーがもう片方の 401 を隠さないよう、それぞれ渡す。
    useRedirectOnUnauthorized(catalog.error);
    useRedirectOnUnauthorized(owned.error);

    /**
     * 所持の取得に失敗した状態（401以外）。この間 isOwned は信頼できない。
     * 以前は黙って空配列にフォールバックしており、エラー表示なしで
     * 「全モンスター未所持」に見えていた（issue #122）。
     * キーを分けても「所持だけ失敗」は黙らせない。
     */
    const ownedDegraded = Boolean(owned.error) && !isUnauthorizedApiError(owned.error);

    const monsters = useMemo<Monster[]>(() => {
        const allMonsters = catalog.data?.monsters;
        if (!allMonsters) return [];

        const ownedMap = new Map((owned.data?.monsters ?? []).map((m) => [m.id, m]));

        return allMonsters.map((m) => {
            const ownedMonster = ownedMap.get(m.id);
            return {
                id: m.id,
                ownedMonsterId: ownedMonster?.ownedMonsterId,
                acquiredAt: ownedMonster?.acquiredAt,
                slug: ownedMonster?.slug ?? m.slug,
                name: m.name,
                emoji: m.emoji,
                rarity: m.rarity as Monster['rarity'],
                isOwned: ownedMap.has(m.id),
                attribute: ownedMonster?.attribute,
                attributeName: ownedMonster?.attributeName,
                attributeEmoji: ownedMonster?.attributeEmoji,
                soulCount: ownedMonster?.soulCount ?? 0,
                level: ownedMonster?.level ?? 1,
                awakeningState: ownedMonster?.awakeningState,
                formStage: ownedMonster?.formStage,
                assetUrl: ownedMonster?.assetUrl,
                artworkByStage: ownedMonster?.artworkByStage ?? m.artworkByStage,
            };
        });
    }, [catalog.data, owned.data]);

    // 所持側の失敗は error ではなく ownedDegraded で伝える（表示が二重になるのを避ける）。
    const catalogError =
        catalog.error && !isUnauthorizedApiError(catalog.error) ? String(catalog.error) : null;

    return {
        monsters,
        ownedDegraded,
        // 図鑑の枠を出せるのはマスタが来た時点。所持はその上に載る差分なので、
        // 所持待ちでスケルトンを見せ続けない。
        loading: catalog.isLoading,
        ownedLoading: owned.isLoading,
        error: catalogError,
        refetch: () => Promise.all([catalog.mutate(), owned.mutate()]),
    };
}
