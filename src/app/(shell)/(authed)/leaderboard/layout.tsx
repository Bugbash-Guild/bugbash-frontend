import type { Metadata } from "next";

/**
 * /leaderboard のタブ名。ページ本体は "use client" で metadata を持てない。
 * ページに h1 がないため、サイドバーの jaLabel をそのまま使う。
 */
export const metadata: Metadata = {
  title: "ランキング",
  description: "XP順で並ぶ全体ランキングです。",
};

export default function LeaderboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
