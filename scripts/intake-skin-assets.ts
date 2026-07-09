import {
  parseSkinAssetIntakeCliOptions,
  stageSkinAssetIntake,
} from "../src/lib/skinAssetIntake";

async function main() {
  const options = parseSkinAssetIntakeCliOptions(process.argv.slice(2));
  const result = await stageSkinAssetIntake(options);
  const verb = options.dryRun ? "Would stage" : "Staged";

  for (const key of result.stagedKeys) {
    console.log(`${verb}: ${key}`);
  }

  console.log(`assetBasePath=${result.assetBasePath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
