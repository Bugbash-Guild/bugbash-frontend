import { Suspense } from "react";

import { AuthGate } from "@/components/AuthGate";
import { RewardModalHost } from "@/components/RewardModalHost";

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
