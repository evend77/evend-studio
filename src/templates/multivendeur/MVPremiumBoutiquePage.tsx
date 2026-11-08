// CHEMIN : src/templates/multivendeur/MVPremiumBoutiquePage.tsx
// e-Vend Studio — Page boutique individuelle d'un vendeur (Multi-Vendeur Premium)
// Onglets: Produits / A propos / Blog (add-on) / FAQ (add-on) / Avis (add-on)

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';
import MVPremiumFooter from './MVPremiumFooter';
import { fondDe, fondNav } from './mvTheme';
import { nettoyerRecherche, nettoyerTexte } from './mvSecurite';
import { formaterPrix } from '../shared/devise';
import MVParutionCountdown from './MVParutionCountdown';
import MVBadgesCollab, { BadgeCollab } from './MVBadgesCollab';
import { MVSouhaitsAcces, MVSouhaitCarte } from './MVFavoris';

const API_BASE = '/api';

interface Boutique {
  id: number;
  badges?: BadgeCollab[];
  vacances?: { mode: 'visible' | 'masque'; message: string; retour: string | null } | null;
  nom_boutique: string;
  description_courte?: string;
  description_longue?: string;
  ville?: string;
  province?: string;
  logo_url?: string;
  banniere_url?: string;
  nb_produits?: number;
  nb_vendus?: number;
  date_inscription?: string;
  telephone?: string;
  details?: {
    adresse?: string; ville?: string; province?: string; code_postal?: string; site_web?: string;
    reseaux?: Record<string, string>; email?: string; telephone?: string;
  } | null;
}

interface Produit {
  id: number; nom: string; prix: number; image?: string; stock: number; categorie_nom?: string;
  date_parution?: string | null; heure_serveur?: string;   // Parution future
}

interface BlogArticle {
  id: number; titre: string; contenu: string; tags?: string; vues: number; date_publication: string;
}

interface FaqItem { id: number; question: string; reponse: string; }

interface Avis {
  id: number; nom_client: string; note_globale: number; titre?: string; commentaire?: string; created_at: string;
  criteres?: { delai_respecte?: boolean | null; communication?: number | null; emballage?: number | null }; photos?: string[]; reponse?: string | null; reponse_le?: string | null;
  produits?: { id: number; titre: string }[];
}

type Onglet = 'produits' | 'apropos' | 'details' | 'blog' | 'faq' | 'avis';

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
  boutiqueSlug?: string; // ici, utilisé comme l'ID du vendeur de la boutique
}

const DEMO_BOUTIQUE: Boutique = {
  id: 1, nom_boutique: 'TechPro Montreal',
  description_courte: 'Specialiste en electronique et gadgets technologiques.',
  description_longue: 'TechPro Montreal est votre destination de confiance pour tous vos besoins en electronique. Depuis notre ouverture, nous nous engageons a offrir des produits authentiques, garantis et a prix competitifs. Notre equipe passionnee est toujours disponible pour vous conseiller dans le choix de vos appareils.',
  ville: 'Montreal', province: 'QC', nb_produits: 48, date_inscription: '2022-03-15',
  details: { adresse: '123, rue Exemple', ville: 'Montreal', province: 'QC', code_postal: 'H2X 1Y4', site_web: 'https://exemple.com', reseaux: { facebook: 'https://facebook.com/exemple', instagram: 'https://instagram.com/exemple' } },
  banniere_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w:1200&q=80',
};

