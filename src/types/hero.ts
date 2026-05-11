// src/types/hero.ts
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
};
