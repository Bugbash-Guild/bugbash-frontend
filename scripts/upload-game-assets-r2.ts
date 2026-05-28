import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  GAME_ASSET_MANIFEST_FILE,
  type GameAssetManifest,
  getAssetContentType,
  getR2ObjectName,
  getR2UploadKeys,
  isBuiltGameAssetKey,
} from "../src/lib/gameAssetManifest";

type Options = {
  bucket: string;
  distDir: string;
  dryRun: boolean;
  prefix: string;
};

const ASSET_CACHE_CONTROL =
  process.env.R2_ASSET_CACHE_CONTROL ?? "public, max-age=300";
const MANIFEST_CACHE_CONTROL =
  process.env.R2_MANIFEST_CACHE_CONTROL ??
  "public, max-age=60, must-revalidate";
const WRANGLER_VERSION = process.env.WRANGLER_VERSION ?? "4.95.0";

function readOption(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--"))
    throw new Error(`${name} requires a value`);
  return value;
}

function parseOptions(args: string[]): Options {
  const bucket = readOption(args, "--bucket", process.env.R2_BUCKET ?? "");
  if (!bucket)
    throw new Error("R2 bucket is required. Set R2_BUCKET or pass --bucket.");

  return {
    bucket,
    distDir: path.resolve(readOption(args, "--dist", "dist/game-assets")),
    dryRun: args.includes("--dry-run"),
    prefix: readOption(args, "--prefix", process.env.R2_PREFIX ?? ""),
  };
}

function parseManifest(value: string): GameAssetManifest {
  const parsed = JSON.parse(value) as Partial<GameAssetManifest>;
  if (parsed.version !== 1 || !Array.isArray(parsed.assets)) {
    throw new Error(`${GAME_ASSET_MANIFEST_FILE} has an unsupported format`);
  }
  const assets = parsed.assets.map(String);
  const unsafeAsset = assets.find((asset) => !isBuiltGameAssetKey(asset));
  if (unsafeAsset) {
    throw new Error(
      `${GAME_ASSET_MANIFEST_FILE} contains an unsafe asset key: ${unsafeAsset}`,
    );
  }

  return {
    version: 1,
    generatedAt: String(parsed.generatedAt ?? ""),
    assets,
  };
}

async function runWrangler(args: string[]) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      executable,
      ["--yes", `wrangler@${WRANGLER_VERSION}`, ...args],
      {
        env: process.env,
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`wrangler exited with code ${code}`));
      }
    });
  });
}

async function uploadObject(options: Options, assetKey: string) {
  const filePath = path.join(options.distDir, assetKey);
  await access(filePath);

  const objectName = getR2ObjectName(options.bucket, options.prefix, assetKey);
  const cacheControl =
    assetKey === GAME_ASSET_MANIFEST_FILE
      ? MANIFEST_CACHE_CONTROL
      : ASSET_CACHE_CONTROL;

  if (options.dryRun) {
    console.log(`[dry-run] ${filePath} -> ${objectName}`);
    return;
  }

  await runWrangler([
    "r2",
    "object",
    "put",
    objectName,
    "--file",
    filePath,
    "--content-type",
    getAssetContentType(assetKey),
    "--cache-control",
    cacheControl,
  ]);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const manifestPath = path.join(options.distDir, GAME_ASSET_MANIFEST_FILE);
  const manifest = parseManifest(await readFile(manifestPath, "utf8"));

  for (const assetKey of getR2UploadKeys(manifest)) {
    await uploadObject(options, assetKey);
  }

  const verb = options.dryRun ? "Planned upload for" : "Uploaded";
  console.log(
    `${verb} ${manifest.assets.length} assets and ${GAME_ASSET_MANIFEST_FILE} to ${options.bucket}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
