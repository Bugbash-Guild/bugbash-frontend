import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { isAppendixASkinAssetInputKey } from "./gameAssetSkinValidation";

export const SKIN_DERIVATIVE_PROFILES = {
  card: { height: 640, width: 640 },
  ogp: { height: 630, width: 1200 },
  widget: { height: 256, width: 256 },
} as const;

export type SkinDerivativeProfile = keyof typeof SKIN_DERIVATIVE_PROFILES;

export type SkinAssetDerivativePlan = {
  outputKey: string;
  profile: SkinDerivativeProfile;
};

type GenerateSkinAssetDerivativesOptions = {
  inputKey: string;
  inputPath: string;
  outDir: string;
  quality: number;
};

function toWebpKey(inputKey: string): string {
  return `${inputKey.slice(0, -".png".length)}.webp`;
}

export function planSkinAssetDerivatives(
  inputKey: string,
): SkinAssetDerivativePlan[] {
  if (!isAppendixASkinAssetInputKey(inputKey)) return [];

  return (Object.keys(SKIN_DERIVATIVE_PROFILES) as SkinDerivativeProfile[]).map(
    (profile) => ({
      outputKey: `derived/skins/${profile}/${toWebpKey(inputKey)}`,
      profile,
    }),
  );
}

export async function generateSkinAssetDerivatives({
  inputKey,
  inputPath,
  outDir,
  quality,
}: GenerateSkinAssetDerivativesOptions): Promise<SkinAssetDerivativePlan[]> {
  const plans = planSkinAssetDerivatives(inputKey);

  for (const plan of plans) {
    const profile = SKIN_DERIVATIVE_PROFILES[plan.profile];
    const outputPath = path.join(outDir, plan.outputKey);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(inputPath)
      .ensureAlpha()
      .resize(profile.width, profile.height, {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        fit: "contain",
      })
      .webp({ effort: 5, quality })
      .toFile(outputPath);
  }

  return plans;
}
