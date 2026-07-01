// src/pages/studio/ConfigTemplateBoutiqueSimple.tsx
// e-Vend Studio — Configurateur Boutique Mono-Produit Simple

import { useState, useCallback, useEffect } from 'react';
import TemplateBoutiqueSimple, { DEFAUTS_PAR_TYPE } from '../../templates/TemplateBoutiqueSimple';
import type { ConfigBoutiqueSimple, TypeBoutique, VarianteProduit } from '../../templates/TemplateBoutiqueSimple';
import { CONFIG_BOUTIQUE_SIMPLE_DEFAUT } from '../../templates/TemplateBoutiqueSimple';

type Onglet = 'type' | 'produit' | 'photos' | 'variantes' | 'livraison' | 'avis' | 'style';
const CP = '#c9a96e';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Textarea = ({ value, onChange, placeholder, rows = 4 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{desc}</p>}
    {children}
  </div>
);

const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

const TYPES_BOUTIQUE: Record<TypeBoutique, { label: string; icone: string; couleur: string }> = {
  electronique: { label: 'Électronique',        icone: '📱', couleur: '#1a1a1a' },
  mode:         { label: 'Mode & Fashion',       icone: '👗', couleur: '#ec4899' },
  bebe:         { label: 'Bébé & Enfant',        icone: '🍼', couleur: '#6366f1' },
  animaux:      { label: 'Animaux',              icone: '🐾', couleur: '#16a34a' },
  maison:       { label: 'Maison & Déco',        icone: '🏠', couleur: '#d97706' },
  sport:        { label: 'Sport & Plein air',    icone: '⚽', couleur: '#dc2626' },
  beaute:       { label: 'Beauté & Santé',       icone: '💄', couleur: '#f97316' },
  art:          { label: 'Art & Artisanat',      icone: '🎨', couleur: '#8b5cf6' },
};

const PALETTES = [
  { nom: 'Noir/Or',    cp: '#1a1a1a', cs: '#c9a96e', cf: '#ffffff', ct: '#1a1a1a' },
  { nom: 'Rose',       cp: '#ec4899', cs: '#1a1a1a', cf: '#fff0f8', ct: '#1a1a1a' },
  { nom: 'Violet',     cp: '#8b5cf6', cs: '#1a1a1a', cf: '#faf5ff', ct: '#1a1a1a' },
  { nom: 'Vert',       cp: '#16a34a', cs: '#14532d', cf: '#f0fdf4', ct: '#14532d' },
  { nom: 'Orange',     cp: '#f97316', cs: '#1a1a1a', cf: '#fff7ed', ct: '#1a1a1a' },
  { nom: 'Bleu',       cp: '#3b82f6', cs: '#0f172a', cf: '#f8fafc', ct: '#0f172a' },
];

interface Props {
  vendeurId: string;
  templateId?: string;
  configInitiale?: Partial<ConfigBoutiqueSimple>;
  onSauvegarde?: (config: ConfigBoutiqueSimple) => Promise<void>;
}

