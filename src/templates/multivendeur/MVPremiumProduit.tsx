// src/templates/multivendeur/MVPremiumProduit.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Fiche Produit

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

// ─── PRODUIT DÉMO ────────────────────────────────────────────────────────────
const DESC = {
  iphone: "Le dernier iPhone de Apple avec puce A17 Pro, appareil photo 48 MP et ecran Super Retina XDR. Disponible en titane naturel.",
  chaise: "Chaise de bureau haut de gamme avec support lombaire ajustable et accoudoirs 4D.",
  nike: "Chaussure lifestyle Nike avec unite Air Max visible. Confort optimal pour un usage quotidien.",
  sac: "Sac a main confectionne en cuir pleine fleur. Doublure en soie et finitions dorees.",
  guitare: "Guitare acoustique de qualite superieure avec table en epicea massif. Ideale pour debutants et intermediaires.",
  couteaux: "Ensemble de couteaux forges en acier japonais VG-10. Comprend: chef, santoku, pain, office et eplucheur.",
  velo: "VTT polyvalent avec cadre Alpha Silver Aluminum, fourche SR Suntour et groupe Shimano Altus 8 vitesses.",
  montre: "Montre connectee avec suivi sante avance, GPS integre et autonomie de 40 heures.",
  manteau: "Manteau isolant 550 fill avec technologie DryVent impermeable. Garde au chaud jusqu a -20 degres C.",
  ps5: "Console PS5 avec lecteur de disque, 2 manettes DualSense et cable HDMI 2.1.",
  roomba: "Robot aspirateur avec vidage automatique, cartographie intelligente et controle vocal.",
  table: "Table basse en chene massif avec finition huilee. Design scandinave epure, dimensions 120x60x40cm.",
};
const DEMO_PRODUITS_MV: Record<number, any> = {
  1: { id:1, nom:'iPhone 15 Pro Max 256Go', prix:1449.99, prix_original:1599.99, stock:8, categorie_nom:'Electronique', nom_boutique:'TechPro Montreal', vendeur_id:1, facturation_taxes:true, description:DESC.iphone, etat:'Neuf', marque:'Apple', images:JSON.stringify(['https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=800&q=80','https://images.unsplash.com/photo-1696426505312-7c02e374f5dc?w=800&q=80']) },
  2: { id:2, nom:'Chaise ergonomique Herman Miller', prix:899.00, stock:3, categorie_nom:'Meubles', nom_boutique:'Bureau Style QC', vendeur_id:2, facturation_taxes:false, description:DESC.chaise, etat:'Neuf', marque:'Herman Miller', image:'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80' },
  3: { id:3, nom:'Nike Air Max 270 - Blanc Noir', prix:189.99, prix_original:229.99, stock:15, categorie_nom:'Chaussures', nom_boutique:'Sport Express', vendeur_id:3, facturation_taxes:false, description:DESC.nike, etat:'Neuf', marque:'Nike', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
  4: { id:4, nom:'Sac cuir veritable Collection Automne', prix:345.00, stock:5, categorie_nom:'Accessoires', nom_boutique:'Mode Elite', vendeur_id:4, facturation_taxes:true, description:DESC.sac, etat:'Neuf', marque:'Mode Elite', image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
  5: { id:5, nom:'Guitare acoustique Yamaha FG800', prix:399.99, stock:2, categorie_nom:'Instruments', nom_boutique:'Musique et Co', vendeur_id:5, facturation_taxes:false, description:DESC.guitare, etat:'Neuf', marque:'Yamaha', image:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80' },
  6: { id:6, nom:'Set couteaux japonais 5 pieces', prix:279.00, prix_original:349.00, stock:12, categorie_nom:'Cuisine', nom_boutique:'Cuisine Pro MTL', vendeur_id:6, facturation_taxes:true, description:DESC.couteaux, etat:'Neuf', marque:'Shun', image:'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80' },
  7: { id:7, nom:'Velo de montagne Trek Marlin 5 2024', prix:799.99, stock:4, categorie_nom:'Sport', nom_boutique:'Velo Aventure', vendeur_id:7, facturation_taxes:false, description:DESC.velo, etat:'Neuf', marque:'Trek', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
  8: { id:8, nom:'Samsung Galaxy Watch 6 Noir', prix:429.00, stock:9, categorie_nom:'Electronique', nom_boutique:'TechPro Montreal', vendeur_id:1, facturation_taxes:true, description:DESC.montre, etat:'Neuf', marque:'Samsung', image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80' },
  9: { id:9, nom:'Manteau hiver North Face Homme L', prix:499.00, prix_original:599.00, stock:6, categorie_nom:'Vetements', nom_boutique:'Sport Express', vendeur_id:3, facturation_taxes:false, description:DESC.manteau, etat:'Neuf', marque:'North Face', image:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80' },
  10: { id:10, nom:'PlayStation 5 Bundle 2 manettes', prix:649.99, stock:1, categorie_nom:'Jeux video', nom_boutique:'TechPro Montreal', vendeur_id:1, facturation_taxes:true, description:DESC.ps5, etat:'Neuf', marque:'Sony', image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=80' },
  11: { id:11, nom:'Aspirateur robot Roomba i7+', prix:799.00, prix_original:999.00, stock:7, categorie_nom:'Electronique', nom_boutique:'Maison Moderne', vendeur_id:8, facturation_taxes:true, description:DESC.roomba, etat:'Neuf', marque:'iRobot', image:'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=800&q=80' },
  12: { id:12, nom:'Table basse scandinave en chene', prix:449.00, stock:3, categorie_nom:'Meubles', nom_boutique:'Bureau Style QC', vendeur_id:2, facturation_taxes:false, description:DESC.table, etat:'Neuf', marque:'Bureau Style', image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80' },
};




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
  ville?: string;
  vendeur_id?: number;
  nom_boutique?: string;
  vendeur_nom?: string;
  categorie_nom?: string;
  categorie?: string;
  type_vente?: string;
  facturation_taxes?: boolean;
  sku?: string;
  poids?: number;
  garantie?: string;
  retour_offert?: string;
  lien_youtube?: string;
}

interface Similaire {
  id: number;
  nom: string;
  prix: number;
  image?: string;
  nom_boutique?: string;
  vendeur_nom?: string;
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
  produitId?: number;
}

function getImages(p: Produit): string[] {
  const imgs: string[] = [];
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr)) return arr.filter(Boolean);
    } catch {
      if (p.images.startsWith('http')) imgs.push(p.images);
    }
  }
  if (p.image) imgs.push(p.image);
  return imgs;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page: 'catalogue' })}>← Retour au catalogue</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
        </div>
      </div>
    </nav>
  );
}

