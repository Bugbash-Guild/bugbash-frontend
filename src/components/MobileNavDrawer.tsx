"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useDrawer } from "@/components/shell/DrawerContext";
import { SideBarContent } from "@/components/SideBar";

/** パネル内で Tab 循環の対象にする要素。tabindex=-1（背景ボタン等）は除外。 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * <768px 用のナビゲーションドロワー。中身はデスクトップのサイドバーと
 * 同一（navConfig + HERO_STATUS）+ chrome 行の ✕。
 *
 * ✕ / ESC / オーバーレイクリック / ページ遷移で閉じる。開閉 state は
 * DrawerContext（☰ は ConsoleTopbar 左端 or AppShell のフォールバック）。
 * 閉じたとき開いた ☰ へフォーカスが返るのは closeDrawer 側の責務。
 */
export function MobileNavDrawer() {
  const { open, closeDrawer } = useDrawer();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // ページ遷移で自動クローズ（未オープン時の closeDrawer は no-op）
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // フォーカストラップ: 開いたら最初の操作要素（chrome 行の ✕）へ、
  // Tab はパネル内で循環。背後のページへ Tab が抜けると「見えない場所を
  // 操作するモーダル」になるため、外に居たら先頭/末尾へ引き戻す。
  useEffect(() => {
    if (!open) return;
    const focusables = (): HTMLElement[] =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      );
    focusables()[0]?.focus();

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inPanel =
        active instanceof HTMLElement &&
        panelRef.current?.contains(active) === true;
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
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeDrawer]);

  if (!open) return null;

  return (
    <div
      aria-label="ナビゲーション"
      aria-modal="true"
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
    >
      {/* クリックで閉じる背景。Tab 循環からは外す（キーボードには
          見えている出口 ✕ と ESC がある） */}
      <button
        aria-label="ナビゲーションを閉じる"
        className="absolute inset-0 bg-black/60"
        onClick={closeDrawer}
        tabIndex={-1}
        type="button"
      />
      <div className="absolute inset-y-0 left-0" ref={panelRef}>
        <SideBarContent onNavigate={closeDrawer} onRequestClose={closeDrawer} />
      </div>
    </div>
  );
}
