// src/pages/studio/ConfigTemplateFoodTruck.tsx
import { useState, useEffect } from 'react';
import TemplateFoodTruck, { CONFIG_FOODTRUCK_DEFAUT } from '../../templates/TemplateFoodTruck';
import type { ConfigFoodTruck, SectionConfig, PlatMenu, AvisFoodTruck } from '../../templates/TemplateFoodTruck';

type Onglet = 'identite'|'apparence'|'sections'|'emplacement'|'horaires'|'stats'|'menu'|'avis'|'evenements'|'contact';
const CP = '#ff6b00';

const Inp = ({ value, onChange, placeholder, type='text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CP} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const Txt = ({ value, onChange, placeholder, rows=3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', resize:'vertical' as any, fontFamily:'inherit', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CP} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const F = ({ label, desc, children }: any) => (
  <div style={{ marginBottom:11 }}>
    <label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:3 }}>{label}</label>
    {desc && <p style={{ fontSize:10, color:'#aaa', marginBottom:4 }}>{desc}</p>}
    {children}
  </div>
);
const S = ({ titre, children }: any) => (
  <div style={{ marginBottom:18 }}>
    <h3 style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.12em', color:'#aaa', marginBottom:9, paddingBottom:5, borderBottom:'1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);
function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }
const Del = ({ onClick }: any) => <button onClick={onClick} style={{ background:'#fef2f2', border:'none', borderRadius:4, padding:'2px 7px', fontSize:10, color:'#dc2626', cursor:'pointer' }}>✕</button>;

