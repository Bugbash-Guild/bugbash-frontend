# 開発ガイドライン

このドキュメントは、包括的なガイドラインとベストプラクティスを詳細に記述しています。プロジェクトの開発環境、コマンド、コードスタイル、設計思想、アーキテクチャパターン、テスト戦略について網羅的に説明し、効率的な開発とコード品質の維持を目的としています。

---

## 目次

1. [開発環境とツール](#開発環境とツール)
2. [コマンド一覧](#コマンド一覧)
3. [コードスタイルとコーディング規約](#コードスタイルとコーディング規約)
4. [プロジェクト構造](#プロジェクト構造)
5. [設計思想とアーキテクチャ](#設計思想とアーキテクチャ)
6. [データフェッチングと状態管理](#データフェッチングと状態管理)
7. [ルーティング戦略](#ルーティング戦略)
8. [UIコンポーネント設計](#uiコンポーネント設計)
9. [テスト戦略](#テスト戦略)
10. [ビルドとデプロイ](#ビルドとデプロイ)
11. [パフォーマンス最適化](#パフォーマンス最適化)
12. [注意事項とベストプラクティス](#注意事項とベストプラクティス)

---

## 開発環境とツール

### Node.js環境

- **Node.js**: 22.12.0（Volta管理）
- **パッケージマネージャー**: npm
- Voltaによるバージョン固定により、チーム全体で統一された環境を保証

### 主要フレームワークとライブラリ

#### コアフレームワーク

- **React**: ^18.3.1（React 18の新機能を活用）
- **TypeScript**: ~5.9.3（厳格な型チェック有効）
- **Vite**: ^6.4.1（高速なビルドツール）
- **SWC**: React Fast Refresh用（@vitejs/plugin-react-swc）

#### UIフレームワーク

- **TailwindCSS**: ^4.1.11（ユーティリティファーストCSS）
- **Radix UI**: 各種アクセシビリティ対応UIプリミティブ
    - Dialog、Dropdown、Popover、Tooltip、Tabs、Checkbox、Select等
- **Framer Motion**: ^12.23.24（アニメーションライブラリ）

#### 状態管理とデータフェッチング

- **Jotai**: ^2.15.0（アトミックな状態管理）
- **openapi-fetch**: ^0.14.1（型安全なAPIクライアント）
- カスタムフック: `usePromise`（SWRパターン）、`useMutation`

#### ルーティング

- **wouter**: ^3.7.1（軽量なルーティングライブラリ）
- 注意: `wouter`の`Link`コンポーネントは直接使用禁止（`src/components/Link`を使用）

#### フォーム管理

- **react-hook-form**: ^7.65.0（高性能フォーム管理）
- **valibot**: ^1.1.0（スキーマバリデーション）
- **@hookform/resolvers**: ^5.2.2（バリデータとの統合）

#### その他の主要ライブラリ

- **@dnd-kit**: ドラッグ&ドロップ機能
- **@monaco-editor/react**: コードエディタ
- **@xyflow/react**: フローチャート/ワークフロー図
- **recharts**: チャート描画
- **fuse.js**: ファジー検索
- **es-toolkit**: モダンなユーティリティライブラリ

### 開発ツール

#### リンター・フォーマッター

- **ESLint**: ^9.37.0（最新のFlat Config形式）
    - typescript-eslint（strict設定）
    - eslint-plugin-react-hooks
    - eslint-plugin-jsx-a11y（アクセシビリティ）
    - eslint-plugin-simple-import-sort（インポート自動整理）
    - eslint-plugin-unused-imports（未使用import削除）
- **Prettier**: ^3.6.2
    - prettier-plugin-tailwindcss（Tailwindクラス自動整理）

#### テストツール

- **Vitest**: ^3.2.4（ユニットテスト）
- **Playwright**: ^1.56.1（E2Eテスト）
- **@testing-library/react**: ^16.3.0（React Testing Library）
- **jsdom**: ^27.0.1（DOM環境）

#### Git フック

- **husky**: ^9.1.7（Git hooks管理）
- **lint-staged**: ^16.2.4（ステージされたファイルのみリント）

#### その他

- **Storybook**: ^9.1.2（コンポーネントカタログ）
- **openapi-typescript**: ^7.9.1（OpenAPI仕様からTypeScript型生成）
- **@stoplight/prism-cli**: ^5.14.2（APIモックサーバー）

---
### Reactコンポーネント設計

#### 基本原則

1. **関数コンポーネント必須**: クラスコンポーネントは使用しない
2. **React Hooksの活用**: 状態管理とライフサイクルはフックで実装
3. **JSX in TSX**: `.tsx`ファイルでJSXを記述

#### コンポーネント構造

```typescript
// 1. インポート（自動整理される）
import { type FC, useState } from 'react';

import { apiClient } from '~lib/apiClient';
import { Button } from '~components/Button';

// 2. 型定義
type Props = {
  title: string;
  onSubmit: () => void;
};

// 3. コンポーネント定義
export const MyComponent: FC<Props> = ({ title, onSubmit }) => {
  const [state, setState] = useState('');

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onSubmit}>Submit</Button>
    </div>
  );
};
```

#### 命名規則

- **コンポーネント**: PascalCase（例: `UserProfile`, `ChatMessage`）
- **関数・変数**: camelCase（例: `handleClick`, `userData`）
- **定数**: UPPER_SNAKE_CASE（例: `API_BASE_URL`）
- **型・インターフェース**: PascalCase（例: `UserData`, `ApiResponse`）
- **カスタムフック**: `use`プレフィックス（例: `usePromise`, `useMutation`）

### パスエイリアス

`tsconfig.json`と`vite.config.ts`で以下のエイリアスを定義：

```typescript
~assets/*  → ./src/assets/*
~components/* → ./src/components/*
~constants/* → ./src/constants/*
~lib/*     → ./src/lib/*
~routes/*  → ./src/routes/*
~styles/*  → ./src/styles/*
~types/*   → ./src/types/*
```

### 非同期処理

- **async/awaitの優先**: Promiseチェーンより`async/await`を使用
- **エラーハンドリング**: try-catchで適切にエラーをキャッチ

```typescript
// Good
const fetchData = async () => {
  try {
    const result = await apiClient.GET('/api/users');
    return result.data;
  } catch (error) {
    console.error('Failed to fetch', error);
    throw error;
  }
};

// Avoid
const fetchData = () => {
  return apiClient
    .GET('/api/users')
    .then((result) => result.data)
    .catch((error) => console.error(error));
};
```

### Git Hooks（Husky + lint-staged）

コミット前に自動実行：

```bash
# .husky/pre-commit
npx lint-staged
```

ステージされたファイルに対して：

- ESLint自動修正（`--fix`）
- Prettier自動フォーマット
- 最大警告数0（警告もエラー扱い）

---

## プロジェクト構造

### ディレクトリ構造

```
./src/
├── assets/                 # 静的アセット（SVGアイコン80+ファイル）
│   └── *.svg              # カラーはcurrentColorに変換され、テーマ対応
│
├── atom.ts                # グローバル状態（Jotai atoms）
│                          # - isSidebarOpenAtom（サイドバー開閉）
│                          # - themeAtom（テーマ設定: light/dark/system）
│                          # - unpaidAlertHeightAtom（未払いアラート高さ）
│
├── components/            # 再利用可能なUIコンポーネント（43個のコンポーネント）
│   ├── AppLayout/         # アプリ全体のレイアウト
│   │   ├── components/    # サイドバー、ヘッダーなど
│   │   └── index.tsx
│   ├── Auth/              # 認証UI（ログイン、サインアップ）
│   ├── Dialog/            # ダイアログ・モーダル（Radix UI Dialog）
│   ├── Markdown/          # Markdown描画エンジン
│   │   └── README.md      # Markdown処理の詳細ドキュメント
│   ├── Loading/           # ローディングスピナー
│   ├── Toast/             # トースト通知（react-toastify）
│   ├── Tooltip/           # ツールチップ（Radix UI）
│   ├── Task/              # タスク関連コンポーネント
│   ├── RichPromptField/   # リッチテキスト入力フィールド
│   ├── ModelDropdownMenu/ # AIモデル選択ドロップダウン
│   └── ...                # Input、Button、CheckboxGroup等
│
├── constants/             # 定数定義
│   ├── index.ts           # アプリケーション全体の定数
│   └── ...
│
├── lib/                   # 汎用ライブラリ・ユーティリティ
│   ├── apiClient/         # OpenAPI型安全APIクライアント
│   │   ├── index.ts       # apiClientインスタンス（openapi-fetch）
│   │   ├── types/
│   │   │   └── schema.d.ts # 自動生成されたAPI型定義
│   │   ├── middlewares/   # ミドルウェア
│   │   │   ├── authMiddleware.ts # 認証トークン付与
│   │   │   └── redirectIfUnAuthorizedMiddleware.ts # 401時リダイレクト
│   │   └── lib/
│   │       ├── neoFetch.ts # カスタムfetch実装
│   │       └── useCustomUnAuthorizedInterceptor.ts # 401ハンドラカスタマイズ
│   │
│   ├── hooks/             # カスタムReact Hooks
│   │   ├── usePromise.ts  # SWRパターンのデータフェッチング
│   │   ├── useMutation.ts # データ変更操作
│   │   ├── useQueryParam.ts # URLパラメータ管理
│   │   ├── useDialogUtil.ts # ダイアログ制御
│   │   ├── useServiceWorker.ts # Service Worker管理
│   │   └── ...            # その他10+カスタムフック
│   │
│   ├── store/             # LocalStorage抽象化レイヤー
│   │   └── constants.ts   # ストレージキー定数
│   │
│   ├── api/               # API呼び出しヘルパー
│   ├── utils/             # ユーティリティ関数
│   ├── lazyImport.ts      # 遅延ローディングヘルパー
│   ├── safeEnv.ts         # 環境変数の型安全アクセス
│   ├── matchLocationPath/ # ルーティングマッチング
│   ├── uogashi-client/    # Uogashiクライアント（生成コード）
│   ├── agepoyo-client/    # Agepoyoクライアント（生成コード）
│   └── test/              # テスト用ユーティリティ
│
├── routes/                # ページコンポーネント（18個のルートディレクトリ）
│   ├── chat/              # AIチャット機能
│   │   └── _top/          # チャットトップページ
│   ├── tasks/             # タスク管理
│   │   └── [id]/          # 動的ルート: /tasks/:id
│   ├── workflows/         # ワークフロー機能
│   │   ├── [id]/          # ワークフロー詳細
│   │   └── README.md      # ワークフロー機能説明
│   ├── agent/             # AIエージェント
│   ├── agent-app/         # エージェントアプリケーション
│   │   └── [id]/
│   ├── library/           # ライブラリ（テンプレート集）
│   │   ├── [id]/
│   │   └── tags/[id]/
│   ├── favorites/         # お気に入り
│   ├── settings/          # 設定画面
│   │   ├── usage/         # 使用量表示
│   │   ├── subscription/  # サブスクリプション管理
│   │   ├── theme/         # テーマ設定
│   │   └── ...
│   ├── admin/             # 管理者画面（遅延ロード）
│   │   ├── tasks/
│   │   ├── users/
│   │   ├── payments/
│   │   └── ...
│   ├── organization/      # 組織設定
│   │   ├── libraries/
│   │   └── pinned-apps/
│   ├── auth/              # 認証ページ
│   ├── login/
│   ├── signup/
│   ├── authorize/         # パスワードリセット等
│   ├── 404/               # 404エラーページ
│   ├── _offline/          # オフラインページ
│   ├── stay-tuned/        # Coming Soonページ
│   └── tutorial/          # チュートリアル
│
├── routes.ts              # ルート定義（ROUTES、REDIRECTSオブジェクト）
├── router.tsx             # ルーター設定（wouter使用）
├── test-routes.tsx        # テスト用ルート
│
├── styles/                # グローバルCSS
│   └── global.css         # Tailwind directives + カスタムスタイル
│
├── types/                 # TypeScript型定義
│   ├── PromiseStateType.ts # usePromise用の状態型
│   └── ...
│
├── main.tsx               # アプリケーションエントリポイント
│                          # - React.StrictMode
│                          # - ThemeProvider
│                          # - HelmetProvider
│                          # - ToastContainer
│                          # - ServiceWorker登録
│
└── vite-env.d.ts          # Vite環境変数型定義
```

### ルート設計パターン

#### 静的ルート

```typescript
'/settings': SettingsPage
'/library': LibraryTopPage
```

#### 動的ルート（パラメータ付き）

```typescript
'/tasks/:id': TaskDetailPage
'/workflows/:id': WorkflowPage
'/library/:id': LibraryDetailPage
```

#### リダイレクト

```typescript
'/authorize' → '/auth'
'/tasks' → '/tasks/new'
```

### コンポーネントの構成パターン

#### 通常のコンポーネント（直接エクスポート）

```typescript
// src/routes/chat/_top/index.tsx
export const ChatPage = () => { ... }
```

#### 遅延ロードコンポーネント（`lazyImport`使用）

```typescript
// src/routes.ts
const { AdminPage } = lazyImport(
  () => import('./routes/admin/_top'),
  'AdminPage'
);
```

遅延ロードは以下の場合に使用：

- 管理者画面など使用頻度が低いページ
- バンドルサイズが大きい機能

---


## 設計思想とアーキテクチャ

### 認可・認証戦略

#### 基本方針

**各ページでログイン状態の確認は逐一行わない**

理由：

1. ログインが必要なAPIへの未認証アクセスは、サーバーから`401 Unauthorized`が返却される
2. `apiClient`は401レスポンスを自動的にインターセプトし、`/auth`ページにリダイレクト
3. 未認証状態でページが表示されても、API操作ができないためセキュリティリスクは低い

#### 実装詳細

```typescript
// src/lib/apiClient/index.ts
apiClient.use(authMiddleware);
apiClient.use(redirectIfUnAuthorizedMiddleware);
```

ミドルウェアチェーン：

1. **authMiddleware**: リクエストに認証トークンを自動付与
2. **redirectIfUnAuthorizedMiddleware**: 401レスポンスを検知し`/auth`へリダイレクト

#### 例外ケース

以下の場合は`useCustomUnAuthorizedInterceptor`を使用して401ハンドリングをカスタマイズ：

1. **ログインページなど**: ユーザーがログアウト状態である可能性が高い
2. **ログイン状態で挙動が変わるページ**: 未認証時に別UIを表示
3. **公開ページ**: ログイン不要でアクセス可能

```typescript
// 例: ログインページでの使用
useCustomUnAuthorizedInterceptor(() => {
  // 401時にリダイレクトせず、ログインフォームを表示
  console.log('Not authenticated');
});
```

詳細: `docs/authorization.md`

---

### データフェッチング戦略

#### SWR（Stale-While-Revalidate）パターン

**全てのUIデータ取得は基本的にキャッシュする**

メリット：

- ローディング画面を最小限に抑制
- Layout Shift（レイアウトのずれ）を防止
- ページ遷移が瞬時
- オフライン時でもキャッシュからデータ表示

#### usePromise - データ取得用フック

```typescript
// 基本的な使用法
const userState = usePromise(() => apiClient.GET('/api/users/me'));

// SWRキャッシュ有効
const userState = usePromise(
  () => apiClient.GET('/api/users/me'),
  {
    swr: {
      key: 'currentUser',
      localStorage: true  // ページリロード後もキャッシュ保持
    }
  }
);

// 状態による分岐
if (userState.status === 'pending') return <Loading />;
if (userState.status === 'rejected') return <Error error={userState.error} />;
return <UserProfile user={userState.resource} />;
```

#### PromiseState型

```typescript
type PromiseState<T> =
  | { status: 'pending' }
  | { status: 'resolved'; resource: T }
  | { status: 'rejected'; error: unknown };
```

#### キャッシュ管理API

```typescript
// 全てのusePromiseを再検証（データ再取得）
mutateAllPromise();

// 全キャッシュを削除（データ再取得はしない）
clearPromiseSoftCache();

// 型ガード関数
if (isPromiseResolved(userState)) {
  // userState.resourceがT型として安全に使用可能
  console.log(userState.resource);
}
```

#### useMutation - データ変更用フック

POST/PUT/DELETEなどの変更操作に使用：

```typescript
const { state, call } = useMutation((userId: string, data: UserData) =>
  apiClient.PUT(`/api/users/${userId}`, { body: data })
);

// 実行
await call('user123', { name: 'New Name' });

// 完了後、関連データを再取得
mutateAllPromise();
```

#### キャッシュ戦略の例外

以下の場合はキャッシュを使用しない：

- リクエストごとに最新データが必須
- 古いデータ表示が許容されない（決済情報など）

```typescript
usePromise(() => fetchPaymentInfo(), { cache: 'noCache' });
```

詳細: `docs/data-fetching.md`

---

### ルーティング戦略

#### ページレベルでのバンドル分割は避ける

**原則: コンポーネント単位でバンドル分割**

理由：

- ページ分割: 初期ロード軽量 / ページ遷移時に読み込み発生
- コンポーネント分割: 初期ロードと遷移速度のバランス最適

#### 実装方針

```typescript
// ❌ 避ける: ページ全体を遅延ロード
const ChatPage = lazy(() => import('./routes/chat/_top'));

// ✅ 推奨: 重たいコンポーネントのみ遅延ロード
const HeavyEditor = lazy(() => import('./components/HeavyEditor'));

export const ChatPage = () => {
  return (
    <div>
      <Header />  {/* 即座に表示 */}
      <Suspense fallback={<Loading />}>
        <HeavyEditor />  {/* 遅延ロード */}
      </Suspense>
    </div>
  );
};
```

#### 遅延ロードの対象

1. **Monaco Editor**: コードエディタ（大容量）
2. **Mermaid**: ダイアグラム描画ライブラリ
3. **Recharts**: チャートライブラリ
4. **管理者画面**: 使用頻度が低い

#### lazyImport ヘルパー

名前付きエクスポートを遅延ロード：

```typescript
// src/lib/lazyImport.ts
export function lazyImport<
  U extends string,
  T extends { [P in U]: ComponentType },
>(factory: () => Promise<T>, name: U): T {
  return Object.create({
    [name]: lazy(() => factory().then((module) => ({ default: module[name] }))),
  });
}

// 使用例
const { AdminPage } = lazyImport(
  () => import('./routes/admin/_top'),
  'AdminPage'
);
```

詳細: `docs/routing.md`

---

### Service Worker（PWA）戦略

#### VitePWAによるリソースキャッシュ

目的：

- **オフライン動作**: ネットワーク切断時でもアプリ使用可能
- **高速化**: リソースをローカルキャッシュから即座に提供
- **バージョン管理**: 新バージョンリリース時の自動更新

#### 設定（vite.config.ts）

```typescript
VitePWA({
  registerType: 'prompt', // 更新時にユーザーに確認
  filename: 'sw-rev2.js',
  workbox: {
    maximumFileSizeToCacheInBytes: 5000000, // 5MB
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
});
```

#### 重要な注意事項

**デバッグ時は必ずService Workerをアンレジスター**

理由：

- `npm run preview`でビルド版を確認後、SWが登録される
- 古いSWがキャッシュされると、`npm run dev`が正常動作しない
- **スーパーリロードではアンレジスター不可**

手順：

1. Chrome DevTools → Application → Service Workers
2. 登録されているSWの「Unregister」をクリック

#### パッチ適用

Workboxのキャッシュ更新を並列化するパッチを適用済み：

- デフォルト: 同期的に1つずつ更新（遅い）
- パッチ後: 並列更新（高速）
- 参考: PR #628

詳細: `docs/service-worker.md`

---

## データフェッチングと状態管理

### Jotaiによるグローバル状態管理

#### atom定義（src/atom.ts）

```typescript
import { atom } from 'jotai';
import { store } from './lib/store';

// サイドバー開閉状態
export const isSidebarOpenAtom = atom(store.get('isSidebarOpen') ?? false);

// 未払いアラートの高さ
export const unpaidAlertHeightAtom = atom<number | null>(null);

// テーマ設定
export type ThemeType = 'light' | 'dark' | 'system';
export const themeAtom = atom<ThemeType>(getInitialTheme());
```

#### atom使用パターン

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { isSidebarOpenAtom } from '~/atom';

// 読み書き両方
const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);

// 読み取り専用
const isOpen = useAtomValue(isSidebarOpenAtom);

// 書き込み専用
const setIsOpen = useSetAtom(isSidebarOpenAtom);
```

### LocalStorage抽象化（store）

型安全なLocalStorageアクセス：

```typescript
import { store } from '~lib/store';

// 保存
store.set('theme', 'dark');

// 取得
const theme = store.get('theme'); // string | undefined

// 削除
store.remove('theme');
```

### openapi-fetchによる型安全API

#### スキーマ生成

```bash
npm run schema
# curl localhost:8080/docs/api.json → api.json
# openapi-typescript api.json → src/lib/apiClient/types/schema.d.ts
```

#### API呼び出し

```typescript
import { apiClient } from '~lib/apiClient';

// GET
const { data, error } = await apiClient.GET('/api/users/{id}', {
  params: { path: { id: '123' } },
});

// POST
const { data, error } = await apiClient.POST('/api/users', {
  body: { name: 'John', email: 'john@example.com' },
});

// 型推論が効く
if (data) {
  console.log(data.name); // 型安全
}
```

---

## UIコンポーネント設計


### Radix 

#### 使用しているRadix UIコンポーネント

- **Dialog**: モーダルダイアログ
- **Dropdown Menu**: ドロップダウンメニュー
- **Popover**: ポップオーバー
- **Tooltip**: ツールチップ
- **Tabs**: タブ切り替え
- **Checkbox**: チェックボックス
- **Radio Group**: ラジオボタン
- **Select**: セレクトボックス
- **Switch**: トグルスイッチ
- **Accordion**: アコーディオン
- **Collapsible**: 折りたたみ
- **Progress**: プログレスバー
- **Context Menu**: 右クリックメニュー

#### ラッピングパターン

プロジェクト独自のスタイルでRadix UIをラップ：

```typescript
// src/components/Dialog/index.tsx
import * as RadixDialog from '@radix-ui/react-dialog';

export const Dialog = ({ children, ... }: Props) => {
  return (
    <RadixDialog.Root>
      <RadixDialog.Overlay className="..." />
      <RadixDialog.Content className="...">
        {children}
      </RadixDialog.Content>
    </RadixDialog.Root>
  );
};
```

### Framer Motionのアニメーション

リッチなアニメーションに使用：

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

---

## テスト戦略

### テストファイルの命名規則

- **ユニットテスト**: `*.test.ts` または `*.test.tsx`
- **E2Eテスト**: `*.spec.ts` または `*.spec.tsx`

### ユニットテスト（Vitest + React Testing Library）

#### 配置

汎用関数や複雑なロジックに対して、**同じディレクトリ**にテストファイルを配置：

```
src/lib/hooks/
├── useQueryParam.ts
└── useQueryParam.test.tsx  ← 同じ場所
```
### 初期ロード最適化

1. **コード分割**: 重たいライブラリを別チャンクに分離
2. **フォントプリロード**: Material Symbols Outlined
3. **Service Worker**: 静的リソースのキャッシュ
4. **SWR**: APIレスポンスのキャッシュ

### ランタイム最適化

1. **React.memo**: 重いコンポーネントのメモ化
2. **useMemo/useCallback**: 不要な再計算を防止
3. **Suspense**: 遅延ロードコンポーネントの適切な配置
4. **Virtualization**: 長いリストの仮想スクロール（@dnd-kit/core）

---

## 注意事項とベストプラクティス

### 絶対に避けるべきこと

1. **`wouter`の`Link`を直接使用**: `src/components/Link`を使用
2. **ページ全体の遅延ロード**: コンポーネント単位で分割
3. **キャッシュなしでのデータ取得**: `usePromise`の`swr`オプションを活用
4. **`console.log`の残置**: ESLintで警告されるため削除
5. **型`any`の使用**: 厳格な型チェックを維持
6. **Service Workerのアンレジスター忘れ**: デバッグ時は必ずアンレジスター

### 推奨プラクティス

1. **型安全性**: `openapi-fetch`で自動生成された型を活用
2. **アクセシビリティ**: Radix UIでWCAG準拠を実現
3. **エラーハンドリング**: try-catchで適切にエラーをキャッチ
4. **テストの追加**: 新機能追加時は必ずテストを書く
5. **ドキュメント参照**: 不明点は`docs/`ディレクトリのMDを確認

---

## 実践的なコーディングパターン

### cn関数によるクラス名結合

**必須**: 動的にクラス名を結合する場合は、必ず`cn`関数を使用します。

```typescript
import cn from '~lib/classnames';

// ✅ Good: cn関数を使用
<div className={cn('base-class', isActive && 'active-class', className)} />

// ❌ Bad: 文字列結合
<div className={`base-class ${isActive ? 'active-class' : ''} ${className}`} />

// ✅ Good: Tailwindクラスの競合を自動解決
<div className={cn('p-4', someProp && 'p-2')} />  // → 'p-2'のみ適用
```

`cn`関数の利点：

- Tailwindクラスの競合を自動解決（`twMerge`）
- 条件付きクラスの簡潔な記述（`clsx`）
- 型安全なクラス名の結合

---

### SVGアイコンのインポート

SVGファイルは`?react`サフィックスでReactコンポーネントとしてインポートします。

```typescript
// ✅ Good: SVGをReactコンポーネントとしてインポート
import MessageIcon from './assets/message.svg?react';

export const Component = () => (
  <MessageIcon className="size-6 text-theme" />
);

// 注意: SVGファイルのカラーは自動的にcurrentColorに変換されるため、
// text-*クラスでカラーを制御可能
```

設定（vite.config.ts）:

```typescript
svgr({
  svgrOptions: {
    replaceAttrValues: {
      '#000': 'currentColor',
      '#FFF': 'currentColor',
      // 他の色も自動変換
    },
  },
});
```

---

### matchLocationPathによるパスマッチング

ロケーションベースの条件分岐には`matchLocationPath`を使用します。

```typescript
import { matchLocationPath } from '~lib/matchLocationPath';

const fullWidthPages = ['/chat', '/workflows/:id', '/tasks/*'];

if (matchLocationPath(location.pathname, fullWidthPages)) {
  // フルワイズレイアウト
}

// パターン記法:
// - '/exact/path'     : 完全一致
// - '/path/:id'       : 動的セグメント（任意の1セグメント）
// - '/path/*'         : ワイルドカード（任意の文字列）
```

内部実装:

- `:param` → `/[^/]+` （セグメント1つ分の正規表現）
- `*` → `.*` （任意の文字列）
- `/` はエスケープ

---

### レスポンシブ対応パターン

SPレイアウト（640px以下）の判定には`useSPLayoutStatus`を使用します。

```typescript
import { useSPLayoutStatus } from '~lib/hooks/useSPLayoutStatus';

export const Component = () => {
  const { isSPLayout } = useSPLayoutStatus();

  return (
    <div className={cn(
      'container',
      isSPLayout ? 'px-4' : 'px-6'
    )}>
      {isSPLayout ? <MobileView /> : <DesktopView />}
    </div>
  );
};
```

特徴：

- リアルタイムでリサイズを監視
- 640px が SP/PC の境界（Tailwind の `md` ブレークポイント）
- `useEffect` で `window.resize` イベントをリッスン

---

### カスタムフックによるロジックの分離

複雑な状態やロジックは、必ずカスタムフックに分離します。

```typescript
// ✅ Good: カスタムフックに分離
// hooks/useChatState.ts
export const useChatState = ({ conversationId, messages, ... }) => {
  const [sseStatus, setSSEStatus] = useState<'idle' | 'loading'>('idle');

  const sendMessage = useCallback(async (text: string) => {
    // メッセージ送信ロジック
  }, [conversationId]);

  return { sseStatus, sendMessage, abortGeneration };
};

// ChatPage.tsx
export const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const { sseStatus, sendMessage } = useChatState({ messages, ... });

  // コンポーネントはUIに集中
  return <ChatUI onSubmit={sendMessage} status={sseStatus} />;
};
```

フックの命名規則:

- `use` プレフィックス必須
- 動詞 + 名詞パターン推奨（`useFetchData`, `useChatState`）

---

### Providerの階層順序

main.tsxでのProvider階層は以下の順序を維持してください。

```typescript
<StrictMode>
  <HelmetProvider>              {/* HTMLヘッド管理 */}
    <HotkeysProvider>           {/* キーボードショートカット */}
      <ThemeProvider>           {/* テーマ（light/dark） */}
        <TooltipProvider>       {/* Radix UI Tooltip */}
          <DialogProvider>      {/* ダイアログ管理 */}
            <ErrorBoundary>     {/* エラーキャッチ */}
              <Routes />
            </ErrorBoundary>
            <ToastContainer />  {/* トースト通知 */}
          </DialogProvider>
        </TooltipProvider>
      </ThemeProvider>
    </HotkeysProvider>
  </HelmetProvider>
</StrictMode>
```

重要:

- 新しいProviderは適切な位置に挿入
- 依存関係を考慮（例: DialogProviderはThemeProvider内）
- ToastContainerはRoutes外（常に表示）

---

### 環境変数の型安全アクセス

環境変数には必ず`safeEnv`経由でアクセスします。

```typescript
import { safeEnv } from '~lib/safeEnv';

// ✅ Good: safeEnv経由
const apiUrl = safeEnv.VITE_API_BASE_URL;
const isProduction = safeEnv.DEPLOYED_ON === 'PRODUCTION';
const isTestMode = safeEnv.IS_TEST_MODE;

// ❌ Bad: 直接アクセス
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

`safeEnv`の特徴:

- **型安全**: すべての値が定義済みであることを保証
- **null/undefinedチェック**: 起動時に自動検証
- **環境自動判定**: `DEPLOYED_ON` は URL hostname から判定
    - `localhost` → `LOCAL`
    - `stg` を含む → `STAGING`
    - `preview` を含む → `PREVIEW`
    - `beta` を含む → `BETA`
    - それ以外 → `PRODUCTION`

---

### usePromise + useMutationパターン

データ取得と変更は役割を明確に分離します。

```typescript
// データ取得（GET）: usePromise
const userState = usePromise(
  () => apiClient.GET('/api/users/me', {}),
  {
    swr: {
      key: 'currentUser',
      localStorage: true  // ページリロード後もキャッシュ保持
    }
  }
);

if (userState.status === 'pending') return <Loading />;
if (userState.status === 'rejected') return <Error />;
const user = userState.resource;

// データ変更（POST/PUT/DELETE）: useMutation
const { state, call } = useMutation(
  (name: string) => apiClient.PUT('/api/users/me', {
    body: { name }
  })
);

const handleUpdate = async () => {
  await call('New Name');
  mutateAllPromise();  // 全usePromiseを再検証
};
```

キャッシュ管理:

```typescript
// 全キャッシュ削除 + 全usePromiseを再検証
clearPromiseSoftCache();
mutateAllPromise();

// 全usePromiseを再検証のみ（キャッシュは残す）
mutateAllPromise();
```

---

### 認証エラーのカスタムハンドリング

デフォルトでは401時に`/auth`へリダイレクトしますが、カスタマイズ可能です。

```typescript
import { useCustomUnAuthorizedInterceptor } from '~lib/apiClient/lib/useCustomUnAuthorizedInterceptor';

// ログインページなど、未認証でアクセス可能なページ
export const LoginPage = () => {
  useCustomUnAuthorizedInterceptor((response) => {
    // 401でもリダイレクトしない
    console.log('Not authenticated, showing login form');
  });

  return <LoginForm />;
};
```

⚠️ **重要**: 複数のコンポーネントで同時にマウントしないでください。最後にマウントされたインターセプターのみが有効になります。

無視されるページ（デフォルト）:

```typescript
const ignoreLocations = [
  '/404',
  '/auth',
  '/login',
  '/signup',
  '/authorize/forgot-password',
  '/authorize/reset-password',
  '/tutorial/*',
];
```
---

### テストのパターン

#### ユニットテスト（Vitest）

```typescript
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// 外部依存をモック
vi.mock('wouter', () => ({
  useSearch: vi.fn(),
}));

describe('useQueryParam', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const wouter = await import('wouter');
    vi.mocked(wouter.useSearch).mockReturnValue('?key=value');
  });

  test('should get query parameter', () => {
    const { result } = renderHook(() => useQueryParam('key'));
    const [value] = result.current;
    expect(value).toBe('value');
  });

  test('should set query parameter', () => {
    const { result } = renderHook(() => useQueryParam('key'));
    const [, setValue] = result.current;

    act(() => {
      setValue('newValue');
    });

    expect(mockReplaceState).toHaveBeenCalled();
  });
});
```

#### E2Eテスト（Playwright）

テストの配置:

```
src/
├── lib/
│   └── hooks/
│       ├── useQueryParam.ts
│       └── useQueryParam.test.tsx     ← 同じディレクトリ
└── routes/
    └── settings/
        ├── index.tsx
        └── settings.spec.ts            ← 同じディレクトリ
```

---

### フォーム処理のパターン

react-hook-form + valibotを使用した型安全なフォーム処理。

```typescript
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';
import * as v from 'valibot';

// バリデーションスキーマ
const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, '名前を入力してください')),
  email: v.pipe(v.string(), v.email('正しいメールアドレスを入力してください')),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(150)),
});

type FormData = v.InferOutput<typeof schema>;

export const MyForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await apiClient.POST('/api/users', { body: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '送信'}
      </button>
    </form>
  );
};
```

---

### Jotai Atomsの使用パターン

グローバル状態管理にはJotaiを使用します。

```typescript
// atom定義（src/atom.ts）
import { atom } from 'jotai';
import { store } from '~lib/store';

export const isSidebarOpenAtom = atom(store.get('isSidebarOpen') ?? false);

// 使用例: 読み書き両方
import { useAtom } from 'jotai';
import { isSidebarOpenAtom } from '~/atom';

const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);

// 使用例: 読み取り専用
import { useAtomValue } from 'jotai';
const isOpen = useAtomValue(isSidebarOpenAtom);

// 使用例: 書き込み専用
import { useSetAtom } from 'jotai';
const setIsOpen = useSetAtom(isSidebarOpenAtom);

// LocalStorageへの永続化
import { store } from '~lib/store';

const setIsOpen = (value: boolean) => {
  store.set('isSidebarOpen', value);
  // atomの値も更新
  setIsOpenAtom(value);
};
```

---

## チェックリスト: 新機能追加時

新しいページや機能を追加する際は、以下をチェックしてください。

### コンポーネント追加

- [ ] `cn`関数を使用してクラス名を結合
- [ ] SVGアイコンは`?react`でインポート
- [ ] 複雑なロジックはカスタムフックに分離
- [ ] レスポンシブ対応（`useSPLayoutStatus`）
- [ ] ダークモード対応（`dark:`クラス）

### API呼び出し

- [ ] `usePromise`（GET）または`useMutation`（POST/PUT/DELETE）を使用
- [ ] SWRキャッシュを適切に設定（`swr.key`）
- [ ] データ更新後に`mutateAllPromise()`を呼び出し

### 状態管理

- [ ] グローバル状態はJotai atomsに定義
- [ ] ローカル状態は`useState`
- [ ] 複雑な状態はカスタムフックに分離

### ルーティング

- [ ] `src/routes.ts`に追加
- [ ] 必要に応じて`lazyImport`で遅延ロード
- [ ] リダイレクトが必要なら`REDIRECTS`に追加

### テスト

- [ ] ユニットテスト（汎用関数・フック用）を追加
- [ ] E2Eテスト（ページ・機能用）を追加
- [ ] テストファイルは実装と同じディレクトリに配置

### アクセシビリティ

- [ ] キーボード操作可能
- [ ] 適切なARIA属性（role, aria-label等）
- [ ] Radix UIコンポーネントを活用

### パフォーマンス

- [ ] 重いコンポーネントは`Suspense` + 遅延ロード
- [ ] 画像は適切なサイズ・フォーマット
- [ ] 不要な再レンダリングを防ぐ（`memo`, `useMemo`, `useCallback`）

---

## 重要なカスタムフックの詳細

プロジェクトには多数のカスタムフックがありますが、特に重要なものを解説します。

### useDialogUtil - ダイアログ開閉管理

シンプルなダイアログの開閉状態を管理するフックです。

```typescript
import { useDialogUtil } from '~lib/hooks/useDialogUtil';

export const MyComponent = () => {
  const dialog = useDialogUtil();

  return (
    <>
      <button onClick={dialog.show}>ダイアログを開く</button>

      {dialog.isOpen && (
        <Dialog onClose={dialog.hide}>
          <p>ダイアログの内容</p>
        </Dialog>
      )}
    </>
  );
};
```

返り値:

- `isOpen: boolean` - ダイアログが開いているかどうか
- `show: () => void` - ダイアログを開く
- `hide: () => void` - ダイアログを閉じる

---

### useBodyCustomCSS - body要素へのクラス適用

`<body>`要素にクラスを動的に適用するフックです。Helmetと同じ感覚で使用できます。

```typescript
import { useBodyCustomCSS } from '~lib/hooks/useBodyCustomCSS';

export const MyPage = () => {
  // body要素のスクロールバーを非表示にする
  useBodyCustomCSS('overflow-y-hidden');

  return <div>コンテンツ</div>;
};
```

特徴:

- コンポーネントのマウント時に`body`にクラスを追加
- アンマウント時に自動的にクリーンアップ
- `dark:bg-midnight`は常に適用される

---

### useNavigationInterceptor - ページ遷移のインターセプト

`history.pushState`をインターセプトして、ページ遷移をキャンセルまたは処理できます。

```typescript
import { useNavigationInterceptor } from '~lib/hooks/useNavigationInterceptor';

export const MyComponent = () => {
  useNavigationInterceptor();

  useEffect(() => {
    const handlePushState = (event: CustomEvent) => {
      const { url } = event.detail;
      console.log('ページ遷移:', url);

      // 特定条件で遷移をキャンセル
      if (shouldPreventNavigation) {
        event.preventDefault();
      }
    };

    window.addEventListener('pushstate', handlePushState);
    return () => window.removeEventListener('pushstate', handlePushState);
  }, []);

  return <div>コンテンツ</div>;
};
```

使用例:

- 未保存の変更がある場合に警告
- ページ遷移のログ記録
- カスタムアニメーション処理

---

### useSwipeableList - スワイプ可能なリスト

水平スクロール可能なリストに、マウスドラッグと左右ボタンを追加するフックです。

```typescript
import { useSwipeableList } from '~lib/hooks/useSwipeableList';

export const HorizontalList = () => {
  const { listRef, moveLeftButton, moveRightButton, blockOverlay } = useSwipeableList();

  return (
    <div className="relative">  {/* 親要素はrelative必須 */}
      {moveLeftButton}
      {moveRightButton}
      {blockOverlay}

      <div
        ref={listRef}
        className="flex gap-4 overflow-x-auto"
        style={{ cursor: 'grab' }}
      >
        <div>アイテム1</div>
        <div>アイテム2</div>
        <div>アイテム3</div>
        {/* ... */}
      </div>
    </div>
  );
};
```

機能:

- マウスドラッグでスクロール
- 左右ボタンでスクロール（端に到達すると自動的に非表示）
- ドラッグ中は`blockOverlay`でクリックイベントをブロック

注意:

- 親要素に`position: relative`を設定必須
- リストは`overflow-x-auto`を設定

---

## 便利なユーティリティ関数

### createTitle - ページタイトル生成

```typescript
import { createTitle } from '~lib/createTitle';
import { Helmet } from 'react-helmet-async';

export const MyPage = () => {
  return (
    <>
      <Helmet>
        <title>{createTitle('マイページ')}</title>
      </Helmet>
      {/* ... */}
    </>
  );
};
```

### isSPLayout - SPレイアウト判定

```typescript
import { isSPLayout } from '~lib/isSPLayout';

// コンポーネント外で使用（SSR対応）
if (isSPLayout()) {
  // SP用の処理
}
```

注意:

- **コンポーネント内では`useSPLayoutStatus`を使用**（リアクティブ）
- `isSPLayout`は静的な判定のみ（リサイズを監視しない）
- 境界値: `768px`以下でSPレイアウト
```

特徴:

- **型安全**: ヘッダーのkeyがデータの型と一致することを保証
- **BOM付き**: ExcelでUTF-8を正しく認識
- **エスケープ**: カンマ、ダブルクォート、改行を自動エスケープ

---

### ファイル関連ユーティリティ

#### formatFileSize - ファイルサイズの人間可読化

```typescript
import { formatFileSize } from '~lib/file';

formatFileSize(1024); // "1 KB"
formatFileSize(123456789); // "118 MB"
formatFileSize(0); // "0 Bytes"
formatFileSize(123456789, 2); // "117.74 MB"（小数点2桁）
```

#### fileToDataURL - ファイルをData URLに変換

```typescript
import { fileToDataURL } from '~lib/file';

const handleFileSelect = async (file: File) => {
  const dataUrl = await fileToDataURL(file);
  console.log(dataUrl); // "data:image/png;base64,..."
};
```

#### validateFile - ファイルバリデーション

```typescript
import { validateFile } from '~lib/file';

const result = validateFile(
  file,
  'image/*,.pdf', // 受け入れ可能な形式
  10 * 1024 * 1024 // 最大10MB
);

if (!result.valid) {
  console.error(result.error);
  // 例: "PNG形式はサポートされていません"
  // 例: "ファイルサイズが大きすぎます（最大 10MB）"
}
```

---

### 日付・時間ユーティリティ

```typescript
import {
  formatDate,
  getDayOfWeek,
  isSameDay,
  showFormatTimeAgo,
} from '~lib/dateUtil';

const date = new Date('2024-10-22');

formatDate(date); // "10/22"
getDayOfWeek(date); // "火"
isSameDay(date, new Date()); // false

showFormatTimeAgo(new Date(Date.now() - 30000)); // "たった今"
showFormatTimeAgo(new Date(Date.now() - 300000)); // "5分前"
showFormatTimeAgo(new Date(Date.now() - 7200000)); // "2時間前"
showFormatTimeAgo(new Date(Date.now() - 259200000)); // "3日前"
```

---

### URL判定ユーティリティ

```typescript
import { isUrl, isWebUrl, isExternalUrl } from '~lib/url';

isUrl('https://example.com'); // true
isUrl('not a url'); // false

isWebUrl('https://example.com'); // true
isWebUrl('ftp://example.com'); // false（http/https以外）

isExternalUrl('https://google.com'); // true
isExternalUrl('/internal/path'); // false
isExternalUrl('relative/path'); // false（相対パス）
```

---

### Cookie操作ユーティリティ

```typescript
import { cookie } from '~lib/cookie';

// cookieから値を取得
const csrfToken = cookie.get('XSRF-TOKEN');
const sessionId = cookie.get('session');

if (!csrfToken) {
  console.log('CSRF tokenが見つかりません');
}
```

注意:

- **読み取り専用**: このユーティリティは`get`のみ提供
- 書き込みは通常サーバーサイドで行う
- SSR対応（`typeof document === 'undefined'`チェック）

---

## レスポンシブデザインのブレークポイント

プロジェクトで使用しているブレークポイントを統一してください。

### Tailwind CSSのブレークポイント

```css
/* デフォルト: 0px以上（モバイル） */
.container {
  padding: 16px;
}

/* sm: 640px以上 */
@media (min-width: 640px) {
  /* スマートフォン（横向き） */
}

/* md: 768px以上 */
@media (min-width: 768px) {
  /* タブレット */
  .container {
    padding: 24px;
  }
}

/* lg: 1024px以上 */
@media (min-width: 1024px) {
  /* デスクトップ */
}

/* xl: 1280px以上 */
@media (min-width: 1280px) {
  /* 大画面デスクトップ */
}
```

### JavaScriptでの判定

**重要**: JavaScriptでは`768px`を境界として使用

```typescript
// ❌ Bad: Tailwindのブレークポイント（640px）と不一致
const SP_BREAKPOINT = 640;

// ✅ Good: 実際の実装（768px）
const SP_BREAKPOINT = 768;

// src/lib/isSPLayout.ts
const isSPLayout = () => window.innerWidth <= 768;

// Tailwindとの対応
// - 768px以下: SPレイアウト（モバイル優先）
// - 768px超: PCレイアウト（md:以上）
```

Tailwindクラスの使用:

```tsx
// ✅ Good: md:で切り替え（768px）
<div className="px-4 md:px-6">
  {/* SP: 16px、PC: 24px */}
</div>

// ❌ Bad: sm:で切り替え（640px）- isSPLayoutと不一致
<div className="px-4 sm:px-6">
  {/* 使用しない */}
</div>
```

---

## グローバルCSSのカスタムスタイル

`src/styles/global.css`には以下のカスタムスタイルが定義されています。

### ボタンのカーソル

```css
@layer base {
  /* 有効なボタンはpointer */
  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }

  /* 無効なボタンはnot-allowed */
  button:disabled,
  [role='button']:disabled {
    cursor: not-allowed;
  }
}
```
---

## 定数の管理パターン

定数は各モジュールの`constants.ts`ファイルで管理します。

### ファイル構造

```
src/
├── constants/
│   └── index.ts          # グローバル定数
├── components/
│   └── MyComponent/
│       ├── index.tsx
│       └── constants.ts  # コンポーネント固有の定数
└── routes/
    └── settings/
        ├── index.tsx
        └── constants.ts  # ページ固有の定数
```

### 例: ファイル定数

```typescript
// src/constants/file.ts
export const KB = 1024;
export const MB = KB * 1024;
export const GB = MB * 1024;

export const UPLOAD_DEFAULT_MAX_SIZE = 10 * MB;
```

### 例: 設定ページの定数

```typescript
// src/routes/settings/constants.ts
export const SETTINGS_MENU_ITEMS = [
  { id: 'usage', label: '使用量', path: '/settings/usage' },
  {
    id: 'subscription',
    label: 'サブスクリプション',
    path: '/settings/subscription',
  },
  { id: 'theme', label: 'テーマ', path: '/settings/theme' },
  // ...
] as const;
```

ベストプラクティス:

- **グローバル定数**: `src/constants/`に配置
- **ローカル定数**: コンポーネント/ページと同じディレクトリに配置
- **`as const`**: 型の厳密性を高める
- **大文字スネークケース**: `UPPER_SNAKE_CASE`

---

## カスタムCSSプロパティ（CSS Variables）

プロジェクトで定義されているCSS変数は以下の通りです。

### 定義（tailwind.config.js）

```javascript
addBase({
  ':root': {
    '--header-nav-height': '66px',
    '--bottom-nav-height': '81px', // SPのbottom-nav-bar
    '--header-height': '0px',
    '--sidebar-width': '220px',
    '--sidebar-shrink-width': '61px',
    '--gray-to-transparent-start': '#E3E3E3',
  },
  '.dark': {
    '--gray-to-transparent-start': '#374151',
  },
  // SP時
  '@media (max-width: 640px)': {
    ':root': {
      '--sidebar-width': '0px',
      '--sidebar-shrink-width': '0px',
    },
  },
});
```

---

## Helmtの使用パターン

ページタイトルやmeta タグは`react-helmet-async`で管理します。

```typescript
import { Helmet } from 'react-helmet-async';
import { createTitle } from '~lib/createTitle';

export const MyPage = () => {
  return (
    <>
      <Helmet>
        <title>{createTitle('マイページ')}</title>
        <meta name="description" content="マイページの説明" />
        <meta property="og:description" content="マイページの説明" />
      </Helmet>

      <div>コンテンツ</div>
    </>
  );
};
```
---

## インタラクティブクラスの使用

ボタンやクリック可能な要素には`.interactive`クラスを使用します。

```tsx
// tailwind.config.jsで定義済み
<button className="interactive rounded-lg bg-blue-500 px-4 py-2">
  クリック
</button>
```

効果:

- クリック時に`scale(0.975)`にアニメーション
- `disabled`時はアニメーション無効
- トランジション: 200ms

定義（tailwind.config.js）:

```javascript
addComponents({
  '.interactive': {
    '@apply transition-transform duration-200 active:scale-[0.975] disabled:scale-[1] disabled:transition-none':
      {},
  },
});
```

---

## セキュリティとXSS対策

### Markdown/HTMLのサニタイズ

ユーザー入力のMarkdown/HTMLは必ずサニタイズします。

```typescript
// src/components/Markdownコンポーネントで自動的にサニタイズ
import { Markdown } from '~components/Markdown';

<Markdown content={userInput} />
```

内部実装:

- `rehype-sanitize`でXSS対策
- `rehype-raw`でHTMLタグをパース
- 許可されたタグのみ表示

### CSRF対策

APIリクエストには自動的にCSRFトークンを付与します。

```typescript
// src/lib/apiClient/middlewares/authMiddleware.ts
export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // cookieからXSRF-TOKENを取得してヘッダーに設定
    request.headers.set('X-XSRF-TOKEN', getCookie('XSRF-TOKEN') ?? '');
    return request;
  },
};
```

注意:

- **自動設定**: `apiClient`経由のリクエストは自動的にトークン付与
- **手動fetch禁止**: `fetch()`を直接使わず、必ず`apiClient`を使用

---