export default function MVPremiumProduit({ vendeurId, isDemo, config = {}, naviguer, produitId }: Props) {
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const gId = vendeurId || config.gestionnaire_id;
  const ouvrirBoutique = (boutiqueId: number | string) => {
    if (isDemo) { naviguer({ page: 'boutique-page', boutiqueSlug: String(boutiqueId) }); return; }
    window.open(`/site-preview?vendeurId=${gId}&page=boutique-page&boutiqueId=${boutiqueId}`, '_blank', 'noopener,noreferrer');
  };
  const [produit,      setProduit]     = useState<Produit | null>(null);
  const [similaires,   setSimilaires]  = useState<Similaire[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [imageActive,  setImageActive] = useState<string | null>(null);
  const [quantite,     setQuantite]    = useState(1);
  const [zoomOuvert,   setZoomOuvert]  = useState(false);
  const [onglet,       setOnglet]      = useState<'description'|'details'|'livraison'>('description');
  const [msgAjout,     setMsgAjout]    = useState<{succes: boolean; texte: string} | null>(null);
  const [ajoutEnCours, setAjoutEnCours]= useState(false);

  useEffect(() => {
    if (!produitId) return;
    // Mode demo — produit hardcode
    if (isDemo) {
      const p = DEMO_PRODUITS_MV[produitId] || DEMO_PRODUITS_MV[1];
      setProduit(p);
      const imgs = getImages(p);
      if (imgs.length > 0) setImageActive(imgs[0]);
      const autres = Object.values(DEMO_PRODUITS_MV).filter((d: any) => d.id !== produitId).slice(0, 4);
      setSimilaires(autres as any);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/produits/gestionnaire/produit/${produitId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const p = data.produit || data;
        setProduit(p);
        const imgs = getImages(p);
        if (imgs.length > 0) setImageActive(imgs[0]);
        setSimilaires(data.similaires || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [produitId, isDemo]);

  const ajouterPanier = async () => {
    if (!produit) return;
    const token = localStorage.getItem('token');
    if (!token) { setMsgAjout({ succes: false, texte: 'Connectez-vous pour acheter' }); return; }
    setAjoutEnCours(true);
    try {
      const res = await fetch(`${API_BASE}/panier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ produit_id: produit.id, quantite, prix: produit.prix }),
      });
      setMsgAjout({ succes: res.ok, texte: res.ok ? '✓ Ajouté au panier !' : '❌ Erreur' });
    } catch { setMsgAjout({ succes: false, texte: '❌ Erreur réseau' }); }
    setAjoutEnCours(false);
    setTimeout(() => setMsgAjout(null), 3000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif" }}>Chargement...</div>
    </div>
  );

  if (!produit) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans',sans-serif" }}>Produit introuvable</p>
      <button onClick={() => naviguer({ page: 'catalogue' })} style={{ ...s.btnPrimary, background: couleurAccent, color: '#000' }}>← Retour au catalogue</button>
    </div>
  );

  const images = getImages(produit);
  const prixAffiche = parseFloat(String(produit.prix));
  const rabais = produit.prix_original && parseFloat(String(produit.prix_original)) > prixAffiche
    ? Math.round(((parseFloat(String(produit.prix_original)) - prixAffiche) / parseFloat(String(produit.prix_original))) * 100)
    : null;

  return (
    <div style={s.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      <div style={s.container}>
        {/* Fil d'ariane */}
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => naviguer({ page: 'accueil' })}>Accueil</span>
          <span style={s.breadSep}>›</span>
          <span style={s.breadLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          {produit.categorie_nom && <>
            <span style={s.breadSep}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{produit.categorie_nom}</span>
          </>}
          <span style={s.breadSep}>›</span>
          <span style={{ color: '#fff', fontSize: 13 }}>{produit.nom}</span>
        </div>

        {/* Layout principal */}
        <div style={s.layout}>
          {/* ── Galerie ── */}
          <div style={s.galerie}>
            {/* Image principale */}
            <div style={s.imageMain} onClick={() => imageActive && setZoomOuvert(true)}>
              {imageActive
                ? <img src={imageActive} alt={produit.nom} style={s.imgMain} />
                : <div style={s.imgPlaceholder}>📦</div>}
              {rabais && <span style={{ ...s.badgeRabais }}>{rabais}% de rabais</span>}
              {produit.stock === 0 && <span style={s.badgeEpuise}>Épuisé</span>}
              {imageActive && (
                <button onClick={() => setZoomOuvert(true)} style={s.btnZoom}>🔍</button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={s.thumbnails}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImageActive(img)}
                    style={{ ...s.thumb, borderColor: imageActive === img ? couleurAccent : 'rgba(255,255,255,0.1)', boxShadow: imageActive === img ? `0 0 0 2px ${couleurAccent}` : 'none' }}>
                    <img src={img} alt={`${produit.nom} ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos produit ── */}
          <div style={s.infos}>
            {/* Boutique */}
            {(produit.nom_boutique || produit.vendeur_nom) && (
              <div onClick={() => ouvrirBoutique(produit.vendeur_id!)}
                style={{ ...s.boutiqueNom, color: couleurAccent }}>
                🏪 {produit.nom_boutique || produit.vendeur_nom}
              </div>
            )}

            <h1 style={s.titre}>{produit.nom}</h1>

            {/* Prix */}
            <div style={s.prixBloc}>
              <span style={{ ...s.prixActuel, color: couleurAccent }}>
                {prixAffiche.toFixed(2)} $ CAD
              </span>
              {produit.prix_original && parseFloat(String(produit.prix_original)) > prixAffiche && (
                <span style={s.prixOriginal}>{parseFloat(String(produit.prix_original)).toFixed(2)} $</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: produit.facturation_taxes ? '#ef4444' : '#10b981' }}>
                {produit.facturation_taxes ? '+ taxe' : 'sans taxe'}
              </span>
            </div>

            {/* Stock */}
            <p style={{ fontSize: 14, fontWeight: 600, color: produit.stock > 0 ? '#10b981' : '#ef4444', margin: '0 0 20px' }}>
              {produit.stock > 0 ? `✓ En stock (${produit.stock} disponible${produit.stock > 1 ? 's' : ''})` : '✗ Épuisé'}
            </p>

            {/* Quantité */}
            {produit.stock > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Quantité</label>
                <div style={s.qtyRow}>
                  <button onClick={() => setQuantite(q => Math.max(1, q - 1))} style={s.qtyBtn}>−</button>
                  <span style={s.qtyVal}>{quantite}</span>
                  <button onClick={() => setQuantite(q => Math.min(produit.stock, q + 1))} style={s.qtyBtn}>+</button>
                </div>
              </div>
            )}

            {/* Bouton panier */}
            <button
              onClick={ajouterPanier}
              disabled={ajoutEnCours || produit.stock === 0}
              style={{
                ...s.btnPrimary,
                background: produit.stock === 0 ? 'rgba(255,255,255,0.1)' : couleurAccent,
                color: produit.stock === 0 ? 'rgba(255,255,255,0.3)' : '#000',
                cursor: produit.stock === 0 ? 'not-allowed' : 'pointer',
                width: '100%', marginBottom: 12,
              }}>
              {ajoutEnCours ? '⏳ Ajout...' : produit.stock === 0 ? 'Épuisé' : '🛒 Ajouter au panier'}
            </button>

            {msgAjout && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: msgAjout.succes ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msgAjout.succes ? '#6ee7b7' : '#fca5a5', fontSize: 14, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                {msgAjout.texte}
              </div>
            )}

            {/* Infos rapides */}
            <div style={s.infoGrid}>
              {produit.etat && <div style={s.infoItem}><span style={s.infoLabel}>État</span><span style={s.infoVal}>{produit.etat}</span></div>}
              {produit.marque && <div style={s.infoItem}><span style={s.infoLabel}>Marque</span><span style={s.infoVal}>{produit.marque}</span></div>}
              {produit.modele && <div style={s.infoItem}><span style={s.infoLabel}>Modèle</span><span style={s.infoVal}>{produit.modele}</span></div>}
              {produit.ville && <div style={s.infoItem}><span style={s.infoLabel}>Localisation</span><span style={s.infoVal}>📍 {produit.ville}</span></div>}
              {produit.sku && <div style={s.infoItem}><span style={s.infoLabel}>SKU</span><span style={s.infoVal}>{produit.sku}</span></div>}
            </div>
          </div>
        </div>

        {/* ── Onglets description / détails / livraison ── */}
        <div style={s.onglets}>
          <div style={s.ongletsBtns}>
            {(['description', 'details', 'livraison'] as const)
              .filter(o => (o === 'description' ? config.produit_onglet_description_actif !== false : o === 'details' ? config.produit_onglet_details_actif !== false : config.produit_onglet_livraison_actif !== false))
              .map(o => (
              <button key={o} onClick={() => setOnglet(o)}
                style={{ ...s.ongletBtn, borderBottom: onglet === o ? `3px solid ${couleurAccent}` : '3px solid transparent', color: onglet === o ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {o === 'description' ? 'Description' : o === 'details' ? 'Détails' : 'Livraison'}
              </button>
            ))}
          </div>
          <div style={s.ongletContenu}>
            {onglet === 'description' && (
              produit.description
                ? <div dangerouslySetInnerHTML={{ __html: produit.description }} style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontSize: 15 }} />
                : <p style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Aucune description disponible.</p>
            )}
            {onglet === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Marque', produit.marque], ['Modèle', produit.modele],
                  ['État', produit.etat], ['Poids', produit.poids ? `${produit.poids} kg` : null],
                  ['Garantie', produit.garantie], ['Retour', produit.retour_offert],
                  ['SKU', produit.sku], ['Catégorie', produit.categorie_nom || produit.categorie],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={String(k)} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>
            )}
            {onglet === 'livraison' && (
              <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: 14 }}>
                <p>📦 Livraison disponible partout au Canada.</p>
                <p>🏪 Ramassage en boutique possible selon disponibilité.</p>
                {produit.ville && <p>📍 Vendu depuis : {produit.ville}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Vidéo YouTube ── */}
        {produit.lien_youtube && (
          <div style={{ margin: '32px 0' }}>
            <h3 style={{ ...s.sectionTitre, marginBottom: 16 }}>📹 Vidéo de présentation</h3>
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 14, overflow: 'hidden' }}>
              <iframe
                src={produit.lien_youtube.replace('watch?v=', 'embed/')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen title="Vidéo produit"
              />
            </div>
          </div>
        )}

        {/* ── Produits similaires ── */}
        {config.produit_similaires_actif !== false && similaires.length > 0 && (
          <div style={{ margin: '40px 0' }}>
            <h3 style={s.sectionTitre}>Produits similaires</h3>
            <div style={s.grilleSimilaires}>
              {similaires.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => naviguer({ page: 'produit', produitId: p.id })} style={s.carteSim}>
                  <div style={s.carteSimImg}>
                    {p.image ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             : <div style={{ fontSize: 32, opacity: 0.2 }}>📦</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    {(p.nom_boutique || p.vendeur_nom) && <p style={{ fontSize: 11, color: couleurAccent, fontWeight: 700, margin: '0 0 4px' }}>{p.nom_boutique || p.vendeur_nom}</p>}
                    <p style={{ fontSize: 13, color: '#fff', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{p.nom}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: couleurAccent, margin: 0 }}>{parseFloat(String(p.prix)).toFixed(2)} $</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Zoom ── */}
      {zoomOuvert && imageActive && (
        <div onClick={() => setZoomOuvert(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <button onClick={() => setZoomOuvert(false)}
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 20 }}>✕</button>
          {images.length > 1 && images.indexOf(imageActive) > 0 && (
            <button onClick={e => { e.stopPropagation(); setImageActive(images[images.indexOf(imageActive) - 1]); }}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 22 }}>‹</button>
          )}
          <img src={imageActive} alt={produit.nom} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, userSelect: 'none' }} />
          {images.length > 1 && images.indexOf(imageActive) < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setImageActive(images[images.indexOf(imageActive) + 1]); }}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 22 }}>›</button>
          )}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {images.map((img, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setImageActive(img); }}
                  style={{ width: imageActive === img ? 20 : 8, height: 8, borderRadius: 4, background: imageActive === img ? couleurAccent : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrapper:    { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  nav:        { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner:   { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  navLogo:    { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
  logoIcon:   { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' },
  logoText:   { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  navLinks:   { display: 'flex', gap: 24 },
  navLink:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' },
  container:  { maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  breadLink:  { fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' },
  breadSep:   { fontSize: 13, color: 'rgba(255,255,255,0.25)' },
  layout:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 },
  galerie:    { display: 'flex', flexDirection: 'column', gap: 12 },
  imageMain:  { position: 'relative', background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', aspectRatio: '1', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)' },
  imgMain:    { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, opacity: 0.15 },
  badgeRabais:{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8 },
  badgeEpuise:{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '4px 10px', borderRadius: 8 },
  btnZoom:    { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  thumbnails: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb:      { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '2px solid transparent', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: 0, transition: 'all 0.15s' },
  infos:      { display: 'flex', flexDirection: 'column' },
  boutiqueNom:{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, cursor: 'pointer' },
  titre:      { fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.2, fontFamily: "'Syne',sans-serif" },
  prixBloc:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  prixActuel: { fontSize: 28, fontWeight: 900 },
  prixOriginal: { fontSize: 16, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' },
  label:      { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 },
  qtyRow:     { display: 'flex', alignItems: 'center', gap: 0 },
  qtyBtn:     { width: 36, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  qtyVal:     { width: 48, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRight: 'none', color: '#fff', fontSize: 15, fontWeight: 700 },
  btnPrimary: { padding: '14px 24px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans',sans-serif", transition: 'opacity 0.2s' },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20 },
  infoItem:   { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' },
  infoLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 },
  infoVal:    { fontSize: 13, color: '#fff', fontWeight: 600 },
  onglets:    { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32, marginBottom: 32 },
  ongletsBtns:{ display: 'flex', gap: 0, marginBottom: 24 },
  ongletBtn:  { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' },
  ongletContenu: { minHeight: 120 },
  sectionTitre: { fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' },
  grilleSimilaires: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 },
  carteSim:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' },
  carteSimImg:{ height: 140, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
};