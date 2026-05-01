// Hero visual system — 4 distinct rendering styles + shared equipment data.
// All four styles render the same Hero state (equipped slots) so the user can
// see the SAME equipment loadout drawn 4 different ways.

// ─────────────────────────────────────────────────────────────
// Equipment catalog — 6 slots × multiple options each
// User can swap by clicking inventory items.
// ─────────────────────────────────────────────────────────────
window.EQUIP_CATALOG = {
  head: [
    { id:'h0', name:'(なし)',           emoji:'',    rarity:null, atk:0,   def:0,   luck:0 },
    { id:'h1', name:'勇者の兜',          emoji:'⛑️',   rarity:'R',   atk:0,   def:18,  luck:2 },
    { id:'h2', name:'魔導士のフード',     emoji:'🪖',  rarity:'SR',  atk:6,   def:8,   luck:8 },
    { id:'h3', name:'王者の冠',          emoji:'👑',  rarity:'SSR', atk:12,  def:24,  luck:18 },
  ],
  chest: [
    { id:'c0', name:'(なし)',           emoji:'',    rarity:null, atk:0,   def:0,   luck:0 },
    { id:'c1', name:'布の服',           emoji:'👕',  rarity:'N',   atk:0,   def:6,   luck:0 },
    { id:'c2', name:'鎖帷子',           emoji:'🦺',  rarity:'R',   atk:0,   def:32,  luck:0 },
    { id:'c3', name:'竜鱗の鎧',         emoji:'🥋',  rarity:'SSR', atk:8,   def:64,  luck:6 },
  ],
  weapon: [
    { id:'w0', name:'(素手)',           emoji:'✊',  rarity:null, atk:4,   def:0,   luck:0 },
    { id:'w1', name:'銅の剣',           emoji:'🔪',  rarity:'N',   atk:18,  def:0,   luck:0 },
    { id:'w2', name:'鋼の剣',           emoji:'⚔️',   rarity:'R',   atk:42,  def:0,   luck:2 },
    { id:'w3', name:'伝説の剣',          emoji:'🗡️',  rarity:'SSR', atk:128, def:0,   luck:14 },
    { id:'w4', name:'魔法の杖',          emoji:'🪄',  rarity:'SR',  atk:78,  def:0,   luck:24 },
  ],
  shield: [
    { id:'s0', name:'(なし)',           emoji:'',    rarity:null, atk:0,   def:0,   luck:0 },
    { id:'s1', name:'木の盾',           emoji:'🪵',  rarity:'N',   atk:0,   def:14,  luck:0 },
    { id:'s2', name:'銀の盾',           emoji:'🛡️',   rarity:'SR',  atk:0,   def:38,  luck:6 },
    { id:'s3', name:'神聖な結界',        emoji:'✨',  rarity:'SSR', atk:0,   def:72,  luck:12 },
  ],
  boots: [
    { id:'b0', name:'(なし)',           emoji:'',    rarity:null, atk:0,   def:0,   luck:0 },
    { id:'b1', name:'革のブーツ',        emoji:'👞',  rarity:'N',   atk:0,   def:8,   luck:2 },
    { id:'b2', name:'疾風の靴',          emoji:'👟',  rarity:'SR',  atk:4,   def:14,  luck:18 },
    { id:'b3', name:'天翔ける翼',        emoji:'👢',  rarity:'SSR', atk:8,   def:22,  luck:28 },
  ],
  trinket: [
    { id:'t0', name:'(なし)',           emoji:'',    rarity:null, atk:0,   def:0,   luck:0 },
    { id:'t1', name:'守護のお守り',      emoji:'🧿',  rarity:'R',   atk:0,   def:8,   luck:14 },
    { id:'t2', name:'魔力の指輪',        emoji:'💍',  rarity:'SR',  atk:14,  def:0,   luck:22 },
    { id:'t3', name:'幸運のメダル',      emoji:'🏅',  rarity:'SSR', atk:6,   def:6,   luck:48 },
  ],
};

