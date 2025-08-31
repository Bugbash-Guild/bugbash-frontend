// src/components/ItemBoxCard.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiBackpack } from "react-icons/gi";

export function ItemBoxCard() {
  const pathname = usePathname();
  const active = pathname.startsWith("/items");

  return (
    <Link
      href="/items"
      className={[
        "block rounded-2xl px-3 py-3 backdrop-blur shadow-sm hover:shadow-md transition",
        "text-zinc-900 dark:text-zinc-100",
        "active:bg-zinc-200 dark:active:bg-zinc-700",
        active
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "bg-white/85 dark:bg-zinc-800/70",
      ].join(" ")}
      title="アイテムBOXへ"
    >
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow">
          <GiBackpack className="text-2xl" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">アイテムBOX</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            クリックで開く
          </p>
        </div>
      </div>
    </Link>
  );
}
