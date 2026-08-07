import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthGate } from "@/components/AuthGate";
import { RewardModalHost } from "@/components/RewardModalHost";

/**
 * ログイン必須ページは検索結果に出しても価値がない（クローラーには
 * AuthGate の手前しか見えず、中身へ到達できない）ため、この配下を
 * まとめて noindex にする。個別ページの layout には robots を書かない
 * ＝ 方針の置き場所はここ 1 箇所。
 * 公開して構わない /login・/legal/*・/heroes/[heroId] はこの配下に
 * ないので影響を受けない。
 *
 * title はここに置かないこと。文字列 title を宣言した segment は
 * 子ルートへの title template を落とすため、/monsters 等の
 * 「| BugBash」が消える（lib/siteMetadata.ts 参照）。
 */
export const metadata: Metadata = {
  robots: { index: false },
};

/**
 * 認証必須ページのレイアウト。ガードはここ 1 箇所
 * （各ページの authenticating… 早期 return は撤去済み）。
 */
export default function AuthedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense>
      <AuthGate>
        {children}
        <RewardModalHost />
      </AuthGate>
    </Suspense>
  );
}