export default function ConfigTemplateBoutiqueSimple({ vendeurId, templateId, configInitiale, onSauvegarde }: Props) {
  const typeInitial = (configInitiale?.typeBoutique || 'electronique') as TypeBoutique;
  const defauts = DEFAUTS_PAR_TYPE[typeInitial] || {};

  const [config, setConfig]           = useState<ConfigBoutiqueSimple>({ ...CONFIG_BOUTIQUE_SIMPLE_DEFAUT, ...defauts, ...configInitiale, typeBoutique: typeInitial });
  const [onglet, setOnglet]           = useState<Onglet>('produit');
  const [device, setDevice]           = useState<'desktop' | 'mobile'>('desktop');
  const [modePreview, setModePreview] = useState(false);
  const [sauvegarde, setSauvegarde]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const s = sessionStorage.getItem('studio_boutique_onglet') as Onglet | null;
    if (s) setOnglet(s);
  }, []);

  const maj = useCallback(<K extends keyof ConfigBoutiqueSimple>(champ: K, val: ConfigBoutiqueSimple[K]) => {
    setConfig(prev => ({ ...prev, [champ]: val }));
    setSauvegarde('idle');
  }, []);

  const sauvegarder = async () => {
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, template_id: templateId || 'boutique-simple' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('saved');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch { setSauvegarde('error'); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'type',      label: 'Type',      icone: '🏷️' },
    { id: 'produit',   label: 'Produit',   icone: '📦' },
    { id: 'photos',    label: 'Photos',    icone: '📷' },
    { id: 'variantes', label: 'Variantes', icone: '🎨' },
    { id: 'livraison', label: 'Livraison', icone: '🚚' },
    { id: 'avis',      label: 'Avis',      icone: '⭐' },
    { id: 'style',     label: 'Style',     icone: '🎨' },
  ];

  const ti = TYPES_BOUTIQUE[config.typeBoutique];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *, *::before, *::after { box-sizing: border-box; } input[type=color] { width: 40px; height: 32px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; }`}</style>

      {/* TOP BAR */}
      <div style={{ background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: CP }}>e-Vend Studio</span>
          <span style={{ color: '#444' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>{ti.icone} Boutique Simple — {ti.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#333', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? CP : 'transparent', border: 'none', color: device === d ? '#000' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? CP : '#333', border: 'none', borderRadius: 6, color: modePreview ? '#000' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={sauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : CP, color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* PANNEAU CONFIG */}
        {!modePreview && (
          <div style={{ width: 380, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            {/* Badge */}
            <div style={{ padding: '10px 18px', background: `${ti.couleur}12`, borderBottom: `2px solid ${ti.couleur}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{ti.icone}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: ti.couleur, margin: 0 }}>Boutique Simple — {ti.label}</p>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>Tout sur une page · Checkout intégré</p>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => { setOnglet(o.id); sessionStorage.setItem('studio_boutique_onglet', o.id); }}
                  style={{ flex: 1, padding: '8px 2px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? `2px solid ${CP}` : '2px solid transparent', color: onglet === o.id ? CP : '#888', fontSize: 8, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{o.icone}</div>
                  {o.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {/* ── TYPE ── */}
              {onglet === 'type' && (
                <div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>Choisissez la catégorie de votre produit.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(Object.entries(TYPES_BOUTIQUE) as [TypeBoutique, any][]).map(([id, t]) => (
                      <div key={id} onClick={() => {
                        const d = DEFAUTS_PAR_TYPE[id] || {};
                        setConfig(prev => ({ ...prev, ...d, typeBoutique: id }));
                        setSauvegarde('idle');
                      }}
                        style={{ padding: '12px 14px', borderRadius: 8, border: `2px solid ${config.typeBoutique === id ? t.couleur : '#e5e7eb'}`, background: config.typeBoutique === id ? `${t.couleur}10` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 22 }}>{t.icone}</span>
                        <p style={{ fontSize: 14, fontWeight: config.typeBoutique === id ? 700 : 500, color: config.typeBoutique === id ? t.couleur : '#1a1a1a', margin: 0 }}>{t.label}</p>
                        {config.typeBoutique === id && <span style={{ marginLeft: 'auto', color: t.couleur, fontWeight: 700 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRODUIT ── */}
              {onglet === 'produit' && (
                <div>
                  <Sec titre="Votre entreprise">
                    <Champ label="Nom de l'entreprise / boutique">
                      <Input value={config.nomEntreprise} onChange={(v: string) => maj('nomEntreprise', v)} placeholder="Ma Boutique" />
                    </Champ>
                    <Champ label="Slogan (optionnel)">
                      <Input value={config.slogan} onChange={(v: string) => maj('slogan', v)} placeholder="Qualité garantie" />
                    </Champ>
                    <Champ label="URL du logo">
                      <Input value={config.logoUrl} onChange={(v: string) => maj('logoUrl', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                  <Sec titre="Votre produit">
                    <Champ label="Nom du produit *">
                      <Input value={config.nomProduit} onChange={(v: string) => maj('nomProduit', v)} placeholder="Mon super produit" />
                    </Champ>
                    <Champ label="Description courte" desc="Accroche — 1-2 lignes max">
                      <Textarea value={config.descriptionCourte} onChange={(v: string) => maj('descriptionCourte', v)} rows={2} />
                    </Champ>
                    <Champ label="Description complète" desc="Détails, caractéristiques, avantages">
                      <Textarea value={config.descriptionLongue} onChange={(v: string) => maj('descriptionLongue', v)} rows={8} />
                    </Champ>
                  </Sec>
                  <Sec titre="Prix et stock">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Champ label="Prix ($) *">
                        <input type="number" min={0} step={0.01} value={config.prix}
                          onChange={e => maj('prix', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                      </Champ>
                      <Champ label="Prix barré ($)" desc="Prix avant rabais">
                        <input type="number" min={0} step={0.01} value={config.prixAvant || ''}
                          onChange={e => maj('prixAvant', parseFloat(e.target.value) || undefined)}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                      </Champ>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div onClick={() => maj('enStock', !config.enStock)}
                        style={{ width: 40, height: 22, borderRadius: 11, background: config.enStock ? CP : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: config.enStock ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#555' }}>En stock</span>
                    </div>
                    {config.enStock && (
                      <Champ label="Quantité en stock (optionnel)">
                        <input type="number" min={1} value={config.nbEnStock || ''}
                          onChange={e => maj('nbEnStock', parseInt(e.target.value) || undefined)}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                      </Champ>
                    )}
                  </Sec>
                </div>
              )}

              {/* ── PHOTOS ── */}
              {onglet === 'photos' && (
                <div>
                  <Sec titre="Photos du produit (max 8)">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 1.5 }}>La première photo est la photo principale. Recommandé: format carré 800x800px.</p>
                    {config.photosProduit.map((url, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        {url && <img src={url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: `2px solid ${i === 0 ? CP : '#e5e7eb'}` }} onError={e => (e.currentTarget.style.display='none')} />}
                        <Input value={url} onChange={(v: string) => { const a = [...config.photosProduit]; a[i] = v; maj('photosProduit', a); }} placeholder={`URL photo ${i+1}${i === 0 ? ' (principale)' : ''}`} />
                        <button onClick={() => maj('photosProduit', config.photosProduit.filter((_, idx) => idx !== i))}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    {config.photosProduit.length < 8 && (
                      <button onClick={() => maj('photosProduit', [...config.photosProduit, ''])}
                        style={{ width: '100%', padding: '8px', border: '1.5px dashed #d0c9bb', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 }}>
                        + Ajouter une photo
                      </button>
                    )}
                  </Sec>
                  <Sec titre="Vidéo (optionnel)">
                    <Champ label="URL YouTube ou vidéo directe">
                      <Input value={config.videoUrl || ''} onChange={(v: string) => maj('videoUrl', v)} placeholder="https://youtube.com/watch?v=..." />
                    </Champ>
                  </Sec>
                </div>
              )}

              {/* ── VARIANTES ── */}
              {onglet === 'variantes' && (
                <div>
                  <Sec titre="Variantes du produit">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 1.5 }}>
                      Ajoutez des variantes comme la couleur, la taille, le format, etc. Le client choisira avant de commander.
                    </p>
                    {config.variantes.map((v, i) => (
                      <div key={i} style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 12, border: `1px solid ${CP}20` }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                          <Input value={v.nom} onChange={(val: string) => { const a = [...config.variantes]; a[i] = { ...a[i], nom: val }; maj('variantes', a); }} placeholder="ex: Couleur, Taille..." />
                          <button onClick={() => maj('variantes', config.variantes.filter((_, idx) => idx !== i))}
                            style={{ background: '#fee2e2', border: 'none', borderRadius: 4, width: 32, height: 36, cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {v.options.map((opt, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${CP}15`, border: `1px solid ${CP}40`, borderRadius: 20, padding: '3px 10px' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: CP }}>{opt}</span>
                              <button onClick={() => { const a = [...config.variantes]; a[i].options = a[i].options.filter((_, idx) => idx !== j); maj('variantes', a); }}
                                style={{ background: 'none', border: 'none', color: CP, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input placeholder="Ajouter une option..." onKeyDown={e => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                              const a = [...config.variantes];
                              a[i].options.push((e.target as HTMLInputElement).value.trim());
                              maj('variantes', a);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                            style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                          <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center' }}>↵ Entrée</span>
                        </div>
                      </div>
                    ))}
                    {config.variantes.length < 4 && (
                      <button onClick={() => maj('variantes', [...config.variantes, { nom: '', options: [] }])}
                        style={{ width: '100%', padding: '8px', border: '1.5px dashed #d0c9bb', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 }}>
                        + Ajouter un type de variante
                      </button>
                    )}
                  </Sec>
                </div>
              )}

              {/* ── LIVRAISON ── */}
              {onglet === 'livraison' && (
                <div>
                  <Sec titre="Livraison">
                    <Champ label="Frais de livraison ($)" desc="Mettez 0 pour la livraison gratuite">
                      <input type="number" min={0} step={0.01} value={config.fraisLivraison}
                        onChange={e => maj('fraisLivraison', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                    </Champ>
                    <Champ label="Délai de livraison">
                      <Input value={config.delaiLivraison} onChange={(v: string) => maj('delaiLivraison', v)} placeholder="3-5 jours ouvrables" />
                    </Champ>
                    <Champ label="Politique de retour">
                      <Input value={config.retourPolitique} onChange={(v: string) => maj('retourPolitique', v)} placeholder="Retour gratuit sous 30 jours" />
                    </Champ>
                    <Champ label="Garantie">
                      <Input value={config.garantie} onChange={(v: string) => maj('garantie', v)} placeholder="2 ans de garantie" />
                    </Champ>
                  </Sec>
                  <Sec titre="Contact">
                    <Champ label="Courriel affiché"><Input value={config.email} onChange={(v: string) => maj('email', v)} placeholder="contact@maboutique.ca" /></Champ>
                    <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => maj('telephone', v)} placeholder="(514) 555-0123" /></Champ>
                  </Sec>
                  <Sec titre="Message de confirmation">
                    <Textarea value={config.messageConfirmation} onChange={(v: string) => maj('messageConfirmation', v)} rows={3} />
                  </Sec>
                </div>
              )}

              {/* ── AVIS ── */}
              {onglet === 'avis' && (
                <div>
                  <Sec titre="Avis clients">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Ajoutez de vrais avis de vos clients pour renforcer la confiance.</p>
                    {config.avis.map((a, i) => (
                      <div key={i} style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Input value={a.nom} onChange={(v: string) => { const arr = [...config.avis]; arr[i] = { ...arr[i], nom: v }; maj('avis', arr); }} placeholder="Nom du client" />
                          <select value={a.note} onChange={e => { const arr = [...config.avis]; arr[i] = { ...arr[i], note: parseInt(e.target.value) }; maj('avis', arr); }}
                            style={{ padding: '9px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', flexShrink: 0, width: 70 }}>
                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                          </select>
                        </div>
                        <Textarea value={a.texte} onChange={(v: string) => { const arr = [...config.avis]; arr[i] = { ...arr[i], texte: v }; maj('avis', arr); }} placeholder="Texte de l'avis..." rows={2} />
                        <button onClick={() => maj('avis', config.avis.filter((_, idx) => idx !== i))}
                          style={{ marginTop: 6, background: '#fee2e2', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}>Retirer</button>
                      </div>
                    ))}
                    <button onClick={() => maj('avis', [...config.avis, { nom: '', note: 5, texte: '', date: new Date().toISOString().split('T')[0] }])}
                      style={{ width: '100%', padding: '8px', border: '1.5px dashed #d0c9bb', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 }}>
                      + Ajouter un avis
                    </button>
                  </Sec>
                </div>
              )}

              {/* ── STYLE ── */}
              {onglet === 'style' && (
                <div>
                  <Sec titre="Palettes prédéfinies">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {PALETTES.map(p => (
                        <button key={p.nom} onClick={() => { maj('couleurPrincipale', p.cp); maj('couleurSecondaire', p.cs); maj('couleurFond', p.cf); maj('couleurTexte', p.ct); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: p.cf, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.cp }} />
                          <span style={{ color: p.ct }}>{p.nom}</span>
                        </button>
                      ))}
                    </div>
                  </Sec>
                  <Sec titre="Couleurs personnalisées">
                    {[
                      { champ: 'couleurPrincipale' as const, label: 'Couleur principale', desc: 'Boutons, prix, accents' },
                      { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire', desc: 'Footer, éléments secondaires' },
                      { champ: 'couleurFond'       as const, label: 'Fond général',       desc: 'Arrière-plan' },
                      { champ: 'couleurTexte'      as const, label: 'Texte principal',    desc: 'Titres et corps de texte' },
                    ].map(({ champ, label, desc }) => (
                      <div key={champ} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={config[champ] as string} onChange={e => maj(champ, e.target.value)} />
                          <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{config[champ] as string}</span>
                        </div>
                      </div>
                    ))}
                  </Sec>
                  <Sec titre="Typographie">
                    {([
                      { id: 'moderne',   label: 'Moderne',   desc: 'Inter — contemporaine', font: "'Inter', sans-serif" },
                      { id: 'classique', label: 'Classique', desc: 'Playfair — élégante',   font: "'Playfair Display', serif" },
                    ] as const).map(p => (
                      <div key={p.id} onClick={() => maj('police', p.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${config.police === p.id ? CP : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: config.police === p.id ? `${CP}0d` : '#fff', marginBottom: 8 }}>
                        <p style={{ fontFamily: p.font, fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{p.desc}</p>
                      </div>
                    ))}
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW */}
        <div style={{ flex: 1, background: '#e8e8e8', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: device === 'mobile' ? 390 : '100%',
            maxWidth: device === 'mobile' ? 390 : 1200,
            background: '#fff', borderRadius: device === 'mobile' ? 28 : 8,
            overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: device === 'mobile' ? '8px solid #1a1a1a' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <TemplateBoutiqueSimple
              key={config.typeBoutique}
              config={config}
              isPreviewMobile={device === 'mobile'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}