"use client";

import React from "react";
import { SideBar } from "@/components/SideBar";
import { TabBar } from "@/components/TabBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg min-w-[860px]">
      <TabBar />
      <SideBar />
      <main className="ml-60 mt-9">{children}</main>
    </div>
  );
}
