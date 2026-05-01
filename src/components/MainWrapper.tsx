"use client";

import React from "react";
import { SideBar } from "@/components/SideBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg min-w-[860px]">
      <SideBar />
      <main className="ml-60">{children}</main>
    </div>
  );
}
