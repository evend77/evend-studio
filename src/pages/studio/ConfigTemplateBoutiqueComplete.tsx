// src/pages/studio/ConfigTemplateBoutiqueComplete.tsx
// e-Vend Studio — Configurateur Boutique Complète (dashboard vendeur)

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_BOUTIQUE_COMPLETE_DEFAUT,
  type ConfigBoutiqueComplete,
  type Produit,
  type VarianteProduit,
} from '../../templates/TemplateBoutiqueComplete';

// ─── TYPES LOCAUX ─────────────────────────────────────────────────────────────

type Onglet = 'general' | 'produits' | 'apparence' | 'livraison' | 'contact';

interface Props {
  vendeurId: string;
  templateId?: string;
  onSauvegarde: (config: ConfigBoutiqueComplete) => Promise<void>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const SOUS_TYPES = [
  { value: 'electronique', label: '💻 Électronique' },
  { value: 'mode',         label: '👗 Mode & Vêtements' },
  { value: 'bebe',         label: '🍼 Bébé & Enfants' },
  { value: 'animaux',      label: '🐾 Animaux' },
  { value: 'maison',       label: '🏠 Maison & Déco' },
  { value: 'sport',        label: '⚽ Sport & Plein air' },
  { value: 'beaute',       label: '💄 Beauté & Soins' },
  { value: 'art',          label: '🎨 Art & Artisanat' },
];

const POLICES = [
  { value: 'moderne',    label: 'Moderne (Inter)' },
  { value: 'classique',  label: 'Classique (Playfair)' },
  { value: 'manuscrite', label: 'Manuscrite (Dancing Script)' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};

const sectionStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
  padding: '24px 22px', marginBottom: 20,
};

const btnPrimaire: React.CSSProperties = {
  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

const btnSecondaire: React.CSSProperties = {
  background: '#fff', color: '#444', border: '1.5px solid #e5e7eb',
  borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5',
  borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

// ─── COMPOSANT ÉDITEUR DE PRODUIT ─────────────────────────────────────────────

interface EditorProduitProps {
  produit: Produit;
  onSave: (p: Produit) => void;
  onCancel: () => void;
}

function EditorProduit({ produit, onSave, onCancel }: EditorProduitProps) {
  const [p, setP] = useState<Produit>({ ...produit, photos: [...produit.photos], variantes: produit.variantes.map(v => ({ ...v, options: [...v.options] })) });

  const setChamp = (champ: keyof Produit, val: any) => setP(prev => ({ ...prev, [champ]: val }));

  // Photos
  const ajouterPhoto = () => setP(prev => ({ ...prev, photos: [...prev.photos, { url: '', alt: '' }] }));
  const modifierPhoto = (i: number, champ: 'url' | 'alt', val: string) =>
    setP(prev => { const photos = [...prev.photos]; photos[i] = { ...photos[i], [champ]: val }; return { ...prev, photos }; });
  const supprimerPhoto = (i: number) => setP(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }));

  // Variantes
  const ajouterVariante = () => setP(prev => ({ ...prev, variantes: [...prev.variantes, { nom: 'Taille', options: ['S', 'M', 'L'] }] }));
  const modifierVarianteNom = (i: number, nom: string) =>
    setP(prev => { const variantes = [...prev.variantes]; variantes[i] = { ...variantes[i], nom }; return { ...prev, variantes }; });
  const modifierVarianteOptions = (i: number, val: string) =>
    setP(prev => { const variantes = [...prev.variantes]; variantes[i] = { ...variantes[i], options: val.split(',').map(s => s.trim()).filter(Boolean) }; return { ...prev, variantes }; });
  const supprimerVariante = (i: number) => setP(prev => ({ ...prev, variantes: prev.variantes.filter((_, idx) => idx !== i) }));

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, border: '2px solid #2563eb30', padding: '20px 18px', marginBottom: 16 }}>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>
        {p.id.startsWith('new-') ? '➕ Nouveau produit' : `✏️ Modifier — ${p.nom}`}
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Nom du produit *</label>
          <input style={inputStyle} value={p.nom} onChange={e => setChamp('nom', e.target.value)} placeholder="Ex: T-shirt coton bio" />
        </div>
        <div>
          <label style={labelStyle}>Catégorie</label>
          <input style={inputStyle} value={p.categorie} onChange={e => setChamp('categorie', e.target.value)} placeholder="Ex: Nouveautés" />
        </div>
        <div>
          <label style={labelStyle}>Prix ($) *</label>
          <input style={inputStyle} type="number" min="0" step="0.01" value={p.prix} onChange={e => setChamp('prix', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label style={labelStyle}>Prix barré ($) <span style={{ color: '#aaa', fontWeight: 400 }}>optionnel</span></label>
          <input style={inputStyle} type="number" min="0" step="0.01" value={p.prixAvant || ''} onChange={e => setChamp('prixAvant', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="Ex: 49.99" />
        </div>
        <div>
          <label style={labelStyle}>Stock</label>
          <input style={inputStyle} type="number" min="0" value={p.stock} onChange={e => setChamp('stock', parseInt(e.target.value) || 0)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="vedette" checked={p.vedette} onChange={e => setChamp('vedette', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="vedette" style={{ fontSize: 14, fontWeight: 600, color: '#444', cursor: 'pointer' }}>⭐ Produit vedette</label>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={p.description} onChange={e => setChamp('description', e.target.value)} placeholder="Décrivez votre produit..." />
      </div>

      {/* PHOTOS */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={labelStyle}>Photos</label>
          <button style={{ ...btnSecondaire, padding: '5px 12px', fontSize: 12 }} onClick={ajouterPhoto}>+ Ajouter une photo</button>
        </div>
        {p.photos.map((ph, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={{ ...inputStyle, flex: 2 }} value={ph.url} onChange={e => modifierPhoto(i, 'url', e.target.value)} placeholder="URL de la photo" />
            <input style={{ ...inputStyle, flex: 1 }} value={ph.alt} onChange={e => modifierPhoto(i, 'alt', e.target.value)} placeholder="Description" />
            <button style={btnDanger} onClick={() => supprimerPhoto(i)}>✕</button>
          </div>
        ))}
        {p.photos.length === 0 && <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Aucune photo — ajoutez au moins une URL d'image.</p>}
      </div>

      {/* VARIANTES */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={labelStyle}>Variantes <span style={{ color: '#aaa', fontWeight: 400 }}>optionnel</span></label>
          <button style={{ ...btnSecondaire, padding: '5px 12px', fontSize: 12 }} onClick={ajouterVariante}>+ Variante</button>
        </div>
        {p.variantes.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={{ ...inputStyle, flex: 1 }} value={v.nom} onChange={e => modifierVarianteNom(i, e.target.value)} placeholder="Nom (ex: Couleur)" />
            <input style={{ ...inputStyle, flex: 2 }} value={v.options.join(', ')} onChange={e => modifierVarianteOptions(i, e.target.value)} placeholder="Options séparées par virgule (ex: Rouge, Bleu)" />
            <button style={btnDanger} onClick={() => supprimerVariante(i)}>✕</button>
          </div>
        ))}
        {p.variantes.length === 0 && <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Aucune variante — le client achète directement.</p>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btnSecondaire} onClick={onCancel}>Annuler</button>
        <button style={btnPrimaire} onClick={() => { if (!p.nom.trim()) { alert('Le nom du produit est requis.'); return; } onSave(p); }}>
          Sauvegarder le produit
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function ConfigTemplateBoutiqueComplete({ vendeurId, templateId = 'boutique-complete', onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigBoutiqueComplete>(CONFIG_BOUTIQUE_COMPLETE_DEFAUT);
  const [onglet, setOnglet] = useState<Onglet>('general');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [erreur, setErreur] = useState('');

  // Édition produits
  const [produitEdite, setProduitEdite] = useState<Produit | null>(null);
  const [modeEdition, setModeEdition] = useState<'edit' | 'new' | null>(null);
  const [categoriesFiltresInput, setCategoriesFiltresInput] = useState('');

  // ─── CHARGEMENT CONFIG ──────────────────────────────────────────────────────

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.config && Object.keys(data.config).length > 0) {
            const merged = { ...CONFIG_BOUTIQUE_COMPLETE_DEFAUT, ...data.config };
            setConfig(merged);
            setCategoriesFiltresInput((merged.categoriesFiltres || []).join(', '));
          } else {
            setCategoriesFiltresInput((CONFIG_BOUTIQUE_COMPLETE_DEFAUT.categoriesFiltres || []).join(', '));
          }
        }
      } catch (e) {
        console.error('Erreur chargement config:', e);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [vendeurId]);

  // ─── SAUVEGARDE ─────────────────────────────────────────────────────────────

  const sauvegarder = async () => {
    setSauvegarde(true);
    setErreur('');
    setMessageSucces('');
    try {
      const configFinale: ConfigBoutiqueComplete = {
        ...config,
        categoriesFiltres: ['Tous', ...categoriesFiltresInput.split(',').map(s => s.trim()).filter(s => s && s !== 'Tous')],
      };
      await onSauvegarde(configFinale);
      setConfig(configFinale);
      setMessageSucces('✅ Boutique sauvegardée avec succès !');
      setTimeout(() => setMessageSucces(''), 4000);
    } catch (e) {
      setErreur('❌ Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setSauvegarde(false);
    }
  };

  // ─── CONFIG — setters partiels ────────────────────────────────────────────

  const set = useCallback(<K extends keyof ConfigBoutiqueComplete>(champ: K, val: ConfigBoutiqueComplete[K]) => {
    setConfig(prev => ({ ...prev, [champ]: val }));
  }, []);

  // ─── GESTION PRODUITS ────────────────────────────────────────────────────────

  const nouveauProduit = (): Produit => ({
    id: `new-${Date.now()}`,
    nom: '',
    prix: 0,
    description: '',
    photos: [],
    variantes: [],
    stock: 10,
    vedette: false,
    categorie: 'Nouveautés',
  });

  const sauvegarderProduit = (p: Produit) => {
    setConfig(prev => {
      const existe = prev.produits.find(x => x.id === p.id);
      return {
        ...prev,
        produits: existe
          ? prev.produits.map(x => x.id === p.id ? p : x)
          : [...prev.produits, p],
      };
    });
    setProduitEdite(null);
    setModeEdition(null);
  };

  const supprimerProduit = (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    setConfig(prev => ({ ...prev, produits: prev.produits.filter(p => p.id !== id) }));
  };

  const deplacerProduit = (id: string, dir: 'up' | 'down') => {
    setConfig(prev => {
      const arr = [...prev.produits];
      const i = arr.findIndex(p => p.id === id);
      if (i < 0) return prev;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, produits: arr };
    });
  };

  // ─── ONGLETS ─────────────────────────────────────────────────────────────────

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'general',    label: 'Général',    icone: '🏪' },
    { id: 'produits',   label: 'Produits',   icone: '📦' },
    { id: 'apparence',  label: 'Apparence',  icone: '🎨' },
    { id: 'livraison',  label: 'Livraison',  icone: '🚚' },
    { id: 'contact',    label: 'Contact',    icone: '✉️' },
  ];

  // ─── RENDU ────────────────────────────────────────────────────────────────────

  if (chargement) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#888' }}>Chargement de votre boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* ── EN-TÊTE ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>🏪 Boutique Complète</h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            Configurez votre boutique avec catalogue, panier et comptes acheteurs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href={`/site-preview?vendeurId=${vendeurId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnSecondaire, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            👁 Aperçu
          </a>
          <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1, minWidth: 120 }} onClick={sauvegarder} disabled={sauvegarde}>
            {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {messageSucces && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 600, fontSize: 14 }}>
          {messageSucces}
        </div>
      )}
      {erreur && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>
          {erreur}
        </div>
      )}

      {/* ── ONGLETS ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{
              flex: 1, minWidth: 90, padding: '9px 12px', borderRadius: 9, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? '#2563eb' : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET — GÉNÉRAL                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {onglet === 'general' && (
        <div>
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>🏪 Identité de la boutique</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nom de la boutique *</label>
                <input style={inputStyle} value={config.nomBoutique} onChange={e => set('nomBoutique', e.target.value)} placeholder="Ex: Boutique Éclat" />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select style={{ ...inputStyle }} value={config.sousType} onChange={e => set('sousType', e.target.value as any)}>
                  {SOUS_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Slogan</label>
              <input style={inputStyle} value={config.slogan} onChange={e => set('slogan', e.target.value)} placeholder="Ex: Qualité, style et livraison rapide" />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Description de la boutique</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={config.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez votre boutique en quelques phrases..." />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>🖼 Images</h3>

            <div>
              <label style={labelStyle}>URL du logo</label>
              <input style={inputStyle} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://... (laissez vide pour utiliser la première lettre)" />
            </div>
            {config.logoUrl && (
              <img src={config.logoUrl} alt="Logo" style={{ height: 48, marginTop: 8, borderRadius: 6, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>URL de la bannière hero</label>
              <input style={inputStyle} value={config.banniereUrl} onChange={e => set('banniereUrl', e.target.value)} placeholder="https://... (photo principale de la boutique)" />
            </div>
            {config.banniereUrl && (
              <img src={config.banniereUrl} alt="Bannière" style={{ width: '100%', maxHeight: 140, marginTop: 8, borderRadius: 8, objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>🗂️ Catégories de filtre</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
              Ces catégories apparaîtront comme filtres dans votre boutique. <strong>"Tous"</strong> est ajouté automatiquement.
            </p>
            <label style={labelStyle}>Catégories (séparées par des virgules)</label>
            <input style={inputStyle} value={categoriesFiltresInput} onChange={e => setCategoriesFiltresInput(e.target.value)} placeholder="Ex: Nouveautés, Populaires, Soldes, Été 2025" />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
              Corresponde à la propriété "Catégorie" de chaque produit. Utilisez les mêmes noms.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET — PRODUITS                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {onglet === 'produits' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📦 Mes produits</h3>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{config.produits.length} produit(s) dans votre boutique</p>
            </div>
            {modeEdition !== 'new' && (
              <button style={btnPrimaire} onClick={() => { setProduitEdite(nouveauProduit()); setModeEdition('new'); }}>
                + Nouveau produit
              </button>
            )}
          </div>

          {/* Formulaire nouveau produit */}
          {modeEdition === 'new' && produitEdite && (
            <EditorProduit
              produit={produitEdite}
              onSave={sauvegarderProduit}
              onCancel={() => { setProduitEdite(null); setModeEdition(null); }}
            />
          )}

          {/* Formulaire édition produit existant */}
          {modeEdition === 'edit' && produitEdite && (
            <EditorProduit
              produit={produitEdite}
              onSave={sauvegarderProduit}
              onCancel={() => { setProduitEdite(null); setModeEdition(null); }}
            />
          )}

          {/* Liste produits */}
          {config.produits.length === 0 && modeEdition !== 'new' ? (
            <div style={{ ...sectionStyle, textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
              <p style={{ fontSize: 16, color: '#aaa', marginBottom: 20 }}>Aucun produit dans votre boutique.</p>
              <button style={btnPrimaire} onClick={() => { setProduitEdite(nouveauProduit()); setModeEdition('new'); }}>
                + Ajouter mon premier produit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.produits.map((p, idx) => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${modeEdition === 'edit' && produitEdite?.id === p.id ? '#2563eb' : '#f0f0f8'}`, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Miniature */}
                  <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: '#f5f5fa', flexShrink: 0 }}>
                    {p.photos[0]
                      ? <img src={p.photos[0].url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                    }
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>{p.nom}</p>
                      {p.vedette && <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>⭐ Vedette</span>}
                      <span style={{ fontSize: 11, background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: 12 }}>{p.categorie}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
                      {p.prix.toFixed(2)} $ · Stock: {p.stock}
                      {p.variantes.length > 0 && ` · Variantes: ${p.variantes.map(v => v.nom).join(', ')}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => deplacerProduit(p.id, 'up')} disabled={idx === 0}
                      style={{ ...btnSecondaire, padding: '5px 8px', opacity: idx === 0 ? 0.35 : 1 }} title="Monter">↑</button>
                    <button onClick={() => deplacerProduit(p.id, 'down')} disabled={idx === config.produits.length - 1}
                      style={{ ...btnSecondaire, padding: '5px 8px', opacity: idx === config.produits.length - 1 ? 0.35 : 1 }} title="Descendre">↓</button>
                    <button style={{ ...btnSecondaire, padding: '6px 12px', fontSize: 13 }}
                      onClick={() => {
                        if (modeEdition === 'edit' && produitEdite?.id === p.id) {
                          setProduitEdite(null); setModeEdition(null);
                        } else {
                          setProduitEdite({ ...p, photos: [...p.photos], variantes: p.variantes.map(v => ({ ...v, options: [...v.options] })) });
                          setModeEdition('edit');
                        }
                      }}>
                      {modeEdition === 'edit' && produitEdite?.id === p.id ? '✕ Fermer' : '✏️ Modifier'}
                    </button>
                    <button style={{ ...btnDanger, padding: '6px 12px' }} onClick={() => supprimerProduit(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET — APPARENCE                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {onglet === 'apparence' && (
        <div>
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎨 Couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {[
                { champ: 'couleurPrincipale' as const, label: 'Couleur principale', hint: 'Boutons, prix, badges' },
                { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire',  hint: 'Textes foncés, footer' },
                { champ: 'couleurFond' as const,       label: 'Fond de page',        hint: 'Arrière-plan général' },
                { champ: 'couleurTexte' as const,      label: 'Couleur du texte',    hint: 'Corps de texte' },
              ].map(({ champ, label, hint }) => (
                <div key={champ}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={config[champ]} onChange={e => set(champ, e.target.value)}
                      style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} value={config[champ]} onChange={e => set(champ, e.target.value)} placeholder="#000000" />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {POLICES.map(pol => (
                <div key={pol.value} onClick={() => set('police', pol.value as any)}
                  style={{
                    padding: '12px 20px', borderRadius: 10, border: `2px solid ${config.police === pol.value ? '#2563eb' : '#e5e7eb'}`,
                    background: config.police === pol.value ? '#eff6ff' : '#fff', cursor: 'pointer',
                    fontWeight: 600, fontSize: 14, color: config.police === pol.value ? '#2563eb' : '#444',
                  }}>
                  {pol.label}
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu couleurs */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👁 Aperçu des couleurs</h3>
            <div style={{ background: config.couleurFond, borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
              <p style={{ color: config.couleurTexte, fontWeight: 700, marginBottom: 12, fontSize: 18 }}>{config.nomBoutique}</p>
              <p style={{ color: config.couleurTexte, opacity: 0.7, marginBottom: 16, fontSize: 14 }}>{config.slogan}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={{ background: config.couleurPrincipale, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14 }}>
                  🛒 Ajouter au panier
                </button>
                <button style={{ background: 'transparent', color: config.couleurSecondaire, border: `2px solid ${config.couleurSecondaire}`, borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14 }}>
                  Connexion
                </button>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: config.couleurSecondaire, borderRadius: 8 }}>
                <p style={{ color: '#fff', fontSize: 13, margin: 0 }}>Footer — Propulsé par <span style={{ color: config.couleurPrincipale }}>e-Vend Studio</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET — LIVRAISON                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {onglet === 'livraison' && (
        <div>
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🚚 Frais de livraison</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Frais de livraison standard ($)</label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={config.fraisLivraison} onChange={e => set('fraisLivraison', parseFloat(e.target.value) || 0)} />
                <p style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Frais par défaut appliqués à chaque commande.</p>
              </div>
              <div>
                <label style={labelStyle}>Livraison gratuite à partir de ($)</label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={config.livraisonGratuiteDes} onChange={e => set('livraisonGratuiteDes', parseFloat(e.target.value) || 0)} />
                <p style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Mettez 0 pour ne jamais offrir la livraison gratuite.</p>
              </div>
            </div>

            {config.livraisonGratuiteDes > 0 && (
              <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 8, padding: '12px 16px', border: '1px solid #86efac' }}>
                <p style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, margin: 0 }}>
                  ✅ Livraison gratuite activée dès {config.livraisonGratuiteDes.toFixed(2)} $ d'achat.
                </p>
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Politique de retour</h3>
            <label style={labelStyle}>Texte affiché sur la page produit</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={config.politiqueRetour}
              onChange={e => set('politiqueRetour', e.target.value)}
              placeholder="Ex: Retours acceptés dans les 30 jours suivant la réception." />
          </div>

          <div style={{ ...sectionStyle, background: '#f8fafc' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>ℹ️ Taxes calculées automatiquement</h4>
            <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>
              Les taxes québécoises sont calculées automatiquement à la caisse :<br />
              <strong>TPS (5%)</strong> + <strong>TVQ (9,975%)</strong> = <strong>14,975% au total</strong>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET — CONTACT                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {onglet === 'contact' && (
        <div>
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✉️ Coordonnées</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Courriel de contact</label>
                <input style={inputStyle} type="email" value={config.email} onChange={e => set('email', e.target.value)} placeholder="boutique@exemple.com" />
              </div>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input style={inputStyle} value={config.telephone} onChange={e => set('telephone', e.target.value)} placeholder="514-555-0000" />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={config.adresse} onChange={e => set('adresse', e.target.value)} placeholder="123 rue Principale, Montréal, QC" />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📱 Réseaux sociaux</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Instagram <span style={{ color: '#aaa', fontWeight: 400 }}>(@handle)</span></label>
                <input style={inputStyle} value={config.instagram} onChange={e => set('instagram', e.target.value)} placeholder="maboutique" />
              </div>
              <div>
                <label style={labelStyle}>Facebook <span style={{ color: '#aaa', fontWeight: 400 }}>(@handle)</span></label>
                <input style={inputStyle} value={config.facebook} onChange={e => set('facebook', e.target.value)} placeholder="maboutique" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOUTON SAUVEGARDER FLOTTANT (bas de page) ───────────────────────── */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e5e7eb', margin: '0 -20px -32px', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {messageSucces && <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{messageSucces}</span>}
        <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder la boutique'}
        </button>
      </div>

    </div>
  );
}