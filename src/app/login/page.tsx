"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { safeReturnTo } from "@/components/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { legalFooterLinks } from "@/lib/legalPages";

const RETURN_TO_STORAGE_KEY = "bb.returnTo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAuthResolved, loading, login } = useAuth();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  /*
   * login() は window.location での全画面遷移。押してから GitHub の画面に
   * 変わるまで数百ms〜数秒あり、その間ボタンは押した見た目のまま無反応で、
   * 連打すると遷移が積み重なる。押した事実を出して二度押しも止める。
   */
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // GitHub から戻る（bfcache 復帰）と React の state は残るので、
    // ここで解除しないとログインボタンが押せないまま固まる。
    const reset = () => setRedirecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  useEffect(() => {
    // ここでは先読み（Cookie の目印）を信用しない。目印が古いまま遷移すると
    // /login → / → /login と跳ね返るため、実レスポンスの確定を待つ。
    if (!isAuthResolved || !isAuthenticated) return;
    // OAuth 往復では query が失われるため sessionStorage 側も見る
    const stored = safeReturnTo(window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY));
    window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
    router.replace(returnTo ?? stored ?? "/");
  }, [isAuthResolved, isAuthenticated, returnTo, router]);

  const handleLogin = () => {
    if (redirecting) return;
    setRedirecting(true);
    if (returnTo) window.sessionStorage.setItem(RETURN_TO_STORAGE_KEY, returnTo);
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-10">
      <div className="w-[480px] max-w-full">
        <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* title bar */}
          <div className="px-[14px] py-[10px] border-b border-line flex items-center gap-[10px] bg-bg-elev-2">
            {/* 端末窓の装飾（操作できない飾り）。読み上げからは外す */}
            <div aria-hidden className="flex gap-[6px]">
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff5f56" }} />
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffbd2e" }} />
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#27c93f" }} />
            </div>
            <span className="text-[11px] text-text-dim ml-[6px]">~/bugbash — login</span>
          </div>

          <div className="px-7 pt-8 pb-7">
            {/* prompt lines */}
            <div className="text-[13px] text-text-dim mb-[18px] leading-[1.7]">
              <div>
                <span className="text-accent">$</span> ./bugbash --auth github
              </div>
              <div className="text-text-faint">{`>`} Initializing hero registry…</div>
              <div className="text-text-faint">{`>`} Awaiting OAuth2 handshake.</div>
            </div>

            {/* title — 見出しとして扱う（この画面には h1 が無かった） */}
            <h1
              className="text-[48px] font-bold leading-[1.05] mb-2"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BugBash
            </h1>

            {/* subtitle */}
            <div className="text-[14px] text-text-dim leading-[1.6] mb-6">
              GitHubの開発活動が、そのまま勇者の冒険になる。
              <br />
              PR をマージしよう。XP とモンスターが手に入る。
            </div>

            {/* auth button */}
            <button
              onClick={handleLogin}
              disabled={loading || redirecting}
              className="w-full py-[14px] px-4 bg-text text-bg border-none rounded-[4px] text-[14px] font-semibold flex items-center justify-center gap-[10px] cursor-pointer tracking-[0.02em] hover:opacity-90 transition-opacity disabled:opacity-50"
              type="button"
            >
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              {redirecting ? "GitHub へ移動しています…" : "Authorize with GitHub"}
            </button>

            {/* footnote — ここは事実だけを書く。ログインの OAuth は
                ユーザー識別のみで、リポジトリ権限は要求しない（scope は
                バックエンド設定 read:user,user:email と一致させること）。
                コードへのアクセスは別手順の GitHub App 導入で、対象
                リポジトリはインストール画面でユーザー自身が選ぶ。 */}
            <div className="mt-[18px] text-[11px] text-text-faint text-center leading-[1.8]">
              hero_id := github_id · oauth scope: read:user, user:email
              <br />
              アクセスするリポジトリは、GitHub App のインストール時にあなたが選択します
            </div>
          </div>
        </div>

        {/* legal links（課金を含むサービスの規約・法的表示への入口） */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]">
          {legalFooterLinks.map((link) => (
            <Link
              key={link.href}
              className="text-text-faint transition-colors hover:text-accent"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
