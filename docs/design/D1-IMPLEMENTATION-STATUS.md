# 課金・経済圏デザイン (D-1) 実装状況

このドキュメントは、`docs/design/*.html`（Direction A「Console RPG」を課金圏へ拡張したデザインモック）に対する
フロントエンド実装の現状を記録します。設計と実装の対応・意図的に見送った箇所とその理由をまとめています。

- **デザインの正典**: 同ディレクトリの各 `*.html`（`index.html` が入口）／共通スタイルは `_console-billing.css`
- **最終更新の対象 PR**: frontend #119 / #120、backend #302
- 数値・確率・価格などは **バックエンド由来**を原則とし、フロントに定数を持ちません（未提供の値は表示しない＝捏造しない方針）。

---

## 共通基盤（デザインシステム）

| 項目 | 実装 | 内容 |
|------|------|------|
| デザイントークン | `src/app/globals.css` | 名声(緑) と分離した課金圏トークン一式：`rune`(琥珀) / `coin`(金) / `pass`(青) / `grade` G1–G5 / `rarity` / `blue` を Tailwind v4 `@theme` に定義 |
| サイドバー | `src/components/SideBar.tsx` | `NAVIGATION` / `BILLING` の2グループ。課金項目のグリフは琥珀（is-paid）。より具体的な href を優先する active 判定 |
| 共通トップバー | `src/components/ConsoleTopbar.tsx` | ターミナル風プロンプト + コイン/ルーン残高 + ルーン購入(+) を sticky 表示。認証時のみ残高取得 |

トップバー/ウォレットは全認証ページ（home / monsters / items / summon / summon-limited / shop / shop/skins / shop/runes / pass / mypage-billing / badges / forge / mints / billing-return）で `ConsoleTopbar` に統一済み。

---

## 画面別の実装状況

| デザイン | ルート | 状況 | 補足 |
|----------|--------|------|------|
| `home.html` | `/` (`src/app/page.tsx`) | ✅ 実装 | 勇者ホロカード + ステータス盤 + 60セグXPバー + 2×2統計 + アクティビティ。捏造ダミー(ATK/DEF/LUCK・SSR率)は実データ(ギルドコイン/PR/ストリーク/図鑑進捗)へ置換 |
| `monsters.html` | `/monsters` | ✅ 実装 | レア別グルーピング + `N/M discovered` 見出し、絞り込みチップ、FAVORITEバナー、活動由来バッジ(進化★/覚醒/暴走)、コスメ鍛造グレード `⚒ St{n}`(装備スキンのマスタリー)。レベルUP/進化/路線変更/パートナーは温存 |
| `items.html` | `/items` | ✅ 実装 | 9列ストレージ/ホットバー、ルーン建て(SOUL_PACK)の 💎 区別、SELECTEDパネル + USE。進化アイテムはモンスター画面へ誘導 |
| `summon.html` | `/summon` | ✅ 実装 | ゲート/単発・10連/PityMeter/確率開示/履歴/結果モーダル + H1・COIN/PRESTIGEチップ・コイン不足案内・LegalFooter。⚠ RUN LOG 演出は未実装（下記） |
| `summon-limited.html` | `/summon/limited` | ✅ 実装 | 限定バナー/確定演出/短縮Pity/復刻表示/残高不足導線。⚠ RUN LOG 演出は未実装 |
| `profile.html` | `/heroes/[heroId]` | ✅ 実装 | 公開トロフィールーム。アイデンティティ(Lv含む)/ステータス行/**Apex殿堂(St10スキン)**/**ショーケース**/バッジ壁/記念プレート。⚠ 粒子/チルト等の演出は未実装 |
| `shop-skins.html` + `skin-detail.html` | `/shop/skins` | ✅ 実装 | ライン別グルーピング/STD・DX・LG/変身前後/demand-first/復刻カレンダー/詳細モーダル(購入確認・装備)。価格は💎表記。⚠ FEATURED ヒーローバナーは未実装（下記） |
| `mint-plate.html` | `/mints` | ✅ 実装 | 実績コンテキスト/プレートプレビュー/リカラー/価格・残高/鋳造/権利リスト |
| `forge.html` | `/forge` | ✅ 実装(v4) | デザインHTMLは旧グレード制(「v4 PARK」注記)。実装は正典のスキンマスタリー St1–10（対象一覧/マスタリー盤/コスト表） |
| `badges.html` | `/badges` | ✅ 実装 | 実績ゾーン + 工房ゾーン、公開設定トグル、グレード強化(確認モーダル) |
| `mypage-billing.html` | `/mypage/billing` | ✅ 実装 | 残高(有償/無償)/サブスク管理/取引履歴/年齢再申告/退会(失効同意)。H1をデザインへ整合。⚠ 購入上限額行は未実装（下記） |
| `d1-shop-runes.html` | `/shop/runes` | ✅ 実装 | SKUグリッド/ボーナス・単価/購入確認/年齢確認/反映待ち処理。⚠ 割引メーター・固定上限額表示は未実装（下記） |
| `d1-billing-return.html` | `/billing/return` | ✅ 実装 | 付与ポーリング/3終端状態/再確認/付与を断言しない。⚠ 見出しは中立表現を維持（下記） |
| `d1-pass.html` | `/pass` | ✅ 実装 | 特典/価格/加入・解約モーダル/状態表示 |
| `legal-tokushoho.html` | `/legal/tokushoho` | ✅ 実装 | `LegalPageShell` によるman page様式。タイトル「表記」→「表示」に整合。本文は弁護士レビュー前プレースホルダ |
| `legal-prepaid.html` | `/legal/prepaid` | ✅ 実装 | 同上（前払式支払手段） |
| `d1-components.html` / `d1-style-guide.html` / `skin-lines.html` / `index.html` | — | 参考資料 | アプリ画面ではなくデザインドキュメント |

