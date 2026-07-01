// src/pages/studio/ConfigTemplateFormationWeb.tsx
// e-Vend Studio — Configuration du template Formation Web

import { useState, useEffect } from 'react';
import { CONFIG_WEB_DEFAUT } from '../../templates/TemplateFormationWeb';
import type { ConfigFormationWeb, SectionConfig, ModuleCours, FormateurWeb, TemoignageWeb, FormuleWeb, TechLogoItem } from '../../templates/TemplateFormationWeb';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'techno' | 'modules' | 'formateurs' | 'temoignages' | 'formules' | 'faq' | 'contact';

const CC = '#00d4ff'; // cyan

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CC} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CC} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 13 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{desc}</p>}
    {children}
  </div>
);
const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
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
    hero: '🚀', stats: '📊', techno: '⚙️', modules: '📚',
    formateurs: '👨‍💻', temoignages: '💬', formules: '💰', faq: '❓', contact: '✉️',
  };

  return (
    <div>
      <div style={{ background: '#f0faff', border: `1px solid ${CC}50`, borderRadius: 8, padding: 10, fontSize: 11, color: '#00607a', marginBottom: 12 }}>
        <strong>📐 Sections actives</strong> — Toggle + ▲▼ pour réordonner
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: sec.actif ? '#f0faff' : '#fafafa', border: `2px solid ${sec.actif ? CC : '#e5e7eb'}`, borderRadius: 10, padding: '8px 10px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#aaa', marginRight: 6 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 40, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? CC : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
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
  { nom: 'Cyan & Violet (défaut)',    cc: '#00d4ff', cv: '#7c3aed', cf: '#050816', cca: '#0d1224' },
  { nom: 'Vert & Bleu électrique',    cc: '#00ff88', cv: '#0066ff', cf: '#050e12', cca: '#0a1a14' },
  { nom: 'Orange & Rose néon',        cc: '#ff6b35', cv: '#ff2d9b', cf: '#130808', cca: '#1a0d10' },
  { nom: 'Jaune & Violet sombre',     cc: '#ffd700', cv: '#8b00ff', cf: '#0d0a00', cca: '#141008' },
  { nom: 'Blanc & Cyan sombre',       cc: '#e0e0e0', cv: '#00bcd4', cf: '#050816', cca: '#0d1224' },
  { nom: 'Vert lime & Noir',          cc: '#a3e635', cv: '#4ade80', cf: '#050a05', cca: '#0a140a' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigFormationWeb>;
  onSauvegarde?: (config: ConfigFormationWeb) => Promise<void>;
}

export default function ConfigTemplateFormationWeb({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigFormationWeb>({ ...CONFIG_WEB_DEFAUT, ...configInitiale });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop' | 'tablette' | 'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigFormationWeb, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'cours-web' }),
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
  const sections   = ea(config.sections,    CONFIG_WEB_DEFAUT.sections);
  const stats      = ea(config.stats,       CONFIG_WEB_DEFAUT.stats);
  const techs      = ea(config.technologies,CONFIG_WEB_DEFAUT.technologies);
  const modules    = ea(config.modules,     CONFIG_WEB_DEFAUT.modules);
  const formateurs = ea(config.formateurs,  CONFIG_WEB_DEFAUT.formateurs);
  const temos      = ea(config.temoignages, CONFIG_WEB_DEFAUT.temoignages);
  const formules   = ea(config.formules,    CONFIG_WEB_DEFAUT.formules);
  const faq        = ea(config.faq,         CONFIG_WEB_DEFAUT.faq);
  const horaires   = ea(config.horaires,    CONFIG_WEB_DEFAUT.horaires);

  const updStat   = (i: number, k: string, v: string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };
  const updTech   = (i: number, k: string, v: string) => { const a=[...techs]; a[i]={...a[i],[k]:v}; set('technologies',a); };
  const delTech   = (i: number) => { const a=[...techs]; a.splice(i,1); set('technologies',a); };
  const addTech   = () => set('technologies',[...techs,{nom:'Nouveau',icone:'💡'}]);

  const updModule = (i: number, k: keyof ModuleCours, v: any) => { const a=[...modules]; a[i]={...a[i],[k]:v}; set('modules',a); };
  const delModule = (i: number) => { const a=[...modules]; a.splice(i,1); set('modules',a); };
  const addModule = () => set('modules',[...modules,{titre:'Nouveau module',description:'',duree:'4 semaines',niveau:'Débutant' as const,icone:'📚',sujets:[]}]);

  const updForm   = (i: number, k: keyof FormateurWeb, v: any) => { const a=[...formateurs]; a[i]={...a[i],[k]:v}; set('formateurs',a); };
  const delForm   = (i: number) => { const a=[...formateurs]; a.splice(i,1); set('formateurs',a); };
  const addForm   = () => set('formateurs',[...formateurs,{nom:'Nouveau formateur',titre:'Développeur',bio:'',photo:'',competences:[]}]);

  const updTemo   = (i: number, k: keyof TemoignageWeb, v: any) => { const a=[...temos]; a[i]={...a[i],[k]:v}; set('temoignages',a); };
  const delTemo   = (i: number) => { const a=[...temos]; a.splice(i,1); set('temoignages',a); };
  const addTemo   = () => set('temoignages',[...temos,{texte:'',auteur:'',role:'',photo:'',note:5,entreprise:''}]);

  const updFormule= (i: number, k: keyof FormuleWeb, v: any) => { const a=[...formules]; a[i]={...a[i],[k]:v}; set('formules',a); };
  const delFormule= (i: number) => { const a=[...formules]; a.splice(i,1); set('formules',a); };
  const addFormule= () => set('formules',[...formules,{nom:'Nouvelle formule',prix:'0$',periode:'/mois',description:'',inclus:[],populaire:false}]);

  const updFaq    = (i: number, k: string, v: string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq    = (i: number) => { const a=[...faq]; a.splice(i,1); set('faq',a); };
  const addFaq    = () => set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);

  const updHoraire= (i: number, v: string) => { const h=[...horaires]; h[i]=v; set('horaires',h); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',    label: 'Identité',    emoji: '🏷️' },
    { id: 'apparence',   label: 'Apparence',   emoji: '🎨' },
    { id: 'sections',    label: 'Sections',    emoji: '📐' },
    { id: 'stats',       label: 'Stats',       emoji: '📊' },
    { id: 'techno',      label: 'Tech',        emoji: '⚙️' },
    { id: 'modules',     label: 'Modules',     emoji: '📚' },
    { id: 'formateurs',  label: 'Formateurs',  emoji: '👨‍💻' },
    { id: 'temoignages', label: 'Avis',        emoji: '💬' },
    { id: 'formules',    label: 'Tarifs',      emoji: '💰' },
    { id: 'faq',         label: 'FAQ',         emoji: '❓' },
    { id: 'contact',     label: 'Contact',     emoji: '✉️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* ── Panneau ── */}
      <div style={{ width: 360, minWidth: 320, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #050816, #00d4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚙️</div>
            <div>
              <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Formation Web</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingBottom: 10 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '3px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, background: onglet === o.id ? '#050816' : '#f3f4f6', color: onglet === o.id ? CC : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

          {onglet === 'identite' && (
            <>
              <Sec titre="École">
                <Champ label="Nom de l'école"><Input value={config.nomEcole} onChange={(v: string) => set('nomEcole', v)} placeholder="CodeLaunch" /></Champ>
                <Champ label="Tagline (1re ligne)"><Input value={config.tagline} onChange={(v: string) => set('tagline', v)} placeholder="Lancez votre" /></Champ>
                <Champ label="Tagline (2e ligne — dégradé)"><Input value={config.sousTagline} onChange={(v: string) => set('sousTagline', v)} placeholder="carrière en tech." /></Champ>
                <Champ label="Description courte (hero)"><Textarea value={config.descriptionCourte} onChange={(v: string) => set('descriptionCourte', v)} rows={3} /></Champ>
                <Champ label="Description longue"><Textarea value={config.descriptionLongue} onChange={(v: string) => set('descriptionLongue', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}

          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurCyan: p.cc, couleurViolet: p.cv, couleurFond: p.cf, couleurCarte: p.cca }))}
                      style={{ padding: '8px', borderRadius: 7, cursor: 'pointer', fontSize: 9, fontWeight: 600, border: `2px solid ${config.couleurCyan === p.cc && config.couleurFond === p.cf ? p.cc : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(255,255,255,0.15)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cc }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cv }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cca }} />
                      </div>
                      <span style={{ color: p.cc, fontSize: 8 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([
                  ['couleurFond', 'Fond principal'],
                  ['couleurCarte', 'Fond cartes'],
                  ['couleurCyan', 'Accent cyan (principal)'],
                  ['couleurViolet', 'Accent violet (secondaire)'],
                ] as [keyof ConfigFormationWeb, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 36, height: 30, padding: 2, border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer' }} />
                      <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                    </div>
                  </Champ>
                ))}
              </Sec>
              <div style={{ borderRadius: 8, overflow: 'hidden', height: 36, display: 'flex' }}>
                <div style={{ flex: 2, background: config.couleurFond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurCyan, fontSize: 9, fontWeight: 700 }}>FOND</span></div>
                <div style={{ flex: 1.5, background: config.couleurCarte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurCyan, fontSize: 9, fontWeight: 700 }}>CARTE</span></div>
                <div style={{ flex: 1, background: config.couleurCyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#000', fontSize: 9, fontWeight: 700 }}>CYAN</span></div>
                <div style={{ flex: 1, background: config.couleurViolet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>VIOLET</span></div>
              </div>
            </>
          )}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={s => set('sections', s)} />}

          {onglet === 'stats' && (
            <Sec titre="4 statistiques clés">
              {stats.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <Champ label={`Stat ${i + 1} — Icône`}><Input value={s.icone} onChange={(v: string) => updStat(i, 'icone', v)} placeholder="🎓" /></Champ>
                  <Champ label="Valeur (ex: 2400+)"><Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="2400+" /></Champ>
                  <Champ label="Libellé"><Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Diplômés" /></Champ>
                </div>
              ))}
            </Sec>
          )}

          {onglet === 'techno' && (
            <>
              <div style={{ background: '#f0faff', border: `1px solid ${CC}40`, borderRadius: 7, padding: 8, fontSize: 11, color: '#00607a', marginBottom: 10 }}>
                ⚙️ Chaque technologie apparaît dans une carte avec icône emoji et hover glow.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {techs.map((t, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{t.nom}</span>
                      <button onClick={() => delTech(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                    <Input value={t.icone} onChange={(v: string) => updTech(i, 'icone', v)} placeholder="⚡" />
                    <div style={{ marginTop: 4 }}>
                      <Input value={t.nom} onChange={(v: string) => updTech(i, 'nom', v)} placeholder="JavaScript" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addTech} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter une technologie
              </button>
            </>
          )}

          {onglet === 'modules' && (
            <>
              {modules.map((m, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{m.icone} {m.titre}</span>
                    <button onClick={() => delModule(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Icône"><Input value={m.icone} onChange={(v: string) => updModule(i, 'icone', v)} placeholder="📚" /></Champ>
                  <Champ label="Titre"><Input value={m.titre} onChange={(v: string) => updModule(i, 'titre', v)} /></Champ>
                  <Champ label="Durée"><Input value={m.duree} onChange={(v: string) => updModule(i, 'duree', v)} placeholder="4 semaines" /></Champ>
                  <Champ label="Niveau">
                    <select value={m.niveau} onChange={e => updModule(i, 'niveau', e.target.value as any)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, background: '#fff' }}>
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </Champ>
                  <Champ label="Description"><Textarea value={m.description} onChange={(v: string) => updModule(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Sujets (séparés par virgules)">
                    <Input value={m.sujets?.join(', ') || ''} onChange={(v: string) => updModule(i, 'sujets', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="HTML5, CSS3, JavaScript" />
                  </Champ>
                </div>
              ))}
              <button onClick={addModule} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un module
              </button>
            </>
          )}

          {onglet === 'formateurs' && (
            <>
              {formateurs.map((f, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{f.nom}</span>
                    <button onClick={() => delForm(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={f.nom} onChange={(v: string) => updForm(i, 'nom', v)} /></Champ>
                  <Champ label="Titre / Rôle"><Input value={f.titre} onChange={(v: string) => updForm(i, 'titre', v)} /></Champ>
                  <Champ label="Bio"><Textarea value={f.bio} onChange={(v: string) => updForm(i, 'bio', v)} rows={2} /></Champ>
                  <Champ label="Photo (URL)"><Input value={f.photo} onChange={(v: string) => updForm(i, 'photo', v)} /></Champ>
                  <Champ label="Compétences (séparées par virgules)">
                    <Input value={f.competences?.join(', ') || ''} onChange={(v: string) => updForm(i, 'competences', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="React, TypeScript, Node.js" />
                  </Champ>
                </div>
              ))}
              <button onClick={addForm} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un formateur
              </button>
            </>
          )}

          {onglet === 'temoignages' && (
            <>
              {temos.map((t, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Avis {i + 1}</span>
                    <button onClick={() => delTemo(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Texte"><Textarea value={t.texte} onChange={(v: string) => updTemo(i, 'texte', v)} rows={3} /></Champ>
                  <Champ label="Auteur"><Input value={t.auteur} onChange={(v: string) => updTemo(i, 'auteur', v)} /></Champ>
                  <Champ label="Rôle / Poste"><Input value={t.role} onChange={(v: string) => updTemo(i, 'role', v)} /></Champ>
                  <Champ label="Entreprise (optionnel)"><Input value={t.entreprise || ''} onChange={(v: string) => updTemo(i, 'entreprise', v)} /></Champ>
                  <Champ label="Photo (URL)"><Input value={t.photo} onChange={(v: string) => updTemo(i, 'photo', v)} /></Champ>
                  <Champ label="Note">
                    <select value={t.note} onChange={e => updTemo(i, 'note', parseInt(e.target.value))} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, background: '#fff' }}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addTemo} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un témoignage
              </button>
            </>
          )}

          {onglet === 'formules' && (
            <>
              {formules.map((f, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{f.nom}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!f.populaire} onChange={e => updFormule(i, 'populaire', e.target.checked)} />
                        Populaire
                      </label>
                      <button onClick={() => delFormule(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  <Champ label="Nom"><Input value={f.nom} onChange={(v: string) => updFormule(i, 'nom', v)} /></Champ>
                  <Champ label="Prix (ex: 199$)"><Input value={f.prix} onChange={(v: string) => updFormule(i, 'prix', v)} /></Champ>
                  <Champ label="Période (ex: / mois)"><Input value={f.periode} onChange={(v: string) => updFormule(i, 'periode', v)} /></Champ>
                  <Champ label="Description"><Textarea value={f.description} onChange={(v: string) => updFormule(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Inclus (séparés par virgules)">
                    <Input value={f.inclus?.join(', ') || ''} onChange={(v: string) => updFormule(i, 'inclus', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Module 1, Mentorat, Certificat" />
                  </Champ>
                </div>
              ))}
              <button onClick={addFormule} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
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
              <button onClick={addFaq} style={{ width: '100%', padding: 8, border: `2px dashed ${CC}`, borderRadius: 8, background: 'transparent', color: CC, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
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
              <Sec titre="Horaires de support">
                {horaires.map((h, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 9h – 18h" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Réseaux">
                {(['github', 'discord', 'linkedin', 'twitter'] as const).map(k => (
                  <Champ key={k} label={k.charAt(0).toUpperCase() + k.slice(1) + ' (URL)'}>
                    <Input value={config.reseaux?.[k] || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, [k]: v })} placeholder={`https://${k}.com/...`} />
                  </Champ>
                ))}
              </Sec>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_WEB_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid #050816`, background:apercu?'#050816':'transparent', color:apercu?CC:'#050816', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':'#050816', color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':CC, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#050816', overflow:'hidden' }}>
        <div style={{ background:'#0d1224', borderBottom:'1px solid #00d4ff44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#00d4ff', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CC}33`:'transparent', color:modeApercu===m?CC:'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#050816', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>⚙️</div>
          <p style={{ fontSize:15, color:CC, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CC}50` }}>Template Formation Web — Gratuit</p>
        </div>
      )}
    </div>
  );
}