// Direction A — Console RPG
// Aesthetic: terminal / devtool / engineer's home turf
// "あなたはコードを書いている。勇者も育っている。"

const A_TOKENS = {
  bg: '#0b0f0d',
  bgElev: '#101614',
  bgElev2: '#161e1b',
  line: '#1f2a26',
  lineStrong: '#2d3d37',
  text: '#dcefe5',
  textDim: '#7a9c8c',
  textFaint: '#4a6157',
  accent: '#7ee787',     // primary green
  accentDim: '#3da55a',
  blue: '#79c0ff',
  purple: '#d2a8ff',
  gold: '#e3b341',
  pink: '#ff7b72',
};

const A_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

function ATag({children, color, bg, border}) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:3,
      fontSize:11, fontWeight:600, letterSpacing:'0.04em',
      color: color || A_TOKENS.accent,
      background: bg || 'rgba(126,231,135,0.08)',
      border: `1px solid ${border || 'rgba(126,231,135,0.25)'}`,
      fontFamily: A_FONT,
    }}>{children}</span>
  );
}

function ARarityChip({r}) {
  const map = {
    N:   { color:'#7a9c8c', bg:'rgba(122,156,140,0.1)', border:'rgba(122,156,140,0.3)' },
    R:   { color:'#79c0ff', bg:'rgba(121,192,255,0.1)', border:'rgba(121,192,255,0.3)' },
    SR:  { color:'#d2a8ff', bg:'rgba(210,168,255,0.1)', border:'rgba(210,168,255,0.35)' },
    SSR: { color:'#e3b341', bg:'rgba(227,179,65,0.12)', border:'rgba(227,179,65,0.4)' },
  };
  const c = map[r];
  return <ATag color={c.color} bg={c.bg} border={c.border}>{r}</ATag>;
}

