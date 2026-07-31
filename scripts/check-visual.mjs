/**
 * 全画面を実際に描画してスクリーンショットを吐き、横スクロールの発生と
 * ビューポートを超える要素を機械的に検出する。
 *
 * 機械化したのは、推測でCSSを当てて外し続けたため。
 * `min-w-0` の欠落のような原因は、超過要素を列挙しないと特定できない（#145）。
 *
 * 使い方:
 *   npm run check:visual              # モックBEとサーバを自前で起動
 *   BASE_URL=http://localhost:3000 npm run check:visual   # 起動済みに向ける
 *   MOCK_UNREAD=1 npm run check:visual                    # 報酬モーダルも見る
 *
 * 終了コード: クラッシュ・JSエラー・横スクロールのいずれかがあれば 1。
 *
 * クラッシュ検出を後から足したのは、溢れ検査だけだと**白画面のページが
 * 通ってしまう**ため（クラッシュしたページの scrollWidth は溢れない）。
 * 実際に /monsters が壊れているのに OK と報告された。
 * 祖先にクリップされている要素は参考情報として出すだけ（意図的な省略と
 * 区別できないため、これで落とすと誤検知で信用されなくなる）。
 */
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = process.env.OUT_DIR ?? ".visual";
const CHROMIUM =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** 確認するページ。増えたらここに足す。 */
const PAGES = [
  ["home", "/"],
  ["monsters", "/monsters"],
  ["summon", "/summon"],
  ["summon-limited", "/summon/limited"],
  ["shop", "/shop"],
  ["shop-runes", "/shop/runes"],
  ["shop-skins", "/shop/skins"],
  ["pass", "/pass"],
  ["leaderboard", "/leaderboard"],
  ["mypage-billing", "/mypage/billing"],
  ["admin-funnel", "/admin/funnel"],
];

/** 幅。JS側の SP 判定は 768px 境界なので、その前後と実機幅を見る。 */
const VIEWPORTS = [
  ["sp", 390],
  ["tablet", 768],
  ["desktop", 1440],
];

/**
 * 意図的にビューポートを超える要素。
 * `truncate` の中身や装飾は「祖先が意図的にクリップしている」ので対象外。
 */
const IGNORE_SELECTORS = [
  "[data-visual-overflow-ok]",
  ".pointer-events-none", // 環境光グローなどの装飾
  ".truncate", // 省略記号で畳む前提の中身
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      // まだ起きていない
    }
    await wait(500);
  }
  throw new Error(`server did not become ready: ${url}`);
}

async function main() {
  const started = [];
  let baseUrl = process.env.BASE_URL ?? null;

  try {
    if (!baseUrl) {
      const mockPort = process.env.MOCK_PORT ?? "8080";
      const appPort = process.env.APP_PORT ?? "3999";
      baseUrl = `http://localhost:${appPort}`;

      started.push(
        spawn(process.execPath, ["scripts/mock-backend.mjs"], {
          env: { ...process.env, MOCK_PORT: mockPort },
          stdio: "inherit",
        }),
      );
      started.push(
        spawn("npx", ["next", "start", "-p", appPort], {
          env: {
            ...process.env,
            BACKEND_ORIGIN: `http://localhost:${mockPort}`,
            NEXT_PUBLIC_GITHUB_APP_SLUG:
              process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "bugbash-guild",
          },
          stdio: "inherit",
        }),
      );
      await waitForServer(baseUrl);
    }

    const { chromium } = await import("playwright-core");
    await rm(OUT_DIR, { force: true, recursive: true });
    await mkdir(OUT_DIR, { recursive: true });

    const browser = await chromium.launch({
      args: ["--no-sandbox"],
      executablePath: CHROMIUM,
    });

    const problems = [];

    for (const [vpName, width] of VIEWPORTS) {
      for (const [pageName, route] of PAGES) {
        const page = await browser.newPage({ viewport: { height: 1000, width } });
        // クラッシュしたページは横溢れが0なので、溢れ検査だけだと OK になってしまう。
        // 実際に /monsters が白画面のまま OK と報告された。ページの死亡も検出する。
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(String(error).slice(0, 200)));
        page.on("console", (msg) => {
          if (msg.type() === "error") pageErrors.push(msg.text().slice(0, 200));
        });
        try {
          await page.goto(baseUrl + route, {
            timeout: 60_000,
            waitUntil: "networkidle",
          });
          await page.waitForTimeout(800);
          await page.screenshot({
            fullPage: true,
            path: path.join(OUT_DIR, `${vpName}-${pageName}.png`),
          });

          const crashed = await page.evaluate(() =>
            document.body.innerText.includes(
              "Application error: a client-side exception has occurred",
            ),
          );

          const report = await page.evaluate((ignore) => {
            const vw = document.documentElement.clientWidth;
            const offenders = [];
            for (const el of document.querySelectorAll("*")) {
              if (ignore.some((sel) => el.closest(sel))) continue;
              const r = el.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;
              if (r.right > vw + 2) {
                offenders.push({
                  className: String(el.className || "").slice(0, 90),
                  right: Math.round(r.right),
                  tag: el.tagName.toLowerCase(),
                  width: Math.round(r.width),
                });
              }
            }
            return {
              offenders: offenders.slice(0, 8),
              offenderCount: offenders.length,
              scrollWidth: document.documentElement.scrollWidth,
              vw,
            };
          }, IGNORE_SELECTORS);

          // 落とすのは「文書が実際に横スクロールする」場合だけ。
          // 祖先にクリップされている要素は意図的な省略と区別できないため、
          // 参考情報として出すだけにする（誤検知で信用を失わせない）。
          const label = `${vpName}(${width}) ${route}`;
          const scrolls = report.scrollWidth > report.vw + 2;
          if (crashed || pageErrors.length > 0 || scrolls) {
            problems.push({ label, report });
            const reasons = [];
            if (crashed) reasons.push("クラッシュ（error boundary 表示）");
            if (pageErrors.length > 0) reasons.push(`JSエラー${pageErrors.length}件`);
            if (scrolls) reasons.push(`横スクロール ${report.scrollWidth}/${report.vw}`);
            console.log(`NG ${label}  ${reasons.join(" / ")}`);
            for (const e of pageErrors.slice(0, 3)) console.log(`     ${e}`);
          } else {
            console.log(`OK ${label}`);
          }
          if (report.offenderCount > 0) {
            console.log(
              `   参考: 祖先にクリップされている要素 ${report.offenderCount} 件`,
            );
            for (const o of report.offenders) {
              console.log(`     <${o.tag}> w=${o.width} right=${o.right} ${o.className}`);
            }
          }
        } catch (error) {
          problems.push({ label: `${vpName}(${width}) ${route}`, report: null });
          console.log(`ERR ${vpName}(${width}) ${route}: ${String(error).slice(0, 160)}`);
        } finally {
          await page.close();
        }
      }
    }

    await browser.close();

    console.log(`\nスクリーンショット: ${OUT_DIR}/`);
    if (problems.length > 0) {
      console.log(`問題のあるページ: ${problems.length} 件`);
      for (const p of problems) console.log(`  - ${p.label}`);
      process.exitCode = 1;
    } else {
      console.log("全ページ・全幅で問題なし（クラッシュ / JSエラー / 横スクロール）");
    }
  } finally {
    for (const child of started) child.kill("SIGTERM");
  }
}

await main();
