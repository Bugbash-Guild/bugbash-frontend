type Params = {
  src?: string;
  sizes?: string;
  unoptimized?: boolean;
};

/**
 * `next/image` の最適化を通すか、素のまま配信するかの方針。
 *
 * 基準は「アイコンが小さいか」ではなく **最適化器がその画像を扱えるか**。
 *
 * 以前は「外部の .webp で固定 80px 以下なら unoptimized」にしていた。
 * だが R2 に置いているアセットは 1254x1254 の webp（`scripts/build-game-assets.ts`
 * は quality だけ指定して縮小しない）で、小さいアイコン用の派生も無い。
 * つまり 28px のアイコン 1 個につき 106〜240KB の全解像度画像を落としていた。
 * 最適化器を通せば同じ絵が w=64 で約 3.5KB になる（実測）。図鑑には
 * モンスターが数十体並ぶので、この差はそのままページ表示の待ち時間になる。
 */
export function shouldUseUnoptimizedGameImage({ src, unoptimized }: Params): boolean {
  if (typeof unoptimized === 'boolean') return unoptimized;
  if (!src) return false;

  // SVG は `next/image` の最適化器が受け付けず 400 を返す
  // （`dangerouslyAllowSVG` 未設定）。最適化に回すと画像が出ないので素で配る。
  if (isSvgSource(src)) return true;

  // リモート画像は next.config.ts の `remotePatterns` に載っているホストしか
  // 最適化できない。載っていないホストを最適化に回すと 400 になるため、
  // アセットホストと一致しない外部URLは素のまま配る。
  if (isRemoteSource(src)) return !isConfiguredAssetHost(src);

  // 同一オリジン（public/ 配下など）は最適化器が扱える。
  return false;
}

function isSvgSource(src: string): boolean {
  return /\.svg(?:[?#].*)?$/i.test(src);
}

function isRemoteSource(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/**
 * next.config.ts の `remotePatterns` は `NEXT_PUBLIC_ASSETS_BASE_URL`
 * （fallback: `BUGBASH_ASSETS_BASE_URL`）から組み立てられる。ここは
 * `NEXT_PUBLIC_` 側だけを見る: クライアントに埋め込まれるのはこれだけで、
 * 判定はブラウザ側でも同じ答えにならないといけない。
 */
function isConfiguredAssetHost(src: string): boolean {
  const configured = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
  if (!configured) return false;

  try {
    return new URL(src).host === new URL(configured).host;
  } catch {
    return false;
  }
}
