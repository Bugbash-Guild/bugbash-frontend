"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useDrawer } from "@/components/shell/DrawerContext";
import { SideBarContent } from "@/components/SideBar";
import { useModalDismiss } from "@/hooks/useModalDismiss";

/**
 * <768px 用のナビゲーションドロワー。中身はデスクトップのサイドバーと
 * 同一（navConfig + HERO_STATUS）+ chrome 行の ✕。
 *
 * ✕ / ESC / オーバーレイクリック / ページ遷移で閉じる。開閉 state は
 * DrawerContext（☰ は ConsoleTopbar 左端 or AppShell のフォールバック）。
 *
 * ESC・Tab 循環・初期フォーカス・フォーカス復帰は、ここの自前実装を
 * useModalDismiss に切り出して共有した（元ネタはこの画面）。背後の
 * スクロールロックはフックに寄せたことで新たに付いた分。
 */
export function MobileNavDrawer() {
  const { open, closeDrawer } = useDrawer();
  const pathname = usePathname();

  // ページ遷移で自動クローズ（未オープン時の closeDrawer は no-op）
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // 初期フォーカスは従来どおりパネル内の最初の操作要素（chrome 行の ✕）。
  //
  // フォーカス復帰は DrawerContext（押された ☰ を明示保持）とフック（開いた
  // 瞬間の activeElement）で二重に持つことになるが、実行順は
  // closeDrawer → 再レンダー → フックの cleanup なので、最後に効くのは
  // フック側。キーボードで開いた場合は両者とも同じ ☰ を指すため衝突しない。
  // 責務は「全モーダル共通の作法」であるフック側に寄せる。DrawerContext の
  // triggerRef.focus() は ☰ 2箇所と共有の実装なのでこの変更では触らない
  // （Safari のクリックのみ activeElement が body のままで両者がずれる。
  //   詳細は本 Wave の申し送りを参照）。
  // 復帰先はフックに任せず closeDrawer 側に持たせる（restoreFocus: false）。
  // DrawerContext は「開いた ☰ の要素そのもの」を覚えているのに対し、
  // フックは document.activeElement を見るだけなので、Safari のクリックで
  // 開いた場合（ボタンにフォーカスが当たらない）に body へ戻してしまう。
  const panelRef = useModalDismiss({
    onDismiss: closeDrawer,
    open,
    restoreFocus: false,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* クリックで閉じる背景。Tab 循環からは外す（キーボードには
          見えている出口 ✕ と ESC がある） */}
      <button
        aria-label="ナビゲーションを閉じる"
        className="absolute inset-0 bg-black/60"
        onClick={closeDrawer}
        tabIndex={-1}
        type="button"
      />
      {/* role="dialog" は背景ボタンを含む外枠ではなくパネル側に置く */}
      <div
        aria-label="ナビゲーション"
        aria-modal="true"
        className="absolute inset-y-0 left-0"
        ref={panelRef}
        role="dialog"
      >
        <SideBarContent onNavigate={closeDrawer} onRequestClose={closeDrawer} />
      </div>
    </div>
  );
}
