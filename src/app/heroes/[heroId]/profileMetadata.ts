/**
 * /heroes/[heroId] のメタデータ生成（layout.tsx / opengraph-image.tsx）が
 * 共用する server 側ヘルパー。
 *
 * layout.tsx に置いて named export すると Next.js のレイアウト型検査が
 * 「レイアウトの export フィールドではない」と落とすため、独立モジュールに
 * 置く（app ディレクトリ内の非予約名 .ts はルートにならない）。
 */

/**
 * バックエンドの公開プロフィールAPIから githubLogin を引く。
 *
 * server 側の fetch は相対URL不可のため、/api/* プロキシ（_proxy.ts）と
 * 同じ環境変数チェーンでバックエンド origin を解決して直接叩く
 * （このAPIは認証不要なので Cookie 転送も不要）。
 *
 * どんな失敗（未設定・タイムアウト・404・契約外の応答）でも null を
 * 返すだけで、ビルドやリクエストは落とさない — メタデータは飾りであって
 * ページ表示のブロッカーにしない。
 */
export async function fetchPublicHeroLogin(heroId: string): Promise<string | null> {
  const backend =
    process.env.BACKEND_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null;
  if (!backend) return null;

  try {
    const res = await fetch(
      `${backend}/api/heroes/${encodeURIComponent(heroId)}/profile`,
      // クローラのプレビュー取得を待たせない・古い名義を焼き込まない
      { cache: "no-store", signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;

    const profile: unknown = await res.json();
    const login =
      typeof profile === "object" && profile !== null && "githubLogin" in profile
        ? (profile as { githubLogin?: unknown }).githubLogin
        : null;
    return typeof login === "string" && login.length > 0 ? login : null;
  } catch {
    return null;
  }
}

/**
 * 絶対URLの組み立て基点（opengraph-image の og:image を絶対URLにするため必要）。
 * サイト自身の origin を表す env は現状無いので、正規オリジンの既定値は
 * _proxyCore.ts が正典として使う app.bugbashguild.com に合わせる。
 */
export const resolveMetadataBase = (): URL => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://app.bugbashguild.com",
    );
  } catch {
    // env の値が壊れていてもメタデータ生成ごと落とさない
    return new URL("https://app.bugbashguild.com");
  }
};
