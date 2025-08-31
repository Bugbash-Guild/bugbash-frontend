"use client";

import React from "react";
import { SideBar } from "@/components/SideBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <SideBar />
      <main className="flex-1 pt-14 md:pt-0 md:ml-72">{children}</main>
    </div>
  );
}
