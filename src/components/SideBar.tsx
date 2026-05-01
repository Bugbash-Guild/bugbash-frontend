// src/components/SideBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";

const NAV_ITEMS = [
  { glyph: "⌂", label: "~/home", href: "/" },
  { glyph: "◆", label: "~/monsters", href: "/monsters" },
  { glyph: "▣", label: "~/items", href: "/items" },
  { glyph: "≡", label: "~/activity", href: "/activity" },
  { glyph: "⚙", label: "~/settings", href: "/settings" },
] as const;

export function SideBar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { hero } = useHero(isAuthenticated);

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-bg-elev border-r border-line">
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

      {/* ② NAVIGATIONセクション */}
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
          NAVIGATION
        </p>
        <nav>
          {NAV_ITEMS.map(({ glyph, label, href }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center mx-2 px-[10px] py-2 rounded text-[13px] transition-colors",
                  isActive
                    ? "text-accent border-l-2 border-accent"
                    : "text-text-dim hover:bg-bg-elev-2 border-l-2 border-transparent",
                ].join(" ")}
                style={
                  isActive
                    ? { background: "rgba(126,231,135,0.08)" }
                    : undefined
                }
              >
                <span className="w-[14px] mr-2 shrink-0">{glyph}</span>
                {label}
              </Link>
            );
          })}
        </nav>
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
              H
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
