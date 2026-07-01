// src/pages/PageProduit.tsx
// Page produit publique e-Vend

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WishlistButton from '../components/WishlistButton';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';
const DASHBOARD_URL = 'https://evend-multivendeur-api.onrender.com';

interface Produit {
  id: number;
  nom: string;
  prix: number;
  prix_original?: number;
  image?: string;
  images?: string;
  description?: string;
  stock: number;
  etat?: string;
  marque?: string;
  modele?: string;
  poids?: number;
  hauteur?: number;
  largeur?: number;
  longueur?: number;
  pays_fabrication?: string;
  retour_offert?: string;
  garantie?: string;
  ville?: string;
  vendeur_id?: number;
  nom_boutique?: string;
  vendeur_nom?: string;
  vendeur_ville?: string;
  categorie_nom?: string;
  type_vente?: string;
  vues?: number;
  facturation_taxes?: boolean;
  make_offer_enabled?: boolean;
  make_offer_prix_min?: number;
  make_offer_auto_accept?: boolean;
  type_annonce?: string;
  sku?: string;
  code_barres?: string;
  formats?: string;
  mode_expedition?: any;
}

interface Similaire {
  id: number;
  nom: string;
  prix: number;
  prix_original?: number;
  image?: string;
  vendeur_nom?: string;
}

interface Avis {
  note: number;
  commentaire: string;
  created_at: string;
  prenom?: string;
  nom?: string;
}

interface Variante {
  id: number;
  combinaison: Record<string, string>;
  prix: number;
  quantite: number;
  sku?: string;
  poids?: number;
  image_url?: string;
}

interface Props {}

