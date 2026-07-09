import type { LegalPage } from "@/lib/legalPages";
import { LegalFooter } from "@/components/LegalFooter";

export function LegalPageShell({ page }: { page: LegalPage }) {
  return (
    <div className="min-h-screen px-9 py-6">
      <div className="mb-5 text-[13px] text-text-dim">
        <span className="text-accent">root@bugbash</span>
        <span className="text-text-faint">:</span>
        <span className="text-accent-2">{page.href}</span>
        <span className="text-text-faint">$ </span>
        <span>cat ./review-placeholder.md</span>
        <span className="ml-0.5 inline-block h-[14px] w-2 animate-pulse bg-accent align-middle" />
      </div>

      <header className="mb-6 border border-line bg-bg-elev p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
            {page.reviewStatus}
          </span>
          <span className="text-[11px] text-text-faint">
            確定文言は掲載していません
          </span>
        </div>
        <h1 className="text-[24px] font-semibold text-text">{page.title}</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-6 text-text-dim">
          {page.description}
        </p>
      </header>

      <div className="space-y-4">
        {page.sections.map((section) => (
          <section key={section.title} className="border border-line bg-bg-elev">
            <h2 className="border-b border-line px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">
              {section.title}
            </h2>
            <div className="divide-y divide-line">
              {section.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-2 px-4 py-3 text-[12px] md:grid-cols-[220px_1fr]"
                >
                  <div className="text-text-dim">{row.label}</div>
                  <div className="text-text">{row.value}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <LegalFooter />
    </div>
  );
}
