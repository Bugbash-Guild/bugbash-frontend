const aliasBackendPaths = new Map<string, string>([
    ['github/app/installation', '/api/v1/github/app/installation'],
    ['hero/acknowledge', '/api/v1/hero/acknowledge'],
    ['hero/activities', '/api/v1/hero/activities'],
    ['hero/partner', '/api/v1/hero/partner'],
    ['hero/stats', '/api/v1/hero/stats'],
    ['leaderboard', '/api/v1/leaderboard'],
    ['monsters/all', '/api/monsters'],
]);

export const resolveBackendPath = (pathSegments: string[]): string => {
    const frontendPath = pathSegments.join('/');
    return aliasBackendPaths.get(frontendPath) ?? `/api/${frontendPath}`;
};
