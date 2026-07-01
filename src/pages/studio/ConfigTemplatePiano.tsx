// src/pages/studio/ConfigTemplatePiano.tsx
// e-Vend Studio — Configuration du template Cours de Piano

import { useState, useEffect } from 'react';
import TemplatePiano, { CONFIG_PIANO_DEFAUT } from '../../templates/TemplatePiano';
import type { ConfigPiano, SectionConfig, Recompense, PrixCours, PrixPrestations } from '../../templates/TemplatePiano';

type Onglet = 'identite' | 'apparence' | 'sections' | 'photos' | 'bio' | 'recompenses' | 'tarifs' | 'contact';

const CA = '#e8a87c';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CA} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CA} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
  const icones: Record<string, string> = { hero: '🎹', bio: '📖', grille: '📸', recompenses: '🏆', lecons: '🎵', tarifs: '💰', galerie: '🖼️', contact: '✉️' };

  return (
    <div>
      <div style={{ background: '#fff5f0', border: `1px solid ${CA}`, borderRadius: 8, padding: 10, fontSize: 12, color: '#7a3500', marginBottom: 14 }}>
        <strong>📐 Sections du site</strong><br />Toggle ON/OFF + ▲▼ pour réordonner. Aperçu en temps réel.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: sec.actif ? '#fff8f5' : '#fafafa', border: `2px solid ${sec.actif ? CA : '#e5e7eb'}`, borderRadius: 10, padding: '9px 11px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: sec.actif ? CA : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
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

const PALETTES = [
  { nom: 'Pêche & Noir (défaut)', ca: '#e8a87c', cf: '#000000' },
  { nom: 'Bleu & Noir',           ca: '#6ea8fe', cf: '#000000' },
  { nom: 'Vert Sauge & Noir',     ca: '#7eb87e', cf: '#000000' },
  { nom: 'Mauve & Noir',          ca: '#b87eb8', cf: '#000000' },
  { nom: 'Or & Noir',             ca: '#c9a84c', cf: '#000000' },
  { nom: 'Rouge Rosé & Noir',     ca: '#e87c8a', cf: '#000000' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigPiano>;
  onSauvegarde?: (config: ConfigPiano) => Promise<void>;
}

export default function ConfigTemplatePiano({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigPiano>({ ...CONFIG_PIANO_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigPiano, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'cours-piano' }),
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
  const sections = ea(config.sections, CONFIG_PIANO_DEFAUT.sections);
  const recompenses = ea(config.recompenses, CONFIG_PIANO_DEFAUT.recompenses);
  const photosGalerieHero = ea(config.photosGalerieHero, CONFIG_PIANO_DEFAUT.photosGalerieHero);
  const photosGalerie = ea(config.photosGalerie, CONFIG_PIANO_DEFAUT.photosGalerie);
  const cours = ea(config.prix?.cours || [], CONFIG_PIANO_DEFAUT.prix.cours);
  const prestations = ea(config.prix?.prestations || [], CONFIG_PIANO_DEFAUT.prix.prestations);

  const updRec = (i: number, k: keyof Recompense, v: string) => { const arr = [...recompenses]; arr[i] = { ...arr[i], [k]: v }; set('recompenses', arr); };
  const addRec = () => set('recompenses', [...recompenses, { icone: '🏆', titre: 'Nouveau prix', description: '' }]);
  const delRec = (i: number) => { const arr = [...recompenses]; arr.splice(i, 1); set('recompenses', arr); };

  const updCours = (i: number, k: keyof PrixCours, v: any) => {
    const arr = [...cours]; arr[i] = { ...arr[i], [k]: v };
    set('prix', { ...config.prix, cours: arr });
  };
  const addCours = () => set('prix', { ...config.prix, cours: [...cours, { formule: 'Nouveau cours', prix: '0$', duree: '60 min', description: '', inclus: [] }] });
  const delCours = (i: number) => { const arr = [...cours]; arr.splice(i, 1); set('prix', { ...config.prix, cours: arr }); };

  const updPrest = (i: number, k: keyof PrixPrestations, v: string) => {
    const arr = [...prestations]; arr[i] = { ...arr[i], [k]: v };
    set('prix', { ...config.prix, prestations: arr });
  };
  const addPrest = () => set('prix', { ...config.prix, prestations: [...prestations, { type: 'Nouvelle prestation', prix: '', description: '' }] });
  const delPrest = (i: number) => { const arr = [...prestations]; arr.splice(i, 1); set('prix', { ...config.prix, prestations: arr }); };

  const updGalerieHero = (i: number, v: string) => { const p = [...photosGalerieHero]; p[i] = v; set('photosGalerieHero', p); };
  const updGalerie = (i: number, v: string) => { const p = [...photosGalerie]; p[i] = v; set('photosGalerie', p); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',    label: 'Identité',     emoji: '🎹' },
    { id: 'apparence',   label: 'Apparence',    emoji: '🎨' },
    { id: 'sections',    label: 'Sections',     emoji: '📐' },
    { id: 'photos',      label: 'Photos',       emoji: '📸' },
    { id: 'bio',         label: 'Biographie',   emoji: '📖' },
    { id: 'recompenses', label: 'Récompenses',  emoji: '🏆' },
    { id: 'tarifs',      label: 'Tarifs',       emoji: '💰' },
    { id: 'contact',     label: 'Contact',      emoji: '✉️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      <div style={{ width: 370, minWidth: 330, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, #000, ${CA})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎹</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Cours de Piano</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: onglet === o.id ? '#000' : '#f3f4f6', color: onglet === o.id ? CA : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {onglet === 'identite' && (
            <>
              <Sec titre="Identité artistique">
                <Champ label="Nom de l'artiste"><Input value={config.nomArtiste} onChange={(v: string) => set('nomArtiste', v)} placeholder="Marie Leclair" /></Champ>
                <Champ label="Initiales logo" desc="2-3 lettres affichées en haut à gauche"><Input value={config.initiales} onChange={(v: string) => set('initiales', v)} placeholder="ML" /></Champ>
                <Champ label="Titre (ex: PIANISTE)"><Input value={config.titre} onChange={(v: string) => set('titre', v)} placeholder="PIANISTE" /></Champ>
                <Champ label="Slogan"><Textarea value={config.slogan} onChange={(v: string) => set('slogan', v)} rows={2} /></Champ>
              </Sec>
              <Sec titre="CTA contact">
                <Champ label="Texte CTA section contact"><Textarea value={config.descriptionCTA} onChange={(v: string) => set('descriptionCTA', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}

          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes d'accent">
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Le fond est toujours noir. Choisissez la couleur d'accent.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => set('couleurAccent', p.ca)}
                      style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: `2px solid ${config.couleurAccent === p.ca ? p.ca : '#e5e7eb'}`, background: '#000', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: p.ca, flexShrink: 0 }} />
                      <span style={{ color: p.ca }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleur accent personnalisée">
                <Champ label="Couleur accent">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={config.couleurAccent} onChange={e => set('couleurAccent', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurAccent} onChange={(v: string) => set('couleurAccent', v)} placeholder="#e8a87c" />
                  </div>
                </Champ>
              </Sec>
              {/* Aperçu */}
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 48, display: 'flex' }}>
                <div style={{ flex: 3, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: config.couleurAccent, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>FOND NOIR</span>
                </div>
                <div style={{ flex: 1, background: config.couleurAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#000', fontSize: 10, fontWeight: 700 }}>ACCENT</span>
                </div>
              </div>
            </>
          )}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={(s) => set('sections', s)} />}

          {onglet === 'photos' && (
            <>
              <Sec titre="Photos principales">
                <Champ label="Photo Hero (fond plein écran)"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo Biographie (grande)"><Input value={config.photoBio} onChange={(v: string) => set('photoBio', v)} /></Champ>
                <Champ label="Photo Bio 2 (optionnelle)"><Input value={config.photoBio2} onChange={(v: string) => set('photoBio2', v)} /></Champ>
                <Champ label="Photo Leçons 1"><Input value={config.photoLecons} onChange={(v: string) => set('photoLecons', v)} /></Champ>
                <Champ label="Photo Leçons 2"><Input value={config.photoLecons2} onChange={(v: string) => set('photoLecons2', v)} /></Champ>
              </Sec>
              <Sec titre="Grille diagonale (9 photos — section accueil)">
                {photosGalerieHero.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7 }}>
                    {url && <img src={url} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ width: 40, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                    <Input value={url} onChange={(v: string) => updGalerieHero(i, v)} placeholder={`Photo grille ${i + 1}`} />
                  </div>
                ))}
              </Sec>
              <Sec titre="Galerie page dédiée (8 photos)">
                {photosGalerie.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7 }}>
                    {url && <img src={url} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ width: 40, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                    <Input value={url} onChange={(v: string) => updGalerie(i, v)} placeholder={`Photo galerie ${i + 1}`} />
                  </div>
                ))}
              </Sec>
            </>
          )}

          {onglet === 'bio' && (
            <Sec titre="Biographie">
              <Champ label="Description biographique" desc="Texte principal de la section À propos"><Textarea value={config.descriptionBio} onChange={(v: string) => set('descriptionBio', v)} rows={6} /></Champ>
            </Sec>
          )}

          {onglet === 'recompenses' && (
            <>
              <div style={{ background: '#fff5f0', border: `1px solid ${CA}60`, borderRadius: 8, padding: 9, fontSize: 12, color: '#7a3500', marginBottom: 12 }}>
                🏆 Chaque récompense apparaît dans une carte centrée avec un trophée SVG.
              </div>
              {recompenses.map((r, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Récompense {i + 1}</span>
                    <button onClick={() => delRec(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Icône (emoji)"><Input value={r.icone} onChange={(v: string) => updRec(i, 'icone', v)} placeholder="🏆" /></Champ>
                  <Champ label="Titre"><Input value={r.titre} onChange={(v: string) => updRec(i, 'titre', v)} /></Champ>
                  <Champ label="Description"><Textarea value={r.description} onChange={(v: string) => updRec(i, 'description', v)} rows={2} /></Champ>
                </div>
              ))}
              <button onClick={addRec} style={{ width: '100%', padding: 9, border: `2px dashed ${CA}`, borderRadius: 9, background: 'transparent', color: CA, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter une récompense
              </button>
            </>
          )}

          {onglet === 'tarifs' && (
            <>
              <Sec titre="Formules de cours">
                {cours.map((c, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.formule || `Cours ${i + 1}`}</span>
                      <button onClick={() => delCours(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                    <Champ label="Nom de la formule"><Input value={c.formule} onChange={(v: string) => updCours(i, 'formule', v)} /></Champ>
                    <Champ label="Prix (ex: 75$)"><Input value={c.prix} onChange={(v: string) => updCours(i, 'prix', v)} /></Champ>
                    <Champ label="Durée (ex: 60 min)"><Input value={c.duree} onChange={(v: string) => updCours(i, 'duree', v)} /></Champ>
                    <Champ label="Description"><Textarea value={c.description} onChange={(v: string) => updCours(i, 'description', v)} rows={2} /></Champ>
                    <Champ label="Inclus (séparés par des virgules)">
                      <Input value={c.inclus?.join(', ') || ''} onChange={(v: string) => updCours(i, 'inclus', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Évaluation, Partition offerte, ..." />
                    </Champ>
                  </div>
                ))}
                <button onClick={addCours} style={{ width: '100%', padding: 9, border: `2px dashed ${CA}`, borderRadius: 9, background: 'transparent', color: CA, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  + Ajouter une formule
                </button>
              </Sec>
              <Sec titre="Prestations & Concerts">
                {prestations.map((p, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Prestation {i + 1}</span>
                      <button onClick={() => delPrest(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                    <Champ label="Type"><Input value={p.type} onChange={(v: string) => updPrest(i, 'type', v)} /></Champ>
                    <Champ label="Prix"><Input value={p.prix} onChange={(v: string) => updPrest(i, 'prix', v)} /></Champ>
                    <Champ label="Description"><Input value={p.description} onChange={(v: string) => updPrest(i, 'description', v)} /></Champ>
                  </div>
                ))}
                <button onClick={addPrest} style={{ width: '100%', padding: 9, border: `2px dashed ${CA}`, borderRadius: 9, background: 'transparent', color: CA, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  + Ajouter une prestation
                </button>
              </Sec>
            </>
          )}

          {onglet === 'contact' && (
            <>
              <Sec titre="Coordonnées">
                <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => set('telephone', v)} /></Champ>
                <Champ label="Courriel"><Input value={config.email} onChange={(v: string) => set('email', v)} /></Champ>
              </Sec>
              <Sec titre="Réseaux sociaux">
                <Champ label="Facebook (URL)"><Input value={config.reseaux?.facebook || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, facebook: v })} /></Champ>
                <Champ label="Instagram (URL)"><Input value={config.reseaux?.instagram || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, instagram: v })} /></Champ>
              </Sec>
            </>
          )}
        </div>

        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_PIANO_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'1.5px solid #000', background:apercu?'#000':'transparent', color:apercu?CA:'#000', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':'#000', color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':CA, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#000', overflow:'hidden' }}>
        <div style={{ background:'#111', borderBottom:`1px solid ${CA}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CA, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #222', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CA}33`:'transparent', color:modeApercu===m?CA:'#666', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#000', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🎹</div>
          <p style={{ fontSize:15, color:CA, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CA}60` }}>Template Cours de Piano — Gratuit</p>
        </div>
      )}
    </div>
  );
}