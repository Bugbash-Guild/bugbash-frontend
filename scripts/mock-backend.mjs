/**
 * 画面確認用のモックバックエンド。
 *
 * 実データではない。**設計判断の根拠にしてはいけない**。
 * 目的は「BEを起動せずに全画面を実際に描画して目で見る」こと。
 * これを常設したのは、コードを読むだけでは出なかった不備が実際に出たため:
 *   - RewardModal が metadata 欠損で認証後の全ページを白画面にしていた（#143）
 *   - モバイルで全ページが横に溢れていた（#145）
 *   - 内部ラベル「PRESTIGE ZONE — 課金導線なし」がユーザーに露出（#143）
 *   - NaN% / NaN日前 / 図鑑の分母20固定（#143, #145）
 *
 * 使い方: npm run check:visual
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 8080);

const NAMES = [
  "ドラゴン", "フェニックス", "デーモン", "ヴァンパイア", "季節のデバッガ",
  "スライム", "狼", "ゾンビ", "ゴブリン", "コウモリ",
  "リントチック", "パーサーパップ", "リンタージョーイ", "ヒープハッチ", "スタックカブ",
  "キャッシュキット", "ミューテクスモス", "デッドロックドレイク", "レースコンディション", "セグフォルト",
];

const monsters = NAMES.map((name, i) => ({
  id: `m-${i + 1}`,
  slug: `monster-${i + 1}`,
  name,
  rarity: i < 3 ? "SSR" : i < 10 ? "SR" : i < 16 ? "R" : "N",
  attributeName: ["火", "水", "風", "土", "光", "闇"][i % 6],
  level: i < 8 ? 50 - i * 3 : 1 + (i % 12),
  formStage: i === 0 ? "AWAKENED_FINAL" : i === 1 ? "EVO" : "BASE",
  awakeningState: i === 0 ? "AWAKENED" : "NONE",
  isOwned: i < 13 && i < NAMES.length - 5,
  soulCount: 40 + i * 11,
  experience: 120,
  acquiredAt: new Date(Date.now() - i * 3600_000 * 7).toISOString(),
  assetUrl: null,
  emoji: "\u25c6",
  attribute: ["FIRE","WATER","WIND","EARTH","LIGHT","DARK"][i % 6],
  attributeEmoji: "\ud83d\udd25",
  ownedMonsterId: `om-${i + 1}`,
  // 末尾5体を召喚専用（未所持）にして、図鑑の入手経路表示を確認できるようにする
  prAcquirable: i < NAMES.length - 5,
}));

const routes = {
  "/api/auth/status": { authenticated: true, username: "haseryo0403", githubId: "haseryo0403" },
  "/api/v1/hero/stats": {
    heroId: "haseryo0403", githubId: "haseryo0403", name: "haseryo0403",
    level: 50, experience: 272, experienceToNextLevel: 1028, totalExperience: 12873,
    totalPrsMerged: 128, streakDays: 7, guildCoinBalance: 16475, runeBalance: 340,
    atk: 248, def: 164, luck: 32, hasGithubAppInstalled: true, isProfilePublic: true,
    partnerMonsterId: "m-1",
  },
  "/api/v1/hero/activities": {
    activities: [
    { id: "a1", activityType: "PR_MERGED", acknowledged: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      metadata: { prNumber: 142, repositoryFullName: "bugbash-guild/frontend", title: "feat: redesign monster collection page" },
      rewards: [
        { rewardType: "xp", quantity: 100, detail: { levelBefore: 50, levelAfter: 51 } },
        { rewardType: "monster", quantity: 1, detail: { name: "ドラゴン", emoji: "\u25c6", rarity: "SSR" } },
        { rewardType: "coin", quantity: 400, detail: null },
        { rewardType: "soul", quantity: 10, detail: null },
      ] },
    { id: "a2", activityType: "PR_MERGED", acknowledged: false,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      metadata: { prNumber: 89, repositoryFullName: "bugbash-guild/backend", title: "fix: race condition in XP gain" },
      rewards: [
        { rewardType: "xp", quantity: 100, detail: { levelBefore: 50, levelAfter: 50 } },
        { rewardType: "monster", quantity: 1, detail: { name: "狼", emoji: "\u25c6", rarity: "R" } },
        { rewardType: "coin", quantity: 100, detail: null },
        { rewardType: "soul", quantity: 10, detail: null },
      ] },
    { id: "a3", activityType: "PR_MERGED", acknowledged: false,
      createdAt: new Date(Date.now() - 93600000).toISOString(),
      metadata: { prNumber: 88, repositoryFullName: "bugbash-guild/backend", title: "feat: rarity weighting" },
      rewards: [
        { rewardType: "xp", quantity: 100, detail: { levelBefore: 49, levelAfter: 50 } },
        { rewardType: "monster", quantity: 1, detail: { name: "スライム", emoji: "\u25c6", rarity: "N" } },
        { rewardType: "coin", quantity: 100, detail: null },
        { rewardType: "soul", quantity: 10, detail: null },
      ] },
    { id: "a4", activityType: "PR_MERGED", acknowledged: false,
      createdAt: new Date(Date.now() - 180000000).toISOString(),
      metadata: { prNumber: 141, repositoryFullName: "bugbash-guild/frontend", title: "chore: bump dependencies" },
      rewards: [
        { rewardType: "xp", quantity: 100, detail: { levelBefore: 49, levelAfter: 49 } },
        { rewardType: "monster", quantity: 1, detail: { name: "ゾンビ", emoji: "\u25c6", rarity: "R" } },
        { rewardType: "coin", quantity: 100, detail: null },
        { rewardType: "soul", quantity: 10, detail: null },
      ] },
    { id: "a5", activityType: "PR_MERGED", acknowledged: false,
      createdAt: new Date(Date.now() - 266400000).toISOString(),
      metadata: { prNumber: 87, repositoryFullName: "bugbash-guild/backend", title: "feat: webhook signature validation" },
      rewards: [
        { rewardType: "xp", quantity: 100, detail: { levelBefore: 48, levelAfter: 49 } },
        { rewardType: "monster", quantity: 1, detail: { name: "フェニックス", emoji: "\u25c6", rarity: "SSR" } },
        { rewardType: "coin", quantity: 100, detail: null },
        { rewardType: "soul", quantity: 10, detail: null },
      ] },
    ],
    unreadCount: 0,
  },
  "/api/billing/wallet": { guildCoinBalance: 16475, runeBalance: 340, paidRuneBalance: 190, freeRuneBalance: 150 },
  "/api/billing/subscription": { plan: null, status: "NONE", currentPeriodEnd: null, cancelScheduled: false, entitled: false },
  "/api/billing/rune-products": [
    { id: "rune_starter", sku: "rune_starter", priceJpyTaxIncluded: 480, runeAmount: 170, bonusRune: 0, totalRune: 170, firstPurchaseOnly: true },
    { id: "rune_60", sku: "rune_60", priceJpyTaxIncluded: 240, runeAmount: 60, bonusRune: 0, totalRune: 60, firstPurchaseOnly: false },
    { id: "rune_160", sku: "rune_160", priceJpyTaxIncluded: 600, runeAmount: 160, bonusRune: 10, totalRune: 170, firstPurchaseOnly: false },
    { id: "rune_340", sku: "rune_340", priceJpyTaxIncluded: 1200, runeAmount: 340, bonusRune: 40, totalRune: 380, firstPurchaseOnly: false },
    { id: "rune_720", sku: "rune_720", priceJpyTaxIncluded: 2400, runeAmount: 720, bonusRune: 120, totalRune: 840, firstPurchaseOnly: false },
    { id: "rune_1850", sku: "rune_1850", priceJpyTaxIncluded: 6000, runeAmount: 1850, bonusRune: 450, totalRune: 2300, firstPurchaseOnly: false },
    { id: "rune_3900", sku: "rune_3900", priceJpyTaxIncluded: 12000, runeAmount: 3900, bonusRune: 1100, totalRune: 5000, firstPurchaseOnly: false },
  ],
  "/api/billing/orders": [],
  "/api/billing/age-verification": { ageGroup: "ADULT", monthlyLimitJpy: 50000 },
  "/api/monsters/all": { monsters },
  "/api/monsters/owned": { monsters: monsters.filter((m) => m.isOwned) },
  "/api/monsters": { monsters },
  "/api/hero/partner": { partnerMonsterId: "m-1" },
  "/api/summon/disclosure": {
    name: "通常召喚", description: "APIから提供される説明文。", currency: "GUILD_COIN",
    singlePullCost: 300, tenPullCost: 3000, hardPityPull: 80, softPityPull: 60,
    adventurerPassHardPityPull: 70, guaranteeType: "SR_OR_ABOVE",
    rates: [{ rarity: "SSR", percent: 3 }, { rarity: "SR", percent: 12 }, { rarity: "R", percent: 35 }, { rarity: "N", percent: 50 }],
    items: [], stockPolicy: null,
  },
  "/api/summon/limited/disclosure": {
    name: "限定召喚 · 季節のデバッガ", description: "APIから提供される説明文。", currency: "RUNE",
    singlePullCost: 30, tenPullCost: 300, hardPityPull: 60, softPityPull: null,
    adventurerPassHardPityPull: 50, guaranteeType: "SSR",
    rates: [{ rarity: "SSR", percent: 3 }, { rarity: "SR", percent: 12 }, { rarity: "R", percent: 35 }, { rarity: "N", percent: 50 }],
    items: [{ itemId: "monster:seasonal-debugger", rarity: "SSR", weight: 3, assetUrl: null, featured: true }],
    stockPolicy: "UNLIMITED",
  },
  "/api/summon/pity": { poolKey: "NORMAL", pullCount: 46, isSoftPity: false, isHardPity: false },
  "/api/summon/limited/pity": { poolKey: "LIMITED", pullCount: 12, isSoftPity: false, isHardPity: false },
  "/api/summon/history": [],
  "/api/shop/items": {
    items: [
      { itemId: "fire-soul-pack-s", name: "炎の魂パック・小", description: "炎属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "fire", attributeLabel: "炎", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "fire-soul-pack-m", name: "炎の魂パック・中", description: "炎属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "fire", attributeLabel: "炎", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "fire-soul-pack-l", name: "炎の魂パック・大", description: "炎属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "fire", attributeLabel: "炎", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "water-soul-pack-s", name: "水の魂パック・小", description: "水属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "water", attributeLabel: "水", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "water-soul-pack-m", name: "水の魂パック・中", description: "水属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "water", attributeLabel: "水", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "water-soul-pack-l", name: "水の魂パック・大", description: "水属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "water", attributeLabel: "水", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "thunder-soul-pack-s", name: "雷の魂パック・小", description: "雷属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "thunder", attributeLabel: "雷", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "thunder-soul-pack-m", name: "雷の魂パック・中", description: "雷属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "thunder", attributeLabel: "雷", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "thunder-soul-pack-l", name: "雷の魂パック・大", description: "雷属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "thunder", attributeLabel: "雷", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "nature-soul-pack-s", name: "自然の魂パック・小", description: "自然属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "nature", attributeLabel: "自然", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "nature-soul-pack-m", name: "自然の魂パック・中", description: "自然属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "nature", attributeLabel: "自然", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "nature-soul-pack-l", name: "自然の魂パック・大", description: "自然属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "nature", attributeLabel: "自然", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "light-soul-pack-s", name: "光の魂パック・小", description: "光属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "light", attributeLabel: "光", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "light-soul-pack-m", name: "光の魂パック・中", description: "光属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "light", attributeLabel: "光", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "light-soul-pack-l", name: "光の魂パック・大", description: "光属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "light", attributeLabel: "光", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "dark-soul-pack-s", name: "闇の魂パック・小", description: "闇属性のモンスターに50魂を指定して付与", currency: "RUNE", price: 30, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "dark", attributeLabel: "闇", sizeSuffix: "s", sizeLabel: "小" },
      { itemId: "dark-soul-pack-m", name: "闇の魂パック・中", description: "闇属性のモンスターに150魂を指定して付与", currency: "RUNE", price: 80, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "dark", attributeLabel: "闇", sizeSuffix: "m", sizeLabel: "中" },
      { itemId: "dark-soul-pack-l", name: "闇の魂パック・大", description: "闇属性のモンスターに450魂を指定して付与", currency: "RUNE", price: 210, category: "SOUL_PACK", iconEmoji: "🔮", assetUrl: null, variantGroup: "attribute-soul-pack", attribute: "dark", attributeLabel: "闇", sizeSuffix: "l", sizeLabel: "大" },
      { itemId: "soul-pack-s", name: "魂パック・小", description: "魂 5", currency: "GUILD_COIN", price: 500, category: "SOUL_PACK", iconEmoji: "▣", assetUrl: null },
      { itemId: "soul-pack-m", name: "魂パック・中", description: "魂 15", currency: "GUILD_COIN", price: 1500, category: "SOUL_PACK", iconEmoji: "▣", assetUrl: null },
      { itemId: "soul-pack-l", name: "魂パック・大", description: "魂 30", currency: "GUILD_COIN", price: 3000, category: "SOUL_PACK", iconEmoji: "▣", assetUrl: null },
      { itemId: "evolution-stone", name: "進化の輝石", description: "Lv50で進化に使用", currency: "GUILD_COIN", price: 2000, category: "EVOLUTION", iconEmoji: "▣", assetUrl: null },
      { itemId: "purification-proof", name: "浄化の証", description: "路線変更（覚醒）", currency: "GUILD_COIN", price: 5000, category: "EVOLUTION", iconEmoji: "▣", assetUrl: null },
      { itemId: "abyss-proof", name: "深淵の証", description: "路線変更（暴走）", currency: "GUILD_COIN", price: 20000, category: "EVOLUTION", iconEmoji: "▣", assetUrl: null },
    ],
  },
  "/api/skins": { skins: [] },
  "/api/skins/owned": { skins: [] },
  "/api/inventory": { items: [{ itemId: "evolution-stone", name: "進化の輝石", quantity: 2, iconUrl: null }] },
  // 記念プレートAPIは配列を返す契約。オブジェクトを返すと図鑑が落ちる
  "/api/commemorative-mints": [],
  "/api/heroes/haseryo0403/commemorative-mints": [],
  "/api/badges/catalog": [],
  "/api/heroes/me/badges/progress": [],
  // 一覧系APIは配列を返す契約。オブジェクトにすると呼び出し側の .map が落ちる
  "/api/v1/leaderboard": Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    heroId: i === 4 ? "haseryo0403" : `dev${i}`,
    githubId: i === 4 ? "haseryo0403" : `dev${i}`,
    name: i === 4 ? "haseryo0403" : `dev${i}`,
    level: 60 - i * 2,
    totalExperience: 20000 - i * 1500,
    totalPrsMerged: 200 - i * 12,
    streakDays: 10 - i,
    avatarUrl: null,
  })),
  "/api/forge/level-defs": [120, 180, 260, 340, 440, 560, 700, 880, 1120, 1400].map((runeCost, i) => ({ level: i + 1, runeCost })),
};

http.createServer((req, res) => {
  const path = req.url.split("?")[0];
  // 既定では未読を返さない（報酬モーダルが全ページを覆ってしまうため）。
  // モーダル自体を見たいときは MOCK_UNREAD=1 を付ける。
  if (req.url.includes("unreadOnly=true") && process.env.MOCK_UNREAD !== "1") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ activities: [], unreadCount: 0 }));
    return;
  }
  
  const body = routes[path] ?? routes[path.replace(/^\/api\/v1/, "/api")] ?? routes[`/api/v1${path.replace(/^\/api/, "")}`];
  res.setHeader("content-type", "application/json");
  if (body === undefined) {
    console.log("MISS", path);
    res.statusCode = 200;
    res.end("{}");
    return;
  }
  res.end(JSON.stringify(body));
}).listen(PORT, () => console.log(`mock backend on :${PORT}`));
