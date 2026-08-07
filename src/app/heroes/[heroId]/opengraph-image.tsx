import { ImageResponse } from "next/og";

import { fetchPublicHeroLogin } from "./profileMetadata";

/**
 * 公開プロフィールのOG画像（1200x630）。
 *
 * コンソール風の簡素なテキストカード: プロンプト行 + @ハンドル + BUGBASH。
 * next/og の既定フォント（Noto Sans ラテン）に無いグリフは豆腐になるため、
 * カード内の文言は ASCII のみで構成する（画面側の日本語コピーとは役割が別）。
 * ハンドル取得に失敗してもカード自体は汎用文言で必ず返す。
 */

export const alt = "BugBash public hero profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// globals.css のコンソールパレットと同値（ImageResponse は CSS 変数を参照できない）
const COLOR = {
  bgOuter: "#04070a",
  bg: "#0b0f0d",
  line: "#1f3028",
  text: "#dcefe5",
  textDim: "#7a9c8c",
  textFaint: "#4a6157",
  accent: "#7ee787",
  blue: "#79c0ff",
} as const;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ heroId: string }>;
}) {
  const { heroId } = await params;
  const login = await fetchPublicHeroLogin(heroId);
  // 非公開/未存在/取得失敗では名義を出さない（layout.tsx のタイトルと同方針）
  const handle = login ?? "hero";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: COLOR.bgOuter,
          padding: 36,
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: `2px solid ${COLOR.line}`,
            borderRadius: 14,
            backgroundColor: COLOR.bg,
            padding: "40px 56px",
          }}
        >
          {/* ウィンドウクローム（SideBar ①と同じ3ドット） */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 9999, backgroundColor: "#ff5f56" }} />
            <div style={{ width: 16, height: 16, borderRadius: 9999, backgroundColor: "#ffbd2e" }} />
            <div style={{ width: 16, height: 16, borderRadius: 9999, backgroundColor: "#27c93f" }} />
            <div style={{ display: "flex", marginLeft: "auto", color: COLOR.textFaint, fontSize: 22 }}>
              bugbash v0.1.0
            </div>
          </div>

          {/* プロンプト行（公開ページの topbar と同じ curl 演出） */}
          <div style={{ display: "flex", marginTop: 64, fontSize: 28, color: COLOR.textDim }}>
            <span style={{ color: COLOR.accent }}>visitor@github</span>
            <span style={{ color: COLOR.textFaint }}>:</span>
            <span style={{ color: COLOR.blue }}>~</span>
            <span style={{ color: COLOR.textFaint }}>$&nbsp;</span>
            <span>curl bugbash.dev/@{handle}</span>
          </div>

          {/* ハンドル */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 28,
              maxWidth: 1040,
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 84, color: COLOR.textFaint }}>@</span>
            <span
              style={{
                fontSize: 92,
                fontWeight: 700,
                color: COLOR.text,
                whiteSpace: "nowrap",
              }}
            >
              {handle}
            </span>
          </div>

          <div style={{ display: "flex", marginTop: 12, fontSize: 26, color: COLOR.textDim }}>
            PUBLIC HERO PROFILE :: badges / apex skins / commemorative casts
          </div>

          {/* フッター: ワードマーク + 名声の非売宣言（ASCIIで） */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "auto",
              paddingTop: 28,
              borderTop: `2px solid ${COLOR.line}`,
            }}
          >
            <span style={{ fontSize: 34, fontWeight: 700, color: COLOR.accent }}>BUGBASH</span>
            <span style={{ display: "flex", marginLeft: 24, fontSize: 22, color: COLOR.textFaint }}>
              github activity, played as an adventure
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
