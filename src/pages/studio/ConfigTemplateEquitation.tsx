// src/pages/studio/ConfigTemplateEquitation.tsx
// e-Vend Studio — Configuration du template Centre d'Équitation

import { useState, useEffect } from 'react';
import TemplateEquitation, { CONFIG_EQUITATION_DEFAUT } from '../../templates/TemplateEquitation';
import type { ConfigEquitation, SectionConfig, CoursEquitation, Cheval, Instructeur, AvisEquitation, FormulaireAbonnement, EvenementEquitation } from '../../templates/TemplateEquitation';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'cours' | 'chevaux' | 'instructeurs' | 'avis' | 'abonnements' | 'evenements' | 'palmares' | 'faq' | 'contact';

const CB = '#8b2635';
const CO = '#c9a84c';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CB} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CB} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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

function SectionsManager({ sections, onChange }: { sections: SectionConfig[]; onChange: (s: SectionConfig[]) => void }) {
  const deplacer = (i: number, dir: -1 | 1) => {
    const arr = [...sections].sort((a, b) => a.ordre - b.ordre);
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[i].ordre;
    arr[i] = { ...arr[i], ordre: arr[ni].ordre };
    arr[ni] = { ...arr[ni], ordre: tmp };
    onChange(arr);
  };
  const toggle = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);
  const icones: Record<string, string> = { hero:'🐎', stats:'📊', cours:'🏇', chevaux:'🐴', apropos:'📖', instructeurs:'⭐', palmares:'🏆', evenements:'📅', avis:'💬', abonnements:'💰', faq:'❓', contact:'✉️' };
  return (
    <div>
      <div style={{ background: '#fff5f0', border: `1px solid ${CB}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#5a1520', marginBottom: 12 }}>
        <strong>🐴 Sections</strong> — Toggle ON/OFF + ▲▼ pour réordonner
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: sec.actif ? '#fff5f0' : '#fafafa', border: `2px solid ${sec.actif ? CB : '#e5e7eb'}`, borderRadius: 8, padding: '7px 9px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', marginRight: 4 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 38, height: 19, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? CB : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 1.5, left: sec.actif ? 19 : 1.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 7, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 7, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 9, padding: '5px 9px', background: '#f5f5f5', borderRadius: 6, fontSize: 11, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length}
      </div>
    </div>
  );
}

const PALETTES = [
  { nom: 'Bordeaux & Or (défaut)', cb: '#8b2635', co: '#c9a84c', cp: '#4a7c59', cf: '#faf8f3', cfs: '#1a0f0a' },
  { nom: 'Marine & Champagne',     cb: '#1a3a5c', co: '#c9b07a', cp: '#4a7c59', cf: '#f8f9fa', cfs: '#0a0f18' },
  { nom: 'Vert Forêt & Or',        cb: '#2d5a3d', co: '#c9a84c', cp: '#5a8a6a', cf: '#f5faf6', cfs: '#0a1510' },
  { nom: 'Brun & Caramel',         cb: '#6b3a1f', co: '#d4874a', cp: '#6b8f59', cf: '#fdf8f5', cfs: '#150a05' },
  { nom: 'Noir & Or',              cb: '#1a1a1a', co: '#c9a84c', cp: '#4a7c59', cf: '#fafafa', cfs: '#050505' },
  { nom: 'Bordeaux & Argent',      cb: '#8b2635', co: '#b0b8c0', cp: '#4a7c59', cf: '#faf8f3', cfs: '#1a0f0a' },
];

interface Props {
  vendeurId: string;
  onSauvegarde?: (config: ConfigEquitation) => Promise<void>;
}

export default function ConfigTemplateEquitation({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigEquitation>({ ...CONFIG_EQUITATION_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigEquitation, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) { await onSauvegarde(config); }
      else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include', body: JSON.stringify({ config, template_id: 'cours-equitation' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('ok'); setTimeout(() => setSauvegarde('idle'), 2500);
    } catch { setSauvegarde('err'); setTimeout(() => setSauvegarde('idle'), 3000); }
  };

  const sections     = ea(config.sections,     CONFIG_EQUITATION_DEFAUT.sections);
  const stats        = ea(config.stats,         CONFIG_EQUITATION_DEFAUT.stats);
  const cours        = ea(config.cours,          CONFIG_EQUITATION_DEFAUT.cours);
  const chevaux      = ea(config.chevaux,        CONFIG_EQUITATION_DEFAUT.chevaux);
  const instructeurs = ea(config.instructeurs,   CONFIG_EQUITATION_DEFAUT.instructeurs);
  const avis         = ea(config.avis,           CONFIG_EQUITATION_DEFAUT.avis);
  const abonnements  = ea(config.abonnements,    CONFIG_EQUITATION_DEFAUT.abonnements);
  const evenements   = ea(config.evenements,     CONFIG_EQUITATION_DEFAUT.evenements);
  const palmares     = ea(config.palmares,       CONFIG_EQUITATION_DEFAUT.palmares);
  const faq          = ea(config.faq,            CONFIG_EQUITATION_DEFAUT.faq);
  const horaires     = ea(config.horaires,       CONFIG_EQUITATION_DEFAUT.horaires);

  const updStat   = (i: number, k: string, v: string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };
  const updCours  = (i: number, k: keyof CoursEquitation, v: any) => { const a=[...cours]; a[i]={...a[i],[k]:v}; set('cours',a); };
  const delCours  = (i: number) => { const a=[...cours]; a.splice(i,1); set('cours',a); };
  const addCours  = () => set('cours',[...cours,{titre:'Nouveau cours',description:'',photo:'',niveau:'Débutant' as const,age:'Tous âges',duree:'60 min',prix:'65$',inclus:[],disciplines:[]}]);
  const updCheval = (i: number, k: keyof Cheval, v: any) => { const a=[...chevaux]; a[i]={...a[i],[k]:v}; set('chevaux',a); };
  const delCheval = (i: number) => { const a=[...chevaux]; a.splice(i,1); set('chevaux',a); };
  const addCheval = () => set('chevaux',[...chevaux,{nom:'Nouveau',race:'Race',age:5,description:'',photo:'',discipline:'Tous niveaux',caracteristiques:[]}]);
  const updInst   = (i: number, k: keyof Instructeur, v: any) => { const a=[...instructeurs]; a[i]={...a[i],[k]:v}; set('instructeurs',a); };
  const delInst   = (i: number) => { const a=[...instructeurs]; a.splice(i,1); set('instructeurs',a); };
  const addInst   = () => set('instructeurs',[...instructeurs,{nom:'Nouveau',titre:'',specialite:'',bio:'',photo:'',palmares:[],annees:5,citation:''}]);
  const updAvis   = (i: number, k: keyof AvisEquitation, v: any) => { const a=[...avis]; a[i]={...a[i],[k]:v}; set('avis',a); };
  const delAvis   = (i: number) => { const a=[...avis]; a.splice(i,1); set('avis',a); };
  const addAvis   = () => set('avis',[...avis,{texte:'',auteur:'',cours:'',photo:'',note:5,depuis:''}]);
  const updAbonn  = (i: number, k: keyof FormulaireAbonnement, v: any) => { const a=[...abonnements]; a[i]={...a[i],[k]:v}; set('abonnements',a); };
  const delAbonn  = (i: number) => { const a=[...abonnements]; a.splice(i,1); set('abonnements',a); };
  const addAbonn  = () => set('abonnements',[...abonnements,{nom:'Nouvelle formule',prix:'0$',periode:'/mois',description:'',inclus:[],populaire:false}]);
  const updEv     = (i: number, k: keyof EvenementEquitation, v: string) => { const a=[...evenements]; a[i]={...a[i],[k]:v}; set('evenements',a); };
  const delEv     = (i: number) => { const a=[...evenements]; a.splice(i,1); set('evenements',a); };
  const addEv     = () => set('evenements',[...evenements,{titre:'Nouvel événement',date:'1 jan 2027',description:'',type:'Stage'}]);
  const updPal    = (i: number, k: string, v: string) => { const a=[...palmares]; a[i]={...a[i],[k]:v}; set('palmares',a); };
  const delPal    = (i: number) => { const a=[...palmares]; a.splice(i,1); set('palmares',a); };
  const addPal    = () => set('palmares',[...palmares,{annee:'2024',titre:'Nouveau titre',discipline:''}]);
  const updFaq    = (i: number, k: string, v: string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq    = (i: number) => { const a=[...faq]; a.splice(i,1); set('faq',a); };
  const addFaq    = () => set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);
  const updHoraire= (i: number, v: string) => { const h=[...horaires]; h[i]=v; set('horaires',h); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id:'identite', label:'Identité', emoji:'🏷️' }, { id:'apparence', label:'Couleurs', emoji:'🎨' },
    { id:'sections', label:'Sections', emoji:'📐' }, { id:'stats', label:'Stats', emoji:'📊' },
    { id:'cours', label:'Cours', emoji:'🏇' }, { id:'chevaux', label:'Chevaux', emoji:'🐴' },
    { id:'instructeurs', label:'Instructeurs', emoji:'⭐' }, { id:'avis', label:'Avis', emoji:'💬' },
    { id:'abonnements', label:'Tarifs', emoji:'💰' }, { id:'evenements', label:'Événements', emoji:'📅' },
    { id:'palmares', label:'Palmarès', emoji:'🏆' }, { id:'faq', label:'FAQ', emoji:'❓' },
    { id:'contact', label:'Contact', emoji:'✉️' },
  ];

  const BtnDel = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
  );

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* Panneau */}
      <div style={{ width: 360, minWidth: 320, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '13px 13px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${config.couleurFondSombre}, ${CB})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐎</div>
            <div>
              <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Centre d'Équitation</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingBottom: 10 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '3px 6px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, background: onglet === o.id ? config.couleurFondSombre : '#f3f4f6', color: onglet === o.id ? CO : '#555', transition: 'all .15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 13 }}>

          {onglet === 'identite' && (<>
            <Sec titre="Centre">
              <Champ label="Nom du centre"><Input value={config.nomCentre} onChange={(v: string) => set('nomCentre', v)} /></Champ>
              <Champ label="Tagline ligne 1"><Input value={config.tagline} onChange={(v: string) => set('tagline', v)} placeholder="L'excellence équestre," /></Champ>
              <Champ label="Tagline ligne 2 (italique or)"><Input value={config.sousTagline} onChange={(v: string) => set('sousTagline', v)} placeholder="à votre portée." /></Champ>
              <Champ label="Citation"><Input value={config.citation} onChange={(v: string) => set('citation', v)} /></Champ>
              <Champ label="Auteur citation"><Input value={config.auteurCitation} onChange={(v: string) => set('auteurCitation', v)} /></Champ>
              <Champ label="Description hero"><Textarea value={config.descriptionHero} onChange={(v: string) => set('descriptionHero', v)} rows={3} /></Champ>
              <Champ label="Description à propos"><Textarea value={config.descriptionAPropos} onChange={(v: string) => set('descriptionAPropos', v)} rows={3} /></Champ>
            </Sec>
            <Sec titre="Infos clés (hero)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <Champ label="Fondée en"><Input value={config.fondee} onChange={(v: string) => set('fondee', v)} placeholder="2005" /></Champ>
                <Champ label="Superficie"><Input value={config.superficie} onChange={(v: string) => set('superficie', v)} placeholder="45 hectares" /></Champ>
                <Champ label="Nb chevaux"><Input value={config.nbChevaux} onChange={(v: string) => set('nbChevaux', v)} placeholder="32 chevaux" /></Champ>
              </div>
            </Sec>
            <Sec titre="Photos">
              <Champ label="Photo Hero"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
              <Champ label="Photo À propos 1"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} /></Champ>
              <Champ label="Photo À propos 2"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} /></Champ>
              <Champ label="Photo À propos 3"><Input value={config.photoAPropos3} onChange={(v: string) => set('photoAPropos3', v)} /></Champ>
              <Champ label="Photo Banner (palmarès/abonnements)" desc="Photo en fond semi-transparent"><Input value={config.photoBanner} onChange={(v: string) => set('photoBanner', v)} /></Champ>
            </Sec>
          </>)}

          {onglet === 'apparence' && (<>
            <Sec titre="Palettes prédéfinies">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                {PALETTES.map(p => (
                  <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurBordeaux: p.cb, couleurOr: p.co, couleurPrairie: p.cp, couleurFond: p.cf, couleurFondSombre: p.cfs }))}
                    style={{ padding: '7px', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 600, border: `2px solid ${config.couleurBordeaux === p.cb ? p.cb : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[p.cf, p.cb, p.co, p.cp, p.cfs].map((col, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: col, border: '1px solid rgba(0,0,0,.1)' }} />)}
                    </div>
                    <span style={{ color: p.cb, fontSize: 8 }}>{p.nom}</span>
                  </button>
                ))}
              </div>
            </Sec>
            <Sec titre="Couleurs">
              {([['couleurFond','Fond clair'],['couleurBordeaux','Accent bordeaux'],['couleurOr','Accent or'],['couleurPrairie','Vert prairie (herbe)'],['couleurFondSombre','Fond sombre (hero)']] as [keyof ConfigEquitation, string][]).map(([k, label]) => (
                <Champ key={k} label={label}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="color" value={(config[k] as string)||'#000'} onChange={e => set(k, e.target.value)} style={{ width: 34, height: 30, padding: 2, border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer' }} />
                    <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                  </div>
                </Champ>
              ))}
            </Sec>
          </>)}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={s => set('sections', s)} />}

          {onglet === 'stats' && (
            <Sec titre="4 chiffres clés">
              {stats.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 9, marginBottom: 9 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 6 }}>
                    <Champ label="Icône"><Input value={s.icone} onChange={(v: string) => updStat(i, 'icone', v)} placeholder="🏇" /></Champ>
                    <Champ label="Valeur"><Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="450+" /></Champ>
                    <Champ label="Libellé"><Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Cavaliers formés" /></Champ>
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {onglet === 'cours' && (<>
            {cours.map((c, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{c.titre}</span>
                  <BtnDel onClick={() => delCours(i)} />
                </div>
                <Champ label="Titre"><Input value={c.titre} onChange={(v: string) => updCours(i, 'titre', v)} /></Champ>
                <Champ label="Niveau">
                  <select value={c.niveau} onChange={e => updCours(i, 'niveau', e.target.value as any)} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                    {['Débutant','Intermédiaire','Avancé','Compétition'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Champ>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <Champ label="Âge"><Input value={c.age} onChange={(v: string) => updCours(i, 'age', v)} placeholder="Dès 5 ans" /></Champ>
                  <Champ label="Durée"><Input value={c.duree} onChange={(v: string) => updCours(i, 'duree', v)} placeholder="60 min" /></Champ>
                  <Champ label="Prix"><Input value={c.prix} onChange={(v: string) => updCours(i, 'prix', v)} placeholder="65$" /></Champ>
                </div>
                <Champ label="Description"><Textarea value={c.description} onChange={(v: string) => updCours(i, 'description', v)} rows={2} /></Champ>
                <Champ label="Photo (URL)"><Input value={c.photo} onChange={(v: string) => updCours(i, 'photo', v)} /></Champ>
                <Champ label="Disciplines (virgules)"><Input value={c.disciplines?.join(', ')||''} onChange={(v: string) => updCours(i, 'disciplines', v.split(',').map((s: string)=>s.trim()).filter(Boolean))} placeholder="Longe, Trot, Galop" /></Champ>
                <Champ label="Inclus (virgules)"><Input value={c.inclus?.join(', ')||''} onChange={(v: string) => updCours(i, 'inclus', v.split(',').map((s: string)=>s.trim()).filter(Boolean))} placeholder="Casque fourni, Moniteur" /></Champ>
              </div>
            ))}
            <button onClick={addCours} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un cours</button>
          </>)}

          {onglet === 'chevaux' && (<>
            <div style={{ background: '#fff8f0', border: `1px solid ${CO}50`, borderRadius: 7, padding: 9, fontSize: 11, color: '#6b4510', marginBottom: 10 }}>
              🐴 Les chevaux s'affichent en carrousel 3D immersif — cliquez entre eux!
            </div>
            {chevaux.map((ch, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>🐴 {ch.nom}</span>
                  <BtnDel onClick={() => delCheval(i)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Champ label="Nom"><Input value={ch.nom} onChange={(v: string) => updCheval(i,'nom',v)} /></Champ>
                  <Champ label="Race"><Input value={ch.race} onChange={(v: string) => updCheval(i,'race',v)} /></Champ>
                  <Champ label="Âge (ans)"><Input value={String(ch.age)} onChange={(v: string) => updCheval(i,'age',parseInt(v)||1)} /></Champ>
                  <Champ label="Discipline"><Input value={ch.discipline} onChange={(v: string) => updCheval(i,'discipline',v)} /></Champ>
                </div>
                <Champ label="Description"><Textarea value={ch.description} onChange={(v: string) => updCheval(i,'description',v)} rows={2} /></Champ>
                <Champ label="Photo (URL)"><Input value={ch.photo} onChange={(v: string) => updCheval(i,'photo',v)} /></Champ>
                <Champ label="Caractéristiques (virgules)"><Input value={ch.caracteristiques?.join(', ')||''} onChange={(v: string) => updCheval(i,'caracteristiques',v.split(',').map((s: string)=>s.trim()).filter(Boolean))} placeholder="Très docile, Taille 1.62m" /></Champ>
              </div>
            ))}
            <button onClick={addCheval} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un cheval</button>
          </>)}

          {onglet === 'instructeurs' && (<>
            {instructeurs.map((inst, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{inst.nom}</span>
                  <BtnDel onClick={() => delInst(i)} />
                </div>
                <Champ label="Nom"><Input value={inst.nom} onChange={(v: string) => updInst(i,'nom',v)} /></Champ>
                <Champ label="Titre"><Input value={inst.titre} onChange={(v: string) => updInst(i,'titre',v)} /></Champ>
                <Champ label="Spécialité"><Input value={inst.specialite} onChange={(v: string) => updInst(i,'specialite',v)} /></Champ>
                <Champ label="Années"><Input value={String(inst.annees)} onChange={(v: string) => updInst(i,'annees',parseInt(v)||1)} /></Champ>
                <Champ label="Citation"><Input value={inst.citation} onChange={(v: string) => updInst(i,'citation',v)} /></Champ>
                <Champ label="Bio"><Textarea value={inst.bio} onChange={(v: string) => updInst(i,'bio',v)} rows={2} /></Champ>
                <Champ label="Photo (URL)"><Input value={inst.photo} onChange={(v: string) => updInst(i,'photo',v)} /></Champ>
                <Champ label="Palmarès (virgules)"><Input value={inst.palmares?.join(', ')||''} onChange={(v: string) => updInst(i,'palmares',v.split(',').map((s: string)=>s.trim()).filter(Boolean))} /></Champ>
              </div>
            ))}
            <button onClick={addInst} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un instructeur</button>
          </>)}

          {onglet === 'avis' && (<>
            {avis.map((a, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Avis {i+1}</span>
                  <BtnDel onClick={() => delAvis(i)} />
                </div>
                <Champ label="Texte"><Textarea value={a.texte} onChange={(v: string) => updAvis(i,'texte',v)} rows={3} /></Champ>
                <Champ label="Auteur"><Input value={a.auteur} onChange={(v: string) => updAvis(i,'auteur',v)} /></Champ>
                <Champ label="Cours suivi"><Input value={a.cours} onChange={(v: string) => updAvis(i,'cours',v)} /></Champ>
                <Champ label="Depuis"><Input value={a.depuis} onChange={(v: string) => updAvis(i,'depuis',v)} placeholder="Membre depuis 2 ans" /></Champ>
                <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v: string) => updAvis(i,'photo',v)} /></Champ>
                <Champ label="Note">
                  <select value={a.note} onChange={e => updAvis(i,'note',parseInt(e.target.value))} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </Champ>
              </div>
            ))}
            <button onClick={addAvis} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un avis</button>
          </>)}

          {onglet === 'abonnements' && (<>
            {abonnements.map((a, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{a.nom}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!a.populaire} onChange={e => updAbonn(i,'populaire',e.target.checked)} />Populaire
                    </label>
                    <BtnDel onClick={() => delAbonn(i)} />
                  </div>
                </div>
                <Champ label="Nom"><Input value={a.nom} onChange={(v: string) => updAbonn(i,'nom',v)} /></Champ>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Champ label="Prix"><Input value={a.prix} onChange={(v: string) => updAbonn(i,'prix',v)} /></Champ>
                  <Champ label="Période"><Input value={a.periode} onChange={(v: string) => updAbonn(i,'periode',v)} placeholder="/ mois" /></Champ>
                </div>
                <Champ label="Description"><Textarea value={a.description} onChange={(v: string) => updAbonn(i,'description',v)} rows={2} /></Champ>
                <Champ label="Inclus (virgules)"><Input value={a.inclus?.join(', ')||''} onChange={(v: string) => updAbonn(i,'inclus',v.split(',').map((s: string)=>s.trim()).filter(Boolean))} /></Champ>
              </div>
            ))}
            <button onClick={addAbonn} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter une formule</button>
          </>)}

          {onglet === 'evenements' && (<>
            {evenements.map((ev, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{ev.titre}</span>
                  <BtnDel onClick={() => delEv(i)} />
                </div>
                <Champ label="Titre"><Input value={ev.titre} onChange={(v: string) => updEv(i,'titre',v)} /></Champ>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Champ label="Date (ex: 15 juillet 2026)"><Input value={ev.date} onChange={(v: string) => updEv(i,'date',v)} /></Champ>
                  <Champ label="Type">
                    <select value={ev.type} onChange={e => updEv(i,'type',e.target.value)} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      {['Portes ouvertes','Compétition','Stage','Atelier','Fête'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Champ>
                </div>
                <Champ label="Description"><Textarea value={ev.description} onChange={(v: string) => updEv(i,'description',v)} rows={2} /></Champ>
              </div>
            ))}
            <button onClick={addEv} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un événement</button>
          </>)}

          {onglet === 'palmares' && (<>
            <div style={{ background: '#fff8e8', border: `1px solid ${CO}50`, borderRadius: 7, padding: 9, fontSize: 11, color: '#6b4510', marginBottom: 10 }}>
              🏆 Chaque titre s'affiche avec un ruban doré animé.
            </div>
            {palmares.map((p, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 9, marginBottom: 8, display: 'grid', gridTemplateColumns: '60px 1fr 1fr 28px', gap: 6, alignItems: 'end' }}>
                <Champ label="Année"><Input value={p.annee} onChange={(v: string) => updPal(i,'annee',v)} placeholder="2024" /></Champ>
                <Champ label="Titre"><Input value={p.titre} onChange={(v: string) => updPal(i,'titre',v)} /></Champ>
                <Champ label="Discipline"><Input value={p.discipline} onChange={(v: string) => updPal(i,'discipline',v)} /></Champ>
                <button onClick={() => delPal(i)} style={{ height: 30, background: '#fef2f2', border: 'none', borderRadius: 4, fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <button onClick={addPal} style={{ width: '100%', padding: 8, border: `2px dashed ${CO}`, borderRadius: 8, background: 'transparent', color: CO, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter un titre</button>
          </>)}

          {onglet === 'faq' && (<>
            {faq.map((f, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Q{i+1}</span>
                  <BtnDel onClick={() => delFaq(i)} />
                </div>
                <Champ label="Question"><Input value={f.question} onChange={(v: string) => updFaq(i,'question',v)} /></Champ>
                <Champ label="Réponse"><Textarea value={f.reponse} onChange={(v: string) => updFaq(i,'reponse',v)} rows={3} /></Champ>
              </div>
            ))}
            <button onClick={addFaq} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Ajouter une question</button>
          </>)}

          {onglet === 'contact' && (<>
            <Sec titre="Coordonnées">
              <Champ label="Adresse"><Input value={config.adresse} onChange={(v: string) => set('adresse', v)} /></Champ>
              <Champ label="Ville"><Input value={config.ville} onChange={(v: string) => set('ville', v)} /></Champ>
              <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => set('telephone', v)} /></Champ>
              <Champ label="Courriel"><Input value={config.email} onChange={(v: string) => set('email', v)} /></Champ>
            </Sec>
            <Sec titre="Horaires">
              {horaires.map((h, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 8h – 20h" />
                </div>
              ))}
            </Sec>
            <Sec titre="Réseaux">
              {(['instagram','facebook','youtube'] as const).map(k => (
                <Champ key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
                  <Input value={config.reseaux?.[k]||''} onChange={(v: string) => set('reseaux', {...config.reseaux,[k]:v})} />
                </Champ>
              ))}
            </Sec>
            <Sec titre="Google Maps">
              <Champ label="URL iFrame"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={2} /></Champ>
            </Sec>
          </>)}
        </div>

        <div style={{ padding: '11px 13px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {resetConfirm ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, flex: 1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_EQUITATION_DEFAUT}); setResetConfirm(false); }} style={{ padding: '4px 10px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '4px 8px', borderRadius: 5, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setApercu(!apercu)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1.5px solid ${config.couleurFondSombre}`, background: apercu ? config.couleurFondSombre : 'transparent', color: apercu ? CO : config.couleurFondSombre, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
              {apercu ? '✕ Fermer' : '👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde === 'loading'} style={{ flex: 2, padding: '9px 0', borderRadius: 7, border: 'none', background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : config.couleurFondSombre, color: sauvegarde === 'ok' || sauvegarde === 'err' ? '#fff' : CO, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
              {sauvegarde === 'loading' ? '⏳...' : sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: apercu ? 'flex' : 'none', flexDirection: 'column', background: config.couleurFondSombre, overflow: 'hidden' }}>
        <div style={{ background: '#1a1200', borderBottom: '1px solid #f59e0b44', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([['desktop', '🖥️', 'Bureau'], ['tablette', '📲', 'Tablette'], ['mobile', '📱', 'Mobile']] as const).map(([m, ico, label]) => (
            <button key={m} onClick={() => setModeApercu(m)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: modeApercu === m ? `${CB}33` : 'transparent', color: modeApercu === m ? CO : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
              <span style={{ fontSize: 16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 8px' }}>
          <div style={{ width: modeApercu === 'mobile' ? 375 : modeApercu === 'tablette' ? 768 : '100%', height: '100%', overflow: 'hidden', borderRadius: modeApercu === 'mobile' ? 20 : modeApercu === 'tablette' ? 8 : 4, border: `${modeApercu === 'mobile' ? 4 : 2}px solid #333`, flexShrink: 0, background: '#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width: modeApercu === 'mobile' ? 375 : modeApercu === 'tablette' ? 768 : '100%', height: '100%', border: 'none', display: 'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: config.couleurFondSombre, flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🐎</div>
          <p style={{ fontSize: 15, color: CO, fontWeight: 600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize: 12, color: `${CO}50` }}>Template Centre d'Équitation — Gratuit</p>
        </div>
      )}
    </div>
  );
}