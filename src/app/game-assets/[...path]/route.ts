import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const REPO_ROOT = process.cwd();
const GAME_ASSET_ROOT = path.join(REPO_ROOT, "game-assets");

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function isSafeAssetPath(segments: string[]): boolean {
  return (
    segments.length > 0 &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        !segment.startsWith(".") &&
        !segment.includes("\\"),
    )
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { path: assetPath } = await context.params;
  if (!isSafeAssetPath(assetPath)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const absolutePath = path.join(GAME_ASSET_ROOT, ...assetPath);
  const relativePath = path.relative(GAME_ASSET_ROOT, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  try {
    const body = await readFile(absolutePath);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "cache-control": "public, max-age=300",
        "content-type":
          CONTENT_TYPE_BY_EXTENSION[path.extname(absolutePath).toLowerCase()] ??
          "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
