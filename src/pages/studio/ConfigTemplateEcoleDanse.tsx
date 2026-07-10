// src/pages/studio/ConfigTemplateEcoleDanse.tsx
import { useState, useEffect } from 'react';
import TemplateEcoleDanse, { CONFIG_DANSE_DEFAUT } from '../../templates/TemplateEcoleDanse';
import type { ConfigEcoleDanse, SectionConfig, StyleDanse, CoursHoraire, ProfesseurDanse, AvisDanse, FormulairePass } from '../../templates/TemplateEcoleDanse';

type Onglet = 'identite'|'apparence'|'sections'|'stats'|'styles'|'horaires'|'professeurs'|'avis'|'pass'|'evenements'|'faq'|'contact';
const CM = '#e91e8c';

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
  const ico: Record<string,string> = { hero:'🎭',stats:'📊',styles:'💃',horaires:'📅',apropos:'📖',professeurs:'⭐',evenements:'🎪',avis:'💬',pass:'💰',faq:'❓',contact:'✉️' };
  return (
    <div>
      <div style={{ background:'#fff0f8', border:`1px solid ${CM}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a0a3a', marginBottom:12 }}><strong>💃 Sections</strong> — Toggle + ▲▼</div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {sorted.map((sec,i) => (
          <div key={sec.id} style={{ display:'flex', alignItems:'center', gap:7, background:sec.actif?'#fff0f8':'#fafafa', border:`2px solid ${sec.actif?CM:'#e5e7eb'}`, borderRadius:8, padding:'7px 9px', transition:'all .2s', opacity:sec.actif?1:.55 }}>
            <span style={{ fontSize:13, width:18, textAlign:'center', flexShrink:0 }}>{ico[sec.id]||'📄'}</span>
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
  { nom:'Magenta & Or (défaut)', cm:'#e91e8c', co:'#ffd700', cv:'#7c3aed', cc:'#00d4ff', cf:'#0a0a0f' },
  { nom:'Rose & Champagne',      cm:'#e91e8c', co:'#c9a84c', cv:'#9c27b0', cc:'#ff80ab', cf:'#0a080f' },
  { nom:'Violet & Turquoise',    cm:'#7c3aed', co:'#00bcd4', cv:'#e91e8c', cc:'#00d4ff', cf:'#0a0814' },
  { nom:'Bleu nuit & Or',        cm:'#2196f3', co:'#ffd700', cv:'#7c3aed', cc:'#00d4ff', cf:'#05080f' },
  { nom:'Rouge & Or',            cm:'#f44336', co:'#ffd700', cv:'#9c27b0', cc:'#ff80ab', cf:'#0f0505' },
  { nom:'Vert émeraude & Rose',  cm:'#00bfa5', co:'#e91e8c', cv:'#7c3aed', cc:'#69f0ae', cf:'#05100c' },
];

interface Props { vendeurId: string; onSauvegarde?: (config:ConfigEcoleDanse)=>Promise<void>; }

export default function ConfigTemplateEcoleDanse({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigEcoleDanse>({ ...CONFIG_DANSE_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauv, setSauv] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r=>r.ok?r.json():null).then(data=>{if(data?.config)setConfig(prev=>({...prev,...data.config}));}).catch(()=>{});
  }, [vendeurId]);

  const set = (k: keyof ConfigEcoleDanse, v: any) => setConfig(prev=>({...prev,[k]:v}));
  const handleSave = async () => {
    setSauv('loading');
    try {
      if(onSauvegarde){await onSauvegarde(config);}
      else {
        const token=localStorage.getItem('token');
        const res=await fetch(`/api/studio/sites/${vendeurId}/config`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},credentials:'include',body:JSON.stringify({config,template_id:'cours-danse'})});
        if(!res.ok)throw new Error();
      }
      setSauv('ok'); setTimeout(()=>setSauv('idle'),2500);
    } catch { setSauv('err'); setTimeout(()=>setSauv('idle'),3000); }
  };

  const sections   = ea(config.sections,       CONFIG_DANSE_DEFAUT.sections);
  const stats      = ea(config.stats,           CONFIG_DANSE_DEFAUT.stats);
  const styles     = ea(config.stylesDanse,     CONFIG_DANSE_DEFAUT.stylesDanse);
  const horaires   = ea(config.horaires,        CONFIG_DANSE_DEFAUT.horaires);
  const profs      = ea(config.professeurs,     CONFIG_DANSE_DEFAUT.professeurs);
  const avis       = ea(config.avis,            CONFIG_DANSE_DEFAUT.avis);
  const pass       = ea(config.pass,            CONFIG_DANSE_DEFAUT.pass);
  const evs        = ea(config.evenements,      CONFIG_DANSE_DEFAUT.evenements);
  const faq        = ea(config.faq,             CONFIG_DANSE_DEFAUT.faq);
  const horStudio  = ea(config.horairesStudio,  CONFIG_DANSE_DEFAUT.horairesStudio);

  const updStat = (i:number,k:string,v:string)=>{const a=[...stats];a[i]={...a[i],[k]:v};set('stats',a);};
  const updStyle= (i:number,k:keyof StyleDanse,v:any)=>{const a=[...styles];a[i]={...a[i],[k]:v};set('stylesDanse',a);};
  const delStyle= (i:number)=>{const a=[...styles];a.splice(i,1);set('stylesDanse',a);};
  const addStyle= ()=>set('stylesDanse',[...styles,{id:'nouveau',nom:'Nouveau style',emoji:'💃',description:'',photo:'',couleurAccent:CM,niveaux:[]}]);
  const updHor  = (i:number,k:keyof CoursHoraire,v:any)=>{const a=[...horaires];a[i]={...a[i],[k]:v};set('horaires',a);};
  const delHor  = (i:number)=>{const a=[...horaires];a.splice(i,1);set('horaires',a);};
  const addHor  = ()=>set('horaires',[...horaires,{style:'Ballet',niveau:'Débutant',jour:'Lundi',heure:'18h00',salle:'Salle A',places:12,professeur:'',prix:'25$'}]);
  const updProf = (i:number,k:keyof ProfesseurDanse,v:any)=>{const a=[...profs];a[i]={...a[i],[k]:v};set('professeurs',a);};
  const delProf = (i:number)=>{const a=[...profs];a.splice(i,1);set('professeurs',a);};
  const addProf = ()=>set('professeurs',[...profs,{nom:'Nouveau',titre:'',specialites:[],bio:'',photo:'',annees:5,palmares:[],citation:''}]);
  const updAvis = (i:number,k:keyof AvisDanse,v:any)=>{const a=[...avis];a[i]={...a[i],[k]:v};set('avis',a);};
  const delAvis = (i:number)=>{const a=[...avis];a.splice(i,1);set('avis',a);};
  const addAvis = ()=>set('avis',[...avis,{texte:'',auteur:'',style:'',photo:'',note:5,depuis:''}]);
  const updPass = (i:number,k:keyof FormulairePass,v:any)=>{const a=[...pass];a[i]={...a[i],[k]:v};set('pass',a);};
  const delPass = (i:number)=>{const a=[...pass];a.splice(i,1);set('pass',a);};
  const addPass = ()=>set('pass',[...pass,{nom:'Nouveau pass',prix:'0$',periode:'/mois',description:'',inclus:[],couleur:CM,populaire:false}]);
  const updEv   = (i:number,k:string,v:string)=>{const a=[...evs];a[i]={...a[i],[k]:v};set('evenements',a);};
  const delEv   = (i:number)=>{const a=[...evs];a.splice(i,1);set('evenements',a);};
  const addEv   = ()=>set('evenements',[...evs,{titre:'Nouvel événement',date:'1 jan 2027',description:'',type:'Spectacle',photo:''}]);
  const updFaq  = (i:number,k:string,v:string)=>{const a=[...faq];a[i]={...a[i],[k]:v};set('faq',a);};
  const delFaq  = (i:number)=>{const a=[...faq];a.splice(i,1);set('faq',a);};
  const addFaq  = ()=>set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);

  const ONGLETS: {id:Onglet;label:string;emoji:string}[] = [
    {id:'identite',label:'Identité',emoji:'🏷️'},{id:'apparence',label:'Couleurs',emoji:'🎨'},
    {id:'sections',label:'Sections',emoji:'📐'},{id:'stats',label:'Stats',emoji:'📊'},
    {id:'styles',label:'Styles',emoji:'💃'},{id:'horaires',label:'Horaires',emoji:'📅'},
    {id:'professeurs',label:'Profs',emoji:'⭐'},{id:'avis',label:'Avis',emoji:'💬'},
    {id:'pass',label:'Pass',emoji:'💰'},{id:'evenements',label:'Événements',emoji:'🎪'},
    {id:'faq',label:'FAQ',emoji:'❓'},{id:'contact',label:'Contact',emoji:'✉️'},
  ];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter',sans-serif", background:'#f8f9fb' }}>
      <div style={{ width:360, minWidth:320, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'13px 13px 0', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,#0a0a0f,${CM})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💃</div>
            <div><p style={{ fontSize:10, color:'#888', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>Template Gratuit</p><p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>École de Danse</p></div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, paddingBottom:10 }}>
            {ONGLETS.map(o => <button key={o.id} onClick={()=>setOnglet(o.id)} style={{ padding:'3px 6px', borderRadius:5, border:'none', cursor:'pointer', fontSize:10, fontWeight:500, background:onglet===o.id?CM:'#f3f4f6', color:onglet===o.id?'#fff':'#555', transition:'all .15s' }}>{o.emoji} {o.label}</button>)}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:13 }}>

          {onglet==='identite' && (<>
            <S titre="Studio"><F label="Nom"><Inp value={config.nomEcole} onChange={(v:string)=>set('nomEcole',v)} /></F><F label="Tagline 1"><Inp value={config.tagline} onChange={(v:string)=>set('tagline',v)} /></F><F label="Tagline 2 (dégradé)"><Inp value={config.sousTagline} onChange={(v:string)=>set('sousTagline',v)} /></F><F label="Citation"><Inp value={config.citation} onChange={(v:string)=>set('citation',v)} /></F><F label="Auteur citation"><Inp value={config.auteurCitation} onChange={(v:string)=>set('auteurCitation',v)} /></F><F label="Année fondation"><Inp value={config.fondee} onChange={(v:string)=>set('fondee',v)} /></F><F label="Description hero"><Txt value={config.descriptionHero} onChange={(v:string)=>set('descriptionHero',v)} rows={3} /></F><F label="Description à propos"><Txt value={config.descriptionAPropos} onChange={(v:string)=>set('descriptionAPropos',v)} rows={3} /></F></S>
            <S titre="Photos"><F label="Photo Hero"><Inp value={config.photoHero} onChange={(v:string)=>set('photoHero',v)} /></F><F label="Photo À propos 1"><Inp value={config.photoAPropos1} onChange={(v:string)=>set('photoAPropos1',v)} /></F><F label="Photo À propos 2"><Inp value={config.photoAPropos2} onChange={(v:string)=>set('photoAPropos2',v)} /></F><F label="Photo Banner"><Inp value={config.photoBanner} onChange={(v:string)=>set('photoBanner',v)} /></F></S>
          </>)}

          {onglet==='apparence' && (<>
            <S titre="Palettes">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                {PALETTES.map(p => <button key={p.nom} onClick={()=>setConfig(prev=>({...prev,couleurMagenta:p.cm,couleurOr:p.co,couleurViolet:p.cv,couleurCyan:p.cc,couleurFond:p.cf}))} style={{ padding:'8px', borderRadius:7, cursor:'pointer', fontSize:9, fontWeight:600, border:`2px solid ${config.couleurMagenta===p.cm?p.cm:'#e5e7eb'}`, background:p.cf, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ display:'flex', gap:3 }}>{[p.cf,p.cm,p.co,p.cv,p.cc].map((col,i)=><div key={i} style={{ width:12, height:12, borderRadius:2, background:col, border:'1px solid rgba(255,255,255,.1)' }}/>)}</div>
                  <span style={{ color:p.cm, fontSize:8 }}>{p.nom}</span>
                </button>)}
              </div>
            </S>
            <S titre="Couleurs">
              {([['couleurMagenta','Accent magenta'],['couleurOr','Accent or'],['couleurViolet','Accent violet'],['couleurCyan','Accent cyan'],['couleurFond','Fond sombre']] as [keyof ConfigEcoleDanse,string][]).map(([k,label]) => (
                <F key={k} label={label}><div style={{ display:'flex', gap:6 }}><input type="color" value={(config[k] as string)||'#000'} onChange={e=>set(k,e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }}/><Inp value={config[k] as string} onChange={(v:string)=>set(k,v)} /></div></F>
              ))}
            </S>
          </>)}

          {onglet==='sections' && <SectionsManager sections={sections} onChange={s=>set('sections',s)} />}

          {onglet==='stats' && <S titre="Chiffres">{stats.map((s,i)=><div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:7, padding:9, marginBottom:9 }}><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:6 }}><F label="Icône"><Inp value={s.icone} onChange={(v:string)=>updStat(i,'icone',v)} /></F><F label="Valeur"><Inp value={s.valeur} onChange={(v:string)=>updStat(i,'valeur',v)} /></F><F label="Libellé"><Inp value={s.label} onChange={(v:string)=>updStat(i,'label',v)} /></F></div></div>)}</S>}

          {onglet==='styles' && (<>
            <div style={{ background:'#fff0f8', border:`1px solid ${CM}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a0a3a', marginBottom:10 }}>💃 Les styles s'affichent avec onglets + photo + niveaux cliquables.</div>
            {styles.map((s,i) => <div key={i} style={{ border:`2px solid ${s.couleurAccent}40`, borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>{s.emoji} {s.nom}</span><Del onClick={()=>delStyle(i)} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}><F label="Nom"><Inp value={s.nom} onChange={(v:string)=>updStyle(i,'nom',v)} /></F><F label="Emoji"><Inp value={s.emoji} onChange={(v:string)=>updStyle(i,'emoji',v)} /></F></div>
              <F label="Couleur accent"><div style={{ display:'flex', gap:6 }}><input type="color" value={s.couleurAccent||CM} onChange={e=>updStyle(i,'couleurAccent',e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }}/><Inp value={s.couleurAccent} onChange={(v:string)=>updStyle(i,'couleurAccent',v)} /></div></F>
              <F label="Description"><Txt value={s.description} onChange={(v:string)=>updStyle(i,'description',v)} rows={2} /></F>
              <F label="Photo (URL)"><Inp value={s.photo} onChange={(v:string)=>updStyle(i,'photo',v)} /></F>
              <F label="Niveaux (virgules)"><Inp value={s.niveaux?.join(', ')||''} onChange={(v:string)=>updStyle(i,'niveaux',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} placeholder="Débutant, Intermédiaire, Avancé" /></F>
            </div>)}
            <button onClick={addStyle} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un style</button>
          </>)}

          {onglet==='horaires' && (<>
            {horaires.map((h,i) => <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>{h.jour} {h.heure} — {h.style}</span><Del onClick={()=>delHor(i)} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <F label="Style"><Inp value={h.style} onChange={(v:string)=>updHor(i,'style',v)} /></F>
                <F label="Niveau"><Inp value={h.niveau} onChange={(v:string)=>updHor(i,'niveau',v)} /></F>
                <F label="Jour"><Inp value={h.jour} onChange={(v:string)=>updHor(i,'jour',v)} /></F>
                <F label="Heure"><Inp value={h.heure} onChange={(v:string)=>updHor(i,'heure',v)} placeholder="18h00" /></F>
                <F label="Salle"><Inp value={h.salle} onChange={(v:string)=>updHor(i,'salle',v)} /></F>
                <F label="Prix"><Inp value={h.prix} onChange={(v:string)=>updHor(i,'prix',v)} /></F>
                <F label="Professeur"><Inp value={h.professeur} onChange={(v:string)=>updHor(i,'professeur',v)} /></F>
                <F label="Places max"><Inp value={String(h.places)} onChange={(v:string)=>updHor(i,'places',parseInt(v)||10)} /></F>
              </div>
            </div>)}
            <button onClick={addHor} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un cours</button>
          </>)}

          {onglet==='professeurs' && (<>
            {profs.map((p,i) => <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>{p.nom}</span><Del onClick={()=>delProf(i)} /></div>
              <F label="Nom"><Inp value={p.nom} onChange={(v:string)=>updProf(i,'nom',v)} /></F>
              <F label="Titre"><Inp value={p.titre} onChange={(v:string)=>updProf(i,'titre',v)} /></F>
              <F label="Spécialités (virgules)"><Inp value={p.specialites?.join(', ')||''} onChange={(v:string)=>updProf(i,'specialites',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} /></F>
              <F label="Années"><Inp value={String(p.annees)} onChange={(v:string)=>updProf(i,'annees',parseInt(v)||1)} /></F>
              <F label="Citation"><Inp value={p.citation} onChange={(v:string)=>updProf(i,'citation',v)} /></F>
              <F label="Bio"><Txt value={p.bio} onChange={(v:string)=>updProf(i,'bio',v)} rows={2} /></F>
              <F label="Photo (URL)"><Inp value={p.photo} onChange={(v:string)=>updProf(i,'photo',v)} /></F>
              <F label="Palmarès (virgules)"><Inp value={p.palmares?.join(', ')||''} onChange={(v:string)=>updProf(i,'palmares',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} /></F>
            </div>)}
            <button onClick={addProf} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un professeur</button>
          </>)}

          {onglet==='avis' && (<>
            {avis.map((a,i) => <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>Avis {i+1}</span><Del onClick={()=>delAvis(i)} /></div>
              <F label="Texte"><Txt value={a.texte} onChange={(v:string)=>updAvis(i,'texte',v)} rows={3} /></F>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <F label="Auteur"><Inp value={a.auteur} onChange={(v:string)=>updAvis(i,'auteur',v)} /></F>
                <F label="Style suivi"><Inp value={a.style} onChange={(v:string)=>updAvis(i,'style',v)} /></F>
                <F label="Depuis"><Inp value={a.depuis} onChange={(v:string)=>updAvis(i,'depuis',v)} /></F>
                <F label="Note"><select value={a.note} onChange={e=>updAvis(i,'note',parseInt(e.target.value))} style={{ width:'100%', padding:'7px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:12, background:'#fff' }}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} ★</option>)}</select></F>
              </div>
              <F label="Photo (URL)"><Inp value={a.photo} onChange={(v:string)=>updAvis(i,'photo',v)} /></F>
            </div>)}
            <button onClick={addAvis} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un avis</button>
          </>)}

          {onglet==='pass' && (<>
            {pass.map((p,i) => <div key={i} style={{ border:`2px solid ${p.couleur}40`, borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                <span style={{ fontSize:11, fontWeight:600 }}>{p.nom}</span>
                <div style={{ display:'flex', gap:5 }}><label style={{ fontSize:10, color:'#888', display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}><input type="checkbox" checked={!!p.populaire} onChange={e=>updPass(i,'populaire',e.target.checked)} />Populaire</label><Del onClick={()=>delPass(i)} /></div>
              </div>
              <F label="Couleur"><div style={{ display:'flex', gap:6 }}><input type="color" value={p.couleur||CM} onChange={e=>updPass(i,'couleur',e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }}/><Inp value={p.couleur} onChange={(v:string)=>updPass(i,'couleur',v)} /></div></F>
              <F label="Nom"><Inp value={p.nom} onChange={(v:string)=>updPass(i,'nom',v)} /></F>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <F label="Prix"><Inp value={p.prix} onChange={(v:string)=>updPass(i,'prix',v)} /></F>
                <F label="Période"><Inp value={p.periode} onChange={(v:string)=>updPass(i,'periode',v)} /></F>
              </div>
              <F label="Description"><Txt value={p.description} onChange={(v:string)=>updPass(i,'description',v)} rows={2} /></F>
              <F label="Inclus (virgules)"><Inp value={p.inclus?.join(', ')||''} onChange={(v:string)=>updPass(i,'inclus',v.split(',').map((x:string)=>x.trim()).filter(Boolean))} /></F>
            </div>)}
            <button onClick={addPass} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un pass</button>
          </>)}

          {onglet==='evenements' && (<>
            {evs.map((ev,i) => <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>{ev.titre}</span><Del onClick={()=>delEv(i)} /></div>
              <F label="Titre"><Inp value={ev.titre} onChange={(v:string)=>updEv(i,'titre',v)} /></F>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <F label="Date"><Inp value={ev.date} onChange={(v:string)=>updEv(i,'date',v)} /></F>
                <F label="Type"><select value={ev.type} onChange={e=>updEv(i,'type',e.target.value)} style={{ width:'100%', padding:'7px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:12, background:'#fff' }}>{['Spectacle','Stage','Soirée','Audition','Compétition'].map(t=><option key={t} value={t}>{t}</option>)}</select></F>
              </div>
              <F label="Description"><Txt value={ev.description} onChange={(v:string)=>updEv(i,'description',v)} rows={2} /></F>
              <F label="Photo (URL)"><Inp value={ev.photo} onChange={(v:string)=>updEv(i,'photo',v)} /></F>
            </div>)}
            <button onClick={addEv} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un événement</button>
          </>)}

          {onglet==='faq' && (<>
            {faq.map((f,i) => <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ fontSize:11, fontWeight:600 }}>Q{i+1}</span><Del onClick={()=>delFaq(i)} /></div>
              <F label="Question"><Inp value={f.question} onChange={(v:string)=>updFaq(i,'question',v)} /></F>
              <F label="Réponse"><Txt value={f.reponse} onChange={(v:string)=>updFaq(i,'reponse',v)} rows={3} /></F>
            </div>)}
            <button onClick={addFaq} style={{ width:'100%', padding:8, border:`2px dashed ${CM}`, borderRadius:8, background:'transparent', color:CM, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter une question</button>
          </>)}

          {onglet==='contact' && (<>
            <S titre="Coordonnées">
              <F label="Adresse"><Inp value={config.adresse} onChange={(v:string)=>set('adresse',v)} /></F>
              <F label="Ville"><Inp value={config.ville} onChange={(v:string)=>set('ville',v)} /></F>
              <F label="Téléphone"><Inp value={config.telephone} onChange={(v:string)=>set('telephone',v)} /></F>
              <F label="Courriel"><Inp value={config.email} onChange={(v:string)=>set('email',v)} /></F>
            </S>
            <S titre="Horaires studio">
              {horStudio.map((h,i) => {
                const texte = typeof h === 'string' ? h : (h && typeof h === 'object') ? `${(h as any).jour || ''}${(h as any).jour && (h as any).horaires ? ' : ' : ''}${(h as any).horaires || ''}` : '';
                return <div key={i} style={{ marginBottom:6 }}><Inp value={texte} onChange={(v:string)=>{const a=[...horStudio];a[i]=v;set('horairesStudio',a);}} placeholder="Lun – Ven : 15h – 22h" /></div>;
              })}
            </S>
            <S titre="Réseaux">
              {(['instagram','facebook','youtube','tiktok'] as const).map(k => <F key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}><Inp value={config.reseaux?.[k]||''} onChange={(v:string)=>set('reseaux',{...config.reseaux,[k]:v})} /></F>)}
            </S>
            <S titre="Google Maps">
              <F label="URL iFrame (optionnel)">
                <Txt value={config.coordGoogleMaps} onChange={(v:string)=>set('coordGoogleMaps',v)} rows={2} />
              </F>
              <p style={{ fontSize:11, color:'#888', marginTop:-6, marginBottom:8 }}>
                💡 Laissez ce champ vide — la carte se génère automatiquement depuis votre adresse et votre ville. Collez un lien ici seulement si vous voulez un point précis différent (ex: un bâtiment particulier).
              </p>
              {config.coordGoogleMaps && (
                <button onClick={()=>set('coordGoogleMaps','')}
                  style={{ fontSize:11, padding:'6px 12px', border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', color:'#555', cursor:'pointer' }}>
                  🔄 Revenir à la génération automatique depuis l'adresse
                </button>
              )}
            </S>
          </>)}

        </div>

        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {/* Bouton Réinitialiser */}
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_DANSE_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          {/* Aperçu + Sauvegarder */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid #0a0a0f`, background:apercu?'#0a0a0f':'transparent', color:apercu?'#e91e8c':'#0a0a0f', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauv==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauv==='ok'?'#10b981':sauv==='err'?'#dc2626':'#0a0a0f', color:sauv==='ok'||sauv==='err'?'#fff':CM, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauv==='loading'?'⏳...':sauv==='ok'?'✅ Sauvegardé!':sauv==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Zone aperçu — icônes EN HAUT au centre, template scrollable en dessous */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#0a0a0f', overflow:'hidden' }}>

        {/* Message avertissement */}
        <div style={{ background:'#1a1200', borderBottom:'1px solid #f59e0b44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>

        {/* Barre icônes en haut au centre */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #222', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?'#e91e8c22':'transparent', color:modeApercu===m?'#e91e8c':'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Aperçu scrollable via iframe — force la vraie largeur par mode */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{
            width:  modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%',
            height: '100%',
            overflow:'hidden',
            borderRadius: modeApercu==='mobile'?20:modeApercu==='tablette'?8:4,
            border: `${modeApercu==='mobile'?4:2}px solid #333`,
            flexShrink:0,
            background:'#fff',
          }}>
            <iframe
              key={modeApercu}
              src={`/site-preview?vendeurId=${vendeurId}`}
              style={{
                width:  modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              title="Aperçu"
            />
          </div>
        </div>
      </div>

      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0f', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>💃</div>
          <p style={{ fontSize:15, color:CM, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CM}50` }}>Template École de Danse — Gratuit</p>
        </div>
      )}
    </div>
  );
}