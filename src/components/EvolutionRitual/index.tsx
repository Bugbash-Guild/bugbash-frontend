'use client';

import { useEffect, useRef, useState } from 'react';

import { MonsterVisual } from '@/components/MonsterVisual';
import type { AwakeningState, MonsterFormStage } from '@/types/monster';

/** 儀式の演出時間。長くても1.6秒に収める（作業の邪魔をしない）。 */
const RITUAL_DURATION_MS = 1600;

type Props = {
    /** 進化後の覚醒状態。BE の応答をそのまま渡す。 */
    awakeningState: AwakeningState;
    /** 進化後の形態。アートの差し替えに使う。 */
    formStage?: MonsterFormStage;
    monsterName: string;
    /** 進化後のアートURL。無ければ名前から解決する。 */
    assetUrl?: string | null;
    onClose: () => void;
};

const ROUTE_LABEL: Record<AwakeningState, string> = {
    NORMAL: '進化',
    AWAKENED: '覚醒',
    BERSERK: '暴走',
};

/** 覚醒は金、暴走はピンク。名声（緑）とも課金（琥珀）とも混ぜない。 */
const ROUTE_COLOR: Record<AwakeningState, string> = {
    NORMAL: 'var(--accent)',
    AWAKENED: 'var(--grade-5)',
    BERSERK: 'var(--pink)',
};

const ROUTE_NOTE: Record<AwakeningState, string> = {
    NORMAL: '姿が変わりました。',
    AWAKENED: '聖なる路線へ進みました。深淵の証で暴走へ変えられます。',
    BERSERK: '闇の路線へ進みました。浄化の証で覚醒へ変えられます。',
};

/**
 * 分岐進化（覚醒／暴走）の儀式演出。
 *
 * 育成の最大の山場でありながら、これまでは結果がテキスト1行で流れるだけだった。
 * 覚醒か暴走かはランダムなので、「どちらに転んだか」を見せる瞬間を作る。
 *
 * 方針:
 * - 1.6秒で終わる。クリック・ESC・どこでもいつでもスキップできる
 * - 結果は最初から確定している（演出が抽選しているように見せない）
 * - 能力差は無い（コスメ）ので、強さを匂わせる表現はしない
 */
export function EvolutionRitual({
    awakeningState,
    formStage,
    monsterName,
    assetUrl,
    onClose,
}: Props) {
    const [revealed, setRevealed] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const color = ROUTE_COLOR[awakeningState];

    useEffect(() => {
        const timer = window.setTimeout(() => setRevealed(true), RITUAL_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, []);

    // 演出はいつでも飛ばせる。待たされる時間を作らない。
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            if (revealed) {
                onClose();
            } else {
                setRevealed(true);
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, revealed]);

    // アニメーションを止めている利用者には最初から結果を出す。
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (query.matches) setRevealed(true);
    }, []);

    useEffect(() => {
        dialogRef.current?.focus();
    }, []);

    /** 演出中なら結果まで飛ばし、結果が出ていれば閉じる。 */
    function skipOrClose() {
        if (revealed) {
            onClose();
        } else {
            setRevealed(true);
        }
    }

    return (
        <div
            aria-labelledby="evolution-ritual-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={skipOrClose}
            role="dialog"
        >
            <div
                className="w-full max-w-[380px] rounded-[6px] border bg-bg-elev p-6 text-center outline-none"
                onClick={(event) => event.stopPropagation()}
                ref={dialogRef}
                style={{ borderColor: revealed ? `${color}66` : 'var(--line)' }}
                tabIndex={-1}
            >
                <div
                    className="mx-auto size-28 overflow-hidden rounded-[4px] border transition-[filter,border-color] duration-500"
                    style={{
                        borderColor: revealed ? `${color}88` : 'var(--line)',
                        // 儀式中は伏せる。結果が出た瞬間に姿が現れる。
                        filter: revealed ? 'none' : 'brightness(0.25) blur(6px)',
                    }}
                >
                    <MonsterVisual
                        assetUrl={assetUrl ?? undefined}
                        className="size-full"
                        formStage={formStage}
                        name={monsterName}
                        sizes="112px"
                    />
                </div>

                <h2
                    className="mt-4 text-[18px] font-semibold tracking-[0.04em]"
                    id="evolution-ritual-title"
                    style={{ color: revealed ? color : 'var(--text-dim)' }}
                >
                    {revealed ? `${monsterName} は ${ROUTE_LABEL[awakeningState]} した` : '儀式の最中…'}
                </h2>

                {/* 結果が出るまで内容を読み上げさせない（途中経過は情報ではない） */}
                <p aria-live="polite" className="mt-2 min-h-[40px] text-[12px] leading-6 text-text-dim">
                    {revealed ? ROUTE_NOTE[awakeningState] : ''}
                </p>

                <button
                    className="mt-3 w-full rounded border border-line-strong px-3 py-1.5 text-[12px] text-text-dim transition-colors hover:text-text"
                    onClick={skipOrClose}
                    type="button"
                >
                    {revealed ? '閉じる' : 'スキップ'}
                </button>
            </div>
        </div>
    );
}
