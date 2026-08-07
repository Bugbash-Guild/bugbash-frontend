"use client";

import { useEffect, useRef, useState } from "react";

type ShareProfileButtonProps = {
  /** コピーするパス（例: "/heroes/123"）。origin は閲覧中の location から解決する */
  path: string;
};

/**
 * 公開プロフィールのURLをコピーするシェアCTA。
 *
 * トロフィールーム（バッジ・APEX・プレート）は作り込まれているのに
 * シェア導線がゼロで「見せる手段がない」状態だったため、まず最小の
 * 「リンクをコピー」を置く（SNS個別ボタンはURL正規化 /heroes/[login] 後に検討）。
 *
 * clipboard API が使えない環境（非HTTPS・権限拒否・古いWebView）では
 * URLを選択済みの input で見せて手動コピーに退避する — 押したのに
 * 何も起きない、が一番信頼を削るため。
 */
export function ShareProfileButton({ path }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // 「コピーしました」の2秒タイマー。ページ遷移（アンマウント）後の
  // setState を防ぐため、破棄時に必ず止める
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // フォールバックに切り替わったら全選択しておき、あとは Ctrl/Cmd+C だけにする
  useEffect(() => {
    if (fallbackUrl !== null) inputRef.current?.select();
  }, [fallbackUrl]);

  const handleCopy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      // 非セキュアコンテキストでは navigator.clipboard 自体が undefined。
      // その場合もここで throw → catch でフォールバックに落ちる
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setFallbackUrl(url);
    }
  };

  if (fallbackUrl !== null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="公開プロフィールのURL"
          className="w-[240px] max-w-full rounded-[4px] border border-line bg-bg-elev px-2.5 py-1.5 text-[11px] text-text"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          ref={inputRef}
          value={fallbackUrl}
        />
        <span className="text-[10px] text-text-faint">
          コピーできない環境のため、選択してコピーしてください
        </span>
      </div>
    );
  }

  return (
    <button
      // aria-live: 成功表示はボタン内テキストの差し替えなので、SRにも変化を通知する
      aria-live="polite"
      className={[
        "inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[11px] transition-colors",
        copied
          ? "border-accent/40 bg-accent/[0.08] text-accent"
          : "border-line text-text-dim hover:border-accent/40 hover:text-accent",
      ].join(" ")}
      onClick={() => void handleCopy()}
      type="button"
    >
      <span aria-hidden>{copied ? "✓" : "⎘"}</span>
      {copied ? "コピーしました" : "リンクをコピー"}
    </button>
  );
}