export default function PageProduit({}: Props) {
  const { id: idParam } = useParams<{ id: string }>();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [similaires, setSimilaires] = useState<Similaire[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageActive, setImageActive] = useState<string | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [messageAjout, setMessageAjout] = useState<{ succes: boolean; texte: string } | null>(null);

  // Variantes
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [varianteSelectionnee, setVarianteSelectionnee] = useState<Variante | null>(null);
  const [selectionOptions, setSelectionOptions] = useState<Record<string, string>>({});

  // Modal avis
  const [modalAvisOuvert, setModalAvisOuvert] = useState(false);

  // Enchère
  const [enchereActive, setEnchereActive] = useState<any>(null);

  // Détection mobile
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Alerte prix
  const [alertePrixConfig, setAlertePrixConfig] = useState<any>(null);
  const [methodesExpedition, setMethodesExpedition] = useState<any[]>([]);
  const [alertePrixOuvert, setAlertePrixOuvert] = useState(false);
  const [alertePrixEmail, setAlertePrixEmail] = useState('');
  const [alertePrixEnvoi, setAlertePrixEnvoi] = useState(false);
  const [alertePrixResultat, setAlertePrixResultat] = useState<{ succes: boolean; texte: string } | null>(null);

  // Make Offer
  const [makeOfferOuvert, setMakeOfferOuvert] = useState(false);
  const [makeOfferMontant, setMakeOfferMontant] = useState('');
  const [makeOfferNom, setMakeOfferNom] = useState('');
  const [makeOfferEmail, setMakeOfferEmail] = useState('');
  const [makeOfferMessage, setMakeOfferMessage] = useState('');
  const [makeOfferEnCours, setMakeOfferEnCours] = useState(false);
  const [makeOfferResultat, setMakeOfferResultat] = useState<{ succes: boolean; texte: string } | null>(null);

  // Extraire l'ID depuis l'URL si pas passé en prop
  const id = parseInt(idParam || '0');

  useEffect(() => {
    async function fetchProduit() {
      try {
        const res = await fetch(`${API_BASE}/catalogue/produit/${id}`);
        if (!res.ok) throw new Error('Produit introuvable');
        const data = await res.json();
        setProduit(data.produit);
        setSimilaires(data.similaires || []);
        setAvis(data.avis || []);
        const vars: Variante[] = (data.variantes || []).map((v: any) => ({
          ...v,
          combinaison: typeof v.combinaison === 'string' ? JSON.parse(v.combinaison) : (v.combinaison || {}),
          prix: parseFloat(String(v.prix)),
          quantite: parseInt(String(v.quantite)) || 0,
        }));
        setVariantes(vars);

        // Image principale
        const imgs = getImages(data.produit);
        if (imgs.length > 0) setImageActive(imgs[0]);

        // Vérifier si enchère active sur ce produit
        try {
          const enchRes = await fetch(`${API_BASE}/encheres/produit/${id}`);
          if (enchRes.ok) {
            const enchData = await enchRes.json();
            if (enchData.enchere && ['en_cours', 'a_venir'].includes(enchData.enchere.statut)) {
              setEnchereActive(enchData.enchere);
              // Exposer les variables globales pour evend-auction-widget.js
              (window as any).evendProductId = String(id);
              (window as any).evendProductTags = enchData.enchere.statut === 'en_cours'
                ? ['evend_on_auction', 'active_bidding']
                : ['evend_upcoming_auction'];
              // Charger le script widget si pas déjà chargé
              if (!document.getElementById('evend-auction-widget-script')) {
                const script = document.createElement('script');
                script.id = 'evend-auction-widget-script';
                script.src = `${DASHBOARD_URL}/public/evend-auction-widget.js`;
                script.defer = true;
                document.body.appendChild(script);
              } else {
                // Script déjà chargé — relancer init si disponible
                if ((window as any).evendWidgetLoaded) {
                  (window as any).evendWidgetLoaded = false;
                }
                const script = document.getElementById('evend-auction-widget-script') as HTMLScriptElement;
                const newScript = document.createElement('script');
                newScript.id = 'evend-auction-widget-script-reload';
                newScript.src = script.src + '?t=' + Date.now();
                newScript.defer = true;
                document.body.appendChild(newScript);
              }
            }
          }
        } catch { /* silencieux */ }

        // Méthodes d'expédition du produit
        try {
          const resMeth = await fetch(`${API_BASE.replace('/api', '')}/api/vendeurs/produit/${id}/methodes`);
          if (resMeth.ok) {
            const dataMeth = await resMeth.json();
            setMethodesExpedition(dataMeth.methodes || []);
          }
        } catch {}

        // Config alerte prix (depuis l'admin)
        try {
          const configRes = await fetch(`${API_BASE}/wishlist/config`);
          if (configRes.ok) {
            const configData = await configRes.json();
            const pd = configData?.priceDropAlert || configData?.config?.priceDropAlert;
            if (pd?.enabled) setAlertePrixConfig(pd);
          }
        } catch { /* silencieux */ }
      } catch {
        setProduit(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduit();
  }, [id]);

  function getImages(p: Produit): string[] {
    const imgs: string[] = [];
    if (p.image) imgs.push(p.image);
    if (p.images) {
      try {
        const arr = JSON.parse(p.images);
        if (Array.isArray(arr)) arr.forEach(i => { if (!imgs.includes(i)) imgs.push(i); });
      } catch {
        if (!imgs.includes(p.images!)) imgs.push(p.images!);
      }
    }
    return imgs;
  }

  async function ajouterAuPanier() {
    if (!produit) return;
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = `${DASHBOARD_URL}/login?redirect=produit/${id}`;
      return;
    }
    setAjoutEnCours(true);
    try {
      const res = await fetch(`${API_BASE}/panier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titre: produit.nom + (varianteSelectionnee ? ' — ' + Object.values(varianteSelectionnee.combinaison).join(' / ') : ''),
          image_url: imageVariante || imageActive,
          produit_id: produit.id,
          variante_id: varianteSelectionnee?.id || null,
          prix: prixAffiche,
          quantite,
          vendeur_id: null,
        }),
      });

      if (res.ok) {
        setMessageAjout({ succes: true, texte: `✓ ${quantite}x "${produit.nom}" ajouté au panier !` });
      } else if (res.status === 401) {
        window.location.href = `${DASHBOARD_URL}/login?redirect=produit/${id}`;
        return;
      } else {
        setMessageAjout({ succes: false, texte: '❌ Erreur lors de l\'ajout. Réessayez.' });
      }
    } catch {
      setMessageAjout({ succes: false, texte: '❌ Erreur de connexion.' });
    } finally {
      setAjoutEnCours(false);
      setTimeout(() => setMessageAjout(null), 4000);
    }
  }

  async function soumettreAlertePrix() {
    if (!produit || !alertePrixEmail) return;
    setAlertePrixEnvoi(true);
    try {
      const res = await fetch(`${API_BASE}/price-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produit.id,
          email: alertePrixEmail,
          prix_cible: parseFloat(String(produit.prix)) * (1 - ((alertePrixConfig?.pourcentageCible || 10) / 100)),
          produit_titre: produit.nom,
          produit_url: window.location.href,
          image_url: imageActive,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setAlertePrixResultat({ succes: true, texte: '✅ Vous serez alerté par courriel dès que le prix baisse !' });
        setAlertePrixEmail('');
        setTimeout(() => { setAlertePrixOuvert(false); setAlertePrixResultat(null); }, 4000);
      } else {
        setAlertePrixResultat({ succes: false, texte: data.message || '❌ Erreur. Réessayez.' });
      }
    } catch (_) {
      setAlertePrixResultat({ succes: false, texte: '❌ Erreur de connexion.' });
    } finally {
      setAlertePrixEnvoi(false);
    }
  }

  async function soumettreOffre() {
    if (!produit || !makeOfferMontant || !makeOfferEmail) return;
    setMakeOfferEnCours(true);
    try {
      const res = await fetch(`${API_BASE}/make-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonce_id: String(produit.id),
          vendeur_id: produit.vendeur_id,
          acheteur_email: makeOfferEmail,
          acheteur_nom: makeOfferNom,
          montant: parseFloat(makeOfferMontant),
          message: makeOfferMessage || null,
          produit_titre: produit.nom,
          produit_url: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMakeOfferResultat({ succes: true, texte: data.message });
        setMakeOfferMontant(''); setMakeOfferNom(''); setMakeOfferEmail(''); setMakeOfferMessage('');
        setTimeout(() => { setMakeOfferOuvert(false); setMakeOfferResultat(null); }, 4000);
      } else {
        setMakeOfferResultat({ succes: false, texte: data.message || "Erreur lors de l'envoi." });
      }
    } catch (_) {
      setMakeOfferResultat({ succes: false, texte: '❌ Erreur de connexion.' });
    } finally {
      setMakeOfferEnCours(false);
    }
  }

  // Options disponibles (ex: {Taille: ['S','M','L'], Couleur: ['Rouge','Bleu']})
  const optionsDisponibles = React.useMemo(() => {
    const opts: Record<string, string[]> = {};
    variantes.forEach((v: Variante) => {
      Object.entries(v.combinaison).forEach(([key, val]: [string, string]) => {
        if (!opts[key]) opts[key] = [];
        if (!opts[key].includes(val)) opts[key].push(val);
      });
    });
    return opts;
  }, [variantes]);

  const hasVariantes = variantes.length > 0 && Object.keys(optionsDisponibles).length > 0;

  // Variante correspondant à la sélection actuelle
  const varianteMatch = React.useMemo(() => {
    if (!hasVariantes) return null;
    const keys = Object.keys(selectionOptions);
    if (keys.length === 0) return null;
    return variantes.find((v: Variante) =>
      keys.every((k: string) => v.combinaison[k] === selectionOptions[k])
    ) || null;
  }, [variantes, selectionOptions, hasVariantes]);

  // Sélectionner auto si toutes les options sont choisies
  React.useEffect(() => {
    setVarianteSelectionnee(varianteMatch);
  }, [varianteMatch]);

  const prixAffiche = parseFloat(String(
    varianteSelectionnee?.prix ?? produit?.prix ?? 0
  )) || 0;

  const stockAffiche = parseInt(String(
    varianteSelectionnee?.quantite ?? produit?.stock ?? 0
  )) || 0;

  const imageVariante = varianteSelectionnee?.image_url || null;

  const notesMoyenne = avis.length > 0
    ? (avis.reduce((s: number, a: Avis) => s + a.note, 0) / avis.length).toFixed(1)
    : null;

  const rabais = produit?.prix_original && parseFloat(String(produit.prix_original)) > parseFloat(String(produit.prix))
    ? Math.round(((parseFloat(String(produit.prix_original)) - parseFloat(String(produit.prix))) / parseFloat(String(produit.prix_original))) * 100)
    : null;

  if (loading) return (
    <div style={s.page}>
      <NavBar />
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ ...s.skeleton, height: '500px', borderRadius: '16px' }} />
      </div>
    </div>
  );

  if (!produit) return (
    <div style={s.page}>
      <NavBar />
      <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.5)' }}>
        <p style={{ fontSize: '18px' }}>Produit introuvable</p>
        <a href="/catalogue" style={{ color: '#3b82f6' }}>← Retour au catalogue</a>
      </div>
    </div>
  );

  const images = getImages(produit);

 return (
    <div style={s.page}>
      <NavBar />

      <div style={{ ...s.container, padding: isMobile ? "12px 14px" : "24px" }}>
        {/* Fil d'Ariane */}
        <p style={s.breadcrumb}>
          <a href="/catalogue" style={s.breadcrumbLien}>Catalogue</a>
          {produit.categorie_nom && (
            <> › <span style={{ color: 'rgba(255,255,255,0.5)' }}>{produit.categorie_nom}</span></>
          )}
          › <span style={{ color: '#fff' }}>{produit.nom}</span>
        </p>

        {/* Layout principal */}
        <div style={isMobile ? {
          display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px'
        } : s.layout}>
          {/* ── Galerie images ── */}
          <div style={s.galerie}>
            <div style={isMobile ? { ...s.imageMain, borderRadius: '12px', margin: '0 0 10px' } : s.imageMain}>
              {imageActive
                ? <img src={imageActive} alt={produit.nom} style={s.imgMain} />
                : <div style={s.imgPlaceholder}>📦</div>
              }
              {rabais && <span style={s.badgeRabais}>-{rabais}%</span>}
            </div>
            {images.length > 1 && (
              <div style={isMobile ? {
                display: 'flex', gap: '8px', overflowX: 'auto' as const,
                padding: '4px 0', marginTop: '8px',
              } : s.thumbnails}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    style={{ ...s.thumb, ...(imageActive === img ? s.thumbActif : {}) }}
                    onClick={() => setImageActive(img)}
                  >
                    <img src={img} alt={`${produit.nom} ${i + 1}`} style={s.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos produit ── */}
          <div style={isMobile ? { ...s.infos, padding: '0 2px' } : s.infos}>
            {/* Vendeur + WishlistButton sur la même ligne */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {(produit.nom_boutique || produit.vendeur_nom) && (
                <a
                  href={`${DASHBOARD_URL}/boutique/${produit.vendeur_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.vendeurNom, textDecoration: 'none', marginBottom: 0 }}
                >
                  {produit.nom_boutique || produit.vendeur_nom}
                </a>
              )}
              
              {/* Wishlist Button */}
              <WishlistButton
                productId={String(produit.id)}
                variantId={varianteSelectionnee?.id ? String(varianteSelectionnee.id) : undefined}
                productData={{
                  title: produit.nom,
                  handle: produit.sku,
                  imageUrl: imageActive || undefined,
                  variantTitle: varianteSelectionnee ? Object.values(varianteSelectionnee.combinaison).join(' / ') : undefined,
                  price: prixAffiche,
                  compareAtPrice: produit.prix_original ? parseFloat(String(produit.prix_original)) : undefined,
                }}
                size={20}
                showTooltip={true}
              />
            </div>
            
            <h1 style={isMobile ? { ...s.titre, fontSize: '20px' } : s.titre}>{produit.nom}</h1>

            {/* Note */}
            {notesMoyenne && (
              <div style={s.notes}>
                {'★'.repeat(Math.round(parseFloat(notesMoyenne)))}{'☆'.repeat(5 - Math.round(parseFloat(notesMoyenne)))}
                <span style={s.notesTexte}>{notesMoyenne} ({avis.length} avis)</span>
              </div>
            )}

            {/* Prix — caché si enchère active */}
            {!enchereActive && <div style={s.prixBloc}>
              <span style={s.prixActuel}>{prixAffiche.toFixed(2)} $ CAD</span>
              {!hasVariantes && produit.prix_original && parseFloat(String(produit.prix_original)) > parseFloat(String(produit.prix)) && (
                <span style={s.prixOriginal}>{parseFloat(String(produit.prix_original)).toFixed(2)} $</span>
              )}
              {produit.facturation_taxes
                ? <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>+ taxe</span>
                : <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>sans taxe</span>
              }
            </div>}

            {/* Stock — caché si enchère active */}
            {!enchereActive && hasVariantes && !varianteSelectionnee ? (
              <div style={{ marginBottom: '8px' }}>
                {variantes.map((v: Variante) => {
                  const label = Object.values(v.combinaison).join(' / ');
                  return (
                    <p key={v.id} style={{ fontSize: '13px', margin: '2px 0', color: v.quantite > 0 ? '#10b981' : '#ef4444' }}>
                      {v.quantite > 0
                        ? `✓ ${label} — ${v.quantite} disponible${v.quantite > 1 ? 's' : ''}`
                        : `✗ ${label} — épuisé`}
                    </p>
                  );
                })}
              </div>
            ) : (
              <p style={{ ...s.stock, color: stockAffiche > 0 ? '#10b981' : '#ef4444', marginBottom: '8px' }}>
                {varianteSelectionnee
                  ? stockAffiche > 0
                    ? `✓ En stock (${stockAffiche} disponible${stockAffiche > 1 ? 's' : ''})`
                    : '✗ Épuisé pour cette variante'
                  : produit.stock > 0
                    ? `✓ En stock (${produit.stock} disponible${produit.stock > 1 ? 's' : ''})`
                    : '✗ Épuisé'
                }
              </p>
            )}

            {/* ── ENCHÈRE ACTIVE — remplace tous les boutons ── */}
            {enchereActive ? (
              <div style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
                border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: '14px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '20px' }}>🔨</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                      {enchereActive.statut === 'en_cours' ? 'Enchère en cours' : 'Enchère à venir'}
                    </p>
                    {enchereActive.statut === 'en_cours' && enchereActive.date_fin && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Se termine le {new Date(enchereActive.date_fin).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {enchereActive.statut === 'a_venir' && enchereActive.date_debut && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Commence le {new Date(enchereActive.date_debut).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prix de départ</p>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>{parseFloat(String(enchereActive.prix_base || 0)).toFixed(2)} $</p>
                  </div>
                  {enchereActive.mise_actuelle > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mise actuelle</p>
                      <p style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', margin: 0 }}>{parseFloat(String(enchereActive.mise_actuelle)).toFixed(2)} $</p>
                    </div>
                  )}
                  {enchereActive.nb_offres > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offres</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', margin: 0 }}>{enchereActive.nb_offres}</p>
                    </div>
                  )}
                </div>

                {/* Point d'injection pour evend-auction-widget.js */}
                <div id="product-description" data-product-form="" />
              </div>
            ) : (
              <>
            {/* ── Sélecteur de variantes ── */}
            {hasVariantes && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(optionsDisponibles).map(([optionNom, valeurs]) => (
                  <div key={optionNom}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {optionNom}
                      {selectionOptions[optionNom] && (
                        <span style={{ color: '#fff', marginLeft: '8px', fontWeight: 700, textTransform: 'none' }}>
                          : {selectionOptions[optionNom]}
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(valeurs as string[]).map((val: string) => {
                        // Vérifier si cette valeur est dispo avec les autres sélections
                        const testSel = { ...selectionOptions, [optionNom]: val };
                        const dispo = variantes.some((v: Variante) =>
                          Object.entries(testSel).every(([k, vv]) => v.combinaison[k] === (vv as string))
                          && v.quantite > 0
                        );
                        // Variante exacte pour cette valeur (pour vérifier stock=0)
                        const varianteVal = variantes.find((v: Variante) =>
                          Object.entries(testSel).every(([k, vv]) => v.combinaison[k] === (vv as string))
                        );
                        const estEpuise = varianteVal && varianteVal.quantite === 0;
                        const selectionne = selectionOptions[optionNom] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => {
                              if (!dispo && !estEpuise) return;
                              if (estEpuise) return; // non clicable si épuisé
                              const newSel = { ...selectionOptions, [optionNom]: val };
                              setSelectionOptions(newSel);
                              // Changer l'image si la variante a une image
                              const matchVar = variantes.find((v: Variante) =>
                                Object.entries(newSel).every(([k, vv]) => v.combinaison[k] === (vv as string))
                              );
                              if (matchVar?.image_url) {
                                setImageActive(matchVar.image_url);
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: selectionne
                                ? '2px solid #3b82f6'
                                : estEpuise
                                  ? '1px solid rgba(239,68,68,0.3)'
                                  : '1px solid rgba(255,255,255,0.15)',
                              background: selectionne
                                ? 'rgba(59,130,246,0.2)'
                                : estEpuise
                                  ? 'rgba(239,68,68,0.05)'
                                  : 'rgba(255,255,255,0.05)',
                              color: selectionne
                                ? '#93c5fd'
                                : estEpuise
                                  ? 'rgba(239,68,68,0.5)'
                                  : 'rgba(255,255,255,0.8)',
                              fontSize: '14px',
                              fontWeight: selectionne ? 700 : 400,
                              cursor: estEpuise ? 'not-allowed' : 'pointer',
                              textDecoration: estEpuise ? 'line-through' : 'none',
                              position: 'relative' as const,
                            }}
                          >
                            {val}
                            {estEpuise && (
                              <span style={{ fontSize: '9px', display: 'block', color: 'rgba(239,68,68,0.6)', marginTop: '1px' }}>épuisé</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Prix variante */}
                {varianteSelectionnee && varianteSelectionnee.prix !== produit.prix && (
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Prix pour cette variante : <strong style={{ color: '#fff' }}>{varianteSelectionnee.prix.toFixed(2)} $ CAD</strong>
                  </p>
                )}
                {/* Avertissement si sélection incomplète */}
                {Object.keys(optionsDisponibles).length > Object.keys(selectionOptions).length && (
                  <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>
                    ⚠️ Veuillez sélectionner toutes les options avant d'ajouter au panier.
                  </p>
                )}
              </div>
            )}

            {/* Quantité + Ajouter */}
            {(hasVariantes ? stockAffiche > 0 && Object.keys(selectionOptions).length === Object.keys(optionsDisponibles).length : produit.stock > 0) && (
              <div style={isMobile ? {
                display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '16px', alignItems: 'center',
              } : s.actionBloc}>
                <div style={isMobile ? { ...s.qteControle, flex: '0 0 33%', justifyContent: 'center' } : s.qteControle}>
                  <button style={s.qteBtn} onClick={() => setQuantite((q: number) => Math.max(1, q - 1))}>−</button>
                  <span style={s.qteValeur}>{quantite}</span>
                  <button style={s.qteBtn} onClick={() => setQuantite((q: number) => Math.min(stockAffiche || produit.stock, q + 1))}>+</button>
                </div>
                <button
                  style={{ ...s.btnAjouter, opacity: ajoutEnCours ? 0.7 : 1, ...(isMobile ? { flex: 1, width: 'auto' } : {}) }}
                  onClick={ajouterAuPanier}
                  disabled={ajoutEnCours}
                >
                  {ajoutEnCours ? 'Ajout en cours…' : '🛒 Ajouter au panier'}
                </button>
              </div>
            )}

            {messageAjout && (
              <div style={{
                ...s.message,
                background: messageAjout.succes ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${messageAjout.succes ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: messageAjout.succes ? '#10b981' : '#ef4444',
              }}>
                {messageAjout.texte}
                {messageAjout.succes && (
                  <a href={`${DASHBOARD_URL}/dashboard?page=panier`} style={{ color: '#3b82f6', marginLeft: '12px', fontWeight: 600 }}>
                    Voir le panier →
                  </a>
                )}
              </div>
            )}

            {/* ── Widget Alerte Baisse de Prix ── */}
            {alertePrixConfig && (
              <div style={{ marginTop: '12px' }}>
                {!alertePrixOuvert ? (
                  <button
                    onClick={() => setAlertePrixOuvert(true)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      background: alertePrixConfig.couleurFondBouton || '#000',
                      border: alertePrixConfig.borderWidth
                        ? `${alertePrixConfig.borderWidth}px solid ${alertePrixConfig.borderColor || 'transparent'}`
                        : 'none',
                      borderRadius: `${alertePrixConfig.borderRadius ?? 8}px`,
                      color: alertePrixConfig.couleurTexteBouton || '#ff6d37',
                      fontSize: `${alertePrixConfig.fontSize || 14}px`,
                      fontWeight: alertePrixConfig.fontWeight || '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: `${alertePrixConfig.marginTop || 0}px`,
                      marginBottom: `${alertePrixConfig.marginBottom || 0}px`,
                    }}
                  >
                    🔔 {alertePrixConfig.texteBouton || 'Alerte de baisse de prix'}
                  </button>
                ) : (
                  <div style={{
                    background: 'rgba(255,109,55,0.07)',
                    border: '1px solid rgba(255,109,55,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: alertePrixConfig.couleurTexteBouton || '#ff6d37', margin: 0 }}>
                        🔔 {alertePrixConfig.texteBouton || 'Alerte de baisse de prix'}
                      </p>
                      <button onClick={() => { setAlertePrixOuvert(false); setAlertePrixResultat(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
                      Entrez votre courriel et nous vous avertirons dès que ce produit est en rabais.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        placeholder="votre@courriel.com"
                        value={alertePrixEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlertePrixEmail(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && soumettreAlertePrix()}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={soumettreAlertePrix}
                        disabled={alertePrixEnvoi || !alertePrixEmail}
                        style={{
                          padding: '10px 16px',
                          background: alertePrixConfig.couleurFondBouton || '#000',
                          border: 'none',
                          borderRadius: '8px',
                          color: alertePrixConfig.couleurTexteBouton || '#ff6d37',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: alertePrixEnvoi ? 'not-allowed' : 'pointer',
                          opacity: alertePrixEnvoi ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {alertePrixEnvoi ? '…' : "🔔 M'alerter"}
                      </button>
                    </div>
                    {alertePrixResultat && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: alertePrixResultat.succes ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: alertePrixResultat.succes ? '#10b981' : '#ef4444',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        {alertePrixResultat.texte}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Make Offer Widget ── */}
            {produit.make_offer_enabled && (
              <div style={{ marginTop: '16px' }}>
                {!makeOfferOuvert ? (
                  <button
                    onClick={() => setMakeOfferOuvert(true)}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent',
                      border: '2px solid #f59e0b', borderRadius: '10px',
                      color: '#f59e0b', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    💬 Faire une offre
                  </button>
                ) : (
                  <div style={{
                    background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '12px', padding: '20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>💬 Faire une offre</p>
                      <button onClick={() => { setMakeOfferOuvert(false); setMakeOfferResultat(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                    </div>

                    {produit.make_offer_prix_min && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                        Offre minimum : <strong style={{ color: '#f59e0b' }}>{parseFloat(String(produit.make_offer_prix_min)).toFixed(2)} $</strong>
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="number"
                        placeholder={`Votre offre (prix affiché: ${parseFloat(String(produit.prix)).toFixed(2)} $)`}
                        value={makeOfferMontant}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMakeOfferMontant(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Votre nom"
                        value={makeOfferNom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMakeOfferNom(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="email"
                        placeholder="Votre courriel *"
                        value={makeOfferEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMakeOfferEmail(e.target.value)}
                        style={inputStyle}
                      />
                      <textarea
                        placeholder="Message au vendeur (optionnel)"
                        value={makeOfferMessage}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMakeOfferMessage(e.target.value)}
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical' as const }}
                      />
                      <button
                        onClick={soumettreOffre}
                        disabled={makeOfferEnCours || !makeOfferMontant || !makeOfferEmail}
                        style={{
                          padding: '12px', background: makeOfferEnCours ? 'rgba(245,158,11,0.4)' : '#f59e0b',
                          border: 'none', borderRadius: '8px', color: '#000', fontSize: '14px',
                          fontWeight: 700, cursor: makeOfferEnCours ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {makeOfferEnCours ? 'Envoi en cours…' : '📤 Envoyer mon offre'}
                      </button>
                    </div>

                    {makeOfferResultat && (
                      <div style={{
                        marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                        background: makeOfferResultat.succes ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: makeOfferResultat.succes ? '#10b981' : '#ef4444',
                        fontSize: '13px', fontWeight: 600,
                      }}>
                        {makeOfferResultat.texte}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Méthodes d'expédition ── */}
            {methodesExpedition.length > 0 && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                {/* En-tête */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '16px' }}>🚚</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Options d'expédition
                  </span>
                </div>
                {/* Liste des méthodes */}
                <div style={{ padding: '8px 0' }}>
                  {methodesExpedition.filter(m => m.id !== -1 || methodesExpedition.length === 1).map((m: any, i: number) => {
                    const gratuit = (parseFloat(m.frais_calcule ?? m.frais_fixes ?? 0)) === 0;
                    const prix = m.frais_calcule ?? m.frais_fixes ?? 0;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 16px',
                        borderBottom: i < methodesExpedition.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}>
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{m.logo || '📦'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.nom || 'Expédition'}
                          </p>
                          {m.delais_estime && (
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                              ⏱ {m.delais_estime}
                            </p>
                          )}
                          {m.gratuit_superieur && (
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>
                              🎁 Gratuit dès {parseFloat(m.gratuit_superieur).toFixed(2)} $ d'achat
                            </p>
                          )}
                        </div>
                        <span style={{
                          fontSize: '14px', fontWeight: 800, flexShrink: 0,
                          color: gratuit ? '#4ade80' : '#f5efe6',
                          background: gratuit ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
                          padding: '4px 12px', borderRadius: '20px',
                          border: `1px solid ${gratuit ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                          {gratuit ? 'Gratuit' : `${parseFloat(String(prix)).toFixed(2)} $`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Note checkout */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    Choisissez votre méthode d'expédition lors du paiement
                  </p>
                </div>
              </div>
            )}

              </>
            )}

          </div>
        </div>

        {/* ── Description ── */}
        {produit.description && (
          <div style={s.section}>
            <h2 style={s.sectionTitre}>Description</h2>
            <style>{`
              .evend-description * {
                color: rgba(255,255,255,0.82) !important;
                background-color: transparent !important;
                background: transparent !important;
                font-family: inherit !important;
              }
              .evend-description a { color: #60a5fa !important; }
              .evend-description strong, .evend-description b { color: #fff !important; }
              .evend-description h1, .evend-description h2,
              .evend-description h3, .evend-description h4 {
                color: #fff !important;
                margin-top: 16px !important;
              }
              .evend-description ul, .evend-description ol {
                padding-left: 20px !important;
              }
              .evend-description img { color: unset !important; background: unset !important; }
            `}</style>
            <div
              className="evend-description"
              style={{ fontSize: '15px', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{
                __html: produit.description
                  // Retirer les balises img et leurs contenus
                  .replace(/<img[^>]*>/gi, '')
                  // Retirer les balises figure (souvent wrappent les images)
                  .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
                  // Retirer les style="color:..." inline qui forcent du noir
                  .replace(/\sstyle="[^"]*color\s*:\s*(#000|#000000|black|rgb\(0,\s*0,\s*0\))[^"]*"/gi, '')
              }}
            />
          </div>
        )}

        {/* ── Caractéristiques + Avis côte à côte ── */}
        {(() => {
          const modeExpedition = produit.mode_expedition
            ? (typeof produit.mode_expedition === 'string'
                ? JSON.parse(produit.mode_expedition)
                : produit.mode_expedition)
            : null;
          const modesStr = modeExpedition
            ? [modeExpedition.transporteur && 'Transporteur', modeExpedition.ramassage && 'Ramassage'].filter(Boolean).join(' & ')
            : null;

          const lignes = [
            ["Type d'annonce",        produit.type_annonce],
            ['Descriptif / État',     produit.etat],
            ['Retour offert',         produit.retour_offert],
            ['Garantie offerte',      produit.garantie],
            ['Marque',                produit.marque],
            ['Modèle',                produit.modele],
            ['Pays de fabrication',   produit.pays_fabrication],
            ['SKU / Numéro de pièce', produit.sku],
            ['Code à barres',         produit.code_barres],
            ['Longueur (cm)',         produit.longueur ? String(produit.longueur) : null],
            ['Largeur (cm)',          produit.largeur  ? String(produit.largeur)  : null],
            ['Hauteur (cm)',          produit.hauteur  ? String(produit.hauteur)  : null],
            ['Poids (kg)',            produit.poids    ? String(produit.poids)    : null],
            ['Formats / Grandeur',    produit.formats],
            ["Mode d'expédition",     modesStr],
          ].filter(([, v]) => v && String(v).trim() !== '');

          // Calcul note moyenne et distribution
          const nbAvis = avis.length;
          const moyenne = nbAvis > 0
            ? (avis.reduce((s: number, a: Avis) => s + a.note, 0) / nbAvis)
            : 0;
          const distribution = [5, 4, 3, 2, 1].map(etoile => ({
            etoile,
            count: avis.filter((a: Avis) => a.note === etoile).length,
            pct: nbAvis > 0
              ? Math.round((avis.filter((a: Avis) => a.note === etoile).length / nbAvis) * 100)
              : 0,
          }));

          if (lignes.length === 0 && nbAvis === 0) return null;

          return (
            <div style={isMobile ? { ...s.section } : { ...s.section, display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

              {/* ── Caractéristiques (2/3) ── */}
              {lignes.length > 0 && (
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div style={s.caracteristiques}>
                    <p style={s.carTitre}>✦ Caractéristiques</p>
                    {lignes.map(([label, val], i) => (
                      <div key={label as string} style={{
                        ...s.carLigne,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}>
                        <span style={s.carLabel}>{label}</span>
                        <span style={s.carVal}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Avis clients (1/3) ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.caracteristiques}>
                  <p style={s.carTitre}>★ Avis clients</p>

                  {/* Note globale */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: '40px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>
                      {nbAvis > 0 ? moyenne.toFixed(1) : '—'}
                    </p>
                    <p style={{ fontSize: '18px', color: '#f59e0b', margin: '4px 0 2px', letterSpacing: '2px' }}>
                      {nbAvis > 0
                        ? '★'.repeat(Math.round(moyenne)) + '☆'.repeat(5 - Math.round(moyenne))
                        : '☆☆☆☆☆'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                      {nbAvis > 0 ? `${nbAvis} avis` : "Pas d'avis pour cet article"}
                    </p>
                  </div>

                  {/* Barres de distribution */}
                  <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {distribution.map(({ etoile, pct, count }) => (
                      <div key={etoile} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', width: '14px', textAlign: 'right', flexShrink: 0 }}>{etoile}</span>
                        <span style={{ fontSize: '11px', color: '#f59e0b', flexShrink: 0 }}>★</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px', transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', width: '24px', flexShrink: 0 }}>{pct}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Bouton voir tous les avis */}
                  <div style={{ padding: '0 18px 14px' }}>
                    <button
                      onClick={() => setModalAvisOuvert(true)}
                      style={{
                        width: '100%', padding: '9px', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                        color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      {nbAvis > 0 ? `Voir les ${nbAvis} avis →` : "Aucun avis pour l'instant"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Modal Avis ── */}
        {modalAvisOuvert && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={() => setModalAvisOuvert(false)}
          >
            <div style={{
              background: '#111827', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px', width: '100%', maxWidth: '600px',
              maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header modal */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(29,78,216,0.2) 0%, transparent 100%)',
              }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    ★ Avis clients — {produit.nom}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
                    {avis.length > 0
                      ? `${avis.length} avis · Moyenne ${(avis.reduce((s: number, a: Avis) => s + a.note, 0) / avis.length).toFixed(1)} / 5`
                      : 'Aucun avis pour cet article'}
                  </p>
                </div>
                <button
                  onClick={() => setModalAvisOuvert(false)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '18px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>

              {/* Corps modal — liste des avis */}
              <div style={{ overflow: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {avis.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 12px' }}>☆</p>
                    <p style={{ fontSize: '15px', margin: 0 }}>Aucun avis pour cet article</p>
                    <p style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(255,255,255,0.25)' }}>Soyez le premier à laisser un avis après votre achat.</p>
                  </div>
                ) : (
                  avis.map((a: Avis, i: number) => (
                    <div key={i} style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px', padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {a.prenom} {a.nom?.[0]}.
                          </p>
                          <span style={{ fontSize: '15px', color: '#f59e0b', letterSpacing: '1px' }}>
                            {'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                          {new Date(a.created_at).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                      {a.commentaire && (
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                          {a.commentaire}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Produits similaires ── */}
        {similaires.length > 0 && (
          <div style={s.section}>
            <h2 style={s.sectionTitre}>Vous aimerez aussi</h2>
            <div style={s.similairesGrille}>
              {similaires.slice(0, 5).map((sim: Similaire) => (
                <a key={sim.id} href={`/produit/${sim.id}`} style={s.simCard}>
                  <div style={s.simImage}>
                    {sim.image
                      ? <img src={sim.image} alt={sim.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '30px', opacity: 0.3 }}>📦</span>
                    }
                  </div>
                  <div style={{ padding: '10px' }}>
                    <p style={s.simNom}>{sim.nom}</p>
                    <p style={s.simPrix}>{parseFloat(String(sim.prix)).toFixed(2)} $</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  const [dropdownOuvert, setDropdownOuvert] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOuvert(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <footer style={{ padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#000' }}>e</div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>e-Vend</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/catalogue" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>Catalogue</a>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>Mon compte</a>
          <a href="mailto:contact@e-vend.ca" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>Contact</a>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOuvert((o: boolean) => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: dropdownOuvert ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }}
            >
              Conditions et politiques
              <span style={{ fontSize: '9px', transform: dropdownOuvert ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
            </button>
            {dropdownOuvert && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', minWidth: '220px', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 100 }}>
                {[
                  { slug: 'privacy-policy',   titre: 'Politique de confidentialité' },
                  { slug: 'terms-of-service', titre: "Conditions d'utilisation" },
                  { slug: 'refund-policy',    titre: 'Politique de remboursement' },
                  { slug: 'shipping-policy',  titre: "Politique d'expédition" },
                ].map((p, i) => (
                  <a
                    key={p.slug}
                    href={`/politiques/${p.slug}`}
                    onClick={() => setDropdownOuvert(false)}
                    style={{ display: 'block', padding: '11px 18px', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '13px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    {p.titre}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>© 2026 e-Vend · Le marché d'ici, pour les gens d'ici 🇨🇦</p>
      </div>
    </footer>
  );
}

function NavBar() {
  return (
    <div style={{ background: 'rgba(15,20,40,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/catalogue" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>e-Vend</span>
        </a>
        <a href="/catalogue" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none', marginLeft: 'auto' }}>← Catalogue</a>
        <a href={`${DASHBOARD_URL}/dashboard?page=panier`} style={{ padding: '9px 16px', background: '#1d4ed8', border: 'none', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          🛒 Mon panier
        </a>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', color: '#fff' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '24px' }, // mobile: padding réduit
  breadcrumb: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' },
  breadcrumbLien: { color: '#3b82f6', textDecoration: 'none' },
  skeleton: { background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },

  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '48px' }, // mobile: 1 colonne via isMobile

  galerie: {},
  imageMain: { position: 'relative', aspectRatio: '1', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' },
  imgMain: { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', opacity: 0.2 },
  badgeRabais: { position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' },
  thumbnails: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  thumb: { width: '72px', height: '72px', padding: 0, border: '2px solid transparent', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' },
  thumbActif: { borderColor: '#3b82f6' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },

  infos: {},
  vendeurNom: { fontSize: '12px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' },
  titre: { fontSize: '24px', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }, // mobile: 20px via isMobile
  notes: { fontSize: '16px', color: '#f59e0b', marginBottom: '16px' },
  notesTexte: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' },
  prixBloc: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' },
  prixActuel: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  prixOriginal: { fontSize: '16px', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' },
  stock: { fontSize: '13px', fontWeight: 600, marginBottom: '20px' },

  actionBloc: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' },
  qteControle: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 14px' },
  qteBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' },
  qteValeur: { fontSize: '16px', fontWeight: 600, minWidth: '24px', textAlign: 'center' },
  btnAjouter: { flex: 1, padding: '14px', background: '#1d4ed8', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%' },
  message: { padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' },

  caracteristiques: { marginTop: '24px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset' },
  carTitre: { fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', padding: '14px 18px', borderBottom: '2px solid rgba(59,130,246,0.4)', margin: 0, background: 'linear-gradient(180deg, rgba(29,78,216,0.35) 0%, rgba(29,78,216,0.15) 100%)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
  carLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative' as const },
  carLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 },
  carVal: { fontSize: '13px', color: '#e2e8f0', fontWeight: 700, textAlign: 'right' as const, maxWidth: '60%', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' },

  section: { marginBottom: '48px' },
  sectionTitre: { fontSize: '18px', fontWeight: 700, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  description: { fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, whiteSpace: 'pre-wrap' },

  avisGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  avisCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' },
  avisHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  avisNote: { color: '#f59e0b', fontSize: '15px' },
  avisAuteur: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
  avisTexte: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', lineHeight: 1.6 },
  avisDate: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 },

  similairesGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
  simCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', color: '#fff', display: 'block' },
  simImage: { aspectRatio: '1', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  simNom: { fontSize: '13px', fontWeight: 500, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties,
  simPrix: { fontSize: '14px', fontWeight: 700, color: '#3b82f6', margin: 0 },
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};