"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";

const DISMISS_KEY = "bb.trackingBannerDismissed";

/**
 * GitHub App 未導入＝「活動の追跡が止まっている（ゲームの電源が入っていない）」
 * 状態を全ページで可視化するバナー。従来は home でしか分からなかった。
 *
 * 色はシステム情報の blue（琥珀=課金専用・gold=SSR専用のため使用しない）。
 * セッション内で dismiss 可能。home はページ内に大きな導入バナーを持つため除外。
 */
export function TrackingStatusBanner() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { hero, loading } = useHero(isAuthenticated);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (pathname === "/") return null;
  if (!isAuthenticated || loading || !hero || hero.hasGithubAppInstalled) return null;
  if (dismissed) return null;

  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : null;

  return (
    <div className="flex items-center gap-3 border-b border-blue/40 bg-blue/10 px-4 py-2 text-[12px] text-blue">
      <span aria-hidden>ℹ</span>
      <span className="min-w-0 flex-1">
        活動の追跡が停止しています — GitHub App が未導入のため、PR をマージしても XP が入りません。
        {installUrl && (
          <a
            className="ml-2 text-text underline underline-offset-4 hover:text-blue"
            href={installUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            インストールする →
          </a>
        )}
      </span>
      <button
        aria-label="このお知らせを閉じる"
        className="shrink-0 text-text-dim hover:text-text"
        onClick={() => {
          window.sessionStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
