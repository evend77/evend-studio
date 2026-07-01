// src/pages/studio/ConfigTemplateStudioYoga.tsx
// e-Vend Studio — Configuration du template Studio Yoga & Pilates

import { useState, useEffect } from 'react';
import TemplateStudioYoga, { CONFIG_YOGA_DEFAUT } from '../../templates/TemplateStudioYoga';
import type { ConfigStudioYoga, SectionConfig, CoursYoga, ProfesseurYoga, AvisYoga, FormulaireAbonnement } from '../../templates/TemplateStudioYoga';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'cours' | 'professeurs' | 'avis' | 'abonnements' | 'horaires' | 'faq' | 'contact';

const CT = '#c17f5a';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CT} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CT} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
    hero: '🧘', respiration: '💨', stats: '📊', cours: '🌿', lotus: '🪷',
    apropos: '📖', professeurs: '⭐', avis: '💬', abonnements: '💰', horaires: '📅', faq: '❓', contact: '✉️',
  };

  return (
    <div>
      <div style={{ background: '#fdf5f0', border: `1px solid ${CT}50`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a3a1a', marginBottom: 12 }}>
        <strong>📐 Sections</strong> — Toggle ON/OFF + ▲▼ pour réordonner
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: sec.actif ? '#fdf8f5' : '#fafafa', border: `2px solid ${sec.actif ? CT : '#e5e7eb'}`, borderRadius: 9, padding: '7px 10px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', marginRight: 4 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 38, height: 19, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? CT : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 1.5, left: sec.actif ? 19 : 1.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 19, height: 15, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 8, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 19, height: 15, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 8, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
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
  { nom: 'Terracotta & Sauge (défaut)',  ct: '#c17f5a', cs: '#6b8f71', cf: '#faf9f6', cc: '#f0ebe0', cfs: '#1c1f1a' },
  { nom: 'Rose & Lavande',               ct: '#c06080', cs: '#8a7caa', cf: '#fdf8fa', cc: '#f5eff5', cfs: '#1a1520' },
  { nom: 'Sable & Bleu Ciel',            ct: '#b8860b', cs: '#5b8fa8', cf: '#fafaf7', cc: '#f0ece0', cfs: '#0f1418' },
  { nom: 'Menthe & Champagne',           ct: '#5a9070', cs: '#c8a86e', cf: '#f8faf8', cc: '#eef5ee', cfs: '#101810' },
  { nom: 'Prune & Or',                   ct: '#6b3a6b', cs: '#c8a030', cf: '#faf8fc', cc: '#f0ebf5', cfs: '#150a15' },
  { nom: 'Brun & Vert Forêt',            ct: '#8b5e3c', cs: '#3d6b50', cf: '#faf8f5', cc: '#f0e8e0', cfs: '#0a100c' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigStudioYoga>;
  onSauvegarde?: (config: ConfigStudioYoga) => Promise<void>;
}

export default function ConfigTemplateStudioYoga({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigStudioYoga>({ ...CONFIG_YOGA_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigStudioYoga, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'cours-yoga' }),
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
  const sections     = ea(config.sections,      CONFIG_YOGA_DEFAUT.sections);
  const stats        = ea(config.stats,          CONFIG_YOGA_DEFAUT.stats);
  const cours        = ea(config.cours,          CONFIG_YOGA_DEFAUT.cours);
  const professeurs  = ea(config.professeurs,    CONFIG_YOGA_DEFAUT.professeurs);
  const avis         = ea(config.avis,           CONFIG_YOGA_DEFAUT.avis);
  const abonnements  = ea(config.abonnements,    CONFIG_YOGA_DEFAUT.abonnements);
  const horairesS    = ea(config.horairesStudio, CONFIG_YOGA_DEFAUT.horairesStudio);
  const faq          = ea(config.faq,            CONFIG_YOGA_DEFAUT.faq);

  const updStat   = (i: number, k: string, v: string) => { const a=[...stats]; a[i]={...a[i],[k]:v}; set('stats',a); };
  const updCours  = (i: number, k: keyof CoursYoga, v: any) => { const a=[...cours]; a[i]={...a[i],[k]:v}; set('cours',a); };
  const delCours  = (i: number) => { const a=[...cours]; a.splice(i,1); set('cours',a); };
  const addCours  = () => set('cours',[...cours,{titre:'Nouveau cours',description:'',photo:'',style:'Hatha',niveau:'Tous niveaux' as const,duree:'60 min',prix:'22$',horaires:[],bienfaits:[]}]);
  const updProf   = (i: number, k: keyof ProfesseurYoga, v: any) => { const a=[...professeurs]; a[i]={...a[i],[k]:v}; set('professeurs',a); };
  const delProf   = (i: number) => { const a=[...professeurs]; a.splice(i,1); set('professeurs',a); };
  const addProf   = () => set('professeurs',[...professeurs,{nom:'Nouveau professeur',titre:'',specialite:'',bio:'',photo:'',certifications:[],annees:5,citation:''}]);
  const updAvis   = (i: number, k: keyof AvisYoga, v: any) => { const a=[...avis]; a[i]={...a[i],[k]:v}; set('avis',a); };
  const delAvis   = (i: number) => { const a=[...avis]; a.splice(i,1); set('avis',a); };
  const addAvis   = () => set('avis',[...avis,{texte:'',auteur:'',cours:'',photo:'',note:5,depuis:''}]);
  const updAbonn  = (i: number, k: keyof FormulaireAbonnement, v: any) => { const a=[...abonnements]; a[i]={...a[i],[k]:v}; set('abonnements',a); };
  const delAbonn  = (i: number) => { const a=[...abonnements]; a.splice(i,1); set('abonnements',a); };
  const addAbonn  = () => set('abonnements',[...abonnements,{nom:'Nouvelle formule',prix:'0$',periode:'/mois',description:'',inclus:[],populaire:false}]);
  const updHoraire= (i: number, k: string, v: any) => { const a=[...horairesS]; a[i]={...a[i],[k]:v}; set('horairesStudio',a); };
  const updFaq    = (i: number, k: string, v: string) => { const a=[...faq]; a[i]={...a[i],[k]:v}; set('faq',a); };
  const delFaq    = (i: number) => { const a=[...faq]; a.splice(i,1); set('faq',a); };
  const addFaq    = () => set('faq',[...faq,{question:'Nouvelle question?',reponse:''}]);

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',     label: 'Identité',     emoji: '🏷️' },
    { id: 'apparence',    label: 'Couleurs',     emoji: '🎨' },
    { id: 'sections',     label: 'Sections',     emoji: '📐' },
    { id: 'stats',        label: 'Stats',        emoji: '📊' },
    { id: 'cours',        label: 'Cours',        emoji: '🌿' },
    { id: 'professeurs',  label: 'Profs',        emoji: '⭐' },
    { id: 'avis',         label: 'Avis',         emoji: '💬' },
    { id: 'abonnements',  label: 'Abonnements',  emoji: '💰' },
    { id: 'horaires',     label: 'Horaires',     emoji: '📅' },
    { id: 'faq',          label: 'FAQ',          emoji: '❓' },
    { id: 'contact',      label: 'Contact',      emoji: '✉️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      <div style={{ width: 360, minWidth: 320, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '13px 13px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, #1c1f1a, ${CT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧘</div>
            <div>
              <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Studio Yoga & Pilates</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingBottom: 10 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '3px 6px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, background: onglet === o.id ? '#1c1f1a' : '#f3f4f6', color: onglet === o.id ? CT : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 13 }}>

          {onglet === 'identite' && (
            <>
              <Sec titre="Identité">
                <Champ label="Nom du studio"><Input value={config.nomStudio} onChange={(v: string) => set('nomStudio', v)} /></Champ>
                <Champ label="Tagline (1re ligne)"><Input value={config.tagline} onChange={(v: string) => set('tagline', v)} placeholder="Respirez." /></Champ>
                <Champ label="Tagline (2e ligne — italique)"><Input value={config.sousTagline} onChange={(v: string) => set('sousTagline', v)} placeholder="Transformez-vous." /></Champ>
                <Champ label="Citation philosophique"><Textarea value={config.citationPhilosophie} onChange={(v: string) => set('citationPhilosophie', v)} rows={2} /></Champ>
                <Champ label="Auteur de la citation"><Input value={config.auteurCitation} onChange={(v: string) => set('auteurCitation', v)} placeholder="Patanjali" /></Champ>
                <Champ label="Description hero"><Textarea value={config.descriptionHero} onChange={(v: string) => set('descriptionHero', v)} rows={3} /></Champ>
                <Champ label="Description À propos"><Textarea value={config.descriptionAPropos} onChange={(v: string) => set('descriptionAPropos', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Photos">
                <Champ label="Photo Hero (fond plein écran)"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo À propos 1 (panoramique)"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} /></Champ>
                <Champ label="Photo À propos 2"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} /></Champ>
                <Champ label="Photo Atmosphère (avec lotus)"><Input value={config.photoAtmosphere} onChange={(v: string) => set('photoAtmosphere', v)} /></Champ>
              </Sec>
            </>
          )}

          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurTerre: p.ct, couleurSauge: p.cs, couleurFond: p.cf, couleurCreme: p.cc, couleurFondSombre: p.cfs }))}
                      style={{ padding: '8px', borderRadius: 7, cursor: 'pointer', fontSize: 9, fontWeight: 600, border: `2px solid ${config.couleurTerre === p.ct && config.couleurFond === p.cf ? p.ct : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.ct }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cs }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfs }} />
                      </div>
                      <span style={{ color: p.ct, fontSize: 8 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([
                  ['couleurFond', 'Fond clair (ivoire)'],
                  ['couleurCreme', 'Fond crème (sections alt.)'],
                  ['couleurTerre', 'Accent terracotta'],
                  ['couleurSauge', 'Accent vert sauge'],
                  ['couleurFondSombre', 'Fond sombre (hero, lotus)'],
                ] as [keyof ConfigStudioYoga, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 34, height: 30, padding: 2, border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer' }} />
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
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 9, marginBottom: 9 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 6 }}>
                    <Champ label="Icône"><Input value={s.icone} onChange={(v: string) => updStat(i, 'icone', v)} placeholder="🧘" /></Champ>
                    <Champ label="Valeur"><Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="850+" /></Champ>
                    <Champ label="Libellé"><Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Membres" /></Champ>
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {onglet === 'cours' && (
            <>
              <div style={{ background: '#fdf8f5', border: `1px solid ${CT}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a3a1a', marginBottom: 10 }}>
                🌿 Les cours sont filtrables par style (Hatha, Vinyasa, Pilates, Yin...).
              </div>
              {cours.map((c, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{c.titre}</span>
                    <button onClick={() => delCours(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Titre"><Input value={c.titre} onChange={(v: string) => updCours(i, 'titre', v)} /></Champ>
                  <Champ label="Style" desc="Utilisé comme filtre"><Input value={c.style} onChange={(v: string) => updCours(i, 'style', v)} placeholder="Hatha, Vinyasa, Pilates, Yin..." /></Champ>
                  <Champ label="Niveau">
                    <select value={c.niveau} onChange={e => updCours(i, 'niveau', e.target.value as any)} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      <option value="Tous niveaux">Tous niveaux</option>
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <Champ label="Durée"><Input value={c.duree} onChange={(v: string) => updCours(i, 'duree', v)} placeholder="60 min" /></Champ>
                    <Champ label="Prix"><Input value={c.prix} onChange={(v: string) => updCours(i, 'prix', v)} placeholder="22$" /></Champ>
                  </div>
                  <Champ label="Description"><Textarea value={c.description} onChange={(v: string) => updCours(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Photo (URL)"><Input value={c.photo} onChange={(v: string) => updCours(i, 'photo', v)} /></Champ>
                  <Champ label="Bienfaits (séparés par virgules)">
                    <Input value={c.bienfaits?.join(', ') || ''} onChange={(v: string) => updCours(i, 'bienfaits', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Flexibilité, Stress, Énergie" />
                  </Champ>
                  <Champ label="Horaires (séparés par virgules)">
                    <Input value={c.horaires?.join(', ') || ''} onChange={(v: string) => updCours(i, 'horaires', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Lun 8h00, Mer 12h00, Sam 9h00" />
                  </Champ>
                </div>
              ))}
              <button onClick={addCours} style={{ width: '100%', padding: 8, border: `2px dashed ${CT}`, borderRadius: 8, background: 'transparent', color: CT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un cours
              </button>
            </>
          )}

          {onglet === 'professeurs' && (
            <>
              {professeurs.map((p, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{p.nom}</span>
                    <button onClick={() => delProf(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={p.nom} onChange={(v: string) => updProf(i, 'nom', v)} /></Champ>
                  <Champ label="Titre"><Input value={p.titre} onChange={(v: string) => updProf(i, 'titre', v)} /></Champ>
                  <Champ label="Spécialité (écriture script)"><Input value={p.specialite} onChange={(v: string) => updProf(i, 'specialite', v)} /></Champ>
                  <Champ label="Années d'expérience"><Input value={String(p.annees)} onChange={(v: string) => updProf(i, 'annees', parseInt(v) || 1)} /></Champ>
                  <Champ label="Citation personnelle"><Input value={p.citation} onChange={(v: string) => updProf(i, 'citation', v)} /></Champ>
                  <Champ label="Bio"><Textarea value={p.bio} onChange={(v: string) => updProf(i, 'bio', v)} rows={3} /></Champ>
                  <Champ label="Photo (URL)"><Input value={p.photo} onChange={(v: string) => updProf(i, 'photo', v)} /></Champ>
                  <Champ label="Certifications (séparées par virgules)">
                    <Input value={p.certifications?.join(', ') || ''} onChange={(v: string) => updProf(i, 'certifications', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="RYT-500, MBSR, Yin Yoga" />
                  </Champ>
                </div>
              ))}
              <button onClick={addProf} style={{ width: '100%', padding: 8, border: `2px dashed ${CT}`, borderRadius: 8, background: 'transparent', color: CT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un professeur
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
                  <Champ label="Cours suivi"><Input value={a.cours} onChange={(v: string) => updAvis(i, 'cours', v)} /></Champ>
                  <Champ label="Depuis (ex: Membre depuis 2 ans)"><Input value={a.depuis} onChange={(v: string) => updAvis(i, 'depuis', v)} /></Champ>
                  <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v: string) => updAvis(i, 'photo', v)} /></Champ>
                  <Champ label="Note">
                    <select value={a.note} onChange={e => updAvis(i, 'note', parseInt(e.target.value))} style={{ width: '100%', padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 12, background: '#fff' }}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addAvis} style={{ width: '100%', padding: 8, border: `2px dashed ${CT}`, borderRadius: 8, background: 'transparent', color: CT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un avis
              </button>
            </>
          )}

          {onglet === 'abonnements' && (
            <>
              {abonnements.map((a, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{a.nom}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!a.populaire} onChange={e => updAbonn(i, 'populaire', e.target.checked)} />Populaire
                      </label>
                      <button onClick={() => delAbonn(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  <Champ label="Nom"><Input value={a.nom} onChange={(v: string) => updAbonn(i, 'nom', v)} /></Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <Champ label="Prix"><Input value={a.prix} onChange={(v: string) => updAbonn(i, 'prix', v)} placeholder="89$" /></Champ>
                    <Champ label="Période"><Input value={a.periode} onChange={(v: string) => updAbonn(i, 'periode', v)} placeholder="/ mois" /></Champ>
                  </div>
                  <Champ label="Description"><Textarea value={a.description} onChange={(v: string) => updAbonn(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Inclus (séparés par virgules)">
                    <Input value={a.inclus?.join(', ') || ''} onChange={(v: string) => updAbonn(i, 'inclus', v.split(',').map((s: string) => s.trim()).filter(Boolean))} />
                  </Champ>
                </div>
              ))}
              <button onClick={addAbonn} style={{ width: '100%', padding: 8, border: `2px dashed ${CT}`, borderRadius: 8, background: 'transparent', color: CT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                + Ajouter un abonnement
              </button>
            </>
          )}

          {onglet === 'horaires' && (
            <Sec titre="Horaires par jour">
              <div style={{ background: '#fdf8f5', border: `1px solid ${CT}40`, borderRadius: 7, padding: 9, fontSize: 11, color: '#7a3a1a', marginBottom: 12 }}>
                📅 Format horaire : "8h00 Hatha" — l'heure et le nom du cours séparés par un espace.
              </div>
              {horairesS.map((h, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 10, marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: CT, marginBottom: 8 }}>{h.jour}</p>
                  <Champ label="Cours (séparés par virgules)" desc='Ex: "8h00 Hatha, 12h00 Vinyasa, 18h30 Yin"'>
                    <Input value={h.horaires?.join(', ') || ''} onChange={(v: string) => updHoraire(i, 'horaires', v.split(',').map((s: string) => s.trim()).filter(Boolean))} />
                  </Champ>
                </div>
              ))}
            </Sec>
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
              <button onClick={addFaq} style={{ width: '100%', padding: 8, border: `2px dashed ${CT}`, borderRadius: 8, background: 'transparent', color: CT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
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
              <Sec titre="Réseaux sociaux">
                {(['instagram', 'facebook', 'youtube'] as const).map(k => (
                  <Champ key={k} label={k.charAt(0).toUpperCase() + k.slice(1) + ' (URL)'}>
                    <Input value={config.reseaux?.[k] || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, [k]: v })} />
                  </Champ>
                ))}
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={2} /></Champ>
              </Sec>
            </>
          )}
        </div>

        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_YOGA_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'1.5px solid #1c1f1a', background:apercu?'#1c1f1a':'transparent', color:apercu?CT:'#1c1f1a', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':'#1c1f1a', color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':CT, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#1c1f1a', overflow:'hidden' }}>
        <div style={{ background:'#2a2e28', borderBottom:`1px solid ${CT}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CT, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CT}33`:'transparent', color:modeApercu===m?CT:'#666', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1c1f1a', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🧘</div>
          <p style={{ fontSize:15, color:CT, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CT}50` }}>Template Studio Yoga & Pilates — Gratuit</p>
        </div>
      )}
    </div>
  );
}