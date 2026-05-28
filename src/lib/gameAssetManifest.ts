export const GAME_ASSET_MANIFEST_FILE = "asset-manifest.json";

const SUPPORTED_INPUT_EXTENSIONS = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export type GameAssetManifest = {
  version: 1;
  generatedAt: string;
  assets: string[];
};

function toPosixPath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

function getExtension(filePath: string): string {
  const normalized = toPosixPath(filePath);
  const lastSegment = normalized.split("/").at(-1) ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return lastSegment.slice(dotIndex).toLowerCase();
}

export function isSafeAssetPath(filePath: string): boolean {
  const normalized = toPosixPath(filePath);
  if (
    !normalized ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:\//.test(normalized)
  )
    return false;
  return normalized
    .split("/")
    .every(
      (segment) =>
        segment !== "" &&
        segment !== "." &&
        segment !== ".." &&
        !segment.startsWith("."),
    );
}

export function isSupportedGameAssetInput(filePath: string): boolean {
  return (
    isSafeAssetPath(filePath) &&
    SUPPORTED_INPUT_EXTENSIONS.has(getExtension(filePath))
  );
}

export function isBuiltGameAssetKey(filePath: string): boolean {
  return isSafeAssetPath(filePath) && getExtension(filePath) === ".webp";
}

export function toWebpAssetKey(filePath: string): string {
  const normalized = toPosixPath(filePath);
  if (!isSupportedGameAssetInput(normalized)) {
    throw new Error(`Unsupported game asset path: ${filePath}`);
  }

  const extension = getExtension(normalized);
  return `${normalized.slice(0, -extension.length)}.webp`;
}

export function createGameAssetManifest(
  assetKeys: string[],
  generatedAt = new Date().toISOString(),
): GameAssetManifest {
  const assets = Array.from(new Set(assetKeys)).sort();
  return {
    version: 1,
    generatedAt,
    assets,
  };
}

export function getAssetContentType(assetKey: string): string {
  if (assetKey === GAME_ASSET_MANIFEST_FILE)
    return "application/json; charset=utf-8";
  if (/\.webp$/i.test(assetKey)) return "image/webp";
  return "application/octet-stream";
}

export function getR2ObjectName(
  bucket: string,
  prefix: string,
  assetKey: string,
): string {
  const cleanBucket = bucket.replace(/^\/+|\/+$/g, "");
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  const cleanKey = toPosixPath(assetKey).replace(/^\/+/, "");

  if (!cleanBucket) throw new Error("R2 bucket is required");
  if (!isSafeAssetPath(cleanKey))
    throw new Error(`Unsafe R2 asset key: ${assetKey}`);

  return [cleanBucket, cleanPrefix, cleanKey].filter(Boolean).join("/");
}

export function getR2UploadKeys(manifest: GameAssetManifest): string[] {
  return [...manifest.assets, GAME_ASSET_MANIFEST_FILE];
}
