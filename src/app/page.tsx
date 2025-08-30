'use client';

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/LoginButton";
import { UserProfile } from "@/components/UserProfile";

export default function Home() {
  const { isAuthenticated, user, loading, login } = useAuth();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold mb-4">GitHub認証テストアプリ</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            GitHubアカウントでログインして認証フローをテストします
          </p>
        </div>

        <div className="flex justify-center items-center min-h-[120px]">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span>認証状態を確認中...</span>
            </div>
          ) : isAuthenticated && user ? (
            <UserProfile user={user} />
          ) : (
            <LoginButton onLogin={login} />
          )}
        </div>
      </main>
    </div>
  );
}
