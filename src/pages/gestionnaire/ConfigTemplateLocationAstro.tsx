// src/pages/gestionnaire/ConfigTemplateLocationAstro.tsx
// e-Vend Studio — Configuration du template « Location d'astronomie » (reservation-location-astro)
// Le catalogue est stocké dans config.location_objets (compté par la limite du palier de location).

import { useState, useCallback, useEffect } from 'react';
import TemplateLocationAstro, { CONFIG_LOCATION_ASTRO_DEFAUT } from '../../templates/TemplateLocationAstro';
import type { ConfigLocationAstro, ObjetAstro } from '../../templates/TemplateLocationAstro';

type Onglet = 'identite' | 'style' | 'catalogue' | 'conditions' | 'contenu' | 'contact';

const ACCENT = '#8e54d9';

const Input = ({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
    onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
    onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Champ = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 5 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#888', margin: '0 0 6px' }}>{desc}</p>}
    {children}
  </div>
);

const Sec = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 26 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aaa', margin: '0 0 14px', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

const Couleur = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Champ label={label}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      <Input value={value} onChange={onChange} />
    </div>
  </Champ>
);

const btnPetit: React.CSSProperties = { padding: '5px 9px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555' };

const MODELES: { label: string; objet: Omit<ObjetAstro, 'id'> }[] = [
  { label: '🔭 Télescope', objet: { nom: 'Nouveau télescope', categorie: 'Télescopes', niveau: 'Débutant', resume: '', description: '', prixJour: 40, imageUrl: '', images: [], quantite: 1, disponible: true, specs: [{ label: 'Type', valeur: '' }, { label: 'Ouverture', valeur: '' }, { label: 'Distance focale', valeur: '' }, { label: 'Monture', valeur: '' }, { label: 'Poids', valeur: '' }], inclus: ['Oculaires', 'Chercheur'] } },
  { label: '👀 Jumelles', objet: { nom: 'Nouvelles jumelles', categorie: 'Jumelles', niveau: 'Débutant', resume: '', description: '', prixJour: 20, imageUrl: '', images: [], quantite: 1, disponible: true, specs: [{ label: 'Grossissement', valeur: '' }, { label: 'Diamètre des objectifs', valeur: '' }, { label: 'Champ de vision', valeur: '' }, { label: 'Poids', valeur: '' }], inclus: ['Housse', 'Trépied'] } },
  { label: '🎒 Accessoire', objet: { nom: 'Nouvel accessoire', categorie: 'Accessoires', niveau: '', resume: '', description: '', prixJour: 15, imageUrl: '', images: [], quantite: 1, disponible: true, specs: [{ label: 'Compatibilité', valeur: '' }], inclus: [] } },
];

// Éditeur de listes simples (stats, étapes, FAQ, galerie)
const ListeLignes = <T extends Record<string, string>>({ items, champs, onChange, ajout }: {
  items: T[]; champs: { cle: keyof T & string; label: string; long?: boolean }[]; onChange: (v: T[]) => void; ajout: T;
}) => (
  <div>
    {items.map((it, i) => (
      <div key={i} style={{ border: '1px solid #ececec', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fafafa' }}>
        {champs.map(c => (
          <div key={c.cle} style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: '#888', margin: '0 0 3px' }}>{c.label}</p>
            {c.long
              ? <Textarea rows={2} value={it[c.cle]} onChange={v => onChange(items.map((x, k) => (k === i ? { ...x, [c.cle]: v } : x)))} />
              : <Input value={it[c.cle]} onChange={v => onChange(items.map((x, k) => (k === i ? { ...x, [c.cle]: v } : x)))} />}
          </div>
        ))}
        <button onClick={() => onChange(items.filter((_, k) => k !== i))} style={{ ...btnPetit, color: '#b91c1c' }}>Supprimer</button>
      </div>
    ))}
    <button onClick={() => onChange([...items, { ...ajout }])} style={{ width: '100%', padding: 8, border: '1.5px dashed #d0c9bb', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 }}>+ Ajouter</button>
  </div>
);


