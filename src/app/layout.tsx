import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { SWRProvider } from "@/components/SWRProvider";
import { EARLY_FETCH_SCRIPT } from "@/lib/earlyFetch";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BugBash",
  description: "GitHubの開発活動が、そのまま勇者の冒険になる。",
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
