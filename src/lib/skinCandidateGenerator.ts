import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import type { AppendixASkinStage } from "./gameAssetSkinValidation";

type CreateSkinCandidateGeneratorRequestOptions = {
  candidateId: string;
  generatedCandidateImages?: Partial<Record<AppendixASkinStage, string>>;
  monsterSlug: string;
  prompt: string;
  referenceImages: Record<AppendixASkinStage, string>;
  skinId: string;
  stage: AppendixASkinStage;
  theme: string;
};

export type SkinCandidateGeneratorRequest = {
  schemaVersion: 1;
  candidateId: string;
  generatedCandidateImagesByStage: Partial<Record<AppendixASkinStage, string>>;
  monsterSlug: string;
  output: {
    alpha: true;
    format: "png";
    height: 1254;
    width: 1254;
  };
  primaryReferenceImage: string;
  prompt: string;
  referenceImagesByStage: Record<AppendixASkinStage, string>;
  skinId: string;
  stage: AppendixASkinStage;
  theme: string;
};

export type RunSkinCandidateGeneratorCommandOptions = {
  args: string[];
  command: string;
  outputPath: string;
  request: SkinCandidateGeneratorRequest;
};

const MAX_STDERR_LENGTH = 16_384;

export function createSkinCandidateGeneratorRequest({
  candidateId,
  generatedCandidateImages = {},
  monsterSlug,
  prompt,
  referenceImages,
  skinId,
  stage,
  theme,
}: CreateSkinCandidateGeneratorRequestOptions): SkinCandidateGeneratorRequest {
  return {
    schemaVersion: 1,
    candidateId,
    generatedCandidateImagesByStage: { ...generatedCandidateImages },
    monsterSlug,
    output: {
      alpha: true,
      format: "png",
      height: 1254,
      width: 1254,
    },
    primaryReferenceImage: referenceImages[stage],
    prompt,
    referenceImagesByStage: referenceImages,
    skinId,
    stage,
    theme,
  };
}

export async function runSkinCandidateGeneratorCommand({
  args,
  command,
  outputPath,
  request,
}: RunSkinCandidateGeneratorCommandOptions): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const child = spawn(command, args, {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    if (stderr.length < MAX_STDERR_LENGTH) {
      stderr += chunk.slice(0, MAX_STDERR_LENGTH - stderr.length);
    }
  });
  child.stdin.on("error", () => undefined);
  child.stdin.end(JSON.stringify(request));

  const exit = new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const reason =
        code === null ? `signal ${signal ?? "unknown"}` : `code ${code}`;
      const detail = stderr.trim();
      reject(
        new Error(
          `Skin generator command exited with ${reason}${detail ? `: ${detail}` : ""}`,
        ),
      );
    });
  });

  try {
    await Promise.all([
      pipeline(child.stdout, createWriteStream(outputPath, { flags: "wx" })),
      exit,
    ]);
  } catch (error) {
    child.kill();
    await rm(outputPath, { force: true });
    throw error;
  }
}
