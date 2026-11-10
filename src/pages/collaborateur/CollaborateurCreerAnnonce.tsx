// CHEMIN : src/pages/collaborateur/CollaborateurCreerAnnonce.tsx
// e-Vend Studio — Dashboard collaborateur : créer / modifier une annonce
// Adapté de CreerAnnonce.tsx (e-Vend). API : /api/collab/:gestionnaireId/produits, /upload, /categories

import React, { useState, useEffect, useRef } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Variante { nom: string; prix: string; stock: string; }
interface Regles { expedition_obligatoire: boolean; approbation_auto: boolean; gerer_stock: boolean; prix_zero: boolean; prix_min: number; qte_min_active: boolean; qte_min_mode: 'produit' | 'commande'; aide: string; prix_revient: boolean; categories: boolean; parution_future_actif: boolean; paliers_actif: boolean; }
interface LignePalier { id: number; qte: string; valeur: string; prixVariantes: Record<string, string>; }
const REGLES_DEFAUT: Regles = { expedition_obligatoire: false, approbation_auto: true, gerer_stock: true, prix_zero: false, prix_min: 0, qte_min_active: false, qte_min_mode: 'produit', aide: '', prix_revient: false, categories: true, parution_future_actif: false, paliers_actif: false };
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
  const [quantiteMin, setQuantiteMin] = useState('');
  const [prixRevient, setPrixRevient] = useState('');
  // Parution future (add-on) : 'AAAA-MM-JJTHH:mm' en heure de Montréal, '' = en vente tout de suite
  const [dateParution, setDateParution] = useState('');
  const [dateParutionInitiale, setDateParutionInitiale] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');   // arrêt de publication (heure de Montréal)
  const [dejaExpiree, setDejaExpiree] = useState(false);
  const [regles, setRegles] = useState<Regles>(REGLES_DEFAUT);
  // Prix par palier de quantité (add-on payant) : un seul type par annonce, 5 paliers maximum
  const [palierType, setPalierType] = useState<'pourcentage' | 'fixe'>('pourcentage');
  const [paliersLignes, setPaliersLignes] = useState<LignePalier[]>([]);
  const [categorieId, setCategorieId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  // Expédition (comme e-Vend) : poids en kg + méthodes du collaborateur offertes pour cette annonce
  const [poids, setPoids] = useState('');
  const [methodesVendeur, setMethodesVendeur] = useState<any[]>([]);
  const [methodesSel, setMethodesSel] = useState<number[]>([]);
  const [categories, setCategories] = useState<{ id: number; nom: string; groupe_nom: string | null }[]>([]);
  const [chargement, setChargement] = useState(!!produitId);
  const [envoi, setEnvoi] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  // Règles du gestionnaire (Config marketplace → Config produits)
  useEffect(() => {
    fetch(`${base}/produits-regles`, { credentials: 'include' }).then(r => (r.ok ? r.json() : null)).then(d => { if (d) setRegles({ ...REGLES_DEFAUT, ...d }); }).catch(() => {});
  }, [base]);

  useEffect(() => {
    fetch(`${base}/categories`, { credentials: 'include' }).then(r => (r.ok ? r.json() : [])).then(setCategories).catch(() => {});
  }, [base]);

  useEffect(() => {
    fetch(`${base}/methodes-expedition/details`, { credentials: 'include' }).then(r => (r.ok ? r.json() : [])).then(d => setMethodesVendeur(Array.isArray(d) ? d : [])).catch(() => {});
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
        setQuantiteMin(p.quantite_min ? String(p.quantite_min) : ''); setPrixRevient(p.prix_revient === null || p.prix_revient === undefined ? '' : String(p.prix_revient));
        setDateParution(p.date_parution_local || ''); setDateParutionInitiale(p.date_parution_local || '');
        setDateExpiration(p.date_expiration_local || ''); setDejaExpiree(p.expire === true);
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
        setSku(p.sku || ''); setCategorieId(p.categorie_id ? String(p.categorie_id) : '');
        setPoids(p.poids === null || p.poids === undefined ? '' : String(Number(p.poids)));
        setMethodesSel(Array.isArray(p.methodes_expedition_ids) ? p.methodes_expedition_ids : []);
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
    if (prix === '' || !Number.isFinite(Number(prix)) || Number(prix) < 0) { setErreur('Le prix est obligatoire'); return; }
    const verifPrix = (v: number, nom: string): string | null => {
      if (v === 0) return regles.prix_zero ? null : `${nom} : le prix doit être supérieur à 0 (les annonces gratuites ne sont pas permises ici).`;
      if (regles.prix_min > 0 && v < regles.prix_min) return `${nom} : le prix minimum est de ${formaterPrix(regles.prix_min)}.`;
      return null;
    };
    const ep = verifPrix(Number(prix), 'Prix') || (prixPromo !== '' && Number(prixPromo) > 0 ? verifPrix(Number(prixPromo), 'Prix promo') : null)
      || variantes.filter(v => v.nom.trim() && v.prix !== '').map(v => verifPrix(Number(v.prix), `Variante « ${v.nom.trim()} »`)).find(Boolean) || null;
    if (ep) { setErreur(ep); return; }
    if (regles.qte_min_active && quantiteMin !== '' && (!Number.isInteger(Number(quantiteMin)) || Number(quantiteMin) < 1 || Number(quantiteMin) > 9999)) { setErreur('La quantité minimum doit être un nombre entier entre 1 et 9 999'); return; }
    if (regles.prix_revient && prixRevient !== '' && (!Number.isFinite(Number(prixRevient)) || Number(prixRevient) < 0)) { setErreur('Le prix de revient est invalide'); return; }
    if (categories.length > 0 && !categorieId) { setErreur('Choisissez une catégorie'); return; }
    if (prixPromo !== '' && Number(prixPromo) >= Number(prix)) { setErreur('Le prix promo doit être inférieur au prix'); return; }
    if (poids !== '' && (Number(poids) < 0 || !Number.isFinite(Number(poids)))) { setErreur('Le poids est invalide'); return; }
    if (regles.expedition_obligatoire && methodesVendeur.length > 0 && methodesSel.length === 0) { setErreur("Sélectionnez au moins une méthode d'expédition."); return; }
    if (methodesVendeur.some(m => methodesSel.includes(m.id) && (m.mode_calcul === 'kg' || m.mode_calcul === 'fixe_kg')) && !(Number(poids) > 0)) { setErreur("Indiquez le poids du produit : une des méthodes choisies calcule les frais au kg."); return; }
    // Paliers de prix : lignes plates (une par palier, ou une par palier et variante pour les prix fixes)
    const nomsVar = variantes.filter(v => v.nom.trim()).map(v => v.nom);
    const paliersEnvoi: any[] = [];
    if (regles.paliers_actif) {
      for (const l of paliersLignes) {
        const q = Number(l.qte);
        if (l.qte === '' || !Number.isInteger(q) || q < 2) { setErreur('Palier de prix : la quantité doit être un nombre entier de 2 ou plus.'); return; }
        if (palierType === 'fixe' && nomsVar.length) {
          let nb = 0;
          for (const nom of nomsVar) {
            const v = l.prixVariantes[nom];
            if (v === undefined || v === '') continue;
            if (!(Number(v) > 0)) { setErreur(`Palier de prix (${q}+) : prix invalide pour « ${nom} ».`); return; }
            paliersEnvoi.push({ qte_min: q, type: 'fixe', valeur: Number(v), variante: nom }); nb++;
          }
          if (!nb) { setErreur(`Palier de prix (${q}+) : entrez un prix pour au moins une variante.`); return; }
        } else {
          if (!(Number(l.valeur) > 0)) { setErreur(`Palier de prix (${q}+) : entrez une valeur valide.`); return; }
          paliersEnvoi.push({ qte_min: q, type: palierType, valeur: Number(l.valeur), variante: null });
        }
      }
    }
    setSauvegarde(true);
    try {
      const res = await fetch(produitId ? `${base}/produits/${produitId}` : `${base}/produits`, {
        method: produitId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre, description, prix, prix_promo: prixPromo, stock, sku, quantite_min: regles.qte_min_active ? quantiteMin : '', ...(regles.prix_revient ? { prix_revient: prixRevient } : {}), categorie_id: categorieId || null, photos, statut,
          poids: poids === '' ? null : poids,
          // Parution future : envoyée seulement si l'add-on est actif (ou pour retirer une date existante)
          ...((regles.parution_future_actif || (dateParution === '' && dateParutionInitiale !== '')) ? { date_parution: dateParution === '' ? null : dateParution } : {}),
          date_expiration: dateExpiration === '' ? null : dateExpiration,
          ...(regles.paliers_actif ? { paliers: paliersEnvoi } : {}),
          methodes_expedition_ids: methodesVendeur.length > 0 ? methodesSel : [],
          variantes: variantes.filter(v => v.nom.trim()).map(v => ({ nom: v.nom, prix: v.prix, stock: v.stock })),
        }),
      });
      if (res.ok) {
        const retour = await res.clone().json().catch(() => ({}));
        const enAttente = statut === 'actif' && retour.statut === 'en_attente';
        setSucces(enAttente ? 'Votre annonce a été envoyée au gestionnaire pour approbation. Elle sera visible dans votre boutique dès qu\'elle sera approuvée.' : produitId ? 'Votre annonce a été mise à jour avec succès.' : statut === 'actif' ? 'Votre annonce a été publiée avec succès. Elle est maintenant visible dans votre boutique.' : 'Votre annonce a été enregistrée comme brouillon. Elle n\'est pas encore visible dans votre boutique.');
        setSauvegarde(false);
        return;
      }
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

      {regles.aide && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: 10, padding: '12px 14px', fontSize: 13, lineHeight: 1.5, marginBottom: 16, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          <strong>ℹ️ Message du gestionnaire</strong><br />{regles.aide}
        </div>
      )}
      {!regles.approbation_auto && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
          ⏳ Sur cette marketplace, une annonce publiée doit être approuvée par le gestionnaire avant d'être visible.
        </div>
      )}

      {(erreur || succes) && (
        <div onClick={() => { if (erreur) setErreur(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}>
          <div role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, maxWidth: 420, width: '100%', padding: '30px 26px 24px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: succes ? '#dcfce7' : '#fee2e2' }}>{succes ? '✅' : '⚠️'}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, color: succes ? '#047857' : '#b91c1c' }}>{succes ? 'Succès !' : 'Erreur'}</h3>
            <p style={{ margin: '0 0 22px', fontSize: 14, color: T.text, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{succes || erreur}</p>
            {succes ? (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={onRetour} style={{ padding: '11px 24px', border: 'none', borderRadius: 9, background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Voir mes annonces</button>
              </div>
            ) : (
              <button onClick={() => setErreur('')} style={{ padding: '11px 28px', border: 'none', borderRadius: 9, background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
            )}
          </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${regles.gerer_stock ? 4 : 3}, 1fr)`, gap: 12 }}>
          <div><label style={lbl}>Prix ($) *</label><input type="number" min="0" step="0.01" value={prix} onChange={e => setPrix(e.target.value)} style={champ} /></div>
          <div><label style={lbl}>Prix promo ($)</label><input type="number" min="0" step="0.01" value={prixPromo} onChange={e => setPrixPromo(e.target.value)} style={champ} /></div>
          {regles.gerer_stock && <div><label style={lbl}>Stock</label><input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="Illimité" style={champ} /></div>}
          <div><label style={lbl}>SKU</label><input value={sku} onChange={e => setSku(e.target.value)} maxLength={60} style={champ} /></div>
        </div>
        {(regles.prix_min > 0 || regles.prix_zero) && (
          <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>
            {regles.prix_min > 0 ? `Prix minimum : ${formaterPrix(regles.prix_min)}.` : ''}{regles.prix_zero ? ' Les annonces gratuites (0 $) sont permises.' : ''}
          </p>
        )}
        {regles.prix_revient && (() => {
          const vente = prixPromo !== '' && Number(prixPromo) > 0 && Number(prixPromo) < Number(prix) ? Number(prixPromo) : Number(prix);
          const cout = Number(prixRevient);
          const profit = vente - cout;
          return (
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Prix de revient (cost price)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="number" min="0" step="0.01" value={prixRevient} onChange={e => setPrixRevient(e.target.value)} placeholder="Votre coût" style={{ ...champ, maxWidth: 200 }} />
                {prix !== '' && prixRevient !== '' && Number.isFinite(profit) && (
                  <span style={{ background: profit >= 0 ? '#e6f7e6' : '#fdecea', color: profit >= 0 ? '#2e7d32' : '#c0392b', border: `1px solid ${profit >= 0 ? '#a5d6a7' : '#f5b7b1'}`, padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
                    📈 Profit : {formaterPrix(profit)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.light, margin: '6px 0 0' }}>Jamais visible par les acheteurs : sert seulement à calculer votre profit.</p>
            </div>
          );
        })()}
        {regles.qte_min_active && (
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Quantité minimum d'achat</label>
            <input type="number" min="1" max="9999" step="1" value={quantiteMin} onChange={e => setQuantiteMin(e.target.value)} placeholder="Aucune (1)" style={{ ...champ, maxWidth: 200 }} />
            <p style={{ fontSize: 11, color: T.light, margin: '6px 0 0' }}>
              {regles.qte_min_mode === 'produit'
                ? "L'acheteur doit mettre au moins cette quantité de ce produit dans son panier."
                : "La commande doit contenir au moins ce nombre d'articles au total (tous produits de votre boutique confondus)."}
              {' '}L'acheteur est averti dans le panier et ne peut pas payer tant que ce n'est pas respecté. Laissez vide pour aucun minimum.
            </p>
          </div>
        )}
        {regles.categories && (
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
        )}
      </div>

      {regles.paliers_actif && (
        <div style={carte}>
          <label style={lbl}>💰 Prix par palier de quantité (optionnel)</label>
          <p style={{ fontSize: 12, color: T.light, margin: '0 0 10px' }}>Plus l'acheteur en prend, moins c'est cher. Jusqu'à 5 paliers; le palier le plus élevé atteint s'applique. Laissez vide pour aucun palier.</p>
          {paliersLignes.length > 0 && (() => {
            const nomsV = variantes.filter(v => v.nom.trim()).map(v => v.nom);
            const fixeVar = palierType === 'fixe' && nomsV.length > 0;
            const maj = (id: number, ch: Partial<LignePalier>) => setPaliersLignes(ls => ls.map(l => (l.id === id ? { ...l, ...ch } : l)));
            return (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {([['pourcentage', 'Rabais en %'], ['fixe', 'Prix fixe par unité']] as const).map(([t, nom]) => (
                    <button key={t} type="button" onClick={() => setPalierType(t)} style={{ border: `1px solid ${palierType === t ? accent : T.border}`, background: palierType === t ? accent : '#fff', color: palierType === t ? '#fff' : T.text, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{nom}</button>
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
                    <button type="button" onClick={() => setPaliersLignes(ls => ls.filter(x => x.id !== l.id))} style={{ marginTop: 20, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                  </div>
                ))}
                {fixeVar && <p style={{ fontSize: 11, color: T.light, margin: '0 0 8px' }}>Une variante sans prix pour un palier garde son prix normal. Chaque variante est comptée séparément dans le panier.</p>}
              </>
            );
          })()}
          {paliersLignes.length < 5 && (
            <button type="button" onClick={() => setPaliersLignes(ls => [...ls, { id: Date.now(), qte: '', valeur: '', prixVariantes: {} }])} style={{ border: `1px dashed ${accent}`, background: '#fff', color: accent, borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ Ajouter un palier</button>
          )}
        </div>
      )}

      {(regles.parution_future_actif || dateParutionInitiale) && (
        <div style={carte}>
          <label style={lbl}>📅 Date de parution (optionnel)</label>
          {regles.parution_future_actif ? (
            <>
              <input type="datetime-local" value={dateParution} onChange={e => setDateParution(e.target.value)} style={{ ...champ, maxWidth: 260 }} />
              {dateParution && <button type="button" onClick={() => setDateParution('')} style={{ marginLeft: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Retirer la date</button>}
              <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>
                Heure de Montréal. L'annonce est visible avec un compte à rebours, mais impossible à acheter avant cette date. La date doit être dans au moins 30 minutes. Laissez vide pour vendre tout de suite.
              </p>
            </>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 8px' }}>🔒 L'option « Parution future » n'est plus activée. Cette annonce reste bloquée jusqu'au <strong>{dateParutionInitiale.replace('T', ' à ')}</strong>.</p>
              {dateParution && <button type="button" onClick={() => setDateParution('')} style={{ border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Retirer la date et vendre tout de suite</button>}
            </div>
          )}
        </div>
      )}

      <div style={carte}>
        <label style={lbl}>⏹️ Date d'expiration — arrêt de publication (optionnel)</label>
        {dejaExpiree && dateExpiration && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>
            ⏹️ Cette annonce a expiré le {dateExpiration.replace('T', ' à ')} : elle n'est plus visible dans le catalogue et ne peut plus être achetée. Choisissez une nouvelle date ou retirez la date pour la republier.
          </div>
        )}
        <input type="datetime-local" value={dateExpiration} onChange={e => setDateExpiration(e.target.value)} style={{ ...champ, maxWidth: 260 }} />
        {dateExpiration && <button type="button" onClick={() => setDateExpiration('')} style={{ marginLeft: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Retirer la date</button>}
        <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>
          Heure de Montréal. À cette date, l'annonce disparaît du catalogue et ne peut plus être achetée (les commandes déjà payées ne changent pas). Une nouvelle date doit être dans au moins 30 minutes. Laissez vide pour ne jamais expirer.
        </p>
      </div>

      <div style={carte}>
        <label style={lbl}>🚚 Expédition</label>
        <div style={{ maxWidth: 260, marginBottom: 14 }}>
          <label style={lbl}>Poids (kg) pour frais d'expédition</label>
          <input type="number" min="0" step="0.001" value={poids} onChange={e => setPoids(e.target.value)} placeholder="Ex : 0.5" style={champ} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>Méthodes d'expédition disponibles pour ce produit {regles.expedition_obligatoire && <span style={{ color: T.danger }}>*</span>}</p>
        {!regles.expedition_obligatoire && methodesVendeur.length > 0 && <p style={{ fontSize: 12, color: T.light, margin: '0 0 8px' }}>Facultatif : si vous ne choisissez aucune méthode, la livraison est gratuite pour ce produit.</p>}
        {methodesVendeur.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '2px solid #008060', background: '#f0fdf4' }}>
              <input type="checkbox" checked readOnly style={{ width: 16, height: 16, accentColor: '#008060' }} />
              <span style={{ fontSize: 20 }}>🎁</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 2px' }}>Livraison gratuite</p>
                <p style={{ fontSize: 12, color: T.light, margin: 0 }}>Appliquée par défaut — configurez vos méthodes dans Configuration</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#008060', background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>Gratuit</span>
            </div>
            <p style={{ fontSize: 12, color: T.light, margin: 0 }}>💡 Ajoutez vos méthodes dans <strong>Configuration → Méthodes d'expédition</strong> pour plus d'options.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methodesVendeur.map((m: any) => {
              const choisi = methodesSel.includes(m.id);
              const gratuit = m.libelle_prix === 'Gratuit';
              return (
                <div key={m.id} onClick={() => setMethodesSel(prev => (prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]))}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `2px solid ${choisi ? '#008060' : '#e1e3e5'}`, background: choisi ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={choisi} onChange={() => {}} style={{ width: 16, height: 16, accentColor: '#008060', cursor: 'pointer' }} />
                  <span style={{ fontSize: 20 }}>{m.logo || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 2px' }}>{m.nom || 'Expédition'}</p>
                    {m.delais_estime && <p style={{ fontSize: 12, color: T.light, margin: 0 }}>⏱ {m.delais_estime}</p>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: gratuit ? '#008060' : T.text, background: gratuit ? '#f0fdf4' : '#f5f5f5', padding: '3px 10px', borderRadius: 20, textAlign: 'center' }}>{m.libelle_prix}</span>
                </div>
              );
            })}
            {regles.expedition_obligatoire && methodesSel.length === 0 && <p style={{ fontSize: 12, color: '#d72c0d', margin: '4px 0 0' }}>Sélectionnez au moins une méthode d'expédition.</p>}
          </div>
        )}
      </div>

      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...lbl, margin: 0 }}>Variantes (taille, couleur…)</label>
          {variantes.length < 20 && <button onClick={() => setVariantes(v => [...v, { nom: '', prix: '', stock: '' }])} style={{ border: `1px solid ${accent}`, color: accent, background: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter</button>}
        </div>
        {variantes.length === 0 && <p style={{ fontSize: 12, color: T.light, margin: 0 }}>Aucune variante — le produit est vendu tel quel.</p>}
        {variantes.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? (regles.gerer_stock ? '1fr 1fr 32px' : '1fr 32px') : (regles.gerer_stock ? '2fr 1fr 1fr 32px' : '2fr 1fr 32px'), gap: 8, marginBottom: 8 }}>
            <input value={v.nom} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, nom: e.target.value } : x)))} maxLength={60} placeholder="Nom (ex : Rouge, M)" style={{ ...champ, gridColumn: isMobile ? '1 / -1' : undefined }} />
            <input type="number" min="0" step="0.01" value={v.prix} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, prix: e.target.value } : x)))} placeholder="Prix ($)" style={champ} />
            {regles.gerer_stock && <input type="number" min="0" step="1" value={v.stock} onChange={e => setVariantes(a => a.map((x, k) => (k === i ? { ...x, stock: e.target.value } : x)))} placeholder="Stock" style={champ} />}
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