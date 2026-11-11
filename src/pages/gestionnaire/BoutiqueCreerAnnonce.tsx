// CHEMIN : src/pages/gestionnaire/BoutiqueCreerAnnonce.tsx
// e-Vend Studio — Créer / modifier une annonce des templates boutique (solo). Le gestionnaire est son propre vendeur.
// Basé sur la page « annonce » du collaborateur MV, sans règles de marketplace (pas d'approbation).
// API : /api/boutique/gestionnaire/produits, /upload, /categories — aucun lien avec le MV.

import React, { useEffect, useRef, useState } from 'react';
import { BQ, bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Variante { nom: string; prix: string; stock: string; }
interface Categorie { id: number; nom: string; groupe_nom: string | null; }

interface Props {
  gestionnaireId: number;
  produitId: number | null;
  accent?: string;
  isMobile?: boolean;
  /** Page « Mon plan & limites » du template actuel (ex. premium-plan), pour le bouton du message de limite */
  pagePlan?: string;
  naviguerVers?: (page: string) => void;
  onRetour: () => void;
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const MAX_PHOTOS = 8;

export default function BoutiqueCreerAnnonce({ produitId, accent, isMobile, pagePlan, naviguerVers, onRetour }: Props) {
  const couleur = accent || '#4f46e5';
  const mobile = !!isMobile;
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [prixPromo, setPrixPromo] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [quantiteMin, setQuantiteMin] = useState('');
  const [prixRevient, setPrixRevient] = useState('');
  const [poids, setPoids] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(!!produitId);
  const [envoi, setEnvoi] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [erreurLimite, setErreurLimite] = useState('');
  const [succes, setSucces] = useState('');
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bq('/categories').then(r => { if (r.ok && Array.isArray(r.data)) setCategories(r.data); });
  }, []);

  useEffect(() => {
    if (!produitId) return;
    (async () => {
      const r = await bq(`/produits/${produitId}`);
      if (!r.ok) { setErreur(messageErreur(r)); setChargement(false); return; }
      const p = r.data;
      setTitre(p.titre || ''); setDescription(p.description || '');
      setPrix(p.prix === null || p.prix === undefined ? '' : String(Number(p.prix)));
      setPrixPromo(p.prix_promo === null || p.prix_promo === undefined ? '' : String(Number(p.prix_promo)));
      setStock(p.stock === null || p.stock === undefined ? '' : String(p.stock));
      setSku(p.sku || '');
      setQuantiteMin(p.quantite_min ? String(p.quantite_min) : '');
      setPrixRevient(p.prix_revient === null || p.prix_revient === undefined ? '' : String(Number(p.prix_revient)));
      setPoids(p.poids === null || p.poids === undefined ? '' : String(Number(p.poids)));
      setCategorieId(p.categorie_id ? String(p.categorie_id) : '');
      setPhotos(Array.isArray(p.photos) ? p.photos : []);
      setVariantes((Array.isArray(p.variantes) ? p.variantes : []).map((v: any) => ({
        nom: v.nom || '',
        prix: v.prix === null || v.prix === undefined ? '' : String(v.prix),
        stock: v.stock === null || v.stock === undefined ? '' : String(v.stock),
      })));
      setChargement(false);
    })();
  }, [produitId]);

  const envoyerImages = async (liste: FileList | null) => {
    if (!liste || !liste.length) return;
    setEnvoi(true); setErreur('');
    const ajoutees: string[] = [];
    let token: string | null = null;
    try { token = localStorage.getItem('token'); } catch (e) { token = null; }
    for (const f of Array.from(liste)) {
      if (photos.length + ajoutees.length >= MAX_PHOTOS) { setErreur(`Maximum ${MAX_PHOTOS} photos`); break; }
      const fd = new FormData(); fd.append('file', f);
      try {
        const res = await fetch(`${BQ}/upload`, { method: 'POST', credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.url) ajoutees.push(j.url); else { setErreur(j.error || 'Envoi impossible'); break; }
      } catch (e) { setErreur('Erreur réseau'); break; }
    }
    setPhotos(p => p.concat(ajoutees));
    setEnvoi(false);
    if (fichier.current) fichier.current.value = '';
  };

  const deplacer = (i: number, d: number) => setPhotos(p => {
    const n = p.slice(); const j = i + d;
    if (j < 0 || j >= n.length) return p;
    const tmp = n[i]; n[i] = n[j]; n[j] = tmp; return n;
  });

  const enregistrer = async (statut: 'actif' | 'brouillon') => {
    setErreur('');
    if (!titre.trim()) { setErreur('Le titre est obligatoire'); return; }
    if (prix === '' || !Number.isFinite(Number(prix)) || Number(prix) < 0.01) { setErreur('Le prix est obligatoire (au moins 0,01 $)'); return; }
    if (prixPromo !== '' && Number(prixPromo) >= Number(prix)) { setErreur('Le prix promo doit être inférieur au prix'); return; }
    if (quantiteMin !== '' && (!Number.isInteger(Number(quantiteMin)) || Number(quantiteMin) < 1 || Number(quantiteMin) > 9999)) { setErreur('La quantité minimum doit être un nombre entier entre 1 et 9 999'); return; }
    if (poids !== '' && (!Number.isFinite(Number(poids)) || Number(poids) < 0)) { setErreur('Le poids est invalide'); return; }
    if (prixRevient !== '' && (!Number.isFinite(Number(prixRevient)) || Number(prixRevient) < 0)) { setErreur('Le prix de revient est invalide'); return; }
    for (const v of variantes) {
      if (v.nom.trim() && v.prix !== '' && Number(v.prix) < 0.01) { setErreur(`Variante « ${v.nom.trim()} » : le prix doit être d'au moins 0,01 $`); return; }
    }
    setSauvegarde(true);
    const r = await bq(produitId ? `/produits/${produitId}` : '/produits', {
      method: produitId ? 'PUT' : 'POST',
      body: {
        titre, description, prix, prix_promo: prixPromo, stock, sku, quantite_min: quantiteMin, prix_revient: prixRevient,
        poids: poids === '' ? null : poids, categorie_id: categorieId || null, photos, statut,
        variantes: variantes.filter(v => v.nom.trim()).map(v => ({ nom: v.nom, prix: v.prix, stock: v.stock })),
      },
    });
    setSauvegarde(false);
    if (r.ok) {
      setSucces(statut === 'brouillon' ? 'Votre annonce a été enregistrée en brouillon.' : produitId ? 'Votre annonce a été mise à jour.' : 'Votre annonce est publiée.');
      return;
    }
    if (r.data && r.data.code === 'LIMITE_ANNONCES') setErreurLimite(messageErreur(r));
    else setErreur(messageErreur(r));
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: mobile ? 14 : 20, marginBottom: 16 };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  const vente = prixPromo !== '' && Number(prixPromo) > 0 && Number(prixPromo) < Number(prix) ? Number(prixPromo) : Number(prix);
  const profit = vente - Number(prixRevient);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onRetour} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}>← Retour</button>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>{produitId ? "✏️ Modifier l'annonce" : '➕ Nouvelle annonce'}</h2>
      </div>

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
            <button onClick={() => fichier.current && fichier.current.click()} disabled={envoi}
              style={{ width: 96, height: 96, border: `2px dashed ${T.border}`, borderRadius: 8, background: '#fff', cursor: 'pointer', color: T.light, fontSize: 12 }}>
              {envoi ? '⏳' : '📷 Ajouter'}
            </button>
          )}
        </div>
        <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }} onChange={e => envoyerImages(e.target.files)} />
        <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>JPEG, PNG, WebP ou GIF · 5 Mo maximum par image</p>
      </div>

      <div style={carte}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
          <div><label style={lbl}>Prix ($) *</label><input type="number" min="0" step="0.01" value={prix} onChange={e => setPrix(e.target.value)} style={champ} /></div>
          <div><label style={lbl}>Prix promo ($)</label><input type="number" min="0" step="0.01" value={prixPromo} onChange={e => setPrixPromo(e.target.value)} style={champ} /></div>
          <div><label style={lbl}>Stock</label><input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="Illimité" style={champ} /></div>
          <div><label style={lbl}>SKU</label><input value={sku} onChange={e => setSku(e.target.value)} maxLength={60} style={champ} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          <div><label style={lbl}>Quantité minimum d'achat</label><input type="number" min="1" max="9999" step="1" value={quantiteMin} onChange={e => setQuantiteMin(e.target.value)} placeholder="Aucune" style={champ} /></div>
          <div><label style={lbl}>Poids (kg)</label><input type="number" min="0" step="0.001" value={poids} onChange={e => setPoids(e.target.value)} placeholder="Ex : 0.5" style={champ} /></div>
          <div>
            <label style={lbl}>Prix de revient ($)</label>
            <input type="number" min="0" step="0.01" value={prixRevient} onChange={e => setPrixRevient(e.target.value)} placeholder="Votre coût" style={champ} />
          </div>
        </div>
        {prix !== '' && prixRevient !== '' && Number.isFinite(profit) && (
          <div style={{ marginTop: 10 }}>
            <span style={{ background: profit >= 0 ? '#e6f7e6' : '#fdecea', color: profit >= 0 ? '#2e7d32' : '#c0392b', border: `1px solid ${profit >= 0 ? '#a5d6a7' : '#f5b7b1'}`, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
              📈 Profit : {formaterArgent(profit)}
            </span>
          </div>
        )}
        <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>Le prix de revient n'est jamais visible par les acheteurs. Stock vide = illimité. Le poids servira au calcul des frais d'expédition.</p>

        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Catégorie</label>
          {categories.length > 0 ? (
            <select value={categorieId} onChange={e => setCategorieId(e.target.value)} style={champ}>
              <option value="">— Aucune —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.groupe_nom ? `${c.groupe_nom} › ` : ''}{c.nom}</option>)}
              {categorieId && !categories.some(c => String(c.id) === categorieId) && <option value={categorieId}>Catégorie actuelle (désactivée)</option>}
            </select>
          ) : <p style={{ margin: 0, fontSize: 12, color: T.light }}>Vous n'avez pas encore créé de catégories.</p>}
        </div>
      </div>

      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...lbl, margin: 0 }}>Variantes (taille, couleur…)</label>
          {variantes.length < 20 && <button onClick={() => setVariantes(v => v.concat([{ nom: '', prix: '', stock: '' }]))} style={{ border: `1px solid ${couleur}`, color: couleur, background: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter</button>}
        </div>
        {variantes.length === 0 && <p style={{ fontSize: 12, color: T.light, margin: 0 }}>Aucune variante — le produit est vendu tel quel.</p>}
        {variantes.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr 32px' : '2fr 1fr 1fr 32px', gap: 8, marginBottom: 8 }}>
            <input value={v.nom} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, nom: e.target.value } : x)))} maxLength={60} placeholder="Nom (ex : Rouge, M)" style={{ ...champ, gridColumn: mobile ? '1 / -1' : undefined }} />
            <input type="number" min="0" step="0.01" value={v.prix} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, prix: e.target.value } : x)))} placeholder="Prix ($)" style={champ} />
            <input type="number" min="0" step="1" value={v.stock} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, stock: e.target.value } : x)))} placeholder="Stock" style={champ} />
            <button onClick={() => setVariantes(a => a.filter((_, k) => k !== i))} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button disabled={sauvegarde} onClick={() => enregistrer('brouillon')} style={{ padding: '11px 20px', border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>💾 Enregistrer en brouillon</button>
        <button disabled={sauvegarde} onClick={() => enregistrer('actif')} style={{ padding: '11px 20px', border: 'none', background: couleur, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{sauvegarde ? '⏳ Enregistrement…' : '🚀 Publier'}</button>
      </div>

      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {erreurLimite && (
        <BoutiqueModale type="erreur" titre="Limite d'annonces atteinte" message={erreurLimite} accent={couleur} onFermer={() => setErreurLimite('')}
          actionSecondaire={pagePlan && naviguerVers ? { texte: 'Voir mon plan', onClick: () => naviguerVers(pagePlan) } : undefined} />
      )}
      {succes && <BoutiqueModale type="succes" accent={couleur} message={succes} texteFermer="Voir mes annonces" onFermer={onRetour} />}
    </div>
  );
}