function SectionsManager({ sections, onChange }: { sections:SectionConfig[]; onChange:(s:SectionConfig[])=>void }) {
  const dep = (i: number, d: -1|1) => {
    const arr = [...sections].sort((a,b)=>a.ordre-b.ordre);
    const ni = i+d; if(ni<0||ni>=arr.length) return;
    const t=arr[i].ordre; arr[i]={...arr[i],ordre:arr[ni].ordre}; arr[ni]={...arr[ni],ordre:t};
    onChange(arr);
  };
  const tog = (id: string) => onChange(sections.map(s=>s.id===id?{...s,actif:!s.actif}:s));
  const sorted=[...sections].sort((a,b)=>a.ordre-b.ordre);
  const ico: Record<string,string> = { hero:'🚚', emplacement:'📍', stats:'📊', menu:'🍔', apropos:'📖', evenements:'📅', avis:'💬', contact:'✉️' };
  return (
    <div>
      <div style={{ background:'#fff8f0', border:`1px solid ${CP}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a2a00', marginBottom:12 }}><strong>🚚 Sections</strong> — Toggle + ▲▼ pour réordonner</div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {sorted.map((sec,i) => (
          <div key={sec.id} style={{ display:'flex', alignItems:'center', gap:7, background:sec.actif?'#fff8f0':'#fafafa', border:`2px solid ${sec.actif?CP:'#e5e7eb'}`, borderRadius:8, padding:'7px 9px', transition:'all .2s', opacity:sec.actif?1:.55 }}>
            <span style={{ fontSize:13, width:18, textAlign:'center', flexShrink:0 }}>{ico[sec.id]||'📄'}</span>
            <div style={{ flex:1 }}><span style={{ fontSize:10, fontWeight:800, color:'#aaa', marginRight:4 }}>#{i+1}</span><span style={{ fontSize:11, fontWeight:600, color:sec.actif?'#1a1a1a':'#999' }}>{sec.label}</span></div>
            <button onClick={()=>tog(sec.id)} style={{ width:38, height:19, borderRadius:10, border:'none', cursor:'pointer', background:sec.actif?CP:'#ddd', position:'relative', flexShrink:0, transition:'background .25s' }}>
              <div style={{ position:'absolute', top:1.5, left:sec.actif?19:1.5, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .25s' }} />
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
              <button onClick={()=>dep(i,-1)} disabled={i===0} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===0?'#f5f5f5':'#fff',cursor:i===0?'default':'pointer',fontSize:7,color:i===0?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▲</button>
              <button onClick={()=>dep(i,1)} disabled={i===sorted.length-1} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===sorted.length-1?'#f5f5f5':'#fff',cursor:i===sorted.length-1?'default':'pointer',fontSize:7,color:i===sorted.length-1?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:9, padding:'5px 9px', background:'#f5f5f5', borderRadius:6, fontSize:11, color:'#666' }}><strong>{sorted.filter(s=>s.actif).length}</strong> sections actives sur {sorted.length}</div>
    </div>
  );
}

interface Props { vendeurId: string; onSauvegarde?: (config:ConfigFoodTruck)=>Promise<void>; }

export default function ConfigTemplateFoodTruck({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigFoodTruck>({ ...CONFIG_FOODTRUCK_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauv, setSauv] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r=>r.ok?r.json():null).then(data=>{ if(data?.config) setConfig(prev=>({...prev,...data.config})); }).catch(()=>{});
  }, [vendeurId]);

  const set = (k: keyof ConfigFoodTruck, v: any) => setConfig(prev=>({...prev,[k]:v}));
  const handleSave = async () => {
    setSauv('loading');
    try {
      if(onSauvegarde){ await onSauvegarde(config); }
      else {
        const token=localStorage.getItem('token');
        const res=await fetch(`/api/studio/sites/${vendeurId}/config`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},credentials:'include',body:JSON.stringify({config,template_id:'vitrine-foodtruck'})});
        if(!res.ok) throw new Error();
      }
      setSauv('ok'); setTimeout(()=>setSauv('idle'),2500);
    } catch { setSauv('err'); setTimeout(()=>setSauv('idle'),3000); }
  };

  const sections  = ea(config.sections,          CONFIG_FOODTRUCK_DEFAUT.sections);
  const stats     = ea(config.stats,              CONFIG_FOODTRUCK_DEFAUT.stats);
  const plats     = ea(config.plats,              CONFIG_FOODTRUCK_DEFAUT.plats);
  const avis      = ea(config.avis,               CONFIG_FOODTRUCK_DEFAUT.avis);
  const evs       = ea(config.evenements,         CONFIG_FOODTRUCK_DEFAUT.evenements);
  const horaires  = ea(config.horairesOuverture,  CONFIG_FOODTRUCK_DEFAUT.horairesOuverture);
  const cats      = ea(config.categoriesMenu,     CONFIG_FOODTRUCK_DEFAUT.categoriesMenu);

  const updStat  = (i:number,k:string,v:string)=>{const a=[...stats];a[i]={...a[i],[k]:v};set('stats',a);};
  const updPlat  = (i:number,k:keyof PlatMenu,v:any)=>{const a=[...plats];a[i]={...a[i],[k]:v};set('plats',a);};
  const delPlat  = (i:number)=>{const a=[...plats];a.splice(i,1);set('plats',a);};
  const addPlat  = ()=>set('plats',[...plats,{nom:'Nouveau plat',description:'',prix:'0$',photo:'',categorie:cats[0]||'',populaire:false}]);
  const updAvis  = (i:number,k:keyof AvisFoodTruck,v:any)=>{const a=[...avis];a[i]={...a[i],[k]:v};set('avis',a);};
  const delAvis  = (i:number)=>{const a=[...avis];a.splice(i,1);set('avis',a);};
  const addAvis  = ()=>set('avis',[...avis,{texte:'',auteur:'',note:5,photo:'',date:''}]);
  const updEv    = (i:number,k:string,v:string)=>{const a=[...evs];a[i]={...a[i],[k]:v};set('evenements',a);};
  const delEv    = (i:number)=>{const a=[...evs];a.splice(i,1);set('evenements',a);};
  const addEv    = ()=>set('evenements',[...evs,{titre:'Nouvel événement',date:'',lieu:'',description:''}]);
  const updHor   = (i:number,k:string,v:any)=>{const a=[...horaires];a[i]={...a[i],[k]:v};set('horairesOuverture',a);};

  const ONGLETS: {id:Onglet;label:string;emoji:string}[] = [
    {id:'identite',label:'Identité',emoji:'🚚'},{id:'apparence',label:'Couleurs',emoji:'🎨'},
    {id:'sections',label:'Sections',emoji:'📐'},{id:'emplacement',label:'Emplacement',emoji:'📍'},
    {id:'horaires',label:'Horaires',emoji:'⏰'},{id:'stats',label:'Stats',emoji:'📊'},
    {id:'menu',label:'Menu',emoji:'🍔'},{id:'avis',label:'Avis',emoji:'💬'},
    {id:'evenements',label:'Événements',emoji:'📅'},{id:'contact',label:'Contact',emoji:'✉️'},
  ];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter',sans-serif", background:'#f8f9fb' }}>
      <div style={{ width:360, minWidth:320, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'13px 13px 0', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#0d0d0d,${CP})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚚</div>
            <div><p style={{ fontSize:10, color:'#888', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>Template Gratuit</p><p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>Food Truck</p></div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, paddingBottom:10 }}>
            {ONGLETS.map(o => <button key={o.id} onClick={()=>setOnglet(o.id)} style={{ padding:'3px 6px', borderRadius:5, border:'none', cursor:'pointer', fontSize:10, fontWeight:500, background:onglet===o.id?CP:'#f3f4f6', color:onglet===o.id?'#fff':'#555', transition:'all .15s' }}>{o.emoji} {o.label}</button>)}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:13 }}>

          {onglet==='identite' && (<>
            <S titre="Food Truck">
              <F label="Nom du truck"><Inp value={config.nomCamion} onChange={(v:string)=>set('nomCamion',v)} /></F>
              <F label="Tagline 1"><Inp value={config.tagline} onChange={(v:string)=>set('tagline',v)} placeholder="Street Food." /></F>
              <F label="Tagline 2 (dégradé)"><Inp value={config.sousTagline} onChange={(v:string)=>set('sousTagline',v)} placeholder="Faite avec amour." /></F>
              <F label="Description courte"><Txt value={config.description} onChange={(v:string)=>set('description',v)} rows={2} /></F>
              <F label="Description à propos"><Txt value={config.descriptionAPropos} onChange={(v:string)=>set('descriptionAPropos',v)} rows={3} /></F>
            </S>
            <S titre="Photos">
              <F label="Photo Hero (fond plein écran)"><Inp value={config.photoHero} onChange={(v:string)=>set('photoHero',v)} /></F>
              <F label="Photo Camion (section à propos)"><Inp value={config.photoCamion} onChange={(v:string)=>set('photoCamion',v)} /></F>
            </S>
          </>)}

          {onglet==='apparence' && (<>
            <S titre="Couleurs">
              {([['couleurPrimaire','Orange principal'],['couleurSecondaire','Jaune accent'],['couleurFond','Fond sombre'],['couleurTexte','Texte clair']] as [keyof ConfigFoodTruck,string][]).map(([k,label]) => (
                <F key={k} label={label}>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="color" value={(config[k] as string)||'#000'} onChange={e=>set(k,e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }} />
                    <Inp value={config[k] as string} onChange={(v:string)=>set(k,v)} />
                  </div>
                </F>
              ))}
            </S>
          </>)}

          {onglet==='sections' && <SectionsManager sections={sections} onChange={s=>set('sections',s)} />}

          {onglet==='emplacement' && (<>
            <div style={{ background:'#fff8f0', border:`1px solid ${CP}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a2a00', marginBottom:12 }}>
              📍 Changez l'adresse chaque jour — la map se met à jour automatiquement!
            </div>
            <S titre="Emplacement du jour">
              <F label="Adresse complète" desc="Ex: 1234 rue Sainte-Catherine, Montréal, QC"><Inp value={config.emplacementAujourdhui} onChange={(v:string)=>set('emplacementAujourdhui',v)} /></F>
              <F label="URL Google Maps Embed" desc="Optionnel — pour personnaliser la map"><Txt value={config.emplacementLien} onChange={(v:string)=>set('emplacementLien',v)} rows={2} /></F>
            </S>
          </>)}

          {onglet==='horaires' && (
            <S titre="Horaires d'ouverture">
              {horaires.map((h,i) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:7, padding:9, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1a1a1a' }}>{h.jour}</span>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer' }}>
                      <input type="checkbox" checked={h.ouvert} onChange={e=>updHor(i,'ouvert',e.target.checked)} />
                      {h.ouvert ? '✅ Ouvert' : '❌ Fermé'}
                    </label>
                  </div>
                  {h.ouvert && <F label="Heures (ex: 11h – 21h)"><Inp value={h.heures} onChange={(v:string)=>updHor(i,'heures',v)} placeholder="11h – 21h" /></F>}
                </div>
              ))}
            </S>
          )}

          {onglet==='stats' && (
            <S titre="4 chiffres clés">
              {stats.map((s,i) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:7, padding:9, marginBottom:9 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:6 }}>
                    <F label="Icône"><Inp value={s.icone} onChange={(v:string)=>updStat(i,'icone',v)} /></F>
                    <F label="Valeur"><Inp value={s.valeur} onChange={(v:string)=>updStat(i,'valeur',v)} /></F>
                    <F label="Libellé"><Inp value={s.label} onChange={(v:string)=>updStat(i,'label',v)} /></F>
                  </div>
                </div>
              ))}
            </S>
          )}

          {onglet==='menu' && (<>
            <S titre="Catégories">
              <F label="Catégories (virgules)"><Inp value={cats.join(', ')} onChange={(v:string)=>set('categoriesMenu',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} placeholder="Burgers, Frites, Boissons" /></F>
            </S>
            <S titre="Plats">
              {plats.map((p,i) => (
                <div key={i} style={{ border:`1.5px solid ${p.populaire?CP:'#e5e7eb'}`, borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:11, fontWeight:600 }}>{p.nom}</span>
                    <div style={{ display:'flex', gap:5 }}>
                      <label style={{ fontSize:10, color:'#888', display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!p.populaire} onChange={e=>updPlat(i,'populaire',e.target.checked)} />⭐
                      </label>
                      <Del onClick={()=>delPlat(i)} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <F label="Nom"><Inp value={p.nom} onChange={(v:string)=>updPlat(i,'nom',v)} /></F>
                    <F label="Prix"><Inp value={p.prix} onChange={(v:string)=>updPlat(i,'prix',v)} placeholder="14$" /></F>
                    <F label="Catégorie">
                      <select value={p.categorie} onChange={e=>updPlat(i,'categorie',e.target.value)} style={{ width:'100%',padding:'7px',border:'1.5px solid #e5e7eb',borderRadius:5,fontSize:12,background:'#fff' }}>
                        {cats.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </F>
                    <F label="Badge (optionnel)"><Inp value={p.badge||''} onChange={(v:string)=>updPlat(i,'badge',v)} placeholder="BEST-SELLER" /></F>
                  </div>
                  <F label="Description"><Txt value={p.description} onChange={(v:string)=>updPlat(i,'description',v)} rows={2} /></F>
                  <F label="Photo (URL)"><Inp value={p.photo} onChange={(v:string)=>updPlat(i,'photo',v)} /></F>
                </div>
              ))}
              <button onClick={addPlat} style={{ width:'100%', padding:8, border:`2px dashed ${CP}`, borderRadius:8, background:'transparent', color:CP, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un plat</button>
            </S>
          </>)}

          {onglet==='avis' && (<>
            {avis.map((a,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>Avis {i+1}</span><Del onClick={()=>delAvis(i)} /></div>
                <F label="Texte"><Txt value={a.texte} onChange={(v:string)=>updAvis(i,'texte',v)} rows={3} /></F>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <F label="Auteur"><Inp value={a.auteur} onChange={(v:string)=>updAvis(i,'auteur',v)} /></F>
                  <F label="Date"><Inp value={a.date} onChange={(v:string)=>updAvis(i,'date',v)} placeholder="Il y a 2 jours" /></F>
                  <F label="Note"><select value={a.note} onChange={e=>updAvis(i,'note',parseInt(e.target.value))} style={{ width:'100%',padding:'7px',border:'1.5px solid #e5e7eb',borderRadius:5,fontSize:12,background:'#fff' }}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} ★</option>)}</select></F>
                </div>
                <F label="Photo (URL)"><Inp value={a.photo} onChange={(v:string)=>updAvis(i,'photo',v)} /></F>
              </div>
            ))}
            <button onClick={addAvis} style={{ width:'100%', padding:8, border:`2px dashed ${CP}`, borderRadius:8, background:'transparent', color:CP, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un avis</button>
          </>)}

          {onglet==='evenements' && (<>
            {evs.map((ev,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>{ev.titre}</span><Del onClick={()=>delEv(i)} /></div>
                <F label="Titre"><Inp value={ev.titre} onChange={(v:string)=>updEv(i,'titre',v)} /></F>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <F label="Date"><Inp value={ev.date} onChange={(v:string)=>updEv(i,'date',v)} placeholder="21 juin 2026" /></F>
                  <F label="Lieu"><Inp value={ev.lieu} onChange={(v:string)=>updEv(i,'lieu',v)} /></F>
                </div>
                <F label="Description"><Txt value={ev.description} onChange={(v:string)=>updEv(i,'description',v)} rows={2} /></F>
              </div>
            ))}
            <button onClick={addEv} style={{ width:'100%', padding:8, border:`2px dashed ${CP}`, borderRadius:8, background:'transparent', color:CP, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un événement</button>
          </>)}

          {onglet==='contact' && (<>
            <S titre="Coordonnées">
              <F label="Téléphone"><Inp value={config.telephone} onChange={(v:string)=>set('telephone',v)} /></F>
              <F label="Email"><Inp value={config.email} onChange={(v:string)=>set('email',v)} /></F>
            </S>
            <S titre="Réseaux sociaux">
              {(['instagram','facebook','tiktok'] as const).map(k=>(
                <F key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}><Inp value={config.reseaux?.[k]||''} onChange={(v:string)=>set('reseaux',{...config.reseaux,[k]:v})} /></F>
              ))}
            </S>
          </>)}

        </div>

        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_FOODTRUCK_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid #0d0d0d`, background:apercu?'#0d0d0d':'transparent', color:apercu?CP:'#0d0d0d', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauv==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauv==='ok'?'#10b981':sauv==='err'?'#dc2626':'#0d0d0d', color:sauv==='ok'||sauv==='err'?'#fff':CP, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauv==='loading'?'⏳...':sauv==='ok'?'✅ Sauvegardé!':sauv==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#0d0d0d', overflow:'hidden' }}>
        <div style={{ background:'#1a1200', borderBottom:'1px solid #f59e0b44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CP}33`:'transparent', color:modeApercu===m?CP:'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #333`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0d0d', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🚚</div>
          <p style={{ fontSize:15, color:CP, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CP}50` }}>Template Food Truck — Gratuit</p>
        </div>
      )}
    </div>
  );
}