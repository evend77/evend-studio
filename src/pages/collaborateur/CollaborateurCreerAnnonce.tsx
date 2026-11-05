// CHEMIN : src/pages/collaborateur/CollaborateurCreerAnnonce.tsx
// e-Vend Studio — Dashboard collaborateur : créer / modifier une annonce
// Adapté de CreerAnnonce.tsx (e-Vend). API : /api/collab/:gestionnaireId/produits, /upload, /categories

import React, { useState, useEffect, useRef } from 'react';

interface Variante { nom: string; prix: string; stock: string; }
interface Props {
  gestionnaireId: number; accent: string; isMobile: boolean;
  produitId: number | null; onRetour: () => void;
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const MAX_PHOTOS = 8;

export default function CollaborateurCreerAnnonce({ gestionnaireId, accent, isMobile, produitId, onRetour }: Props) {
  const base = `/api/collab/${gestionnaireId}`;
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [prixPromo, setPrixPromo] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [categories, setCategories] = useState<{ id: number; nom: string; groupe_nom: string | null }[]>([]);
  const [chargement, setChargement] = useState(!!produitId);
  const [envoi, setEnvoi] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${base}/categories`, { credentials: 'include' }).then(r => (r.ok ? r.json() : [])).then(setCategories).catch(() => {});
  }, [base]);

  useEffect(() => {
    if (!produitId) return;
    (async () => {
      try {
        const res = await fetch(`${base}/produits/${produitId}`, { credentials: 'include' });
        if (!res.ok) { setErreur((await res.json().catch(() => ({}))).error || 'Annonce introuvable'); setChargement(false); return; }
        const p = await res.json();
        setTitre(p.titre || ''); setDescription(p.description || '');
        setPrix(p.prix ?? ''); setPrixPromo(p.prix_promo ?? '');
        setStock(p.stock === null || p.stock === undefined ? '' : String(p.stock));
        setSku(p.sku || ''); setCategorieId(p.categorie_id ? String(p.categorie_id) : '');
        setPhotos(Array.isArray(p.photos) ? p.photos : []);
        setVariantes((Array.isArray(p.variantes) ? p.variantes : []).map((v: any) => ({
          nom: v.nom || '', prix: v.prix === null || v.prix === undefined ? '' : String(v.prix), stock: v.stock === null || v.stock === undefined ? '' : String(v.stock),
        })));
      } catch { setErreur('Erreur réseau'); }
      setChargement(false);
    })();
  }, [base, produitId]);

  const envoyerImages = async (liste: FileList | null) => {
    if (!liste || !liste.length) return;
    setEnvoi(true); setErreur('');
    const ajoutees: string[] = [];
    for (const f of Array.from(liste)) {
      if (photos.length + ajoutees.length >= MAX_PHOTOS) { setErreur(`Maximum ${MAX_PHOTOS} photos`); break; }
      const fd = new FormData(); fd.append('file', f);
      try {
        const res = await fetch(`${base}/upload`, { method: 'POST', credentials: 'include', body: fd });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.url) ajoutees.push(j.url); else { setErreur(j.error || 'Envoi impossible'); break; }
      } catch { setErreur('Erreur réseau'); break; }
    }
    setPhotos(p => [...p, ...ajoutees]);
    setEnvoi(false);
    if (fichier.current) fichier.current.value = '';
  };

  const deplacer = (i: number, d: number) => setPhotos(p => {
    const n = [...p]; const j = i + d;
    if (j < 0 || j >= n.length) return p;
    [n[i], n[j]] = [n[j], n[i]]; return n;
  });

  const enregistrer = async (statut: 'actif' | 'brouillon') => {
    setErreur('');
    if (!titre.trim()) { setErreur('Le titre est obligatoire'); return; }
    if (prix === '' || Number(prix) < 0) { setErreur('Le prix est obligatoire'); return; }
    if (categories.length > 0 && !categorieId) { setErreur('Choisissez une catégorie'); return; }
    if (prixPromo !== '' && Number(prixPromo) >= Number(prix)) { setErreur('Le prix promo doit être inférieur au prix'); return; }
    setSauvegarde(true);
    try {
      const res = await fetch(produitId ? `${base}/produits/${produitId}` : `${base}/produits`, {
        method: produitId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre, description, prix, prix_promo: prixPromo, stock, sku, categorie_id: categorieId || null, photos, statut,
          variantes: variantes.filter(v => v.nom.trim()).map(v => ({ nom: v.nom, prix: v.prix, stock: v.stock })),
        }),
      });
      if (res.ok) { onRetour(); return; }
      setErreur((await res.json().catch(() => ({}))).error || 'Enregistrement impossible');
    } catch { setErreur('Erreur réseau'); }
    setSauvegarde(false);
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 16 };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onRetour} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}>← Retour</button>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>{produitId ? '✏️ Modifier l\'annonce' : '➕ Nouvelle annonce'}</h2>
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      <div style={carte}>
        <label style={lbl}>Titre *</label>
        <input value={titre} onChange={e => setTitre(e.target.value)} maxLength={150} placeholder="Ex : Sac en cuir fait main" style={{ ...champ, marginBottom: 14 }} />
        <label style={lbl}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} rows={6} placeholder="Décrivez votre produit (texte seulement)" style={{ ...champ, resize: 'vertical' }} />
        <div style={{ textAlign: 'right', fontSize: 11, color: T.light }}>{description.length} / 5000</div>
      </div>

      <div style={carte}>
        <label style={lbl}>Photos ({photos.length}/{MAX_PHOTOS}) — la première est la photo principale</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {photos.map((u, i) => (
            <div key={u} style={{ width: 96, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
              <img src={u} alt="" style={{ width: 96, height: 96, objectFit: 'cover', display: 'block' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 3 }}>
                <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}>◀</button>
                <button onClick={() => setPhotos(p => p.filter((_, k) => k !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.danger }}>✕</button>
                <button onClick={() => deplacer(i, 1)} disabled={i === photos.length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: i === photos.length - 1 ? 0.3 : 1 }}>▶</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button onClick={() => fichier.current?.click()} disabled={envoi}
              style={{ width: 96, height: 96, border: `2px dashed ${T.border}`, borderRadius: 8, background: '#fff', cursor: 'pointer', color: T.light, fontSize: 12 }}>
              {envoi ? '⏳' : '📷\nAjouter'}
            </button>
          )}
        </div>
        <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }} onChange={e => envoyerImages(e.target.files)} />
        <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>JPEG, PNG, WebP ou GIF · 5 Mo maximum par image</p>
      </div>

      <div style={carte}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
          <div><label style={lbl}>Prix ($) *</label><input type="number" min="0" step="0.01" value={prix} onChange={e => setPrix(e.target.value)} style={champ} /></div>
          <div><label style={lbl}>Prix promo ($)</label><input type="number" min="0" step="0.01" value={prixPromo} onChange={e => setPrixPromo(e.target.value)} style={champ} /></div>
          <div><label style={lbl}>Stock</label><input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="Illimité" style={champ} /></div>
          <div><label style={lbl}>SKU</label><input value={sku} onChange={e => setSku(e.target.value)} maxLength={60} style={champ} /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={lbl}>Catégorie *</label>
          {categories.length > 0 ? (
            <select value={categorieId} onChange={e => setCategorieId(e.target.value)} style={champ}>
              <option value="">— Choisir une catégorie —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.groupe_nom ? `${c.groupe_nom} › ` : ''}{c.nom}</option>)}
              {categorieId && !categories.some(c => String(c.id) === categorieId) && <option value={categorieId}>Catégorie actuelle (désactivée)</option>}
            </select>
          ) : <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Le gestionnaire n'a pas encore créé de catégories.</p>}
        </div>
      </div>

      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...lbl, margin: 0 }}>Variantes (taille, couleur…)</label>
          {variantes.length < 20 && <button onClick={() => setVariantes(v => [...v, { nom: '', prix: '', stock: '' }])} style={{ border: `1px solid ${accent}`, color: accent, background: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter</button>}
        </div>
        {variantes.length === 0 && <p style={{ fontSize: 12, color: T.light, margin: 0 }}>Aucune variante — le produit est vendu tel quel.</p>}
        {variantes.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 32px' : '2fr 1fr 1fr 32px', gap: 8, marginBottom: 8 }}>
            <input value={v.nom} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, nom: e.target.value } : x)))} maxLength={60} placeholder="Nom (ex : Rouge, M)" style={{ ...champ, gridColumn: isMobile ? '1 / 4' : undefined }} />
            <input type="number" min="0" step="0.01" value={v.prix} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, prix: e.target.value } : x)))} placeholder="Prix ($)" style={champ} />
            <input type="number" min="0" step="1" value={v.stock} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, stock: e.target.value } : x)))} placeholder="Stock" style={champ} />
            <button onClick={() => setVariantes(a => a.filter((_, k) => k !== i))} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button disabled={sauvegarde} onClick={() => enregistrer('brouillon')} style={{ padding: '11px 20px', border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          💾 Enregistrer en brouillon
        </button>
        <button disabled={sauvegarde} onClick={() => enregistrer('actif')} style={{ padding: '11px 20px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          {sauvegarde ? '⏳ Enregistrement…' : '🚀 Publier'}
        </button>
      </div>
    </div>
  );
}