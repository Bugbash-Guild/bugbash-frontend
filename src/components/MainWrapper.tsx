"use client";

import React from "react";
import { SideBar } from "@/components/SideBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex p-6" style={{ background: "#04070a" }}>
      <div
        className="flex flex-1 rounded-[10px] overflow-hidden min-w-0"
        style={{
          border: "1px solid #1f3028",
          boxShadow: "0 0 0 1px #0d1a14, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(126,231,135,0.04)",
        }}
      >
        <SideBar />
        <main className="flex-1 bg-bg overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>{children}</main>
      </div>
    </div>
  );
}
