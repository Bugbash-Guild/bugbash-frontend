import { readFile } from "node:fs/promises";

import type { SkinAssetImageMetadata } from "./gameAssetSkinValidation";
import { type AppendixASkinStage } from "./gameAssetSkinValidation";
import { planSkinCandidateBatch } from "./skinCandidateBatch";
import type { SkinCandidateBatchCliOptions } from "./skinCandidateBatchCli";
import {
  generateSkinCandidateBatch,
  type SkinCandidateBatchResult,
} from "./skinCandidateBatchGeneration";
import {
  createSkinCandidateGeneratorRequest,
  runSkinCandidateGeneratorCommand,
  type RunSkinCandidateGeneratorCommandOptions,
} from "./skinCandidateGenerator";
import { extractHouseStyleLock } from "./skinCandidatePrompt";

type SkinCandidateBatchWorkflowDependencies = {
  inspectImage?: (filePath: string) => Promise<SkinAssetImageMetadata>;
  launchReview: (args: string[]) => Promise<void>;
  readStyleGuide?: (filePath: string) => Promise<string>;
  runGenerator?: (
    options: RunSkinCandidateGeneratorCommandOptions,
  ) => Promise<void>;
};

const STAGE_ANCESTORS: Record<AppendixASkinStage, AppendixASkinStage[]> = {
  base: [],
  evo: ["base"],
  awakened: ["base", "evo"],
  "awakened-final": ["base", "evo", "awakened"],
  berserk: ["base", "evo"],
  "berserk-final": ["base", "evo", "berserk"],
};

export function buildSkinCandidateReviewArgs(
  options: SkinCandidateBatchCliOptions,
): string[] {
  const args = [
    "run",
    "assets:review:skin",
    "--",
    "--monster",
    options.monsterSlug,
    "--skin",
    options.skinId,
    "--candidates",
    options.candidateDir,
    "--source",
    options.sourceDir,
    "--port",
    String(options.port),
  ];
  if (options.force) args.push("--force");
  if (!options.publish) args.push("--no-upload");
  if (options.openReview) args.push("--open");
  return args;
}

export async function runSkinCandidateBatchWorkflow(
  options: SkinCandidateBatchCliOptions,
  {
    inspectImage,
    launchReview,
    readStyleGuide = (filePath) => readFile(filePath, "utf8"),
    runGenerator = runSkinCandidateGeneratorCommand,
  }: SkinCandidateBatchWorkflowDependencies,
): Promise<SkinCandidateBatchResult> {
  const styleGuide = await readStyleGuide(options.styleGuidePath);
  const houseStyleLock = extractHouseStyleLock(styleGuide);
  const plan = planSkinCandidateBatch({
    candidateCount: options.candidateCount,
    candidateDir: options.candidateDir,
    houseStyleLock,
    monsterSlug: options.monsterSlug,
    skinId: options.skinId,
    sourceDir: options.sourceDir,
    theme: options.theme,
  });
  const generatedImages = new Map<
    string,
    Partial<Record<AppendixASkinStage, string>>
  >();

  const result = await generateSkinCandidateBatch({
    force: options.force,
    generate: async (job, outputPath) => {
      const candidateImages = generatedImages.get(job.candidateId) ?? {};
      const generatedCandidateImages = Object.fromEntries(
        STAGE_ANCESTORS[job.stage]
          .filter((stage) => candidateImages[stage])
          .map((stage) => [stage, candidateImages[stage] as string]),
      ) as Partial<Record<AppendixASkinStage, string>>;
      await runGenerator({
        args: options.generatorArgs,
        command: options.generatorCommand,
        outputPath,
        request: createSkinCandidateGeneratorRequest({
          candidateId: job.candidateId,
          generatedCandidateImages,
          monsterSlug: options.monsterSlug,
          prompt: job.prompt,
          referenceImages: plan.referenceImages,
          skinId: options.skinId,
          stage: job.stage,
          theme: options.theme,
        }),
      });
      candidateImages[job.stage] = outputPath;
      generatedImages.set(job.candidateId, candidateImages);
    },
    inspectImage,
    plan,
  });

  if (options.review) {
    await launchReview(buildSkinCandidateReviewArgs(options));
  }
  return result;
}
