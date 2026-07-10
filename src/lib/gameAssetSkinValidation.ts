export const APPENDIX_A_SKIN_STAGES = [
  "base",
  "evo",
  "awakened",
  "awakened-final",
  "berserk",
  "berserk-final",
] as const;

export type AppendixASkinStage = (typeof APPENDIX_A_SKIN_STAGES)[number];

export type SkinAssetImageMetadata = {
  format?: string;
  width?: number;
  height?: number;
  hasAlpha?: boolean;
};

type SkinAssetDescriptor = {
  monsterSlug: string;
  skinId: string;
  stage: AppendixASkinStage;
};

const ASSET_FOLDER_NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";
const APPENDIX_A_SKIN_PATH = new RegExp(
  `^monsters/(${ASSET_FOLDER_NAME})/skins/(${ASSET_FOLDER_NAME})/(${APPENDIX_A_SKIN_STAGES.join(
    "|",
  )})\\.png$`,
);
const SKIN_PATH_PREFIX = /^monsters\/[^/]+\/skins\//;
const REQUIRED_SKIN_SIZE = 1254;

function toPosixPath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

function parseSkinAssetPath(inputKey: string): SkinAssetDescriptor | null {
  const normalized = toPosixPath(inputKey);
  const match = APPENDIX_A_SKIN_PATH.exec(normalized);
  if (!match) return null;

  return {
    monsterSlug: match[1],
    skinId: match[2],
    stage: match[3] as AppendixASkinStage,
  };
}

export function isAppendixASkinAssetInputKey(inputKey: string): boolean {
  return parseSkinAssetPath(inputKey) !== null;
}

function isSkinPath(inputKey: string): boolean {
  return SKIN_PATH_PREFIX.test(toPosixPath(inputKey));
}

function appendixAPathError(inputKey: string): Error {
  return new Error(
    `Appendix A skin path required for ${inputKey}: monsters/{slug}/skins/{skinId}/{stage}.png, ` +
      `lower kebab-case slug/skinId, stage=${APPENDIX_A_SKIN_STAGES.join("/")}, png only`,
  );
}

export function validateSkinAssetInputKeys(inputKeys: string[]) {
  const stagesBySkin = new Map<string, Set<AppendixASkinStage>>();

  for (const inputKey of inputKeys) {
    if (!isSkinPath(inputKey)) continue;

    const descriptor = parseSkinAssetPath(inputKey);
    if (!descriptor) throw appendixAPathError(inputKey);

    const skinKey = `${descriptor.monsterSlug}/skins/${descriptor.skinId}`;
    const stages = stagesBySkin.get(skinKey) ?? new Set<AppendixASkinStage>();
    stages.add(descriptor.stage);
    stagesBySkin.set(skinKey, stages);
  }

  for (const [skinKey, stages] of stagesBySkin) {
    const missingStages = APPENDIX_A_SKIN_STAGES.filter(
      (stage) => !stages.has(stage),
    );
    if (missingStages.length > 0) {
      throw new Error(
        `Skin asset set monsters/${skinKey} is missing required stages: ${missingStages.join(
          ", ",
        )}`,
      );
    }
  }
}

export function assertSkinAssetImageMetadata(
  inputKey: string,
  metadata: SkinAssetImageMetadata,
) {
  const descriptor = parseSkinAssetPath(inputKey);
  if (!descriptor) {
    if (isSkinPath(inputKey)) throw appendixAPathError(inputKey);
    return;
  }

  if (
    metadata.format !== "png" ||
    metadata.width !== REQUIRED_SKIN_SIZE ||
    metadata.height !== REQUIRED_SKIN_SIZE ||
    metadata.hasAlpha !== true
  ) {
    throw new Error(
      `Skin asset ${inputKey} must be PNG 1254x1254 RGBA for Appendix A`,
    );
  }
}
