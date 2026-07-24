// src/components/SideBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";

type NavItem = { glyph: string; label: string; href: string; paid?: boolean };

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "NAVIGATION",
    items: [
      { glyph: "⌂", label: "~/home", href: "/" },
      { glyph: "◆", label: "~/monsters", href: "/monsters" },
      { glyph: "▣", label: "~/items", href: "/items" },
      { glyph: "≡", label: "~/summon", href: "/summon" },
      { glyph: "☄", label: "~/summon/limited", href: "/summon/limited", paid: true },
      { glyph: "▲", label: "~/leaderboard", href: "/leaderboard" },
    ],
  },
  {
    label: "BILLING",
    items: [
      { glyph: "▤", label: "~/shop/runes", href: "/shop/runes", paid: true },
      { glyph: "◨", label: "~/shop/skins", href: "/shop/skins", paid: true },
      { glyph: "$", label: "~/shop", href: "/shop" },
      { glyph: "✦", label: "~/pass", href: "/pass", paid: true },
      { glyph: "⚒", label: "~/forge", href: "/forge", paid: true },
      { glyph: "◉", label: "~/badges", href: "/badges" },
      { glyph: "🔨", label: "~/mints", href: "/mints" },
      { glyph: "⛭", label: "~/mypage/billing", href: "/mypage/billing" },
    ],
  },
];

/** より具体的な href が優先される active 判定。 */
function isNavActive(pathname: string, href: string, allHrefs: string[]): boolean {
  if (href === "/") return pathname === "/";
  if (!pathname.startsWith(href)) return false;
  // e.g. /shop should not stay active on /shop/runes
  const moreSpecific = allHrefs.some(
    (other) => other !== href && other.startsWith(href) && pathname.startsWith(other),
  );
  return !moreSpecific;
}

export function SideBar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { hero } = useHero(isAuthenticated);
  const allHrefs = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-bg-elev border-r border-line overflow-y-auto">
      {/* ① ウィンドウクローム */}
      <div className="flex items-center px-4 py-[14px] border-b border-line">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#ff5f56" }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#ffbd2e" }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#27c93f" }}
          />
        </div>
        <span className="ml-auto text-[11px] text-text-faint">
          bugbash · v0.1.0
        </span>
      </div>

      {/* ② ナビゲーション（NAVIGATION / BILLING） */}
      <div className="flex-1 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-4 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-text-faint">
              {section.label}
            </p>
            <nav className="flex flex-col gap-0.5 px-2">
              {section.items.map(({ glyph, label, href, paid }) => {
                const isActive = isNavActive(pathname, href, allHrefs);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
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
                        isActive
                          ? "text-accent"
                          : paid
                            ? "text-rune"
                            : "text-text-dim",
                      ].join(" ")}
                    >
                      {glyph}
                    </span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* ③ HERO_STATUSフッター */}
      {isAuthenticated && user && hero && (
        <div className="mt-auto p-3 border-t border-line bg-bg-elev-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-text-faint mb-2">
            HERO_STATUS
          </p>
          <div className="flex items-center gap-2">
            {/* アバタータイル */}
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0 text-white text-[14px] font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-2))",
              }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-text truncate">{user.username}</p>
              <p className="text-[10px] text-text-faint">Lv.{hero.level}</p>
            </div>
          </div>
          {/* ミニXPバー */}
          <div className="h-1 mt-2 rounded-full bg-bg-elev overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(hero.progressRatio * 100, 100)}%`,
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-2))",
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
