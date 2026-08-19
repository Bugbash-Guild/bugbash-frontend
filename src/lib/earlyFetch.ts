/**
 * hydration 前フェッチ（early fetch）。
 *
 * このアプリは全ページ static HTML + クライアント fetch なので、
 * 最初の API リクエストは「JS ダウンロード → hydration → SWR マウント」の
 * 後にしか始まらない。実測でナビゲーション開始から最初の API まで
 * 約 400ms あり、これが全リクエストの床になっていた。
 *
 * そこで root layout の <head> に置いた小さなインラインスクリプトが
 * HTML パース中に fetch を開始し、Promise を window.__bbEarly に置く。
 * フック側の fetcher は同じ URL の Promise があればそれを引き取る。
 *
 * 設計上の約束:
 * - 認証が要るエンドポイントは bb.authed の目印がある時だけ先読みする
 *   （ログアウト状態で 401 の束を投げない）。/api/auth/status だけは常に。
 * - Promise は 1 回しか引き取れない（Response body は一度しか読めない）。
 * - 先読みが失敗していたら通常の fetch にフォールバックする。
 * - ここに URL を足すときは、フック側の URL 文字列と完全一致させること。
 */

type EarlyFetchStore = Record<string, Promise<Response> | undefined>;

declare global {
    interface Window {
        __bbEarly?: EarlyFetchStore;
    }
}

/** 全認証済みページが共通で叩くもの（サイドバー・トップバー・報酬モーダル） */
export const COMMON_AUTHED_URLS: ReadonlyArray<string> = [
    '/api/hero/stats',
    '/api/billing/wallet',
    '/api/hero/activities?unreadOnly=true&limit=50',
];

/**
 * ページ固有のホットエンドポイント。フック側の URL 文字列と完全一致させること
 * （不一致は earlyFetch.test.ts のタイポガードで落ちる）。
 */
export const ROUTE_URLS: Readonly<Record<string, ReadonlyArray<string>>> = {
    '/': [
        '/api/monsters/all',
        '/api/monsters/owned',
        '/api/hero/activities',
        '/api/heroes/me/commemorative-mints',
        '/api/summon/disclosure',
        '/api/summon/limited/disclosure',
    ],
    '/monsters': [
        '/api/monsters/all',
        '/api/monsters/owned',
        '/api/skins',
        '/api/skins/owned',
        '/api/inventory',
        '/api/heroes/me/commemorative-mints',
    ],
    '/summon': [
        '/api/summon/disclosure',
        '/api/summon/pity',
        '/api/summon/history',
        '/api/billing/subscription',
    ],
    '/summon/limited': [
        '/api/summon/limited/disclosure',
        '/api/summon/limited/pity',
        '/api/summon/history?poolKey=LIMITED&limit=10',
        '/api/billing/subscription',
    ],
    '/badges': [
        '/api/badges/catalog',
        '/api/heroes/me/badges/progress',
        '/api/forge/level-defs?track=BADGE',
        '/api/commemorative-mints',
    ],
    // ショップは1枚（チャージ〜パスまで同居）なので、課金系のホットURLもここに束ねる
    '/shop': [
        '/api/shop/items',
        '/api/inventory',
        '/api/billing/rune-products',
        '/api/billing/subscription/plan',
        '/api/billing/spending-limit',
    ],
    '/shop/skins': ['/api/monsters/all', '/api/monsters/owned', '/api/skins', '/api/skins/owned'],
    '/items': ['/api/inventory'],
    '/forge': ['/api/skins/owned', '/api/forge/level-defs?track=MONSTER'],
    '/leaderboard': ['/api/leaderboard'],
    '/mints': ['/api/commemorative-mints'],
    '/pass': ['/api/billing/subscription'],
    '/mypage/billing': ['/api/billing/subscription', '/api/billing/orders?limit=50'],
};

/**
 * 動的セグメントを含むルート。pathname の prefix 一致で解決し、
 * `{id}` を実際のセグメントに差し替える。
 */
export const DYNAMIC_ROUTE_URLS: ReadonlyArray<{ prefix: string; urls: ReadonlyArray<string> }> = [
    {
        prefix: '/heroes/',
        urls: [
            '/api/heroes/{id}/profile',
            '/api/heroes/{id}/badges',
            '/api/heroes/{id}/commemorative-mints',
        ],
    },
];

/**
 * <head> に埋めるインラインスクリプト本体。
 * ビルド時定数なのでページは static のまま。実行は防御的に（失敗しても無音）。
 */
export const EARLY_FETCH_SCRIPT: string = `(function(){try{
var s={};window.__bbEarly=s;
var g=function(u){try{s[u]=fetch(u,{headers:{Accept:"application/json"}})}catch(e){}};
g("/api/auth/status");
if(document.cookie.indexOf("bb.authed=1")<0)return;
${JSON.stringify(COMMON_AUTHED_URLS)}.forEach(g);
var p=location.pathname.replace(/\\/$/,"")||"/";
var r=${JSON.stringify(ROUTE_URLS)}[p];
if(r)r.forEach(g);
${JSON.stringify(DYNAMIC_ROUTE_URLS)}.forEach(function(d){
if(p.indexOf(d.prefix)!==0)return;
var id=p.slice(d.prefix.length).split("/")[0];
if(!id)return;
d.urls.forEach(function(u){g(u.replace("{id}",encodeURIComponent(id)))});
});
}catch(e){}})();`;

/**
 * 先読みされた Promise を引き取る（1 回限り）。
 * Response body は一度しか読めないため、取ったら必ずストアから消す。
 */
export function takeEarlyResponse(url: string): Promise<Response> | null {
    if (typeof window === 'undefined') return null;
    const store = window.__bbEarly;
    const promise = store?.[url];
    if (!store || !promise) return null;
    delete store[url];
    return promise;
}

/**
 * 先読みがあればそれを、無ければ（または先読みが失敗していたら）
 * 通常の fetch を使う。fetcher からはこれを fetch の代わりに呼ぶ。
 */
export async function fetchWithEarly(url: string, init?: RequestInit): Promise<Response> {
    const early = takeEarlyResponse(url);
    if (early) {
        try {
            return await early;
        } catch {
            // 先読み側のネットワーク失敗は握りつぶし、通常経路で取り直す
        }
    }
    return fetch(url, init);
}
