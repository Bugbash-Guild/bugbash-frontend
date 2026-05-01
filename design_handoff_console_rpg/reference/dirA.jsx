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

// ═════════════════════════════════════════════════════════════
// AHomeScreen2 — Hero-centric layout (hero is the centerpiece)
// ═════════════════════════════════════════════════════════════
function AHomeScreen2() {
  const T = A_TOKENS, F = A_FONT;
  const h = BB_DATA.hero;
  const pct = (h.progressRatio * 100).toFixed(1);
  const [loadout, setLoadout] = React.useState(window.DEFAULT_LOADOUT || {});
  const [modalOpen, setModalOpen] = React.useState(false);
  const stats = window.totalStats ? window.totalStats(loadout) : {atk:0,def:0,luck:0};
  const ClickableHeroComp = window.ClickableHero;
  const EquipModalComp = window.EquipModal;
  const RC = {N:'#7a9c8c', R:'#79c0ff', SR:'#d2a8ff', SSR:'#e3b341'};

  const statBoxes = [
    { label:'PRs merged',      value:'128',                                delta:'+2 today',                                                                color:T.accent },
    { label:'monsters caught', value:`${BB_DERIVED.ownedTotal}`,            delta:`${BB_DERIVED.discoveredCount}/${BB_DERIVED.totalCount} dex`,              color:T.purple },
    { label:'SSR rate',        value:'4.2%',                                delta:'lifetime',                                                                color:T.gold },
    { label:'streak',          value:'7d',                                  delta:'best: 14d',                                                               color:T.blue  },
  ];

  return (
    <div style={{padding:'24px 36px 32px', fontFamily:F, color:T.text, position:'relative', minHeight:'100%'}}>
      {EquipModalComp && (
        <EquipModalComp
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          loadout={loadout}
          setLoadout={setLoadout}
          heroStyle="ascii"
        />
      )}

      {/* prompt header */}
      <div style={{marginBottom:14, fontSize:13, color:T.textDim}}>
        <span style={{color:T.accent}}>{BB_DATA.user.username}@bugbash</span>
        <span style={{color:T.textFaint}}>:</span>
        <span style={{color:T.blue}}>~/home</span>
        <span style={{color:T.textFaint}}>$ </span>
        <span>./hero --render --interactive</span>
        <span style={{
          display:'inline-block', width:8, height:14, marginLeft:2,
          background:T.accent, verticalAlign:'middle',
          animation:'a-blink 1s steps(2) infinite',
        }}/>
      </div>

      {/* HERO HERO PANEL — hero on the left like a big card, Lv status + XP on the right */}
      <div style={{
        background:T.bgElev,
        border:`1px solid ${T.line}`,
        borderRadius:8, padding:'24px 28px',
        display:'grid', gridTemplateColumns:'auto 1fr', gap:28,
        marginBottom:14, position:'relative', overflow:'hidden',
      }}>
        {/* ambient glow */}
        <div style={{
          position:'absolute', top:-120, right:-100, width:340, height:340,
          background:`radial-gradient(circle, ${T.accent}1a, transparent 60%)`,
          pointerEvents:'none',
        }}/>

        {/* LEFT: hero "big card" */}
        <div
          onClick={() => setModalOpen(true)}
          style={{
            width:240, minHeight:340,
            background:`linear-gradient(180deg, ${T.bgElev2} 0%, ${T.bg} 100%)`,
            border:`1px solid ${T.lineStrong}`,
            borderRadius:10,
            position:'relative', overflow:'hidden',
            cursor:'pointer',
            boxShadow:`0 8px 24px rgba(0,0,0,0.4), inset 0 0 30px ${T.accent}11`,
            transition:'transform 0.15s, box-shadow 0.15s',
            display:'flex', flexDirection:'column',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 14px 32px rgba(0,0,0,0.5), 0 0 0 1px ${T.accent}66, inset 0 0 30px ${T.accent}22`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), inset 0 0 30px ${T.accent}11`;
          }}
        >
          {/* level pill top-left */}
          <div style={{
            position:'absolute', top:10, left:10, zIndex:2,
            fontFamily:F, fontSize:9, color:T.accent,
            padding:'3px 8px', background:T.bg+'cc', border:`1px solid ${T.accent}55`, borderRadius:2,
            letterSpacing:'0.12em', fontWeight:700,
          }}>Lv.{h.level}</div>
          {/* rarity-ish badge top-right */}
          <div style={{
            position:'absolute', top:10, right:10, zIndex:2,
            fontFamily:F, fontSize:9, color:T.gold,
            padding:'3px 8px', background:T.bg+'cc', border:`1px solid ${T.gold}55`, borderRadius:2,
            letterSpacing:'0.12em', fontWeight:700,
          }}>HERO</div>

          {/* hero render */}
          <div style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'40px 16px 18px',
            position:'relative',
          }}>
            {/* radial highlight behind hero */}
            <div style={{
              position:'absolute', top:'40%', left:'50%',
              width:200, height:200, transform:'translate(-50%, -50%)',
              background:`radial-gradient(circle, ${T.accent}22 0%, transparent 70%)`,
              pointerEvents:'none',
            }}/>
            {ClickableHeroComp ? (
              <div style={{transform:'scale(1.15)', position:'relative', zIndex:1}}>
                <ClickableHeroComp
                  heroStyle="ascii"
                  loadout={loadout}
                  onClick={() => setModalOpen(true)}
                />
              </div>
            ) : (
              <div style={{color:T.textFaint, fontSize:11}}>loading hero…</div>
            )}
          </div>

          {/* footer name plate */}
          <div style={{
            padding:'10px 14px',
            borderTop:`1px solid ${T.line}`,
            background:T.bg+'aa',
          }}>
            <div style={{fontSize:13, fontWeight:600, color:T.text}}>{BB_DATA.user.username}</div>
            <div style={{fontSize:10, color:T.textFaint, fontFamily:F, marginTop:2, letterSpacing:'0.05em'}}>
              click to equip →
            </div>
          </div>
        </div>

        {/* RIGHT: status + XP */}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:0, position:'relative', zIndex:1}}>
          <div>
            <div style={{fontSize:11, color:T.textFaint, letterSpacing:'0.16em', fontWeight:600}}>HERO STATUS</div>
            <div style={{display:'flex', alignItems:'baseline', gap:14, marginTop:6}}>
              <div style={{
                fontSize:80, fontWeight:700, lineHeight:1, color:T.text,
                letterSpacing:'-0.04em', fontFamily:F,
              }}>
                Lv<span style={{color:T.accent}}>.{h.level}</span>
              </div>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'4px 10px', borderRadius:3,
                background:T.accent+'18', color:T.accent,
                fontSize:11, fontWeight:600, fontFamily:F,
                border:`1px solid ${T.accent}44`,
              }}>
                <span style={{width:6, height:6, borderRadius:3, background:T.accent, boxShadow:`0 0 6px ${T.accent}`}}/>
                ACTIVE
              </div>
            </div>
            <div style={{fontSize:13, color:T.textDim, marginTop:8}}>
              {h.totalExperience.toLocaleString()} XP earned
              <span style={{color:T.textFaint, margin:'0 8px'}}>·</span>
              128 PRs merged
              <span style={{color:T.textFaint, margin:'0 8px'}}>·</span>
              7d streak
            </div>

            {/* stats inline */}
            <div style={{display:'flex', gap:10, marginTop:16}}>
              {[
                {k:'ATK', v:stats.atk, c:T.gold},
                {k:'DEF', v:stats.def, c:T.blue},
                {k:'LUCK', v:stats.luck, c:T.purple},
              ].map(s => (
                <div key={s.k} style={{
                  flex:1,
                  padding:'8px 12px',
                  background:T.bgElev2, border:`1px solid ${T.line}`, borderRadius:4,
                  fontFamily:F,
                }}>
                  <div style={{fontSize:9, color:T.textFaint, letterSpacing:'0.14em'}}>{s.k}</div>
                  <div style={{fontSize:22, fontWeight:600, color:s.c, lineHeight:1.1, marginTop:2}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* xp progress */}
          <div style={{marginTop:24}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:T.textDim, marginBottom:8}}>
              <span><span style={{color:T.text, fontWeight:600}}>{h.currentLevelExperience}</span> / {h.experienceForNextLevel} XP</span>
              <span style={{color:T.accent, fontFamily:F}}>{pct}%</span>
            </div>
            <div style={{display:'flex', gap:2}}>
              {Array.from({length:60}).map((_,i) => {
                const filled = i < (h.progressRatio * 60);
                return (
                  <span key={i} style={{
                    flex:1, height:10,
                    background: filled ? T.accent : T.bgElev2,
                    boxShadow: filled ? `0 0 5px ${T.accent}aa` : 'none',
                    borderRadius:1,
                  }}/>
                );
              })}
            </div>
            <div style={{fontSize:12, color:T.textFaint, marginTop:8, fontFamily:F}}>
              <span style={{color:T.textDim}}>{h.experienceToNextLevel} XP</span> to Lv.{h.level+1}
              <span style={{color:T.line, margin:'0 8px'}}>·</span>
              ≈ {Math.ceil(h.experienceToNextLevel/100)} more PRs
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — stat boxes + activity */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:14}}>
        {/* stats grid 2x2 */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {statBoxes.map((s,i) => (
            <div key={i} style={{
              background:T.bgElev,
              border:`1px solid ${T.line}`,
              borderRadius:6, padding:'12px 14px',
            }}>
              <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.1em', marginBottom:5}}>{s.label.toUpperCase()}</div>
              <div style={{fontSize:20, fontWeight:600, color:s.color, fontFamily:F}}>{s.value}</div>
              <div style={{fontSize:10, color:T.textDim, marginTop:3}}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* activity log */}
        <div style={{
          background:T.bgElev,
          border:`1px solid ${T.line}`,
          borderRadius:6, overflow:'hidden',
        }}>
          <div style={{
            padding:'9px 14px',
            borderBottom:`1px solid ${T.line}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{fontSize:10, color:T.textFaint, letterSpacing:'0.12em'}}>git log --activity</div>
            <span style={{fontSize:10, color:T.accent}}>● 3 unread</span>
          </div>
          <div>
            {BB_DATA.activities.slice(0,4).map((a,i) => (
              <div key={a.id} style={{
                padding:'8px 14px',
                borderBottom: i<3 ? `1px solid ${T.line}` : 'none',
                display:'flex', gap:10,
              }}>
                <div style={{
                  width:24, height:24, borderRadius:3, flexShrink:0,
                  background:T.bgElev2, border:`1px solid ${T.line}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14,
                }}>{a.monster.emoji}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:11, color:T.text, marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    <span style={{color:T.gold}}>+{a.xp} XP</span>
                    <span style={{color:T.textFaint}}> · </span>
                    caught <span style={{color:'#fff'}}>{a.monster.name}</span>
                    <span style={{marginLeft:5, color:RC[a.monster.rarity], fontSize:9, fontWeight:700}}>{a.monster.rarity}</span>
                    {a.isLevelUp && <span style={{marginLeft:6, color:T.gold, fontSize:9, fontWeight:700}}>LV.UP</span>}
                  </div>
                  <div style={{fontSize:10, color:T.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    <span style={{color:T.blue}}>{a.repo.split('/')[1]}#{a.prNumber}</span>
                    <span style={{color:T.textFaint}}> · </span>
                    <span>{a.title}</span>
                  </div>
                </div>
              </div>
            ))}
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
        {screen === 'home'     && <AHomeScreen2/>}
        {screen === 'monsters' && <AMonsterCards/>}
        {screen === 'items'    && <AItemsHotbar/>}
        {screen === 'login'    && <ALoginScreen/>}
      </main>
    </div>
  );
}

window.ADirection = ADirection;
