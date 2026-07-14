// src/pages/studio/ConfigTemplateEcolePeinture.tsx
// e-Vend Studio — Configuration du template École de Peinture

import { useState, useEffect } from 'react';
import TemplateEcolePeinture, { CONFIG_PEINTURE_DEFAUT } from '../../templates/TemplateEcolePeinture';
import type { ConfigEcolePeinture, SectionConfig, CoursArt, ArtisteProfesseur, OeuvreEleve, AvisArt } from '../../templates/TemplateEcolePeinture';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'cours' | 'galerie' | 'professeurs' | 'avis' | 'formules' | 'evenements' | 'faq' | 'contact';

const C1 = '#e63946';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = C1} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = C1} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 11 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>{label}</label>
    {desc && <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{desc}</p>}
    {children}
  </div>
);
const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 18 }}>
    <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);
function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }
const BtnDel = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
);

function SectionsManager({ sections, onChange }: { sections: SectionConfig[]; onChange: (s: SectionConfig[]) => void }) {
  const deplacer = (i: number, dir: -1 | 1) => {
    const arr = [...sections].sort((a, b) => a.ordre - b.ordre);
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[i].ordre; arr[i]={...arr[i],ordre:arr[ni].ordre}; arr[ni]={...arr[ni],ordre:tmp};
    onChange(arr);
  };
  const toggle = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);
  const icones: Record<string,string> = { hero:'🎨', stats:'📊', cours:'🖌️', horaires:'📅', galerie3d:'🖼️', apropos:'📖', professeurs:'⭐', evenements:'📅', avis:'💬', formules:'💰', faq:'❓', contact:'✉️' };

  return (
    <div>
      <div style={{ background: '#fff5f5', border: `1px solid ${C1}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a1a1a', marginBottom: 12 }}>
        <strong>🎨 Sections</strong> — Toggle ON/OFF + ▲▼ pour réordonner
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: sec.actif ? '#fff5f5' : '#fafafa', border: `2px solid ${sec.actif ? C1 : '#e5e7eb'}`, borderRadius: 8, padding: '7px 9px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id]||'📄'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', marginRight: 4 }}>#{i+1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 38, height: 19, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? C1 : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 1.5, left: sec.actif ? 19 : 1.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i,-1)} disabled={i===0} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===0?'#f5f5f5':'#fff',cursor:i===0?'default':'pointer',fontSize:7,color:i===0?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▲</button>
              <button onClick={() => deplacer(i,1)} disabled={i===sorted.length-1} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===sorted.length-1?'#f5f5f5':'#fff',cursor:i===sorted.length-1?'default':'pointer',fontSize:7,color:i===sorted.length-1?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:9,padding:'5px 9px',background:'#f5f5f5',borderRadius:6,fontSize:11,color:'#666' }}>
        <strong>{sorted.filter(s=>s.actif).length}</strong> section{sorted.filter(s=>s.actif).length>1?'s':''} active{sorted.filter(s=>s.actif).length>1?'s':''} sur {sorted.length}
      </div>
    </div>
  );
}

interface Props { vendeurId: string; onSauvegarde?: (config: ConfigEcolePeinture) => Promise<void>; }

export default function ConfigTemplateEcolePeinture({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigEcolePeinture>({ ...CONFIG_PEINTURE_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigEcolePeinture, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) { await onSauvegarde(config); }
      else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
          credentials:'include', body: JSON.stringify({ config, template_id:'cours-peinture' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('ok'); setTimeout(() => setSauvegarde('idle'), 2500);
    } catch { setSauvegarde('err'); setTimeout(() => setSauvegarde('idle'), 3000); }
  };

  const sections    = ea(config.sections,        CONFIG_PEINTURE_DEFAUT.sections);
  const stats       = ea(config.stats,            CONFIG_PEINTURE_DEFAUT.stats);
  const cours       = ea(config.cours,            CONFIG_PEINTURE_DEFAUT.cours);
  const galerie     = ea(config.oeuvresEleves,    CONFIG_PEINTURE_DEFAUT.oeuvresEleves);
  const profs       = ea(config.professeurs,      CONFIG_PEINTURE_DEFAUT.professeurs);
  const avis        = ea(config.avis,             CONFIG_PEINTURE_DEFAUT.avis);
  const evenements  = ea(config.evenements,       CONFIG_PEINTURE_DEFAUT.evenements);
  const faq         = ea(config.faq,              CONFIG_PEINTURE_DEFAUT.faq);
  const horaires    = ea(config.horaires,         CONFIG_PEINTURE_DEFAUT.horaires);

  const updStat   = (i:number, k:string, v:string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };
  const updCours  = (i:number, k:keyof CoursArt, v:any) => { const a=[...cours]; a[i]={...a[i],[k]:v}; set('cours',a); };
  const delCours  = (i:number) => { const a=[...cours]; a.splice(i,1); set('cours',a); };
  const addCours  = () => set('cours',[...cours,{titre:'Nouveau cours',description:'',photo:'',medium:'Acrylique',niveau:'Débutant' as const,duree:'3h',prix:'55$',inclus:[],couleurAccent:'#e63946'}]);
  const updGal    = (i:number, k:keyof OeuvreEleve, v:string) => { const a=[...galerie]; a[i]={...a[i],[k]:v}; set('oeuvresEleves',a); };
  const delGal    = (i:number) => { const a=[...galerie]; a.splice(i,1); set('oeuvresEleves',a); };
  const addGal    = () => set('oeuvresEleves',[...galerie,{titre:'Nouvelle œuvre',eleve:'',photo:'',medium:'',cours:'',annee:'2024'}]);
  const updProf   = (i:number, k:keyof ArtisteProfesseur, v:any) => { const a=[...profs]; a[i]={...a[i],[k]:v}; set('professeurs',a); };
  const delProf   = (i:number) => { const a=[...profs]; a.splice(i,1); set('professeurs',a); };
  const addProf   = () => set('professeurs',[...profs,{nom:'Nouveau',titre:'',specialite:'',bio:'',photo:'',oeuvreSignature:'',expositions:[],citation:'',annees:5}]);
  const updAvis   = (i:number, k:keyof AvisArt, v:any) => { const a=[...avis]; a[i]={...a[i],[k]:v}; set('avis',a); };
  const delAvis   = (i:number) => { const a=[...avis]; a.splice(i,1); set('avis',a); };
  const addAvis   = () => set('avis',[...avis,{texte:'',auteur:'',cours:'',photo:'',note:5}]);
  const updEv     = (i:number, k:string, v:string) => { const a=[...evenements]; a[i]={...a[i],[k]:v}; set('evenements',a); };
  const delEv     = (i:number) => { const a=[...evenements]; a.splice(i,1); set('evenements',a); };
  const addEv     = () => set('evenements',[...evenements,{titre:'Nouvel événement',date:'1 jan 2027',description:'',type:'Vernissage'}]);
  const updFaq    = (i:number, k:string, v:string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq    = (i:number) => { const a=[...faq]; a.splice(i,1); set('faq',a); };
  const addFaq    = () => set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);
  const updHoraire= (i:number, v:string) => { const h=[...horaires]; h[i]=v; set('horaires',h); };

  const ONGLETS: {id:Onglet; label:string; emoji:string}[] = [
    {id:'identite',label:'Identité',emoji:'🏷️'}, {id:'apparence',label:'Couleurs',emoji:'🎨'},
    {id:'sections',label:'Sections',emoji:'📐'}, {id:'stats',label:'Stats',emoji:'📊'},
    {id:'cours',label:'Cours',emoji:'🖌️'}, {id:'galerie',label:'Galerie',emoji:'🖼️'},
    {id:'professeurs',label:'Artistes',emoji:'⭐'}, {id:'avis',label:'Avis',emoji:'💬'},
    {id:'formules',label:'Tarifs',emoji:'💰'}, {id:'evenements',label:'Événements',emoji:'📅'},
    {id:'faq',label:'FAQ',emoji:'❓'}, {id:'contact',label:'Contact',emoji:'✉️'},
  ];

  const couleurs5 = [
    ['couleur1','Couleur 1 (rouge)'],['couleur2','Couleur 2 (bleu)'],['couleur3','Couleur 3 (jaune)'],
    ['couleur4','Couleur 4 (vert)'],['couleur5','Couleur 5 (violet)'],
  ] as [keyof ConfigEcolePeinture, string][];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter',sans-serif", background:'#f8f9fb' }}>
      <div style={{ width:360, minWidth:320, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'13px 13px 0', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg, #e63946, #2196f3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎨</div>
            <div>
              <p style={{ fontSize:10, color:'#888', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>École de Peinture</p>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, paddingBottom:10 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding:'3px 6px', borderRadius:5, border:'none', cursor:'pointer', fontSize:10, fontWeight:500, background:onglet===o.id?C1:'#f3f4f6', color:onglet===o.id?'#fff':'#555', transition:'all .15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:13 }}>

          {onglet === 'identite' && (<>
            <Sec titre="École">
              <Champ label="Nom"><Input value={config.nomEcole} onChange={(v:string) => set('nomEcole',v)} /></Champ>
              <Champ label="Tagline 1re ligne" desc="Ex: Créez."><Input value={config.tagline} onChange={(v:string) => set('tagline',v)} /></Champ>
              <Champ label="Tagline 2e ligne (dégradé arc-en-ciel)"><Input value={config.sousTagline} onChange={(v:string) => set('sousTagline',v)} /></Champ>
              <Champ label="Citation décorative"><Input value={config.citation} onChange={(v:string) => set('citation',v)} /></Champ>
              <Champ label="Auteur citation"><Input value={config.auteurCitation} onChange={(v:string) => set('auteurCitation',v)} /></Champ>
              <Champ label="Description hero"><Textarea value={config.descriptionHero} onChange={(v:string) => set('descriptionHero',v)} rows={3} /></Champ>
              <Champ label="Description à propos"><Textarea value={config.descriptionAPropos} onChange={(v:string) => set('descriptionAPropos',v)} rows={3} /></Champ>
            </Sec>
            <Sec titre="Photos">
              <Champ label="Photo Hero (fond plein écran)"><Input value={config.photoHero} onChange={(v:string) => set('photoHero',v)} /></Champ>
              <Champ label="Photo À propos 1"><Input value={config.photoAPropos1} onChange={(v:string) => set('photoAPropos1',v)} /></Champ>
              <Champ label="Photo À propos 2"><Input value={config.photoAPropos2} onChange={(v:string) => set('photoAPropos2',v)} /></Champ>
              <Champ label="Photo Banner (fond formules)"><Input value={config.photoBanner} onChange={(v:string) => set('photoBanner',v)} /></Champ>
            </Sec>
          </>)}

          {onglet === 'apparence' && (<>
            <Sec titre="Palette 5 couleurs">
              <div style={{ background:'#fff5f5', border:`1px solid ${C1}30`, borderRadius:7, padding:9, fontSize:11, color:'#7a1a1a', marginBottom:12 }}>
                🎨 Ces 5 couleurs servent partout : stats, cartes, titres, éclaboussures, dégradé hero.
              </div>
              {/* Aperçu palette */}
              <div style={{ display:'flex', gap:6, marginBottom:14, padding:'10px 12px', background:'#f8f8f8', borderRadius:8 }}>
                {couleurs5.map(([k]) => (
                  <div key={k} style={{ flex:1, height:32, borderRadius:4, background:(config[k] as string)||'#ccc', cursor:'pointer', boxShadow:'inset 0 0 0 2px rgba(255,255,255,.3)' }} />
                ))}
              </div>
              {couleurs5.map(([k, label]) => (
                <Champ key={k} label={label}>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="color" value={(config[k] as string)||'#000'} onChange={e => set(k, e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }} />
                    <Input value={config[k] as string} onChange={(v:string) => set(k,v)} />
                  </div>
                </Champ>
              ))}
            </Sec>
            <Sec titre="Fond & Texte">
              {([['couleurFond','Fond (blanc)'],['couleurTexte','Texte'],['couleurSombre','Fond sombre (hero)']] as [keyof ConfigEcolePeinture, string][]).map(([k,label]) => (
                <Champ key={k} label={label}>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="color" value={(config[k] as string)||'#000'} onChange={e => set(k,e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }} />
                    <Input value={config[k] as string} onChange={(v:string) => set(k,v)} />
                  </div>
                </Champ>
              ))}
            </Sec>
          </>)}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={s => set('sections',s)} />}

          {onglet === 'stats' && (
            <Sec titre="4 chiffres clés">
              {stats.map((s,i) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:7, padding:9, marginBottom:9 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:6 }}>
                    <Champ label="Icône"><Input value={s.icone} onChange={(v:string) => updStat(i,'icone',v)} placeholder="🎨" /></Champ>
                    <Champ label="Valeur"><Input value={s.valeur} onChange={(v:string) => updStat(i,'valeur',v)} placeholder="1200+" /></Champ>
                    <Champ label="Libellé"><Input value={s.label} onChange={(v:string) => updStat(i,'label',v)} /></Champ>
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {onglet === 'cours' && (<>
            <div style={{ background:'#fff5f5', border:`1px solid ${C1}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a1a1a', marginBottom:10 }}>
              🖌️ Chaque cours a sa propre couleur accent qui colore le prix, la barre, le bouton.
            </div>
            {cours.map((c,i) => (
              <div key={i} style={{ border:`2px solid ${c.couleurAccent}40`, borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>{c.titre}</span>
                  <BtnDel onClick={() => delCours(i)} />
                </div>
                <Champ label="Titre"><Input value={c.titre} onChange={(v:string) => updCours(i,'titre',v)} /></Champ>
                <Champ label="Couleur accent">
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="color" value={c.couleurAccent||'#e63946'} onChange={e => updCours(i,'couleurAccent',e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }} />
                    <Input value={c.couleurAccent} onChange={(v:string) => updCours(i,'couleurAccent',v)} />
                  </div>
                </Champ>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <Champ label="Medium"><Input value={c.medium} onChange={(v:string) => updCours(i,'medium',v)} placeholder="Acrylique" /></Champ>
                  <Champ label="Niveau">
                    <select value={c.niveau} onChange={e => updCours(i,'niveau',e.target.value as any)} style={{ width:'100%', padding:'7px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:12, background:'#fff' }}>
                      {['Débutant','Intermédiaire','Avancé','Tous niveaux'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Champ>
                  <Champ label="Durée"><Input value={c.duree} onChange={(v:string) => updCours(i,'duree',v)} placeholder="3h / séance" /></Champ>
                  <Champ label="Prix"><Input value={c.prix} onChange={(v:string) => updCours(i,'prix',v)} placeholder="55$" /></Champ>
                </div>
                <Champ label="Description"><Textarea value={c.description} onChange={(v:string) => updCours(i,'description',v)} rows={2} /></Champ>
                <Champ label="Photo (URL)"><Input value={c.photo} onChange={(v:string) => updCours(i,'photo',v)} /></Champ>
                <Champ label="Inclus (virgules)"><Input value={c.inclus?.join(', ')||''} onChange={(v:string) => updCours(i,'inclus',v.split(',').map((s:string)=>s.trim()).filter(Boolean))} /></Champ>
              </div>
            ))}
            <button onClick={addCours} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un cours</button>
          </>)}

          {onglet === 'galerie' && (<>
            <div style={{ background:'#fff5f5', border:`1px solid ${C1}40`, borderRadius:7, padding:9, fontSize:11, color:'#7a1a1a', marginBottom:10 }}>
              🖼️ Les œuvres s'affichent dans le Cube 3D (hero) ET dans la galerie 3D perspective.
            </div>
            {galerie.map((g,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>{g.titre}</span>
                  <BtnDel onClick={() => delGal(i)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <Champ label="Titre"><Input value={g.titre} onChange={(v:string) => updGal(i,'titre',v)} /></Champ>
                  <Champ label="Élève"><Input value={g.eleve} onChange={(v:string) => updGal(i,'eleve',v)} /></Champ>
                  <Champ label="Medium"><Input value={g.medium} onChange={(v:string) => updGal(i,'medium',v)} /></Champ>
                  <Champ label="Cours"><Input value={g.cours} onChange={(v:string) => updGal(i,'cours',v)} /></Champ>
                  <Champ label="Année"><Input value={g.annee} onChange={(v:string) => updGal(i,'annee',v)} /></Champ>
                </div>
                <Champ label="Photo (URL)"><Input value={g.photo} onChange={(v:string) => updGal(i,'photo',v)} /></Champ>
              </div>
            ))}
            <button onClick={addGal} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter une œuvre</button>
          </>)}

          {onglet === 'professeurs' && (<>
            {profs.map((p,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>{p.nom}</span>
                  <BtnDel onClick={() => delProf(i)} />
                </div>
                <Champ label="Nom"><Input value={p.nom} onChange={(v:string) => updProf(i,'nom',v)} /></Champ>
                <Champ label="Titre"><Input value={p.titre} onChange={(v:string) => updProf(i,'titre',v)} /></Champ>
                <Champ label="Spécialité"><Input value={p.specialite} onChange={(v:string) => updProf(i,'specialite',v)} /></Champ>
                <Champ label="Années"><Input value={String(p.annees)} onChange={(v:string) => updProf(i,'annees',parseInt(v)||1)} /></Champ>
                <Champ label="Œuvre signature"><Input value={p.oeuvreSignature} onChange={(v:string) => updProf(i,'oeuvreSignature',v)} /></Champ>
                <Champ label="Citation"><Input value={p.citation} onChange={(v:string) => updProf(i,'citation',v)} /></Champ>
                <Champ label="Bio"><Textarea value={p.bio} onChange={(v:string) => updProf(i,'bio',v)} rows={2} /></Champ>
                <Champ label="Photo (URL)"><Input value={p.photo} onChange={(v:string) => updProf(i,'photo',v)} /></Champ>
                <Champ label="Expositions (virgules)"><Input value={p.expositions?.join(', ')||''} onChange={(v:string) => updProf(i,'expositions',v.split(',').map((s:string)=>s.trim()).filter(Boolean))} /></Champ>
              </div>
            ))}
            <button onClick={addProf} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un artiste</button>
          </>)}

          {onglet === 'avis' && (<>
            {avis.map((a,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>Avis {i+1}</span>
                  <BtnDel onClick={() => delAvis(i)} />
                </div>
                <Champ label="Texte"><Textarea value={a.texte} onChange={(v:string) => updAvis(i,'texte',v)} rows={3} /></Champ>
                <Champ label="Auteur"><Input value={a.auteur} onChange={(v:string) => updAvis(i,'auteur',v)} /></Champ>
                <Champ label="Cours suivi"><Input value={a.cours} onChange={(v:string) => updAvis(i,'cours',v)} /></Champ>
                <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v:string) => updAvis(i,'photo',v)} /></Champ>
                <Champ label="Note">
                  <select value={a.note} onChange={e => updAvis(i,'note',parseInt(e.target.value))} style={{ width:'100%',padding:'7px',border:'1.5px solid #e5e7eb',borderRadius:5,fontSize:12,background:'#fff' }}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </Champ>
              </div>
            ))}
            <button onClick={addAvis} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un avis</button>
          </>)}

          {onglet === 'formules' && (<>
            <Champ label="Titre (partie normale)"><Input value={config.titreAbonnements} onChange={(v:string) => set('titreAbonnements', v)} placeholder="Votre" /></Champ>
            <Champ label="Titre (partie en couleur)"><Input value={config.titreAbonnementsAccent} onChange={(v:string) => set('titreAbonnementsAccent', v)} placeholder="pass création" /></Champ>
            <div style={{ background:'#fff5f5', border:`1.5px solid ${C1}40`, borderRadius:10, padding:16, textAlign:'center', marginTop:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
              <p style={{ fontSize:12, fontWeight:700, color:'#1a1a1a', marginBottom:6 }}>Géré ailleurs maintenant</p>
              <p style={{ fontSize:11, color:'#666', lineHeight:1.5 }}>
                Vos forfaits d'abonnement se créent et se gèrent maintenant dans <strong>Mes Abonnements → Mes forfaits</strong> depuis le menu principal du dashboard. Seuls les titres ci-dessus restent modifiables ici.
              </p>
            </div>
          </>)}

          {onglet === 'evenements' && (<>
            {evenements.map((ev,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>{ev.titre}</span>
                  <BtnDel onClick={() => delEv(i)} />
                </div>
                <Champ label="Titre"><Input value={ev.titre} onChange={(v:string) => updEv(i,'titre',v)} /></Champ>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <Champ label="Date"><Input value={ev.date} onChange={(v:string) => updEv(i,'date',v)} /></Champ>
                  <Champ label="Type">
                    <select value={ev.type} onChange={e => updEv(i,'type',e.target.value)} style={{ width:'100%',padding:'7px',border:'1.5px solid #e5e7eb',borderRadius:5,fontSize:12,background:'#fff' }}>
                      {['Vernissage','Atelier spécial','Soirée','Stage','Exposition'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Champ>
                </div>
                <Champ label="Description"><Textarea value={ev.description} onChange={(v:string) => updEv(i,'description',v)} rows={2} /></Champ>
              </div>
            ))}
            <button onClick={addEv} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un événement</button>
          </>)}

          {onglet === 'faq' && (<>
            {faq.map((f,i) => (
              <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>Q{i+1}</span>
                  <BtnDel onClick={() => delFaq(i)} />
                </div>
                <Champ label="Question"><Input value={f.question} onChange={(v:string) => updFaq(i,'question',v)} /></Champ>
                <Champ label="Réponse"><Textarea value={f.reponse} onChange={(v:string) => updFaq(i,'reponse',v)} rows={3} /></Champ>
              </div>
            ))}
            <button onClick={addFaq} style={{ width:'100%', padding:8, border:`2px dashed ${C1}`, borderRadius:8, background:'transparent', color:C1, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter une question</button>
          </>)}

          {onglet === 'contact' && (<>
            <Sec titre="Coordonnées">
              <Champ label="Adresse"><Input value={config.adresse} onChange={(v:string) => set('adresse',v)} /></Champ>
              <Champ label="Ville"><Input value={config.ville} onChange={(v:string) => set('ville',v)} /></Champ>
              <Champ label="Téléphone"><Input value={config.telephone} onChange={(v:string) => set('telephone',v)} /></Champ>
              <Champ label="Courriel"><Input value={config.email} onChange={(v:string) => set('email',v)} /></Champ>
            </Sec>
            <Sec titre="Horaires">
              {horaires.map((h,i) => (
                <div key={i} style={{ marginBottom:6 }}>
                  <Input value={h} onChange={(v:string) => updHoraire(i,v)} placeholder="Mar – Ven : 10h – 21h" />
                </div>
              ))}
            </Sec>
            <Sec titre="Réseaux">
              {(['instagram','facebook','youtube'] as const).map(k => (
                <Champ key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
                  <Input value={config.reseaux?.[k]||''} onChange={(v:string) => set('reseaux',{...config.reseaux,[k]:v})} />
                </Champ>
              ))}
            </Sec>
            <Sec titre="Google Maps">
              <Champ label="URL iFrame"><Textarea value={config.coordGoogleMaps} onChange={(v:string) => set('coordGoogleMaps',v)} rows={2} /></Champ>
            </Sec>
          </>)}
        </div>

        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_PEINTURE_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid ${config.couleurSombre}`, background:apercu?config.couleurSombre:'transparent', color:apercu?config.couleur3:config.couleurSombre, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu ? '✕ Fermer' : '👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':config.couleurSombre, color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':config.couleur3, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:config.couleurSombre, overflow:'hidden' }}>
        <div style={{ background:'#1a1200', borderBottom:'1px solid #f59e0b44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label]) => (
            <button key={m} onClick={() => setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${C1}33`:'transparent', color:modeApercu===m?C1:'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:config.couleurSombre, flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🎨</div>
          <p style={{ fontSize:15, color:config.couleur1, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${config.couleur1}50` }}>Template École de Peinture — Gratuit</p>
        </div>
      )}
    </div>
  );
}