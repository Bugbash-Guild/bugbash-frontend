// src/hooks/useMonsters.ts
'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import { asArray, fetchJson, isUnauthorizedApiError } from '@/lib/apiError';
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
        prAcquirable?: boolean;
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
    /*
     * マスタと所持を別キーにしている。以前は Promise.all で 1 つの SWR
     * キーにまとめていたため、キャッシュと再検証が二つで一つに縛られていた:
     *   - 遷移するたびにマスタ（全モンスター）まで取り直し
     *   - 育成操作のあと所持だけ再検証したいのにマスタが付いてくる
     *   - 鮮度の要求が違う（マスタはリリース単位／所持は操作ごと）のに
     *     同じ revalidate 設定しか持てない
     * 分けたことでマスタ側だけ長めにキャッシュできる。
     */
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
        if (catalog.data === undefined) return [];

        /*
         * asArray で受け止めるのは、この整形が fetcher からレンダー中の
         * useMemo に移ったため。fetcher の中なら throw は SWR が拾って
         * error になるだけだが、レンダー中に throw するとページが丸ごと
         * 白画面になる（#151 が /monsters で踏んだ絵）。
         * 契約外の応答で失敗の質を変えないよう境界で潰しておく。
         */
        const allMonsters = asArray(catalog.data.monsters);
        const ownedMap = new Map(asArray(owned.data?.monsters).map((m) => [m.id, m]));

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
                // main 由来: 図鑑に入手経路を出すためマスタ側の値をそのまま通す
                prAcquirable: m.prAcquirable,
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
        /*
         * キーは分けたが loading は両方を見る。マスタだけで描き始めると
         * 所持が届くまで全モンスターが未所持として並び、
         * 「何も持っていない」ように見える一瞬が生まれる（issue #122 と同じ絵）。
         *
         * 所持が失敗したときは SWR の isLoading が false になるため、
         * ここで止まらず ownedDegraded の警告付きで描画に進む。
         */
        loading: catalog.isLoading || owned.isLoading,
        error: catalogError,
        refetch: () => Promise.all([catalog.mutate(), owned.mutate()]),
    };
}
