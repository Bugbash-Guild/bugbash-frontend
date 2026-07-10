import { access, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { withGameAssetPublicationLock } from "../skinAssetPublication";

async function main() {
  const [publicationKey, markerFile, releaseFile, skinId] =
    process.argv.slice(2);
  if (!publicationKey || !markerFile || !releaseFile || !skinId) {
    throw new Error("publication key, marker, release, and skin are required");
  }

  await withGameAssetPublicationLock(
    {
      label: `token-mimic/${skinId}`,
      publicationKey,
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
