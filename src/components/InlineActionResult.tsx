import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "success" | "error";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-accent/20 bg-accent/[0.06]",
  error: "border-pink/20 bg-pink/[0.06]",
};

const TITLE_CLASSES: Record<Tone, string> = {
  success: "text-accent",
  error: "text-pink",
};

/**
 * 操作直近に置くインライン確定表示（items ページの成功ブロックを汎用化）。
 * トーストは使わない方針（真実は操作したコントロールの隣に出す）。
 */
export function InlineActionResult({
  tone,
  title,
  children,
  action,
}: {
  tone: Tone;
  title: string;
  children?: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`space-y-1 rounded-[4px] border p-2.5 text-[11px] ${TONE_CLASSES[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className={`font-bold ${TITLE_CLASSES[tone]}`}>{title}</div>
      {children && <div className="text-text-faint">{children}</div>}
      {action && (
        <Link
          className="inline-block pt-0.5 text-text underline underline-offset-4 hover:text-accent"
          href={action.href}
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