window.SLOT_LABELS = {
  head:    { ja:'頭',   glyph:'⛑',  short:'HEAD' },
  chest:   { ja:'胴',   glyph:'🦺',  short:'CHEST' },
  weapon:  { ja:'武器', glyph:'⚔',  short:'WEAPON' },
  shield:  { ja:'盾',   glyph:'🛡',  short:'SHIELD' },
  boots:   { ja:'足',   glyph:'👞',  short:'BOOTS' },
  trinket: { ja:'装飾', glyph:'💍',  short:'TRINKET' },
};

window.SLOT_KEYS = ['head', 'chest', 'weapon', 'shield', 'boots', 'trinket'];

// Default loadout (decent SR-ish gear)
window.DEFAULT_LOADOUT = {
  head: 'h2', chest: 'c2', weapon: 'w2', shield: 's2', boots: 'b2', trinket: 't1',
};

window.lookupEquip = function(slot, id) {
  return EQUIP_CATALOG[slot].find(e => e.id === id) || EQUIP_CATALOG[slot][0];
};

window.totalStats = function(loadout) {
  const stats = { atk: 0, def: 0, luck: 0 };
  SLOT_KEYS.forEach(slot => {
    const e = lookupEquip(slot, loadout[slot]);
    stats.atk += e.atk; stats.def += e.def; stats.luck += e.luck;
  });
  return stats;
};