interface Props {
  vendeurId: string;
  templateId?: string;
  configInitiale?: Partial<ConfigLocationAstro>;
  onSauvegarde?: (config: ConfigLocationAstro) => Promise<void>;
}

export default function ConfigTemplateLocationAstro({ vendeurId, templateId = 'reservation-location-astro', configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigLocationAstro>({ ...CONFIG_LOCATION_ASTRO_DEFAUT, ...(configInitiale || {}) } as ConfigLocationAstro);
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [modePreview, setModePreview] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [ouvertId, setOuvertId] = useState<string | null>(null);

  // Palier (limite d'objets du catalogue) — réglé par l'admin dans « Locations (tarifs) »
  type PalierLoc = { label: string; limite: number; prix: string; plan_id: string };
  type PlanLoc = { limite: number | null; nb_objets: number; palier_actuel: string | null; paliers: PalierLoc[] };
  const [planLoc, setPlanLoc] = useState<PlanLoc | null>(null);
  const [messageLoc, setMessageLoc] = useState('');

  const chargerPlanLoc = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/locations/plan', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPlanLoc(await res.json());
    } catch { /* le serveur applique quand même la limite à la sauvegarde */ }
  }, []);
  useEffect(() => { chargerPlanLoc(); }, [chargerPlanLoc]);

  const choisirPalier = async (limite: number) => {
    setMessageLoc('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/locations/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ limite }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessageLoc(data.message || 'Impossible de changer de palier.'); return; }
      setPlanLoc(data);
    } catch { setMessageLoc('Impossible de joindre le serveur.'); }
  };

  const limite: number | null = planLoc ? planLoc.limite : null;
  const nbObjets = config.location_objets.length;
  const limiteAtteinte = limite !== null && nbObjets >= limite;

  // Recharge la configuration déjà sauvegardée
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await fetch(`/api/studio/sites/${vendeurId}`);
        if (!res.ok) return;
        const site = await res.json();
        const sauv = site && typeof site.config === 'object' ? site.config : null;
        if (!annule && sauv && Object.keys(sauv).length > 0 && (!site.template_id || site.template_id === templateId)) {
          setConfig(prev => ({ ...prev, ...sauv }));
        }
      } catch { /* valeurs par défaut */ }
    })();
    return () => { annule = true; };
  }, [vendeurId, templateId]);

  const maj = useCallback(<K extends keyof ConfigLocationAstro>(champ: K, valeur: ConfigLocationAstro[K]) => {
    setConfig(prev => ({ ...prev, [champ]: valeur }));
    setSauvegarde('idle');
  }, []);

  const majObjet = (id: string, patch: Partial<ObjetAstro>) => maj('location_objets', config.location_objets.map(o => (o.id === id ? { ...o, ...patch } : o)));
  const ajouterObjet = (m: Omit<ObjetAstro, 'id'>) => {
    if (limiteAtteinte) return;
    const id = Date.now().toString();
    maj('location_objets', [...config.location_objets, { ...m, id }]);
    setOuvertId(id);
  };
  const dupliquer = (o: ObjetAstro) => {
    if (limiteAtteinte) return;
    const id = Date.now().toString();
    const idx = config.location_objets.findIndex(x => x.id === o.id);
    const copie = { ...o, id, nom: `${o.nom} (copie)` };
    const liste = [...config.location_objets];
    liste.splice(idx + 1, 0, copie);
    maj('location_objets', liste);
    setOuvertId(id);
  };
  const deplacer = (id: string, delta: number) => {
    const liste = [...config.location_objets];
    const i = liste.findIndex(o => o.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= liste.length) return;
    [liste[i], liste[j]] = [liste[j], liste[i]];
    maj('location_objets', liste);
  };

  const handleSauvegarder = async () => {
    if (limite !== null && nbObjets > limite) {
      setMessageLoc(`Votre palier permet ${limite} appareil${limite > 1 ? 's' : ''} et votre catalogue en contient ${nbObjets}. Retirez des appareils ou choisissez un palier plus grand.`);
      setSauvegarde('error');
      return;
    }
    setMessageLoc('');
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, sous_type: 'location', template_id: templateId }),
        });
        if (res.status === 409) {
          const d = await res.json().catch(() => ({}));
          setMessageLoc(d.message || 'Limite de votre palier dépassée.');
          throw new Error('limite');
        }
        if (!res.ok) throw new Error('echec');
      }
      setSauvegarde('saved');
      chargerPlanLoc();
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('error');
    }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'identite', label: 'Identité', icone: '✦' },
    { id: 'style', label: 'Style', icone: '🎨' },
    { id: 'catalogue', label: 'Catalogue', icone: '🔭' },
    { id: 'conditions', label: 'Conditions', icone: '📋' },
    { id: 'contenu', label: 'Contenu', icone: '✏️' },
    { id: 'contact', label: 'Contact', icone: '📲' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input[type=color] { width: 44px; height: 36px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: #fff; flex-shrink: 0; }
        @media (max-width: 900px) { .studio-layout { flex-direction: column !important; } .panneau-preview { display: none !important; } }
      `}</style>

      {/* BARRE TOP */}
      <div style={{ background: '#14112b', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd' }}>e-Vend Studio</span>
          <span style={{ color: '#555' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>🔭 Location d'astronomie</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#2a2650', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? ACCENT : 'transparent', border: 'none', color: device === d ? '#fff' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? ACCENT : '#2a2650', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={handleSauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : ACCENT, color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="studio-layout" style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {/* ══ PANNEAU CONFIG ══ */}
        {!modePreview && (
          <div style={{ width: 400, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => setOnglet(o.id)} style={{ flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? `2px solid ${ACCENT}` : '2px solid transparent', color: onglet === o.id ? ACCENT : '#888', fontSize: 10, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{o.icone}</div>{o.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {onglet === 'identite' && (
                <div>
                  <Sec titre="Informations de base">
                    <Champ label="Nom de l'entreprise"><Input value={config.nomEntreprise} onChange={v => maj('nomEntreprise', v)} /></Champ>
                    <Champ label="Slogan"><Input value={config.slogan} onChange={v => maj('slogan', v)} /></Champ>
                    <Champ label="Présentation"><Textarea rows={5} value={config.description} onChange={v => maj('description', v)} /></Champ>
                  </Sec>
                  <Sec titre="Photo de couverture">
                    <Champ label="URL de la photo" desc="Un ciel étoilé, 1600×900 px ou plus"><Input value={config.photoHeroUrl} onChange={v => maj('photoHeroUrl', v)} placeholder="https://..." /></Champ>
                    {config.photoHeroUrl && <img src={config.photoHeroUrl} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  </Sec>
                  <Sec titre="Logo (optionnel)">
                    <Champ label="URL du logo"><Input value={config.logoUrl} onChange={v => maj('logoUrl', v)} placeholder="https://..." /></Champ>
                  </Sec>
                </div>
              )}

              {onglet === 'style' && (
                <div>
                  <Sec titre="Couleurs">
                    <Couleur label="Couleur principale (boutons)" value={config.couleurPrincipale} onChange={v => maj('couleurPrincipale', v)} />
                    <Couleur label="Couleur d'accent (italiques, étoiles)" value={config.couleurAccent} onChange={v => maj('couleurAccent', v)} />
                    <Couleur label="Fond sombre" value={config.couleurFond} onChange={v => maj('couleurFond', v)} />
                    <Couleur label="Fond des sections claires" value={config.couleurFondClair} onChange={v => maj('couleurFondClair', v)} />
                  </Sec>
                  <button onClick={() => setConfig(p => ({ ...p, couleurPrincipale: '#8e54d9', couleurAccent: '#c4b5fd', couleurFond: '#14112b', couleurFondClair: '#f5f3fb' }))} style={btnPetit}>↺ Thème violet par défaut</button>
                </div>
              )}

              {onglet === 'catalogue' && (
                <div>
                  <Sec titre="Votre palier">
                    {planLoc && planLoc.paliers.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <select value={planLoc.palier_actuel || ''} onChange={e => { const p = planLoc.paliers.find(x => x.plan_id === e.target.value); if (p) choisirPalier(p.limite); }}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, background: '#fff' }}>
                          {planLoc.paliers.map(p => <option key={p.plan_id} value={p.plan_id}>{p.label} — jusqu'à {p.limite} appareils{p.prix ? ` — ${p.prix}` : ''}</option>)}
                        </select>
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                      {limite === null ? `${nbObjets} appareil${nbObjets > 1 ? 's' : ''} dans le catalogue (aucune limite).` : `${nbObjets} / ${limite} appareils dans le catalogue.`}
                    </p>
                    {messageLoc && <p style={{ fontSize: 12, color: '#b91c1c', background: '#fee2e2', borderRadius: 6, padding: '8px 10px', margin: '10px 0 0' }}>{messageLoc}</p>}
                  </Sec>

                  <Sec titre="Appareils à louer">
                    {config.location_objets.map((o, idx) => {
                      const ouvert = ouvertId === o.id;
                      return (
                        <div key={o.id} style={{ border: `1.5px solid ${ouvert ? ACCENT : '#ececec'}`, borderRadius: 10, marginBottom: 10, background: '#fff', overflow: 'hidden' }}>
                          <div onClick={() => setOuvertId(ouvert ? null : o.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, cursor: 'pointer', background: ouvert ? '#f5f3fb' : '#fff' }}>
                            <div style={{ width: 46, height: 38, borderRadius: 6, background: '#14112b', overflow: 'hidden', flexShrink: 0 }}>
                              {o.imageUrl && <img src={o.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1a1a1a' }}>{o.nom || 'Sans nom'}</p>
                              <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{o.categorie} · {o.prixJour} $ / jour{o.disponible ? '' : ' · indisponible'}</p>
                            </div>
                            <span style={{ color: '#aaa', fontSize: 12 }}>{ouvert ? '▲' : '▼'}</span>
                          </div>

                          {ouvert && (
                            <div style={{ padding: 14, borderTop: '1px solid #f0f0f0' }}>
                              <Champ label="Nom de l'appareil" desc="Ce nom identifie l'appareil dans les réservations : évitez de le renommer quand des réservations existent."><Input value={o.nom} onChange={v => majObjet(o.id, { nom: v })} /></Champ>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Champ label="Catégorie"><Input value={o.categorie} onChange={v => majObjet(o.id, { categorie: v })} placeholder="Télescopes" /></Champ>
                                <Champ label="Niveau"><Input value={o.niveau} onChange={v => majObjet(o.id, { niveau: v })} placeholder="Débutant" /></Champ>
                                <Champ label="Prix / jour ($)"><Input type="number" value={o.prixJour} onChange={v => majObjet(o.id, { prixJour: Math.max(0, parseFloat(v) || 0) })} /></Champ>
                                <Champ label="Exemplaires en stock"><Input type="number" value={o.quantite} onChange={v => majObjet(o.id, { quantite: Math.max(1, parseInt(v, 10) || 1) })} /></Champ>
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14, color: '#333' }}>
                                <input type="checkbox" checked={o.disponible} onChange={e => majObjet(o.id, { disponible: e.target.checked })} /> Disponible à la location
                              </label>
                              <Champ label="Résumé (carte du catalogue)"><Textarea rows={2} value={o.resume} onChange={v => majObjet(o.id, { resume: v })} /></Champ>
                              <Champ label="Description complète (fenêtre)"><Textarea rows={4} value={o.description} onChange={v => majObjet(o.id, { description: v })} /></Champ>
                              <Champ label="Photo principale (URL)">
                                <Input value={o.imageUrl} onChange={v => majObjet(o.id, { imageUrl: v })} placeholder="https://images.pexels.com/..." />
                              </Champ>
                              <Champ label="Photos supplémentaires" desc="Une URL par ligne">
                                <Textarea rows={3} value={o.images.join('\n')} onChange={v => majObjet(o.id, { images: v.split('\n').map(x => x.trim()).filter(Boolean) })} />
                              </Champ>

                              <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 8px' }}>Fiche technique</p>
                              {o.specs.map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                  <input value={s.label} placeholder="Ouverture" onChange={e => majObjet(o.id, { specs: o.specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} style={{ flex: 1, minWidth: 0, padding: '7px 9px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
                                  <input value={s.valeur} placeholder="203 mm" onChange={e => majObjet(o.id, { specs: o.specs.map((x, k) => (k === i ? { ...x, valeur: e.target.value } : x)) })} style={{ flex: 1.3, minWidth: 0, padding: '7px 9px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
                                  <button onClick={() => majObjet(o.id, { specs: o.specs.filter((_, k) => k !== i) })} style={btnPetit}>✕</button>
                                </div>
                              ))}
                              <button onClick={() => majObjet(o.id, { specs: [...o.specs, { label: '', valeur: '' }] })} style={{ ...btnPetit, marginBottom: 14 }}>+ Ligne</button>

                              <Champ label="Inclus avec l'appareil" desc="Un élément par ligne">
                                <Textarea rows={4} value={o.inclus.join('\n')} onChange={v => majObjet(o.id, { inclus: v.split('\n').filter(x => x.trim() !== '') })} />
                              </Champ>

                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button disabled={idx === 0} onClick={() => deplacer(o.id, -1)} style={btnPetit}>↑</button>
                                <button disabled={idx === config.location_objets.length - 1} onClick={() => deplacer(o.id, 1)} style={btnPetit}>↓</button>
                                <button disabled={limiteAtteinte} onClick={() => dupliquer(o)} style={{ ...btnPetit, opacity: limiteAtteinte ? 0.5 : 1 }}>Dupliquer</button>
                                <button onClick={() => { if (window.confirm(`Supprimer « ${o.nom} » ?`)) { maj('location_objets', config.location_objets.filter(x => x.id !== o.id)); setOuvertId(null); } }} style={{ ...btnPetit, color: '#b91c1c' }}>Supprimer</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {MODELES.map(m => (
                        <button key={m.label} disabled={limiteAtteinte} onClick={() => ajouterObjet(m.objet)}
                          style={{ flex: 1, padding: '9px 6px', border: '1.5px dashed #c4b5fd', borderRadius: 6, background: 'transparent', color: ACCENT, cursor: limiteAtteinte ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: limiteAtteinte ? 0.5 : 1 }}>
                          + {m.label}
                        </button>
                      ))}
                    </div>
                    {limiteAtteinte && <p style={{ fontSize: 12, color: '#b45309', margin: '10px 0 0' }}>Limite de votre palier atteinte ({limite}). Choisissez un palier plus grand pour ajouter d'autres appareils.</p>}
                  </Sec>
                </div>
              )}

              {onglet === 'conditions' && (
                <div>
                  <Sec titre="Durée de location">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Champ label="Minimum (jours)"><Input type="number" value={config.dureeMinJours} onChange={v => maj('dureeMinJours', Math.max(1, parseInt(v, 10) || 1))} /></Champ>
                      <Champ label="Maximum (jours)" desc="0 = sans maximum"><Input type="number" value={config.dureeMaxJours} onChange={v => maj('dureeMaxJours', Math.max(0, parseInt(v, 10) || 0))} /></Champ>
                    </div>
                    <Champ label="Heures de ramassage"><Input value={config.heureRamassage} onChange={v => maj('heureRamassage', v)} placeholder="9 h à 17 h" /></Champ>
                  </Sec>
                  <Sec titre="Dépôt et conditions">
                    <Champ label="Dépôt"><Input value={config.location_depot} onChange={v => maj('location_depot', v)} placeholder="150 $ remboursable" /></Champ>
                    <Champ label="Conditions de location"><Textarea rows={5} value={config.location_conditions} onChange={v => maj('location_conditions', v)} /></Champ>
                  </Sec>
                  <Sec titre="Formulaire de réservation">
                    <Champ label="Titre de la section"><Input value={config.titreSection} onChange={v => maj('titreSection', v)} /></Champ>
                    <Champ label="Texte d'introduction"><Textarea rows={3} value={config.descriptionResa} onChange={v => maj('descriptionResa', v)} /></Champ>
                    <Champ label="Message de confirmation"><Textarea rows={3} value={config.messageConfirmation} onChange={v => maj('messageConfirmation', v)} /></Champ>
                  </Sec>
                </div>
              )}

              {onglet === 'contenu' && (
                <div>
                  <Sec titre="Chiffres clés">
                    <ListeLignes items={config.stats} champs={[{ cle: 'valeur', label: 'Valeur' }, { cle: 'label', label: 'Texte' }]} onChange={v => maj('stats', v)} ajout={{ valeur: '', label: '' }} />
                  </Sec>
                  <Sec titre="Comment ça marche">
                    <ListeLignes items={config.etapes} champs={[{ cle: 'titre', label: 'Titre' }, { cle: 'texte', label: 'Texte', long: true }]} onChange={v => maj('etapes', v)} ajout={{ titre: '', texte: '' }} />
                  </Sec>
                  <Sec titre="Questions fréquentes">
                    <ListeLignes items={config.faq} champs={[{ cle: 'q', label: 'Question' }, { cle: 'a', label: 'Réponse', long: true }]} onChange={v => maj('faq', v)} ajout={{ q: '', a: '' }} />
                  </Sec>
                  <Sec titre="Galerie">
                    <ListeLignes items={config.galerie} champs={[{ cle: 'url', label: 'URL de la photo' }, { cle: 'titre', label: 'Légende' }]} onChange={v => maj('galerie', v)} ajout={{ url: '', titre: '' }} />
                  </Sec>
                </div>
              )}

              {onglet === 'contact' && (
                <div>
                  <Sec titre="Coordonnées">
                    <Champ label="Adresse"><Input value={config.adresse} onChange={v => maj('adresse', v)} /></Champ>
                    <Champ label="Ville"><Input value={config.ville} onChange={v => maj('ville', v)} /></Champ>
                    <Champ label="Téléphone"><Input value={config.telephone} onChange={v => maj('telephone', v)} /></Champ>
                    <Champ label="Courriel"><Input value={config.email} onChange={v => maj('email', v)} /></Champ>
                  </Sec>
                  <Sec titre="Réseaux">
                    <Champ label="Instagram (nom d'utilisateur)"><Input value={config.instagram} onChange={v => maj('instagram', v)} /></Champ>
                    <Champ label="Facebook (nom de la page)"><Input value={config.facebook} onChange={v => maj('facebook', v)} /></Champ>
                    <Champ label="Site web"><Input value={config.siteExterne} onChange={v => maj('siteExterne', v)} placeholder="https://..." /></Champ>
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ APERÇU ══ */}
        <div className="panneau-preview" style={{ flex: 1, overflow: 'auto', background: '#e8e6f0', display: 'flex', justifyContent: 'center', padding: device === 'mobile' ? 20 : 0 }}>
          <div style={{ width: device === 'mobile' ? 390 : '100%', background: '#14112b', boxShadow: device === 'mobile' ? '0 8px 40px rgba(0,0,0,0.25)' : 'none', borderRadius: device === 'mobile' ? 20 : 0, overflow: 'hidden', height: device === 'mobile' ? 'calc(100vh - 100px)' : '100%', overflowY: 'auto' }}>
            <TemplateLocationAstro config={config} isPreviewMobile={device === 'mobile'} />
          </div>
        </div>
      </div>
    </div>
  );
}