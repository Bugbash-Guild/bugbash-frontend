"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { RewardModal } from "@/components/RewardModal";
import { RewardArrivalChip } from "@/components/RewardModal/RewardArrivalChip";
import { useAuth } from "@/hooks/useAuth";
import { useRewardNotification } from "@/hooks/useRewardNotification";

/**
 * 未読報酬モーダルのマウント先。認証済みシェルに 1 箇所だけ置くことで、
 * どのページから入っても「セッション開始の報酬儀式」が発生する
 * （従来は home 限定で、直リンク入場では報酬が出なかった）。
 *
 * 提示は3状態の小さな状態機械で決める（UX-BLUEPRINT §4）:
 * - modal: 全画面の儀式。出すのは (a) セッション最初の応答に未読が
 *   あったとき（開幕＝まだ作業中でないので割り込んでよい）と、
 *   (b) 未読を残したままホーム（/）へ到着したとき（ホームは報酬確認の
 *   本来の場所）。
 * - chip: セッション途中にポーリング/フォーカス再検証で届いた着信。
 *   作業中の画面に全画面モーダルを被せず、画面隅の非モーダルチップに
 *   降格する。開くかどうかは本人が決める。
 * - none: 未読なし、または「あとで受け取る」（背景クリック・Esc 含む）で
 *   保留中。保留は既読化ではない — 未読は残り、次のホーム到着（または
 *   次セッション）でまたモーダルが出る。
 *
 * 既読化（acknowledge）を呼ぶのはモーダル内の CLAIM /「次の一歩」だけ。
 * 閉じる操作では呼ばない（誤クリックで報酬明細が永久に消える事故の防止）。
 *
 * 決済系の遷移中ページでは割り込みを抑止する。
 */
const SUPPRESSED_PATHS = ["/billing/return"];

/** 未読報酬の提示形態。modal=儀式 / chip=非モーダルな入口 / none=非表示 */
type RewardDisplay = "modal" | "chip" | "none";

export function RewardModalHost() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { unread, checked, acknowledge } = useRewardNotification(isAuthenticated);

  const [display, setDisplay] = useState<RewardDisplay>("none");
  // 「あとで受け取る」（背景クリック・Esc 含む）による保留。未読は残した
  // まま何も出さず、次にホーム（/）へ到着したときに解除される。
  const [deferredUntilHome, setDeferredUntilHome] = useState(false);
  // セッション最初の応答（＝開幕の儀式にするかの判定）を消費したか。
  const initialBatchConsumedRef = useRef(false);
  // pathname 変化時の effect から最新の未読数を読むための鏡
  // （unread を依存に入れるとホーム到着以外でも発火してしまう）。
  const unreadCountRef = useRef(0);

  useEffect(() => {
    if (!checked) return;
    unreadCountRef.current = unread.length;

    if (unread.length === 0) {
      // 既読化完了（楽観更新を含む）や別タブでの受け取り。表示を畳む。
      // 最初の応答が空だった場合もここで「開幕」を消費し、以降の着信は
      // ライブ着信（chip）として扱う。
      initialBatchConsumedRef.current = true;
      setDisplay("none");
      return;
    }

    if (!initialBatchConsumedRef.current) {
      // セッション開始時点の未読 = 「何を得たのか」に答える開幕の儀式。
      initialBatchConsumedRef.current = true;
      setDisplay("modal");
      return;
    }

    // セッション途中の着信。モーダルが既に開いていればリストが更新される
    // だけ。何も出ていなければチップに降格し、保留中は次のホーム到着まで
    // 何も出さない。
    setDisplay((current) => {
      if (current !== "none" || deferredUntilHome) return current;
      return "chip";
    });
  }, [checked, unread.length, deferredUntilHome]);

  useEffect(() => {
    // ホームは報酬儀式の本来の場所（§4 の home 状態機械）。保留・チップ
    // 止まりの未読があれば、ホーム到着を機にモーダルとして再提示する。
    if (pathname !== "/") return;
    setDeferredUntilHome(false);
    if (unreadCountRef.current === 0) return;
    setDisplay("modal");
  }, [pathname]);

  const handleClaim = () => {
    // 既読化はここ（CLAIM /「次の一歩」）だけ。acknowledge は楽観的に
    // 未読を空にするため、上の effect が表示を畳む。POST 失敗時は
    // ロールバックで未読が戻り、モーダルの再割込みではなくチップとして
    // 再登場する（受け取れていない事実は失わない）。
    void acknowledge();
  };

  const handleDismiss = () => {
    // 既読化しない。未読は残り、次のホーム到着（または次セッション）で
    // また提示される。
    setDeferredUntilHome(true);
    setDisplay("none");
  };

  if (SUPPRESSED_PATHS.some((path) => pathname.startsWith(path))) return null;
  if (unread.length === 0) return null;

  if (display === "modal") {
    return (
      <RewardModal
        activities={unread}
        onClaim={handleClaim}
        onDismiss={handleDismiss}
      />
    );
  }
  if (display === "chip") {
    return <RewardArrivalChip onOpen={() => setDisplay("modal")} />;
  }
  return null;
}
