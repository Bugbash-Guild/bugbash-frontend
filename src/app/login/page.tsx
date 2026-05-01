"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/");
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-10">
      <div className="w-[480px] max-w-full">
        <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* title bar */}
          <div className="px-[14px] py-[10px] border-b border-line flex items-center gap-[10px] bg-bg-elev-2">
            <div className="flex gap-[6px]">
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

            {/* title */}
            <div
              className="text-[48px] font-bold leading-[1.05] mb-2"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BugBash
            </div>

            {/* subtitle */}
            <div className="text-[14px] text-text-dim leading-[1.6] mb-6">
              GitHubの開発活動が、そのまま勇者の冒険になる。
              <br />
              PR をマージしよう。XP とモンスターが手に入る。
            </div>

            {/* auth button */}
            <button
              onClick={login}
              disabled={loading}
              className="w-full py-[14px] px-4 bg-text text-bg border-none rounded-[4px] text-[14px] font-semibold flex items-center justify-center gap-[10px] cursor-pointer tracking-[0.02em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              Authorize with GitHub
            </button>

            {/* footnote */}
            <div className="mt-[18px] text-[11px] text-text-faint text-center">
              hero_id := github_id · permissions: read:user, repo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
