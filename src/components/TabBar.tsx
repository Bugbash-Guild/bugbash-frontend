"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "~/home",     href: "/" },
  { label: "~/monsters", href: "/monsters" },
  { label: "~/items",    href: "/items" },
  { label: "~/settings", href: "/settings" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-stretch h-9 border-b border-line"
      style={{ background: "var(--bg-elev-2)" }}
    >
      {TABS.map(({ label, href }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex items-center px-4 text-[12px] transition-colors border-r border-line"
            style={{
              background: isActive ? "var(--bg-elev)" : "transparent",
              color: isActive ? "var(--text)" : "var(--text-faint)",
            }}
          >
            {isActive && (
              <span
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--accent)" }}
              />
            )}
            {label}
          </Link>
        );
      })}
    </div>
  );
}
