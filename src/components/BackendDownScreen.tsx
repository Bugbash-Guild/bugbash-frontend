"use client";

import { useState } from "react";
import { mutate } from "swr";

import { AUTH_STATUS_KEY } from "@/hooks/useAuth";

/**
 * バックエンドに届かないときの画面（2026-08-15 の本番停止の再発対策）。
 *
 * あの日はこの区別が無かったため、停止が「ログアウトされた」ように見え、
 * /login → OAuth → Cloud Run の生エラーページ（英語の Server Error）へ
 * 誘導していた。ここでは事実だけを言う: こちら（ユーザー）の問題ではない、
 * ログアウトされたわけでもない、自動で再接続を試みている。
 *
 * 原因の断定はしない — こちらから見えるのは「届かない」ことだけで、
 * メンテナンスか障害かはこの画面からは分からない。
 */
export function BackendDownScreen() {
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    if (retrying) return;
    setRetrying(true);
    try {
      // 認証プローブの再検証。復旧していれば useAuth 経由で画面が自然に戻る
      await mutate(AUTH_STATUS_KEY);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-[520px] max-w-full">
        <div className="overflow-hidden rounded-[6px] border border-line bg-bg-elev">
          <div className="flex items-center gap-[10px] border-b border-line bg-bg-elev-2 px-[14px] py-[10px]">
            <span className="text-[11px] text-text-dim">~/bugbash — connection</span>
          </div>
          <div className="px-7 py-8">
            <div className="mb-4 text-[13px] leading-[1.7] text-text-dim">
              <div>
                <span className="text-accent">$</span> ping api.bugbash
              </div>
              <div className="text-pink">{">"} サーバーに接続できません</div>
            </div>

            <p className="mb-2 text-[13px] leading-6 text-text-dim">
              メンテナンス中か、一時的な障害の可能性があります。
              あなたの操作やアカウントの問題ではなく、ログアウトされたわけでもありません。
            </p>
            <p className="mb-6 text-[12px] leading-6 text-text-faint">
              30秒ごとに自動で再接続を試みます。復旧すると、この画面はそのまま元のページに戻ります。
            </p>

            <button
              className="w-full rounded border border-accent px-4 py-2 text-[13px] text-accent transition-colors hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={retrying}
              onClick={() => void retry()}
              type="button"
            >
              {retrying ? "再接続中…" : "いま再接続する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * /login 用のコンパクト版。ログインボタンの上に置き、押しても
 * 中間層の生エラーページへ落ちるだけの状態でボタンを止める理由を述べる。
 */
export function BackendDownNotice() {
  return (
    <div className="mb-4 border border-pink/30 bg-pink/10 px-3 py-2.5 text-[12px] leading-5 text-pink">
      サーバーに接続できないため、いまはログインできません。
      メンテナンス中か、一時的な障害の可能性があります。30秒ごとに自動で再接続を試みます。
    </div>
  );
}
