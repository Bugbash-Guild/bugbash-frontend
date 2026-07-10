import path from "node:path";

import { deriveSkinIdFromTheme } from "./skinCandidateBatch";

export type SkinCandidateBatchCliOptions = {
  candidateCount: number;
  candidateDir: string;
  force: boolean;
  generatorArgs: string[];
  generatorCommand: string;
  monsterSlug: string;
  openReview: boolean;
  port: number;
  publish: boolean;
  review: boolean;
  skinId: string;
  sourceDir: string;
  styleGuidePath: string;
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

function readRepeatedCliOption(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flag) continue;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    values.push(value);
  }
  return values;
}

function parseGeneratorArgs(value: string | undefined): string[] {
  if (!value) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("BUGBASH_SKIN_GENERATOR_ARGS_JSON must be a JSON array");
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((entry) => typeof entry === "string")
  ) {
    throw new Error(
      "BUGBASH_SKIN_GENERATOR_ARGS_JSON must be a JSON array of strings",
    );
  }
  return parsed;
}

export function parseSkinCandidateBatchCliOptions(
  args: string[],
  cwd = process.cwd(),
  env: Record<string, string | undefined> = process.env,
): SkinCandidateBatchCliOptions {
  const monsterSlug = requireCliOption(args, "--monster");
  const theme = requireCliOption(args, "--theme").trim();
  if (!theme) throw new Error("--theme must not be empty");

  const skinId = readCliOption(args, "--skin") ?? deriveSkinIdFromTheme(theme);
  assertLowerKebabCase(monsterSlug, "monsterSlug");
  assertLowerKebabCase(skinId, "skinId");

  const candidateCount = Number(readCliOption(args, "--count") ?? "3");
  if (
    !Number.isInteger(candidateCount) ||
    candidateCount < 1 ||
    candidateCount > 9
  ) {
    throw new Error("--count must be an integer from 1 to 9");
  }

  const generatorCommand =
    readCliOption(args, "--generator") ??
    env.BUGBASH_SKIN_GENERATOR_COMMAND?.trim();
  if (!generatorCommand) {
    throw new Error(
      "--generator or BUGBASH_SKIN_GENERATOR_COMMAND is required",
    );
  }

  const port = Number(readCliOption(args, "--port") ?? "4173");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("--port must be an integer from 1024 to 65535");
  }

  const sourceDir = path.resolve(
    cwd,
    readCliOption(args, "--source") ?? "game-assets/source",
  );
  const candidateDir = path.resolve(
    cwd,
    readCliOption(args, "--output") ??
      path.join("generated/skins", monsterSlug, skinId),
  );
  if (
    isSameOrNestedPath(sourceDir, candidateDir) ||
    isSameOrNestedPath(candidateDir, sourceDir)
  ) {
    throw new Error(
      "Candidate output must not overlap the game asset source directory",
    );
  }

  return {
    candidateCount,
    candidateDir,
    force: args.includes("--force"),
    generatorArgs: [
      ...parseGeneratorArgs(env.BUGBASH_SKIN_GENERATOR_ARGS_JSON),
      ...readRepeatedCliOption(args, "--generator-arg"),
    ],
    generatorCommand,
    monsterSlug,
    openReview: !args.includes("--no-open"),
    port,
    publish: !args.includes("--no-upload"),
    review: !args.includes("--no-review"),
    skinId,
    sourceDir,
    styleGuidePath: path.resolve(
      cwd,
      readCliOption(args, "--style-guide") ?? "docs/monster-style-guide.md",
    ),
    theme,
  };
}
