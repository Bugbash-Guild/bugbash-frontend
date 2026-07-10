import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";

import {
  APPENDIX_A_SKIN_STAGES,
  type AppendixASkinStage,
  assertSkinAssetImageMetadata,
  type SkinAssetImageMetadata,
} from "./gameAssetSkinValidation";
import {
  planSkinAssetIntake,
  type SkinAssetIntakeResult,
} from "./skinAssetIntake";
import {
  stageApprovedSkinAtomically,
  withSkinPublicationLock,
} from "./skinAssetPublication";

export type SkinReviewCandidate = {
  filePath: string;
  id: string;
  stage: AppendixASkinStage;
};

export type SkinCandidateCatalogue = {
  byStage: Record<AppendixASkinStage, SkinReviewCandidate[]>;
  candidateDir: string;
};

type DiscoverSkinCandidatesOptions = {
  candidateDir: string;
  inspectImage?: (filePath: string) => Promise<SkinAssetImageMetadata>;
};

export type SkinStageSelections = Partial<Record<AppendixASkinStage, string>>;

export type SkinSelectionPlanEntry = {
  candidate: SkinReviewCandidate;
  stage: AppendixASkinStage;
};

type FinalizeSkinSelectionOptions = {
  catalogue: SkinCandidateCatalogue;
  force: boolean;
  inspectImage?: (filePath: string) => Promise<SkinAssetImageMetadata>;
  monsterSlug: string;
  publish: boolean;
  runBuild: () => Promise<void>;
  runUpload: () => Promise<void>;
  selections: SkinStageSelections;
  skinId: string;
  sourceDir: string;
};

export type SkinReviewCliOptions = {
  candidateDir: string;
  force: boolean;
  monsterSlug: string;
  port: number;
  publish: boolean;
  skinId: string;
  sourceDir: string;
};

const CANDIDATE_FILE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/;

async function inspectWithSharp(
  filePath: string,
): Promise<SkinAssetImageMetadata> {
  return sharp(filePath).metadata();
}

export async function discoverSkinCandidates({
  candidateDir,
  inspectImage = inspectWithSharp,
}: DiscoverSkinCandidatesOptions): Promise<SkinCandidateCatalogue> {
  const byStage = {} as Record<AppendixASkinStage, SkinReviewCandidate[]>;
  const missingStages: AppendixASkinStage[] = [];

  for (const stage of APPENDIX_A_SKIN_STAGES) {
    const stageDir = path.join(candidateDir, stage);
    const entries = await readdir(stageDir, { withFileTypes: true }).catch(
      () => [],
    );
    const candidates = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          !entry.name.startsWith(".") &&
          CANDIDATE_FILE_NAME.test(entry.name),
      )
      .map((entry) => ({
        filePath: path.join(stageDir, entry.name),
        id: entry.name,
        stage,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));

    if (candidates.length === 0) {
      missingStages.push(stage);
      byStage[stage] = [];
      continue;
    }

    for (const candidate of candidates) {
      assertSkinAssetImageMetadata(
        `monsters/review/skins/review/${stage}.png`,
        await inspectImage(candidate.filePath),
      );
    }
    byStage[stage] = candidates;
  }

  if (missingStages.length > 0) {
    throw new Error(
      `Candidate batch is missing candidates for stages: ${missingStages.join(", ")}`,
    );
  }

  return { byStage, candidateDir };
}

export function planSkinSelection(
  catalogue: SkinCandidateCatalogue,
  selections: SkinStageSelections,
): SkinSelectionPlanEntry[] {
  return APPENDIX_A_SKIN_STAGES.map((stage) => {
    const selectedId = selections[stage];
    if (!selectedId) {
      throw new Error(`A candidate selection is required for stage: ${stage}`);
    }

    const candidate = catalogue.byStage[stage].find(
      (entry) => entry.id === selectedId,
    );
    if (!candidate) {
      throw new Error(
        `Selected unknown candidate for stage ${stage}: ${selectedId}`,
      );
    }
    return { candidate, stage };
  });
}

export async function finalizeSkinSelection({
  catalogue,
  force,
  inspectImage = inspectWithSharp,
  monsterSlug,
  publish,
  runBuild,
  runUpload,
  selections,
  skinId,
  sourceDir,
}: FinalizeSkinSelectionOptions): Promise<SkinAssetIntakeResult> {
  const plan = planSkinSelection(catalogue, selections);
  return withSkinPublicationLock(
    { monsterSlug, skinId, sourceDir },
    async () => {
      const approvedDir = await mkdtemp(
        path.join(os.tmpdir(), "bugbash-approved-skin-"),
      );

      try {
        await Promise.all(
          plan.map(({ candidate, stage }) =>
            copyFile(
              candidate.filePath,
              path.join(approvedDir, `${stage}.png`),
            ),
          ),
        );
        for (const { stage } of plan) {
          assertSkinAssetImageMetadata(
            `monsters/${monsterSlug}/skins/${skinId}/${stage}.png`,
            await inspectImage(path.join(approvedDir, `${stage}.png`)),
          );
        }
        const result = await stageApprovedSkinAtomically({
          approvedDir,
          force,
          monsterSlug,
          skinId,
          sourceDir,
        });
        await runBuild();
        if (publish) await runUpload();
        return result;
      } finally {
        await rm(approvedDir, { force: true, recursive: true });
      }
    },
  );
}

function readCliOption(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function requireCliOption(args: string[], flag: string): string {
  const value = readCliOption(args, flag);
  if (!value) throw new Error(`${flag} is required`);
  return value;
}

export function parseSkinReviewCliOptions(
  args: string[],
  cwd = process.cwd(),
): SkinReviewCliOptions {
  const monsterSlug = requireCliOption(args, "--monster");
  const skinId = requireCliOption(args, "--skin");
  const candidateDir = path.resolve(
    cwd,
    requireCliOption(args, "--candidates"),
  );
  const sourceDir = path.resolve(
    cwd,
    readCliOption(args, "--source") ?? "game-assets/source",
  );
  const port = Number(readCliOption(args, "--port") ?? "4173");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("--port must be an integer from 1024 to 65535");
  }

  planSkinAssetIntake({
    candidateDir,
    monsterSlug,
    skinId,
    sourceDir,
  });

  return {
    candidateDir,
    force: args.includes("--force"),
    monsterSlug,
    port,
    publish: !args.includes("--no-upload"),
    skinId,
    sourceDir,
  };
}
