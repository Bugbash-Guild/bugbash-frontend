import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import {
  discoverSkinCandidates,
  finalizeSkinSelection,
  parseSkinReviewCliOptions,
} from "../src/lib/skinCandidateReview";
import { renderSkinCandidateReviewPage } from "../src/lib/skinCandidateReviewPage";
import { createSkinCandidateReviewServer } from "../src/lib/skinCandidateReviewServer";
import { BUGBASH_GAME_ASSET_PUBLICATION_KEY } from "../src/lib/skinAssetPublication";

function runNpm(args: string[]): Promise<void> {
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  const options = parseSkinReviewCliOptions(process.argv.slice(2));
  const catalogue = await discoverSkinCandidates({
    candidateDir: options.candidateDir,
  });
  const reviewToken = randomUUID();
  const html = renderSkinCandidateReviewPage({
    catalogue,
    monsterSlug: options.monsterSlug,
    publish: options.publish,
    reviewToken,
    skinId: options.skinId,
  });
  const server = createSkinCandidateReviewServer({
    catalogue,
    finalize: (selections) =>
      finalizeSkinSelection({
        catalogue,
        force: options.force,
        monsterSlug: options.monsterSlug,
        publicationKey: BUGBASH_GAME_ASSET_PUBLICATION_KEY,
        publish: options.publish,
        runBuild: () =>
          runNpm(["run", "assets:build", "--", "--source", options.sourceDir]),
        runUpload: () => runNpm(["run", "assets:upload:r2"]),
        selections,
        skinId: options.skinId,
        sourceDir: options.sourceDir,
      }),
    html,
    reviewToken,
  });

  server.listen(options.port, "127.0.0.1", () => {
    const destination = options.publish ? "R2 publish" : "local build";
    console.log(
      `Skin review ready at http://127.0.0.1:${options.port} (${destination})`,
    );
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