// ═════════════════════════════════════════════════════════════
// HERO STYLE 1 — ASCII art (text-drawn knight)
// ═════════════════════════════════════════════════════════════
function HeroAscii({loadout, accent='#7ee787', dim='#7a9c8c', faint='#4a6157'}) {
  const head    = lookupEquip('head',    loadout.head);
  const chest   = lookupEquip('chest',   loadout.chest);
  const weapon  = lookupEquip('weapon',  loadout.weapon);
  const shield  = lookupEquip('shield',  loadout.shield);
  const boots   = lookupEquip('boots',   loadout.boots);
  const trinket = lookupEquip('trinket', loadout.trinket);

  // ASCII layered with overlays for equipment glyphs
  return (
    <div style={{
      position:'relative',
      fontFamily:"'JetBrains Mono', monospace",
      fontSize:13, lineHeight:1.15,
      color:accent,
      whiteSpace:'pre',
      userSelect:'none',
    }}>
      {/* head/helmet line */}
      <div style={{position:'relative', textAlign:'center'}}>
        <span style={{color:faint}}>     ___</span>
      </div>
      <div style={{position:'relative', textAlign:'center'}}>
        <span style={{color:head.emoji ? accent : faint}}>    /{head.emoji ? '#' : '_'}_\\</span>
        {head.emoji && (
          <span style={{
            position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)',
            fontSize:18, filter:'drop-shadow(0 0 6px '+accent+'88)',
          }}>{head.emoji}</span>
        )}
      </div>
      {/* face */}
      <div style={{textAlign:'center', color:accent}}>    | <span style={{color:dim}}>•</span> <span style={{color:dim}}>•</span> |</div>
      <div style={{textAlign:'center', color:accent}}>    \\ <span style={{color:dim}}>‿</span> /</div>
      {/* shoulders/chest with weapon/shield */}
      <div style={{position:'relative', textAlign:'center'}}>
        <span style={{color:weapon.emoji ? accent : faint}}>{weapon.emoji ? '╱' : ' '}</span>
        <span style={{color:accent}}>  ___  </span>
        <span style={{color:shield.emoji ? accent : faint}}>{shield.emoji ? '╲' : ' '}</span>
      </div>
      <div style={{position:'relative'}}>
        <span style={{color:weapon.emoji ? accent : faint}}>  {weapon.emoji ? '║' : ' '}  </span>
        <span style={{color:chest.emoji ? accent : faint}}>/{chest.emoji ? '#####' : '_____'}\</span>
        <span style={{color:shield.emoji ? accent : faint}}>  {shield.emoji ? '║' : ' '}</span>
        {/* weapon glyph */}
        {weapon.emoji && (
          <span style={{position:'absolute', left:8, top:-8, fontSize:22, filter:'drop-shadow(0 0 6px '+accent+'88)'}}>
            {weapon.emoji}
          </span>
        )}
        {/* shield glyph */}
        {shield.emoji && (
          <span style={{position:'absolute', right:6, top:-8, fontSize:22, filter:'drop-shadow(0 0 6px '+accent+'88)'}}>
            {shield.emoji}
          </span>
        )}
        {/* chest glyph (small overlay center) */}
        {chest.emoji && (
          <span style={{
            position:'absolute', left:'50%', top:0, transform:'translate(-50%, -2px)',
            fontSize:14, opacity:0.85,
          }}>{chest.emoji}</span>
        )}
      </div>
      <div style={{position:'relative'}}>
        <span style={{color:weapon.emoji ? accent : faint}}>  {weapon.emoji ? '║' : ' '}  </span>
        <span style={{color:chest.emoji ? accent : faint}}>|{chest.emoji ? '##' : '__'} {trinket.emoji ? <span style={{color:accent}}>◆</span> : '_'}{chest.emoji ? '##' : '__'}|</span>
        <span style={{color:shield.emoji ? accent : faint}}>  {shield.emoji ? '║' : ' '}</span>
        {trinket.emoji && (
          <span style={{position:'absolute', left:'50%', top:0, transform:'translate(-50%, -2px)', fontSize:11}}>
            {trinket.emoji}
          </span>
        )}
      </div>
      <div style={{textAlign:'center', color:accent}}>    |_____|</div>
      {/* legs */}
      <div style={{textAlign:'center', color:accent}}>     | |</div>
      <div style={{textAlign:'center', color:accent}}>     | |</div>
      {/* boots */}
      <div style={{position:'relative', textAlign:'center'}}>
        <span style={{color:boots.emoji ? accent : faint}}>    {boots.emoji ? 'L_J' : '___'}</span>
        {boots.emoji && (
          <span style={{
            position:'absolute', left:'50%', top:-4, transform:'translateX(-50%)',
            fontSize:16, filter:'drop-shadow(0 0 4px '+accent+'88)',
          }}>{boots.emoji}</span>
        )}
      </div>
      {/* ground */}
      <div style={{textAlign:'center', color:faint, marginTop:6}}>════════════</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// HERO STYLE 2 — Dot-pixel art (CSS box-shadow pixels)
// ═════════════════════════════════════════════════════════════
function HeroPixel({loadout, accent='#7ee787'}) {
  const head    = lookupEquip('head',    loadout.head);
  const chest   = lookupEquip('chest',   loadout.chest);
  const weapon  = lookupEquip('weapon',  loadout.weapon);
  const shield  = lookupEquip('shield',  loadout.shield);
  const boots   = lookupEquip('boots',   loadout.boots);
  const trinket = lookupEquip('trinket', loadout.trinket);

  // Color choices based on rarity
  const rarityHex = { N:'#94a3b8', R:'#38bdf8', SR:'#a78bfa', SSR:'#fbbf24' };
  const headC   = head.rarity   ? rarityHex[head.rarity]   : '#9ca3af';
  const chestC  = chest.rarity  ? rarityHex[chest.rarity]  : '#9ca3af';
  const weapC   = weapon.rarity ? rarityHex[weapon.rarity] : '#a78bfa';
  const shldC   = shield.rarity ? rarityHex[shield.rarity] : '#9ca3af';
  const bootC   = boots.rarity  ? rarityHex[boots.rarity]  : '#9ca3af';

  // 16x20 pixel grid; each cell becomes a square
  const px = 8;       // pixel size
  const cell = (col, row, color) => ({left: col*px, top: row*px, background: color});

  // Pixel positions: head (rows 1-4), body (5-11), legs (12-15), boots (16-17)
  const PIXELS = [];
  // Helmet top (row 1-2)
  for (let c = 6; c <= 9; c++) PIXELS.push(cell(c, 1, headC));
  for (let c = 5; c <= 10; c++) PIXELS.push(cell(c, 2, headC));
  // Face (row 3-4)
  for (let c = 5; c <= 10; c++) PIXELS.push(cell(c, 3, '#f5d0a9'));
  PIXELS.push(cell(6, 3, '#1a1814')); PIXELS.push(cell(9, 3, '#1a1814')); // eyes
  for (let c = 5; c <= 10; c++) PIXELS.push(cell(c, 4, '#f5d0a9'));
  PIXELS.push(cell(7, 4, '#1a1814')); PIXELS.push(cell(8, 4, '#1a1814'));  // mouth
  // Neck
  for (let c = 7; c <= 8; c++) PIXELS.push(cell(c, 5, '#f5d0a9'));
  // Chest (rows 6-9)
  for (let r = 6; r <= 9; r++) {
    for (let c = 4; c <= 11; c++) PIXELS.push(cell(c, r, chestC));
  }
  // Trinket pixel on chest
  if (trinket.emoji) PIXELS.push(cell(7, 7, '#fbbf24'));
  if (trinket.emoji) PIXELS.push(cell(8, 7, '#fbbf24'));
  // Arms (rows 6-10) — left arm holds weapon
  for (let r = 6; r <= 9; r++) {
    PIXELS.push(cell(3, r, chestC));
    PIXELS.push(cell(12, r, chestC));
  }
  // Weapon (vertical sword on left, rows 1-9)
  if (weapon.emoji) {
    for (let r = 1; r <= 5; r++) PIXELS.push(cell(2, r, weapC));
    PIXELS.push(cell(1, 5, weapC)); PIXELS.push(cell(3, 5, weapC));
    for (let r = 6; r <= 9; r++) PIXELS.push(cell(2, r, '#8b6f47')); // hilt
  }
  // Shield (square on right, rows 5-9)
  if (shield.emoji) {
    for (let r = 5; r <= 9; r++) {
      for (let c = 13; c <= 14; c++) PIXELS.push(cell(c, r, shldC));
    }
  }
  // Belt
  for (let c = 4; c <= 11; c++) PIXELS.push(cell(c, 10, '#3d2817'));
  // Legs (rows 11-14)
  for (let r = 11; r <= 14; r++) {
    PIXELS.push(cell(6, r, '#2d3d37'));
    PIXELS.push(cell(7, r, '#2d3d37'));
    PIXELS.push(cell(8, r, '#2d3d37'));
    PIXELS.push(cell(9, r, '#2d3d37'));
  }
  // Boots (rows 15-16)
  for (let c = 5; c <= 10; c++) PIXELS.push(cell(c, 15, bootC));
  for (let c = 5; c <= 10; c++) PIXELS.push(cell(c, 16, bootC));

  return (
    <div style={{
      position:'relative',
      width: 16*px, height: 18*px,
      imageRendering:'pixelated',
    }}>
      {PIXELS.map((p, i) => (
        <div key={i} style={{
          position:'absolute',
          width:px, height:px,
          ...p,
        }}/>
      ))}
      {/* shadow */}
      <div style={{
        position:'absolute', left:'50%', top: 17*px + 4,
        width: 12*px, height: 4,
        background:'radial-gradient(ellipse, rgba(126,231,135,0.4), transparent 70%)',
        transform:'translateX(-50%)',
      }}/>
      {/* glow if SSR equipped */}
      {SLOT_KEYS.some(k => lookupEquip(k, loadout[k]).rarity === 'SSR') && (
        <div style={{
          position:'absolute', inset:-20,
          background:`radial-gradient(circle, ${accent}11 0%, transparent 60%)`,
          pointerEvents:'none', zIndex:-1,
        }}/>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// HERO STYLE 3 — Emoji stack (large emoji centerpiece + halo)
// ═════════════════════════════════════════════════════════════
function HeroEmoji({loadout, accent='#7ee787'}) {
  const head    = lookupEquip('head',    loadout.head);
  const chest   = lookupEquip('chest',   loadout.chest);
  const weapon  = lookupEquip('weapon',  loadout.weapon);
  const shield  = lookupEquip('shield',  loadout.shield);
  const boots   = lookupEquip('boots',   loadout.boots);
  const trinket = lookupEquip('trinket', loadout.trinket);

  const hasAnySSR = SLOT_KEYS.some(k => lookupEquip(k, loadout[k]).rarity === 'SSR');

  return (
    <div style={{
      position:'relative',
      width:240, height:240,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {/* halo */}
      <div style={{
        position:'absolute', inset:0,
        background:`radial-gradient(circle, ${accent}${hasAnySSR ? '22' : '14'} 0%, transparent 60%)`,
      }}/>
      {/* central knight */}
      <div style={{fontSize:140, lineHeight:1, position:'relative', zIndex:1, filter:`drop-shadow(0 8px 16px ${accent}55)`}}>
        🧙‍♂️
      </div>
      {/* equipment orbiting */}
      {head.emoji && (
        <div style={{position:'absolute', top:6, left:'50%', transform:'translateX(-50%)', fontSize:48, zIndex:2,
          filter:`drop-shadow(0 0 8px ${accent}aa)`}}>{head.emoji}</div>
      )}
      {weapon.emoji && (
        <div style={{position:'absolute', left:8, top:'50%', transform:'translateY(-30%) rotate(-25deg)', fontSize:64, zIndex:2,
          filter:`drop-shadow(0 0 8px ${accent}aa)`}}>{weapon.emoji}</div>
      )}
      {shield.emoji && (
        <div style={{position:'absolute', right:6, top:'50%', transform:'translateY(-20%) rotate(15deg)', fontSize:60, zIndex:2,
          filter:`drop-shadow(0 0 8px ${accent}aa)`}}>{shield.emoji}</div>
      )}
      {chest.emoji && (
        <div style={{position:'absolute', left:'50%', top:'52%', transform:'translate(-50%, 0)', fontSize:38, zIndex:0, opacity:0.85}}>
          {chest.emoji}
        </div>
      )}
      {trinket.emoji && (
        <div style={{position:'absolute', right:30, top:42, fontSize:28, zIndex:3,
          filter:`drop-shadow(0 0 6px ${accent}aa)`,
          animation:'a-float 3s ease-in-out infinite'}}>{trinket.emoji}</div>
      )}
      {boots.emoji && (
        <div style={{position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)', fontSize:42, zIndex:2,
          filter:`drop-shadow(0 0 6px ${accent}aa)`}}>{boots.emoji}</div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// HERO STYLE 4 — SVG silhouette (abstract figure that morphs by gear)
// ═════════════════════════════════════════════════════════════
function HeroSilhouette({loadout, accent='#7ee787', bg='#101614'}) {
  const head    = lookupEquip('head',    loadout.head);
  const chest   = lookupEquip('chest',   loadout.chest);
  const weapon  = lookupEquip('weapon',  loadout.weapon);
  const shield  = lookupEquip('shield',  loadout.shield);
  const boots   = lookupEquip('boots',   loadout.boots);
  const trinket = lookupEquip('trinket', loadout.trinket);

  const rarityHex = { N:'#94a3b8', R:'#38bdf8', SR:'#a78bfa', SSR:'#fbbf24' };
  const c = (e) => e.rarity ? rarityHex[e.rarity] : '#3d4a44';

  return (
    <svg width="220" height="280" viewBox="0 0 220 280" style={{display:'block'}}>
      <defs>
        <radialGradient id="hsil-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
          <stop offset="60%" stopColor={accent} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="hsil-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2d3d37"/>
          <stop offset="100%" stopColor="#1a1814"/>
        </linearGradient>
      </defs>

      {/* glow */}
      <circle cx="110" cy="140" r="120" fill="url(#hsil-glow)"/>

      {/* shadow under feet */}
      <ellipse cx="110" cy="262" rx="48" ry="6" fill={accent} opacity="0.25"/>

      {/* legs */}
      <rect x="93" y="195" width="14" height="58" fill="url(#hsil-body)" rx="2"/>
      <rect x="113" y="195" width="14" height="58" fill="url(#hsil-body)" rx="2"/>

      {/* boots */}
      <rect x="88"  y="248" width="22" height="14" rx="3" fill={c(boots)} stroke={accent} strokeOpacity={boots.rarity ? 0.4 : 0.1}/>
      <rect x="110" y="248" width="22" height="14" rx="3" fill={c(boots)} stroke={accent} strokeOpacity={boots.rarity ? 0.4 : 0.1}/>

      {/* torso (chest piece) */}
      <path d="M 75 90 L 145 90 L 152 200 L 68 200 Z" fill={c(chest)} opacity={chest.rarity ? 0.95 : 0.6}/>
      <path d="M 75 90 L 145 90 L 152 200 L 68 200 Z" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="1"/>

      {/* arms */}
      <path d="M 68 95 L 50 175 L 60 180 L 78 100 Z" fill={c(chest)} opacity={chest.rarity ? 0.85 : 0.5}/>
      <path d="M 152 95 L 170 175 L 160 180 L 142 100 Z" fill={c(chest)} opacity={chest.rarity ? 0.85 : 0.5}/>

      {/* trinket on chest */}
      {trinket.emoji && (
        <>
          <circle cx="110" cy="135" r="8" fill={c(trinket)} opacity="0.9"/>
          <circle cx="110" cy="135" r="8" fill="none" stroke={accent} strokeWidth="1"/>
        </>
      )}

      {/* head */}
      <circle cx="110" cy="65" r="28" fill="#1a1814" stroke={accent} strokeOpacity="0.5"/>
      {/* eyes */}
      <circle cx="100" cy="62" r="2.5" fill={accent}/>
      <circle cx="120" cy="62" r="2.5" fill={accent}/>

      {/* helmet (drawn on top of head) */}
      {head.emoji && (
        <path d="M 78 42 Q 110 24 142 42 L 142 70 L 132 60 L 110 64 L 88 60 L 78 70 Z"
          fill={c(head)} stroke={accent} strokeOpacity="0.5"/>
      )}

      {/* weapon — diagonal sword */}
      {weapon.emoji && (
        <g transform="translate(40 130) rotate(-30 0 0)">
          <rect x="-2" y="-70" width="4" height="92" fill={c(weapon)}/>
          <rect x="-12" y="22" width="24" height="6" fill={c(weapon)}/>
          <rect x="-3" y="28" width="6" height="14" fill="#8b6f47"/>
          <polygon points="-2,-72 0,-78 2,-72" fill={c(weapon)}/>
        </g>
      )}

      {/* shield — round on right */}
      {shield.emoji && (
        <g transform="translate(180 150)">
          <ellipse cx="0" cy="0" rx="18" ry="26" fill={c(shield)} opacity="0.95"/>
          <ellipse cx="0" cy="0" rx="18" ry="26" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5"/>
          <circle cx="0" cy="0" r="5" fill={accent} opacity="0.5"/>
        </g>
      )}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// HERO PICKER — switches between 4 styles
// ═════════════════════════════════════════════════════════════
function Hero({style, loadout, accent}) {
  if (style === 'ascii')      return <HeroAscii      loadout={loadout} accent={accent}/>;
  if (style === 'pixel')      return <HeroPixel      loadout={loadout} accent={accent}/>;
  if (style === 'emoji')      return <HeroEmoji      loadout={loadout} accent={accent}/>;
  if (style === 'silhouette') return <HeroSilhouette loadout={loadout} accent={accent}/>;
  return null;
}

window.Hero = Hero;
window.HeroAscii = HeroAscii;
window.HeroPixel = HeroPixel;
window.HeroEmoji = HeroEmoji;
window.HeroSilhouette = HeroSilhouette;

// Animations
if (!document.getElementById('hero-anims')) {
  const s = document.createElement('style');
  s.id = 'hero-anims';
  s.textContent = `
    @keyframes a-blink { 50% { opacity: 0; } }
    @keyframes a-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
    @keyframes a-pulse { 0%,100% { opacity: 0.85 } 50% { opacity: 1 } }
  `;
  document.head.appendChild(s);
}
