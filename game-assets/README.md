# Game Assets

R2 にアップロードするゲーム画像の投入場所です。

## 置き方

生成済みの透過PNG/SVG/WebPを、R2上で使いたいパスと同じ階層に置きます。

```text
game-assets/source/
  monsters/token-mimic/base.png
  monsters/token-mimic/evo.png
  monsters/token-mimic/awakened.png
  monsters/token-mimic/awakened-final.png
  monsters/token-mimic/berserk.png
  monsters/token-mimic/berserk-final.png
  items/evolution-stone.png
  equipment/debug-blade.png
```

## WebP化とmanifest生成

```bash
npm run assets:build
```

出力先:

```text
dist/game-assets/
  asset-manifest.json
  monsters/token-mimic/base.webp
```

`dist/game-assets` はアップロード用の一時生成物なのでGitには入れません。

### スキンの派生画像

付録A準拠のスキン6面は、正本WebPに加えてbuild時に次の派生画像を自動生成します。正本PNGは変更しません。

| 用途   |     寸法 | R2キーの接頭辞          |
| ------ | -------: | ----------------------- |
| card   |  640x640 | `derived/skins/card/`   |
| OGP    | 1200x630 | `derived/skins/ogp/`    |
| widget |  256x256 | `derived/skins/widget/` |

各派生画像は透明背景を維持し、元の付録Aパスを接頭辞の後ろに保持します。6面の正本6件と派生18件はすべて同じ `asset-manifest.json` に入り、R2 uploaderの対象になります。

## モンスター画像の通常追加フロー

画像生成が終わっていて、既存と同じモンスターアセット追加だけを行う場合は、TDDや新規テスト追加は不要です。
時間を優先して、以下の最小フローで進めます。

```text
1. 最終画像をすべてユーザーに見せる
2. 承認された透過PNGを `game-assets/source/monsters/{slug}/` に置く
3. `npm run assets:build` を実行する
4. manifestに新規WebPが含まれることを確認する
5. frontend PRを作成する
6. 純粋なモンスターアセット追加だけは、画像承認済みであればmergeしてよい
7. merge後、GitHub Actions の `Upload Game Assets to R2` workflowを実行する
8. R2のmanifestと代表画像URLが200で返ることを確認する
```

新しいslugを追加した場合だけ、backend側のbase species登録も行います。
その場合もRED/GREENのTDDではなく、登録追加後に既存CIまたはdeploy workflowの成功を確認します。
バグ修正・ドキュメント・表示ロジック変更など、モンスターアセット追加以外のPRは勝手にmergeしません。

## R2へアップロード

Cloudflare側で `bugbash-assets-prod` bucket と `assets.bugbashguild.com` のカスタムドメインを作ったあと、以下の環境変数を設定して実行します。

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export R2_BUCKET=bugbash-assets-prod

npm run assets:build
npm run assets:upload:r2
```

buildからR2アップロードまで続けて実行する場合:

```bash
npm run assets:publish:r2
```

GitHub Actions から実行する場合は、Repository Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録して、`Upload Game Assets to R2` workflow を手動実行します。
GitHub Actions でアップロードする画像は、そのworkflowを実行するブランチに含まれている必要があります。ローカルだけに置いた画像を試す場合は、上のローカルコマンドを使ってください。

アップロード対象だけ確認したい場合:

```bash
npm run assets:upload:r2 -- --dry-run
```
