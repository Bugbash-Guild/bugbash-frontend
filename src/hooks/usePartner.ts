// src/hooks/usePartner.ts
'use client';

import { useHero } from './useHero';

/**
 * パートナー（連れ歩き）モンスター。
 *
 * partnerId は `/api/hero/stats` が既に返しており、全ページの SideBar が
 * 同じ SWR キーを購読している。以前はこのフックが `/api/hero/partner` を
 * 別途 GET しており、/monsters のリクエストが 1 本まるごと重複していた。
 * 読み取りは hero/stats に相乗りし、書き込み（PUT）だけこのフックが持つ。
 */
export function usePartner() {
    const { hero, refetch } = useHero(true);

    const setPartner = async (monsterId: string): Promise<void> => {
        const res = await fetch('/api/hero/partner', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monsterId }),
        });
        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? `パートナー設定に失敗しました (HTTP ${res.status})`);
        }
        // partnerId の読み出し元である hero/stats を再検証して反映する
        await refetch();
    };

    return {
        partnerId: hero?.partnerId ?? null,
        setPartner,
    };
}
