// src/templates/TemplateBoutiqueComplete.tsx
// e-Vend Studio — Boutique Complète — SPA multi-pages avec compte acheteur

import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SousTypeBoutiqueComplete =
  | 'electronique' | 'mode' | 'bebe' | 'animaux'
  | 'maison' | 'sport' | 'beaute' | 'art';

export interface VarianteProduit {
  nom: string;       // ex: "Couleur", "Taille"
  options: string[]; // ex: ["Rouge","Bleu"], ["S","M","L"]
}

export interface PhotoProduit {
  url: string;
  alt: string;
}

export interface Produit {
  id: string;
  nom: string;
  prix: number;
  prixAvant?: number;
  description: string;
  photos: PhotoProduit[];
  variantes: VarianteProduit[];
  stock: number;
  vedette: boolean;
  categorie: string;
}

export interface ConfigBoutiqueComplete {
  sousType: SousTypeBoutiqueComplete;
  nomBoutique: string;
  slogan: string;
  description: string;
  logoUrl: string;
  banniereUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';
  produits: Produit[];
  categoriesFiltres: string[];
  // Contact
  email: string;
  telephone: string;
  adresse: string;
  instagram: string;
  facebook: string;
  // Politique
  politiqueRetour: string;
  fraisLivraison: number;
  livraisonGratuiteDes: number;
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

const PRODUITS_DEFAUT: Produit[] = [
  {
    id: 'p1',
    nom: 'Produit Vedette',
    prix: 89.99,
    prixAvant: 119.99,
    description: 'Notre produit le plus populaire. Qualité supérieure, livraison rapide.',
    photos: [
      { url: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Photo principale' },
      { url: 'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Vue côté' },
    ],
    variantes: [
      { nom: 'Couleur', options: ['Noir', 'Blanc', 'Bleu'] },
      { nom: 'Taille', options: ['S', 'M', 'L', 'XL'] },
    ],
    stock: 15,
    vedette: true,
    categorie: 'Nouveautés',
  },
  {
    id: 'p2',
    nom: 'Produit Populaire',
    prix: 49.99,
    description: 'Un incontournable de notre collection.',
    photos: [
      { url: 'https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Photo principale' },
    ],
    variantes: [{ nom: 'Couleur', options: ['Rouge', 'Vert'] }],
    stock: 30,
    vedette: false,
    categorie: 'Populaires',
  },
  {
    id: 'p3',
    nom: 'Nouveau Arrivage',
    prix: 129.00,
    description: 'Tout juste arrivé en boutique. Ne manquez pas cette occasion!',
    photos: [
      { url: 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Photo principale' },
    ],
    variantes: [],
    stock: 8,
    vedette: false,
    categorie: 'Nouveautés',
  },
  {
    id: 'p4',
    nom: 'Classique Indémodable',
    prix: 64.99,
    description: 'Un classique qui traverse les saisons.',
    photos: [
      { url: 'https://images.pexels.com/photos/5632362/pexels-photo-5632362.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Photo principale' },
    ],
    variantes: [{ nom: 'Taille', options: ['XS', 'S', 'M', 'L'] }],
    stock: 25,
    vedette: false,
    categorie: 'Populaires',
  },
];

export const CONFIG_BOUTIQUE_COMPLETE_DEFAUT: ConfigBoutiqueComplete = {
  sousType: 'mode',
  nomBoutique: 'Ma Boutique',
  slogan: 'Qualité, style et livraison rapide',
  description: 'Découvrez notre sélection soigneusement choisie pour vous.',
  logoUrl: '',
  banniereUrl: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#2563eb',
  couleurSecondaire: '#1e1e2e',
  couleurFond: '#f8f8fc',
  couleurTexte: '#1e1e2e',
  police: 'moderne',
  produits: PRODUITS_DEFAUT,
  categoriesFiltres: ['Tous', 'Nouveautés', 'Populaires'],
  email: 'boutique@exemple.com',
  telephone: '',
  adresse: '',
  instagram: '',
  facebook: '',
  politiqueRetour: 'Retours acceptés dans les 30 jours suivant la réception.',
  fraisLivraison: 9.99,
  livraisonGratuiteDes: 75,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPoliceCSS(p: string) {
  switch (p) {
    case 'classique': return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default: return "'Inter', sans-serif";
  }
}

function getGoogleFonts(p: string) {
  if (p === 'classique')
    return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap';
  return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
}

function formatPrix(n: number) {
  return n.toFixed(2).replace('.', ',') + ' $';
}

const TPS = 0.05;
const TVQ = 0.09975;

function calculerTaxes(sousTotal: number) {
  const tps = sousTotal * TPS;
  const tvq = sousTotal * TVQ;
  return { tps, tvq, total: sousTotal + tps + tvq };
}

// ─── TYPES PANIER & AUTH ──────────────────────────────────────────────────────

interface ItemPanier {
  produitId: string;
  nomProduit: string;
  prix: number;
  photoPrincipale: string;
  variantesChoisies: Record<string, string>; // { "Couleur": "Noir", "Taille": "M" }
  quantite: number;
}

interface Acheteur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  token: string;
}

interface Commande {
  id: number;
  created_at: string;
  produit_nom: string;
  variante: string;
  quantite: number;
  total: number;
  statut: string;
}

type Page = 'accueil' | 'produit' | 'panier' | 'connexion' | 'inscription' | 'dashboard' | 'contact' | 'confirmation';

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigBoutiqueComplete>;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateBoutiqueComplete({ config: configProp, siteId, vendeurId }: Props) {
  const config: ConfigBoutiqueComplete = { ...CONFIG_BOUTIQUE_COMPLETE_DEFAUT, ...configProp };

  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;
  const police = getPoliceCSS(config.police);

  // ─── STATE NAVIGATION ───────────────────────────────────────────────────────
  const [page, setPage] = useState<Page>('accueil');
  const [produitActif, setProduitActif] = useState<Produit | null>(null);
  const [filtreCategorie, setFiltreCategorie] = useState('Tous');
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ─── STATE AUTH ─────────────────────────────────────────────────────────────
  const [acheteur, setAcheteur] = useState<Acheteur | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMdp, setLoginMdp] = useState('');
  const [inscPrenom, setInscPrenom] = useState('');
  const [inscNom, setInscNom] = useState('');
  const [inscEmail, setInscEmail] = useState('');
  const [inscMdp, setInscMdp] = useState('');
  const [authErreur, setAuthErreur] = useState('');
  const [authCharge, setAuthCharge] = useState(false);

  // ─── STATE PANIER ────────────────────────────────────────────────────────────
  const [panier, setPanier] = useState<ItemPanier[]>([]);

  // ─── STATE PRODUIT ───────────────────────────────────────────────────────────
  const [photoActive, setPhotoActive] = useState(0);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string, string>>({});
  const [quantite, setQuantite] = useState(1);
  const [ajoutConfirme, setAjoutConfirme] = useState(false);

  // ─── STATE CHECKOUT ──────────────────────────────────────────────────────────
  const [adresseRue, setAdresseRue] = useState('');
  const [adresseVille, setAdresseVille] = useState('');
  const [adresseProvince, setAdresseProvince] = useState('QC');
  const [adresseCodePostal, setAdresseCodePostal] = useState('');
  const [checkoutCharge, setCheckoutCharge] = useState(false);
  const [checkoutErreur, setCheckoutErreur] = useState('');

  // ─── STATE DASHBOARD ─────────────────────────────────────────────────────────
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandesCharge, setCommandesCharge] = useState(false);

  // ─── STATE CONTACT ───────────────────────────────────────────────────────────
  const [contactNom, setContactNom] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactEnvoye, setContactEnvoye] = useState(false);

