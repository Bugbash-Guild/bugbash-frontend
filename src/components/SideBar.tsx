// src/components/SideBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import {
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_PATHS,
  isNavActive,
  NAV_SECTIONS,
  PROFILE_ADJACENT_PATHS,
  type NavItem,
} from "@/lib/navConfig";
import { legalFooterLinks } from "@/lib/legalPages";

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={[
        "flex items-center rounded px-[10px] py-2 text-[13px] transition-colors",
        isActive
          ? "border-l-2 border-accent bg-accent/[0.08] text-accent"
          : "border-l-2 border-transparent text-text hover:bg-bg-elev-2",
      ].join(" ")}
    >
      <span
        className={[
          "mr-2 inline-block w-[16px] shrink-0 text-center",
          isActive ? "text-accent" : item.paid ? "text-rune" : "text-text-dim",
        ].join(" ")}
      >
        {item.glyph}
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.jaLabel != null && (
        // 英語コマンドの横に日本語を faint で併記。コマンド表記は美学として
        // 維持し、初見の解読コストだけを消す（置き換えはしない — §2）
        <span className="ml-2 shrink-0 text-[10px] text-text-faint">
          {item.jaLabel}
        </span>
      )}
    </Link>
  );
}

/**
 * サイドバーの中身。デスクトップの常設 aside と、モバイルの
 * MobileNavDrawer の両方から使う（onNavigate はドロワーを閉じる用）。
 */
export function SideBarContent({
  onNavigate,
  onRequestClose,
}: {
  onNavigate?: () => void;
  /** ドロワー掲載時のみ渡される。chrome 行に ✕（閉じる）を出す。 */
  onRequestClose?: () => void;
}) {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { hero } = useHero(isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);

  const selfProfileHref = user?.githubId ? `/heroes/${user.githubId}` : null;
  const allHrefs = NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => item.href),
  );
  const inAccountZone = ACCOUNT_PATHS.some((path) => pathname.startsWith(path));
  // progressRatio が NaN・負・1超だと width が "NaN%" や 100% 超になり
  // バーが壊れる。読めないときは塗らない（home の pct と同方針）。
  const heroProgressRatio =
    hero && Number.isFinite(hero.progressRatio)
      ? Math.min(1, Math.max(0, hero.progressRatio))
      : 0;

  return (
    <div className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-bg-elev">
      {/* ① ウィンドウクローム */}
      <div className="flex items-center border-b border-line px-4 py-[14px]">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full" style={{ background: "#ff5f56" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#27c93f" }} />
        </div>
        <span className="ml-auto text-[11px] text-text-faint">bugbash · v0.1.0</span>
        {onRequestClose != null && (
          // ドロワー時の明示的な閉じるボタン。オーバーレイクリックは
          // 「知っている人の操作」なので、見えている出口を1つ置く。
          // -my で行高は据え置き（デスクトップ表示と縦位置を揃える）。
          <button
            aria-label="ナビゲーションを閉じる"
            className="-my-1.5 ml-2 flex size-7 shrink-0 items-center justify-center rounded border border-line text-[12px] text-text-dim transition-colors hover:text-text"
            onClick={onRequestClose}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* ② ナビゲーション（NAVIGATION=名声 / SHOP=課金） */}
      <div className="flex-1 overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          // 自分の公開プロフィールは正典（home.html）どおりナビ2番目。
          // githubId が取れないときは出さない（捏造リンク禁止）。
          const items: NavItem[] =
            section.label === "NAVIGATION" && selfProfileHref && user
              ? [
                  section.items[0],
                  {
                    glyph: "@",
                    label: `~/@${user.username}`,
                    jaLabel: "プロフィール",
                    href: selfProfileHref,
                  },
                  ...section.items.slice(1),
                ]
              : section.items;
          return (
            <div key={section.label}>
              <p className="px-4 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-text-faint">
                {section.label}
              </p>
              <nav className="flex flex-col gap-0.5 px-2">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={
                      item.href === selfProfileHref
                        ? pathname === selfProfileHref ||
                          PROFILE_ADJACENT_PATHS.includes(pathname)
                        : isNavActive(pathname, item.href, allHrefs)
                    }
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* ③ HERO_STATUS フッター（クリックでアカウントメニュー開閉） */}
      {isAuthenticated && user && hero && (
        <div
          className={[
            "mt-auto border-t bg-bg-elev-2",
            inAccountZone ? "border-accent/40" : "border-line",
          ].join(" ")}
        >
          {menuOpen && (
            <nav aria-label="アカウントメニュー" className="border-b border-line px-2 py-2">
              {selfProfileHref && (
                <Link
                  className="flex items-center rounded px-[10px] py-1.5 text-[12px] text-text hover:bg-bg-elev"
                  href={selfProfileHref}
                  onClick={onNavigate}
                >
                  <span className="mr-2 inline-block w-[16px] text-center text-text-dim">@</span>
                  公開プロフィールを見る
                </Link>
              )}
              {ACCOUNT_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  className={[
                    "flex items-center rounded px-[10px] py-1.5 text-[12px] hover:bg-bg-elev",
                    pathname.startsWith(item.href) ? "text-accent" : "text-text",
                  ].join(" ")}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <span className="mr-2 inline-block w-[16px] text-center text-text-dim">
                    {item.glyph}
                  </span>
                  {item.label}
                </Link>
              ))}
              <div className="mx-2 my-1.5 border-t border-line" />
              {/* ログアウト。BE の /logout（Spring Security）は前から存在して
                  いたが、FE から呼ぶ手段がどこにも無かった（共用PCで詰む） */}
              <button
                className="flex w-full items-center rounded px-[10px] py-1.5 text-left text-[12px] text-text hover:bg-bg-elev"
                onClick={() => void logout()}
                type="button"
              >
                <span className="mr-2 inline-block w-[16px] text-center text-text-dim">⏻</span>
                ログアウト
              </button>
              <div className="mx-2 my-1.5 border-t border-line" />
              {legalFooterLinks.map((link) => (
                <Link
                  key={link.href}
                  className="flex items-center rounded px-[10px] py-1 text-[11px] text-text-dim hover:bg-bg-elev hover:text-text"
                  href={link.href}
                  onClick={onNavigate}
                >
                  <span className="mr-2 inline-block w-[16px] text-center text-text-faint">§</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <button
            aria-expanded={menuOpen}
            aria-label="アカウントメニューを開閉"
            className="w-full p-3 text-left transition-colors hover:bg-bg-elev"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <p className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-text-faint">
              HERO_STATUS
              <span aria-hidden className="text-[12px]">
                {menuOpen ? "▾" : "▴"}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-sm text-[14px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-text">{user.username}</p>
                <p className="text-[10px] text-text-faint">Lv.{hero.level}</p>
              </div>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-elev">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${heroProgressRatio * 100}%`,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                }}
              />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export function SideBar() {
  return (
    <aside className="flex h-full">
      <SideBarContent />
    </aside>
  );
}
