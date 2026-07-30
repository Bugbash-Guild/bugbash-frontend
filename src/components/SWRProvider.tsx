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
        /*
         * 1 画面が 10 本前後のキーを持つため、既定の 5 秒だとタブを往復する
         * たびに再検証がまとめて飛ぶ。人間の「見に戻る」間隔に合わせて
         * 30 秒に広げる。個別に鮮度が要るフックは各自で上書きする。
         */
        focusThrottleInterval: 30_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
