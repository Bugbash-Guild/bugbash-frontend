import Link from "next/link";
import { FiTool, FiX } from "react-icons/fi";

import { COSMETIC_ONLY_COPY } from "@/lib/badges";
import type { BadgeProgress, ForgeLevelDef } from "@/types/badge";

type BadgeCosmeticConfirmModalProps = {
  badge: BadgeProgress;
  error: string | null;
  inFlight: boolean;
  level: ForgeLevelDef;
  onClose: () => void;
  onConfirm: () => void;
  runeBalance: number;
  showRetry: boolean;
  showTopUp: boolean;
};

export function BadgeCosmeticConfirmModal({
  badge,
  error,
  inFlight,
  level,
  onClose,
  onConfirm,
  runeBalance,
  showRetry,
  showTopUp,
}: BadgeCosmeticConfirmModalProps) {
  return (
    <div
      aria-labelledby="badge-cosmetic-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md border border-purple/50 bg-bg-elev shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-purple">
              COSMETIC WORKSHOP
            </div>
            <h2
              id="badge-cosmetic-confirm-title"
              className="mt-1 text-[15px] font-semibold text-text"
            >
              見た目の強化を確認
            </h2>
          </div>
          <button
            aria-label="確認画面を閉じる"
            className="flex size-9 items-center justify-center text-text-dim hover:text-text disabled:opacity-50"
            disabled={inFlight}
            onClick={onClose}
            type="button"
          >
            <FiX aria-hidden size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="border border-line bg-bg p-3">
            <div className="text-[12px] font-semibold text-text">
              {badge.displayName}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-text-dim">
                コスメLv.{badge.forgeRank} → Lv.{level.level}
              </span>
              <span className="text-purple">
                {level.runeCost.toLocaleString("ja-JP")}ルーン
              </span>
            </div>
            <div className="mt-2 text-[11px] text-text-faint">
              {level.diffNote}
            </div>
          </div>

          <dl className="space-y-2 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-text-faint">現在の残高</dt>
              <dd className="text-text">
                {runeBalance.toLocaleString("ja-JP")}ルーン
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-faint">強化後の見込み</dt>
              <dd className="text-text">
                {Math.max(0, runeBalance - level.runeCost).toLocaleString(
                  "ja-JP",
                )}
                ルーン
              </dd>
            </div>
          </dl>

          <p className="border border-purple/30 bg-purple/10 px-3 py-3 text-[11px] leading-5 text-purple">
            {COSMETIC_ONLY_COPY}
          </p>

          {error && (
            <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] leading-5 text-pink">
              <p>{error}</p>
              {showTopUp && (
                <Link
                  className="mt-2 inline-block text-text underline underline-offset-4"
                  href="/shop/runes"
                >
                  ルーンを購入する
                </Link>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="border border-line px-3 py-2 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:opacity-50"
              disabled={inFlight}
              onClick={onClose}
              type="button"
            >
              キャンセル
            </button>
            <button
              className="flex min-w-32 items-center justify-center gap-2 bg-purple px-3 py-2 text-[12px] font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={inFlight}
              onClick={onConfirm}
              type="button"
            >
              {inFlight ? (
                <span className="size-3.5 animate-spin rounded-full border border-bg border-t-transparent" />
              ) : (
                <FiTool aria-hidden size={15} />
              )}
              {showRetry ? "同じ内容で再試行" : "強化する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
