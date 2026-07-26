"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { SideBarContent } from "@/components/SideBar";

/**
 * <768px 用のナビゲーションドロワー。中身はデスクトップのサイドバーと
 * 同一（navConfig + HERO_STATUS）。ESC / オーバーレイクリック / 遷移で閉じる。
 */
export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // ページ遷移で自動クローズ
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-label="ナビゲーション"
      aria-modal="true"
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
    >
      <button
        aria-label="ナビゲーションを閉じる"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        type="button"
      />
      <div
        className="absolute inset-y-0 left-0 outline-none"
        ref={panelRef}
        tabIndex={-1}
      >
        <SideBarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
