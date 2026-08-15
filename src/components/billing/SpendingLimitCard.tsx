"use client";

import { useState } from "react";
import useSWR from "swr";

import {
  buildSpendingLimitPresentation,
  formatCapJpy,
  mapSpendingLimitUpdateError,
  parseSpendingLimitResponse,
  type SpendingLimitView,
} from "@/lib/billing/spendingLimit";
import { readBillingErrorMessage } from "@/lib/billing/runeCheckout";

async function fetchSpendingLimit(url: string): Promise<SpendingLimitView | null> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`spending-limit fetch failed: ${response.status}`);
  return parseSpendingLimitResponse(await response.json());
}

/**
 * 月次課金上限の自己設定カード（設計v3 §5-F）。
 *
 * - 既定は年齢区分の上限（成人¥50,000）。本人がいつでも変更できる
 * - 引き上げ・撤廃は24時間後に反映（値はBEの raiseDelayHours）、引き下げは即時
 * - 未成年には撤廃の選択肢自体を出さない（BEも拒否するが、押せない物は見せない）
 * - 金額・時刻はすべてBE応答の実数。FEに上限の定数を持たない
 */
export function SpendingLimitCard() {
  const { data: view, error, isLoading, mutate } = useSWR(
    "/api/billing/spending-limit",
    fetchSpendingLimit,
    { shouldRetryOnError: false },
  );

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [removeCap, setRemoveCap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function submit() {
    if (saving) return;
    const capJpy = removeCap ? null : Number.parseInt(inputValue, 10);
    if (!removeCap && (!Number.isInteger(capJpy) || capJpy == null || capJpy <= 0)) {
      setSaveError("金額を数字で入力してください。");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/billing/spending-limit", {
        body: JSON.stringify({ capJpy }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) {
        const serverMessage = await readBillingErrorMessage(response);
        setSaveError(mapSpendingLimitUpdateError(response.status, serverMessage));
        return;
      }
      setEditing(false);
      setRemoveCap(false);
      setInputValue("");
      await mutate();
    } catch {
      setSaveError("上限を変更できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-bg p-4">
        <h3 className="text-[13px] font-semibold text-text">月次課金上限</h3>
        <p className="mt-2 text-[11px] text-text-faint">設定を読み込んでいます…</p>
      </div>
    );
  }

  // 年齢未申告(422)などは案内に留める。ここで嘘の既定値を表示しない
  if (error || view == null) {
    return (
      <div className="bg-bg p-4">
        <h3 className="text-[13px] font-semibold text-text">月次課金上限</h3>
        <p className="mt-2 text-[11px] leading-5 text-text-dim">
          上限の設定は年齢区分の申告後に利用できます。
        </p>
      </div>
    );
  }

  const presentation = buildSpendingLimitPresentation(view);

  return (
    <div className="bg-bg p-4">
      <h3 className="text-[13px] font-semibold text-text">月次課金上限</h3>
      <p className="mt-2 text-[15px] font-semibold text-text">{presentation.currentText}</p>
      {presentation.pendingText && (
        <p className="mt-1 border border-gold/40 bg-gold/10 px-2 py-1 text-[11px] leading-5 text-gold">
          反映待ち: {presentation.pendingText}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-5 text-text-dim">{presentation.ruleText}</p>

      {!editing ? (
        <button
          className="mt-3 border border-line px-3 py-1.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
          onClick={() => {
            setEditing(true);
            setInputValue(view.effectiveCapJpy?.toString() ?? "");
            setRemoveCap(false);
            setSaveError(null);
          }}
          type="button"
        >
          上限を変更する
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-[11px] text-text-dim">
            新しい上限（円 / 月）
            <input
              className="mt-1 w-full border border-line bg-bg-elev px-2 py-1.5 text-[13px] text-text disabled:opacity-50"
              disabled={removeCap || saving}
              inputMode="numeric"
              onChange={(event) => setInputValue(event.target.value)}
              value={inputValue}
            />
          </label>
          {presentation.canRemoveCap && (
            <label className="flex items-center gap-2 text-[11px] text-text-dim">
              <input
                checked={removeCap}
                disabled={saving}
                onChange={(event) => setRemoveCap(event.target.checked)}
                type="checkbox"
              />
              上限を設定しない（無制限）
            </label>
          )}
          {saveError && (
            <p className="border border-pink/30 bg-pink/10 px-2 py-1 text-[11px] text-pink">
              {saveError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg disabled:opacity-50"
              disabled={saving}
              onClick={() => void submit()}
              type="button"
            >
              {saving
                ? "保存中…"
                : removeCap
                  ? `無制限にする（${view.raiseDelayHours}時間後に反映）`
                  : "変更する"}
            </button>
            <button
              className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setSaveError(null);
              }}
              type="button"
            >
              やめる
            </button>
          </div>
          <p className="text-[10px] leading-4 text-text-faint">
            現在の設定（{formatCapJpy(view.effectiveCapJpy)}）より下げる変更は即時に反映されます。
          </p>
        </div>
      )}
    </div>
  );
}
