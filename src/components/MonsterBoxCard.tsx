// src/components/boxes/MonsterBoxCard.tsx
"use client";

import Link from "next/link";
import { GiDragonHead } from "react-icons/gi";

type Props = { collapsed?: boolean };

export function MonsterBoxCard() {
  return (
    <Link
      href="/monsters"
      className="
    block rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80
    bg-white/85 dark:bg-zinc-800/70 backdrop-blur
    shadow-sm hover:shadow-md
    px-3 py-3
    transform hover:scale-110 transition-transform duration-200
  "
      title="モンスターボックスへ"
    >
      <div className="flex items-center gap-3">
        <div
          className="inline-flex items-center justify-center size-10 rounded-xl
                     bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-500
                     text-white shadow"
          aria-hidden
        >
          <GiDragonHead className="text-2xl" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            モンスターボックス
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            クリックで開く
          </p>
        </div>
      </div>
    </Link>
  );
}
