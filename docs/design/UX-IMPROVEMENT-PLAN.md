# UX改善計画（B-track）

不具合修正（GitHub issues #122–#128、全件クローズ済み: #132/#131）とは独立した、UX設計変更のロードマップ。
5視点の設計検討（IA / モバイル / ローディング&遷移 / フィードバック / ゲームUXベンチマーク）を
3観点（実装可能性=コード照合 / D-1設計原則整合 / 優先度）で相互検証して確定した。

前提となる構造的事実:

- 旧 `MainWrapper` は**ページごとに再マウント**されていた（ルートlayoutが素の `{children}` のみ）。
  二段ブランク遷移の根本原因。`(shell)` route group 化が全改善の土台。
- `heroId == githubId` は確立済みの契約（home が `/api/heroes/{githubId}/...` を使用）。
  「自分のプロフィール」導線はBE追加なしで実装可能。

## Wave 1 — 「画面が消えない・操作に必ず返事が来る」（BE変更ゼロ）✅ **完了**（PR #129 / #130 / #131）

| # | 内容 | 状態 |
|---|------|------|
| 1 | `(shell)`/`(authed)` route group + `AuthGate`。14ページの複製ガードを削除、シェルが遷移をまたいで生存 | ✅ #129 |
| 2 | グローバル `SWRConfig`（keepPreviousData）— タブ/フィルタ切替の空白点滅解消 | ✅ #129 |
| 3 | `RewardModalHost` をシェルへ — どの入口からでも報酬儀式が発生（/billing/return は抑止） | ✅ #129 |
| 4 | returnTo（`/login?returnTo=` + open-redirect検証 + OAuth往復は sessionStorage） | ✅ #129 |
| 5 | サイドバー再編 14→11 + HERO_STATUSメニュー: badges→NAVIGATION（名声）、shop 3→1（共有 `ShopTabs`）、mints/mypage→フッターメニュー、`~/@{username}` 復活（正典 home.html にあり実装脱落）。**summon は正典どおり2項目維持**（summon.html の「PRESTIGE ZONE — 課金導線なし」刻印に琥珀タブを持ち込まない） | ✅ #130 |
| 6 | `mobileFullWidth` 廃止 + <768px 全ページ統一（サイドバー非表示）+ ハンバーガー→`MobileNavDrawer`（navConfig/HERO_STATUS 再利用、フォーカストラップ、遷移時自動クローズ） | ✅ #130 |
| 7 | `InlineActionResult`（items の成功ブロックを汎用化）→ スキン購入/装備・鋳造・強化の操作直近に確定表示 | ✅ #131 |
| 8 | `BalanceShortfall`（**コイン/ルーン非対称**: コイン不足=「PRをマージして集めましょう」購入導線なし / ルーン不足=`/shop/runes` リンク）→ mints・forge へ適用 | ✅ #131 |
| 9 | 召喚結果モーダルに `[ 図鑑で確認 → ]` フッター（通常/限定とも） | ✅ #131 |
| 10 | 変異成功時に wallet / dex を即 `mutate`（shop の既存パターンを召喚/レベルアップ等へ展開。issue #125 対応） | ✅ #131 |

## Wave 2 — 「案内と初回体験」（大部分完了）

実施済み（PR #133 / #134）: 追跡状態バナー / FTUEチェックリスト（QUEST 0） / ConsoleEmptyState（leaderboard・shop・召喚履歴・home活動） / skinsの「まず相棒を」緑ストリップ / TermLoading（端末様式ローディング） / leaderboard自分ハイライト+ConsoleTopbar / forge相互リンク（⚒バッジ→/forge?skin=） / 虚偽アフォーダンス除去（click to equip・ACTIVE→TRACKING/OFFLINE） / 活動アイコンemojiフォールバック。

未実施（残）: SWR preload・localStorage永続（名声系のみ） / サーバ側auth先読み（リスク項目） / モーダルのフォーカストラップ/ESC統一 / itemsモバイルリフロー（ボトムシート）。

- 追跡状態バナー（App未導入=「ゲームの電源が切れている」をシェル常設。色は **blue/情報** — 琥珀は課金専用・goldはSSR専用のため禁止）
- `FirstQuestChecklist`（App導入→初PR→初召喚。既存フィールドのみで実装可）
- `ConsoleEmptyState`（※dex/items は空状態“置換”ではなく **CTAストリップ追加** — `???` ダッシュカード自体が収集目標表示として機能しているため）
- 端末様式スケルトン（シマー禁止・値の仮置き禁止・価格は `—`）
- SWR `preload`（課金系キーは対象外）/ localStorage 永続（**名声系キーのみ**）
- leaderboard の自分ハイライト（`entry.heroId === user.githubId`）
- forge 相互リンク（monsters の `⚒ St{n}` → `/forge?skin=`。クエリ初期化は ownedSkins ロード後1回）
- 虚偽アフォーダンス削除（「click to equip →」・無条件 ACTIVE ピル — 正典自身がプレースホルダと自認）
- サーバ側 auth 先読み（効果大だが cookie 転送・二重認証経路のリスクがあるため独立followup）

## Wave 3 — BE連携の深化（フィールドが来るまで表示しない）

実施済み: 通常召喚への `isNew` 延伸（BE #304 / FE #135 — 単発・10連の結果にNEWチップ）。

- `hasActivityToday` / `bestStreakDays` → ストリーク2状態表示 +「切れても失うものはありません」明文化
- `prsMergedToday` → home の「今日」パネル（パス加入者には青チップで pity 短縮併記可＝裁定済み）
- リーダーボード圏外の自分行 / 図鑑未発見枠の入手経路チップ（中立様式・開催状況表記禁止の条件付き）
- ウォレット有償/無償内訳ポップオーバー（**法務確認を先行依頼** — 消費地点での区別表示が必要なら Wave 2 へ昇格）
- logout エンドポイント → HERO_STATUS メニューへ / 召喚 RUN LOG 演出（≤1.6s・スキップ可・楽観禁止）

## Killリスト（明示的にやらない）

トーストライブラリ / トップバー打鍵アニメ / 61pxアイコンレール / ルーン残高の概数表示（前払式支払手段の透明性）/
ストリーク保険・喪失カウントダウン・ログインボーナス / 楽観的残高減算 / 限定召喚の動的サイドバー項目 /
**ボトムナビ（保留）**: tmux ステータスライン案は設計として優良だが、モバイル利用データが出るまでドロワーのみで運用。
`--bottom-nav-h` 変数と `[1]home [2]dex` の番号語彙のみ予約。

## 正典（docs/design/*.html）への影響

badges のグループ移動・shop 集約・mints/mypage 退避・モバイル仕様新設は「正典からの意図的乖離」。
本ドキュメントと `D1-IMPLEMENTATION-STATUS.md` への記録をもって乖離を管理し、モックHTML側の改訂は追って行う。

## 備考

- リポジトリ直下の `CLAUDE.md` は別プロジェクト（Vite/wouter/Jotai）の記述が混入した残骸。
  設計検討時の誤情報源になるため書き直しを推奨（`--sidebar-width`・640px 折りたたみ・`--bottom-nav-height: 81px` はすべてこのファイル由来で正典に存在しない）。
