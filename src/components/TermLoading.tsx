/**
 * 端末出力様式のローディング表示（D-1: シマー禁止・値の仮置き禁止）。
 * コマンド行を faint で流し、末尾にカーソルを点滅させる。
 *
 * 例: <TermLoading lines={["query dex --owned"]} />
 */
export function TermLoading({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`text-[12px] leading-6 text-text-faint ${className ?? ""}`}
      role="status"
    >
      {lines.map((line, index) => (
        <p key={line}>
          {"> "}
          {line}
          {index === lines.length - 1 && (
            <span className="ml-1 inline-block h-[12px] w-2 animate-pulse bg-accent align-middle" />
          )}
        </p>
      ))}
    </div>
  );
}
