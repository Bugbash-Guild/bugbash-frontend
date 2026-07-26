"use client";

import { usePathname } from "next/navigation";

import { RewardModal } from "@/components/RewardModal";
import { useAuth } from "@/hooks/useAuth";
import { useRewardNotification } from "@/hooks/useRewardNotification";

/**
 * 未読報酬モーダルのマウント先。認証済みシェルに 1 箇所だけ置くことで、
 * どのページから入っても「セッション開始の報酬儀式」が発生する
 * （従来は home 限定で、直リンク入場では報酬が出なかった）。
 *
 * 決済系の遷移中ページでは割り込みを抑止する。
 */
const SUPPRESSED_PATHS = ["/billing/return"];

export function RewardModalHost() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { unread, acknowledge } = useRewardNotification(isAuthenticated);

  if (SUPPRESSED_PATHS.some((path) => pathname.startsWith(path))) return null;
  if (unread.length === 0) return null;

  return <RewardModal activities={unread} onClose={() => void acknowledge()} />;
}