  // ─── EFFETS ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Charger token sauvegardé (sessionStorage, pas localStorage)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('evend_acheteur');
      if (saved) setAcheteur(JSON.parse(saved));
    } catch {}
  }, []);

  // Charger panier depuis sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('evend_panier');
      if (saved) setPanier(JSON.parse(saved));
    } catch {}
  }, []);

  // Sauvegarder panier
  useEffect(() => {
    try { sessionStorage.setItem('evend_panier', JSON.stringify(panier)); } catch {}
  }, [panier]);

  // Reset état produit quand on change de produit
  useEffect(() => {
    setPhotoActive(0);
    setVariantesChoisies({});
    setQuantite(1);
    setAjoutConfirme(false);
  }, [produitActif]);

  // ─── NAVIGATION ──────────────────────────────────────────────────────────────

  const allerA = useCallback((p: Page, produit?: Produit) => {
    setPage(p);
    if (produit) setProduitActif(produit);
    setMenuOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── AUTH ────────────────────────────────────────────────────────────────────

  const connexion = async () => {
    if (!loginEmail || !loginMdp) { setAuthErreur('Remplissez tous les champs.'); return; }
    setAuthCharge(true); setAuthErreur('');
    try {
      const res = await fetch('/api/acheteurs-studio/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, mot_de_passe: loginMdp, site_id: siteId }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const a: Acheteur = { id: data.acheteur.id, prenom: data.acheteur.prenom, nom: data.acheteur.nom, email: data.acheteur.email, token: data.token };
        setAcheteur(a);
        sessionStorage.setItem('evend_acheteur', JSON.stringify(a));
        allerA('accueil');
      } else {
        setAuthErreur(data.error || 'Identifiants invalides.');
      }
    } catch {
      setAuthErreur('Erreur réseau. Réessayez.');
    } finally {
      setAuthCharge(false);
    }
  };

  const inscription = async () => {
    if (!inscPrenom || !inscNom || !inscEmail || !inscMdp) { setAuthErreur('Remplissez tous les champs.'); return; }
    if (inscMdp.length < 6) { setAuthErreur('Le mot de passe doit avoir au moins 6 caractères.'); return; }
    setAuthCharge(true); setAuthErreur('');
    try {
      const res = await fetch('/api/acheteurs-studio/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: inscPrenom, nom: inscNom, email: inscEmail, mot_de_passe: inscMdp, site_id: siteId, vendeur_id: vendeurId }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const a: Acheteur = { id: data.acheteur.id, prenom: data.acheteur.prenom, nom: data.acheteur.nom, email: data.acheteur.email, token: data.token };
        setAcheteur(a);
        sessionStorage.setItem('evend_acheteur', JSON.stringify(a));
        allerA('accueil');
      } else {
        setAuthErreur(data.error || 'Erreur lors de l\'inscription.');
      }
    } catch {
      setAuthErreur('Erreur réseau. Réessayez.');
    } finally {
      setAuthCharge(false);
    }
  };

  const deconnexion = () => {
    setAcheteur(null);
    sessionStorage.removeItem('evend_acheteur');
    allerA('accueil');
  };

  // ─── PANIER ──────────────────────────────────────────────────────────────────

  const ajouterAuPanier = () => {
    if (!produitActif) return;
    // Vérifier variantes obligatoires
    for (const v of produitActif.variantes) {
      if (!variantesChoisies[v.nom]) {
        alert(`Veuillez choisir : ${v.nom}`);
        return;
      }
    }
    const cle = `${produitActif.id}-${JSON.stringify(variantesChoisies)}`;
    setPanier(prev => {
      const existant = prev.find(i => i.produitId === produitActif.id && JSON.stringify(i.variantesChoisies) === JSON.stringify(variantesChoisies));
      if (existant) {
        return prev.map(i => i === existant ? { ...i, quantite: i.quantite + quantite } : i);
      }
      return [...prev, {
        produitId: produitActif.id,
        nomProduit: produitActif.nom,
        prix: produitActif.prix,
        photoPrincipale: produitActif.photos[0]?.url || '',
        variantesChoisies,
        quantite,
      }];
    });
    setAjoutConfirme(true);
    setTimeout(() => setAjoutConfirme(false), 2500);
  };

  const modifierQuantitePanier = (idx: number, delta: number) => {
    setPanier(prev => {
      const next = [...prev];
      next[idx].quantite = Math.max(1, next[idx].quantite + delta);
      return next;
    });
  };

  const retirerDuPanier = (idx: number) => {
    setPanier(prev => prev.filter((_, i) => i !== idx));
  };

  const nbArticles = panier.reduce((s, i) => s + i.quantite, 0);
  const sousTotal = panier.reduce((s, i) => s + i.prix * i.quantite, 0);
  const fraisLivraison = sousTotal >= config.livraisonGratuiteDes ? 0 : config.fraisLivraison;
  const taxes = calculerTaxes(sousTotal);

  // ─── CHECKOUT ────────────────────────────────────────────────────────────────

  const lancerCheckout = async () => {
    if (!acheteur) { allerA('connexion'); return; }
    if (!adresseRue || !adresseVille || !adresseCodePostal) { setCheckoutErreur('Remplissez votre adresse complète.'); return; }
    if (panier.length === 0) return;

    setCheckoutCharge(true); setCheckoutErreur('');
    const adresseLivraison = `${adresseRue}, ${adresseVille}, ${adresseProvince} ${adresseCodePostal}`;

    try {
      // Un appel par item du panier (même approche que boutique-simple)
      const item = panier[0]; // Version 1 : un produit à la fois
      const varianteStr = Object.entries(item.variantesChoisies).map(([k, v]) => `${k}: ${v}`).join(', ');

      const res = await fetch('/api/boutique-studio/creer-commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acheteur.token}` },
        body: JSON.stringify({
          site_id: siteId,
          vendeur_id: vendeurId,
          acheteur_id: acheteur.id,
          nom_client: `${acheteur.prenom} ${acheteur.nom}`,
          email_client: acheteur.email,
          adresse_livraison: adresseLivraison,
          produit_nom: item.nomProduit,
          variante: varianteStr || null,
          quantite: item.quantite,
          prix_unitaire: item.prix,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setCheckoutErreur(data.error || 'Erreur lors du paiement.');
      }
    } catch {
      setCheckoutErreur('Erreur réseau. Réessayez.');
    } finally {
      setCheckoutCharge(false);
    }
  };

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────

  const chargerCommandes = useCallback(async () => {
    if (!acheteur) return;
    setCommandesCharge(true);
    try {
      const res = await fetch('/api/acheteurs-studio/mes-commandes', {
        headers: { Authorization: `Bearer ${acheteur.token}` },
      });
      const data = await res.json();
      if (res.ok) setCommandes(data.commandes || []);
    } catch {}
    finally { setCommandesCharge(false); }
  }, [acheteur]);

  useEffect(() => {
    if (page === 'dashboard') chargerCommandes();
  }, [page, chargerCommandes]);

  // ─── PRODUITS FILTRÉS ─────────────────────────────────────────────────────────

  const produitsFiltres = filtreCategorie === 'Tous'
    ? config.produits
    : config.produits.filter(p => p.categorie === filtreCategorie);

  // ─── STATUT COMMANDE ──────────────────────────────────────────────────────────

  const labelStatut: Record<string, { label: string; couleur: string }> = {
    en_attente:  { label: 'En attente', couleur: '#f59e0b' },
    confirmee:   { label: 'Confirmée',  couleur: '#10b981' },
    expediee:    { label: 'Expédiée',   couleur: '#3b82f6' },
    livree:      { label: 'Livrée',     couleur: '#6366f1' },
    annulee:     { label: 'Annulée',    couleur: '#ef4444' },
  };

  // ─── STYLES PARTAGÉS ──────────────────────────────────────────────────────────

  const btnPrimaire: React.CSSProperties = {
    background: cp, color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
    fontFamily: police, transition: 'opacity .2s',
  };
  const btnSecondaire: React.CSSProperties = {
    background: 'transparent', color: cs, border: `2px solid ${cs}`,
    borderRadius: 10, padding: '11px 24px', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: police,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: `1.5px solid #e0e0e8`, fontSize: 14, fontFamily: police,
    background: '#fff', color: ct, outline: 'none', boxSizing: 'border-box',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDU ────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh' }}>

      {/* GOOGLE FONTS */}
      <link rel="stylesheet" href={getGoogleFonts(config.police)} />

      {/* CSS GLOBAL */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        img { display: block; }
        button:hover { opacity: 0.88; }
        .carte-produit:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important; }
        .carte-produit { transition: transform .22s, box-shadow .22s; }
        .nav-link:hover { color: ${cp} !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn .35s ease both; }
        @keyframes toast { 0%{opacity:0;transform:translateY(20px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-10px)} }
        .toast { animation: toast 2.5s ease forwards; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background:#f1f1f1; } ::-webkit-scrollbar-thumb { background:${cp}66; border-radius:4px; }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: `2px solid ${cp}20`,
        padding: isMobile ? '14px 16px' : '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: isMobile ? 'auto' : 64, gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => allerA('accueil')}>
          {config.logoUrl
            ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
            : <div style={{ width: 36, height: 36, borderRadius: 8, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {config.nomBoutique.charAt(0)}
              </div>
          }
          <span style={{ fontWeight: 800, fontSize: 18, color: cs }}>{config.nomBoutique}</span>
        </div>

        {/* Nav links — desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {['accueil', 'contact'].map(p => (
              <span key={p} className="nav-link"
                onClick={() => allerA(p as Page)}
                style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', color: page === p ? cp : ct, transition: 'color .2s', textTransform: 'capitalize' }}>
                {p === 'accueil' ? 'Boutique' : 'Contact'}
              </span>
            ))}
          </div>
        )}

        {/* Actions droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Panier */}
          <button onClick={() => allerA('panier')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>
            🛒
            {nbArticles > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: cp, color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{nbArticles}</span>
            )}
          </button>

          {/* Compte */}
          {acheteur ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => allerA('dashboard')}
                style={{ ...btnPrimaire, padding: '8px 16px', fontSize: 13, borderRadius: 8 }}>
                👤 {acheteur.prenom}
              </button>
            </div>
          ) : (
            <button onClick={() => allerA('connexion')}
              style={{ ...btnSecondaire, padding: '8px 16px', fontSize: 13, borderRadius: 8 }}>
              Connexion
            </button>
          )}

          {/* Burger mobile */}
          {isMobile && (
            <button onClick={() => setMenuOuvert(!menuOuvert)}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>
              {menuOuvert ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Menu mobile */}
      {isMobile && menuOuvert && (
        <div style={{ background: '#fff', borderBottom: `1px solid #eee`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span onClick={() => allerA('accueil')} style={{ cursor: 'pointer', fontWeight: 600 }}>🏪 Boutique</span>
          <span onClick={() => allerA('contact')} style={{ cursor: 'pointer', fontWeight: 600 }}>✉️ Contact</span>
          {acheteur && <span onClick={() => allerA('dashboard')} style={{ cursor: 'pointer', fontWeight: 600 }}>📦 Mes commandes</span>}
          {acheteur && <span onClick={deconnexion} style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>🚪 Déconnexion</span>}
        </div>
      )}

      {/* TOAST ajout panier */}
      {ajoutConfirme && (
        <div className="toast" style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', borderRadius: 12,
          padding: '14px 28px', fontWeight: 700, fontSize: 15, zIndex: 999,
          boxShadow: '0 8px 24px rgba(16,185,129,.35)',
        }}>
          ✓ Ajouté au panier !
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE ACCUEIL                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'accueil' && (
        <div className="fade-in">
          {/* Hero bannière */}
          <section style={{
            minHeight: isMobile ? 260 : 420,
            backgroundImage: `url(${config.banniereUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative', display: 'flex', alignItems: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${cs}cc 0%, ${cs}55 60%, transparent 100%)` }} />
            <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '40px 20px' : '60px 64px', maxWidth: 600 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: cp, marginBottom: 10 }}>
                Bienvenue
              </p>
              <h1 style={{ fontSize: `clamp(26px, 5vw, 52px)`, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>
                {config.nomBoutique}
              </h1>
              <p style={{ fontSize: `clamp(13px, 2vw, 17px)`, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, marginBottom: 28 }}>
                {config.slogan}
              </p>
              <button style={btnPrimaire} onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>
                Voir la collection →
              </button>
            </div>
          </section>

          {/* Bannière livraison gratuite */}
          {config.livraisonGratuiteDes > 0 && (
            <div style={{ background: cp, color: '#fff', textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 600 }}>
              🚚 Livraison gratuite dès {formatPrix(config.livraisonGratuiteDes)} d'achat
            </div>
          )}

          {/* CATALOGUE */}
          <section id="catalogue" style={{ padding: isMobile ? '40px 16px' : '64px 40px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: `clamp(20px, 3vw, 30px)`, fontWeight: 800, color: cs }}>Notre collection</h2>

              {/* Filtres catégories */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {config.categoriesFiltres.map(cat => (
                  <button key={cat} onClick={() => setFiltreCategorie(cat)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${filtreCategorie === cat ? cp : '#e0e0e8'}`,
                      background: filtreCategorie === cat ? cp : '#fff',
                      color: filtreCategorie === cat ? '#fff' : ct,
                      cursor: 'pointer',
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille produits */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: isMobile ? 12 : 24,
            }}>
              {produitsFiltres.map(produit => (
                <div key={produit.id} className="carte-produit"
                  onClick={() => allerA('produit', produit)}
                  style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
                    border: `1px solid #f0f0f8`,
                  }}>
                  {/* Photo */}
                  <div style={{ position: 'relative', paddingTop: '75%', background: '#f5f5fa' }}>
                    {produit.photos[0] && (
                      <img src={produit.photos[0].url} alt={produit.photos[0].alt}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {produit.vedette && (
                      <span style={{ position: 'absolute', top: 10, left: 10, background: cp, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        ⭐ Vedette
                      </span>
                    )}
                    {produit.prixAvant && (
                      <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        Solde
                      </span>
                    )}
                  </div>
                  {/* Infos */}
                  <div style={{ padding: isMobile ? '12px' : '16px 18px' }}>
                    <p style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: cs, marginBottom: 4, lineHeight: 1.3 }}>{produit.nom}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: cp }}>{formatPrix(produit.prix)}</span>
                      {produit.prixAvant && (
                        <span style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>{formatPrix(produit.prixAvant)}</span>
                      )}
                    </div>
                    {produit.variantes.length > 0 && (
                      <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{produit.variantes.map(v => v.nom).join(' · ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {produitsFiltres.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🏷️</p>
                <p style={{ fontSize: 16 }}>Aucun produit dans cette catégorie.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE PRODUIT                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'produit' && produitActif && (
        <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 40px' }}>

          {/* Fil d'Ariane */}
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
            <span style={{ cursor: 'pointer', color: cp }} onClick={() => allerA('accueil')}>Boutique</span>
            {' › '}{produitActif.nom}
          </p>

          <div style={{ display: 'flex', gap: isMobile ? 0 : 48, flexDirection: isMobile ? 'column' : 'row' }}>

            {/* GALERIE */}
            <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : 480 }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f5f5fa', marginBottom: 12, aspectRatio: '4/3' }}>
                {produitActif.photos[photoActive] ? (
                  <img src={produitActif.photos[photoActive].url} alt={produitActif.photos[photoActive].alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
                )}
              </div>
              {produitActif.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {produitActif.photos.map((ph, i) => (
                    <div key={i} onClick={() => setPhotoActive(i)}
                      style={{ width: 72, height: 54, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                        border: `2.5px solid ${i === photoActive ? cp : 'transparent'}` }}>
                      <img src={ph.url} alt={ph.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DÉTAILS */}
            <div style={{ flex: 1, paddingTop: isMobile ? 24 : 0 }}>
              {produitActif.vedette && (
                <span style={{ fontSize: 11, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⭐ Produit vedette</span>
              )}
              <h1 style={{ fontSize: `clamp(22px, 3vw, 34px)`, fontWeight: 800, color: cs, marginTop: 8, marginBottom: 12, lineHeight: 1.2 }}>
                {produitActif.nom}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: cp }}>{formatPrix(produitActif.prix)}</span>
                {produitActif.prixAvant && (
                  <span style={{ fontSize: 16, color: '#aaa', textDecoration: 'line-through' }}>{formatPrix(produitActif.prixAvant)}</span>
                )}
              </div>

              <p style={{ fontSize: 14, color: `${ct}99`, lineHeight: 1.7, marginBottom: 24 }}>{produitActif.description}</p>

              {/* Variantes */}
              {produitActif.variantes.map(variante => (
                <div key={variante.nom} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: cs, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {variante.nom} {variantesChoisies[variante.nom] && <span style={{ color: cp, fontWeight: 600 }}>— {variantesChoisies[variante.nom]}</span>}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {variante.options.map(opt => (
                      <button key={opt} onClick={() => setVariantesChoisies(prev => ({ ...prev, [variante.nom]: opt }))}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          border: `2px solid ${variantesChoisies[variante.nom] === opt ? cp : '#ddd'}`,
                          background: variantesChoisies[variante.nom] === opt ? `${cp}18` : '#fff',
                          color: variantesChoisies[variante.nom] === opt ? cp : ct,
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantité */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: cs, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantité</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setQuantite(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid #ddd`, background: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 800, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{quantite}</span>
                  <button onClick={() => setQuantite(q => Math.min(produitActif.stock, q + 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid #ddd`, background: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>+</button>
                  <span style={{ fontSize: 12, color: '#aaa' }}>{produitActif.stock} en stock</span>
                </div>
              </div>

              {/* Bouton ajouter */}
              <button onClick={ajouterAuPanier} style={{ ...btnPrimaire, width: '100%', padding: '16px', fontSize: 16, borderRadius: 12, marginBottom: 12 }}>
                🛒 Ajouter au panier — {formatPrix(produitActif.prix * quantite)}
              </button>
              <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>🔒 Paiement sécurisé · {config.politiqueRetour}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE PANIER                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'panier' && (
        <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 40px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: cs, marginBottom: 32 }}>Mon panier {nbArticles > 0 && `(${nbArticles})`}</h1>

          {panier.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontSize: 60, marginBottom: 16 }}>🛒</p>
              <p style={{ fontSize: 18, color: '#aaa', marginBottom: 24 }}>Votre panier est vide.</p>
              <button style={btnPrimaire} onClick={() => allerA('accueil')}>Voir la boutique</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 32, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

              {/* Liste articles */}
              <div style={{ flex: 1 }}>
                {panier.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f8', alignItems: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#f5f5fa', flexShrink: 0 }}>
                      {item.photoPrincipale && <img src={item.photoPrincipale} alt={item.nomProduit} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: cs, marginBottom: 4 }}>{item.nomProduit}</p>
                      {Object.keys(item.variantesChoisies).length > 0 && (
                        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                          {Object.entries(item.variantesChoisies).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => modifierQuantitePanier(idx, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700 }}>{item.quantite}</span>
                        <button onClick={() => modifierQuantitePanier(idx, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, color: cp, fontSize: 16 }}>{formatPrix(item.prix * item.quantite)}</p>
                      <button onClick={() => retirerDuPanier(idx)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>Retirer</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Résumé + Checkout */}
              <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0 }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', border: `1px solid #f0f0f8`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontWeight: 800, color: cs, marginBottom: 20 }}>Résumé</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#888' }}>Sous-total</span>
                      <span style={{ fontWeight: 600 }}>{formatPrix(sousTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#888' }}>Livraison</span>
                      <span style={{ fontWeight: 600, color: fraisLivraison === 0 ? '#10b981' : ct }}>
                        {fraisLivraison === 0 ? 'Gratuite 🎉' : formatPrix(fraisLivraison)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#888' }}>TPS (5%)</span>
                      <span style={{ fontWeight: 600 }}>{formatPrix(taxes.tps)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#888' }}>TVQ (9,975%)</span>
                      <span style={{ fontWeight: 600 }}>{formatPrix(taxes.tvq)}</span>
                    </div>
                    <div style={{ borderTop: `2px solid ${cp}20`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, color: cs }}>Total</span>
                      <span style={{ fontWeight: 800, color: cp, fontSize: 18 }}>{formatPrix(taxes.total + fraisLivraison)}</span>
                    </div>
                  </div>

                  {/* Adresse livraison */}
                  {acheteur ? (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: cs, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Adresse de livraison</p>
                      <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Rue et numéro" value={adresseRue} onChange={e => setAdresseRue(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 2 }} placeholder="Ville" value={adresseVille} onChange={e => setAdresseVille(e.target.value)} />
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Code postal" value={adresseCodePostal} onChange={e => setAdresseCodePostal(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: `${cp}10`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: cs, marginBottom: 8 }}>Connectez-vous pour finaliser votre commande.</p>
                      <button style={{ ...btnPrimaire, padding: '10px 20px', fontSize: 13 }} onClick={() => allerA('connexion')}>Connexion / Inscription</button>
                    </div>
                  )}

                  {checkoutErreur && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{checkoutErreur}</p>}

                  {acheteur && (
                    <button style={{ ...btnPrimaire, width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                      onClick={lancerCheckout} disabled={checkoutCharge}>
                      {checkoutCharge ? '⏳ Traitement...' : '💳 Payer maintenant'}
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10 }}>🔒 Paiement sécurisé via Stripe</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE CONNEXION                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'connexion' && (
        <div className="fade-in" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: isMobile ? '32px 24px' : '48px 40px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: cs, marginBottom: 8 }}>Connexion</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Accédez à votre compte et votre historique d'achats.</p>

            {authErreur && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{authErreur}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} type="email" placeholder="Courriel" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Mot de passe" value={loginMdp} onChange={e => setLoginMdp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && connexion()} />
              <button style={{ ...btnPrimaire, width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                onClick={connexion} disabled={authCharge}>
                {authCharge ? '⏳ Connexion...' : 'Se connecter'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
              Pas encore de compte?{' '}
              <span style={{ color: cp, fontWeight: 700, cursor: 'pointer' }} onClick={() => { setAuthErreur(''); allerA('inscription'); }}>
                Créer un compte
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE INSCRIPTION                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'inscription' && (
        <div className="fade-in" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: isMobile ? '32px 24px' : '48px 40px', width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: cs, marginBottom: 8 }}>Créer un compte</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Suivez vos commandes et gérez vos achats.</p>

            {authErreur && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{authErreur}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input style={inputStyle} placeholder="Prénom" value={inscPrenom} onChange={e => setInscPrenom(e.target.value)} />
                <input style={inputStyle} placeholder="Nom" value={inscNom} onChange={e => setInscNom(e.target.value)} />
              </div>
              <input style={inputStyle} type="email" placeholder="Courriel" value={inscEmail} onChange={e => setInscEmail(e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Mot de passe (6 caractères min.)" value={inscMdp} onChange={e => setInscMdp(e.target.value)} />
              <button style={{ ...btnPrimaire, width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                onClick={inscription} disabled={authCharge}>
                {authCharge ? '⏳ Création...' : 'Créer mon compte'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
              Déjà un compte?{' '}
              <span style={{ color: cp, fontWeight: 700, cursor: 'pointer' }} onClick={() => { setAuthErreur(''); allerA('connexion'); }}>
                Se connecter
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE DASHBOARD ACHETEUR                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'dashboard' && (
        <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 40px' }}>

          {!acheteur ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: 16, marginBottom: 16, color: '#888' }}>Connectez-vous pour voir vos commandes.</p>
              <button style={btnPrimaire} onClick={() => allerA('connexion')}>Se connecter</button>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: cs }}>Bonjour, {acheteur.prenom} 👋</h1>
                  <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{acheteur.email}</p>
                </div>
                <button onClick={deconnexion} style={{ ...btnSecondaire, padding: '8px 18px', fontSize: 13, color: '#ef4444', borderColor: '#ef4444' }}>
                  Déconnexion
                </button>
              </div>

              {/* Mes commandes */}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: cs, marginBottom: 16 }}>📦 Mes commandes</h2>

              {commandesCharge ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Chargement...</div>
              ) : commandes.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #f0f0f8' }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                  <p style={{ fontSize: 16, color: '#aaa', marginBottom: 20 }}>Vous n'avez pas encore de commandes.</p>
                  <button style={btnPrimaire} onClick={() => allerA('accueil')}>Voir la boutique</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {commandes.map(cmd => {
                    const s = labelStatut[cmd.statut] || { label: cmd.statut, couleur: '#888' };
                    return (
                      <div key={cmd.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <p style={{ fontWeight: 700, color: cs, marginBottom: 4 }}>{cmd.produit_nom}</p>
                            {cmd.variante && <p style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>{cmd.variante}</p>}
                            <p style={{ fontSize: 12, color: '#bbb' }}>
                              Commande #{cmd.id} · {new Date(cmd.created_at).toLocaleDateString('fr-CA')} · Qté : {cmd.quantite}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${s.couleur}18`, color: s.couleur, marginBottom: 6 }}>
                              {s.label}
                            </span>
                            <p style={{ fontWeight: 800, color: cp, fontSize: 16 }}>{formatPrix(parseFloat(cmd.total as any))}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE CONTACT                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {page === 'contact' && (
        <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '40px 16px' : '64px 40px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: cs, marginBottom: 8 }}>Nous joindre</h1>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 36 }}>Une question? On vous répond rapidement.</p>

          {/* Coordonnées */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            {config.email && (
              <a href={`mailto:${config.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', borderRadius: 10, border: '1px solid #eee', fontSize: 14, fontWeight: 600, color: cs }}>
                ✉️ {config.email}
              </a>
            )}
            {config.telephone && (
              <a href={`tel:${config.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', borderRadius: 10, border: '1px solid #eee', fontSize: 14, fontWeight: 600, color: cs }}>
                📞 {config.telephone}
              </a>
            )}
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', borderRadius: 10, border: '1px solid #eee', fontSize: 14, fontWeight: 600, color: cs }}>
                📷 @{config.instagram}
              </a>
            )}
          </div>

          {/* Formulaire */}
          {contactEnvoye ? (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>✉️</p>
              <p style={{ fontWeight: 800, color: '#16a34a', fontSize: 18, marginBottom: 8 }}>Message envoyé!</p>
              <p style={{ color: '#4ade80', fontSize: 14 }}>Nous vous répondrons à {contactEmail} sous peu.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', border: '1px solid #f0f0f8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input style={inputStyle} placeholder="Votre nom" value={contactNom} onChange={e => setContactNom(e.target.value)} />
                  <input style={{ ...inputStyle }} type="email" placeholder="Votre courriel" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                </div>
                <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} placeholder="Votre message..."
                  value={contactMsg} onChange={e => setContactMsg(e.target.value)} />
                <button style={{ ...btnPrimaire, padding: '14px', fontSize: 15, borderRadius: 12 }}
                  onClick={() => {
                    if (!contactNom || !contactEmail || !contactMsg) { alert('Remplissez tous les champs.'); return; }
                    setContactEnvoye(true);
                  }}>
                  Envoyer le message
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 80, padding: '32px 24px', background: cs, textAlign: 'center' }}>
        <p style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginBottom: 6 }}>{config.nomBoutique}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Propulsé par <span style={{ color: cp }}>e-Vend Studio</span>
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {config.facebook && <a href={`https://facebook.com/${config.facebook}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Facebook</a>}
          {config.instagram && <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Instagram</a>}
          {config.email && <a href={`mailto:${config.email}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Contact</a>}
        </div>
      </footer>

    </div>
  );
}