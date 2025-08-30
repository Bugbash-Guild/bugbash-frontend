// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { HeroCard } from "@/app/components/HeroCard";
import { MainWrapper } from "@/components/MainWrapper";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // 認証済みのときだけ Hero を取得
  const {
    hero,
    loading: heroLoading,
    error,
    refetch,
  } = useHero(isAuthenticated);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span>認証状態を確認中...</span>
        </div>
      </main>
    );
  }

  return (
    <MainWrapper>
      <main className="p-10 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Home</h1>
        {user && (
          <p className="text-sm text-gray-500">
            こんにちは、{user.username} さん
          </p>
        )}

        {heroLoading && <p>Hero取得中...</p>}
        {error && (
          <p className="text-red-500">
            取得に失敗しました: {error}{" "}
            <button className="underline ml-2" onClick={refetch}>
              再試行
            </button>
          </p>
        )}
        {hero && <HeroCard hero={hero} />}
      </main>
    </MainWrapper>
  );
}
