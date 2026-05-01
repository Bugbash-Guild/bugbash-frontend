// BugBash mock data — based on actual API contract from docs/design.md

window.BB_DATA = {
  user: {
    username: 'haseryo0403',
    githubId: '169417583',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
  },
  hero: {
    level: 50,
    totalExperience: 12873,
    currentLevelExperience: 272,
    experienceForNextLevel: 1028,
    experienceToNextLevel: 756,
    progressRatio: 0.265,
  },
  // 20 species × 4 rarities — matches Phase 1 spec (N:3, R:6, SR:7, SSR:4)
  monsterDex: [
    {id:'01', name:'スライム',     emoji:'🟢', rarity:'N',   requiredLevel:1},
    {id:'02', name:'ゴブリン',     emoji:'👹', rarity:'N',   requiredLevel:1},
    {id:'03', name:'コウモリ',     emoji:'🦇', rarity:'N',   requiredLevel:1},
    {id:'04', name:'スケルトン',   emoji:'💀', rarity:'R',   requiredLevel:5},
    {id:'05', name:'オーク',       emoji:'🧌', rarity:'R',   requiredLevel:5},
    {id:'06', name:'マーマン',     emoji:'🐟', rarity:'R',   requiredLevel:8},
    {id:'07', name:'狼',           emoji:'🐺', rarity:'R',   requiredLevel:10},
    {id:'08', name:'魔女',         emoji:'🧙', rarity:'R',   requiredLevel:12},
    {id:'09', name:'ゾンビ',       emoji:'🧟', rarity:'R',   requiredLevel:15},
    {id:'10', name:'ゴーレム',     emoji:'🗿', rarity:'SR',  requiredLevel:18},
    {id:'11', name:'マーメイド',   emoji:'🧜', rarity:'SR',  requiredLevel:20},
    {id:'12', name:'ケルベロス',   emoji:'🐕', rarity:'SR',  requiredLevel:22},
    {id:'13', name:'サイクロプス', emoji:'👁', rarity:'SR',  requiredLevel:25},
    {id:'14', name:'ユニコーン',   emoji:'🦄', rarity:'SR',  requiredLevel:28},
    {id:'15', name:'ヴァンパイア', emoji:'🧛', rarity:'SR',  requiredLevel:30},
    {id:'16', name:'クラーケン',   emoji:'🐙', rarity:'SR',  requiredLevel:32},
    {id:'17', name:'グリフィン',   emoji:'🦁', rarity:'SSR', requiredLevel:35},
    {id:'18', name:'フェニックス', emoji:'🦅', rarity:'SSR', requiredLevel:40},
    {id:'19', name:'ドラゴン',     emoji:'🐉', rarity:'SSR', requiredLevel:45},
    {id:'20', name:'リヴァイアサン', emoji:'🐊', rarity:'SSR', requiredLevel:50},
  ],
  // owned monster instances (some duplicates allowed by spec)
  ownedIds: ['01','01','01','02','02','03','04','04','05','06','07','07','08','09','10','10','11','12','13','14','15','17','18','19'],
  // recent activities — matches GET /api/v1/hero/activities
  activities: [
    { id:142, type:'pr_merged', repo:'Bugbash-Guild/bugbash-frontend', prNumber:142, title:'feat: redesign monster collection page', xp:100, levelBefore:49, levelAfter:50, monster:{name:'ドラゴン', emoji:'🐉', rarity:'SSR'}, occurredAt:'2分前', isLevelUp:true },
    { id:141, type:'pr_merged', repo:'Bugbash-Guild/bugbash-backend',  prNumber:89,  title:'fix: race condition in XP gain', xp:100, levelBefore:49, levelAfter:49, monster:{name:'狼', emoji:'🐺', rarity:'R'}, occurredAt:'3時間前' },
    { id:140, type:'pr_merged', repo:'Bugbash-Guild/bugbash-backend',  prNumber:88,  title:'feat: rarity weighting (N:40 R:30 SR:22 SSR:8)', xp:100, levelBefore:48, levelAfter:49, monster:{name:'スライム', emoji:'🟢', rarity:'N'}, occurredAt:'昨日', isLevelUp:true },
    { id:139, type:'pr_merged', repo:'Bugbash-Guild/bugbash-frontend', prNumber:141, title:'chore: bump dependencies', xp:100, levelBefore:48, levelAfter:48, monster:{name:'ゾンビ', emoji:'🧟', rarity:'R'}, occurredAt:'2日前' },
    { id:138, type:'pr_merged', repo:'Bugbash-Guild/bugbash-backend',  prNumber:87,  title:'feat: webhook signature validation', xp:100, levelBefore:47, levelAfter:48, monster:{name:'フェニックス', emoji:'🦅', rarity:'SSR'}, occurredAt:'3日前', isLevelUp:true },
    { id:137, type:'pr_merged', repo:'Bugbash-Guild/bugbash-frontend', prNumber:140, title:'refactor: extract HeroCard hooks', xp:100, levelBefore:47, levelAfter:47, monster:{name:'コウモリ', emoji:'🦇', rarity:'N'}, occurredAt:'4日前' },
  ],
  items: [
    { id:'i1', name:'経験値の薬',   emoji:'🧪', qty:12, kind:'consumable', desc:'使用すると +500 XP' },
    { id:'i2', name:'覚醒の石',     emoji:'💎', qty:3,  kind:'evolve',     desc:'モンスターを覚醒させる' },
    { id:'i3', name:'進化チケット', emoji:'🎟️', qty:5,  kind:'evolve',     desc:'モンスターを進化させる' },
    { id:'i4', name:'ガチャチケット', emoji:'🎫', qty:8, kind:'ticket',     desc:'1回ガチャを引ける' },
    { id:'i5', name:'金貨',         emoji:'🪙', qty:240,kind:'currency',   desc:'ショップで使える' },
    { id:'i6', name:'宝箱の鍵',     emoji:'🗝️', qty:2,  kind:'key',        desc:'宝箱を開けられる' },
  ],
};

window.BB_RARITY = {
  N:   { label:'N',   color:'#94a3b8', glow:'rgba(148,163,184,0.4)', weight:1 },
  R:   { label:'R',   color:'#38bdf8', glow:'rgba(56,189,248,0.5)',  weight:2 },
  SR:  { label:'SR',  color:'#a78bfa', glow:'rgba(167,139,250,0.6)', weight:3 },
  SSR: { label:'SSR', color:'#fbbf24', glow:'rgba(251,191,36,0.7)',  weight:4 },
};

// derive: which dex entries are unlocked + count
window.BB_DERIVED = (() => {
  const counts = {};
  window.BB_DATA.ownedIds.forEach(id => counts[id] = (counts[id]||0)+1);
  const dex = window.BB_DATA.monsterDex.map(m => ({
    ...m,
    owned: counts[m.id] || 0,
    discovered: (counts[m.id]||0) > 0,
  }));
  return {
    dex,
    discoveredCount: dex.filter(d=>d.discovered).length,
    totalCount: dex.length,
    ownedTotal: window.BB_DATA.ownedIds.length,
  };
})();
