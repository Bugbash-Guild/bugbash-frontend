// src/components/boxes/ItemBoxCard.tsx
"use client";

import Link from "next/link";
import { GiBackpack } from "react-icons/gi";

type Props = { collapsed?: boolean };

export function ItemBoxCard({ collapsed = false }: Props) {
  return (
    <Link
      href="/items"
      className="
    block rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80
    bg-white/85 dark:bg-zinc-800/70 backdrop-blur
    shadow-sm hover:shadow-md
    px-3 py-3
    transform hover:scale-110 transition-transform duration-200
  "
      title="アイテムBOXへ"
    >
      <div className="flex items-center gap-3">
        <div
          className="inline-flex items-center justify-center size-10 rounded-xl
                     bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500
                     text-white shadow"
          aria-hidden
        >
          <GiBackpack className="text-2xl" />
        </div>

        {collapsed ? (
          <span className="text-xs text-zinc-200 select-none">IB</span>
        ) : (
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              アイテムBOX
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              クリックで開く
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
