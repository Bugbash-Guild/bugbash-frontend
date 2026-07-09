import Link from "next/link";

import { legalFooterLinks } from "@/lib/legalPages";

export function LegalFooter() {
  return (
    <footer className="mt-10 border-t border-line pt-4 text-[11px] text-text-faint">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="uppercase tracking-[0.12em]">LEGAL</span>
        {legalFooterLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-text-dim transition-colors hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
