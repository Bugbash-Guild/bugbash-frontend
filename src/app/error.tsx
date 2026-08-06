"use client";

import Link from "next/link";

// レンダー中の throw を Next.js 素の本番エラー画面で見せないための境界。
// /monsters・/leaderboard の白画面（issue #122 / #151）は個別に塞いだが、
// 同類のバグを受け止める境界自体がずっと無かった。
// スタックやメッセージは表示しない（内部情報のため）。digest は
// サーバログと突合するための参照キーなので出してよい。
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-10">
      <div className="w-[480px] max-w-full">
        <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden">
          <div className="px-[14px] py-[10px] border-b border-line flex items-center gap-[10px] bg-bg-elev-2">
            <span className="text-[11px] text-text-dim">~/bugbash — error</span>
          </div>
          <div className="px-7 py-8">
            <div className="text-[13px] text-text-dim leading-[1.7] mb-4">
              <div>
                <span className="text-accent">$</span> ./bugbash --render
              </div>
              <div className="text-pink">{">"} panic: 画面の描画に失敗しました</div>
              {error.digest && (
                <div className="text-text-faint">{">"} ref: {error.digest}</div>
              )}
            </div>
            <p className="text-[13px] text-text-dim mb-6">
              一時的な問題の可能性があります。再試行しても直らない場合は、
              時間をおいてアクセスしてください。
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 border border-accent px-4 py-2 text-[13px] text-accent hover:bg-accent hover:text-bg transition-colors rounded"
                onClick={reset}
                type="button"
              >
                [ 再試行 ]
              </button>
              <Link
                className="flex-1 border border-line px-4 py-2 text-center text-[13px] text-text-dim hover:border-accent hover:text-accent transition-colors rounded"
                href="/"
              >
                [ ホームへ ]
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
