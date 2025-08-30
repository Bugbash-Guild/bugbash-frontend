'use client';

import React from "react";
import {SideBar} from "@/components/SideBar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            <SideBar />
            {children}
        </div>
    );
}