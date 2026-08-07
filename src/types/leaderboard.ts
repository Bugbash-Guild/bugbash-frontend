export type LeaderboardEntry = {
    rank: number;
    heroId: string;
    githubLogin: string | null;
    level: number;
    totalExperience: number;
    streakDays: number;
};

/**
 * GET /api/leaderboard/me（自分の順位）。404 = Hero 不在。
 * 一覧と違い streakDays は含まれない — 無い値は表示側でも出さない。
 */
export type LeaderboardMe = {
    rank: number;
    level: number;
    experience: number;
    githubLogin: string | null;
    totalHeroes: number;
};
