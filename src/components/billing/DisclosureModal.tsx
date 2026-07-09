"use client";

import {
  buildDisclosureFacts,
  buildDisclosureRows,
} from "@/lib/billing/disclosure";
import type { SummonDisclosureResponse } from "@/types/summon";

type DisclosureModalProps = {
  disclosure: SummonDisclosureResponse | null;
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
  open: boolean;
};

export function DisclosureModal({
  disclosure,
  error,
  loading = false,
  onClose,
  open,
}: DisclosureModalProps) {
  if (!open) return null;

  const facts = disclosure ? buildDisclosureFacts(disclosure) : [];
  const rows = disclosure ? buildDisclosureRows(disclosure) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="summon-disclosure-title"
        aria-modal="true"
        className="max-h-[88vh] w-full max-w-3xl overflow-hidden border border-line bg-bg-elev shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-line px-5 py-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
            DISCLOSURE
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-[18px] font-semibold text-text"
                id="summon-disclosure-title"
              >
                提供割合
              </h2>
              {disclosure && (
                <p className="mt-1 text-[12px] leading-5 text-text-dim">
                  {disclosure.name}
                  {disclosure.description ? ` / ${disclosure.description}` : ""}
                </p>
              )}
            </div>
            <button
              aria-label="閉じる"
              className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
              onClick={onClose}
              type="button"
            >
              閉じる
            </button>
          </div>
        </div>

        <div className="max-h-[calc(88vh-88px)] overflow-y-auto px-5 py-4">
          {loading && (
            <div className="border border-line bg-bg px-3 py-6 text-center text-[12px] text-text-dim">
              読み込み中…
            </div>
          )}

          {!loading && error && (
            <div
              aria-live="polite"
              className="border border-pink/30 bg-pink/10 px-3 py-3 text-[12px] text-pink"
            >
              {error}
            </div>
          )}

          {!loading && !error && !disclosure && (
            <div className="border border-line bg-bg px-3 py-6 text-center text-[12px] text-text-dim">
              開示情報を読み込めませんでした。
            </div>
          )}

          {!loading && !error && disclosure && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label} className="border border-line bg-bg px-3 py-2">
                    <div className="text-[10px] text-text-faint">{fact.label}</div>
                    <div className="mt-1 text-[13px] font-semibold text-text">
                      {fact.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto border border-line">
                <table className="w-full min-w-[560px] border-collapse text-left text-[12px]">
                  <thead className="bg-bg-elev-2 text-[10px] uppercase tracking-[0.08em] text-text-faint">
                    <tr>
                      <th className="border-b border-line px-3 py-2 font-medium">ITEM</th>
                      <th className="border-b border-line px-3 py-2 font-medium">RARITY</th>
                      <th className="border-b border-line px-3 py-2 font-medium">WEIGHT</th>
                      <th className="border-b border-line px-3 py-2 font-medium">
                        PROBABILITY
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.itemId} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-2 text-text">{row.itemId}</td>
                        <td className="px-3 py-2 text-text-dim">{row.rarity}</td>
                        <td className="px-3 py-2 text-text-dim">{row.weight}</td>
                        <td className="px-3 py-2 font-semibold text-accent">
                          {row.probability}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] leading-5 text-text-faint">
                召喚結果は各回ごとに抽選されます。提供割合は小数表示のため、合計が100%からわずかにずれる場合があります。
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
