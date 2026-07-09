import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import {
  APPENDIX_A_SKIN_STAGES,
  type AppendixASkinStage,
  validateSkinAssetInputKeys,
} from "./gameAssetSkinValidation";

type SkinAssetIntakeOptions = {
  candidateDir: string;
  monsterSlug: string;
  skinId: string;
  sourceDir: string;
};

export type StageSkinAssetIntakeOptions = SkinAssetIntakeOptions & {
  dryRun?: boolean;
  force: boolean;
};

export type SkinAssetIntakeCopy = {
  stage: AppendixASkinStage;
  inputKey: string;
  fromPath: string;
  toPath: string;
};

export type SkinAssetIntakePlan = {
  assetBasePath: string;
  copies: SkinAssetIntakeCopy[];
};

export type SkinAssetIntakeResult = SkinAssetIntakePlan & {
  stagedKeys: string[];
};

const LOWER_KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertLowerKebabCase(value: string, label: string) {
  if (!LOWER_KEBAB_CASE.test(value)) {
    throw new Error(`${label} must be lower kebab-case for Appendix A paths`);
  }
}

export function planSkinAssetIntake({
  candidateDir,
  monsterSlug,
  skinId,
  sourceDir,
}: SkinAssetIntakeOptions): SkinAssetIntakePlan {
  assertLowerKebabCase(monsterSlug, "monsterSlug");
  assertLowerKebabCase(skinId, "skinId");

  const assetBasePath = `monsters/${monsterSlug}/skins/${skinId}`;
  const copies = APPENDIX_A_SKIN_STAGES.map((stage) => ({
    stage,
    inputKey: `${assetBasePath}/${stage}.png`,
    fromPath: path.join(candidateDir, `${stage}.png`),
    toPath: path.join(sourceDir, assetBasePath, `${stage}.png`),
  }));

  validateSkinAssetInputKeys(copies.map((copy) => copy.inputKey));

  return {
    assetBasePath,
    copies,
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}

export async function stageSkinAssetIntake(
  options: StageSkinAssetIntakeOptions,
): Promise<SkinAssetIntakeResult> {
  const plan = planSkinAssetIntake(options);

  const missingSources = [];
  for (const copy of plan.copies) {
    if (!(await pathExists(copy.fromPath))) missingSources.push(copy.fromPath);
  }

  if (missingSources.length > 0) {
    throw new Error(
      `Skin asset candidate file is missing: ${missingSources.join(", ")}`,
    );
  }

  if (!options.force) {
    const existingDestinations = [];
    for (const copy of plan.copies) {
      if (await pathExists(copy.toPath)) existingDestinations.push(copy.toPath);
    }

    if (existingDestinations.length > 0) {
      throw new Error(
        `Skin asset destination already exists: ${existingDestinations.join(", ")}`,
      );
    }
  }

  if (!options.dryRun) {
    for (const copy of plan.copies) {
      await mkdir(path.dirname(copy.toPath), { recursive: true });
      await copyFile(copy.fromPath, copy.toPath);
    }
  }

  return {
    ...plan,
    stagedKeys: plan.copies.map((copy) => copy.inputKey),
  };
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

export function parseSkinAssetIntakeCliOptions(
  args: string[],
  cwd = process.cwd(),
): StageSkinAssetIntakeOptions {
  return {
    candidateDir: path.resolve(cwd, requireCliOption(args, "--from")),
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    monsterSlug: requireCliOption(args, "--monster"),
    skinId: requireCliOption(args, "--skin"),
    sourceDir: path.resolve(
      cwd,
      readCliOption(args, "--source") ?? "game-assets/source",
    ),
  };
}
