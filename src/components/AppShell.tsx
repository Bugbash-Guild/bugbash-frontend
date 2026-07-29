"use client";

import React, { useState } from "react";

import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { PendingGrantBanner } from "@/components/billing/PendingGrantBanner";
import { SideBar } from "@/components/SideBar";
import { TrackingStatusBanner } from "@/components/TrackingStatusBanner";

/**
 * アプリ共通のウィンドウフレーム + サイドバー + スクロール領域。
 * `(shell)` レイアウトから 1 度だけマウントされ、ページ遷移をまたいで生存する。
 *
 * <768px: サイドバーの代わりに ☰ ストリップ + MobileNavDrawer。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-outer p-0 sm:p-4 lg:p-6">
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-none sm:rounded-[10px]"
        style={{
          border: "1px solid #1f3028",
          boxShadow:
            "0 0 0 1px #0d1a14, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(126,231,135,0.04)",
        }}
      >
        {/* モバイル用ナビストリップ（全ページ共通・シェルに常駐） */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-bg-elev px-3 py-2 md:hidden">
          <button
            aria-label="ナビゲーションを開く"
            className="flex size-9 items-center justify-center rounded border border-line text-[16px] text-text-dim hover:text-text"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            ☰
          </button>
          <span className="text-[11px] text-text-faint">bugbash · v0.1.0</span>
        </div>

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

      <MobileNavDrawer onClose={() => setDrawerOpen(false)} open={drawerOpen} />
    </div>
  );
}
