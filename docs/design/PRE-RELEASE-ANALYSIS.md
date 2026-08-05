# フロントエンド リリース前分析（2026-08-05）

> 総合分析 `bugbash-backend/docs/superpowers/specs/2026-08-05-pre-release-analysis.md` の子文書。
> ここにはフロントエンド固有の指摘のみを置く。サービス全体の判定・課金・法務・ロードマップは親文書を参照。
> 検証状態: `npm test` 279件全パス / `next lint` クリーン / `next build` 成功（26ルート）。対象コミット `372265c`（PR #160）。

先に言うと、このフロントエンドの**中心部は良い**。プロキシ設計（ヘッダ明示列挙・`authorization` 破棄のテスト付き・SSRF構造的不可）、SWRの読み書き分離、マスタ/ヒーロー別データの汚染防止（`fetchMasterJson` がdevで throw）、`earlyFetch` の初期表示短縮、そして「値を捏造しない」規律（価格・確率はBE由来のみ）は、いずれも設計判断の理由がコメントで残っており水準が高い。
**弱いのは縁**——ログアウト・エラーバウンダリ・env検証・メタデータ・admin認可・CI——で、以下は全部そこに集中している。

---

## 1. Day1のユーザーを止めるもの（体験インパクト順）

| # | 問題 | 根拠 | 影響 |
|---|---|---|---|
| 1 | **ログアウトが存在しない**（サイドバーにもHERO_STATUSメニューにもどこにも実装ゼロ。`grep logout` → コメント2件のみ） | `SideBar.tsx:128-168`、`useAuth.ts:43` | 共用PC・会社PCで詰む。レビューで最初に指摘される類。UX-IMPROVEMENT-PLANでWave 3送りになっているが、リリース必須に昇格すべき |
| 2 | **`NEXT_PUBLIC_GITHUB_APP_SLUG` 未設定でゲーム開始経路が全滅** — ダッシュボードのCTAが `href="#"`、`page.tsx:164` は未ガードで `github.com/apps//installations/new`（404）を生成。`.env.example` 不在・README未記載のため、**本番Vercelに正しい値が入っている保証がどこにも無い** | `page.tsx:53-56,164`、`FirstQuestChecklist.tsx:38-40` | App未導入=Webhook無し=コイン・モンスター発生ゼロ=課金動機ゼロ。**リリース前に本番値の目視確認必須** |
| 3 | **報酬モーダルがライブで発火しない。** `useRewardNotification` はマウント時1回のfetchのみ（ポーリング/SSE/SWRいずれも無し）で、ホストは遷移をまたいで生存するレイアウト内 → アプリを開いたままPRがマージされても**リロードまで何も出ない**。コアループ「マージ→報酬儀式」が本番で機能していない | `useRewardNotification.ts:12-29`、`(authed)/layout.tsx:15-18` | 最小修正はSWR化（`refreshInterval` or フォーカス時再検証）。実装S |
| 4 | **法定3ページが全行プレースホルダのまま、課金確認モーダルからリンクされている**（規約同意→KOMOJU遷移の直前に空規約を見せている）。さらに `legalPagePlaceholders.test.ts` が「プレースホルダのままであること」をassertしているため、**本文を入れる時はテストの反転が必要**（現状ガードが逆向き） | `legalPages.ts:19,38-98`、`legalPagePlaceholders.test.ts:13-21`、`shop/runes/page.tsx:255-260` | 親文書§4.4（弁護士レビューが律速）。プライバシーポリシーはページ自体が無い→新設 |
| 5 | **通常召喚の10連に確認モーダルが無い**（単発も10連も即発火）。有料の限定側には `LimitedPullConfirmModal` がある——**安い通貨ほど保護が薄い逆転** | `summon/page.tsx:216-221` | 誤クリックで3,000コイン消失。限定側の部品を流用するだけ |
| 6 | **公開プロフィール（トロフィールーム）にOG/メタデータが皆無**。アプリ全体で `metadata` は root layout の1つだけ（全ページtitle「BugBash」）。シェアされても素の「BugBash」としか出ず、v4「観客エンジン」の増幅装置が機能しない。加えて `bugbash.dev`（プロフィール画面表記）と `app.bugbashguild.com`（プロキシのハードコード）のドメイン混在、「ランキングへ戻る」リンクが未ログイン訪問者を認証壁に誘導 | `heroes/[heroId]/page.tsx:182-189`、`layout.tsx:15-18`、`_proxyCore.ts:21` | Server Component化 or `generateMetadata` でOG付与。共有導線の要 |
| 7 | **年齢確認の再申告が画面ごとに不一致**: `/shop/runes` はlocalStorage復元、`/pass` はコンポーネントstateのみで**毎回再申告** | `pass/page.tsx:76` vs `shop/runes/page.tsx:64` | 課金直前の摩擦。挙動統一 |
| 8 | **月次購入上限（¥5,000/20,000/50,000）が年齢確認直後にしか表示されない**（モーダルのコールバックで得た値をstate表示するだけで、再訪時はどこにも出ない） | `shop/runes/page.tsx:143-147,294` | 未成年上限制度の透明性の要。BEに公開値のAPIを足してウォレット/mypageに常設表示（D1-STATUSの「意図的見送り」項目の解除条件が揃う） |
| 9 | **退会成功後もログイン状態が残る**（インラインメッセージのみ。セッション破棄・リダイレクト無し） | `mypage/billing/page.tsx:133-150` | #1のログアウト実装とセットで解消 |
| 10 | **空インベントリが無言のマス目の壁**（空状態コピーも入手CTAも無し）。`ConsoleEmptyState` は17ページ中2ページでしか使われていない | `items/page.tsx:140-148` | 既存部品の適用のみ |

