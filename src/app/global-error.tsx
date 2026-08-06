"use client";

// ルートレイアウト自体が落ちたときの最後の砦。ここではレイアウトの
// CSS 変数も使えない可能性があるため、依存ゼロのインラインスタイルで描く。
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          alignItems: "center",
          background: "#0b0e14",
          color: "#c9d1d9",
          display: "flex",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "40px",
        }}
      >
        <div style={{ maxWidth: "480px", width: "100%" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.7 }}>
            <span style={{ color: "#3fb950" }}>$</span> ./bugbash
            <br />
            <span style={{ color: "#f778ba" }}>
              {">"} fatal: アプリケーションの起動に失敗しました
            </span>
            {error.digest ? (
              <>
                <br />
                <span style={{ color: "#6e7681" }}>
                  {">"} ref: {error.digest}
                </span>
              </>
            ) : null}
          </p>
          <button
            onClick={reset}
            style={{
              background: "transparent",
              border: "1px solid #3fb950",
              borderRadius: "4px",
              color: "#3fb950",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              marginTop: "16px",
              padding: "8px 16px",
            }}
            type="button"
          >
            [ 再読み込み ]
          </button>
        </div>
      </body>
    </html>
  );
}
