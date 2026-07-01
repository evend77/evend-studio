// src/pages/studio/ConfigTemplateLangues.tsx
// e-Vend Studio — Configuration du template Cours de Langues

import { useState, useEffect } from 'react';
import { CONFIG_LANGUES_DEFAUT } from '../../templates/TemplateLangues';
import type { ConfigLangues, SectionConfig, Langue, Professeur, Formule, PourquoiItem, Evenement, Article, FAQItem } from '../../templates/TemplateLangues';

type Onglet = 'identite' | 'apparence' | 'sections' | 'langues' | 'formules' | 'professeurs' | 'pourquoi' | 'evenements' | 'blog' | 'faq' | 'contact';

const P = '#4F46E5'; // Violet primaire
const S = '#F97316'; // Orange secondaire

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = P} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = P} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>{desc}</p>}
    {children}
  </div>
);

const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 22 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

// ─── GESTIONNAIRE DE SECTIONS ────────────────────────────────────────────────

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
  const icones: Record<string, string> = { hero: '🎬', langues: '🌍', formules: '💰', professeurs: '👩‍🏫', pourquoi: '💡', evenements: '📅', blog: '📝', faq: '❓', newsletter: '📧', contact: '📍' };

  return (
    <div>
      <div style={{ background: '#f0f4ff', border: `1px solid ${P}40`, borderRadius: 8, padding: 10, fontSize: 12, color: '#4F46E5', marginBottom: 14 }}>
        <strong>📐 Sections du site</strong><br />Activez/désactivez chaque section et réordonnez-les avec les flèches ▲▼.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: sec.actif ? '#f0f4ff' : '#fafafa', border: `2px solid ${sec.actif ? P : '#e5e7eb'}`, borderRadius: 10, padding: '9px 11px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: sec.actif ? P : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 2, left: sec.actif ? 21 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 22, height: 18, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 9, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 22, height: 18, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 9, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '7px 11px', background: '#f5f5f5', borderRadius: 7, fontSize: 12, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length}
      </div>
    </div>
  );
}

// ─── PALETTES DE COULEURS ────────────────────────────────────────────────────

const PALETTES = [
  { nom: 'Violet & Orange (défaut)', p: '#4F46E5', s: '#F97316', fond: '#FAFAFA' },
  { nom: 'Océan & Corail', p: '#0EA5E9', s: '#FF6B6B', fond: '#F8FAFC' },
  { nom: 'Forêt & Or', p: '#10B981', s: '#F59E0B', fond: '#FEFCE8' },
  { nom: 'Sakura (Rose & Lavande)', p: '#EC4899', s: '#A855F7', fond: '#FFF5F6' },
  { nom: 'Nuit & Argent', p: '#1E293B', s: '#94A3B8', fond: '#F1F5F9' },
  { nom: 'Bordeaux & Champagne', p: '#991B1B', s: '#D4A574', fond: '#FFF8F0' },
];

// ─── COMPOSANT PRINCIPAL DE CONFIGURATION ────────────────────────────────────

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigLangues>;
  onSauvegarde?: (config: ConfigLangues) => Promise<void>;
}

