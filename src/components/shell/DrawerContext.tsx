"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * モバイルドロワー（MobileNavDrawer）の開閉を、☰ の置き場所から切り離す Context。
 *
 * ☰ は 2 箇所にある: ConsoleTopbar 左端（モバイル一段化後の定位置）と、
 * topbar を持たないページ用の AppShell フォールバックストリップ。開閉 state を
 * AppShell ローカルに持ったままだと topbar 側から開けないため、shell 配下全体で
 * 共有する。
 *
 * `available` は Provider 配下かどうか。shell 外（/heroes の公開プロフィール等）で
 * ConsoleTopbar が使われても、開けないドロワーの ☰ を出さないための判定。
 */
type DrawerContextValue = {
  available: boolean;
  open: boolean;
  /** trigger には押された ☰ を渡す。閉じたときのフォーカス返却先になる。 */
  openDrawer: (trigger?: HTMLElement | null) => void;
  closeDrawer: () => void;
};

const noop = () => undefined;

const DrawerContext = createContext<DrawerContextValue>({
  available: false,
  open: false,
  openDrawer: noop,
  closeDrawer: noop,
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // 「どの ☰ から開いたか」。閉じたらそこへフォーカスを返す（ダイアログの往復）。
  // Safari はクリックでボタンに focus が乗らないため、activeElement には
  // 頼らず押された要素を明示で受け取る。
  const triggerRef = useRef<HTMLElement | null>(null);
  // MobileNavDrawer はマウント時とページ遷移時にも closeDrawer を呼ぶので、
  // 「実際に開いていた時だけ」フォーカスを返すための同期フラグ。
  const wasOpenRef = useRef(false);

  const openDrawer = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    wasOpenRef.current = true;
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    setOpen(false);
    // 遷移で閉じた場合は旧ページの ☰ が既に DOM から外れており、
    // detached 要素への focus() は no-op になる（それで正しい）。
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  const value = useMemo<DrawerContextValue>(
    () => ({ available: true, open, openDrawer, closeDrawer }),
    [open, openDrawer, closeDrawer],
  );

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer(): DrawerContextValue {
  return useContext(DrawerContext);
}
