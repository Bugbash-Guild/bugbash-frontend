"use client";

import type { ReactNode } from "react";

import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { PendingGrantBanner } from "@/components/billing/PendingGrantBanner";
import { DrawerProvider, useDrawer } from "@/components/shell/DrawerContext";
import { SideBar } from "@/components/SideBar";
import { TrackingStatusBanner } from "@/components/TrackingStatusBanner";

/**
 * ConsoleTopbar を持たないページ（/legal/*・/admin/* — 独自ヘッダのみ）用の
 * ☰ フォールバック。topbar 掲載ページでは ☰ は topbar 左端にあり一段
 * （54px）で足りるため、フレーム内に `data-console-topbar` が居る間は
 * CSS の :has で消す。
 *
 * パスのリスト管理にしない理由: topbar を置かない新ページが増えても、
 * モバイルでドロワーへの到達手段が黙って失われない（DOM の事実で自動判定）。
 * :has 未対応の古いブラウザでは旧来の二段表示に戻るだけで、操作は失われない。
 */
function FallbackNavStrip() {
  const { openDrawer } = useDrawer();
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line bg-bg-elev px-3 py-2 md:hidden group-has-[[data-console-topbar]]/shell:hidden">
      <button
        aria-label="ナビゲーションを開く"
        className="flex size-9 items-center justify-center rounded border border-line text-[16px] text-text-dim hover:text-text"
        onClick={(event) => openDrawer(event.currentTarget)}
        type="button"
      >
        ☰
      </button>
      <span className="text-[11px] text-text-faint">bugbash · v0.1.0</span>
    </div>
  );
}

/**
 * アプリ共通のウィンドウフレーム + サイドバー + スクロール領域。
 * `(shell)` レイアウトから 1 度だけマウントされ、ページ遷移をまたいで生存する。
 *
 * <768px: サイドバーの代わりに MobileNavDrawer。開閉は DrawerContext で共有し、
 * ☰ は各ページの ConsoleTopbar 左端（topbar が無いページのみ FallbackNavStrip）。
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DrawerProvider>
      <div className="flex h-screen bg-bg-outer p-0 sm:p-4 lg:p-6">
        <div
          className="group/shell flex min-w-0 flex-1 flex-col overflow-hidden rounded-none sm:rounded-[10px]"
          style={{
            border: "1px solid #1f3028",
            boxShadow:
              "0 0 0 1px #0d1a14, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(126,231,135,0.04)",
          }}
        >
          <FallbackNavStrip />

          <div className="flex min-h-0 min-w-0 flex-1">
            <div className="hidden md:flex">
              <SideBar />
            </div>
            <main
              className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-bg [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              <PendingGrantBanner />
              <TrackingStatusBanner />
              {children}
            </main>
          </div>
        </div>

        <MobileNavDrawer />
      </div>
    </DrawerProvider>
  );
}