export default function ConfigTemplateLangues({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigLangues>({ ...CONFIG_LANGUES_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigLangues, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'langues' }),
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

  // ─── Gestion Langues ───────────────────────────────────────────────────────
  const langues = ea(config.langues, CONFIG_LANGUES_DEFAUT.langues);
  const updLangue = (i: number, k: keyof Langue, v: any) => { const arr = [...langues]; arr[i] = { ...arr[i], [k]: v }; set('langues', arr); };
  const addLangue = () => set('langues', [...langues, { nom: 'Nouvelle langue', icone: '🌍', couleur: '#4F46E5', actif: true }]);
  const delLangue = (i: number) => { const arr = [...langues]; arr.splice(i, 1); set('langues', arr); };

  // ─── Gestion Formules ─────────────────────────────────────────────────────
  const formules = ea(config.formules, CONFIG_LANGUES_DEFAUT.formules);
  const updFormule = (i: number, k: keyof Formule, v: any) => { const arr = [...formules]; arr[i] = { ...arr[i], [k]: v }; set('formules', arr); };
  const addFormule = () => set('formules', [...formules, { titre: 'Nouvelle formule', description: '', prix: '99$', icone: '📚', couleur: '#4F46E5', caracteristiques: ['Caractéristique 1'], actif: true }]);
  const delFormule = (i: number) => { const arr = [...formules]; arr.splice(i, 1); set('formules', arr); };
  const updCaractFormule = (formuleIdx: number, caractIdx: number, v: string) => {
    const arr = [...formules];
    const newCaracts = [...arr[formuleIdx].caracteristiques];
    newCaracts[caractIdx] = v;
    arr[formuleIdx] = { ...arr[formuleIdx], caracteristiques: newCaracts };
    set('formules', arr);
  };
  const addCaractFormule = (formuleIdx: number) => {
    const arr = [...formules];
    arr[formuleIdx] = { ...arr[formuleIdx], caracteristiques: [...arr[formuleIdx].caracteristiques, 'Nouvelle caractéristique'] };
    set('formules', arr);
  };
  const delCaractFormule = (formuleIdx: number, caractIdx: number) => {
    const arr = [...formules];
    const newCaracts = [...arr[formuleIdx].caracteristiques];
    newCaracts.splice(caractIdx, 1);
    arr[formuleIdx] = { ...arr[formuleIdx], caracteristiques: newCaracts };
    set('formules', arr);
  };

  // ─── Gestion Professeurs ───────────────────────────────────────────────────
  const professeurs = ea(config.professeurs, CONFIG_LANGUES_DEFAUT.professeurs);
  const updProfesseur = (i: number, k: keyof Professeur, v: any) => { const arr = [...professeurs]; arr[i] = { ...arr[i], [k]: v }; set('professeurs', arr); };
  const addProfesseur = () => set('professeurs', [...professeurs, { nom: 'Nom', prenom: 'Prénom', langue: 'Français', bio: '', photo: '', diplome: '', actif: true }]);
  const delProfesseur = (i: number) => { const arr = [...professeurs]; arr.splice(i, 1); set('professeurs', arr); };

  // ─── Gestion Pourquoi Items ────────────────────────────────────────────────
  const pourquoiItems = ea(config.pourquoiItems, CONFIG_LANGUES_DEFAUT.pourquoiItems);
  const updPourquoi = (i: number, k: keyof PourquoiItem, v: any) => { const arr = [...pourquoiItems]; arr[i] = { ...arr[i], [k]: v }; set('pourquoiItems', arr); };
  const addPourquoi = () => set('pourquoiItems', [...pourquoiItems, { titre: 'Nouvel atout', description: '', icone: '✨', couleur: '#4F46E5', actif: true }]);
  const delPourquoi = (i: number) => { const arr = [...pourquoiItems]; arr.splice(i, 1); set('pourquoiItems', arr); };

  // ─── Gestion Événements ────────────────────────────────────────────────────
  const evenements = ea(config.evenements, CONFIG_LANGUES_DEFAUT.evenements);
  const updEvenement = (i: number, k: keyof Evenement, v: any) => { const arr = [...evenements]; arr[i] = { ...arr[i], [k]: v }; set('evenements', arr); };
  const addEvenement = () => set('evenements', [...evenements, { titre: 'Nouvel événement', date: new Date().toISOString(), langue: 'Français', type: 'webinaire', lienRSVP: '#', actif: true }]);
  const delEvenement = (i: number) => { const arr = [...evenements]; arr.splice(i, 1); set('evenements', arr); };

  // ─── Gestion Articles ──────────────────────────────────────────────────────
  const articles = ea(config.articles, CONFIG_LANGUES_DEFAUT.articles);
  const updArticle = (i: number, k: keyof Article, v: any) => { const arr = [...articles]; arr[i] = { ...arr[i], [k]: v }; set('articles', arr); };
  const addArticle = () => set('articles', [...articles, { titre: 'Nouvel article', date: new Date().toISOString().split('T')[0], extrait: '', image: '', lien: '#', actif: true }]);
  const delArticle = (i: number) => { const arr = [...articles]; arr.splice(i, 1); set('articles', arr); };

  // ─── Gestion FAQ ───────────────────────────────────────────────────────────
  const faq = ea(config.faq, CONFIG_LANGUES_DEFAUT.faq);
  const updFaq = (i: number, k: keyof FAQItem, v: any) => { const arr = [...faq]; arr[i] = { ...arr[i], [k]: v }; set('faq', arr); };
  const addFaq = () => set('faq', [...faq, { question: 'Nouvelle question', reponse: '', actif: true }]);
  const delFaq = (i: number) => { const arr = [...faq]; arr.splice(i, 1); set('faq', arr); };

  const horaires = ea(config.horaires, CONFIG_LANGUES_DEFAUT.horaires);
  const updHoraire = (i: number, v: string) => { const h = [...horaires]; h[i] = v; set('horaires', h); };

  const sections = ea(config.sections, CONFIG_LANGUES_DEFAUT.sections);

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite', label: 'Identité', emoji: '🏷️' },
    { id: 'apparence', label: 'Apparence', emoji: '🎨' },
    { id: 'sections', label: 'Sections', emoji: '📐' },
    { id: 'langues', label: 'Langues', emoji: '🌍' },
    { id: 'formules', label: 'Formules', emoji: '💰' },
    { id: 'professeurs', label: 'Professeurs', emoji: '👩‍🏫' },
    { id: 'pourquoi', label: 'Points forts', emoji: '💡' },
    { id: 'evenements', label: 'Événements', emoji: '📅' },
    { id: 'blog', label: 'Blog', emoji: '📝' },
    { id: 'faq', label: 'FAQ', emoji: '❓' },
    { id: 'contact', label: 'Contact', emoji: '📍' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* Sidebar config */}
      <div style={{ width: 370, minWidth: 330, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${P}, ${S})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌍</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Cours de Langues</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: onglet === o.id ? P : '#f3f4f6', color: onglet === o.id ? '#fff' : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Onglet Identité */}
          {onglet === 'identite' && (
            <>
              <Sec titre="Identité & Textes">
                <Champ label="Nom de l'école"><Input value={config.nomEcole} onChange={(v: string) => set('nomEcole', v)} placeholder="LinguaMaster" /></Champ>
                <Champ label="Slogan"><Input value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="PARLEZ AVEC CONFIANCE" /></Champ>
                <Champ label="Titre Hero"><Input value={config.heroTitre} onChange={(v: string) => set('heroTitre', v)} placeholder="Maîtrisez une nouvelle langue" /></Champ>
                <Champ label="Sous-titre Hero"><Textarea value={config.heroSousTitre} onChange={(v: string) => set('heroSousTitre', v)} rows={2} /></Champ>
                <Champ label="Description footer"><Textarea value={config.descFooter} onChange={(v: string) => set('descFooter', v)} rows={2} /></Champ>
              </Sec>
              <Sec titre="Média Hero">
                <Champ label="Type" desc="Photo fixe ou vidéo (max 5 sec)">
                  <select value={config.heroType} onChange={e => set('heroType', e.target.value as 'photo' | 'video')} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                    <option value="photo">Photo</option>
                    <option value="video">Vidéo</option>
                  </select>
                </Champ>
                <Champ label="URL Photo"><Input value={config.heroPhoto} onChange={(v: string) => set('heroPhoto', v)} placeholder="https://..." /></Champ>
                {config.heroType === 'video' && (
                  <Champ label="URL Vidéo (mp4)" desc="Recommandé : vidéo courte max 5 secondes"><Input value={config.heroVideo} onChange={(v: string) => set('heroVideo', v)} placeholder="https://..." /></Champ>
                )}
              </Sec>
              <Sec titre="Stats (compteurs animés)">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>4 stats maximum</div>
                {config.stats.map((stat, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Input value={stat.icone} onChange={v => { const s = [...config.stats]; s[i].icone = v; set('stats', s); }} placeholder="icône" style={{ width: 50 }} />
                      <Input value={stat.label} onChange={v => { const s = [...config.stats]; s[i].label = v; set('stats', s); }} placeholder="Label" style={{ flex: 1 }} />
                      <Input type="number" value={stat.valeur} onChange={v => { const s = [...config.stats]; s[i].valeur = parseInt(v) || 0; set('stats', s); }} placeholder="Valeur" style={{ width: 100 }} />
                    </div>
                  </div>
                ))}
                {config.stats.length < 4 && (
                  <button onClick={() => set('stats', [...config.stats, { valeur: 0, label: 'Nouvelle stat', icone: '⭐' }])} style={{ width: '100%', padding: 8, border: `2px dashed ${P}`, borderRadius: 8, background: 'transparent', color: P, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    + Ajouter une stat
                  </button>
                )}
              </Sec>
            </>
          )}

          {/* Onglet Apparence */}
          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {PALETTES.map(pal => (
                    <button key={pal.nom} onClick={() => setConfig(prev => ({ ...prev, couleurPrimaire: pal.p, couleurSecondaire: pal.s, couleurFond: pal.fond }))}
                      style={{ padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: `2px solid ${config.couleurPrimaire === pal.p && config.couleurSecondaire === pal.s ? pal.p : '#e5e7eb'}`, background: pal.fond, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: pal.p }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: pal.s }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: pal.fond, border: '1px solid #ddd' }} />
                      </div>
                      <span style={{ color: pal.p, fontSize: 9 }}>{pal.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([['couleurPrimaire', 'Couleur principale'], ['couleurSecondaire', 'Couleur secondaire'], ['couleurFond', 'Couleur de fond'], ['couleurTexte', 'Couleur du texte']] as [keyof ConfigLangues, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                      <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                    </div>
                  </Champ>
                ))}
              </Sec>
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 40, display: 'flex', marginTop: 16 }}>
                <div style={{ flex: 2, background: config.couleurPrimaire, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>PRIMAIRE</span></div>
                <div style={{ flex: 1.5, background: config.couleurSecondaire, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>SECONDAIRE</span></div>
                <div style={{ flex: 1, background: config.couleurFond, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurTexte, fontSize: 10, fontWeight: 700 }}>FOND</span></div>
              </div>
            </>
          )}

          {/* Onglet Sections */}
          {onglet === 'sections' && <SectionsManager sections={sections} onChange={(s) => set('sections', s)} />}

          {/* Onglet Langues */}
          {onglet === 'langues' && (
            <>
              <div style={{ background: '#f0f4ff', border: `1px solid ${P}40`, borderRadius: 8, padding: 9, fontSize: 12, color: P, marginBottom: 12 }}>
                🌍 Les langues apparaissent sous forme de badges interactifs sur la page d'accueil.
              </div>
              {langues.map((l, i) => (
                <div key={i} style={{ border: `1px solid ${l.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 8, padding: 12, marginBottom: 10, background: l.actif ? `${P}05` : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{l.nom}</span>
                    <button onClick={() => delLangue(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input value={l.nom} onChange={v => updLangue(i, 'nom', v)} placeholder="Nom" style={{ flex: 2 }} />
                    <Input value={l.icone} onChange={v => updLangue(i, 'icone', v)} placeholder="🇫🇷" style={{ width: 60 }} />
                    <input type="color" value={l.couleur} onChange={e => updLangue(i, 'couleur', e.target.value)} style={{ width: 40, height: 34, border: '1px solid #ddd', borderRadius: 6 }} />
                    <button onClick={() => updLangue(i, 'actif', !l.actif)} style={{ width: 42, height: 34, borderRadius: 6, border: `1px solid ${l.actif ? P : '#ddd'}`, background: l.actif ? P : '#fff', color: l.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{l.actif ? 'ON' : 'OFF'}</button>
                  </div>
                </div>
              ))}
              <button onClick={addLangue} style={{ width: '100%', padding: 9, border: `2px dashed ${P}`, borderRadius: 9, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter une langue
              </button>
            </>
          )}

          {/* Onglet Formules */}
          {onglet === 'formules' && (
            <>
              {formules.map((f, i) => (
                <div key={i} style={{ border: `1px solid ${f.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 12, padding: 14, marginBottom: 16, background: f.actif ? `${P}03` : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.couleur }}>{f.titre}</span>
                    <button onClick={() => delFormule(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input value={f.titre} onChange={v => updFormule(i, 'titre', v)} placeholder="Titre" style={{ flex: 2 }} />
                    <Input value={f.prix} onChange={v => updFormule(i, 'prix', v)} placeholder="249$" style={{ width: 100 }} />
                    <Input value={f.icone} onChange={v => updFormule(i, 'icone', v)} placeholder="👥" style={{ width: 60 }} />
                    <input type="color" value={f.couleur} onChange={e => updFormule(i, 'couleur', e.target.value)} style={{ width: 40, height: 34, border: '1px solid #ddd', borderRadius: 6 }} />
                  </div>
                  <Champ label="Description"><Input value={f.description} onChange={v => updFormule(i, 'description', v)} /></Champ>
                  <Champ label="Caractéristiques">
                    {f.caracteristiques.map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <Input value={c} onChange={v => updCaractFormule(i, ci, v)} placeholder="Caractéristique" style={{ flex: 1 }} />
                        <button onClick={() => delCaractFormule(i, ci)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '0 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => addCaractFormule(i)} style={{ fontSize: 11, color: P, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter une caractéristique</button>
                  </Champ>
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => updFormule(i, 'actif', !f.actif)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${f.actif ? P : '#ddd'}`, background: f.actif ? P : '#fff', color: f.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{f.actif ? 'Actif' : 'Inactif'}</button>
                  </div>
                </div>
              ))}
              <button onClick={addFormule} style={{ width: '100%', padding: 12, border: `2px dashed ${P}`, borderRadius: 12, background: 'transparent', color: P, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter une formule
              </button>
            </>
          )}

          {/* Onglet Professeurs */}
          {onglet === 'professeurs' && (
            <>
              {professeurs.map((p, i) => (
                <div key={i} style={{ border: `1px solid ${p.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.prenom} {p.nom}</span>
                    <button onClick={() => delProfesseur(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input value={p.prenom} onChange={v => updProfesseur(i, 'prenom', v)} placeholder="Prénom" style={{ flex: 1 }} />
                    <Input value={p.nom} onChange={v => updProfesseur(i, 'nom', v)} placeholder="Nom" style={{ flex: 1 }} />
                  </div>
                  <Champ label="Langue enseignée"><Input value={p.langue} onChange={v => updProfesseur(i, 'langue', v)} /></Champ>
                  <Champ label="Diplôme / Certificat"><Input value={p.diplome} onChange={v => updProfesseur(i, 'diplome', v)} /></Champ>
                  <Champ label="Bio"><Textarea value={p.bio} onChange={v => updProfesseur(i, 'bio', v)} rows={2} /></Champ>
                  <Champ label="URL Photo"><Input value={p.photo} onChange={v => updProfesseur(i, 'photo', v)} /></Champ>
                  <button onClick={() => updProfesseur(i, 'actif', !p.actif)} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: `1px solid ${p.actif ? P : '#ddd'}`, background: p.actif ? P : '#fff', color: p.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{p.actif ? 'Actif' : 'Inactif'}</button>
                </div>
              ))}
              <button onClick={addProfesseur} style={{ width: '100%', padding: 10, border: `2px dashed ${P}`, borderRadius: 10, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un professeur
              </button>
            </>
          )}

          {/* Onglet Points forts */}
          {onglet === 'pourquoi' && (
            <>
              {pourquoiItems.map((item, i) => (
                <div key={i} style={{ border: `1px solid ${item.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{item.titre}</span>
                    <button onClick={() => delPourquoi(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input value={item.titre} onChange={v => updPourquoi(i, 'titre', v)} placeholder="Titre" style={{ flex: 2 }} />
                    <Input value={item.icone} onChange={v => updPourquoi(i, 'icone', v)} placeholder="🌍" style={{ width: 60 }} />
                    <input type="color" value={item.couleur} onChange={e => updPourquoi(i, 'couleur', e.target.value)} style={{ width: 40, height: 34, border: '1px solid #ddd', borderRadius: 6 }} />
                  </div>
                  <Champ label="Description"><Textarea value={item.description} onChange={v => updPourquoi(i, 'description', v)} rows={2} /></Champ>
                  <button onClick={() => updPourquoi(i, 'actif', !item.actif)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${item.actif ? P : '#ddd'}`, background: item.actif ? P : '#fff', color: item.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{item.actif ? 'Actif' : 'Inactif'}</button>
                </div>
              ))}
              <button onClick={addPourquoi} style={{ width: '100%', padding: 10, border: `2px dashed ${P}`, borderRadius: 10, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un point fort
              </button>
            </>
          )}

          {/* Onglet Événements */}
          {onglet === 'evenements' && (
            <>
              {evenements.map((e, i) => (
                <div key={i} style={{ border: `1px solid ${e.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{e.titre}</span>
                    <button onClick={() => delEvenement(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Titre"><Input value={e.titre} onChange={v => updEvenement(i, 'titre', v)} /></Champ>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="datetime-local" value={e.date.slice(0, 16)} onChange={v => updEvenement(i, 'date', v.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} />
                    <select value={e.type} onChange={v => updEvenement(i, 'type', v.target.value)} style={{ width: 120, padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}>
                      <option value="webinaire">Webinaire</option>
                      <option value="atelier">Atelier</option>
                      <option value="meetup">Meetup</option>
                    </select>
                  </div>
                  <Champ label="Langue"><Input value={e.langue} onChange={v => updEvenement(i, 'langue', v)} /></Champ>
                  <Champ label="Lien RSVP"><Input value={e.lienRSVP} onChange={v => updEvenement(i, 'lienRSVP', v)} /></Champ>
                  <button onClick={() => updEvenement(i, 'actif', !e.actif)} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: `1px solid ${e.actif ? P : '#ddd'}`, background: e.actif ? P : '#fff', color: e.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{e.actif ? 'Actif' : 'Inactif'}</button>
                </div>
              ))}
              <button onClick={addEvenement} style={{ width: '100%', padding: 10, border: `2px dashed ${P}`, borderRadius: 10, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un événement
              </button>
            </>
          )}

          {/* Onglet Blog */}
          {onglet === 'blog' && (
            <>
              {articles.map((a, i) => (
                <div key={i} style={{ border: `1px solid ${a.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.titre}</span>
                    <button onClick={() => delArticle(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Titre"><Input value={a.titre} onChange={v => updArticle(i, 'titre', v)} /></Champ>
                  <Champ label="Date"><input type="date" value={a.date} onChange={v => updArticle(i, 'date', v.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8 }} /></Champ>
                  <Champ label="Extrait"><Textarea value={a.extrait} onChange={v => updArticle(i, 'extrait', v)} rows={2} /></Champ>
                  <Champ label="URL Image"><Input value={a.image} onChange={v => updArticle(i, 'image', v)} /></Champ>
                  <Champ label="Lien article"><Input value={a.lien} onChange={v => updArticle(i, 'lien', v)} /></Champ>
                  <button onClick={() => updArticle(i, 'actif', !a.actif)} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: `1px solid ${a.actif ? P : '#ddd'}`, background: a.actif ? P : '#fff', color: a.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{a.actif ? 'Actif' : 'Inactif'}</button>
                </div>
              ))}
              <button onClick={addArticle} style={{ width: '100%', padding: 10, border: `2px dashed ${P}`, borderRadius: 10, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un article
              </button>
            </>
          )}

          {/* Onglet FAQ */}
          {onglet === 'faq' && (
            <>
              {faq.map((f, i) => (
                <div key={i} style={{ border: `1px solid ${f.actif ? P + '40' : '#e5e7eb'}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Question {i + 1}</span>
                    <button onClick={() => delFaq(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Question"><Input value={f.question} onChange={v => updFaq(i, 'question', v)} /></Champ>
                  <Champ label="Réponse"><Textarea value={f.reponse} onChange={v => updFaq(i, 'reponse', v)} rows={3} /></Champ>
                  <button onClick={() => updFaq(i, 'actif', !f.actif)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${f.actif ? P : '#ddd'}`, background: f.actif ? P : '#fff', color: f.actif ? '#fff' : '#999', cursor: 'pointer', fontSize: 11 }}>{f.actif ? 'Actif' : 'Inactif'}</button>
                </div>
              ))}
              <button onClick={addFaq} style={{ width: '100%', padding: 10, border: `2px dashed ${P}`, borderRadius: 10, background: 'transparent', color: P, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter une FAQ
              </button>
            </>
          )}

          {/* Onglet Contact */}
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
                  <div key={i} style={{ marginBottom: 7 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 9h – 21h" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Réseaux sociaux">
                {(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] as const).map(res => (
                  <Champ key={res} label={res.charAt(0).toUpperCase() + res.slice(1)}>
                    <Input value={config.reseaux?.[res] || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, [res]: v })} placeholder={`https://${res}.com/...`} />
                  </Champ>
                ))}
              </Sec>
              <Sec titre="Newsletter">
                <Champ label="Activer la newsletter">
                  <button onClick={() => set('newsletterActif', !config.newsletterActif)} style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${config.newsletterActif ? P : '#ddd'}`, background: config.newsletterActif ? P : '#fff', color: config.newsletterActif ? '#fff' : '#666', cursor: 'pointer' }}>
                    {config.newsletterActif ? '✅ Activée' : '❌ Désactivée'}
                  </button>
                </Champ>
                <Champ label="Texte de la newsletter"><Input value={config.newsletterTexte} onChange={(v: string) => set('newsletterTexte', v)} /></Champ>
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame" desc="Google Maps > Partager > Intégrer une carte"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_LANGUES_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid ${P}`, background:apercu?P:'transparent', color:apercu?'#fff':P, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':P, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#f8faff', overflow:'hidden' }}>
        <div style={{ background:'#eef2ff', borderBottom:`1px solid ${P}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:P, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${P}22`:'transparent', color:modeApercu===m?P:'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #ddd`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8faff', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🌍</div>
          <p style={{ fontSize:15, color:P, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${P}80` }}>Template Cours de Langues — Gratuit</p>
        </div>
      )}
    </div>
  );
}