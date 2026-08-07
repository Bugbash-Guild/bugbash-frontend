import type { Metadata } from "next";

/**
 * /legal/prepaid のタブ名。置き場所を layout に揃える理由と、
 * noindex を掛けない理由は /legal/tokushoho の layout を参照。
 */
export const metadata: Metadata = {
  title: "資金決済法に基づく表示",
  description:
    "BugBashの資金決済法に基づく表示です（弁護士レビュー中のため、現在は項目構造のみ掲載）。",
};

export default function PrepaidLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
