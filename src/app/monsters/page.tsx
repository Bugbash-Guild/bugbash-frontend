// src/app/monsters/page.tsx
"use client";

import { useMonsters } from "@/hooks/useMonsters";
import { MainWrapper } from "@/components/MainWrapper";

const SLOT_COUNT = 36;

function rarityClass(rarity: "N" | "R" | "SR" | "SSR") {
  switch (rarity) {
    case "SSR":
      return "from-amber-400 via-fuchsia-500 to-indigo-600";
    case "SR":
      return "from-violet-500 to-indigo-500";
    case "R":
      return "from-sky-500 to-cyan-500";
    default:
      return "from-zinc-300 to-zinc-400";
  }
}

export default function MonstersPage() {
  const { monsters, loading, error } = useMonsters();

  const slots = Array.from(
    { length: SLOT_COUNT },
    (_, i) => monsters[i] ?? null,
  );
  const owned = monsters.length;

  return (
    <MainWrapper>
      <main className="p-8 w-[100%]">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="text-2xl font-bold">モンスターボックス</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            所持: <span className="tabular-nums">{owned}</span> / {SLOT_COUNT}
          </p>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p className="text-red-500">エラー: {error}</p>}

        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {slots.map((m, idx) =>
              m ? (
                <div
                  key={m.id}
                  title={`${m.name} [${m.rarity}]`}
                  className="
                  group relative aspect-square rounded-2xl
                  border border-zinc-200/70 dark:border-zinc-800/70
                  bg-white/80 dark:bg-zinc-900/70 backdrop-blur
                  shadow-sm hover:shadow-md transition
                  flex items-center justify-center
                  overflow-hidden
                "
                >
                  <div
                    className={`
                    absolute inset-0 opacity-20 group-hover:opacity-30 transition
                    bg-gradient-to-br ${rarityClass(m.rarity)}
                  `}
                  />
                  <div className="text-4xl sm:text-5xl select-none z-10">
                    {m.emoji}
                  </div>
                  <div
                    className="
                    absolute bottom-2 left-2 right-2
                    text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-100
                    bg-white/80 dark:bg-zinc-800/70 px-2 py-1 rounded-lg
                    flex items-center justify-between
                  "
                  >
                    <span className="truncate">{m.name}</span>
                    <span
                      className="
                      ml-2 text-[10px] px-1.5 py-0.5 rounded
                      bg-zinc-900 text-white dark:bg-white dark:text-zinc-900
                    "
                    >
                      {m.rarity}
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
