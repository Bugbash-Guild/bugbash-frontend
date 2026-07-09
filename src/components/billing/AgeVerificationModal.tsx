"use client";

import { useState } from "react";

import {
  AGE_GROUP_OPTIONS,
  buildAgeVerificationRequest,
  formatMonthlyLimitJpy,
  markAgeVerified,
} from "@/lib/billing/ageVerification";
import type { AgeGroup, AgeVerificationResponse } from "@/types/billing";

type AgeVerificationModalProps = {
  onClose?: () => void;
  onVerified?: (result: AgeVerificationResponse) => void;
  open: boolean;
};

export function AgeVerificationModal({
  onClose,
  onVerified,
  open,
}: AgeVerificationModalProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>("ADULT");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgeVerificationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/age-verification", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildAgeVerificationRequest(selectedAgeGroup)),
      });

      if (!response.ok) {
        throw new Error("age verification failed");
      }

      const verification = (await response.json()) as AgeVerificationResponse;
      markAgeVerified(window.localStorage);
      setResult(verification);
      onVerified?.(verification);
    } catch {
      setError("年齢確認を保存できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-labelledby="age-verification-title"
        aria-modal="true"
        className="w-full max-w-lg border border-line bg-bg-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-text-faint">
            AGE CHECK
          </div>
          <h2 id="age-verification-title" className="text-[18px] font-semibold text-text">
            年齢確認
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-text-dim">
            購入上限を適用するため、現在の年齢区分を選択してください。
          </p>
        </div>

        <div className="space-y-2">
          {AGE_GROUP_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer gap-3 border px-3 py-3 text-left transition-colors",
                selectedAgeGroup === option.value
                  ? "border-accent bg-accent/8"
                  : "border-line bg-bg hover:bg-bg-elev-2",
              ].join(" ")}
            >
              <input
                checked={selectedAgeGroup === option.value}
                className="mt-1 accent-[var(--accent)]"
                name="ageGroup"
                onChange={() => setSelectedAgeGroup(option.value)}
                type="radio"
              />
              <span>
                <span className="block text-[13px] font-semibold text-text">
                  {option.label}
                </span>
                <span className="mt-1 block text-[11px] leading-5 text-text-faint">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {result && (
          <div className="mt-4 border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] text-accent">
            30日間の購入上限: {formatMonthlyLimitJpy(result.monthlyLimitJpy)}
          </div>
        )}

        {error && (
          <div className="mt-4 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {onClose && (
            <button
              className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              閉じる
            </button>
          )}
          <button
            className="bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={submitting}
            onClick={submit}
            type="button"
          >
            {submitting ? "保存中…" : "保存する"}
          </button>
        </div>
      </section>
    </div>
  );
}
