// src/types/hero.ts
export type PublicShowcaseMonster = {
    slug: string;
    name: string;
    emoji: string;
    rarity: string;
    level: number;
    awakeningState: string;
    formStage: string;
    equippedSkinId: string | null;
    equippedSkinLineName: string | null;
    equippedSkinTier: string | null;
    masteryLevel: number;
    assetUrl: string | null;
    artworkByStage: Record<string, string>;
};

export type PublicApexSkin = {
    skinId: string;
    monsterSlug: string;
    lineName: string;
    tier: string;
    masteryLevel: number;
    assetBasePath: string;
};

export type PublicHeroProfile = {
    heroId: string;
    githubLogin: string | null;
    level: number;
    totalExperience: number;
    currentLevelExperience: number;
    experienceForNextLevel: number;
    experienceToNextLevel: number;
    progressRatio: number;
    streakDays: number;
    totalPrsMerged: number;
    showcase: PublicShowcaseMonster[];
    apex: PublicApexSkin[];
};

export type Hero = {
    level: number;
    totalExperience: number;
    currentLevelExperience: number;
    experienceForNextLevel: number;
    experienceToNextLevel: number;
    progressRatio: number;
    partnerId: string | null;
    guildCoinBalance: number;
    streakDays: number;
    totalPrsMerged: number;
    hasGithubAppInstalled: boolean;
};
