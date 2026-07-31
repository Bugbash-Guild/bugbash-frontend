import { fetchJson } from './apiError';

/**
 * マスタデータ（全ヒーロー共通・リリースでしか変わらない）のエンドポイント。
 *
 * BE 側はこれらに `Cache-Control: private, max-age=5min` を付けて返し
 * （`MasterDataCache`）、FE のプロキシ（`src/app/api/_proxyCore.ts`）が
 * そのヘッダを転送する。したがって取得側で `cache: 'no-store'` を
 * **付けてはいけない**。付けるとブラウザキャッシュが無効化され、
 * BE にヘッダを足した意味がなくなる。
 *
 * ここは BE の `MasterDataCache.cacheControl()` を付けている箇所と
 * 1:1 で対応させる。片方だけ増やしても壊れないが、キャッシュは効かない。
 */
const MASTER_DATA_PATHS: ReadonlySet<string> = new Set([
    '/api/badges/catalog',
    '/api/billing/rune-products',
    '/api/forge/level-defs',
    '/api/monsters',
    '/api/monsters/all',
    '/api/skins',
    '/api/summon/disclosure',
    '/api/summon/limited/disclosure',
]);

/**
 * マスタデータのURLか判定する。
 *
 * クエリは無視する（`/api/forge/level-defs?track=BADGE` はマスタ）。
 * 前方一致ではなくパス完全一致にしているのは、`/api/skins`（マスタ）と
 * `/api/skins/owned`（ヒーロー固有）のように、プレフィックスが同じでも
 * 鮮度要求が正反対のペアが実在するため。
 */
export const isMasterDataUrl = (url: string): boolean =>
    MASTER_DATA_PATHS.has(url.split('?')[0]);

/**
 * マスタデータ用の取得。`cache` を指定せず、BE の Cache-Control に従わせる。
 *
 * ヒーロー固有のエンドポイントを誤ってここに通すと、最大5分ぶん古い値を
 * 掴んだままになる。開発時に気づけるよう投げる（本番では黙って通す:
 * 表示できるデータがあるのに画面を落とす方が悪い）。
 */
export const fetchMasterJson = async <T>(url: string, context: string = url): Promise<T> => {
    if (process.env.NODE_ENV !== 'production' && !isMasterDataUrl(url)) {
        throw new Error(
            `fetchMasterJson called with a non-master URL: ${url}. ` +
                'ヒーロー固有データは fetchJson を使ってください（MASTER_DATA_PATHS 参照）。',
        );
    }
    return fetchJson<T>(url, undefined, context);
};
