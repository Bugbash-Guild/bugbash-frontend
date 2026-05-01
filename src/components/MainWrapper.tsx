"use client";

import React from "react";
import { SideBar } from "@/components/SideBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-bg flex p-3">
      <div
        className="flex flex-1 rounded-[10px] overflow-hidden min-w-0"
        style={{
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <SideBar />
        <main className="flex-1 bg-bg overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>{children}</main>
      </div>
    </div>
  );
}
