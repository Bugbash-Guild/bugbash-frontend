// Direction A — Equipment Modal + Clickable Hero wrapper
// Used by AHomeScreen2 (Hero centric home).
//
// Depends on globals from hero-system.jsx:
//   Hero, EQUIP_CATALOG, SLOT_KEYS, SLOT_LABELS, lookupEquip, totalStats
// And constants from dirA.jsx: A_TOKENS, A_FONT.

const {useState: useEqState, useEffect: useEqEffect} = React;

// ─────────────────────────────────────────────────────────────
// Equipment Modal — opens when hero is clicked
// Click outside or X to close. ESC also closes.
// ─────────────────────────────────────────────────────────────
function EquipModal({open, onClose, loadout, setLoadout, heroStyle}) {
  const T = A_TOKENS, F = A_FONT;
  const RC = {N:'#7a9c8c', R:'#79c0ff', SR:'#d2a8ff', SSR:'#e3b341'};
  const stats = totalStats(loadout);
  const [activeSlot, setActiveSlot] = useEqState('weapon');

  useEqEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0,
      background:'rgba(8,11,9,0.78)',
      backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:50, fontFamily:F, color:T.text,
      animation:'a-fade 0.15s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.bgElev,
        border:`1px solid ${T.lineStrong}`,
        borderRadius:8, width:'min(880px, 92%)',
        maxHeight:'88%', overflow:'hidden',
        display:'grid', gridTemplateColumns:'320px 1fr',
        boxShadow:`0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${T.accent}22`,
      }}>
        {/* LEFT — preview */}
        <div style={{
          background:T.bg, borderRight:`1px solid ${T.line}`,
          padding:'20px', display:'flex', flexDirection:'column',
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <span style={{fontSize:11, color:T.accent, letterSpacing:'0.12em', fontWeight:600}}>▸ EQUIPMENT</span>
            <button onClick={onClose} style={{
              background:'transparent', border:'none', color:T.textDim,
              cursor:'pointer', fontSize:16, fontFamily:F, padding:0, lineHeight:1,
            }}>✕</button>
          </div>
          <div style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            background:T.bgElev2, borderRadius:6, border:`1px solid ${T.line}`,
            minHeight:280, padding:'18px',
          }}>
            <Hero style={heroStyle} loadout={loadout}/>
          </div>
          <div style={{
            marginTop:14, padding:'12px 14px',
            background:T.bgElev2, border:`1px solid ${T.line}`, borderRadius:4,
          }}>
            <div style={{fontSize:9, color:T.textFaint, letterSpacing:'0.12em', marginBottom:8}}>STATS</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, fontFamily:F}}>
              <div>
                <div style={{fontSize:10, color:T.textFaint}}>ATK</div>
                <div style={{fontSize:22, color:T.gold, fontWeight:600, lineHeight:1}}>{stats.atk}</div>
              </div>
              <div>
                <div style={{fontSize:10, color:T.textFaint}}>DEF</div>
                <div style={{fontSize:22, color:T.blue, fontWeight:600, lineHeight:1}}>{stats.def}</div>
              </div>
              <div>
                <div style={{fontSize:10, color:T.textFaint}}>LUCK</div>
                <div style={{fontSize:22, color:T.purple, fontWeight:600, lineHeight:1}}>{stats.luck}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — slot picker + items */}
        <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{display:'flex', borderBottom:`1px solid ${T.line}`}}>
            {SLOT_KEYS.map(slot => {
              const eq = lookupEquip(slot, loadout[slot]);
              const labels = SLOT_LABELS[slot];
              const isActive = activeSlot === slot;
              const c = eq.rarity ? RC[eq.rarity] : null;
              return (
                <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                  flex:1,
                  padding:'14px 8px',
                  background: isActive ? T.bgElev2 : 'transparent',
                  border:'none',
                  borderBottom: isActive ? `2px solid ${T.accent}` : `2px solid transparent`,
                  cursor:'pointer', fontFamily:F,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  color: isActive ? T.text : T.textDim,
                  position:'relative',
                }}>
                  <span style={{fontSize:9, color:T.textFaint, letterSpacing:'0.12em'}}>{labels.short}</span>
                  <span style={{fontSize:18, opacity: eq.emoji ? 1 : 0.3}}>{eq.emoji || labels.glyph}</span>
                  {c && (
                    <span style={{
                      position:'absolute', top:6, right:8,
                      width:5, height:5, borderRadius:'50%', background:c,
                    }}/>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{padding:'18px 22px', overflow:'auto'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <div>
                <div style={{fontSize:11, color:T.textFaint, letterSpacing:'0.12em'}}>
                  {SLOT_LABELS[activeSlot].short} ・ {SLOT_LABELS[activeSlot].ja}
                </div>
                <div style={{fontSize:13, color:T.text, marginTop:2}}>
                  選択中: <span style={{color:T.accent}}>{lookupEquip(activeSlot, loadout[activeSlot]).name}</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {EQUIP_CATALOG[activeSlot].map(opt => {
                const oc = opt.rarity ? RC[opt.rarity] : T.textFaint;
                const selected = opt.id === loadout[activeSlot];
                return (
                  <button key={opt.id} onClick={() => setLoadout({...loadout, [activeSlot]: opt.id})} style={{
                    background: selected ? oc + '14' : T.bgElev2,
                    border:`1px solid ${selected ? oc + 'aa' : T.line}`,
                    borderRadius:4,
                    padding:'10px 12px',
                    display:'flex', alignItems:'center', gap:12,
                    cursor:'pointer', textAlign:'left',
                    fontFamily:F, color:T.text,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:3,
                      background:T.bg, border:`1px solid ${T.line}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20, opacity: opt.emoji ? 1 : 0.3,
                    }}>{opt.emoji || SLOT_LABELS[activeSlot].glyph}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12, fontWeight: opt.rarity ? 500 : 400,
                        color: opt.rarity ? T.text : T.textDim}}>
                        {opt.name}
                      </div>
                      <div style={{fontSize:10, color:T.textFaint, marginTop:3, fontFamily:F}}>
                        {opt.atk ? <span>ATK <span style={{color:T.gold}}>+{opt.atk}</span> </span> : null}
                        {opt.def ? <span>DEF <span style={{color:T.blue}}>+{opt.def}</span> </span> : null}
                        {opt.luck ? <span>LUCK <span style={{color:T.purple}}>+{opt.luck}</span></span> : null}
                        {!opt.atk && !opt.def && !opt.luck && <span>—</span>}
                      </div>
                    </div>
                    {opt.rarity && (
                      <span style={{
                        fontSize:10, fontWeight:700, color:oc, letterSpacing:'0.08em',
                        padding:'2px 8px', borderRadius:2,
                        background: oc+'14', border:`1px solid ${oc}55`,
                      }}>{opt.rarity}</span>
                    )}
                    {selected && (
                      <span style={{fontSize:11, color:T.accent, fontFamily:F}}>● 装備中</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Clickable hero wrapper — adds hover hint + click handler
// ─────────────────────────────────────────────────────────────
function ClickableHero({heroStyle, loadout, onClick, hint}) {
  const T = A_TOKENS, F = A_FONT;
  const [hover, setHover] = useEqState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:'relative', cursor:'pointer',
        transition:'transform 0.15s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <Hero style={heroStyle} loadout={loadout}/>
      <div style={{
        position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)',
        whiteSpace:'nowrap',
        padding:'4px 10px', borderRadius:3,
        fontSize:10, fontFamily:F, letterSpacing:'0.08em',
        color: hover ? T.bg : T.textFaint,
        background: hover ? T.accent : 'transparent',
        border:`1px solid ${hover ? T.accent : T.line}`,
        opacity: hover ? 1 : 0.7,
        transition:'all 0.15s',
        pointerEvents:'none',
      }}>
        {hint || 'CLICK TO EQUIP'}
      </div>
    </div>
  );
}

window.EquipModal = EquipModal;
window.ClickableHero = ClickableHero;

// global state for monster companion (set by Monster TCG, read by Home)
window.__BB_STATE = window.__BB_STATE || { companion: '19' };
window.__BB_LISTENERS = window.__BB_LISTENERS || new Set();
window.__BB_SET_COMPANION = (id) => {
  window.__BB_STATE.companion = id;
  window.__BB_LISTENERS.forEach(fn => fn());
};
window.useCompanion = function() {
  const [, force] = useEqState(0);
  useEqEffect(() => {
    const fn = () => force(n => n + 1);
    window.__BB_LISTENERS.add(fn);
    return () => window.__BB_LISTENERS.delete(fn);
  }, []);
  return [
    window.__BB_STATE.companion,
    (id) => window.__BB_SET_COMPANION(id),
  ];
};

// fade animation
if (!document.getElementById('equip-modal-anims')) {
  const s = document.createElement('style');
  s.id = 'equip-modal-anims';
  s.textContent = `@keyframes a-fade { from { opacity:0; } to { opacity:1; } }`;
  document.head.appendChild(s);
}
