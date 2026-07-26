"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * アプリ全体の SWR 既定値。
 * keepPreviousData: タブ/フィルタ切替やキー変更時に前データを保持し、
 * 「一瞬空になる」点滅を防ぐ（UX-IMPROVEMENT-PLAN Wave 1 #2）。
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        dedupingInterval: 2_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
