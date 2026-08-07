"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * GitHub App セットアップ後の着地画面の状態。
 *
 * - saving:  installation を保存中（install / update）
 * - done:    保存完了。action によって見出しを変える
 * - request: 組織リポジトリへの導入申請（installation はまだ存在しない）
 * - invalid: 連携パラメータ無しで開かれた（直接アクセスなど）
 * - error:   保存 API が失敗。再試行できる
 */
type CallbackView =
    | { kind: "saving" }
    | { kind: "done"; action: "install" | "update" }
    | { kind: "request" }
    | { kind: "invalid" }
    | { kind: "error" };

/**
 * 「次に起きること」の案内。導入直後は画面上なにも変わらないため、
 * 反映のタイミングと対象範囲（過去分は対象外）をここで言い切っておく。
 */
function WhatHappensNext({ approvalRequired }: { approvalRequired?: boolean }) {
    return (
        <div className="mt-3 border border-line bg-bg px-3 py-2.5 text-[12px] leading-6 text-text-dim">
            <span className="text-text-faint">次に起きること: </span>
            {approvalRequired ? "承認後、" : ""}
            あなたが author の PR がマージされると、数秒でホームに反映されます。過去のマージ分は対象外です。
        </div>
    );
}

function HomeLink() {
    return (
        <Link
            className="inline-block rounded-[4px] border border-accent/40 bg-accent/[0.08] px-4 py-2 text-[12px] font-semibold text-accent transition-[filter] hover:brightness-110"
            href="/"
        >
            ホームへ →
        </Link>
    );
}

/**
 * 導入をやり直す入口。slug 未設定だと
 * https://github.com/apps//installations/new という壊れた URL になるので、
 * その構成では出さない（ホームの GithubAppBanner と同じ判定）。
 */
const APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";

function GithubAppCallbackInner() {
    const params = useSearchParams();
    const [view, setView] = useState<CallbackView>({ kind: "saving" });
    // 「もう一度試す」で保存エフェクトを再実行するためのカウンタ
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const installationId = params.get("installation_id");
        const setupAction = params.get("setup_action");

        // 組織リポジトリへの導入申請。管理者が承認するまで installation は
        // 作られず installation_id も付かないので、保存せず案内だけ出す。
        if (setupAction === "request") {
            setView({ kind: "request" });
            return;
        }

        if (!installationId || (setupAction !== "install" && setupAction !== "update")) {
            // 以前はここで無言のまま / へ流していた。何も説明されずに画面が
            // 消えるだけになるため、状況を表示して自分で戻ってもらう。
            setView({ kind: "invalid" });
            return;
        }

        const action: "install" | "update" = setupAction;
        let cancelled = false;
        setView({ kind: "saving" });

        void (async () => {
            try {
                const accountLogin = params.get("account_login") ?? "";
                const accountType = params.get("account_type") ?? "User";
                const res = await fetch("/api/github/app/installation", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        installationId: Number(installationId),
                        accountLogin,
                        accountType,
                    }),
                });
                if (cancelled) return;
                setView(res.ok ? { kind: "done", action } : { kind: "error" });
            } catch {
                if (!cancelled) setView({ kind: "error" });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [params, attempt]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-6">
            <div className="w-[520px] max-w-full">
                <div className="bg-bg-elev border border-line rounded-[6px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                    {/* title bar（/login と同じ端末窓様式） */}
                    <div className="px-[14px] py-[10px] border-b border-line flex items-center gap-[10px] bg-bg-elev-2">
                        {/* 端末窓の装飾（操作できない飾り）。読み上げからは外す */}
                        <div aria-hidden className="flex gap-[6px]">
                            <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff5f56" }} />
                            <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffbd2e" }} />
                            <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#27c93f" }} />
                        </div>
                        <span className="text-[11px] text-text-dim ml-[6px]">~/bugbash — github-app</span>
                    </div>

                    <div className="px-6 py-6">
                        {view.kind === "saving" && (
                            <div className="flex items-center gap-2 text-text-dim text-[13px]">
                                <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
                                GitHub App を連携中…
                            </div>
                        )}

                        {view.kind === "done" && (
                            <>
                                <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                                    SETUP COMPLETE
                                </div>
                                <h1 className="mt-1 text-[16px] font-semibold text-accent">
                                    {view.action === "update"
                                        ? "リポジトリ設定を更新しました"
                                        : "GitHub App の連携が完了しました"}
                                </h1>
                                <WhatHappensNext />
                                <div className="mt-4">
                                    <HomeLink />
                                </div>
                            </>
                        )}

                        {view.kind === "request" && (
                            <>
                                <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                                    APPROVAL PENDING
                                </div>
                                <h1 className="mt-1 text-[16px] font-semibold text-text">
                                    組織管理者の承認待ちです
                                </h1>
                                <p className="mt-2 text-[12px] leading-6 text-text-dim">
                                    承認されると自動で有効になります。承認されるまで PR は追跡されません。
                                </p>
                                <WhatHappensNext approvalRequired />
                                <div className="mt-4">
                                    <HomeLink />
                                </div>
                            </>
                        )}

                        {view.kind === "invalid" && (
                            <>
                                <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                                    SETUP INCOMPLETE
                                </div>
                                <h1 className="mt-1 text-[16px] font-semibold text-text">
                                    連携情報を確認できませんでした
                                </h1>
                                <p className="mt-2 text-[12px] leading-6 text-text-dim">
                                    GitHub からの連携パラメータが見つかりません。導入をやり直すか、ホームに戻って
                                    状態を確認してください。
                                </p>
                                {/* 「ホームの案内から探してください」で放り出すと1手余分になる。
                                    同じ導入リンクをこの場に置いて、ここからやり直せるようにする
                                    （並びとボタン様式は下の SETUP FAILED と揃える） */}
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {APP_SLUG ? (
                                        <>
                                            <a
                                                className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg"
                                                href={`https://github.com/apps/${APP_SLUG}/installations/new`}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                GitHub App を導入する →
                                            </a>
                                            <Link
                                                className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                                                href="/"
                                            >
                                                ホームへ
                                            </Link>
                                        </>
                                    ) : (
                                        <HomeLink />
                                    )}
                                </div>
                            </>
                        )}

                        {view.kind === "error" && (
                            <>
                                <div className="text-[10px] uppercase tracking-[0.12em] text-text-faint">
                                    SETUP FAILED
                                </div>
                                <h1 className="mt-1 text-[16px] font-semibold text-pink">連携に失敗しました</h1>
                                <p className="mt-2 text-[12px] leading-6 text-text-dim">
                                    GitHub 側の操作は完了しています。通信状況を確認して、この画面から保存だけ
                                    やり直せます。
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        className="border border-accent px-3 py-1.5 text-[12px] text-accent hover:bg-accent hover:text-bg"
                                        onClick={() => setAttempt((count) => count + 1)}
                                        type="button"
                                    >
                                        もう一度試す
                                    </button>
                                    <Link
                                        className="border border-line px-3 py-1.5 text-[12px] text-text-dim hover:bg-bg-elev-2"
                                        href="/"
                                    >
                                        ホームへ
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GithubAppCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="flex items-center gap-2 text-text-dim text-[13px]">
                    <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
                    読み込み中…
                </div>
            </div>
        }>
            <GithubAppCallbackInner />
        </Suspense>
    );
}
