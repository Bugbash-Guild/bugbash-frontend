"use client";

import { useEffect, useRef } from "react";

import { bodyScrollLock } from "@/lib/scrollLock";

/** Tab 循環の対象。tabindex=-1（背景クリック用ボタン等）は除外する。 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 開いているモーダルの重なり順。後ろほど手前（＝最前面）。
 *
 * モーダルは個別に document へ keydown を張るので、重なると Esc 一回で
 * 全部閉じ、Tab のトラップも互いに取り合う。実際に /summon（確認→結果）や
 * /pass（年齢確認→加入確認）で重なる瞬間があるため、
 * 「キー操作に応じてよいのは最前面の1枚だけ」をここで決める。
 */
const modalStack: symbol[] = [];

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
  /**
   * 閉じたときに、開く前のフォーカス位置へ戻すか。既定 true。
   *
   * false にするのは、呼び出し側が**より正確な復帰先**を自分で持っている
   * ときだけ（例: MobileNavDrawer は開いた ☰ の要素そのものを覚えている。
   * Safari はクリックでボタンにフォーカスを当てないので、
   * document.activeElement を見るこのフックより呼び出し側の方が正しい）。
   */
  restoreFocus?: boolean;
};

/**
 * モーダル共通の「閉じ方」の土台。
 *
 * これが無かった頃は、モーダル16箇所のうち Esc が効くのは6箇所だけで、
 * Tab は全モーダルで背後のページへ抜け、背後は自由にスクロールできた。
 * 「見えていない場所を操作できてしまう」状態なので、ここに集約する。
 *
 * やること:
 *  - Esc で onDismiss（dismissible=false の間は無視。最前面の1枚だけが応じる）
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
  restoreFocus = true,
}: UseModalDismissOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Esc ハンドラを毎レンダー貼り直さずに最新の値を読むための鏡
  const dismissRef = useRef(onDismiss);
  const dismissibleRef = useRef(dismissible);
  const restoreFocusRef = useRef(restoreFocus);
  dismissRef.current = onDismiss;
  dismissibleRef.current = dismissible;
  restoreFocusRef.current = restoreFocus;

  useEffect(() => {
    if (!open) return;

    // パネル要素は開いている間 identity が変わらないので、ここで捕まえておく
    // （cleanup 時点では ref が既に null に戻りうるため、ref を直接見ない）
    const panel = panelRef.current;

    const focusables = (): HTMLElement[] =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

    // 閉じたときに戻る先。モーダルを開いたボタンへ戻れると、
    // キーボード操作が「元の場所から続き」になる
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const autofocus = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? null;
    (autofocus ?? focusables()[0])?.focus();

    const releaseScroll = bodyScrollLock.acquire(document.body);

    // 自分を最前面として積む。重なっている間、キー操作に応じるのは末尾だけ。
    const token = Symbol("modal");
    modalStack.push(token);
    const isTopmost = () => modalStack[modalStack.length - 1] === token;

    const handler = (event: KeyboardEvent) => {
      // 後から開いたモーダルが手前にある間は黙る（Esc 一回で背後まで
      // 巻き添えで閉じたり、Tab のトラップが互いを引っ張り合うのを防ぐ）
      if (!isTopmost()) return;

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
        active instanceof HTMLElement && panel?.contains(active) === true;

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
      const index = modalStack.lastIndexOf(token);
      if (index !== -1) modalStack.splice(index, 1);
      releaseScroll();

      /*
        復帰は「フォーカスがまだ自分の中（または行き場を失って body）にある」
        ときだけ。閉じる前に別のモーダルへフォーカスが移っていたら手を出さない。

        これが無いと、確認モーダル → 結果モーダルのように**先に次が開いてから
        前が閉じる**画面（/summon の10連）で、閉じる側の復帰が後から走って
        開いたばかりのモーダルからフォーカスを引き剥がす。
        閉じた先が DOM から消えている場合の focus は no-op なので安全。
      */
      if (!restoreFocusRef.current) return;
      const active = document.activeElement;
      const focusMovedElsewhere =
        active instanceof HTMLElement &&
        active !== document.body &&
        panel?.contains(active) !== true;
      if (!focusMovedElsewhere) previouslyFocused?.focus();
    };
  }, [open]);

  return panelRef;
}
