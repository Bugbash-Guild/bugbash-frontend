import { AppShell } from "@/components/AppShell";

/**
 * ウィンドウフレーム + サイドバーを持つ画面群のレイアウト。
 * route group なので URL には現れない。レイアウトは遷移をまたいで
 * 生存するため、サイドバーが再マウントされない。
 */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
