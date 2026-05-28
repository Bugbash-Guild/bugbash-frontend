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

## R2へアップロード

Cloudflare側で `bugbash-assets-prod` bucket と `assets.bugbashguild.com` のカスタムドメインを作ったあと、以下の環境変数を設定して実行します。

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export R2_BUCKET=bugbash-assets-prod

npm run assets:build
npm run assets:upload:r2
```

GitHub Actions から実行する場合は、Repository Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録して、`Upload Game Assets to R2` workflow を手動実行します。
GitHub Actions でアップロードする画像は、そのworkflowを実行するブランチに含まれている必要があります。ローカルだけに置いた画像を試す場合は、上のローカルコマンドを使ってください。

アップロード対象だけ確認したい場合:

```bash
npm run assets:upload:r2 -- --dry-run
```
