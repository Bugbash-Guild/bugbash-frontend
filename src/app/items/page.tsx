// src/app/items/page.tsx
"use client";

import { useItems } from "@/hooks/useItems";
import { MainWrapper } from "@/components/MainWrapper";

const SLOT_COUNT = 36;

export default function ItemsPage() {
  const { items, loading, error } = useItems();

  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => items[i] ?? null);
  const owned = items.length;

  return (
    <MainWrapper>
      <main className="p-8 w-full">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="text-2xl font-bold">アイテムBOX</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            所持: <span className="tabular-nums">{owned}</span> / {SLOT_COUNT}
          </p>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p className="text-red-500">エラー: {error}</p>}

        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {slots.map((it, idx) =>
              it ? (
                <div
                  key={it.id}
                  title={`${it.name} ×${it.qty}`}
                  className="
                  group relative aspect-square rounded-2xl
                  border border-zinc-200/70 dark:border-zinc-800/70
                  bg-white/80 dark:bg-zinc-900/70 backdrop-blur
                  shadow-sm hover:shadow-md transition
                  flex items-center justify-center
                  overflow-hidden
                "
                >
                  <div className="text-4xl sm:text-5xl select-none z-10">
                    {it.emoji}
                  </div>

                  {/* name */}
                  <div
                    className="
                    absolute bottom-2 left-2 right-2
                    text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-100
                    bg-white/80 dark:bg-zinc-800/70 px-2 py-1 rounded-lg
                    flex items-center justify-between
                  "
                  >
                    <span className="truncate">{it.name}</span>
                    <span
                      className="
                      ml-2 text-[10px] px-1.5 py-0.5 rounded
                      bg-indigo-600 text-white
                    "
                    >
                      ×{it.qty}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  key={`empty-${idx}`}
                  className="
                  aspect-square rounded-2xl
                  border-2 border-dashed border-zinc-300/70 dark:border-zinc-700/70
                  bg-zinc-50/60 dark:bg-zinc-900/40
                "
                />
              ),
            )}
          </div>
        )}
      </main>
    </MainWrapper>
  );
}
