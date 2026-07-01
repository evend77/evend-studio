// src/pages/studio/ConfigTemplateEcoleCuisine.tsx
// e-Vend Studio — Configuration du template École de Cuisine

import { useState, useEffect } from 'react';
import TemplateEcoleCuisine, { CONFIG_CUISINE_DEFAUT } from '../../templates/TemplateEcoleCuisine';
import type { ConfigEcoleCuisine, SectionConfig, PlatSignature, CoursAtelier, ChefFormateur, AvisCuisine } from '../../templates/TemplateEcoleCuisine';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'plats' | 'cours' | 'chefs' | 'avis' | 'formules' | 'faq' | 'contact';

const CB = '#c0392b'; // brique

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
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>{label}</label>
    {desc && <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{desc}</p>}
    {children}
  </div>
);
const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

function SectionsManager({ sections, onChange }: { sections: SectionConfig[]; onChange: (s: SectionConfig[]) => void }) {
  const deplacer = (index: number, dir: -1 | 1) => {
    const arr = [...sections].sort((a, b) => a.ordre - b.ordre);
    const ni = index + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[index].ordre;
    arr[index] = { ...arr[index], ordre: arr[ni].ordre };
    arr[ni] = { ...arr[ni], ordre: tmp };
    onChange(arr);
  };
  const toggle = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);
  const icones: Record<string, string> = {
    hero: '🍳', ticker: '🔪', stats: '📊', plats: '🍽️', apropos: '📖',
    cours: '👨‍🍳', chefs: '⭐', avis: '💬', formules: '💰', faq: '❓', contact: '📅',
  };

  return (
    <div>
      <div style={{ background: '#fff5f0', border: `1px solid ${CB}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a1a0a', marginBottom: 12 }}>
        <strong>📐 Sections</strong> — Toggle ON/OFF + ▲▼ pour réordonner
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: sec.actif ? '#fff5f0' : '#fafafa', border: `2px solid ${sec.actif ? CB : '#e5e7eb'}`, borderRadius: 9, padding: '8px 10px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', marginRight: 4 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 40, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? CB : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 2, left: sec.actif ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 20, height: 16, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 8, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 20, height: 16, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 8, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: '6px 10px', background: '#f5f5f5', borderRadius: 6, fontSize: 11, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length}
      </div>
    </div>
  );
}

const PALETTES = [
  { nom: 'Ivoire & Brique (défaut)',  cf: '#faf8f3', cb: '#c0392b', co: '#d4a017', cfs: '#1a0f0a' },
  { nom: 'Crème & Olive',             cf: '#f8f6ef', cb: '#556b2f', co: '#8b7355', cfs: '#0f1208' },
  { nom: 'Blanc & Bordeaux',          cf: '#fafafa', cb: '#8b0000', co: '#c9a84c', cfs: '#0f0508' },
  { nom: 'Sable & Turquoise',         cf: '#fdf6e3', cb: '#1a8a7a', co: '#d4a017', cfs: '#0a1410' },
  { nom: 'Ivoire & Indigo',           cf: '#f8f8f2', cb: '#3730a3', co: '#c9a84c', cfs: '#05080f' },
  { nom: 'Blanc & Brun Chaud',        cf: '#fffef9', cb: '#92400e', co: '#d97706', cfs: '#120800' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigEcoleCuisine>;
  onSauvegarde?: (config: ConfigEcoleCuisine) => Promise<void>;
}

export default function ConfigTemplateEcoleCuisine({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigEcoleCuisine>({ ...CONFIG_CUISINE_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigEcoleCuisine, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ config, template_id: 'cours-cuisine' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('ok');
      setTimeout(() => setSauvegarde('idle'), 2500);
    } catch {
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // Helpers
  const sections  = ea(config.sections,  CONFIG_CUISINE_DEFAUT.sections);
  const stats     = ea(config.stats,     CONFIG_CUISINE_DEFAUT.stats);
  const plats     = ea(config.plats,     CONFIG_CUISINE_DEFAUT.plats);
  const cours     = ea(config.cours,     CONFIG_CUISINE_DEFAUT.cours);
  const chefs     = ea(config.chefs,     CONFIG_CUISINE_DEFAUT.chefs);
  const avis      = ea(config.avis,      CONFIG_CUISINE_DEFAUT.avis);
  const formules  = ea(config.formules,  CONFIG_CUISINE_DEFAUT.formules);
  const faq       = ea(config.faq,       CONFIG_CUISINE_DEFAUT.faq);
  const horaires  = ea(config.horaires,  CONFIG_CUISINE_DEFAUT.horaires);

  const updStat    = (i: number, k: string, v: string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };
  const updPlat    = (i: number, k: keyof PlatSignature, v: any) => { const a=[...plats]; a[i]={...a[i],[k]:v}; set('plats',a); };
  const delPlat    = (i: number) => { const a=[...plats]; a.splice(i,1); set('plats',a); };
  const addPlat    = () => set('plats',[...plats,{nom:'Nouveau plat',description:'',photo:'',chef:'',difficulte:3,temps:'30 min',categorie:'Plat'}]);
  const updCours   = (i: number, k: keyof CoursAtelier, v: any) => { const a=[...cours]; a[i]={...a[i],[k]:v}; set('cours',a); };
  const delCours   = (i: number) => { const a=[...cours]; a.splice(i,1); set('cours',a); };
  const addCours   = () => set('cours',[...cours,{titre:'Nouvel atelier',description:'',photo:'',duree:'4h',niveau:'Débutant' as const,places:8,prix:'120$',inclus:[],themes:[]}]);
  const updChef    = (i: number, k: keyof ChefFormateur, v: any) => { const a=[...chefs]; a[i]={...a[i],[k]:v}; set('chefs',a); };
  const delChef    = (i: number) => { const a=[...chefs]; a.splice(i,1); set('chefs',a); };
  const addChef    = () => set('chefs',[...chefs,{nom:'Chef Nom',titre:'Chef cuisinier',specialite:'',bio:'',photo:'',annees:10,signature:''}]);
  const updAvis    = (i: number, k: keyof AvisCuisine, v: any) => { const a=[...avis]; a[i]={...a[i],[k]:v}; set('avis',a); };
  const delAvis    = (i: number) => { const a=[...avis]; a.splice(i,1); set('avis',a); };
  const addAvis    = () => set('avis',[...avis,{texte:'',auteur:'',cours:'',photo:'',note:5}]);
  const updFormule = (i: number, k: string, v: any) => { const a=[...formules]; a[i]={...a[i],[k]:v}; set('formules',a); };
  const delFormule = (i: number) => { const a=[...formules]; a.splice(i,1); set('formules',a); };
  const addFormule = () => set('formules',[...formules,{nom:'Nouvelle formule',prix:'0$',periode:'/atelier',description:'',inclus:[],populaire:false}]);
  const updFaq     = (i: number, k: string, v: string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq     = (i: number) => { const a=[...faq]; a.splice(i,1); set('faq',a); };
  const addFaq     = () => set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);
  const updHoraire = (i: number, v: string) => { const h=[...horaires]; h[i]=v; set('horaires',h); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',  label: 'Identité',  emoji: '🏷️' },
    { id: 'apparence', label: 'Couleurs',  emoji: '🎨' },
    { id: 'sections',  label: 'Sections',  emoji: '📐' },
    { id: 'stats',     label: 'Stats',     emoji: '📊' },
    { id: 'plats',     label: 'Plats',     emoji: '🍽️' },
    { id: 'cours',     label: 'Ateliers',  emoji: '👨‍🍳' },
    { id: 'chefs',     label: 'Chefs',     emoji: '⭐' },
    { id: 'avis',      label: 'Avis',      emoji: '💬' },
    { id: 'formules',  label: 'Tarifs',    emoji: '💰' },
    { id: 'faq',       label: 'FAQ',       emoji: '❓' },
    { id: 'contact',   label: 'Contact',   emoji: '📍' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      <div style={{ width: 360, minWidth: 320, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 14px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, #1a0f0a, ${CB})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍳</div>
            <div>
              <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>École de Cuisine</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingBottom: 10 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '3px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, background: onglet === o.id ? '#1a0f0a' : '#f3f4f6', color: onglet === o.id ? '#d4a017' : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

          {onglet === 'identite' && (
            <>
              <Sec titre="Identité">
                <Champ label="Nom de l'école"><Input value={config.nomEcole} onChange={(v: string) => set('nomEcole', v)} /></Champ>
                <Champ label="Tagline (1re ligne)" desc="Ex: L'art culinaire,"><Input value={config.tagline} onChange={(v: string) => set('tagline', v)} /></Champ>
                <Champ label="Tagline (2e ligne — italique)" desc="Ex: maîtrisé."><Input value={config.sousTagline} onChange={(v: string) => set('sousTagline', v)} /></Champ>
                <Champ label="Citation / Philosophie" desc="Affichée en écriture script"><Input value={config.philosophie} onChange={(v: string) => set('philosophie', v)} /></Champ>
                <Champ label="Description hero"><Textarea value={config.descriptionHero} onChange={(v: string) => set('descriptionHero', v)} rows={3} /></Champ>
                <Champ label="Description À propos"><Textarea value={config.descriptionAPropos} onChange={(v: string) => set('descriptionAPropos', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Photos">
                <Champ label="Photo Hero (fond plein écran)"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo À propos — principale"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} /></Champ>
                <Champ label="Photo À propos — 2e"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} /></Champ>
                <Champ label="Photo À propos — 3e (avec bordure or)"><Input value={config.photoAPropos3} onChange={(v: string) => set('photoAPropos3', v)} /></Champ>
              </Sec>
            </>
          )}

          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurFond: p.cf, couleurBrique: p.cb, couleurOr: p.co, couleurFondSombre: p.cfs }))}
                      style={{ padding: '8px', borderRadius: 7, cursor: 'pointer', fontSize: 9, fontWeight: 600, border: `2px solid ${config.couleurBrique === p.cb && config.couleurFond === p.cf ? p.cb : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cb }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.co }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfs }} />
                      </div>
                      <span style={{ color: p.cb, fontSize: 8 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([['couleurFond', 'Fond clair (ivoire)'], ['couleurBrique', 'Accent brique'], ['couleurOr', 'Accent or'], ['couleurFondSombre', 'Fond sombre (hero, chefs)']] as [keyof ConfigEcoleCuisine, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 36, height: 30, padding: 2, border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer' }} />
                      <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                    </div>
                  </Champ>
                ))}
              </Sec>
            </>
          )}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={s => set('sections', s)} />}

          {onglet === 'stats' && (
            <Sec titre="4 chiffres clés">
              {stats.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 10, marginBottom: 10 }}>
                  <Champ label={`Stat ${i + 1}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 6 }}>
                      <Input value={s.icone} onChange={(v: string) => updStat(i, 'icone', v)} placeholder="👨‍🍳" />
                      <Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="3200+" />
                      <Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Élèves formés" />
                    </div>
                  </Champ>
                </div>
              ))}
            </Sec>
          )}

          {onglet === 'plats' && (
            <>
              <div style={{ background: '#fff5f0', border: `1px solid ${CB}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a1a0a', marginBottom: 10 }}>
                🍽️ Les plats s'affichent en plein écran immersif avec transition douce et vapeur animée.
              </div>
              {plats.map((p, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{p.nom}</span>
                    <button onClick={() => delPlat(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={p.nom} onChange={(v: string) => updPlat(i, 'nom', v)} /></Champ>
                  <Champ label="Description"><Textarea value={p.description} onChange={(v: string) => updPlat(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Photo (URL)"><Input value={p.photo} onChange={(v: string) => updPlat(i, 'photo', v)} /></Champ>
                  <Champ label="Chef responsable"><Input value={p.chef} onChange={(v: string) => updPlat(i, 'chef', v)} /></Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    <Champ label="Catégorie"><Input value={p.categorie} onChange={(v: string) => updPlat(i, 'categorie', v)} /></Champ>
                    <Champ label="Temps"><Input value={p.temps} onChange={(v: string) => updPlat(i, 'temps', v)} placeholder="45 min" /></Champ>
                    <Champ label="Difficulté (1-5)">
                      <select value={p.difficulte} onChange={e => updPlat(i, 'difficulte', parseInt(e.target.value))} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                      </select>
                    </Champ>
                  </div>
                </div>
              ))}
              <button onClick={addPlat} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un plat
              </button>
            </>
          )}

          {onglet === 'cours' && (
            <>
              {cours.map((c, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{c.titre}</span>
                    <button onClick={() => delCours(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Titre"><Input value={c.titre} onChange={(v: string) => updCours(i, 'titre', v)} /></Champ>
                  <Champ label="Description"><Textarea value={c.description} onChange={(v: string) => updCours(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Photo (URL)"><Input value={c.photo} onChange={(v: string) => updCours(i, 'photo', v)} /></Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    <Champ label="Durée"><Input value={c.duree} onChange={(v: string) => updCours(i, 'duree', v)} placeholder="4h / séance" /></Champ>
                    <Champ label="Prix"><Input value={c.prix} onChange={(v: string) => updCours(i, 'prix', v)} placeholder="120$" /></Champ>
                    <Champ label="Places max"><Input value={String(c.places)} onChange={(v: string) => updCours(i, 'places', parseInt(v) || 8)} placeholder="8" /></Champ>
                  </div>
                  <Champ label="Niveau">
                    <select value={c.niveau} onChange={e => updCours(i, 'niveau', e.target.value as any)} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </Champ>
                  <Champ label="Thèmes (séparés par virgules)">
                    <Input value={c.themes?.join(', ') || ''} onChange={(v: string) => updCours(i, 'themes', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Couteaux, Sauces, ..." />
                  </Champ>
                  <Champ label="Ce qui est inclus (séparés par virgules)">
                    <Input value={c.inclus?.join(', ') || ''} onChange={(v: string) => updCours(i, 'inclus', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Tablier, Livret de recettes, ..." />
                  </Champ>
                </div>
              ))}
              <button onClick={addCours} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un atelier
              </button>
            </>
          )}

          {onglet === 'chefs' && (
            <>
              {chefs.map((chef, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Chef {chef.nom}</span>
                    <button onClick={() => delChef(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={chef.nom} onChange={(v: string) => updChef(i, 'nom', v)} /></Champ>
                  <Champ label="Titre"><Input value={chef.titre} onChange={(v: string) => updChef(i, 'titre', v)} /></Champ>
                  <Champ label="Spécialité"><Input value={chef.specialite} onChange={(v: string) => updChef(i, 'specialite', v)} /></Champ>
                  <Champ label="Plat signature"><Input value={chef.signature} onChange={(v: string) => updChef(i, 'signature', v)} /></Champ>
                  <Champ label="Années d'expérience"><Input value={String(chef.annees)} onChange={(v: string) => updChef(i, 'annees', parseInt(v) || 1)} /></Champ>
                  <Champ label="Étoiles Michelin (optionnel — 1 ou 2)">
                    <select value={chef.etoiles || 0} onChange={e => updChef(i, 'etoiles', parseInt(e.target.value) || undefined)} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      <option value={0}>Aucune</option>
                      <option value={1}>1 étoile ⭐</option>
                      <option value={2}>2 étoiles ⭐⭐</option>
                      <option value={3}>3 étoiles ⭐⭐⭐</option>
                    </select>
                  </Champ>
                  <Champ label="Bio"><Textarea value={chef.bio} onChange={(v: string) => updChef(i, 'bio', v)} rows={3} /></Champ>
                  <Champ label="Photo (URL)"><Input value={chef.photo} onChange={(v: string) => updChef(i, 'photo', v)} /></Champ>
                </div>
              ))}
              <button onClick={addChef} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un chef
              </button>
            </>
          )}

          {onglet === 'avis' && (
            <>
              {avis.map((a, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Avis {i + 1}</span>
                    <button onClick={() => delAvis(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Texte"><Textarea value={a.texte} onChange={(v: string) => updAvis(i, 'texte', v)} rows={3} /></Champ>
                  <Champ label="Auteur"><Input value={a.auteur} onChange={(v: string) => updAvis(i, 'auteur', v)} /></Champ>
                  <Champ label="Atelier suivi"><Input value={a.cours} onChange={(v: string) => updAvis(i, 'cours', v)} /></Champ>
                  <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v: string) => updAvis(i, 'photo', v)} /></Champ>
                  <Champ label="Note">
                    <select value={a.note} onChange={e => updAvis(i, 'note', parseInt(e.target.value))} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addAvis} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un avis
              </button>
            </>
          )}

          {onglet === 'formules' && (
            <>
              {formules.map((f, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{f.nom}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!f.populaire} onChange={e => updFormule(i, 'populaire', e.target.checked)} />
                        Populaire
                      </label>
                      <button onClick={() => delFormule(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  <Champ label="Nom"><Input value={f.nom} onChange={(v: string) => updFormule(i, 'nom', v)} /></Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <Champ label="Prix"><Input value={f.prix} onChange={(v: string) => updFormule(i, 'prix', v)} /></Champ>
                    <Champ label="Période"><Input value={f.periode} onChange={(v: string) => updFormule(i, 'periode', v)} placeholder="/ mois" /></Champ>
                  </div>
                  <Champ label="Description"><Textarea value={f.description} onChange={(v: string) => updFormule(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Inclus (séparés par virgules)">
                    <Input value={f.inclus?.join(', ') || ''} onChange={(v: string) => updFormule(i, 'inclus', v.split(',').map((s: string) => s.trim()).filter(Boolean))} />
                  </Champ>
                </div>
              ))}
              <button onClick={addFormule} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter une formule
              </button>
            </>
          )}

          {onglet === 'faq' && (
            <>
              {faq.map((f, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Q{i + 1}</span>
                    <button onClick={() => delFaq(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Question"><Input value={f.question} onChange={(v: string) => updFaq(i, 'question', v)} /></Champ>
                  <Champ label="Réponse"><Textarea value={f.reponse} onChange={(v: string) => updFaq(i, 'reponse', v)} rows={3} /></Champ>
                </div>
              ))}
              <button onClick={addFaq} style={{ width: '100%', padding: 8, border: `2px dashed ${CB}`, borderRadius: 8, background: 'transparent', color: CB, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter une question
              </button>
            </>
          )}

          {onglet === 'contact' && (
            <>
              <Sec titre="Coordonnées">
                <Champ label="Adresse"><Input value={config.adresse} onChange={(v: string) => set('adresse', v)} /></Champ>
                <Champ label="Ville"><Input value={config.ville} onChange={(v: string) => set('ville', v)} /></Champ>
                <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => set('telephone', v)} /></Champ>
                <Champ label="Courriel"><Input value={config.email} onChange={(v: string) => set('email', v)} /></Champ>
              </Sec>
              <Sec titre="Horaires">
                {horaires.map((h, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Mar – Ven : 10h – 21h" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Réseaux sociaux">
                {(['instagram', 'facebook', 'youtube'] as const).map(k => (
                  <Champ key={k} label={k.charAt(0).toUpperCase() + k.slice(1) + ' (URL)'}>
                    <Input value={config.reseaux?.[k] || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, [k]: v })} />
                  </Champ>
                ))}
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame" desc="Google Maps > Partager > Intégrer une carte">
                  <Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={2} />
                </Champ>
              </Sec>
            </>
          )}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resetConfirm ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, flex: 1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_CUISINE_DEFAUT}); setResetConfirm(false); }} style={{ padding: '4px 10px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '4px 8px', borderRadius: 5, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setApercu(!apercu)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1.5px solid #1a0f0a`, background: apercu ? '#1a0f0a' : 'transparent', color: apercu ? '#d4a017' : '#1a0f0a', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
              {apercu ? '✕ Fermer' : '👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde === 'loading'} style={{ flex: 2, padding: '9px 0', borderRadius: 7, border: 'none', background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : '#1a0f0a', color: sauvegarde === 'ok' || sauvegarde === 'err' ? '#fff' : '#d4a017', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
              {sauvegarde === 'loading' ? '⏳...' : sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Zone aperçu */}
      <div style={{ flex: 1, display: apercu ? 'flex' : 'none', flexDirection: 'column', background: '#1a0f0a', overflow: 'hidden' }}>
        <div style={{ background: '#1a1200', borderBottom: '1px solid #f59e0b44', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([['desktop', '🖥️', 'Bureau'], ['tablette', '📲', 'Tablette'], ['mobile', '📱', 'Mobile']] as const).map(([m, ico, label]) => (
            <button key={m} onClick={() => setModeApercu(m)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: modeApercu === m ? '#c0392b33' : 'transparent', color: modeApercu === m ? '#c0392b' : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0f0a', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 56 }}>🍳</div>
          <p style={{ fontSize: 15, color: '#d4a017', fontWeight: 600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize: 12, color: 'rgba(212,160,23,0.4)' }}>Template École de Cuisine — Gratuit</p>
        </div>
      )}
    </div>
  );
}