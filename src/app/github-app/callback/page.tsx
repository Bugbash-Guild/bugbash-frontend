"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GithubAppCallback() {
    const router = useRouter();
    const params = useSearchParams();
    const [status, setStatus] = useState<"saving" | "done" | "error">("saving");

    useEffect(() => {
        const installationId = params.get("installation_id");
        const setupAction = params.get("setup_action");

        if (!installationId || setupAction !== "install") {
            router.replace("/");
            return;
        }

        void (async () => {
            try {
                const res = await fetch("/api/github/app/installation", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        installationId: Number(installationId),
                        accountLogin: "",
                        accountType: "User",
                    }),
                });
                if (res.ok) {
                    setStatus("done");
                    setTimeout(() => router.replace("/"), 1500);
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        })();
    }, [params, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="text-center">
                {status === "saving" && (
                    <div className="flex items-center gap-2 text-text-dim text-[13px]">
                        <span className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
                        GitHub App を連携中…
                    </div>
                )}
                {status === "done" && (
                    <div className="text-[13px] text-accent">
                        ✓ GitHub App の連携が完了しました。ホームへ移動します…
                    </div>
                )}
                {status === "error" && (
                    <div className="text-[13px] text-red-400">
                        連携に失敗しました。
                        <button
                            onClick={() => router.replace("/")}
                            className="ml-2 underline"
                        >
                            ホームへ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