function ASidebar({active}) {
  const items = [
    { key:'home',     label:'~/home',         icon:'⌂' },
    { key:'monsters', label:'~/monsters',     icon:'◆' },
    { key:'items',    label:'~/items',        icon:'▣' },
    { key:'activity', label:'~/activity',     icon:'≡' },
    { key:'settings', label:'~/settings',     icon:'⚙' },
  ];
  return (
    <aside style={{
      width:240, flexShrink:0,
      borderRight:`1px solid ${A_TOKENS.line}`,
      background: A_TOKENS.bgElev,
      display:'flex', flexDirection:'column',
      fontFamily:A_FONT,
    }}>
      {/* logo / window chrome */}
      <div style={{
        padding:'14px 16px',
        borderBottom:`1px solid ${A_TOKENS.line}`,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{display:'flex', gap:6}}>
          <span style={{width:10, height:10, borderRadius:5, background:'#ff5f56'}}></span>
          <span style={{width:10, height:10, borderRadius:5, background:'#ffbd2e'}}></span>
          <span style={{width:10, height:10, borderRadius:5, background:'#27c93f'}}></span>
        </div>
        <div style={{
          fontSize:11, color:A_TOKENS.textDim, marginLeft:6,
          letterSpacing:'0.06em',
        }}>bugbash · v0.1.0</div>
      </div>

      <div style={{padding:'16px 12px 8px', fontSize:10, color:A_TOKENS.textFaint, letterSpacing:'0.12em', textTransform:'uppercase'}}>
        Navigation
      </div>
      <nav style={{display:'flex', flexDirection:'column', padding:'0 8px'}}>
        {items.map(it => {
          const isActive = it.key === active;
          return (
            <a key={it.key} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 10px', borderRadius:4,
              fontSize:13,
              color: isActive ? A_TOKENS.accent : A_TOKENS.text,
              background: isActive ? 'rgba(126,231,135,0.08)' : 'transparent',
              borderLeft: isActive ? `2px solid ${A_TOKENS.accent}` : '2px solid transparent',
              cursor:'pointer',
            }}>
              <span style={{width:14, color: isActive ? A_TOKENS.accent : A_TOKENS.textDim}}>{it.icon}</span>
              <span>{it.label}</span>
            </a>
          );
        })}
      </nav>

      {/* hero summary at bottom */}
      <div style={{marginTop:'auto', padding:12, borderTop:`1px solid ${A_TOKENS.line}`, background:A_TOKENS.bgElev2}}>
        <div style={{fontSize:10, color:A_TOKENS.textFaint, letterSpacing:'0.1em', marginBottom:6}}>HERO_STATUS</div>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
          <div style={{
            width:32, height:32, borderRadius:4,
            background:`linear-gradient(135deg, ${A_TOKENS.accent}, ${A_TOKENS.blue})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#0b0f0d', fontSize:14, fontWeight:700,
          }}>H</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:12, color:A_TOKENS.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{BB_DATA.user.username}</div>
            <div style={{fontSize:10, color:A_TOKENS.textDim}}>Lv.{BB_DATA.hero.level}</div>
          </div>
        </div>
        <div style={{height:4, background:'#0b0f0d', borderRadius:2, overflow:'hidden'}}>
          <div style={{
            height:'100%', width:`${BB_DATA.hero.progressRatio*100}%`,
            background:`linear-gradient(90deg, ${A_TOKENS.accent}, ${A_TOKENS.blue})`,
          }}></div>
        </div>
      </div>
    </aside>
  );
}

function AHomeScreen() {
  const h = BB_DATA.hero;
  const progressPct = (h.progressRatio * 100).toFixed(1);
  return (
    <div style={{padding:'28px 36px', fontFamily:A_FONT, color:A_TOKENS.text}}>
      {/* command prompt header */}
      <div style={{marginBottom:24, fontSize:13, color:A_TOKENS.textDim}}>
        <span style={{color:A_TOKENS.accent}}>{BB_DATA.user.username}@bugbash</span>
        <span style={{color:A_TOKENS.textFaint}}>:</span>
        <span style={{color:A_TOKENS.blue}}>~/home</span>
        <span style={{color:A_TOKENS.textFaint}}>$ </span>
        <span>hero --stats</span>
        <span style={{
          display:'inline-block', width:8, height:14, marginLeft:2,
          background:A_TOKENS.accent, verticalAlign:'middle',
          animation:'a-blink 1s steps(2) infinite',
        }}></span>
      </div>

      {/* hero status block — like a `git status` output */}
      <div style={{
        background:A_TOKENS.bgElev,
        border:`1px solid ${A_TOKENS.line}`,
        borderRadius:6,
        padding:'24px 28px',
        marginBottom:24,
      }}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20}}>
          <div>
            <div style={{fontSize:11, color:A_TOKENS.textFaint, letterSpacing:'0.12em', marginBottom:6}}>HERO.HEAD</div>
            <div style={{display:'flex', alignItems:'baseline', gap:14}}>
              <div style={{fontSize:72, fontWeight:700, lineHeight:1, color:A_TOKENS.accent, fontFamily:A_FONT}}>
                Lv<span style={{color:A_TOKENS.text}}>.{h.level}</span>
              </div>
              <ATag>● online</ATag>
            </div>
            <div style={{fontSize:13, color:A_TOKENS.textDim, marginTop:8}}>
              hero_id: <span style={{color:A_TOKENS.text}}>{BB_DATA.user.githubId}</span>
              <span style={{color:A_TOKENS.textFaint, margin:'0 8px'}}>·</span>
              github: <span style={{color:A_TOKENS.blue}}>@{BB_DATA.user.username}</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11, color:A_TOKENS.textFaint, letterSpacing:'0.12em', marginBottom:6}}>TOTAL_XP</div>
            <div style={{fontSize:32, fontWeight:600, color:A_TOKENS.gold, fontFamily:A_FONT}}>
              {h.totalExperience.toLocaleString()}
            </div>
          </div>
        </div>

        {/* xp bar — mimicking a build progress bar */}
        <div style={{marginTop:8}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:A_TOKENS.textDim, marginBottom:8}}>
            <span>building Lv.{h.level+1} … <span style={{color:A_TOKENS.text}}>{h.currentLevelExperience}/{h.experienceForNextLevel}</span></span>
            <span style={{color:A_TOKENS.accent}}>{progressPct}%</span>
          </div>
          {/* ascii-like bar */}
          <div style={{
            display:'flex', gap:2,
            fontSize:14, lineHeight:1, fontFamily:A_FONT,
          }}>
            {Array.from({length:40}).map((_,i) => {
              const filled = i < (h.progressRatio * 40);
              return (
                <span key={i} style={{
                  flex:1, height:14,
                  background: filled ? A_TOKENS.accent : A_TOKENS.bgElev2,
                  boxShadow: filled ? `0 0 6px ${A_TOKENS.accent}` : 'none',
                  borderRadius:1,
                }}></span>
              );
            })}
          </div>
          <div style={{fontSize:12, color:A_TOKENS.textDim, marginTop:10}}>
            <span style={{color:A_TOKENS.textFaint}}>{'>'} </span>
            ETA: <span style={{color:A_TOKENS.text}}>{h.experienceToNextLevel}</span> XP to next level
            <span style={{color:A_TOKENS.textFaint, margin:'0 8px'}}>·</span>
            ≈ <span style={{color:A_TOKENS.text}}>{Math.ceil(h.experienceToNextLevel/100)}</span> PRs
          </div>
        </div>
      </div>

      {/* stats grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24}}>
        {[
          { label:'PRs merged',       value:'128', delta:'+2 today',  color:A_TOKENS.accent },
          { label:'monsters caught',  value:`${BB_DERIVED.ownedTotal}`, delta:`${BB_DERIVED.discoveredCount}/${BB_DERIVED.totalCount} dex`, color:A_TOKENS.purple },
          { label:'SSR rate',         value:'4.2%', delta:'lifetime', color:A_TOKENS.gold },
          { label:'streak',           value:'7d',  delta:'best: 14d', color:A_TOKENS.blue },
        ].map((s,i) => (
          <div key={i} style={{
            background:A_TOKENS.bgElev,
            border:`1px solid ${A_TOKENS.line}`,
            borderRadius:6, padding:'14px 16px',
          }}>
            <div style={{fontSize:11, color:A_TOKENS.textFaint, letterSpacing:'0.1em', marginBottom:6}}>{s.label.toUpperCase()}</div>
            <div style={{fontSize:22, fontWeight:600, color:s.color, fontFamily:A_FONT}}>{s.value}</div>
            <div style={{fontSize:11, color:A_TOKENS.textDim, marginTop:4}}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* split: party + activity feed */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* party */}
        <div style={{
          background:A_TOKENS.bgElev,
          border:`1px solid ${A_TOKENS.line}`,
          borderRadius:6, overflow:'hidden',
        }}>
          <div style={{
            padding:'10px 16px',
            borderBottom:`1px solid ${A_TOKENS.line}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{fontSize:11, color:A_TOKENS.textFaint, letterSpacing:'0.12em'}}>ACTIVE_PARTY [4]</div>
            <span style={{fontSize:11, color:A_TOKENS.textDim}}>edit →</span>
          </div>
          <div style={{padding:20, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            {[
              {emoji:'🐉', name:'ドラゴン',   r:'SSR'},
              {emoji:'🦅', name:'フェニックス', r:'SSR'},
              {emoji:'🦄', name:'ユニコーン', r:'SR'},
              {emoji:'🧜', name:'マーメイド', r:'SR'},
            ].map((m,i) => (
              <div key={i} style={{
                aspectRatio:'1',
                background: A_TOKENS.bgElev2,
                border:`1px solid ${A_TOKENS.line}`,
                borderRadius:4,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                padding:8, position:'relative',
              }}>
                <div style={{fontSize:36, lineHeight:1, marginBottom:6}}>{m.emoji}</div>
                <div style={{fontSize:10, color:A_TOKENS.textDim, textAlign:'center'}}>{m.name}</div>
                <div style={{position:'absolute', top:4, right:4}}>
                  <ARarityChip r={m.r}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* activity log — looks like a git log */}
        <div style={{
          background:A_TOKENS.bgElev,
          border:`1px solid ${A_TOKENS.line}`,
          borderRadius:6, overflow:'hidden',
        }}>
          <div style={{
            padding:'10px 16px',
            borderBottom:`1px solid ${A_TOKENS.line}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{fontSize:11, color:A_TOKENS.textFaint, letterSpacing:'0.12em'}}>git log --activity</div>
            <span style={{fontSize:11, color:A_TOKENS.accent}}>● 3 unread</span>
          </div>
          <div style={{padding:'4px 0'}}>
            {BB_DATA.activities.slice(0,5).map((a,i) => (
              <div key={a.id} style={{
                padding:'10px 16px',
                borderBottom: i<4 ? `1px solid ${A_TOKENS.line}` : 'none',
                display:'flex', gap:12,
              }}>
                <div style={{
                  width:28, height:28, borderRadius:4, flexShrink:0,
                  background:A_TOKENS.bgElev2,
                  border:`1px solid ${A_TOKENS.line}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16,
                }}>{a.monster.emoji}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:12, color:A_TOKENS.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    <span style={{color:A_TOKENS.gold}}>+{a.xp} XP</span>
                    <span style={{color:A_TOKENS.textFaint}}> · </span>
                    <span>caught </span>
                    <span style={{color:'#fff'}}>{a.monster.name}</span>
                    <span style={{marginLeft:6}}><ARarityChip r={a.monster.rarity}/></span>
                    {a.isLevelUp && <span style={{marginLeft:6}}><ATag color={A_TOKENS.gold} bg="rgba(227,179,65,0.1)" border="rgba(227,179,65,0.4)">LV UP</ATag></span>}
                  </div>
                  <div style={{fontSize:11, color:A_TOKENS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    <span style={{color:A_TOKENS.blue}}>{a.repo.split('/')[1]}#{a.prNumber}</span>
                    <span style={{color:A_TOKENS.textFaint}}> · </span>
                    <span>{a.title}</span>
                  </div>
                  <div style={{fontSize:10, color:A_TOKENS.textFaint, marginTop:2}}>{a.occurredAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes a-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function AMonstersScreen() {
  const dex = BB_DERIVED.dex;
  const byRarity = ['SSR','SR','R','N'].map(r => ({
    rarity:r,
    items: dex.filter(d => d.rarity === r),
  }));

  return (
    <div style={{padding:'28px 36px', fontFamily:A_FONT, color:A_TOKENS.text}}>
      <div style={{marginBottom:20, fontSize:13, color:A_TOKENS.textDim}}>
        <span style={{color:A_TOKENS.accent}}>{BB_DATA.user.username}@bugbash</span>
        <span style={{color:A_TOKENS.textFaint}}>:</span>
        <span style={{color:A_TOKENS.blue}}>~/monsters</span>
        <span style={{color:A_TOKENS.textFaint}}>$ </span>
        <span>ls --rarity</span>
      </div>

      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20}}>
        <div>
          <div style={{fontSize:28, fontWeight:600, color:A_TOKENS.text}}>Monster Dex</div>
          <div style={{fontSize:12, color:A_TOKENS.textDim, marginTop:4}}>
            discovered <span style={{color:A_TOKENS.accent}}>{BB_DERIVED.discoveredCount}</span>
            <span style={{color:A_TOKENS.textFaint}}> / </span>
            <span>{BB_DERIVED.totalCount}</span>
            <span style={{color:A_TOKENS.textFaint, margin:'0 10px'}}>·</span>
            owned <span style={{color:A_TOKENS.accent}}>{BB_DERIVED.ownedTotal}</span> instances
          </div>
        </div>
        {/* filter chips */}
        <div style={{display:'flex', gap:6}}>
          {['all','SSR','SR','R','N'].map((f,i) => (
            <button key={f} style={{
              padding:'6px 12px', borderRadius:4,
              fontSize:11, fontFamily:A_FONT, fontWeight:600,
              background: i===0 ? 'rgba(126,231,135,0.1)' : 'transparent',
              color: i===0 ? A_TOKENS.accent : A_TOKENS.textDim,
              border:`1px solid ${i===0 ? 'rgba(126,231,135,0.4)' : A_TOKENS.line}`,
              cursor:'pointer', letterSpacing:'0.05em',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {byRarity.map(group => (
        <div key={group.rarity} style={{marginBottom:24}}>
          <div style={{
            display:'flex', alignItems:'center', gap:10, marginBottom:10,
          }}>
            <ARarityChip r={group.rarity}/>
            <span style={{fontSize:12, color:A_TOKENS.textDim}}>
              {group.items.filter(i=>i.discovered).length} / {group.items.length} discovered
            </span>
            <div style={{flex:1, height:1, background:A_TOKENS.line, marginLeft:6}}></div>
          </div>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(8, 1fr)',
            gap:8,
          }}>
            {group.items.map(m => {
              const cmap = {N:'#7a9c8c', R:'#79c0ff', SR:'#d2a8ff', SSR:'#e3b341'}[m.rarity];
              return (
                <div key={m.id} style={{
                  aspectRatio:'1',
                  background: m.discovered ? A_TOKENS.bgElev : 'transparent',
                  border: `1px solid ${m.discovered ? A_TOKENS.line : A_TOKENS.line}`,
                  borderRadius:4,
                  position:'relative',
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  padding:10,
                  opacity: m.discovered ? 1 : 0.45,
                  borderStyle: m.discovered ? 'solid' : 'dashed',
                }}>
                  {m.discovered && m.rarity === 'SSR' && (
                    <div style={{
                      position:'absolute', inset:-1,
                      borderRadius:4, pointerEvents:'none',
                      boxShadow:`inset 0 0 12px rgba(227,179,65,0.25)`,
                    }}></div>
                  )}
                  <div style={{
                    fontSize:32, lineHeight:1, marginBottom:6,
                    filter: m.discovered ? 'none' : 'brightness(0) invert(0.3)',
                  }}>
                    {m.discovered ? m.emoji : '?'}
                  </div>
                  <div style={{
                    fontSize:10, color: m.discovered ? A_TOKENS.text : A_TOKENS.textFaint,
                    textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%',
                  }}>
                    {m.discovered ? m.name : '???'}
                  </div>
                  <div style={{
                    position:'absolute', top:4, left:4,
                    fontSize:9, color:A_TOKENS.textFaint, fontFamily:A_FONT,
                  }}>#{m.id}</div>
                  {m.owned > 1 && (
                    <div style={{
                      position:'absolute', top:4, right:4,
                      fontSize:9, color:cmap, fontFamily:A_FONT, fontWeight:600,
                    }}>×{m.owned}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AItemsScreen() {
  return (
    <div style={{padding:'28px 36px', fontFamily:A_FONT, color:A_TOKENS.text}}>
      <div style={{marginBottom:20, fontSize:13, color:A_TOKENS.textDim}}>
        <span style={{color:A_TOKENS.accent}}>{BB_DATA.user.username}@bugbash</span>
        <span style={{color:A_TOKENS.textFaint}}>:</span>
        <span style={{color:A_TOKENS.blue}}>~/items</span>
        <span style={{color:A_TOKENS.textFaint}}>$ </span>
        <span>inv --list</span>
      </div>

      <div style={{fontSize:28, fontWeight:600, marginBottom:4}}>Inventory</div>
      <div style={{fontSize:12, color:A_TOKENS.textDim, marginBottom:24}}>
        {BB_DATA.items.length} stacks · {BB_DATA.items.reduce((a,b)=>a+b.qty,0)} items total
      </div>

      <div style={{
        background: A_TOKENS.bgElev,
        border: `1px solid ${A_TOKENS.line}`,
        borderRadius: 6,
        overflow:'hidden',
      }}>
        {/* table header */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'40px 1fr 100px 120px 60px',
          padding:'10px 16px',
          borderBottom:`1px solid ${A_TOKENS.line}`,
          fontSize:10, color:A_TOKENS.textFaint, letterSpacing:'0.12em',
        }}>
          <span></span>
          <span>NAME</span>
          <span>KIND</span>
          <span>EFFECT</span>
          <span style={{textAlign:'right'}}>QTY</span>
        </div>
        {BB_DATA.items.map((it,i) => (
          <div key={it.id} style={{
            display:'grid',
            gridTemplateColumns:'40px 1fr 100px 120px 60px',
            padding:'12px 16px',
            borderBottom: i<BB_DATA.items.length-1 ? `1px solid ${A_TOKENS.line}` : 'none',
            alignItems:'center',
            fontSize:13,
          }}>
            <div style={{fontSize:20}}>{it.emoji}</div>
            <div style={{color:A_TOKENS.text}}>{it.name}</div>
            <div style={{color:A_TOKENS.textDim, fontSize:11}}>{it.kind}</div>
            <div style={{color:A_TOKENS.textDim, fontSize:11}}>{it.desc}</div>
            <div style={{textAlign:'right', color:A_TOKENS.accent, fontFamily:A_FONT, fontWeight:600}}>×{it.qty}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ALoginScreen() {
  return (
    <div style={{
      minHeight:680,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:A_FONT, color:A_TOKENS.text,
      background:A_TOKENS.bg,
      padding:40,
    }}>
      <div style={{width:480, maxWidth:'100%'}}>
        {/* terminal window */}
        <div style={{
          background:A_TOKENS.bgElev,
          border:`1px solid ${A_TOKENS.line}`,
          borderRadius:6,
          overflow:'hidden',
          boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* chrome */}
          <div style={{
            padding:'10px 14px',
            borderBottom:`1px solid ${A_TOKENS.line}`,
            display:'flex', alignItems:'center', gap:10,
            background:A_TOKENS.bgElev2,
          }}>
            <div style={{display:'flex', gap:6}}>
              <span style={{width:10, height:10, borderRadius:5, background:'#ff5f56'}}></span>
              <span style={{width:10, height:10, borderRadius:5, background:'#ffbd2e'}}></span>
              <span style={{width:10, height:10, borderRadius:5, background:'#27c93f'}}></span>
            </div>
            <div style={{fontSize:11, color:A_TOKENS.textDim, marginLeft:6}}>~/bugbash — login</div>
          </div>
          <div style={{padding:'32px 28px 28px'}}>
            <div style={{fontSize:13, color:A_TOKENS.textDim, marginBottom:18, lineHeight:1.7}}>
              <div><span style={{color:A_TOKENS.accent}}>$</span> ./bugbash --auth github</div>
              <div style={{color:A_TOKENS.textFaint}}>{`>`} Initializing hero registry…</div>
              <div style={{color:A_TOKENS.textFaint}}>{`>`} Awaiting OAuth2 handshake.</div>
            </div>
            <div style={{
              fontSize:48, fontWeight:700, lineHeight:1.05, marginBottom:8,
              background:`linear-gradient(135deg, ${A_TOKENS.accent}, ${A_TOKENS.blue})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              BugBash
            </div>
            <div style={{fontSize:14, color:A_TOKENS.textDim, lineHeight:1.6, marginBottom:24}}>
              GitHubの開発活動が、そのまま勇者の冒険になる。<br/>
              PR をマージしよう。XP とモンスターが手に入る。
            </div>

            <button style={{
              width:'100%', padding:'14px 16px',
              background:A_TOKENS.text, color:A_TOKENS.bg,
              border:'none', borderRadius:4,
              fontSize:14, fontWeight:600, fontFamily:A_FONT,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              cursor:'pointer',
              letterSpacing:'0.02em',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              Authorize with GitHub
            </button>

            <div style={{marginTop:18, fontSize:11, color:A_TOKENS.textFaint, textAlign:'center'}}>
              hero_id := github_id · permissions: read:user, repo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ADirection({screen}) {
  return (
    <div style={{
      width:1280, height:820,
      background:A_TOKENS.bg,
      display:'flex',
      fontFamily:A_FONT,
      overflow:'hidden',
    }}>
      {screen !== 'login' && <ASidebar active={screen}/>}
      <main style={{flex:1, overflow:'auto'}}>
        {screen === 'home'     && <AHomeScreen/>}
        {screen === 'monsters' && <AMonstersScreen/>}
        {screen === 'items'    && <AItemsScreen/>}
        {screen === 'login'    && <ALoginScreen/>}
      </main>
    </div>
  );
}

window.ADirection = ADirection;
