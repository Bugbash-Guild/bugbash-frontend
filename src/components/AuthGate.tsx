"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

/** open-redirect を防ぐ returnTo 検証。相対パス（先頭 "/"、"//" 以外）のみ許可。 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * 認証ゲート。`(shell)/(authed)` レイアウトに 1 箇所だけ置き、
 * 14 ページに複製されていたガードを置き換える。
 *
 * - 判定中: シェル（サイドバー等）は親レイアウトが描画済みなので、
 *   コンテンツ領域にターミナル風のブート行だけを出す（全画面ブランクにしない）
 * - 未認証: 現在地を returnTo に載せて /login へ
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated) return;
    const query = searchParams.toString();
    const here = query ? `${pathname}?${query}` : pathname;
    const target = safeReturnTo(here) ?? "/";
    router.replace(`/login?returnTo=${encodeURIComponent(target)}`);
  }, [loading, isAuthenticated, pathname, searchParams, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="px-4 py-5 md:px-9 md:py-6 text-[13px] leading-7 text-text-faint">
        <p>
          <span className="text-text-dim">$</span> auth --verify-session
        </p>
        <p>
          {"> "}authenticating…
          <span className="ml-0.5 inline-block h-[13px] w-2 animate-pulse bg-accent align-middle" />
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
