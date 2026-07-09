import { readdir, rm, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  createGameAssetManifest,
  GAME_ASSET_MANIFEST_FILE,
  isSupportedGameAssetInput,
  toWebpAssetKey,
} from "../src/lib/gameAssetManifest";
import {
  assertSkinAssetImageMetadata,
  validateSkinAssetInputKeys,
} from "../src/lib/gameAssetSkinValidation";

type Options = {
  sourceDir: string;
  outDir: string;
  quality: number;
};

function readOption(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`${name} requires a value`);
  return value;
}

function parseOptions(args: string[]): Options {
  const quality = Number(readOption(args, "--quality", "82"));
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error("--quality must be an integer from 1 to 100");
  }

  return {
    sourceDir: path.resolve(readOption(args, "--source", "game-assets/source")),
    outDir: path.resolve(readOption(args, "--out", "dist/game-assets")),
    quality,
  };
}

function isSameOrNestedPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function assertSafeOutputDirectory(options: Options) {
  const outputRoot = path.parse(options.outDir).root;
  if (options.outDir === outputRoot) {
    throw new Error("--out must not be a filesystem root");
  }

  if (
    isSameOrNestedPath(options.outDir, options.sourceDir) ||
    isSameOrNestedPath(options.sourceDir, options.outDir)
  ) {
    throw new Error(
      "--out must be outside --source and must not contain --source",
    );
  }
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

async function collectFiles(dir: string, root = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, root)));
    } else if (entry.isFile()) {
      files.push(toPosixPath(path.relative(root, absolutePath)));
    }
  }

  return files.sort();
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  assertSafeOutputDirectory(options);

  const sourceStats = await stat(options.sourceDir).catch(() => null);
  if (!sourceStats?.isDirectory()) {
    throw new Error(
      `Asset source directory does not exist: ${options.sourceDir}`,
    );
  }

  const inputKeys = (await collectFiles(options.sourceDir)).filter(
    isSupportedGameAssetInput,
  );
  if (inputKeys.length === 0) {
    throw new Error(`No supported assets found in ${options.sourceDir}`);
  }
  validateSkinAssetInputKeys(inputKeys);

  await rm(options.outDir, { recursive: true, force: true });
  await mkdir(options.outDir, { recursive: true });

  const outputKeys: string[] = [];
  for (const inputKey of inputKeys) {
    const outputKey = toWebpAssetKey(inputKey);
    const inputPath = path.join(options.sourceDir, inputKey);
    const outputPath = path.join(options.outDir, outputKey);
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    assertSkinAssetImageMetadata(inputKey, metadata);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await image
      .webp({
        effort: 5,
        quality: options.quality,
      })
      .toFile(outputPath);

    outputKeys.push(outputKey);
    console.log(`${inputKey} -> ${outputKey}`);
  }

  const manifest = createGameAssetManifest(outputKeys);
  await writeFile(
    path.join(options.outDir, GAME_ASSET_MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(
    `Generated ${manifest.assets.length} assets and ${GAME_ASSET_MANIFEST_FILE}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
