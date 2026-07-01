// src/pages/studio/ConfigTemplateCoachVie.tsx
import { useState, useEffect } from 'react';
import TemplateCoachVie, { CONFIG_COACH_DEFAUT } from '../../templates/TemplateCoachVie';
import type { ConfigCoachVie, SectionConfig, ProgrammeCoach, TemoignageCoach } from '../../templates/TemplateCoachVie';

type Onglet = 'identite'|'apparence'|'sections'|'stats'|'piliers'|'programmes'|'processus'|'temoignages'|'faq'|'contact';
const CM = '#C9A96E';
const CV = '#2C3E35';

const Inp = ({ value, onChange, placeholder, type='text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CM} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const Txt = ({ value, onChange, placeholder, rows=3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', resize:'vertical' as any, fontFamily:'inherit', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CM} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const F = ({ label, children }: any) => <div style={{ marginBottom:11 }}><label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:3 }}>{label}</label>{children}</div>;
const S = ({ titre, children }: any) => <div style={{ marginBottom:18 }}><h3 style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.12em', color:'#aaa', marginBottom:9, paddingBottom:5, borderBottom:'1px solid #f0f0f0' }}>{titre}</h3>{children}</div>;
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
  const ico: Record<string,string> = { hero:'🌟',stats:'📊',piliers:'🔄',programmes:'🎯',processus:'🪜',apropos:'👤',temoignages:'💬',faq:'❓',contact:'✉️' };
  return (
    <div>
      <div style={{ background:'#fdf8f0', border:`1px solid ${CM}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a5a1a', marginBottom:12 }}><strong>🌿 Sections</strong> — Toggle + ▲▼ pour réordonner</div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {sorted.map((sec,i) => (
          <div key={sec.id} style={{ display:'flex', alignItems:'center', gap:7, background:sec.actif?'#fdf8f0':'#fafafa', border:`2px solid ${sec.actif?CM:'#e5e7eb'}`, borderRadius:8, padding:'7px 9px', transition:'all .2s', opacity:sec.actif?1:.55 }}>
            <span style={{ fontSize:13, width:18, textAlign:'center' as any, flexShrink:0 }}>{ico[sec.id]||'📄'}</span>
            <div style={{ flex:1 }}><span style={{ fontSize:10, fontWeight:800, color:'#aaa', marginRight:4 }}>#{i+1}</span><span style={{ fontSize:11, fontWeight:600, color:sec.actif?'#1a1a1a':'#999' }}>{sec.label}</span></div>
            <button onClick={()=>tog(sec.id)} style={{ width:38, height:19, borderRadius:10, border:'none', cursor:'pointer', background:sec.actif?CM:'#ddd', position:'relative', flexShrink:0, transition:'background .25s' }}>
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

const PALETTES = [
  { nom:'Sable & Forêt (défaut)', co:'#C9A96E', cv:'#2C3E35', cf:'#F7F3EE', cs:'#E8DDD0', cg:'#6B7B6E' },
  { nom:'Or & Bleu nuit',         co:'#D4AF37', cv:'#1B2A4A', cf:'#F5F2EA', cs:'#E2D9C8', cg:'#5A6B7E' },
  { nom:'Terracotta & Sauge',     co:'#C17B4A', cv:'#3D5A47', cf:'#FBF0E9', cs:'#ECD8C5', cg:'#7A8F80' },
  { nom:'Bordeaux & Crème',       co:'#8B3A3A', cv:'#4A1A1A', cf:'#FAF2F2', cs:'#EADADA', cg:'#8A6A6A' },
  { nom:'Violet & Or',            co:'#9B7FD4', cv:'#2D1B4E', cf:'#F5F2FB', cs:'#E5DCF5', cg:'#7B6A9B' },
  { nom:'Teal & Sable',           co:'#5BA8A0', cv:'#1C3D3A', cf:'#F0F8F7', cs:'#D5EDEB', cg:'#5A7F7C' },
];

interface Props { vendeurId: string; onSauvegarde?: (config:ConfigCoachVie)=>Promise<void>; }

export default function ConfigTemplateCoachVie({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigCoachVie>({ ...CONFIG_COACH_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauv, setSauv] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r=>r.ok?r.json():null).then(data=>{ if(data?.config) setConfig(prev=>({...prev,...data.config})); }).catch(()=>{});
  }, [vendeurId]);

  const set = (k: keyof ConfigCoachVie, v: any) => setConfig(prev=>({...prev,[k]:v}));

  const handleSave = async () => {
    setSauv('loading');
    try {
      if (onSauvegarde) { await onSauvegarde(config); }
      else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, credentials:'include', body: JSON.stringify({ config, template_id:'cours-coach' }) });
        if (!res.ok) throw new Error();
      }
      setSauv('ok'); setTimeout(()=>setSauv('idle'), 2500);
    } catch { setSauv('err'); setTimeout(()=>setSauv('idle'), 3000); }
  };

  // Programmes
  const progs = ea(config.programmes, CONFIG_COACH_DEFAUT.programmes);
  const updProg = (i:number, k:keyof ProgrammeCoach, v:any) => { const a=[...progs]; a[i]={...a[i],[k]:v} as ProgrammeCoach; set('programmes',a); };
  const delProg = (i:number) => set('programmes', progs.filter((_:any,j:number)=>j!==i));
  const addProg = () => set('programmes', [...progs, { id:`prog${Date.now()}`, nom:'Nouveau programme', emoji:'🎯', description:'', duree:'', format:'', prix:'', inclus:[], couleur:CM, photo:'' } as ProgrammeCoach]);

  // Témoignages
  const tems = ea(config.temoignages, CONFIG_COACH_DEFAUT.temoignages);
  const updTem = (i:number, k:keyof TemoignageCoach, v:any) => { const a=[...tems]; a[i]={...a[i],[k]:v} as TemoignageCoach; set('temoignages',a); };
  const delTem = (i:number) => set('temoignages', tems.filter((_:any,j:number)=>j!==i));
  const addTem = () => set('temoignages', [...tems, { texte:'', auteur:'', titre:'', photo:'', note:5, transformation:'' } as TemoignageCoach]);

  // FAQ
  const faq = ea(config.faq, CONFIG_COACH_DEFAUT.faq);
  const updFaq = (i:number, k:'question'|'reponse', v:string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq = (i:number) => set('faq', faq.filter((_:any,j:number)=>j!==i));
  const addFaq = () => set('faq', [...faq, { question:'', reponse:'' }]);

  // Stats
  const stats = ea(config.stats, CONFIG_COACH_DEFAUT.stats);
  const updStat = (i:number, k:string, v:string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };

  // Piliers
  const piliers = ea(config.piliers, CONFIG_COACH_DEFAUT.piliers);
  const updPilier = (i:number, k:string, v:string) => { const a=[...piliers]; a[i]={...a[i],[k]:v}; set('piliers',a); };

  // Processus
  const processus = ea(config.processus, CONFIG_COACH_DEFAUT.processus);
  const updProc = (i:number, k:string, v:string) => { const a=[...processus]; a[i]={...a[i],[k]:v}; set('processus',a); };

  const sections = ea(config.sections, CONFIG_COACH_DEFAUT.sections);

  const ONGLETS: { id: Onglet; label: string; ico: string }[] = [
    { id:'identite',     label:'Identité',      ico:'👤' },
    { id:'apparence',    label:'Apparence',     ico:'🎨' },
    { id:'sections',     label:'Sections',      ico:'📋' },
    { id:'stats',        label:'Stats',         ico:'📊' },
    { id:'piliers',      label:'Piliers',       ico:'🔄' },
    { id:'programmes',   label:'Programmes',    ico:'🎯' },
    { id:'processus',    label:'Processus',     ico:'🪜' },
    { id:'temoignages',  label:'Témoignages',   ico:'💬' },
    { id:'faq',          label:'FAQ',           ico:'❓' },
    { id:'contact',      label:'Contact',       ico:'✉️' },
  ];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter',sans-serif" }}>
      {/* Panel config */}
      <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', height:'100%', borderRight:'1px solid #f0f0f0', background:'#fff' }}>

        {/* Header */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f0f0f0', background:`linear-gradient(135deg,${CV},#1a2420)` }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>🌿 Coach de Vie</div>
          <div style={{ fontSize:10, color:`${CM}`, marginTop:2 }}>Template cours-coach</div>
        </div>

        {/* Onglets scrollables */}
        <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          {ONGLETS.map(o => (
            <button key={o.id} onClick={()=>setOnglet(o.id)} style={{ flexShrink:0, padding:'8px 10px', border:'none', background:'transparent', borderBottom:`2px solid ${onglet===o.id?CM:'transparent'}`, color:onglet===o.id?CM:'#888', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontSize:14 }}>{o.ico}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 13px' }}>

          {onglet==='identite' && (
            <>
              <S titre="Nom du coach">
                <F label="Prénom"><Inp value={config.prenom} onChange={(v:string)=>set('prenom',v)} /></F>
                <F label="Nom"><Inp value={config.nomCoach} onChange={(v:string)=>set('nomCoach',v)} /></F>
              </S>
              <S titre="Hero — Texte animé">
                <F label="Mot clé (ex: Transformez)"><Inp value={config.tagline} onChange={(v:string)=>set('tagline',v)} /></F>
                <F label="Complément (ex: Votre Vie.)"><Inp value={config.sousTagline} onChange={(v:string)=>set('sousTagline',v)} /></F>
                <F label="Description hero"><Txt value={config.descriptionHero} onChange={(v:string)=>set('descriptionHero',v)} rows={3} /></F>
              </S>
              <S titre="À propos">
                <F label="Années d'expérience"><Inp value={config.anneesExp} onChange={(v:string)=>set('anneesExp',v)} /></F>
                <F label="Description"><Txt value={config.descriptionAPropos} onChange={(v:string)=>set('descriptionAPropos',v)} rows={5} /></F>
              </S>
              <S titre="Citation signature">
                <F label="Citation"><Txt value={config.citation} onChange={(v:string)=>set('citation',v)} rows={2} /></F>
                <F label="Auteur"><Inp value={config.auteurCitation} onChange={(v:string)=>set('auteurCitation',v)} /></F>
              </S>
              <S titre="Photos">
                <F label="Photo hero (URL)"><Inp value={config.photoHero} onChange={(v:string)=>set('photoHero',v)} /></F>
                <F label="Photo à propos (URL)"><Inp value={config.photoAPropos} onChange={(v:string)=>set('photoAPropos',v)} /></F>
                <F label="Photo secondaire (URL)"><Inp value={config.photoSignature} onChange={(v:string)=>set('photoSignature',v)} /></F>
              </S>
            </>
          )}

          {onglet==='apparence' && (
            <>
              <S titre="Palettes prédéfinies">
                {PALETTES.map((p,i) => (
                  <button key={i} onClick={()=>setConfig(prev=>({...prev,couleurOr:p.co,couleurVert:p.cv,couleurFond:p.cf,couleurSable:p.cs,couleurSauge:p.cg}))}
                    style={{ width:'100%', padding:'8px 10px', marginBottom:5, border:`2px solid ${config.couleurOr===p.co?p.co:'#e5e7eb'}`, borderRadius:7, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, textAlign:'left' as any }}>
                    <div style={{ display:'flex', gap:3 }}>{[p.co,p.cv,p.cf].map((c,j)=><div key={j} style={{ width:14,height:14,borderRadius:'50%',background:c,border:'1px solid #eee' }} />)}</div>
                    <span style={{ fontSize:11, color:'#555' }}>{p.nom}</span>
                  </button>
                ))}
              </S>
              <S titre="Couleurs personnalisées">
                <F label="Or (accent principal)"><div style={{ display:'flex', gap:6 }}><input type="color" value={config.couleurOr} onChange={e=>set('couleurOr',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={config.couleurOr} onChange={(v:string)=>set('couleurOr',v)} /></div></F>
                <F label="Vert forêt (titres & hero)"><div style={{ display:'flex', gap:6 }}><input type="color" value={config.couleurVert} onChange={e=>set('couleurVert',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={config.couleurVert} onChange={(v:string)=>set('couleurVert',v)} /></div></F>
                <F label="Fond principal"><div style={{ display:'flex', gap:6 }}><input type="color" value={config.couleurFond} onChange={e=>set('couleurFond',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={config.couleurFond} onChange={(v:string)=>set('couleurFond',v)} /></div></F>
                <F label="Sable (cartes)"><div style={{ display:'flex', gap:6 }}><input type="color" value={config.couleurSable} onChange={e=>set('couleurSable',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={config.couleurSable} onChange={(v:string)=>set('couleurSable',v)} /></div></F>
                <F label="Sauge (texte secondaire)"><div style={{ display:'flex', gap:6 }}><input type="color" value={config.couleurSauge} onChange={e=>set('couleurSauge',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={config.couleurSauge} onChange={(v:string)=>set('couleurSauge',v)} /></div></F>
              </S>
            </>
          )}

          {onglet==='sections' && (
            <SectionsManager sections={sections} onChange={s=>set('sections',s)} />
          )}

          {onglet==='stats' && (
            <>
              <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>4 statistiques affichées dans la bande or.</div>
              {stats.map((s:any,i:number) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:6 }}>
                    <F label="Icône"><Inp value={s.icone} onChange={(v:string)=>updStat(i,'icone',v)} /></F>
                    <F label="Valeur (ex: 340+)"><Inp value={s.valeur} onChange={(v:string)=>updStat(i,'valeur',v)} /></F>
                  </div>
                  <F label="Label"><Inp value={s.label} onChange={(v:string)=>updStat(i,'label',v)} /></F>
                </div>
              ))}
            </>
          )}

          {onglet==='piliers' && (
            <>
              <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>Les 4 piliers de la roue de transformation animée.</div>
              {piliers.map((p:any,i:number) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:6, marginBottom:4 }}>
                    <F label="Icône"><Inp value={p.icone} onChange={(v:string)=>updPilier(i,'icone',v)} /></F>
                    <F label="Titre"><Inp value={p.titre} onChange={(v:string)=>updPilier(i,'titre',v)} /></F>
                  </div>
                  <F label="Description"><Txt value={p.description} onChange={(v:string)=>updPilier(i,'description',v)} rows={2} /></F>
                  <F label="Couleur"><div style={{ display:'flex', gap:6 }}><input type="color" value={p.couleur||CM} onChange={e=>updPilier(i,'couleur',e.target.value)} style={{ width:34,height:30,padding:2,border:'1px solid #ddd',borderRadius:5,cursor:'pointer' }}/><Inp value={p.couleur} onChange={(v:string)=>updPilier(i,'couleur',v)} /></div></F>
                </div>
              ))}
            </>
          )}

          {onglet==='programmes' && (
            <>
              {progs.map((p:ProgrammeCoach,i:number) => (
                <div key={i} style={{ border:`2px solid ${p.couleur}30`, borderRadius:8, padding:10, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:11, fontWeight:600 }}>{p.emoji} {p.nom}</span>
                    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      <label style={{ fontSize:10, color:'#888', display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!p.populaire} onChange={e=>updProg(i,'populaire',e.target.checked)} />Populaire
                      </label>
                      <Del onClick={()=>delProg(i)} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <F label="Emoji"><Inp value={p.emoji} onChange={(v:string)=>updProg(i,'emoji',v)} /></F>
                    <F label="Couleur"><div style={{ display:'flex', gap:4 }}><input type="color" value={p.couleur||CM} onChange={e=>updProg(i,'couleur',e.target.value)} style={{ width:30,height:28,padding:2,border:'1px solid #ddd',borderRadius:4,cursor:'pointer' }}/><Inp value={p.couleur} onChange={(v:string)=>updProg(i,'couleur',v)} /></div></F>
                  </div>
                  <F label="Nom"><Inp value={p.nom} onChange={(v:string)=>updProg(i,'nom',v)} /></F>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                    <F label="Prix"><Inp value={p.prix} onChange={(v:string)=>updProg(i,'prix',v)} /></F>
                    <F label="Durée"><Inp value={p.duree} onChange={(v:string)=>updProg(i,'duree',v)} /></F>
                    <F label="Format"><Inp value={p.format} onChange={(v:string)=>updProg(i,'format',v)} /></F>
                  </div>
                  <F label="Description"><Txt value={p.description} onChange={(v:string)=>updProg(i,'description',v)} rows={2} /></F>
                  <F label="Inclus (séparés par virgule)"><Inp value={p.inclus?.join(', ')||''} onChange={(v:string)=>updProg(i,'inclus',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} /></F>
                  <F label="Photo (URL)"><Inp value={p.photo} onChange={(v:string)=>updProg(i,'photo',v)} /></F>
                </div>
              ))}
              <button onClick={addProg} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un programme</button>
            </>
          )}

          {onglet==='processus' && (
            <>
              <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>Les 4 étapes du parcours client.</div>
              {processus.map((p:any,i:number) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:6 }}>
                    <F label="Étape (ex: 01)"><Inp value={p.etape} onChange={(v:string)=>updProc(i,'etape',v)} /></F>
                    <F label="Titre"><Inp value={p.titre} onChange={(v:string)=>updProc(i,'titre',v)} /></F>
                  </div>
                  <F label="Description"><Txt value={p.description} onChange={(v:string)=>updProc(i,'description',v)} rows={2} /></F>
                </div>
              ))}
            </>
          )}

          {onglet==='temoignages' && (
            <>
              {tems.map((t:TemoignageCoach,i:number) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:11, fontWeight:600 }}>{t.auteur||`Témoignage ${i+1}`}</span>
                    <Del onClick={()=>delTem(i)} />
                  </div>
                  <F label="Témoignage"><Txt value={t.texte} onChange={(v:string)=>updTem(i,'texte',v)} rows={3} /></F>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <F label="Nom"><Inp value={t.auteur} onChange={(v:string)=>updTem(i,'auteur',v)} /></F>
                    <F label="Titre/Profession"><Inp value={t.titre} onChange={(v:string)=>updTem(i,'titre',v)} /></F>
                  </div>
                  <F label="Transformation (badge)"><Inp value={t.transformation} onChange={(v:string)=>updTem(i,'transformation',v)} placeholder="Reconversion professionnelle" /></F>
                  <F label="Note"><select value={t.note} onChange={e=>updTem(i,'note',parseInt(e.target.value))} style={{ width:'100%', padding:'7px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:12, background:'#fff' }}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} ★</option>)}</select></F>
                  <F label="Photo (URL)"><Inp value={t.photo} onChange={(v:string)=>updTem(i,'photo',v)} /></F>
                </div>
              ))}
              <button onClick={addTem} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un témoignage</button>
            </>
          )}

          {onglet==='faq' && (
            <>
              {faq.map((f:any,i:number) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>Q{i+1}</span><Del onClick={()=>delFaq(i)} /></div>
                  <F label="Question"><Inp value={f.question} onChange={(v:string)=>updFaq(i,'question',v)} /></F>
                  <F label="Réponse"><Txt value={f.reponse} onChange={(v:string)=>updFaq(i,'reponse',v)} rows={3} /></F>
                </div>
              ))}
              <button onClick={addFaq} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter une question</button>
            </>
          )}

          {onglet==='contact' && (
            <>
              <S titre="Coordonnées">
                <F label="Adresse"><Inp value={config.adresse} onChange={(v:string)=>set('adresse',v)} /></F>
                <F label="Ville"><Inp value={config.ville} onChange={(v:string)=>set('ville',v)} /></F>
                <F label="Téléphone"><Inp value={config.telephone} onChange={(v:string)=>set('telephone',v)} /></F>
                <F label="Courriel"><Inp value={config.email} onChange={(v:string)=>set('email',v)} /></F>
                <F label="URL Calendly (optionnel)"><Inp value={config.calendlyUrl} onChange={(v:string)=>set('calendlyUrl',v)} /></F>
              </S>
              <S titre="Réseaux sociaux">
                {(['instagram','facebook','linkedin','youtube'] as const).map(k => (
                  <F key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
                    <Inp value={config.reseaux?.[k]||''} onChange={(v:string)=>set('reseaux',{...config.reseaux,[k]:v})} />
                  </F>
                ))}
              </S>
            </>
          )}
        </div>

        {/* Boutons */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', gap:8, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, flex: 1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_COACH_DEFAUT}); setResetConfirm(false); }} style={{ padding: '4px 10px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '4px 8px', borderRadius: 5, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}

          <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid ${CV}`, background:apercu?CV:'transparent', color:apercu?CM:CV, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
            {apercu?'✕ Fermer':'👁 Aperçu'}
          </button>
          <button onClick={handleSave} disabled={sauv==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauv==='ok'?'#10b981':sauv==='err'?'#dc2626':CV, color:sauv==='ok'||sauv==='err'?'#fff':CM, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
            {sauv==='loading'?'⏳...':sauv==='ok'?'✅ Sauvegardé!':sauv==='err'?'❌ Erreur':'💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Aperçu */}
      
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#2C3E35', overflow:'hidden' }}>
        <div style={{ background:'#1a1200', borderBottom:'1px solid #f59e0b44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`#C9A96E33`:'transparent', color:modeApercu===m?'#C9A96E':'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#2C3E35', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🌿</div>
          <p style={{ fontSize:15, color:'#C9A96E', fontWeight:600, fontFamily:'sans-serif' }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`#C9A96E60`, fontFamily:'sans-serif' }}>Template Coach de Vie</p>
        </div>
      )}
    </div>
  );
}