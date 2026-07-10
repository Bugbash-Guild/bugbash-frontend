import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  APPENDIX_A_SKIN_STAGES,
  type AppendixASkinStage,
  assertSkinAssetImageMetadata,
  type SkinAssetImageMetadata,
} from "./gameAssetSkinValidation";
import type {
  SkinCandidateBatchJob,
  SkinCandidateBatchPlan,
} from "./skinCandidateBatch";
import { withGameAssetPublicationLock } from "./skinAssetPublication";

type GenerateSkinCandidateBatchOptions = {
  force: boolean;
  generate: (job: SkinCandidateBatchJob, outputPath: string) => Promise<void>;
  inspectImage?: (filePath: string) => Promise<SkinAssetImageMetadata>;
  plan: SkinCandidateBatchPlan;
};

export type SkinCandidateBatchResult = {
  candidateDir: string;
  generatedFiles: string[];
  manifestPath: string;
};

async function inspectWithSharp(
  filePath: string,
): Promise<SkinAssetImageMetadata> {
  return sharp(filePath).metadata();
}

function isSameOrNestedPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function errorCode(error: unknown): string | null {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}

function reviewValidationKey(stage: AppendixASkinStage): string {
  return `monsters/reference/skins/generated/${stage}.png`;
}

function assertReferenceImageMetadata(
  filePath: string,
  metadata: SkinAssetImageMetadata,
) {
  if (
    metadata.format !== "png" ||
    !Number.isInteger(metadata.width) ||
    (metadata.width ?? 0) < 1 ||
    !Number.isInteger(metadata.height) ||
    (metadata.height ?? 0) < 1
  ) {
    throw new Error(
      `Monster reference image must be a readable PNG: ${filePath}`,
    );
  }
}

function stagedOutputPath(
  candidateDir: string,
  stagingDir: string,
  outputPath: string,
): string {
  if (!isSameOrNestedPath(candidateDir, outputPath)) {
    throw new Error(
      `Candidate output escapes the batch directory: ${outputPath}`,
    );
  }
  return path.join(stagingDir, path.relative(candidateDir, outputPath));
}

export async function generateSkinCandidateBatch({
  force,
  generate,
  inspectImage = inspectWithSharp,
  plan,
}: GenerateSkinCandidateBatchOptions): Promise<SkinCandidateBatchResult> {
  const candidateDir = path.resolve(plan.candidateDir);
  if (candidateDir === path.parse(candidateDir).root) {
    throw new Error("Candidate output directory must not be a filesystem root");
  }

  return withGameAssetPublicationLock(
    {
      label: `${plan.monsterSlug}/${plan.skinId} candidate generation`,
      publicationKey: `bugbash-skin-candidate-batch-v1:${candidateDir}`,
    },
    async () => {
      if (!force && (await pathExists(candidateDir))) {
        throw new Error(`Skin candidate batch already exists: ${candidateDir}`);
      }

      for (const stage of APPENDIX_A_SKIN_STAGES) {
        const referencePath = plan.referenceImages[stage];
        try {
          await access(referencePath);
        } catch (error) {
          if (errorCode(error) !== "ENOENT") throw error;
          throw new Error(
            `Monster reference image is missing: ${referencePath}`,
          );
        }
        assertReferenceImageMetadata(
          referencePath,
          await inspectImage(referencePath),
        );
      }

      const parentDir = path.dirname(candidateDir);
      await mkdir(parentDir, { recursive: true });
      let stagingDir: string | null = await mkdtemp(
        path.join(parentDir, `.${path.basename(candidateDir)}-batch-`),
      );
      let backupDir: string | null = null;

      try {
        for (const job of plan.jobs) {
          const outputPath = stagedOutputPath(
            candidateDir,
            stagingDir,
            job.outputPath,
          );
          await mkdir(path.dirname(outputPath), { recursive: true });
          await generate(job, outputPath);
          assertSkinAssetImageMetadata(
            reviewValidationKey(job.stage),
            await inspectImage(outputPath),
          );
        }

        const manifest = {
          schemaVersion: 1,
          candidateCount: plan.candidateCount,
          generatedAt: new Date().toISOString(),
          jobs: plan.jobs.map((job) => ({
            candidateId: job.candidateId,
            file: path
              .relative(candidateDir, job.outputPath)
              .split(path.sep)
              .join("/"),
            promptSha256: createHash("sha256").update(job.prompt).digest("hex"),
            stage: job.stage,
          })),
          monsterSlug: plan.monsterSlug,
          skinId: plan.skinId,
          theme: plan.theme,
        };
        await writeFile(
          path.join(stagingDir, ".batch.json"),
          `${JSON.stringify(manifest, null, 2)}\n`,
        );

        const targetExists = await pathExists(candidateDir);
        if (targetExists && !force) {
          throw new Error(
            `Skin candidate batch already exists: ${candidateDir}`,
          );
        }
        if (targetExists) {
          backupDir = `${candidateDir}.backup-${randomUUID()}`;
          await rename(candidateDir, backupDir);
        }

        try {
          await rename(stagingDir, candidateDir);
          stagingDir = null;
        } catch (installError) {
          if (backupDir) {
            const previousBatch = backupDir;
            backupDir = null;
            try {
              await rename(previousBatch, candidateDir);
            } catch (restoreError) {
              backupDir = previousBatch;
              throw new AggregateError(
                [installError, restoreError],
                `Candidate batch replacement failed; previous batch remains at ${previousBatch}`,
              );
            }
          }
          throw installError;
        }

        if (backupDir) {
          await rm(backupDir, { force: true, recursive: true });
          backupDir = null;
        }

        return {
          candidateDir,
          generatedFiles: plan.jobs.map((job) => job.outputPath),
          manifestPath: path.join(candidateDir, ".batch.json"),
        };
      } finally {
        if (stagingDir) {
          await rm(stagingDir, { force: true, recursive: true });
        }
      }
    },
  );
}
