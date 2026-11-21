// CHEMIN : src/pages/gestionnaire/BoutiqueCreerAnnonce.tsx
// e-Vend Studio — Créer / modifier une annonce des templates boutique (solo). Le gestionnaire est son propre vendeur.
// Basé sur la page « annonce » du collaborateur MV, sans règles de marketplace (pas d'approbation).
// API : /api/boutique/gestionnaire/produits, /upload, /categories — aucun lien avec le MV.

import React, { useEffect, useRef, useState } from 'react';
import { BQ, bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Variante { nom: string; prix: string; stock: string; photo?: string; options?: Record<string, string>; }
interface LignePalier { id: number; qte: string; valeur: string; prixVariantes: Record<string, string>; }
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
  // Template Mono-produit : un seul produit, plusieurs variantes. Options (Couleur : Noir, Blanc…) → combinaisons avec prix, stock et photo.
  const [mono, setMono] = useState(false);
  const [retenuMono, setRetenuMono] = useState<number | null>(null);
  const [optionsMono, setOptionsMono] = useState<{ nom: string; valeurs: string }[]>([{ nom: '', valeurs: '' }]);
  useEffect(() => { bq('/mono-produit').then(r => { if (r.ok && r.data && r.data.mono) { setMono(true); setRetenuMono(r.data.retenu_id || null); } }); }, []);
  const [categories, setCategories] = useState<Categorie[]>([]);
  // Expédition : méthodes du gestionnaire (Config → Méthode d'expédition) offertes pour cette annonce
  const [methodes, setMethodes] = useState<any[]>([]);
  const [methodesSel, setMethodesSel] = useState<number[]>([]);
  const [methodesChargees, setMethodesChargees] = useState(false);
  // Add-on « Prix par palier de quantité » : un seul type par annonce, 5 paliers maximum
  const [paliersActif, setPaliersActif] = useState(false);
  const [paliersGuide, setPaliersGuide] = useState('');
  const [palierType, setPalierType] = useState<'pourcentage' | 'fixe'>('pourcentage');
  const [paliersLignes, setPaliersLignes] = useState<LignePalier[]>([]);
  // Add-on « Parution future » : 'AAAA-MM-JJTHH:mm' en heure de Montréal, '' = en vente tout de suite
  const [parutionActif, setParutionActif] = useState(false);
  const [parutionGuide, setParutionGuide] = useState('');
  const [dateParution, setDateParution] = useState('');
  const [dateParutionInitiale, setDateParutionInitiale] = useState('');
  const [chargement, setChargement] = useState(!!produitId);
  const [envoi, setEnvoi] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [erreurLimite, setErreurLimite] = useState('');
  const [succes, setSucces] = useState('');
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bq('/categories').then(r => { if (r.ok && Array.isArray(r.data)) setCategories(r.data); });
    bq('/addons').then(r => { if (r.ok && r.data && Array.isArray(r.data.addons)) { const g = r.data.addons.find((y: any) => y.code === 'prix_paliers'); if (g) { setPaliersActif(!!(g.achete && g.offert)); setPaliersGuide(g.guide_url || ''); } const pf = r.data.addons.find((y: any) => y.code === 'parution_future'); if (pf) { setParutionActif(!!(pf.achete && pf.offert)); setParutionGuide(pf.guide_url || ''); } } });
    bq('/expedition/methodes/details').then(r => { if (r.ok && Array.isArray(r.data)) { setMethodes(r.data); setMethodesChargees(true); } });
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
      setMethodesSel(Array.isArray(p.methodes_expedition_ids) ? p.methodes_expedition_ids : []);
      setPhotos(Array.isArray(p.photos) ? p.photos : []);
      setVariantes((Array.isArray(p.variantes) ? p.variantes : []).map((v: any) => ({
        nom: v.nom || '',
        prix: v.prix === null || v.prix === undefined ? '' : String(v.prix),
        stock: v.stock === null || v.stock === undefined ? '' : String(v.stock),
        ...(v.photo ? { photo: String(v.photo) } : {}),
        ...(v.options && typeof v.options === 'object' ? { options: v.options } : {}),
      })));
      // Relit les options (Couleur, Taille…) des combinaisons enregistrées pour pouvoir les modifier
      const optsLues: { nom: string; valeurs: string[] }[] = [];
      for (const v of (Array.isArray(p.variantes) ? p.variantes : [])) {
        for (const [k, val] of Object.entries(v.options || {})) {
          let o = optsLues.find(x => x.nom === k); if (!o) { o = { nom: k, valeurs: [] }; optsLues.push(o); }
          if (!o.valeurs.includes(String(val))) o.valeurs.push(String(val));
        }
      }
      if (optsLues.length) setOptionsMono(optsLues.map(o => ({ nom: o.nom, valeurs: o.valeurs.join(', ') })));
      setDateParution(p.date_parution_local || ''); setDateParutionInitiale(p.date_parution_local || '');
      if (Array.isArray(p.paliers) && p.paliers.length) {
        setPalierType(p.paliers[0].type === 'fixe' ? 'fixe' : 'pourcentage');
        const parQte = new Map<number, LignePalier>();
        p.paliers.forEach((x: any, i: number) => {
          const q = Number(x.qte_min);
          if (!parQte.has(q)) parQte.set(q, { id: i + 1, qte: String(q), valeur: '', prixVariantes: {} });
          const l = parQte.get(q)!;
          if (x.type === 'fixe' && x.variante) l.prixVariantes[x.variante] = String(x.valeur); else l.valeur = String(x.valeur);
        });
        setPaliersLignes(Array.from(parQte.values()).sort((a, b) => Number(a.qte) - Number(b.qte)));
      }
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

  // Génère toutes les combinaisons des options (max 20), en gardant le prix, le stock et la photo déjà saisis pour une même combinaison
  const genererCombinaisons = () => {
    const opts = optionsMono.map(o => ({ nom: o.nom.trim(), vals: Array.from(new Set(o.valeurs.split(',').map(x => x.trim()).filter(Boolean))) })).filter(o => o.nom && o.vals.length);
    if (!opts.length) { setErreur('Ajoutez au moins une option, par exemple « Couleur » avec les valeurs « Noir, Blanc ».'); return; }
    let combos: Record<string, string>[] = [{}];
    for (const o of opts) combos = combos.flatMap(c => o.vals.map(v => ({ ...c, [o.nom]: v })));
    if (combos.length > 20) { setErreur(`Ces options donnent ${combos.length} combinaisons : le maximum est 20. Réduisez le nombre de valeurs.`); return; }
    const noms = combos.map(c => opts.map(o => c[o.nom]).join(' / '));
    if (noms.some(n => n.length > 60)) { setErreur('Une combinaison dépasse 60 caractères : utilisez des valeurs plus courtes.'); return; }
    setVariantes(combos.map((c, i) => { const ex = variantes.find(v => v.nom === noms[i]); return { nom: noms[i], prix: ex ? ex.prix : '', stock: ex ? ex.stock : '', ...(ex && ex.photo ? { photo: ex.photo } : {}), options: c }; }));
  };

  const enregistrer = async (statut: 'actif' | 'brouillon') => {
    setErreur('');
    if (!titre.trim()) { setErreur('Le titre est obligatoire'); return; }
    if (prix === '' || !Number.isFinite(Number(prix)) || Number(prix) < 0.01) { setErreur('Le prix est obligatoire (au moins 0,01 $)'); return; }
    if (prixPromo !== '' && Number(prixPromo) >= Number(prix)) { setErreur('Le prix promo doit être inférieur au prix'); return; }
    if (quantiteMin !== '' && (!Number.isInteger(Number(quantiteMin)) || Number(quantiteMin) < 1 || Number(quantiteMin) > 9999)) { setErreur('La quantité minimum doit être un nombre entier entre 1 et 9 999'); return; }
    if (poids !== '' && (!Number.isFinite(Number(poids)) || Number(poids) < 0)) { setErreur('Le poids est invalide'); return; }
    if (prixRevient !== '' && (!Number.isFinite(Number(prixRevient)) || Number(prixRevient) < 0)) { setErreur('Le prix de revient est invalide'); return; }
    if (methodes.some(m => methodesSel.indexOf(m.id) >= 0 && (m.mode_calcul === 'kg' || m.mode_calcul === 'fixe_kg')) && !(Number(poids) > 0)) {
      setErreur('Indiquez le poids du produit : une des méthodes choisies calcule les frais au kg.'); return;
    }
    for (const v of variantes) {
      if (v.nom.trim() && v.prix !== '' && Number(v.prix) < 0.01) { setErreur(`Variante « ${v.nom.trim()} » : le prix doit être d'au moins 0,01 $`); return; }
    }
    // Paliers de prix : lignes plates (une par palier, ou une par palier et variante pour les prix fixes). Envoyés seulement si l'add-on est actif.
    const nomsVar = variantes.filter(v => v.nom.trim()).map(v => v.nom.trim());
    const paliersEnvoi: any[] = [];
    if (paliersActif) {
      const vues = new Set<number>();
      for (const l of paliersLignes) {
        const q = Number(l.qte);
        if (l.qte === '' || !Number.isInteger(q) || q < 2) { setErreur('Palier de prix : la quantité doit être un nombre entier de 2 ou plus.'); return; }
        if (vues.has(q)) { setErreur(`Palier de prix : la quantité ${q} est en double.`); return; }
        vues.add(q);
        if (palierType === 'fixe' && nomsVar.length) {
          let nb = 0;
          for (const nom of nomsVar) {
            const v = l.prixVariantes[nom];
            if (v === undefined || v === '') continue;
            if (!(Number(v) > 0)) { setErreur(`Palier de prix (${q}+) : prix invalide pour « ${nom} ».`); return; }
            const vr = variantes.find(x => x.nom.trim() === nom);
            const ref = vr && vr.prix !== '' ? Number(vr.prix) : Number(prix);
            if (!(Number(v) < ref)) { setErreur(`Palier de prix (${q}+) : le prix de « ${nom} » doit être inférieur à ${ref.toFixed(2)} $.`); return; }
            paliersEnvoi.push({ qte_min: q, type: 'fixe', valeur: Number(v), variante: nom }); nb++;
          }
          if (!nb) { setErreur(`Palier de prix (${q}+) : entrez un prix pour au moins une variante.`); return; }
        } else {
          if (palierType === 'pourcentage' && !(Number(l.valeur) > 0 && Number(l.valeur) < 100)) { setErreur(`Palier de prix (${q}+) : le rabais doit être entre 0 et 100 %.`); return; }
          if (palierType === 'fixe' && !(Number(l.valeur) > 0 && Number(l.valeur) < Number(prix))) { setErreur(`Palier de prix (${q}+) : le prix doit être inférieur à ${Number(prix).toFixed(2)} $.`); return; }
          paliersEnvoi.push({ qte_min: q, type: palierType, valeur: Number(l.valeur), variante: null });
        }
      }
    }
    setSauvegarde(true);
    const r = await bq(produitId ? `/produits/${produitId}` : '/produits', {
      method: produitId ? 'PUT' : 'POST',
      body: {
        titre, description, prix, prix_promo: prixPromo, stock, sku, quantite_min: quantiteMin, prix_revient: prixRevient,
        poids: poids === '' ? null : poids, categorie_id: categorieId || null, photos, statut,
        ...(methodesChargees ? { methodes_expedition_ids: methodesSel.filter(id => methodes.some(m => m.id === id)) } : {}),
        variantes: variantes.filter(v => v.nom.trim()).map(v => ({ nom: v.nom, prix: v.prix, stock: v.stock, ...(v.photo && photos.includes(v.photo) ? { photo: v.photo } : {}), ...(v.options ? { options: v.options } : {}) })),
        ...(paliersActif ? { paliers: paliersEnvoi } : {}),
        // Parution future : envoyée seulement si l'add-on est actif (ou pour retirer une date existante)
        ...((parutionActif || (dateParution === '' && dateParutionInitiale !== '')) ? { date_parution: dateParution === '' ? null : dateParution } : {}),
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

      {mono && !produitId && retenuMono && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12, lineHeight: 1.6 }}>
          ℹ️ Votre template <b>Mono-produit</b> vend un seul produit, et vous en avez déjà un en vente. Pour en proposer un autre, désactivez celui qui est en vente — ou modifiez-le et ajoutez-lui des variantes.
        </div>
      )}
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
        <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>Le prix de revient n'est jamais visible par les acheteurs. Stock vide = illimité. Le poids sert au calcul des frais d'expédition au kilo.</p>

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
        <label style={lbl}>🚚 Expédition</label>
        {methodes.length === 0 ? (
          <p style={{ fontSize: 13, color: T.light, margin: 0, lineHeight: 1.5 }}>
            🎁 Livraison gratuite pour ce produit : vous n'avez pas encore configuré de méthode d'expédition.
            {naviguerVers && <> <button type="button" onClick={() => naviguerVers('config-expedition')} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}>Configurer mes méthodes →</button></>}
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: T.light, margin: '0 0 10px' }}>Cochez les méthodes offertes pour ce produit. Si vous n'en cochez aucune, la livraison est gratuite pour ce produit.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {methodes.map((m: any) => {
                const choisi = methodesSel.indexOf(m.id) >= 0;
                return (
                  <div key={m.id} onClick={() => setMethodesSel(prev => (prev.indexOf(m.id) >= 0 ? prev.filter(x => x !== m.id) : prev.concat([m.id])))}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `2px solid ${choisi ? couleur : '#e1e3e5'}`, background: choisi ? '#fafaff' : '#fff', cursor: 'pointer' }}>
                    <input type="checkbox" checked={choisi} onChange={() => undefined} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 20 }}>{m.logo || '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.nom || 'Expédition'}</div>
                      {m.delais_estime && <div style={{ fontSize: 12, color: T.light }}>⏱ {m.delais_estime}</div>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, background: '#f5f5f5', padding: '3px 10px', borderRadius: 20 }}>{m.libelle_prix}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {mono && (
        <div style={carte}>
          <label style={{ ...lbl, marginBottom: 6 }}>Options et variantes de votre produit</label>
          <p style={{ fontSize: 12, color: T.light, margin: '0 0 12px', lineHeight: 1.6 }}>Votre template vend <b>un seul produit</b> : ajoutez ici ses options (couleur, taille…). Chaque combinaison peut avoir son prix, son stock et sa photo. Prix ou stock laissé vide = ceux du produit.</p>
          {optionsMono.map((o, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 32px' : '1fr 2fr 32px', gap: 8, marginBottom: 8 }}>
              <input value={o.nom} onChange={e => setOptionsMono(a => a.map((x, k) => (k === i ? { ...x, nom: e.target.value } : x)))} maxLength={30} placeholder="Option (ex : Couleur)" style={{ ...champ, gridColumn: mobile ? '1 / -1' : undefined }} />
              <input value={o.valeurs} onChange={e => setOptionsMono(a => a.map((x, k) => (k === i ? { ...x, valeurs: e.target.value } : x)))} placeholder="Valeurs séparées par des virgules (ex : Noir, Blanc, Bleu)" style={{ ...champ, gridColumn: mobile ? '1 / -1' : undefined }} />
              <button onClick={() => setOptionsMono(a => (a.length > 1 ? a.filter((_, k) => k !== i) : [{ nom: '', valeurs: '' }]))} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {optionsMono.length < 3 && <button onClick={() => setOptionsMono(a => a.concat([{ nom: '', valeurs: '' }]))} style={{ border: `1px solid ${couleur}`, color: couleur, background: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter une option</button>}
            <button onClick={genererCombinaisons} style={{ border: 'none', color: '#fff', background: couleur, borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⚙️ Générer les combinaisons</button>
          </div>
          {variantes.length === 0 && <p style={{ fontSize: 12, color: T.light, margin: 0 }}>Aucune combinaison : le produit est vendu tel quel (sans choix pour le client).</p>}
          {variantes.map((v, i) => (
            <div key={v.nom + i} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '2fr 1fr 1fr 1.4fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, gridColumn: mobile ? '1 / -1' : undefined }}>{v.nom}</div>
              <input type="number" min="0" step="0.01" value={v.prix} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, prix: e.target.value } : x)))} placeholder="Prix ($)" style={champ} />
              <input type="number" min="0" step="1" value={v.stock} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, stock: e.target.value } : x)))} placeholder="Stock" style={champ} />
              <select value={v.photo && photos.includes(v.photo) ? v.photo : ''} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, photo: e.target.value } : x)))} style={{ ...champ, gridColumn: mobile ? '1 / -1' : undefined }}>
                <option value="">Photo du produit</option>
                {photos.map((u, k) => <option key={u} value={u}>Photo {k + 1}</option>)}
              </select>
              <button onClick={() => setVariantes(a => a.filter((_, k) => k !== i))} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {!mono && (<div style={carte}>
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
      </div>)}

      {(parutionActif || dateParutionInitiale) && (
        <div style={carte}>
          <label style={lbl}>📅 Date de parution (optionnel)
            {parutionGuide && <a href={parutionGuide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, textTransform: 'none' }}>📖 Guide</a>}
          </label>
          {parutionActif ? (
            <>
              <input type="datetime-local" value={dateParution} onChange={e => setDateParution(e.target.value)} style={{ ...champ, maxWidth: 260 }} />
              {dateParution && <button type="button" onClick={() => setDateParution('')} style={{ marginLeft: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Retirer la date</button>}
              <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>
                Heure de Montréal. L'annonce est visible avec un compte à rebours, mais impossible à acheter avant cette date. La date doit être dans au moins 30 minutes. Laissez vide pour vendre tout de suite.
              </p>
            </>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 8px' }}>🔒 L'option « Parution future » n'est plus activée. Cette annonce reste cachée de la boutique jusqu'au <strong>{dateParutionInitiale.replace('T', ' à ')}</strong>.</p>
              {dateParution && <button type="button" onClick={() => setDateParution('')} style={{ border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Retirer la date et vendre tout de suite</button>}
            </div>
          )}
        </div>
      )}
      {!parutionActif && !dateParutionInitiale && (
        <div style={carte}>
          <label style={lbl}>📅 Date de parution (optionnel)</label>
          <p style={{ fontSize: 12, color: T.light, margin: '0 0 10px' }}>Programmez la mise en vente : un compte à rebours s'affiche sur la fiche et l'achat s'ouvre à la date choisie. Cette option s'active dans « Mon plan & limites ».</p>
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ border: `1px solid ${couleur}`, background: '#fff', color: couleur, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan & limites »</button>}
        </div>
      )}

      <div style={carte}>
        <label style={lbl}>💰 Prix par palier de quantité (optionnel)
          {paliersGuide && <a href={paliersGuide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, textTransform: 'none' }}>📖 Guide</a>}
        </label>
        {!paliersActif ? (
          <div>
            <p style={{ fontSize: 12, color: T.light, margin: '0 0 10px' }}>Plus l'acheteur en prend, moins c'est cher : un tableau de prix s'affiche sur la fiche du produit. Cette option s'active dans « Mon plan & limites ».</p>
            {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ border: `1px solid ${couleur}`, background: '#fff', color: couleur, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan & limites »</button>}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: T.light, margin: '0 0 10px' }}>Plus l'acheteur en prend, moins c'est cher. Jusqu'à 5 paliers; le palier le plus élevé atteint s'applique. Laissez vide pour aucun palier.</p>
            {paliersLignes.length > 0 && (() => {
              const nomsV = variantes.filter(v => v.nom.trim()).map(v => v.nom.trim());
              const fixeVar = palierType === 'fixe' && nomsV.length > 0;
              const maj = (id: number, ch: Partial<LignePalier>) => setPaliersLignes(ls => ls.map(l => (l.id === id ? { ...l, ...ch } : l)));
              return (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {([['pourcentage', 'Rabais en %'], ['fixe', 'Prix fixe par unité']] as const).map(([t, nom]) => (
                      <button key={t} type="button" onClick={() => setPalierType(t)} style={{ border: `1px solid ${palierType === t ? couleur : T.border}`, background: palierType === t ? couleur : '#fff', color: palierType === t ? '#fff' : T.text, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{nom}</button>
                    ))}
                  </div>
                  {paliersLignes.map(l => (
                    <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10, padding: 10, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>À partir de (qté)</div>
                        <input type="number" min="2" step="1" value={l.qte} onChange={e => maj(l.id, { qte: e.target.value })} placeholder="ex. 3" style={{ ...champ, maxWidth: 110 }} />
                      </div>
                      {!fixeVar ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>{palierType === 'pourcentage' ? 'Rabais (%)' : 'Prix par unité'}</div>
                          <input type="number" min="0" step={palierType === 'pourcentage' ? '1' : '0.01'} value={l.valeur} onChange={e => maj(l.id, { valeur: e.target.value })} placeholder={palierType === 'pourcentage' ? 'ex. 10' : 'ex. 18.00'} style={{ ...champ, maxWidth: 130 }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {nomsV.map(nom => (
                            <div key={nom}>
                              <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>{nom}</div>
                              <input type="number" min="0" step="0.01" value={l.prixVariantes[nom] ?? ''} onChange={e => maj(l.id, { prixVariantes: { ...l.prixVariantes, [nom]: e.target.value } })} placeholder="Prix" style={{ ...champ, maxWidth: 110 }} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => setPaliersLignes(ls => ls.filter(x => x.id !== l.id))} aria-label="Retirer ce palier" style={{ marginTop: 20, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                  {fixeVar && <p style={{ fontSize: 11, color: T.light, margin: '0 0 8px' }}>Une variante sans prix pour un palier garde son prix normal. Chaque variante est comptée séparément dans le panier.</p>}
                </>
              );
            })()}
            {paliersLignes.length < 5 && (
              <button type="button" onClick={() => setPaliersLignes(ls => [...ls, { id: Date.now(), qte: '', valeur: '', prixVariantes: {} }])} style={{ border: `1px dashed ${couleur}`, background: '#fff', color: couleur, borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ Ajouter un palier</button>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button disabled={sauvegarde} onClick={() => enregistrer('brouillon')} style={{ padding: '11px 20px', border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>💾 Enregistrer en brouillon</button>
        <button disabled={sauvegarde} onClick={() => enregistrer('actif')} style={{ padding: '11px 20px', border: 'none', background: couleur, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{sauvegarde ? '⏳ Enregistrement…' : '🚀 Publier'}</button>
      </div>

      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {erreurLimite && (
        <BoutiqueModale type="erreur" titre={mono ? 'Un seul produit' : "Limite d'annonces atteinte"} message={erreurLimite} accent={couleur} onFermer={() => setErreurLimite('')}
          actionSecondaire={!mono && pagePlan && naviguerVers ? { texte: 'Voir mon plan', onClick: () => naviguerVers(pagePlan) } : undefined} />
      )}
      {succes && <BoutiqueModale type="succes" accent={couleur} message={succes} texteFermer="Voir mes annonces" onFermer={onRetour} />}
    </div>
  );
}