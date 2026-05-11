import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
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
