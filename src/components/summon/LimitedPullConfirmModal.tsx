"use client";

import { useModalDismiss } from "@/hooks/useModalDismiss";
import type { LimitedPullConfirmation } from "@/lib/limitedSummon";

type LimitedPullConfirmModalProps = {
  confirmation: LimitedPullConfirmation;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LimitedPullConfirmModal({
  confirmation,
  loading,
  onCancel,
  onConfirm,
}: LimitedPullConfirmModalProps) {
  // 召喚中（loading）は Esc で閉じない ＝ キャンセルボタンの disabled と同じ扱い。
  // /summon では結果表示中も loading のままなので、その間 Esc はこの1枚には
  // 効かず、上に出ている結果モーダル側だけが応じる。
  const panelRef = useModalDismiss({
    onDismiss: onCancel,
    dismissible: !loading,
  });

  // 単発（pullCount: 1）も同じモーダルを通す。文言は回数から導出する
  const isTen = confirmation.pullCount === 10;
  const actionLabel = isTen ? "10連召喚" : "召喚 × 1";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onCancel}
      role="presentation"
    >
      {/* role="dialog" はオーバーレイではなくパネル（中身の箱）側に置く */}
      <div
        aria-labelledby="limited-pull-confirm-title"
        aria-modal="true"
        className="w-full max-w-md border border-line bg-bg-elev p-5"
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
      >
        <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-text-faint">
          CONFIRM {confirmation.pullCount}-PULL
        </div>
        <h2
          className="text-[16px] font-semibold text-text"
          id="limited-pull-confirm-title"
        >
          {actionLabel}を実行しますか？
        </h2>
        <p className="mt-3 text-[13px] leading-6 text-text-dim">
          {confirmation.costLabel}を消費します（残高 {confirmation.balanceLabel}
          ）。
        </p>

        <div className="mt-5 flex justify-end gap-2">
          {/* 初期フォーカスはキャンセル側。開いた直後の Enter 連打で
              ルーンを消費する召喚が走らないようにする */}
          <button
            className="border border-line px-3 py-2 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:opacity-40"
            data-autofocus
            disabled={loading}
            onClick={onCancel}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="border border-gold bg-gold px-3 py-2 text-[12px] font-semibold text-bg hover:bg-gold/90 disabled:opacity-40"
            disabled={loading || !confirmation.canAfford}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "召喚中…" : isTen ? "10連召喚する" : "召喚する"}
          </button>
        </div>
      </div>
    </div>
  );
}
