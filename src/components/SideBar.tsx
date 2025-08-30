// src/components/SideBar.tsx
"use client";

import { useState } from "react";
import { MonsterBoxCard } from "@/components/MonsterBoxCard";
import { ItemBoxCard } from "@/components/ItemBoxCard";

export function SideBar() {
  const [collapsed] = useState(false);

  return (
    <aside
      className={[
        "min-h-screen border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900",
        "flex flex-col justify-between",
        "flex",
        "flex-col",
        "justify-end",
        "transition-[width] duration-300",
        collapsed ? "w-[68px]" : "w-72",
        "px-3 py-4",
      ].join(" ")}
    >
      {/* 下部: 縦にモンスターBOX & アイテムBOX（丸みのあるカード） */}
      <div className="space-y-3 pb-2">
        <MonsterBoxCard collapsed={collapsed} />
        <ItemBoxCard collapsed={collapsed} />
      </div>
    </aside>
  );
}
