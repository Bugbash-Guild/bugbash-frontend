// src/components/SideBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FiHome, FiMenu, FiX } from "react-icons/fi";
import { MonsterBoxCard } from "@/components/MonsterBoxCard";
import { ItemBoxCard } from "@/components/ItemBoxCard";

export function SideBar() {
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* 上部：ミニマルなHomeボタン（アイコンのみ） */}
      <div className="p-4">
        <Link
          href="/"
          aria-label="Home"
          className="
            inline-flex items-center justify-center
            h-12 w-23 gap-1 rounded-xl
            border border-zinc-200/70 dark:border-zinc-800/70
            bg-white/90 dark:bg-zinc-800/80 backdrop-blur
            shadow-sm hover:shadow-md
            transition-transform duration-200 hover:scale-110
            text-zinc-900 dark:text-zinc-100
          "
        >
          <FiHome className="text-2xl" />
          <div className="font-bold">Home</div>
        </Link>
      </div>

      {/* 中央：スクロール可能領域（必要ならメニュー追加） */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2" />
      </nav>

      {/* 下部：カードは常に下に固定 */}
      <div className="mt-auto space-y-3 p-4 pt-0">
        <MonsterBoxCard />
        <ItemBoxCard />
      </div>
    </div>
  );

  return (
    <>
      {/* モバイル：トップバー（ハンバーガー） */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur px-4 shadow-sm md:hidden">
        <button
          aria-label="open sidebar menu"
          aria-controls="mobile-sidebar"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/70 dark:border-zinc-700/70"
        >
          <FiMenu className="text-xl text-zinc-700 dark:text-zinc-200" />
        </button>
        <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Home
        </span>
        <span className="w-10" />
      </div>

      {/* モバイル：ドロワー */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            aria-label="close overlay"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-sidebar"
            className="
              absolute left-0 top-0 h-screen w-72
              bg-zinc-50 dark:bg-zinc-900
              border-r border-zinc-200 dark:border-zinc-800
              shadow-xl
              animate-in slide-in-from-left duration-200
            "
          >
            <div className="flex h-14 items-center justify-end px-3">
              <button
                aria-label="close sidebar"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/70 dark:border-zinc-700/70"
              >
                <FiX className="text-xl text-zinc-700 dark:text-zinc-200" />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* デスクトップ：固定サイドバー */}
      <aside
        className="
          fixed left-0 top-0 hidden h-screen w-72
          md:block
          border-r border-zinc-200 dark:border-zinc-800
          bg-zinc-50 dark:bg-zinc-900
        "
      >
        {SidebarContent}
      </aside>
    </>
  );
}
