import type { Metadata } from "next";

import { fetchPublicHeroLogin, resolveMetadataBase } from "./profileMetadata";

/**
 * /heroes/[heroId] のメタデータ層。
 *
 * ページ本体は "use client"（SWRで公開APIを引く）ため、タイトル/OGは
 * この server layout で持つ。シェアCTA（ShareProfileButton）で配られた
 * URLが、SNS上で「BugBash」とだけ出る無名カードになるのを防ぐ。
 * ヘルパーは profileMetadata.ts に分離（layout の named export 制約のため）。
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ heroId: string }>;
}): Promise<Metadata> {
  const { heroId } = await params;
  const login = await fetchPublicHeroLogin(heroId);

  // 失敗時（非公開・未存在・BE不達）は名義を出さない汎用タイトルに落とす。
  // heroId（内部の数値ID）をタイトルに焼き込んでも読者には無意味なので使わない
  const title = login ? `@${login} | BugBash` : "公開プロフィール | BugBash";
  const description = login
    ? `@${login} の公開プロフィール — GitHubの活動で獲得したレベル・バッジ・コレクション。名声表示は購入で変化しません。`
    : "BugBashの公開プロフィール — GitHubの活動で獲得したレベル・バッジ・コレクション。";

  return {
    metadataBase: resolveMetadataBase(),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      username: login ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function PublicHeroLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
