import Link from "next/link";

// 存在しないパスに Next.js 素の 404 を出さないための境界。
// ログイン画面と同じ端末窓の様式に揃える。
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-10">
      <div className="w-[480px] max-w-full">
        <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden">
          <div className="px-[14px] py-[10px] border-b border-line flex items-center gap-[10px] bg-bg-elev-2">
            <span className="text-[11px] text-text-dim">~/bugbash — not found</span>
          </div>
          <div className="px-7 py-8">
            <div className="text-[13px] text-text-dim leading-[1.7] mb-4">
              <div>
                <span className="text-accent">$</span> cd {"<requested-path>"}
              </div>
              <div className="text-pink">{">"} 404: no such file or directory</div>
            </div>
            <p className="text-[13px] text-text-dim mb-6">
              このページは存在しないか、移動しました。
            </p>
            <Link
              className="inline-block border border-accent px-4 py-2 text-[13px] text-accent hover:bg-accent hover:text-bg transition-colors rounded"
              href="/"
            >
              [ ホームへ戻る ]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
