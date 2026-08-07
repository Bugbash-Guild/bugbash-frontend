'use client';

/**
 * セッション途中に届いた未読報酬の、非モーダルな入口。
 *
 * 未読報酬は 60 秒ポーリング / フォーカス時再検証で開きっぱなしの画面にも
 * 届く（useRewardNotification）。以前はその瞬間に全画面モーダルが作業へ
 * 突然被さっていた（フォーム入力中・召喚の演出中でも）。ここでは事実の
 * 通知だけを画面隅に置き、儀式（モーダル）を開くタイミングは本人に委ねる
 * （UX-BLUEPRINT §4: 2回目以降の着信の非モーダル降格＝割込み事故の防止）。
 *
 * 件数や金額はここでは述べない — モーダル側の合計（PR単位）と数え方が
 * 違って見える二重報告を避ける。押しても何も失われない: 開くだけで、
 * 既読化はモーダル内の CLAIM /「次の一歩」だけが行う。
 */
type Props = {
    onOpen: () => void;
};

export function RewardArrivalChip({ onOpen }: Props) {
    return (
        <button
            aria-label="新しい報酬が届いています。開いて確認する"
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-[6px] border border-accent/40 px-3.5 py-2.5 text-[12px] text-text shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-[filter] hover:brightness-110"
            onClick={onOpen}
            style={{ background: 'var(--bg-elev)' }}
            type="button"
        >
            <span
                aria-hidden
                className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
                style={{ boxShadow: '0 0 6px var(--accent)' }}
            />
            新しい報酬が届いています
            <span className="text-accent">受け取る →</span>
        </button>
    );
}
