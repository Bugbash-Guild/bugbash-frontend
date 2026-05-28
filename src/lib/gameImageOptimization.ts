const FIXED_PIXEL_SIZE_PATTERN = /^\s*(\d+(?:\.\d+)?)px\s*$/;
const UNOPTIMIZED_FIXED_PIXEL_MAX = 80;

type Params = {
  src?: string;
  sizes?: string;
  unoptimized?: boolean;
};

export function shouldUseUnoptimizedGameImage({ src, sizes, unoptimized }: Params): boolean {
  if (typeof unoptimized === 'boolean') return unoptimized;
  if (!isExternalOptimizedGameAsset(src)) return false;

  const match = FIXED_PIXEL_SIZE_PATTERN.exec(sizes ?? '');
  if (!match) return false;

  return Number(match[1]) <= UNOPTIMIZED_FIXED_PIXEL_MAX;
}

function isExternalOptimizedGameAsset(src?: string): boolean {
  return /^https?:\/\//.test(src ?? '') && /\.webp(?:[?#].*)?$/i.test(src ?? '');
}