---

## バックエンド連携で実装した公開プロフィール

`profile.html`（トロフィールーム）のうち、統計・ショーケース・Apex殿堂は公開エンドポイントが必要でした。
backend #302 で以下を追加し、フロントで配線済みです。

### `GET /api/heroes/{heroId}/profile`（認証不要 / permitAll）

- 非公開（`isProfilePublic=false`）・退会済み・未存在の Hero は `404` → フロントは該当セクションを非表示にし、公開のバッジ壁・記念プレートのみ表示。
- レスポンス（要約）:
  - 名声ステータス: `level` / `totalExperience` / `currentLevelExperience` / `experienceForNextLevel` / `experienceToNextLevel` / `progressRatio` / `streakDays` / `totalPrsMerged`
  - `showcase[]`: 連れ歩き優先→レベル降順の所有モンスター（最大6体）。装備スキンの `equippedSkinLineName` / `equippedSkinTier` / `masteryLevel` を同梱
  - `apex[]`: スキンマスタリーが最終段階（St10）に到達したスキン

その他の公開エンドポイント（既存）: `GET /api/heroes/{id}/badges`（バッジ壁）、`GET /api/heroes/{id}/commemorative-mints`（記念プレート）。

> `monsters` 画面のコスメ鍛造グレードは、装備スキンのマスタリーを `GET /api/skins/owned`（`masteryLevel`）から
> フロント側で結合して表示しています（バックエンド追加は不要）。

---

## 意図的に見送った項目（TODO）

正典データが無い／別種の対応が適切なため、現時点では未実装です。捏造した値は表示しません。

| 項目 | 対象画面 | 理由・必要になるもの |
|------|----------|----------------------|
| RUN LOG（ビルド実行風の召喚ログ演出） | summon / summon-limited | モーション演出。機能ではなく演出のため別対応 |
| 粒子(=PR数)・ホバーチルト・CRTスキャンライン等の演出 | profile ほか | 同上（モーション系） |
| FEATURED ヒーローライン バナー | shop/skins | スキンに `featured` フラグが無い。BE に featured フラグ追加が前提 |
| 割引メーター / 固定の購入上限額(¥50,000等)・今月の利用額 | shop/runes, mypage/billing | 正典の上限・利用額の公開値が無い。BE の公開が前提（恣意的な固定値は出さない） |
| 「決済を受け付けました」等の楽観的見出し | billing/return | 失敗/保留状態で不正確になるため、状態に応じた中立表現を維持 |
| 法定ページの節構成（SELLER/PRICE… 等）と具体値 | legal/* | 弁護士レビュー前のプレースホルダのため据え置き |

これらは、対応する BE フィールド（skin `featured`、購入上限の公開値 等）が用意され次第、フロント配線で実装可能です。
