# bugbash-frontend

## Install

```bash
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8080' >> .env.local
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000)を開く

外部アセット置き場を使う場合は、バックエンドの `BUGBASH_ASSETS_BASE_URL` と同じURLをフロントエンドにも設定してください。
バックエンドは同じ置き場の `asset-manifest.json` に載っている画像だけURLを返します。

```bash
echo 'NEXT_PUBLIC_ASSETS_BASE_URL=https://assets.example.com' >> .env.local
```

## Game asset upload

ゲーム画像は `game-assets/source` に投入してWebP化し、`asset-manifest.json` と一緒にR2へアップロードします。

```bash
npm run assets:build
```

Cloudflare R2 へアップロードする場合:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export R2_BUCKET=bugbash-assets-prod

npm run assets:upload:r2
```

スキンのcard/OGP/widget派生生成を含め、buildからR2アップロードまで続けて実行する場合:

```bash
npm run assets:publish:r2
```

GitHub Actions の `Upload Game Assets to R2` workflow からも手動実行できます。
詳しい投入ルールは `game-assets/README.md` を見てください。

PRを開く前にlintをかけてください

```shell
npm run lint
```
