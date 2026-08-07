import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { SWRProvider } from "@/components/SWRProvider";
import { EARLY_FETCH_SCRIPT } from "@/lib/earlyFetch";
import { SITE_NAME, TITLE_TEMPLATE } from "@/lib/siteMetadata";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  /*
    タブ名は全ページ共通の "BugBash" だった。タブを複数開くと見分けられず、
    履歴・ブックマークからも何の画面か分からないため、各ルートの layout が
    自分の名前を持ち、ここで接尾辞だけを付ける（詳細は lib/siteMetadata.ts）。

    default（＝トップ /）は接尾辞なしの "BugBash" のまま:
    トップはアプリそのものなので "ホーム | BugBash" と名乗る必要がなく、
    かつ「素の BugBash」が残っていれば title 未設定のルートに気づける。
  */
  title: {
    default: SITE_NAME,
    template: TITLE_TEMPLATE,
  },
  description:
    "GitHubの開発活動が、そのまま勇者の冒険になる。PRをマージするとXPとモンスターが手に入ります。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/*
          hydration 前フェッチ。この script は HTML パース中に実行され、
          ページが必要とする API を JS バンドルのロードを待たずに投げ始める。
          中身と約束事は src/lib/earlyFetch.ts を参照。
          ビルド時定数なのでページは static のまま。
        */}
        <script dangerouslySetInnerHTML={{ __html: EARLY_FETCH_SCRIPT }} />
      </head>
      <body className={`${jetbrainsMono.variable} antialiased`}>
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
