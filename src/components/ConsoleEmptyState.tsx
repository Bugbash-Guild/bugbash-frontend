import Link from "next/link";

/**
 * 案内付き空状態の正典パターン: グリフ + 説明 + 1つのCTA。
 * 「どうすれば埋まるか」を必ず案内する（空のまま放置しない）。
 *
 * **名声圏の空状態（図鑑・バッジ・記念プレート等）に課金導線は置かない。**
 * そこでの「空」はユーザーの未達を意味するので、そこを突いて売るのは
 * 欠乏の演出にあたる（D-1 の設計裁定）。CTA は名声圏（緑）の行動のみ。
 *
 * ただし**ショップ内の棚が空**の場合の別の棚への案内は対象外とする。
 * ユーザーは既に買う意思で来ており、行き止まりにする理由がないため。
 */
export function ConsoleEmptyState({
  glyph,
  message,
  action,
  className,
}: {
  glyph: string;
  message: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={`border border-dashed border-line-strong bg-bg-elev px-5 py-10 text-center ${className ?? ""}`}
    >
      <p aria-hidden className="text-[28px] text-text-faint">
        {glyph}
      </p>
      <p className="mt-2 text-[12px] leading-6 text-text-dim">{message}</p>
      {action && (
        <Link
          className="mt-3 inline-block rounded-[4px] border border-accent/40 bg-accent/[0.08] px-4 py-2 text-[12px] font-semibold text-accent transition-[filter] hover:brightness-110"
          href={action.href}
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
