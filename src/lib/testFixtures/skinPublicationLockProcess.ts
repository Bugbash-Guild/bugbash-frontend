import { access, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { withSkinPublicationLock } from "../skinAssetPublication";

async function main() {
  const [sourceDir, markerFile, releaseFile] = process.argv.slice(2);
  if (!sourceDir || !markerFile || !releaseFile) {
    throw new Error("source, marker, and release paths are required");
  }

  await withSkinPublicationLock(
    {
      monsterSlug: "token-mimic",
      skinId: "kernel-panic",
      sourceDir,
    },
    async () => {
      await writeFile(markerFile, "locked");
      while (true) {
        try {
          await access(releaseFile);
          return;
        } catch {
          await delay(10);
        }
      }
    },
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
