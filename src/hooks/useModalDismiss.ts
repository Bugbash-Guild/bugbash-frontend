"use client";

import { useEffect, useRef } from "react";

import { bodyScrollLock } from "@/lib/scrollLock";

/** Tab 循環の対象。tabindex=-1（背景クリック用ボタン等）は除外する。 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type UseModalDismissOptions = {
  /**
   * Esc で呼ばれる。**閉じるだけ**の処理を渡すこと
   * （報酬モーダルのように「閉じる」と「受け取る」が別なら前者）。
   */
  onDismiss: () => void;
  /**
   * false の間は Esc を無視する（送信中など、閉じられては困る瞬間）。
   * フォーカストラップとスクロールロックは開いている限り効かせ続ける。
   * 既定 true。
   */
  dismissible?: boolean;
  /**
   * モーダルが表示されているか。条件描画（`{open && <Modal/>}`）なら
   * 省略でよい。open prop で内部分岐する実装だけ渡す。既定 true。
   */
  open?: boolean;
};

/**
 * モーダル共通の「閉じ方」の土台。
 *
 * これが無かった頃は、モーダル16箇所のうち Esc が効くのは6箇所だけで、
 * Tab は全モーダルで背後のページへ抜け、背後は自由にスクロールできた。
 * 「見えていない場所を操作できてしまう」状態なので、ここに集約する。
 *
 * やること:
 *  - Esc で onDismiss（dismissible=false の間は無視）
 *  - Tab をパネル内で循環（外に出たら先頭/末尾へ引き戻す）
 *  - 開いたら初期フォーカスへ。`[data-autofocus]` があればその要素、
 *    無ければ最初の操作要素。**破壊的な操作（購入・解約・進化）の確認では
 *    キャンセル側に data-autofocus を付けること** — Enter 連打で実行される
 *    事故を防ぐ。
 *  - 閉じたら開く前のフォーカス位置へ戻す（背後の元の場所から続けられる）
 *  - 背後のスクロールを止める（多重表示は参照カウントで安全）
 *
 * @returns パネル要素に付ける ref（オーバーレイではなく中身の箱に付ける）
 */
export function useModalDismiss({
  onDismiss,
  dismissible = true,
  open = true,
}: UseModalDismissOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Esc ハンドラを毎レンダー貼り直さずに最新の値を読むための鏡
  const dismissRef = useRef(onDismiss);
  const dismissibleRef = useRef(dismissible);
  dismissRef.current = onDismiss;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;

    const focusables = (): HTMLElement[] =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );

    // 閉じたときに戻る先。モーダルを開いたボタンへ戻れると、
    // キーボード操作が「元の場所から続き」になる
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const autofocus =
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? null;
    (autofocus ?? focusables()[0])?.focus();

    const releaseScroll = bodyScrollLock.acquire(document.body);

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dismissibleRef.current) dismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inPanel =
        active instanceof HTMLElement && panelRef.current?.contains(active) === true;

      if (event.shiftKey) {
        if (!inPanel || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inPanel || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      releaseScroll();
      // 閉じた先が消えている（DOM から外れた）場合の focus は no-op なので安全
      previouslyFocused?.focus();
    };
  }, [open]);

  return panelRef;
}
