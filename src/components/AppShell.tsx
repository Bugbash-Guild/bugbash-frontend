"use client";

import React from "react";

import { PendingGrantBanner } from "@/components/billing/PendingGrantBanner";
import { SideBar } from "@/components/SideBar";

/**
 * アプリ共通のウィンドウフレーム + サイドバー + スクロール領域。
 * `(shell)` レイアウトから 1 度だけマウントされ、ページ遷移をまたいで生存する
 * （旧 MainWrapper はページごとに再マウントされていた）。
 *
 * <768px ではサイドバーを隠し全幅表示にする（全ページ統一。
 * 旧 mobileFullWidth の個別指定は廃止）。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-outer p-0 sm:p-4 lg:p-6">
      <div
        className="flex min-w-0 flex-1 overflow-hidden rounded-none sm:rounded-[10px]"
        style={{
          border: "1px solid #1f3028",
          boxShadow:
            "0 0 0 1px #0d1a14, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(126,231,135,0.04)",
        }}
      >
        <div className="hidden md:flex">
          <SideBar />
        </div>
        <main
          className="flex-1 overflow-y-auto bg-bg [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <PendingGrantBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