const DEMO_PRODUITS_BOUTIQUE: Produit[] = [
  { id:1, nom:'iPhone 15 Pro Max 256Go', prix:1449.99, stock:8, categorie_nom:'Téléphones', image:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=400&q=80' },
  { id:8, nom:'Samsung Galaxy Watch 6', prix:429.00, stock:9, categorie_nom:'Montres connectées', image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80' },
  { id:10, nom:'PlayStation 5 Bundle', prix:649.99, stock:1, categorie_nom:'Consoles', image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80' },
  { id:13, nom:'Samsung Galaxy S24 Ultra', prix:1199.99, stock:5, categorie_nom:'Téléphones', image:'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80' },
  { id:14, nom:'AirPods Pro 2e génération', prix:279.99, stock:14, categorie_nom:'Audio', image:'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&q=80' },
  { id:15, nom:'Casque Sony WH-1000XM5', prix:399.99, stock:6, categorie_nom:'Audio', image:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80' },
  { id:16, nom:'Apple Watch Series 9', prix:499.00, stock:7, categorie_nom:'Montres connectées', image:'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80' },
  { id:17, nom:'Xbox Series X', prix:599.99, stock:3, categorie_nom:'Consoles', image:'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80' },
  { id:18, nom:'MacBook Air M3 13 pouces', prix:1399.99, stock:4, categorie_nom:'Ordinateurs', image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
];

const DEMO_BLOG: BlogArticle[] = [
  { id:1, titre:'5 conseils pour choisir votre prochain telephone', contenu:'<p>Choisir un nouveau telephone peut etre complexe avec toutes les options disponibles. Voici nos meilleurs conseils pour faire le bon choix selon vos besoins et votre budget.</p><p>Premierement, definissez votre budget. Ensuite, identifiez vos priorites: photo, autonomie, performance ou stockage.</p>', tags:'conseils,telephone', vues:234, date_publication:new Date().toISOString() },
  { id:2, titre:'Nouveautes electronique automne 2026', contenu:'<p>Decouvrez notre selection des meilleures nouveautes en electronique pour cette saison. Des produits soigneusement selectionnes par notre equipe.</p>', tags:'nouveautes', vues:156, date_publication:new Date(Date.now()-86400000*5).toISOString() },
];

const DEMO_FAQ: FaqItem[] = [
  { id:1, question:'Quels sont vos delais de livraison ?', reponse:'Nos delais de livraison varient entre 2 et 5 jours ouvrables partout au Quebec.' },
  { id:2, question:'Offrez-vous une garantie sur vos produits ?', reponse:'Oui, tous nos produits sont garantis minimum 1 an contre les defauts de fabrication.' },
  { id:3, question:'Puis-je retourner un produit ?', reponse:'Vous disposez de 14 jours suivant la reception pour retourner un produit non utilise dans son emballage original.' },
];

const DEMO_AVIS: Avis[] = [
  { id:1, nom_client:'Marie L.', note_globale:5, titre:'Excellent service', commentaire:'Tres satisfaite de mon achat, livraison rapide et produit conforme.', created_at:new Date().toISOString() },
  { id:2, nom_client:'Jean-Francois T.', note_globale:4, titre:'Bon vendeur', commentaire:'Communication claire et produit de qualite.', created_at:new Date(Date.now()-86400000*10).toISOString() },
];

function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const nom = config?.nom_boutique || 'Ma Marketplace';
  const accent = config?.couleur_accent || '#fbbf24';
  const liens: { label: string; dest: NavMV }[] = [{ label: 'Accueil', dest: { page: 'accueil' } }, { label: 'Catalogue', dest: { page: 'catalogue' } }, { label: 'Boutiques', dest: { page: 'boutiques' } }];
  const aller = (d: NavMV) => { setMenuOuvert(false); naviguer(d); };
  return (
    <nav style={{ ...s.nav, background: fondNav(config) }}>
      <style>{`
        @media (max-width:768px) {
          .mvn-liens { display:none !important; }
          .mvn-burger { display:flex !important; }
          .mvn-inner { padding:0 14px !important; gap:12px !important; }
          .mvn-search { display:none !important; }
        }
      `}</style>
      <div className="mvn-inner" style={s.navInner}>
        <div style={{ ...s.navLogo, minWidth: 0, flexShrink: 1 }} onClick={() => aller({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, flexShrink: 0 }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={{ ...s.logoText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
        </div>
        <div className="mvn-liens" style={s.navLinks}>
          {liens.map(l => <span key={l.label} style={s.navLink} onClick={() => aller(l.dest)}>{l.label}</span>)}
          <MVSouhaitsAcces variante="entete" gestionnaireId={config?.gestionnaire_id} isDemo={!!config?.__demo} naviguer={naviguer} />
          <button onClick={() => aller({ page: 'login' })} style={{ padding: '8px 18px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
        </div>
        <button className="mvn-burger" aria-label="Menu" onClick={() => setMenuOuvert(v => !v)}
          style={{ display: 'none', marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>
          {menuOuvert ? '✕' : '☰'}
        </button>
      </div>
      {menuOuvert && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: fondDe(config), borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {liens.map(l => (
            <div key={l.label} onClick={() => aller(l.dest)} style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.85)', fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{l.label}</div>
          ))}
          <div style={{ padding: '14px 20px' }}>
            <button onClick={() => aller({ page: 'login' })} style={{ width: '100%', padding: 12, background: accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span style={{ fontSize: taille, letterSpacing: 1 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= note ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>★</span>)}
    </span>
  );
}

export default function MVPremiumBoutiquePage({ vendeurId, isDemo, config = {}, naviguer, boutiqueSlug }: Props) {
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const boutiqueId = boutiqueSlug;          // ici : l'ID du collaborateur (la boutique)
  const gId = vendeurId;                    // le gestionnaire (le site)
  const apiBoutique = `${API_BASE}/gestionnaires/${gId}/boutiques/${boutiqueId}`;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('produits');
  const [recherche, setRecherche] = useState('');
  const [categoriesActives, setCategoriesActives] = useState<string[]>([]);
  const [filtreCatMobileOuvert, setFiltreCatMobileOuvert] = useState(false);

  // Add-ons
  const [addonsStatut, setAddonsStatut] = useState({ blog_actif: false, faq_actif: false, avis_actif: false, chat_actif: false, favoris_actif: false });
  const [blog, setBlog] = useState<BlogArticle[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [moyenneAvis, setMoyenneAvis] = useState(0);
  const [totalAvis, setTotalAvis] = useState(0);
  const [pageAvis, setPageAvis] = useState(1);
  const [pagesAvis, setPagesAvis] = useState(1);
  const [repartAvis, setRepartAvis] = useState<Record<string, number>>({});
  const [avisOccupe, setAvisOccupe] = useState(false);
  const [blogOuvert, setBlogOuvert] = useState<number | null>(null);
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);

  // Session (infos d'affichage seulement ; le vrai jeton est dans un cookie httpOnly)
  const lireType = (): 'acheteur' | 'collaborateur' | null => {
    try {
      const tpe = JSON.parse(localStorage.getItem(`mv_compte_${gId}`) || 'null')?.type;
      return tpe === 'acheteur' || tpe === 'collaborateur' ? tpe : null;
    } catch { return null; }
  };
  const [estFavori, setEstFavori] = useState(false);
  const [favoriOccupe, setFavoriOccupe] = useState(false);
  const [infoAction, setInfoAction] = useState<{ ok: boolean; texte: string } | null>(null);
  const [modal, setModal] = useState<null | 'signaler'>(null);
  const [modalOccupe, setModalOccupe] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [sigNom, setSigNom] = useState('');
  const [sigEmail, setSigEmail] = useState('');
  const [sigRaison, setSigRaison] = useState('produit_fake');
  const [sigAutre, setSigAutre] = useState('');
  const [sigDescription, setSigDescription] = useState('');

  const annoncer = (ok: boolean, texte: string) => { setInfoAction({ ok, texte }); setTimeout(() => setInfoAction(null), 3500); };
  const fermerModal = () => { setModal(null); setModalMsg(null); };

  useEffect(() => {
    if (isDemo) {
      setBoutique(DEMO_BOUTIQUE);
      setProduits(DEMO_PRODUITS_BOUTIQUE);
      setAddonsStatut({ blog_actif: true, faq_actif: true, avis_actif: true, chat_actif: true, favoris_actif: true });
      setBlog(DEMO_BLOG);
      setFaq(DEMO_FAQ);
      setAvis(DEMO_AVIS);
      setMoyenneAvis(4.5);
      setTotalAvis(DEMO_AVIS.length);
      setRepartAvis({ '5': 1, '4': 1 });
      setLoading(false);
      return;
    }
    if (!boutiqueId || !gId) return;
    setLoading(true);

    fetch(apiBoutique)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBoutique(d))
      .catch(() => {});

    fetch(`${API_BASE}/produits/gestionnaire/${gId}?collaborateur_id=${boutiqueId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setProduits(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${apiBoutique}/addons-statut`)
      .then(r => r.ok ? r.json() : {} as any)
      .then((d: any) => setAddonsStatut({ blog_actif: !!d.blog_actif, faq_actif: !!d.faq_actif, avis_actif: !!d.avis_actif, chat_actif: !!d.chat_actif, favoris_actif: !!d.favoris_actif }))
      .catch(() => {});
  }, [boutiqueId, gId, isDemo]);

  // Cette boutique est-elle dans les favoris de l'acheteur connecté ?
  useEffect(() => {
    if (isDemo || !gId || !boutiqueId || lireType() !== 'acheteur') return;
    let actif = true;
    fetch(`${API_BASE}/acheteur/${gId}/favoris`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : { collaborateurs: [] }))
      .then(d => { if (actif) setEstFavori((d.collaborateurs || []).some((c: any) => String(c.id) === String(boutiqueId))); })
      .catch(() => {});
    return () => { actif = false; };
  }, [gId, boutiqueId, isDemo]);

  const basculerFavori = async () => {
    if (isDemo) { annoncer(true, '❤️ (démo) Ajouté aux favoris'); return; }
    const type = lireType();
    if (!type) { annoncer(false, 'Connectez-vous avec un compte acheteur pour ajouter aux favoris'); return; }
    if (type !== 'acheteur') { annoncer(false, 'Un compte acheteur est requis pour ajouter aux favoris'); return; }
    setFavoriOccupe(true);
    try {
      const res = await fetch(`${API_BASE}/acheteur/${gId}/favoris/${boutiqueId}`, { method: estFavori ? 'DELETE' : 'POST', credentials: 'include' });
      if (res.status === 401) { try { localStorage.removeItem(`mv_compte_${gId}`); } catch { /* stockage indisponible */ } annoncer(false, 'Session expirée — reconnectez-vous'); }
      else if (res.ok) { annoncer(true, estFavori ? 'Retirée de vos favoris' : '❤️ Boutique ajoutée à vos favoris'); setEstFavori(!estFavori); }
      else annoncer(false, '❌ Opération impossible');
    } catch { annoncer(false, '❌ Erreur réseau'); }
    setFavoriOccupe(false);
  };

  // Chat : ouvre le tableau de bord acheteur sur « Chat collaborateurs » avec cette boutique déjà choisie
  // (conversation existante ouverte, sinon formulaire « nouvelle conversation » prérempli).
  const ouvrirChat = () => {
    if (isDemo) { annoncer(true, '💬 (démo) Ouvre le chat de votre espace acheteur avec cette boutique'); return; }
    const type = lireType();
    if (!type) { annoncer(false, 'Connectez-vous avec un compte acheteur pour discuter avec cette boutique'); return; }
    if (type !== 'acheteur') { annoncer(false, 'Un compte acheteur est requis pour discuter avec une boutique'); return; }
    try { localStorage.setItem(`mv_chat_prefill_${gId}`, JSON.stringify({ collaborateur_id: Number(boutiqueId) })); } catch { /* stockage indisponible */ }
    naviguer({ page: 'dashboard-acheteur' });
  };

  const envoyerSignalement = async () => {
    const nom = nettoyerTexte(sigNom, 100).trim(), email = nettoyerTexte(sigEmail, 160).trim(), description = nettoyerTexte(sigDescription, 2000).trim(), autre = nettoyerTexte(sigAutre, 150).trim();
    if (!nom || !email || !description || (sigRaison === 'autre' && !autre)) { setModalMsg({ ok: false, texte: 'Veuillez remplir tous les champs obligatoires.' }); return; }
    if (isDemo) { setModalMsg({ ok: true, texte: '✅ (démo) Signalement envoyé' }); return; }
    setModalOccupe(true);
    try {
      const res = await fetch(`${apiBoutique}/signaler`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, raison_type: sigRaison, raison_autre: sigRaison === 'autre' ? autre : '', description }),
      });
      if (res.ok) { setModalMsg({ ok: true, texte: '✅ Signalement envoyé. Merci de votre aide !' }); setSigNom(''); setSigEmail(''); setSigRaison('produit_fake'); setSigAutre(''); setSigDescription(''); }
      else setModalMsg({ ok: false, texte: (await res.json().catch(() => ({}))).error || '❌ Envoi impossible' });
    } catch { setModalMsg({ ok: false, texte: '❌ Erreur réseau' }); }
    setModalOccupe(false);
  };

  // Charger contenu add-ons seulement si actifs
  useEffect(() => {
    if (isDemo || !boutiqueId || !gId) return;
    if (addonsStatut.blog_actif) {
      fetch(`${apiBoutique}/blog`).then(r => r.ok ? r.json() : { articles: [] }).then(d => setBlog(d.articles || [])).catch(() => {});
    }
    if (addonsStatut.faq_actif) {
      fetch(`${apiBoutique}/faq`).then(r => r.ok ? r.json() : { items: [] }).then(d => setFaq(d.items || [])).catch(() => {});
    }
  }, [addonsStatut, boutiqueId, gId, isDemo]);

  // Avis : 25 par page, chargés à chaque changement de page
  useEffect(() => {
    if (isDemo || !boutiqueId || !gId || !addonsStatut.avis_actif) return;
    let annule = false;
    setAvisOccupe(true);
    fetch(`${apiBoutique}/avis?page=${pageAvis}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (annule || !d) return;
        setAvis(d.avis || []); setMoyenneAvis(d.moyenne || 0); setTotalAvis(d.total || 0);
        setPagesAvis(d.pages || 1); setRepartAvis(d.repartition || {});
        if (d.page && d.page !== pageAvis) setPageAvis(d.page);
      })
      .catch(() => {})
      .finally(() => { if (!annule) setAvisOccupe(false); });
    return () => { annule = true; };
  }, [addonsStatut.avis_actif, pageAvis, boutiqueId, gId, isDemo]);

  const changerPageAvis = (n: number) => {
    setPageAvis(n);
    try { document.getElementById('mvp-avis-haut')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch { /* défilement indisponible */ }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: fondDe(config), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>Chargement...</div>
  );

  if (!boutique) return (
    <div style={{ minHeight: '100vh', background: fondDe(config), display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Boutique introuvable</p>
      <button onClick={() => naviguer({ page: 'boutiques' })} style={{ padding: '10px 24px', background: couleurAccent, color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour aux boutiques</button>
    </div>
  );

  const ONGLETS: { id: Onglet; label: string; icone: string; visible: boolean }[] = [
    { id: 'produits', label: 'Produits', icone: '🛍️', visible: true },
    { id: 'apropos',  label: 'À propos', icone: 'ℹ️', visible: true },
    { id: 'details',  label: '+ de détails', icone: '📍', visible: !!boutique.details },
    { id: 'blog',     label: 'Blog',     icone: '📝', visible: addonsStatut.blog_actif },
    { id: 'faq',      label: 'FAQ',      icone: '❓', visible: addonsStatut.faq_actif },
    { id: 'avis',     label: 'Avis',     icone: '⭐', visible: addonsStatut.avis_actif },
  ];

  // Catégories calculées depuis les produits, avec compteur
  const categoriesAvecCompteur = (() => {
    const map: Record<string, number> = {};
    produits.forEach(p => {
      const cat = p.categorie_nom || 'Autres';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count);
  })();

  // Produits filtrés par recherche + catégories cochées
  const produitsFiltres = produits.filter(p => {
    if (recherche && !p.nom.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (categoriesActives.length > 0 && !categoriesActives.includes(p.categorie_nom || 'Autres')) return false;
    return true;
  });

  const toggleCategorie = (cat: string) => {
    setCategoriesActives(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div style={{ ...s.page, background: fondDe(config) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @media (max-width:640px) {
          .mvp-banniere { height:130px !important; }
          .mvp-header, .mvp-tabs, .mvp-main { padding-left:16px !important; padding-right:16px !important; }
          .mvp-main { padding-top:20px !important; padding-bottom:40px !important; }
          .mvp-logo { width:76px !important; height:76px !important; }
          .mvp-actions { margin-top:0 !important; width:100% !important; }
          .mvp-actions button { flex:1 !important; padding:9px 8px !important; }
          .mvp-layout { flex-direction:column !important; gap:14px !important; }
          .mvp-side { width:100% !important; }
          .mvp-cats { display:none !important; }
          .mvp-cats.ouvert { display:flex !important; }
          .mvp-grille { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; }
        }
        @media (min-width:641px) { .mvp-chev { display:none; } }
        .blog-contenu p { color: rgba(255,255,255,0.75); line-height: 1.8; margin-bottom: 1em; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      {/* Bannière boutique */}
      <div className="mvp-banniere" style={{ ...s.banniere, backgroundImage: boutique.banniere_url ? `url(${boutique.banniere_url})` : `linear-gradient(135deg, ${couleurAccent}30, ${fondDe(config)})` }}>
        <div style={{ ...s.bannièreOverlay, background: `linear-gradient(to bottom, rgba(0,0,0,0.1), ${fondDe(config)})` }} />
      </div>

      {/* Header boutique */}
      <div className="mvp-header" style={s.headerBoutique}>
        <div style={s.headerInner}>
          <div className="mvp-logo" style={{ ...s.logoBoutique, borderColor: fondDe(config) }}>
            {boutique.logo_url
              ? <img src={boutique.logo_url} alt={boutique.nom_boutique} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
              : <span style={{ fontSize: 32, fontWeight: 900, color: couleurAccent }}>{boutique.nom_boutique[0]}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={s.nomBoutique}>{boutique.nom_boutique}</h1>
              <MVBadgesCollab badges={boutique.badges} taille={32} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
              {boutique.nb_produits != null && <span style={s.badgeMeta}>📦 {boutique.nb_produits} produit{boutique.nb_produits > 1 ? 's' : ''}</span>}
              {boutique.nb_vendus != null && <span style={s.badgeMeta}>🛒 {boutique.nb_vendus} produit{boutique.nb_vendus > 1 ? 's' : ''} vendu{boutique.nb_vendus > 1 ? 's' : ''}</span>}
              {boutique.date_inscription && <span style={s.badgeMeta}>📅 Membre depuis {new Date(boutique.date_inscription).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' })}</span>}
              {(boutique.ville || boutique.province) && <span style={s.badgeMeta}>📍 {[boutique.ville, boutique.province].filter(Boolean).join(', ')}</span>}
              {addonsStatut.avis_actif && totalAvis > 0 && (
                <span style={s.badgeMeta}><Etoiles note={Math.round(moyenneAvis)} taille={12} /> {moyenneAvis.toFixed(1)} ({totalAvis})</span>
              )}
            </div>
          </div>
          <div className="mvp-actions" style={s.actions}>
            {addonsStatut.favoris_actif && <button onClick={basculerFavori} disabled={favoriOccupe}
              style={{ ...s.btnAction, borderColor: estFavori ? '#ef4444' : 'rgba(255,255,255,0.18)', color: estFavori ? '#f87171' : '#fff', background: estFavori ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)' }}>
              {estFavori ? '❤️ Favori' : '🤍 Favori'}
            </button>}
            {addonsStatut.chat_actif && <button onClick={ouvrirChat} style={{ ...s.btnAction, borderColor: `${couleurAccent}66`, color: couleurAccent, background: `${couleurAccent}14` }}>💬 Chat</button>}
            <button onClick={() => { setModalMsg(null); setModal('signaler'); }} style={{ ...s.btnAction, borderColor: 'rgba(239,68,68,0.35)', color: '#f87171', background: 'rgba(239,68,68,0.08)' }}>⚠️ Signaler</button>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={s.ongletsBar}>
        <div className="mvp-tabs" style={s.ongletsInner}>
          {ONGLETS.filter(o => o.visible).map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ ...s.ongletBtn, borderBottom: onglet === o.id ? `3px solid ${couleurAccent}` : '3px solid transparent', color: onglet === o.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {o.icone} {o.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mvp-main" style={s.main}>
        {boutique.vacances && (
        <div style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', color: '#fcd34d', fontSize: 14, lineHeight: 1.5 }}>
          <strong>🌴 Boutique en vacances{boutique.vacances.retour ? ` — de retour le ${new Date(`${boutique.vacances.retour}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</strong><br />
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{boutique.vacances.message}</span>{boutique.vacances.mode === 'masque' && <><br /><span style={{ color: '#fff', fontWeight: 600 }}>Les achats directs sont fermés pendant cette période.</span></>}
        </div>
      )}
        {/* ── ONGLET PRODUITS ── */}
        {onglet === 'produits' && (
          <div>
            {/* Barre de recherche */}
            <div style={s.barreRecherche}>
              <input value={recherche} maxLength={100} autoComplete="off" onChange={e => setRecherche(nettoyerRecherche(e.target.value))} placeholder="Rechercher un produit..." style={s.inputRecherche} />
              <button style={{ ...s.btnRecherche, background: couleurAccent }}>🔍</button>
            </div>

            <div className="mvp-layout" style={s.layoutProduits}>
              {/* Sidebar catégories */}
              {categoriesAvecCompteur.length > 0 && (
                <aside className="mvp-side" style={s.sidebarCat}>
                  <div style={s.sidebarCard}>
                    <h3 style={s.sidebarTitre} onClick={() => setFiltreCatMobileOuvert(v => !v)}>
                      Filtrer par catégories
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {categoriesAvecCompteur.reduce((acc, c) => acc + c.count, 0)} <span className="mvp-chev">{filtreCatMobileOuvert ? '▲' : '▼'}</span>
                      </span>
                    </h3>
                    <div className={`mvp-cats${filtreCatMobileOuvert ? ' ouvert' : ''}`} style={s.listeCat}>
                      {categoriesAvecCompteur.map(cat => (
                        <label key={cat.nom} style={s.catLabel}>
                          <input type="checkbox" checked={categoriesActives.includes(cat.nom)} onChange={() => toggleCategorie(cat.nom)} style={{ accentColor: couleurAccent, cursor: 'pointer' }} />
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.7)' }}>{cat.nom}</span>
                          <span style={{ ...s.badgeCount, background: couleurAccent, color: '#000' }}>{cat.count}</span>
                        </label>
                      ))}
                      {categoriesActives.length > 0 && (
                        <button onClick={() => setCategoriesActives([])} style={s.btnReset}>✕ Effacer les filtres</button>
                      )}
                    </div>
                  </div>
                </aside>
              )}

              {/* Grille produits */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {produitsFiltres.length === 0 ? (
                  <div style={s.vide}><div style={{ fontSize: 40, marginBottom: 10 }}>📦</div><p style={{ color: 'rgba(255,255,255,0.5)' }}>{recherche || categoriesActives.length > 0 ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit pour le moment'}</p></div>
                ) : (
                  <div className="mvp-grille" style={s.grilleProduits}>
                    {produitsFiltres.map(p => (
                      <div key={p.id} onClick={() => naviguer({ page: 'produit', produitId: p.id })} style={s.carteProduit}>
                        <div style={{ ...s.carteImg, position: 'relative' }}>
                          {p.image ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 32, opacity: 0.2 }}>📦</div>}
                          <MVSouhaitCarte zone="superposition" gestionnaireId={gId} produitId={p.id} isDemo={isDemo} />
                          {p.date_parution && (
                            <div style={{ position: 'absolute', left: 6, right: 6, bottom: 6 }}>
                              <MVParutionCountdown compact gestionnaireId={gId} dateParution={p.date_parution} heureServeur={p.heure_serveur} />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: 12 }}>
                          <MVSouhaitCarte zone="haut" gestionnaireId={gId} produitId={p.id} isDemo={isDemo} />
                          <p style={{ fontSize: 13, color: '#fff', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{p.nom}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: couleurAccent, margin: 0 }}>{formaterPrix(parseFloat(String(p.prix)))}</p>
                          <MVSouhaitCarte zone="bas" gestionnaireId={gId} produitId={p.id} isDemo={isDemo} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET À PROPOS ── */}
        {onglet === 'apropos' && (
          <div style={s.contenuApropos}>
            <h2 style={s.sectionTitre}>À propos de {boutique.nom_boutique}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: 15 }}>
              {boutique.description_longue || boutique.description_courte || 'Cette boutique n\'a pas encore ajouté de description.'}
            </p>
            <div style={s.infosGrid}>
              {boutique.date_inscription && <div style={s.infoCard}><span style={s.infoLabel}>Membre depuis</span><span style={s.infoVal}>{new Date(boutique.date_inscription).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' })}</span></div>}
              {boutique.telephone && <div style={s.infoCard}><span style={s.infoLabel}>Téléphone</span><span style={s.infoVal}>{boutique.telephone}</span></div>}
            </div>
          </div>
        )}

        {/* ── ONGLET + DE DÉTAILS (visible seulement si le collaborateur l'a activé) ── */}
        {onglet === 'details' && boutique.details && (() => {
          const d = boutique.details!;
          const adresseComplete = [d.adresse, [d.ville, d.province].filter(Boolean).join(', '), d.code_postal].filter(Boolean).join(' · ');
          const lien = (u: string) => /^https?:\/\/[^\s<>"']+$/i.test(u) ? u : undefined;
          const RS: { cle: string; label: string; icone: string }[] = [
            { cle: 'facebook', label: 'Facebook', icone: '' }, { cle: 'instagram', label: 'Instagram', icone: '' },
            { cle: 'tiktok', label: 'TikTok', icone: '' }, { cle: 'youtube', label: 'YouTube', icone: '' },
            { cle: 'x', label: 'X', icone: '' }, { cle: 'linkedin', label: 'LinkedIn', icone: '' },
            { cle: 'pinterest', label: 'Pinterest', icone: '' },
          ];
          const reseaux = RS.filter(r => d.reseaux && lien(d.reseaux[r.cle] || ''));
          return (
            <div style={s.contenuApropos}>
              <h2 style={s.sectionTitre}>+ de détails sur {boutique.nom_boutique}</h2>
              <div style={s.infosGrid}>
                {adresseComplete && <div style={s.infoCard}><span style={s.infoLabel}>📍 Adresse</span><span style={{ ...s.infoVal, overflowWrap: 'anywhere' }}>{adresseComplete}</span></div>}
                {d.email && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(d.email) && (
                  <div style={s.infoCard}><span style={s.infoLabel}>✉️ Courriel</span>
                    <a href={`mailto:${d.email}`} style={{ ...s.infoVal, color: couleurAccent, textDecoration: 'none', overflowWrap: 'anywhere' }}>{d.email}</a>
                  </div>
                )}
                {d.telephone && (
                  <div style={s.infoCard}><span style={s.infoLabel}>📞 Téléphone</span>
                    <a href={`tel:${d.telephone.replace(/[^0-9+]/g, '')}`} style={{ ...s.infoVal, color: couleurAccent, textDecoration: 'none' }}>{d.telephone}</a>
                  </div>
                )}
                {d.site_web && lien(d.site_web) && (
                  <div style={s.infoCard}><span style={s.infoLabel}>🌐 Site web</span>
                    <a href={lien(d.site_web)} target="_blank" rel="noopener noreferrer" style={{ ...s.infoVal, color: couleurAccent, textDecoration: 'none', overflowWrap: 'anywhere' }}>{d.site_web.replace(/^https?:\/\//i, '')} ↗</a>
                  </div>
                )}
              </div>
              {reseaux.length > 0 && (
                <>
                  <h3 style={{ ...s.sectionTitre, fontSize: 16, marginTop: 28 }}>Suivez-nous</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {reseaux.map(r => (
                      <a key={r.cle} href={lien(d.reseaux![r.cle])} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                        {r.label}<span aria-hidden="true" style={{ color: couleurAccent, fontSize: 13 }}>↗</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── ONGLET BLOG (add-on) ── */}
        {onglet === 'blog' && addonsStatut.blog_actif && (
          <div>
            <h2 style={s.sectionTitre}>📝 Blog de la boutique</h2>
            {blog.length === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucun article pour le moment</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blog.map(article => (
                  <div key={article.id} style={{ ...s.carteBlog, borderColor: blogOuvert === article.id ? `${couleurAccent}50` : 'rgba(255,255,255,0.08)' }}>
                    <div onClick={() => { if (blogOuvert !== article.id && !isDemo) { fetch(`${apiBoutique}/blog/${article.id}/vue`, { method: 'POST' }).catch(() => {}); } setBlogOuvert(o => o === article.id ? null : article.id); }} style={{ padding: 18, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{article.titre}</h3>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                          <span>📅 {new Date(article.date_publication).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          {article.vues > 0 && <span>👁 {article.vues} vues</span>}
                        </div>
                      </div>
                      <span style={{ color: couleurAccent, fontSize: 18 }}>{blogOuvert === article.id ? '▲' : '▼'}</span>
                    </div>
                    {blogOuvert === article.id && (
                      <div className="blog-contenu" style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }} dangerouslySetInnerHTML={{ __html: article.contenu }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET FAQ (add-on) ── */}
        {onglet === 'faq' && addonsStatut.faq_actif && (
          <div>
            <h2 style={s.sectionTitre}>❓ Questions fréquentes</h2>
            {faq.length === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucune question pour le moment</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faq.map(item => (
                  <div key={item.id} style={{ ...s.carteBlog, borderColor: faqOuvert === item.id ? `${couleurAccent}50` : 'rgba(255,255,255,0.08)' }}>
                    <div onClick={() => setFaqOuvert(o => o === item.id ? null : item.id)} style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{item.question}</h3>
                      <span style={{ color: couleurAccent, fontSize: 16, flexShrink: 0 }}>{faqOuvert === item.id ? '▲' : '▼'}</span>
                    </div>
                    {faqOuvert === item.id && (
                      <p style={{ padding: '0 16px 16px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: 14, margin: 0 }}>{item.reponse}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET AVIS (add-on) : détaillé, 25 avis par page ── */}
        {onglet === 'avis' && addonsStatut.avis_actif && (
          <div id="mvp-avis-haut">
            <h2 style={{ ...s.sectionTitre, marginBottom: 14 }}>⭐ Avis clients</h2>

            {totalAvis > 0 && (
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{moyenneAvis.toFixed(1)}</div>
                  <div style={{ margin: '6px 0 2px' }}><Etoiles note={Math.round(moyenneAvis)} taille={16} /></div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{totalAvis} avis</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const c = repartAvis[String(n)] || 0;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        <span style={{ width: 24 }}>{n} ★</span>
                        <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${totalAvis ? Math.round((c / totalAvis) * 100) : 0}%`, height: '100%', background: couleurAccent }} />
                        </div>
                        <span style={{ width: 28, textAlign: 'right' }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalAvis === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucun avis pour le moment.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: avisOccupe ? 0.55 : 1, transition: 'opacity 0.15s' }}>
                {avis.map(a => (
                  <div key={a.id} style={s.carteAvis}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 14 }}>{a.nom_client}</p>
                        <Etoiles note={a.note_globale} />
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {a.titre && <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 14 }}>{a.titre}</p>}
                    {a.commentaire && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.commentaire}</p>}
                    {a.criteres && (a.criteres.delai_respecte !== undefined && a.criteres.delai_respecte !== null || a.criteres.communication || a.criteres.emballage) && (
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        {a.criteres.delai_respecte !== undefined && a.criteres.delai_respecte !== null && <span>Délai respecté : {a.criteres.delai_respecte ? '✅ oui' : '❌ non'}</span>}
                        {!!a.criteres.communication && <span>Communication : <Etoiles note={a.criteres.communication} taille={12} /></span>}
                        {!!a.criteres.emballage && <span>Emballage : <Etoiles note={a.criteres.emballage} taille={12} /></span>}
                      </div>
                    )}
                    {a.photos && a.photos.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {a.photos.map((u, i) => <a key={i} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="Photo de l'acheteur" loading="lazy" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /></a>)}
                      </div>
                    )}
                    {a.produits && a.produits.length > 0 && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '10px 0 0' }}>
                        🛍️ Achat : {a.produits.map(p => p.titre).join(' · ')}
                      </p>
                    )}
                    {a.reponse && (
                      <div style={{ marginTop: 10, borderLeft: `3px solid ${couleurAccent}`, paddingLeft: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                          Réponse de la boutique{a.reponse_le ? ` · ${new Date(a.reponse_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5, margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.reponse}</p>
                      </div>
                    )}
                  </div>
                ))}

                {pagesAvis > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <button disabled={pageAvis <= 1 || avisOccupe} onClick={() => changerPageAvis(pageAvis - 1)}
                      style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: pageAvis <= 1 ? 'default' : 'pointer', opacity: pageAvis <= 1 ? 0.4 : 1 }}>← Précédent</button>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Page {pageAvis} sur {pagesAvis}</span>
                    <button disabled={pageAvis >= pagesAvis || avisOccupe} onClick={() => changerPageAvis(pageAvis + 1)}
                      style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: pageAvis >= pagesAvis ? 'default' : 'pointer', opacity: pageAvis >= pagesAvis ? 0.4 : 1 }}>Suivant →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {infoAction && (
        <div role="status" style={{ position: 'fixed', top: 80, right: 20, zIndex: 3000, maxWidth: 'calc(100vw - 40px)', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: infoAction.ok ? '#059669' : '#dc2626', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{infoAction.texte}</div>
      )}

      {modal && (
        <div onClick={fermerModal} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: '#12121a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontFamily: "'Syne',sans-serif", color: '#fff' }}>
              ⚠️ Signaler cette boutique
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Votre signalement sera transmis au gestionnaire du site. Merci de rester factuel.
            </p>
            {modalMsg && (
              <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 13, color: modalMsg.ok ? '#34d399' : '#f87171', background: modalMsg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${modalMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{modalMsg.texte}</div>
            )}
              <>
                <input value={sigNom} maxLength={100} autoComplete="name" onChange={e => setSigNom(nettoyerTexte(e.target.value, 100))} placeholder="Votre nom *" style={s.champ} />
                <input type="email" value={sigEmail} maxLength={160} autoComplete="email" onChange={e => setSigEmail(nettoyerTexte(e.target.value, 160))} placeholder="Votre courriel *" style={s.champ} />
                <select value={sigRaison} onChange={e => setSigRaison(e.target.value)} style={s.champ}>
                  <option value="produit_fake">Produit contrefait / faux</option>
                  <option value="arnaque">Tentative d'arnaque</option>
                  <option value="comportement">Comportement inapproprié</option>
                  <option value="livraison">Problème de livraison</option>
                  <option value="qualite">Qualité non conforme</option>
                  <option value="autre">Autre</option>
                </select>
                {sigRaison === 'autre' && <input value={sigAutre} maxLength={150} onChange={e => setSigAutre(nettoyerTexte(e.target.value, 150))} placeholder="Précisez la raison *" style={s.champ} />}
                <textarea value={sigDescription} maxLength={2000} rows={5} onChange={e => setSigDescription(nettoyerTexte(e.target.value, 2000))} placeholder="Description détaillée *" style={{ ...s.champ, resize: 'vertical' }} />
              </>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={fermerModal} style={{ ...s.btnModal, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>{modalMsg?.ok ? 'Fermer' : 'Annuler'}</button>
              {!modalMsg?.ok && (
                <button onClick={envoyerSignalement} disabled={modalOccupe}
                  style={{ ...s.btnModal, background: '#dc2626', color: '#fff', opacity: modalOccupe ? 0.6 : 1 }}>
                  {modalOccupe ? '⏳ Envoi…' : 'Envoyer le signalement'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <MVPremiumFooter vendeurId={vendeurId} isDemo={isDemo} config={config} naviguer={naviguer} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:     { overflowX: 'clip', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  nav:      { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  navLinks: { display: 'flex', gap: 24 },
  navLink:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' },
  banniere: { height: 180, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  bannièreOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), #0a0a0a)' },
  headerBoutique: { width: '100%', maxWidth: 1100, margin: '-50px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 },
  headerInner: { display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' },
  logoBoutique: { width: 96, height: 96, borderRadius: 18, background: '#15151f', border: '3px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  nomBoutique: { fontFamily: "'Syne',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, margin: 0 },
  actions:  { display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: 56 },
  btnAction:{ padding: '9px 16px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  champ:    { width: '100%', padding: '11px 12px', marginBottom: 12, background: '#1e1e2b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btnModal: { padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  badgeMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 },
  ongletsBar: { borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 28 },
  ongletsInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' as const },
  ongletBtn: { padding: '14px 18px', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' },
  main:     { width: '100%', maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' },
  vide:     { textAlign: 'center', padding: '50px 20px' },
  barreRecherche: { display: 'flex', marginBottom: 24, maxWidth: 380 },
  inputRecherche: { flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  btnRecherche: { padding: '10px 18px', border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 14, color: '#000' },
  layoutProduits: { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' as const },
  sidebarCat: { width: 230, flexShrink: 0 },
  sidebarCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
  sidebarTitre: { fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  listeCat: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  catLabel: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '4px 0' },
  badgeCount: { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  btnReset: { marginTop: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
  grilleProduits: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  carteProduit: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' },
  carteImg: { height: 140, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sectionTitre: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 16 },
  contenuApropos: { maxWidth: 700 },
  infosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 24 },
  infoCard: { background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoVal:   { fontSize: 14, color: '#fff', fontWeight: 600 },
  carteBlog: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' },
  carteAvis: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
};