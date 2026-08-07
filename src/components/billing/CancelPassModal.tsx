"use client";

import { FiX } from "react-icons/fi";

import { useModalDismiss } from "@/hooks/useModalDismiss";

/**
 * 期間末の短い日付表示（YYYY/MM/DD）。値は GET /api/billing/subscription の
 * currentPeriodEnd のみ。届いていない・解釈できないときは null を返し、
 * 呼び出し側は日付なしの文言に落とす（日付を推測して埋めない）。
 * 長い形式（2026年8月9日）は toPassStatusPresentation 側にある。
 */
export function formatPeriodEndDate(currentPeriodEnd: string | null): string | null {
  if (!currentPeriodEnd) return null;

  const date = new Date(currentPeriodEnd);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("ja-JP", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type CancelPassModalProps = {
  /** GET /api/billing/subscription の currentPeriodEnd をそのまま渡す */
  currentPeriodEnd: string | null;
  error: string | null;
  inFlight: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

/**
 * 冒険者パスの解約確認。/pass と /mypage/billing の2画面で使う共通モーダル。
 *
 * DELETE /api/billing/subscription は即時解約ではなく期間末解約の予約なので、
 * 確定ボタンは「解約予定にする」（「解約を確定」は即時解約に読めるため使わない）。
 * 本文は事実のみ: いつまで特典が有効か（日付はAPIの値のみ）・期間末以降は
 * 更新されないこと・日割返金がないこと・期間終了後に再加入できること。
 * 引き止めや喪失を煽るコピーは置かない。
 */
export function CancelPassModal({
  currentPeriodEnd,
  error,
  inFlight,
  onClose,
  onConfirm,
  open,
}: CancelPassModalProps) {
  // open prop で内部分岐するため、早期 return より前でフックに open を渡す。
  // 保存中（inFlight）は Esc も背景クリックも効かせない（既存の背景クリック
  // ガードと揃える）。
  const panelRef = useModalDismiss({
    onDismiss: onClose,
    dismissible: !inFlight,
    open,
  });

  if (!open) return null;

  const periodEndDate = formatPeriodEndDate(currentPeriodEnd);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={() => {
        if (!inFlight) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="cancel-pass-title"
        aria-modal="true"
        className="w-full max-w-md border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
      >
        <div className="mb-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
            CANCEL PASS
          </div>
          <div className="flex items-start justify-between gap-3">
            <h2 id="cancel-pass-title" className="text-[17px] font-semibold text-text">
              冒険者パスを解約しますか?
            </h2>
            <button
              aria-label="閉じる"
              className="p-1 text-text-dim hover:text-text disabled:opacity-40"
              disabled={inFlight}
              onClick={onClose}
              type="button"
            >
              <FiX />
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-6 text-text-dim">
            {periodEndDate
              ? `解約予定にすると、現在の期間末（${periodEndDate}）までは特典を利用できます。`
              : "解約予定にすると、現在の期間末までは特典を利用できます。"}
            期間末以降は更新されません。日割返金はありません。期間終了後に再加入できます。
          </p>
        </div>

        {error && (
          <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {/* 初期フォーカスは「戻る」側。開いた直後の Enter 連打で
              解約予定が入らないようにする */}
          <button
            className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:cursor-not-allowed disabled:opacity-50"
            data-autofocus
            disabled={inFlight}
            onClick={onClose}
            type="button"
          >
            戻る
          </button>
          <button
            className="border border-pink/50 px-3 py-1.5 text-[12px] font-semibold text-pink hover:bg-pink hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
            disabled={inFlight}
            onClick={onConfirm}
            type="button"
          >
            {inFlight ? "保存中…" : "解約予定にする"}
          </button>
        </div>
      </section>
    </div>
  );
}
