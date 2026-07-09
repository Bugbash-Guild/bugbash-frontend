"use client";

import React from "react";
import { PendingGrantBanner } from "@/components/billing/PendingGrantBanner";
import { SideBar } from "@/components/SideBar";

type MainWrapperProps = {
  children: React.ReactNode;
  mobileFullWidth?: boolean;
};

export function MainWrapper({ children, mobileFullWidth = false }: MainWrapperProps) {
  return (
    <div
      className={[
        "flex h-screen bg-bg-outer",
        mobileFullWidth ? "p-0 sm:p-4 lg:p-6" : "p-6",
      ].join(" ")}
    >
      <div
        className={[
          "flex min-w-0 flex-1 overflow-hidden",
          mobileFullWidth ? "rounded-none sm:rounded-[10px]" : "rounded-[10px]",
        ].join(" ")}
        style={{
          border: "1px solid #1f3028",
          boxShadow: "0 0 0 1px #0d1a14, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(126,231,135,0.04)",
        }}
      >
        {mobileFullWidth ? (
          <div className="hidden md:flex">
            <SideBar />
          </div>
        ) : (
          <SideBar />
        )}
        <main className="flex-1 bg-bg overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <PendingGrantBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
