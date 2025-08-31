// src/components/MonsterBoxCard.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiDragonHead } from "react-icons/gi";

export function MonsterBoxCard() {
  const pathname = usePathname();
  const active = pathname.startsWith("/monsters");

  return (
    <Link
      href="/monsters"
      className={[
        "block rounded-2xl px-3 py-3 backdrop-blur shadow-sm hover:shadow-md transition",
        "text-zinc-900 dark:text-zinc-100",
        "active:bg-zinc-200 dark:active:bg-zinc-700", // クリックフィードバック
        active
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "bg-white/85 dark:bg-zinc-800/70",
      ].join(" ")}
      title="モンスターボックスへ"
    >
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-500 text-white shadow">
          <GiDragonHead className="text-2xl" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">モンスターボックス</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            クリックで開く
          </p>
        </div>
      </div>
    </Link>
  );
}