## 2. セキュリティ・堅牢性

| # | 問題 | 根拠 | 修正 |
|---|---|---|---|
| S1 | **`/admin/monsters`・`/admin/funnel` がログインのみで到達可**（role checkなし）。さらに `useMonsterCatalog` はAPI失敗時に**ハードコードの49種ロスターへフォールバック**するため、バックエンドが401でも未公開全種族が描画される | `(authed)/layout.tsx:13-20`、`AuthGate.tsx:27,37`、`useMonsterCatalog.ts:38-88,235` | admin route groupに認可ゲート（BEのadmin判定APIと対）＋管理画面ではローカルフォールバック無効化 |
| S2 | **エラーバウンダリ/カスタム404/`loading.tsx` がゼロ**。render throw = Nextの素の本番エラー画面。`apiError.ts:45` の `asArray` は白画面インシデント（#122/#151）対応の産物なのに、境界自体は未追加＝同類バグの再発余地 | `src/app` 全域 | `global-error.tsx`＋`error.tsx`＋`not-found.tsx` 追加（実装S） |
| S3 | **`next build --turbopack` は実験的扱いで、ブラウザ向けソースマップを常時生成**（=全ソース公開）とビルド出力自身が警告 | `package.json:14` | 通常ビルドに戻すか、ソースマップ出力を確認して遮断 |
| S4 | プロキシが `cache-control` を無検査で素通し（heroデータにBEが誤って `public` を付けたらCDNで他人に配られる）。3xxの `location` も素通し。ログインリダイレクト先が `app.bugbashguild.com` ハードコード | `_proxyCore.ts:21,32-33,39-40` | cache-controlはallow-list化、locationは相対のみ許可、ドメインはenv化 |
| S5 | CSPが無い（`next.config.ts` に `headers()` 無し）。`earlyFetch` がinline scriptなので、導入時はnonce設計が必要になる点だけ先に認識しておく | `layout.tsx:34`、`next.config.ts` | Phase 2以降で可 |

## 3. 品質基盤

