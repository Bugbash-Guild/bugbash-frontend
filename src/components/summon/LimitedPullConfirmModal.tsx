"use client";

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
  return (
    <div
      aria-labelledby="limited-pull-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onCancel}
      role="dialog"
    >
      <div
        className="w-full max-w-md border border-line bg-bg-elev p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-text-faint">
          CONFIRM 10-PULL
        </div>
        <h2
          className="text-[16px] font-semibold text-text"
          id="limited-pull-confirm-title"
        >
          10連召喚を実行しますか？
        </h2>
        <p className="mt-3 text-[13px] leading-6 text-text-dim">
          {confirmation.costLabel}を消費します（残高 {confirmation.balanceLabel}
          ）。
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-line px-3 py-2 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:opacity-40"
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
            {loading ? "召喚中…" : "10連召喚する"}
          </button>
        </div>
      </div>
    </div>
  );
}
