import type { Metadata } from "next";

/**
 * /legal/terms のタブ名。置き場所を layout に揃える理由と、
 * noindex を掛けない理由は /legal/tokushoho の layout を参照。
 */
export const metadata: Metadata = {
  title: "利用規約",
  description:
    "BugBashの利用規約です（弁護士レビュー中のため、現在は課金関連の項目構造のみ掲載）。",
};

export default function TermsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
