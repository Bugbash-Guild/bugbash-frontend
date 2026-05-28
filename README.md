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

PRを開く前にlintをかけてください

```shell
npm run lint
```
