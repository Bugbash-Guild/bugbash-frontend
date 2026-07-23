"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { MainWrapper } from "@/components/MainWrapper";
import { usePublicCommemorativeMints } from "@/hooks/useCommemorativeMints";

export default function PublicHeroPage() {
  const params = useParams<{ heroId: string }>();
  const heroId = params.heroId;
  const { error, loading, mints } = usePublicCommemorativeMints(heroId);

  return (
    <MainWrapper>
      <div className="mx-auto min-h-screen max-w-4xl px-5 py-6 sm:px-9">
        <div className="text-[13px] text-text-dim"><span className="text-accent">public@bugbash</span><span className="text-text-faint">:</span><span className="text-accent-2">~/heroes/{heroId}</span><span className="text-text-faint">$ </span>./profile --plates</div>
        <header className="mt-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
          <div>
            <div className="text-[10px] tracking-[0.12em] text-gold">PUBLIC PROFILE</div>
            <h1 className="mt-1 text-[20px] font-semibold text-text">記念プレート</h1>
            <p className="mt-1 text-[12px] text-text-dim">実績を記念する公開コレクションです。</p>
          </div>
          <Link className="text-[11px] text-text-dim hover:text-accent hover:underline" href="/leaderboard">ランキングへ戻る</Link>
        </header>
        {loading && <p className="mt-6 text-[12px] text-text-faint">loading collection…</p>}
        {error && <p className="mt-6 text-[12px] text-pink">公開コレクションを読み込めませんでした。</p>}
        {!loading && !error && (mints.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{mints.map((mint) => <CommemorativePlate key={mint.mintNumber} plate={mint} />)}</div> : <p className="mt-6 border border-line bg-bg-elev p-5 text-[12px] text-text-faint">公開中の記念プレートはありません。</p>)}
      </div>
    </MainWrapper>
  );
}
