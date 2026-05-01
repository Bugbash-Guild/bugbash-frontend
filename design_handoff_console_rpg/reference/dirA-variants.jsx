// Direction A — Monster & Item screen variations
// 4 monster + 4 item directions, each a complete page (with sidebar).

const T = A_TOKENS;       // shorthand
const F = A_FONT;

// ─────────────────────────────────────────────────────────────
// Shared prompt header
// ─────────────────────────────────────────────────────────────
function APrompt({path, cmd}) {
  return (
    <div style={{marginBottom:20, fontSize:13, color:T.textDim}}>
      <span style={{color:T.accent}}>{BB_DATA.user.username}@bugbash</span>
      <span style={{color:T.textFaint}}>:</span>
      <span style={{color:T.blue}}>{path}</span>
      <span style={{color:T.textFaint}}>$ </span>
      <span>{cmd}</span>
    </div>
  );
}

const RARITY_COLOR = {N:'#7a9c8c', R:'#79c0ff', SR:'#d2a8ff', SSR:'#e3b341'};

// ═════════════════════════════════════════════════════════════
// MONSTER VARIATION 1 — File-tree (`tree -L 2 dex/`)
// ═════════════════════════════════════════════════════════════
function AMonsterTree() {
  const dex = BB_DERIVED.dex;
  const groups = ['SSR','SR','R','N'].map(r => ({rarity:r, items: dex.filter(d=>d.rarity===r)}));

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/monsters" cmd="tree -L 2 dex/"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Monster Dex</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        {BB_DERIVED.discoveredCount}/{BB_DERIVED.totalCount} discovered · {BB_DERIVED.ownedTotal} owned
      </div>

      <div style={{
        background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
        padding:'18px 20px', fontSize:13, lineHeight:1.65,
      }}>
        <div style={{color:T.textDim, marginBottom:8}}>
          <span style={{color:T.blue}}>dex/</span>
        </div>
        {groups.map((g, gi) => {
          const last = gi === groups.length - 1;
          const ownedCount = g.items.filter(i=>i.discovered).length;
          return (
            <div key={g.rarity}>
              <div style={{color:T.textDim}}>
                <span style={{color:T.textFaint}}>{last ? '└── ' : '├── '}</span>
                <span style={{color:RARITY_COLOR[g.rarity], fontWeight:600}}>{g.rarity.toLowerCase()}/</span>
                <span style={{color:T.textFaint}}> ({ownedCount}/{g.items.length})</span>
              </div>
              {g.items.map((m, i) => {
                const lastInGroup = i === g.items.length - 1;
                const branch = lastInGroup ? '└── ' : '├── ';
                const trunk = last ? '    ' : '│   ';
                return (
                  <div key={m.id} style={{
                    color: m.discovered ? T.text : T.textFaint,
                    opacity: m.discovered ? 1 : 0.55,
                  }}>
                    <span style={{color:T.textFaint}}>{trunk}{branch}</span>
                    <span style={{display:'inline-block', width:24}}>{m.discovered ? m.emoji : '·'}</span>
                    <span style={{color:T.textFaint}}> {String(m.id).padStart(4,'0')} </span>
                    <span>{m.discovered ? m.name : '???'}</span>
                    <span style={{color:T.textFaint}}>.dex</span>
                    {m.owned > 1 && (
                      <span style={{color:RARITY_COLOR[m.rarity], marginLeft:10, fontSize:11}}>
                        × {m.owned}
                      </span>
                    )}
                    {m.discovered && (
                      <span style={{color:T.textFaint, marginLeft:14, fontSize:11}}>
                        Lv.{m.requiredLevel}+ · captured
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{marginTop:12, color:T.textFaint, fontSize:11}}>
          {BB_DERIVED.totalCount} entries · {BB_DERIVED.discoveredCount} unlocked · {BB_DERIVED.totalCount - BB_DERIVED.discoveredCount} hidden
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MONSTER VARIATION 2 — Big card grid (TCG-ish, 4-up)
// ═════════════════════════════════════════════════════════════
function AMonsterCards() {
  const dex = BB_DERIVED.dex;
  const sorted = [...dex].sort((a,b) => {
    const order = {SSR:0, SR:1, R:2, N:3};
    return order[a.rarity] - order[b.rarity] || a.id.localeCompare(b.id);
  });
  // companion picker — wired to global state (set by hero-system)
  const useCmp = window.useCompanion || (() => ['19', () => {}]);
  const [companion, setCompanion] = useCmp();
  const compMon = dex.find(m => m.id === companion);

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/monsters" cmd="cat dex/*.card --format=detailed"/>
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:14}}>
        <div>
          <div style={{fontSize:28, fontWeight:600}}>Monster Dex</div>
          <div style={{fontSize:12, color:T.textDim, marginTop:4}}>detailed view · sorted by rarity</div>
        </div>
        <div style={{fontSize:11, color:T.textFaint, fontFamily:F}}>
          [ <span style={{color:T.accent}}>list</span> | grid | tree ]
        </div>
      </div>

      {/* Current companion banner */}
      {compMon && (
        <div style={{
          marginBottom:18, padding:'10px 14px',
          background: RARITY_COLOR[compMon.rarity]+'10',
          border:`1px solid ${RARITY_COLOR[compMon.rarity]}55`,
          borderRadius:4,
          display:'flex', alignItems:'center', gap:12, fontFamily:F,
        }}>
          <span style={{fontSize:9, color:T.textFaint, letterSpacing:'0.12em'}}>FAVORITE / 連れている</span>
          <span style={{fontSize:22}}>{compMon.emoji}</span>
          <span style={{fontSize:13, color:RARITY_COLOR[compMon.rarity], fontWeight:600}}>
            {compMon.name}
          </span>
          <span style={{flex:1, color:T.textFaint, fontSize:10}}>
            ← クリックで連れているモンスターを変更
          </span>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        {sorted.map(m => {
          const c = RARITY_COLOR[m.rarity];
          const isCompanion = m.id === companion;
          return (
            <div key={m.id}
              onClick={() => { if (m.discovered) setCompanion(m.id); }}
              style={{
                background:T.bgElev,
                border:`${isCompanion ? 2 : 1}px solid ${
                  isCompanion ? c : (m.discovered ? c+'66' : T.line)
                }`,
                borderStyle: m.discovered ? 'solid' : 'dashed',
                borderRadius:6, padding:14, position:'relative',
                opacity: m.discovered ? 1 : 0.5,
                boxShadow: isCompanion ? `0 0 0 1px ${c}aa, 0 8px 24px ${c}33`
                  : (m.discovered && m.rarity==='SSR' ? `inset 0 0 24px ${c}22` : 'none'),
                cursor: m.discovered ? 'pointer' : 'not-allowed',
                transition:'transform 0.12s, box-shadow 0.12s',
              }}>
              {isCompanion && (
                <div style={{
                  position:'absolute', top:-8, right:10,
                  fontSize:9, fontWeight:700, color:T.bg,
                  background:c, padding:'2px 8px', borderRadius:2,
                  letterSpacing:'0.1em',
                }}>★ FAVORITE</div>
              )}
              {/* top row: id + rarity */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <span style={{fontSize:10, color:T.textFaint, fontFamily:F}}>#{m.id}</span>
                <span style={{
                  fontSize:9, fontWeight:700, color:c, letterSpacing:'0.1em',
                  padding:'2px 6px', borderRadius:2,
                  background: c+'14', border:`1px solid ${c}55`,
                }}>{m.rarity}</span>
              </div>
              {/* portrait */}
              <div style={{
                aspectRatio:'1',
                background:`radial-gradient(circle at 50% 40%, ${c}1a 0%, transparent 70%), ${T.bgElev2}`,
                border:`1px solid ${T.line}`,
                borderRadius:4,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:64, marginBottom:10,
              }}>
                {m.discovered ? m.emoji : '?'}
              </div>
              {/* stats */}
              <div style={{fontSize:13, fontWeight:600, marginBottom:2, color: m.discovered ? T.text : T.textFaint}}>
                {m.discovered ? m.name : '???'}
              </div>
              <div style={{fontSize:10, color:T.textFaint, fontFamily:F, lineHeight:1.5}}>
                <div>Lv.{m.requiredLevel}+ required</div>
                <div>
                  status: <span style={{color: m.discovered ? T.accent : T.pink}}>
                    {m.discovered ? `caught × ${m.owned}` : 'not_found'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MONSTER VARIATION 3 — DB-table view (`SELECT * FROM monsters`)
// ═════════════════════════════════════════════════════════════
function AMonsterTable() {
  const dex = BB_DERIVED.dex;
  const sorted = [...dex].sort((a,b) => parseInt(a.id) - parseInt(b.id));

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/monsters" cmd={'psql -c "SELECT * FROM dex ORDER BY id"'}/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Monster Dex</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        {BB_DERIVED.totalCount} rows · {BB_DERIVED.discoveredCount} discovered ·
        <span style={{color:T.textFaint, marginLeft:8}}>query: 0.034ms</span>
      </div>

      <div style={{
        background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6, overflow:'hidden',
      }}>
        {/* header */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'56px 32px 1fr 60px 80px 80px 80px',
          padding:'10px 16px', borderBottom:`1px solid ${T.line}`,
          fontSize:10, color:T.textFaint, letterSpacing:'0.12em',
          background:T.bgElev2,
        }}>
          <span>id</span><span></span>
          <span>name</span><span>rarity</span>
          <span>req_lv</span><span>owned</span><span style={{textAlign:'right'}}>status</span>
        </div>
        {sorted.map((m,i) => {
          const c = RARITY_COLOR[m.rarity];
          return (
            <div key={m.id} style={{
              display:'grid',
              gridTemplateColumns:'56px 32px 1fr 60px 80px 80px 80px',
              padding:'9px 16px',
              borderBottom: i<sorted.length-1 ? `1px solid ${T.line}` : 'none',
              alignItems:'center',
              fontSize:12,
              opacity: m.discovered ? 1 : 0.5,
              background: i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent',
            }}>
              <span style={{color:T.textFaint, fontFamily:F}}>{String(m.id).padStart(4,'0')}</span>
              <span style={{fontSize:18}}>{m.discovered ? m.emoji : '·'}</span>
              <span style={{color: m.discovered ? T.text : T.textFaint}}>
                {m.discovered ? m.name : <span style={{fontStyle:'italic'}}>(undiscovered)</span>}
              </span>
              <span><span style={{
                fontSize:10, fontWeight:700, color:c, letterSpacing:'0.08em',
              }}>{m.rarity}</span></span>
              <span style={{color:T.textDim, fontFamily:F}}>{m.requiredLevel}</span>
              <span style={{color: m.owned>0 ? c : T.textFaint, fontFamily:F}}>
                {m.owned > 0 ? `× ${m.owned}` : '—'}
              </span>
              <span style={{textAlign:'right', fontFamily:F, fontSize:10}}>
                {m.discovered
                  ? <span style={{color:T.accent}}>● CAUGHT</span>
                  : <span style={{color:T.textFaint}}>○ HIDDEN</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MONSTER VARIATION 4 — Heatmap / GitHub-contrib style
// ═════════════════════════════════════════════════════════════
function AMonsterHeatmap() {
  const dex = BB_DERIVED.dex;
  const rarities = ['SSR','SR','R','N'];
  const grouped = rarities.map(r => dex.filter(d=>d.rarity===r));
  // rarity catch-rate over last 12 weeks (mock)
  const weeks = 12;
  const heatData = rarities.map(() =>
    Array.from({length: weeks}, () => Math.floor(Math.random()*5))
  );

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/monsters" cmd="bugbash stats --visualize"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Monster Dex</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:20}}>
        catch heatmap · last {weeks} weeks · {BB_DERIVED.discoveredCount}/{BB_DERIVED.totalCount} dex
      </div>

      {/* heatmap */}
      <div style={{
        background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
        padding:'16px 20px', marginBottom:18,
      }}>
        <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:10}}>
          CATCHES_PER_WEEK
        </div>
        {rarities.map((r, ri) => {
          const c = RARITY_COLOR[r];
          return (
            <div key={r} style={{display:'flex', alignItems:'center', gap:10, marginBottom:5}}>
              <span style={{width:32, fontSize:10, fontWeight:700, color:c, letterSpacing:'0.08em'}}>{r}</span>
              <div style={{display:'flex', gap:3, flex:1}}>
                {heatData[ri].map((v, wi) => (
                  <div key={wi} style={{
                    flex:1, aspectRatio:'1', maxWidth:18,
                    borderRadius:2,
                    background: v === 0 ? T.bgElev2 : `${c}${['','33','55','99','cc'][Math.min(v,4)]}`,
                    border:`1px solid ${v === 0 ? T.line : c+'33'}`,
                  }}/>
                ))}
              </div>
              <span style={{width:36, fontSize:10, color:T.textFaint, fontFamily:F, textAlign:'right'}}>
                {heatData[ri].reduce((a,b)=>a+b,0)}
              </span>
            </div>
          );
        })}
        <div style={{display:'flex', alignItems:'center', gap:6, marginTop:10, fontSize:9, color:T.textFaint}}>
          <span>less</span>
          {[0,1,2,3,4].map(v => (
            <div key={v} style={{
              width:10, height:10, borderRadius:2,
              background: v === 0 ? T.bgElev2 : `${T.accent}${['','33','55','99','cc'][v]}`,
              border:`1px solid ${v === 0 ? T.line : T.accent+'33'}`,
            }}/>
          ))}
          <span>more</span>
        </div>
      </div>

      {/* dex by rarity, dense-row */}
      {rarities.map((r, ri) => {
        const c = RARITY_COLOR[r];
        const items = grouped[ri];
        return (
          <div key={r} style={{marginBottom:16}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
              <span style={{
                fontSize:10, fontWeight:700, color:c, letterSpacing:'0.1em',
                padding:'2px 8px', borderRadius:2,
                background:c+'14', border:`1px solid ${c}55`,
              }}>{r}</span>
              <span style={{fontSize:11, color:T.textDim, fontFamily:F}}>
                {items.filter(i=>i.discovered).length}/{items.length}
              </span>
              <div style={{flex:1, height:1, background:T.line}}/>
            </div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {items.map(m => (
                <div key={m.id} style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'5px 10px',
                  background: m.discovered ? T.bgElev : 'transparent',
                  border:`1px ${m.discovered ? 'solid' : 'dashed'} ${m.discovered ? c+'33' : T.line}`,
                  borderRadius:3,
                  opacity: m.discovered ? 1 : 0.5,
                  fontSize:12,
                }}>
                  <span style={{fontSize:14}}>{m.discovered ? m.emoji : '·'}</span>
                  <span style={{color: m.discovered ? T.text : T.textFaint}}>
                    {m.discovered ? m.name : '???'}
                  </span>
                  {m.owned > 1 && (
                    <span style={{color:c, fontFamily:F, fontSize:10, fontWeight:600}}>×{m.owned}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ITEMS VARIATION 1 — package.json deps
// ═════════════════════════════════════════════════════════════
function AItemsPkg() {
  const items = BB_DATA.items;
  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/items" cmd="cat inventory.json"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Inventory</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        package manifest · {items.length} entries
      </div>

      <div style={{
        background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
        padding:'18px 22px', fontSize:13, lineHeight:1.7,
      }}>
        <div><span style={{color:T.text}}>{'{'}</span></div>
        <div style={{paddingLeft:20, color:T.textDim}}>
          <span style={{color:T.blue}}>"hero"</span><span>: </span>
          <span style={{color:T.gold}}>"@bugbash/{BB_DATA.user.username}"</span>,
        </div>
        <div style={{paddingLeft:20, color:T.textDim}}>
          <span style={{color:T.blue}}>"level"</span><span>: </span>
          <span style={{color:T.accent}}>{BB_DATA.hero.level}</span>,
        </div>
        <div style={{paddingLeft:20, color:T.textDim}}>
          <span style={{color:T.blue}}>"inventory"</span><span>: {'{'}</span>
        </div>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <div key={it.id} style={{paddingLeft:40, position:'relative', display:'flex', alignItems:'center'}}>
              <span style={{fontSize:18, marginRight:10, width:24}}>{it.emoji}</span>
              <span style={{color:T.blue}}>"{it.name}"</span>
              <span style={{color:T.textDim}}>: </span>
              <span style={{color:T.gold}}>"^{it.qty}.0.0"</span>
              <span style={{color:T.textDim}}>{last ? '' : ','}</span>
              <span style={{color:T.textFaint, marginLeft:14, fontSize:11, fontStyle:'italic'}}>
                // {it.kind} · {it.desc}
              </span>
            </div>
          );
        })}
        <div style={{paddingLeft:20, color:T.textDim}}>{'}'}</div>
        <div><span style={{color:T.text}}>{'}'}</span></div>
      </div>

      <div style={{marginTop:12, fontSize:11, color:T.textFaint}}>
        ☞ tip: <span style={{color:T.accent}}>npm i</span> earns no XP. ship PRs instead.
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ITEMS VARIATION 2 — Minecraft-style 9-cell hotbar + grid
// ═════════════════════════════════════════════════════════════
function AItemsHotbar() {
  const items = BB_DATA.items;
  const ROWS = 4, COLS = 9;
  // place items into a fixed grid; rest empty
  const slots = Array.from({length: ROWS*COLS}, () => null);
  items.forEach((it, i) => { slots[i] = it; });
  // add some duplicates / spread to feel alive
  if (items.length >= 6) {
    slots[10] = items[0]; slots[14] = items[3]; slots[20] = items[1];
  }

  const cell = (it, idx, selected) => (
    <div key={idx} style={{
      width:64, height:64,
      background: selected ? T.bgElev : T.bgElev2,
      border:`1px solid ${selected ? T.accent+'88' : T.line}`,
      borderRadius:4,
      display:'flex', alignItems:'center', justifyContent:'center',
      position:'relative',
      boxShadow: selected ? `0 0 0 2px ${T.accent}22, inset 0 0 12px ${T.accent}22` : 'none',
    }}>
      {it && <>
        <span style={{fontSize:30}}>{it.emoji}</span>
        <span style={{
          position:'absolute', bottom:3, right:5,
          fontSize:11, color:T.text, fontFamily:F, fontWeight:700,
          textShadow:'1px 1px 0 #000',
        }}>{it.qty}</span>
      </>}
    </div>
  );

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/items" cmd="inv --grid"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Inventory</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        {ROWS * COLS} slots · {slots.filter(Boolean).length} occupied
      </div>

      <div style={{display:'flex', gap:24, alignItems:'flex-start'}}>
        {/* Main grid */}
        <div style={{
          background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
          padding:14, display:'inline-block',
        }}>
          <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:10}}>
            STORAGE
          </div>
          {Array.from({length:ROWS}).map((_,r) => (
            <div key={r} style={{display:'flex', gap:4, marginBottom:4}}>
              {Array.from({length:COLS}).map((_,c) => {
                const idx = r*COLS + c;
                return cell(slots[idx], idx, false);
              })}
            </div>
          ))}
          {/* hotbar */}
          <div style={{
            marginTop:18, paddingTop:14, borderTop:`1px solid ${T.line}`,
          }}>
            <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:10}}>
              HOTBAR · 1–9
            </div>
            <div style={{display:'flex', gap:4}}>
              {[0,1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{position:'relative'}}>
                  {cell(items[i % items.length], i, i === 0)}
                  <div style={{
                    position:'absolute', top:-1, left:3,
                    fontSize:9, color:T.textFaint, fontFamily:F,
                  }}>{i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* selected detail */}
        <div style={{
          flex:1, maxWidth:280,
          background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
          padding:'18px 20px',
        }}>
          <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:14}}>
            SELECTED
          </div>
          <div style={{
            width:'100%', aspectRatio:'1', maxHeight:140,
            background:T.bgElev2, border:`1px solid ${T.line}`, borderRadius:4,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:72, marginBottom:14,
          }}>
            {items[0].emoji}
          </div>
          <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>{items[0].name}</div>
          <div style={{fontSize:11, color:T.textDim, lineHeight:1.6, marginBottom:14}}>
            {items[0].desc}
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:T.textFaint, fontFamily:F}}>
            <span>kind: <span style={{color:T.text}}>{items[0].kind}</span></span>
            <span>qty: <span style={{color:T.accent}}>×{items[0].qty}</span></span>
          </div>
          <button style={{
            marginTop:14, width:'100%', padding:'10px 14px',
            background:T.accent, color:T.bg, border:'none', borderRadius:4,
            fontFamily:F, fontWeight:700, fontSize:12, letterSpacing:'0.05em',
            cursor:'pointer',
          }}>USE [E]</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ITEMS VARIATION 3 — `docker ps` style dense table
// ═════════════════════════════════════════════════════════════
function AItemsDockerPs() {
  const items = BB_DATA.items;
  // mock CONTAINER_ID
  const hash = (s) => Array.from(s).reduce((a,c)=>a*33+c.charCodeAt(0), 5381) >>> 0;
  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/items" cmd="bugbash inv ps -a"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Inventory</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        {items.length} stacks · {items.reduce((a,b)=>a+b.qty,0)} total ·
        <span style={{color:T.accent, marginLeft:8}}>● all healthy</span>
      </div>

      <div style={{
        background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6, overflow:'hidden',
        fontFamily:F, fontSize:12,
      }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'120px 36px 1fr 100px 80px 100px',
          padding:'10px 18px', borderBottom:`1px solid ${T.line}`,
          fontSize:10, color:T.textFaint, letterSpacing:'0.12em',
          background:T.bgElev2,
        }}>
          <span>STACK_ID</span>
          <span></span>
          <span>NAME</span>
          <span>KIND</span>
          <span style={{textAlign:'right'}}>QTY</span>
          <span>STATUS</span>
        </div>
        {items.map((it, i) => {
          const stackId = hash(it.id).toString(16).slice(0,10);
          return (
            <div key={it.id} style={{
              display:'grid',
              gridTemplateColumns:'120px 36px 1fr 100px 80px 100px',
              padding:'12px 18px',
              borderBottom: i<items.length-1 ? `1px solid ${T.line}` : 'none',
              alignItems:'center',
            }}>
              <span style={{color:T.textFaint, fontSize:11}}>{stackId}</span>
              <span style={{fontSize:20}}>{it.emoji}</span>
              <div>
                <div style={{color:T.text}}>{it.name}</div>
                <div style={{color:T.textFaint, fontSize:10, marginTop:2, fontStyle:'italic'}}>{it.desc}</div>
              </div>
              <span style={{color:T.textDim, fontSize:11}}>
                <span style={{
                  padding:'2px 6px', borderRadius:2,
                  background:T.bgElev2, border:`1px solid ${T.line}`,
                }}>{it.kind}</span>
              </span>
              <span style={{textAlign:'right', color:T.accent, fontWeight:600}}>×{it.qty}</span>
              <span style={{color:T.accent, fontSize:11}}>● ready</span>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:10, fontSize:11, color:T.textFaint}}>
        $ <span style={{color:T.accent}}>bugbash inv use</span> <span style={{color:T.blue}}>&lt;STACK_ID&gt;</span> to consume an item
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ITEMS VARIATION 4 — Equipment + bag (RPG character sheet)
// ═════════════════════════════════════════════════════════════
function AItemsEquip() {
  const items = BB_DATA.items;
  // equipped slots — pretend hero has equipped one of each
  const slots = [
    { name:'HEAD',  glyph:'⛑', equipped:null },
    { name:'CHEST', glyph:'🦺', equipped:null },
    { name:'MAIN',  glyph:'⚔', equipped:{name:'伝説の剣', emoji:'⚔️', rarity:'SSR'} },
    { name:'OFF',   glyph:'🛡', equipped:{name:'銀の盾', emoji:'🛡', rarity:'SR'} },
    { name:'TRINK', glyph:'💍', equipped:{name:'守護のお守り', emoji:'🧿', rarity:'R'} },
    { name:'BOOTS', glyph:'👢', equipped:null },
  ];

  return (
    <div style={{padding:'28px 36px', fontFamily:F, color:T.text}}>
      <APrompt path="~/items" cmd="hero --equipment"/>
      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Equipment & Bag</div>
      <div style={{fontSize:12, color:T.textDim, marginBottom:24}}>
        {slots.filter(s=>s.equipped).length}/{slots.length} slots equipped ·
        bag: {items.length} stacks
      </div>

      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:18, alignItems:'flex-start'}}>
        {/* Character / equipped */}
        <div style={{
          background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
          padding:'20px',
        }}>
          <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:14}}>
            EQUIPPED
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {slots.map(s => {
              const c = s.equipped ? RARITY_COLOR[s.equipped.rarity] : null;
              return (
                <div key={s.name} style={{
                  background: s.equipped ? T.bgElev2 : 'transparent',
                  border:`1px ${s.equipped ? 'solid' : 'dashed'} ${s.equipped ? c+'55' : T.line}`,
                  borderRadius:4, padding:'12px 10px',
                  display:'flex', alignItems:'center', gap:10,
                  minHeight:54,
                  boxShadow: s.equipped && s.equipped.rarity==='SSR' ? `inset 0 0 12px ${c}22` : 'none',
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:3,
                    background:T.bg, border:`1px solid ${T.line}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18,
                  }}>{s.equipped ? s.equipped.emoji : <span style={{opacity:0.3}}>{s.glyph}</span>}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:9, color:T.textFaint, letterSpacing:'0.1em', marginBottom:2}}>{s.name}</div>
                    <div style={{
                      fontSize:11, color: s.equipped ? T.text : T.textFaint,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>
                      {s.equipped ? s.equipped.name : 'empty'}
                    </div>
                  </div>
                  {s.equipped && <span style={{
                    fontSize:9, fontWeight:700, color:c, letterSpacing:'0.08em',
                  }}>{s.equipped.rarity}</span>}
                </div>
              );
            })}
          </div>

          {/* simple stat block */}
          <div style={{marginTop:18, paddingTop:14, borderTop:`1px solid ${T.line}`}}>
            <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em', marginBottom:10}}>STATS</div>
            <div style={{fontSize:12, color:T.textDim, lineHeight:1.7, fontFamily:F}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span>ATK</span><span style={{color:T.text}}>+ <span style={{color:T.gold}}>248</span></span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span>DEF</span><span style={{color:T.text}}>+ <span style={{color:T.blue}}>164</span></span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span>LUCK</span><span style={{color:T.text}}>+ <span style={{color:T.purple}}>32</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bag (consumables) */}
        <div style={{
          background:T.bgElev, border:`1px solid ${T.line}`, borderRadius:6,
          padding:'20px',
        }}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
            <span style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em'}}>BAG</span>
            <span style={{fontSize:10, color:T.textFaint, fontFamily:F}}>{items.length}/24</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
            {items.map(it => (
              <div key={it.id} style={{
                background:T.bgElev2, border:`1px solid ${T.line}`, borderRadius:4,
                padding:'12px 14px',
                display:'flex', alignItems:'center', gap:12,
              }}>
                <div style={{
                  width:38, height:38, borderRadius:3,
                  background:T.bg, border:`1px solid ${T.line}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22,
                  position:'relative',
                }}>
                  {it.emoji}
                  <span style={{
                    position:'absolute', bottom:-3, right:-3,
                    fontSize:9, color:T.text, fontFamily:F, fontWeight:700,
                    background:T.bgElev, padding:'1px 4px', borderRadius:2,
                    border:`1px solid ${T.line}`,
                  }}>{it.qty}</span>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:12, fontWeight:500}}>{it.name}</div>
                  <div style={{fontSize:10, color:T.textDim, marginTop:2,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    {it.desc}
                  </div>
                </div>
              </div>
            ))}
            {/* empty slots */}
            {Array.from({length:6}).map((_,i)=>(
              <div key={'e'+i} style={{
                background:'transparent', border:`1px dashed ${T.line}`, borderRadius:4,
                minHeight:62,
              }}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wrappers — full screen with sidebar
// ─────────────────────────────────────────────────────────────
function AScreenWrap({active, children}) {
  return (
    <div style={{
      display:'flex', minHeight:820,
      background:T.bg, color:T.text, fontFamily:F,
    }}>
      <ASidebar active={active}/>
      <main style={{flex:1, overflow:'auto'}}>{children}</main>
    </div>
  );
}

function AVariation({kind}) {
  const map = {
    'm-tree':    [<AMonsterTree/>,    'monsters'],
    'm-cards':   [<AMonsterCards/>,   'monsters'],
    'm-table':   [<AMonsterTable/>,   'monsters'],
    'm-heatmap': [<AMonsterHeatmap/>, 'monsters'],
    'i-pkg':     [<AItemsPkg/>,       'items'],
    'i-hotbar':  [<AItemsHotbar/>,    'items'],
    'i-docker':  [<AItemsDockerPs/>,  'items'],
    'i-equip':   [<AItemsEquip/>,     'items'],
  };
  const [content, active] = map[kind];
  return <AScreenWrap active={active}>{content}</AScreenWrap>;
}

window.AVariation = AVariation;
