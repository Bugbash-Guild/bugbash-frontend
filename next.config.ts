import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_ORIGIN ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const assetBaseUrl =
  process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? process.env.BUGBASH_ASSETS_BASE_URL;

const assetRemotePatterns = (() => {
  if (!assetBaseUrl) return [];

  try {
    const url = new URL(assetBaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: assetRemotePatterns,
  },
  async rewrites() {
    return [
      // OAuth フロー全体をフロントエンドドメイン経由にする
      // → セッションクッキーがフロントエンドドメインに設定され、
      //   /api/* プロキシルートが正しく転送できるようになる
      {
        source: "/oauth2/:path*",
        destination: `${backendUrl}/oauth2/:path*`,
      },
      {
        source: "/login/:path*",
        destination: `${backendUrl}/login/:path*`,
      },
    ];
  },
};

export default nextConfig;