| # | 問題 | 根拠 | 修正 |
|---|---|---|---|
| Q1 | **CIがテストを実行していない**（lint+buildのみ）。課金ロジック（`runeCheckout`/`returnPolling`/`subscriptionPass`）と法定ページガードを含む279件が未強制 | `.github/workflows/ci.yml:20-27` | ci.ymlに `npm test` を1行追加（最優先・実装XS） |
| Q2 | テストglobが `src/**/*.test.ts` で **`.tsx` が構造的に対象外** → コンポーネント/フックのrenderテスト0件。`check-visual.mjs`（モックBE+スクショ）が捕まえたい白画面・NaN%系はこのスイートでは原理的に捕まらない | `package.json:16` | まずQ1。次に `check-visual` をCIの smoke に昇格するのが費用対効果最良（renderテスト網羅より先） |
| Q3 | **召喚後のキャッシュ無効化 `mutate("monsters-compendium")` が死にキー**（購読者ゼロ。`useMonsters` は `/api/monsters/all`・`/api/monsters/owned`）。結果モーダルのCTA「図鑑で確認→」の遷移先で新規体が出ない可能性（現状はマウント時再検証が偶然カバー） | `summon/page.tsx:128,147`、`summon/limited/page.tsx:124` | 実キーに修正（XS） |
| Q4 | モーダル15個中Escape対応5個、フォーカストラップ0個（サブスク確認・解約・退会・年齢確認・課金チェックアウト含む）。`prefers-reduced-motion`・`:focus-visible` スタイルも未定義 | `globals.css:1-101` | UX-PLAN「未実施（残）」の通り。共通Modalプリミティブに寄せて一括対応 |
| Q5 | `/github-app/callback` はパラメータ欠落時に無言で `/` へ、エラー時もリトライ導線なし | `github-app/callback/page.tsx:16-19,65-73` | 活性化経路なので文言＋再試行を用意 |
| Q6 | 細部: チェックアウト冪等キーをURL受領時点でクリア（PSP画面放棄→再試行で二重注文）/ 購入ボタンの `finally` が遷移前に再活性化 / 退会APIだけ `_proxyPath` 規約を迂回 / `skin*` CLI群11ファイルが `src/` 同居（bundle混入は無いが型チェック対象） | `shop/runes/page.tsx:111,124-126`、`mypage/billing/page.tsx:133` | 順次 |

## 4. `game-assets` ローカル配信ルートは本番で404

`/game-assets/[...path]` は `process.cwd()/game-assets` を読むが、`.vercelignore` が `game-assets/source/**` を除外しているため**Vercel上では全404**。`NEXT_PUBLIC_ASSETS_BASE_URL`（R2）未設定時のフォールバック先がここなので、「R2設定が欠けたら絵が全滅」への防波堤が実際には存在しない。R2前提を明文化し、ルートに「本番ではR2必須」のガード/ログを入れる。
（`route.ts:6-7`、`.vercelignore:3-4`、`useMonsterCatalog.ts:123`、`skinCatalog.ts:96-97`）

## 5. CLAUDE.md の全面置換（改めて）

リポジトリ直下の `CLAUDE.md`（52KB）は**丸ごと別プロジェクトの文書**（Vite/wouter/Jotai/Radix/PWA、存在しないルート・存在しない参照4本）。UX-IMPROVEMENT-PLAN 備考が2026-07に「書き直し推奨」と明記済み・未対応。AIエージェント/新規参加者の第一情報源として**現状は有害**。Next.js 15 App Router / SWR / `@/*` / `node --test` / プロキシ・auth設計（本文書§2の良い部分）を骨子に書き直すこと。backend側 `CLAUDE.md` も同様に要改訂（JPA記述）。

## 6. リリース前の最小セット（親文書ロードマップとの対応）

- **Phase 1 必須**: 上記 1-1（ログアウト）/ 1-2（slug本番値確認＋`.env.example`）/ 1-3（報酬SWR化）/ 1-4（法定ページ差し替え＋テスト反転）/ S1（admin認可）/ S2（エラーバウンダリ）/ S3（ビルド方式）/ Q1（CIにテスト）/ Q3（死にキー）
- **Phase 2**: 1-6（OG/メタデータ＝観客エンジン第0段）/ 1-5, 1-7〜10 / Q4（モーダル統一）/ §4（アセットガード）/ §5（CLAUDE.md）
- **やらなくていい**: renderテストの網羅（Q2の代替で足りる）/ 導線の再設計（#129〜#160で十分）/ トースト等のKillリスト項目（UX-PLANの判断を維持）
