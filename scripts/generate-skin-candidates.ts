import { spawn } from "node:child_process";

import { parseSkinCandidateBatchCliOptions } from "../src/lib/skinCandidateBatchCli";
import { runSkinCandidateBatchWorkflow } from "../src/lib/skinCandidateBatchWorkflow";
import { runSkinCandidateGeneratorCommand } from "../src/lib/skinCandidateGenerator";

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
  const options = parseSkinCandidateBatchCliOptions(process.argv.slice(2));
  console.log(
    `Generating ${options.candidateCount * 6} candidates for ${options.monsterSlug}/${options.skinId}`,
  );

  const result = await runSkinCandidateBatchWorkflow(options, {
    launchReview: runNpm,
    runGenerator: async (commandOptions) => {
      const { candidateId, stage } = commandOptions.request;
      console.log(`Generating ${stage}/${candidateId}.png`);
      await runSkinCandidateGeneratorCommand(commandOptions);
      console.log(`Validated ${stage}/${candidateId}.png`);
    },
  });

  console.log(`Generated candidate batch: ${result.candidateDir}`);
  if (!options.review) {
    console.log(
      `Review with: npm run assets:review:skin -- --monster ${options.monsterSlug} --skin ${options.skinId} --candidates ${result.candidateDir}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
