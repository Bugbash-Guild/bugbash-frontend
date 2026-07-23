"use client";

import type { ForgeCostRow } from "@/types/forge";

export function SkinMasteryCostTable({ rows }: { rows: ForgeCostRow[] }) {
  return (
    <section aria-labelledby="forge-cost-heading" className="border border-line bg-bg-elev">
      <div className="flex items-end justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <p className="text-[10px] tracking-[0.12em] text-text-faint">SERVER DEFINITION</p>
          <h2 id="forge-cost-heading" className="mt-1 text-[14px] font-semibold text-text">
            St1–St{rows.at(-1)?.level ?? "?"} ルーン一覧
          </h2>
        </div>
        <p className="text-[10px] text-text-faint">cost + cumulative</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-[11px]">
          <thead className="border-b border-line bg-bg-elev-2 text-[10px] tracking-[0.08em] text-text-faint">
            <tr>
              <th className="px-4 py-2 font-medium">STAGE</th>
              <th className="px-4 py-2 font-medium">UNLOCK</th>
              <th className="px-4 py-2 text-right font-medium">COST</th>
              <th className="px-4 py-2 text-right font-medium">CUMULATIVE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.level}>
                <td className="px-4 py-2.5 font-semibold text-purple">St{row.level}</td>
                <td className="px-4 py-2.5 text-text-dim">{row.diffNote}</td>
                <td className="px-4 py-2.5 text-right text-accent">
                  {row.runeCost.toLocaleString("ja-JP")} R
                </td>
                <td className="px-4 py-2.5 text-right text-text">
                  {row.cumulativeRuneCost.toLocaleString("ja-JP")} R
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
