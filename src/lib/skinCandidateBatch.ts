import { createHash } from "node:crypto";
import path from "node:path";

import {
  APPENDIX_A_SKIN_STAGES,
  type AppendixASkinStage,
} from "./gameAssetSkinValidation";
import { buildSkinCandidatePrompt } from "./skinCandidatePrompt";

type PlanSkinCandidateBatchOptions = {
  candidateCount: number;
  candidateDir: string;
  houseStyleLock: string;
  monsterSlug: string;
  skinId: string;
  sourceDir: string;
  theme: string;
};

export type SkinCandidateBatchJob = {
  candidateId: string;
  outputPath: string;
  prompt: string;
  stage: AppendixASkinStage;
};

export type SkinCandidateBatchPlan = {
  candidateCount: number;
  candidateDir: string;
  jobs: SkinCandidateBatchJob[];
  monsterSlug: string;
  referenceImages: Record<AppendixASkinStage, string>;
  skinId: string;
  theme: string;
};

const LOWER_KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertLowerKebabCase(value: string, label: string) {
  if (!LOWER_KEBAB_CASE.test(value)) {
    throw new Error(`${label} must be lower kebab-case for Appendix A paths`);
  }
}

function isSameOrNestedPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

export function deriveSkinIdFromTheme(theme: string): string {
  const normalized = theme
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (normalized) return normalized;

  const digest = createHash("sha256").update(theme.trim()).digest("hex");
  return `theme-${digest.slice(0, 10)}`;
}

export function planSkinCandidateBatch({
  candidateCount,
  candidateDir,
  houseStyleLock,
  monsterSlug,
  skinId,
  sourceDir,
  theme,
}: PlanSkinCandidateBatchOptions): SkinCandidateBatchPlan {
  assertLowerKebabCase(monsterSlug, "monsterSlug");
  assertLowerKebabCase(skinId, "skinId");
  if (
    !Number.isInteger(candidateCount) ||
    candidateCount < 1 ||
    candidateCount > 9
  ) {
    throw new Error("candidateCount must be an integer from 1 to 9");
  }
  if (!theme.trim()) throw new Error("theme must not be empty");
  if (!houseStyleLock.trim())
    throw new Error("houseStyleLock must not be empty");

  const resolvedCandidateDir = path.resolve(candidateDir);
  const resolvedSourceDir = path.resolve(sourceDir);
  if (
    isSameOrNestedPath(resolvedSourceDir, resolvedCandidateDir) ||
    isSameOrNestedPath(resolvedCandidateDir, resolvedSourceDir)
  ) {
    throw new Error(
      "Candidate output must not overlap the game asset source directory",
    );
  }

  const referenceImages = Object.fromEntries(
    APPENDIX_A_SKIN_STAGES.map((stage) => [
      stage,
      path.join(resolvedSourceDir, "monsters", monsterSlug, `${stage}.png`),
    ]),
  ) as Record<AppendixASkinStage, string>;
  const jobs = APPENDIX_A_SKIN_STAGES.flatMap((stage) =>
    Array.from({ length: candidateCount }, (_, index) => {
      const candidateId = `candidate-${String(index + 1).padStart(2, "0")}`;
      return {
        candidateId,
        outputPath: path.join(
          resolvedCandidateDir,
          stage,
          `${candidateId}.png`,
        ),
        prompt: buildSkinCandidatePrompt({
          candidateNumber: index + 1,
          houseStyleLock,
          monsterSlug,
          stage,
          theme,
        }),
        stage,
      };
    }),
  );

  return {
    candidateCount,
    candidateDir: resolvedCandidateDir,
    jobs,
    monsterSlug,
    referenceImages,
    skinId,
    theme,
  };
}
