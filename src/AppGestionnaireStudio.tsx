import React, { useState, useCallback, useEffect, useRef } from 'react';
import Dashboard          from './pages/gestionnaire/Dashboard';
import PageChoisirTemplate        from './pages/gestionnaire/PageChoisirTemplate';
import ConfigTemplate          from './pages/gestionnaire/ConfigTemplate';
import MonDomaine          from './pages/gestionnaire/MonDomaine';
import MesServices         from './pages/gestionnaire/MesServices';
import ImportEvend          from './pages/gestionnaire/ImportEvend';
import ModalUnsplash from './components/ModalUnsplash';
import BandeauEssai  from './components/BandeauEssai';

// ── Imports composants vendeur présents dans e-Vend Studio ──
// SUPPRIMER les lignes des fichiers qui n'existent pas dans ton projet
// et garder seulement ce que tu as réellement copié.
// Liste minimale pour que ça compile sans erreur :
const API_BASE = '/api'; // e-Vend Studio API

// ── e-Vend Studio ──
import MaCagnotte                   from './pages/studio/MaCagnotte';
import ModelesCourrielStudio from './pages/gestionnaire/ModelesCourrielStudio';
import GestionReservations   from './pages/studio/GestionReservations';
import MesReservationsEcole  from './pages/gestionnaire/MesReservationsEcole';
import MesAbonnementsEcole   from './pages/gestionnaire/MesAbonnementsEcole';
import MesSponsorsGestionnaire from './pages/gestionnaire/MesSponsorsGestionnaire';
import AnalytiqueGestionnaire from './pages/gestionnaire/AnalytiqueGestionnaire';
import ChatbotConfig from './pages/gestionnaire/ChatbotConfig';
import ConfigurationPaiements from './pages/gestionnaire/ConfigurationPaiements';
import MesAcheteurs                  from './pages/studio/MesAcheteurs';
import StudioConfigPage404   from './pages/gestionnaire/StudioConfigPage404';
import StudioMesPolitiques  from './pages/gestionnaire/StudioMesPolitiques';
import StudioMesPages       from './pages/gestionnaire/StudioMesPages';
import StudioSeoSite        from './pages/gestionnaire/StudioSeoSite';
import StudioCookiesSite    from './pages/gestionnaire/StudioCookiesSite';
import StudioGestionPhotosVendeur from './pages/gestionnaire/StudioGestionPhotosGestionnaire';
import StudioConfigGenerale      from './pages/gestionnaire/StudioConfigGenerale';
import StudioConfigMultivendeur  from './pages/gestionnaire/StudioConfigMultivendeur';
import StudioMonCompte          from './pages/gestionnaire/StudioMonCompte';
import StudioBlogSousVendeur    from './pages/gestionnaire/StudioBlogCollaborateur';
import StudioFaqSousVendeur     from './pages/gestionnaire/StudioFaqCollaborateur';
import SurveillanceChats        from './pages/gestionnaire/SurveillanceChats';
import StudioSousVendeurs       from './pages/gestionnaire/StudioCollaborateurs';
import StudioGestionBadges      from './pages/gestionnaire/StudioGestionBadges';
import StudioBadgesAttribues    from './pages/gestionnaire/StudioBadgesAttribues';
import AddOn                    from './pages/gestionnaire/AddOn';
import ConfigMesPagesSimplisse     from './pages/gestionnaire/ConfigMesPagesSimplisse';
import ConfigMesPagesPremium       from './pages/gestionnaire/ConfigMesPagesPremium';
import ConfigMesPagesSimplisseMode from './pages/gestionnaire/ConfigMesPagesSimplisseMode';
import SimplissePlan               from './pages/gestionnaire/SimplissePlan';
import PremiumPlan                 from './pages/gestionnaire/PremiumPlan';
import BrandingEtOptions            from './pages/gestionnaire/BrandingEtOptions';
import CreerAnnonce                from './pages/gestionnaire/CreerAnnonce';
import ConfigMesPagesBeaute        from './pages/gestionnaire/ConfigMesPagesBeaute';
import BeautePlan                  from './pages/gestionnaire/BeautePlan';
import ConfigVerificateurAge        from './pages/gestionnaire/ConfigVerificateurAge';
import ConfigFormulaireContact      from './pages/gestionnaire/ConfigFormulaireContact';
import MessagerieFormulaireContact  from './pages/gestionnaire/MessagerieFormulaireContact';
import ConfigPopupAnnonce           from './pages/gestionnaire/ConfigPopupAnnonce';
import MVPremiumPlan               from './pages/gestionnaire/MVPremiumPlan';
import ConfigMultiVendeurPremium   from './pages/gestionnaire/ConfigMultiVendeurPremium';

// =====================================================================
// 🚧 PAGES EN CONSTRUCTION — placeholders compilables
// Chaque composant sera remplacé par la vraie page progressivement
// =====================================================================

function PageEnConstruction({ titre, icone = '🚧', description }: { titre: string; icone?: string; description?: string }) {
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>{icone}</div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>{titre}</h1>
      <p style={{ fontSize: 15, color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
        {description || 'Cette section est en cours de développement. Elle sera disponible très bientôt.'}
      </p>
      <div style={{ display: 'inline-block', padding: '10px 24px', background: '#f3f4f6', borderRadius: 20, fontSize: 13, color: '#666', fontWeight: 600 }}>
        🔨 En construction
      </div>
    </div>
  );
}

// ── Placeholders pages gestionnaire ────────────────────────────────────────────────
// CreerAnnonce — importé

const MonCompte           = ({ vendeurId }: any) =>
  <PageEnConstruction titre="Mon compte" icone="👤" description="Gérez vos informations personnelles et votre profil gestionnaire." />;

const ListeCommandes      = ({ naviguerVers, vendeurId, onVoirCommande }: any) =>
  <PageEnConstruction titre="Liste des commandes" icone="📋" description="Toutes vos commandes clients apparaîtront ici." />;

const DetailCommande      = ({ commandeId, retourListe }: any) =>
  <PageEnConstruction titre="Détail de la commande" icone="🔍" />;

const PaiementsCommandes  = () =>
  <PageEnConstruction titre="Paiements & commissions" icone="💰" description="Consultez vos paiements reçus et commissions dues." />;

const RetourRemboursements = () =>
  <PageEnConstruction titre="Retours & remboursements" icone="🔄" description="Gérez les demandes de retour de vos clients." />;

const CommandesBrouillons = () =>
  <PageEnConstruction titre="Commandes brouillons" icone="📝" description="Créez des commandes manuelles pour vos clients." />;

const DocumentsVendeur    = () =>
  <PageEnConstruction titre="Documents gestionnaire" icone="📄" description="Vos bons de livraison, factures et autres documents." />;

const ConfigurationGenerale = () =>
  <PageEnConstruction titre="Configuration générale" icone="🔧" description="Paramètres de base de votre boutique : nom, adresse, Stripe Connect." />;

import ListeProduits from './pages/gestionnaire/ListeProduits';
import BulkEditProduits from './pages/gestionnaire/BulkEditProduits';

const Categories          = () =>
  <PageEnConstruction titre="Collections" icone="🗂️" description="Organisez vos produits en collections." />;

const MessagerieAdministration = () =>
  <PageEnConstruction titre="Messagerie administration" icone="🛡️" description="Vos échanges avec l'équipe e-Vend Studio." />;

const MessagerieNotifications  = () =>
  <PageEnConstruction titre="Notifications e-Vend" icone="🔔" description="Toutes vos notifications de la plateforme." />;

const MonForfait          = () =>
  <PageEnConstruction titre="Mon forfait" icone="📊" description="Consultez et modifiez votre plan d'abonnement." />;

const PlansMembership     = ({ naviguerVers }: any) =>
  <PageEnConstruction titre="Plans & membership" icone="💎" description="Comparez les différents forfaits disponibles." />;

const RapportVendeur      = ({ nomVendeur }: any) =>
  <PageEnConstruction titre="Rapport financier" icone="📈" description="Analysez vos performances de vente." />;

const MesAvis             = () =>
  <PageEnConstruction titre="Mes avis" icone="⭐" description="Les avis de vos clients apparaîtront ici." />;

const AvisProduits        = () =>
  <PageEnConstruction titre="Avis produits" icone="📝" description="Avis laissés sur vos produits spécifiques." />;

const MesBlogs            = () =>
  <PageEnConstruction titre="Mes blogs" icone="✍️" description="Créez du contenu pour attirer vos clients." />;

const MaFaq               = () =>
  <PageEnConstruction titre="Ma FAQ" icone="❓" description="Répondez aux questions fréquentes de vos clients." />;

const FacturesVendeur     = ({ naviguerVers }: any) =>
  <PageEnConstruction titre="Factures" icone="🧾" description="Vos factures d'abonnement e-Vend Studio." />;

const MesEncheres         = () =>
  <PageEnConstruction titre="Mes enchères" icone="🔨" description="Gérez vos ventes aux enchères." />;

const ReductionsRabais    = () =>
  <PageEnConstruction titre="Réductions & codes promo" icone="🏷️" description="Créez des codes de réduction pour vos clients." />;

const TagsProduits        = () =>
  <PageEnConstruction titre="Tags produits" icone="🏷️" description="Organisez vos produits avec des étiquettes." />;

const TypesProduits       = () =>
  <PageEnConstruction titre="Types de produits" icone="📑" description="Définissez les types de produits que vous vendez." />;

const ConnecterBoutique   = ({ onRetour, vendorId }: any) =>
  <PageEnConstruction titre="Connecter ma boutique" icone="🔗" description="Connectez votre compte Stripe pour recevoir des paiements." />;

const MesBadges           = () =>
  <PageEnConstruction titre="Mes badges" icone="🏅" description="Vos certifications et badges de confiance." />;

const MethodesExpedition  = ({ vendeurId, onRetour }: any) =>
  <PageEnConstruction titre="Méthodes d'expédition" icone="🚚" description="Configurez vos options de livraison." />;

const MesOffres           = () =>
  <PageEnConstruction titre="Mes offres reçues" icone="💬" description="Offres soumises par des acheteurs sur vos produits." />;

// =====================================================================
// TYPES
// =====================================================================
export interface GestionnaireUser {
  id:               number;
  email:            string;
  nom:              string;
  nom_boutique:     string | null;
  role:             string;
  seller_id?:       string;
  statut?:          string;
  plan?:            string;
  site_template_id?: string;
  email_verifie?:   boolean;
}

interface StatsVendeur {
  revenus: {
    total: number;
    mois: number;
    aujourdhui: number;
    croissance: number;
  };
  commandes: {
    total: number;
    enAttente: number;
    expediees: number;
    livrees: number;
    annulees: number;
    croissance: number;
  };
  produits: {
    total: number;
    actifs: number;
    enRupture: number;
    vues: number;
    vuesCroissance: number;
  };
  avis: {
    moyenne: number;
    total: number;
    cinqEtoiles: number;
    quatreEtoiles: number;
    troisEtoiles: number;
    deuxEtoiles: number;
    uneEtoile: number;
  };
  graphiques: {
    ventes30j: { date: string; ventes: number; commandes: number }[];
    topProduits: { nom: string; ventes: number; revenu: number }[];
    repartitionStatuts: { nom: string; valeur: number; couleur: string }[];
    visites: { date: string; vues: number }[];
  };
}

// Types pour le menu
interface SousMenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  onClick?: () => void;
  href?: string;
  bloque?: boolean;
  cleAcces?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  sousMenu?: SousMenuItem[];
  cleAcces?: string;
}

// =====================================================================
// COMPOSANTS UTILITAIRES (inchangés)
// =====================================================================
const tooltipStyle: React.CSSProperties = {
  position: 'absolute', bottom: '-32px', left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0,0,0,0.75)', color: 'white',
  padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
  whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1000,
};

// =====================================================================
// COMPOSANT INDICATEUR DE SESSION (inchangé)
// =====================================================================
function SessionIndicator({ statut }: { statut?: string }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const intervalRef = useRef<any>(null);

  const verifierToken = () => {
    const token = localStorage.getItem('token');
    if (!token) { setIsConnected(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      setIsConnected(Date.now() < payload.exp * 1000);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    verifierToken();
    intervalRef.current = setInterval(verifierToken, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (isConnected === null) {
    return <span style={{ color: '#aaa', fontSize: '12px' }}>⏳ Vérification...</span>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: '16px',
      padding: '4px 10px',
      borderRadius: '20px',
      backgroundColor: isConnected ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${isConnected ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
    }}>
      <span style={{ fontSize: '14px' }}>{isConnected ? '✅' : '❌'}</span>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600,
        color: isConnected ? '#4ade80' : '#f87171'
      }}>
        {isConnected ? 'Session connectée' : 'Session déconnectée'}
      </span>
      {statut && (() => {
        const cfg: Record<string, { color: string; label: string }> = {
          actif:      { color: '#4ade80', label: 'Actif' },
          vacances:   { color: '#38bdf8', label: 'Vacances' },
          suspendu:   { color: '#f87171', label: 'Suspendu' },
          banni:      { color: '#f87171', label: 'Banni' },
          rejected:   { color: '#f87171', label: 'Refusé' },
          pending:    { color: '#fb923c', label: 'En attente' },
          en_attente: { color: '#fb923c', label: 'En attente' },
        };
        const s = cfg[statut] || { color: '#aaa', label: statut };
        return (
          <span style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '8px', marginLeft: '2px', fontSize: '11px', fontWeight: 600, color: s.color }}>
            Statut : {s.label}
          </span>
        );
      })()}
    </div>
  );
}

// =====================================================================
// APP GESTIONNAIRE PRINCIPALE (inchangée, sauf le fr remplacé par {})
// =====================================================================
interface AppGestionnaireProps {
  isAdminImpersonation?: boolean;
  onLogout?:   () => void;
  gestionnaireUser?: GestionnaireUser | null;
}

function AppGestionnaire({ onLogout, gestionnaireUser, isAdminImpersonation = false }: AppGestionnaireProps) {
  const getToken = () => localStorage.getItem('token');

  const [pageActive, setPageActive]         = useState('dashboard');
  const [templateIdChoisi, setTemplateIdChoisi] = useState<string>('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [message, setMessage] = useState('');
  const [nonLus, setNonLus] = useState({ acheteurs: 0, admin: 0, notifs: 0, contact: 0, total: 0 });

  // 👇 NOUVEAU STATE POUR LE MODAL UNSplash
  const [modalPhotoOuvert, setModalPhotoOuvert] = useState(false);

  useEffect(() => {
    const chargerNonLus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const r = await fetch(`${API_BASE}/messagerie/gestionnaire/non-lus-total`, {
          credentials: 'include', headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) setNonLus(await r.json());
      } catch {}
    };
    chargerNonLus();
    const interval = setInterval(chargerNonLus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [footerText, setFooterText] = useState(`© Copyright ${new Date().getFullYear()} e-Vend Studio, Tous droits réservés`);
  // States pour le bouton reset config (doivent être au niveau root pour survivre aux re-renders)
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone,    setResetDone]    = useState(false);
  const [nomPlateforme, setNomPlateforme] = useState('e-Vend');
  const [banniereVendeurActive, setBanniereVendeurActive] = useState(false);
  const [hauteurBandeauEssai, setHauteurBandeauEssai] = useState(0);
  const [banniereVendeurMessage, setBanniereVendeurMessage] = useState('');
  const [banniereVendeurCouleurBg, setBanniereVendeurCouleurBg] = useState('#1e3a5f');
  const [banniereVendeurCouleurTx, setBanniereVendeurCouleurTx] = useState('#ffffff');
  const [banniereVendeurHauteur, setBanniereVendeurHauteur] = useState('36');
  const [banniereVendeurPolice, setBanniereVendeurPolice] = useState('13');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<number | null>(null);
  const [fonctionnalitesPlan, setFonctionnalitesPlan] = useState<Record<string, boolean> | null>(null);
  const [fonctsMaster, setFonctsMaster] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success' || params.get('stripe') === 'refresh') {
      setPageActive('config-generale');
      setMenuOuvert('config');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuMobileOuvert(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const aller = () => setPageActive('mes-services');
    window.addEventListener('naviguer-mes-services', aller);
    return () => window.removeEventListener('naviguer-mes-services', aller);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/admin/configuration/config-publique`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.footer_text) setFooterText(data.footer_text);
        if (data?.nom_plateforme) setNomPlateforme(data.nom_plateforme);
        if (data?.banniere_vendeur_active !== undefined) setBanniereVendeurActive(data.banniere_vendeur_active);
        if (data?.banniere_vendeur_message) setBanniereVendeurMessage(data.banniere_vendeur_message);
        if (data?.banniere_vendeur_couleur_bg) setBanniereVendeurCouleurBg(data.banniere_vendeur_couleur_bg);
        if (data?.banniere_vendeur_couleur_tx) setBanniereVendeurCouleurTx(data.banniere_vendeur_couleur_tx);
        if (data?.banniere_vendeur_hauteur) setBanniereVendeurHauteur(data.banniere_vendeur_hauteur);
        if (data?.banniere_vendeur_police) setBanniereVendeurPolice(data.banniere_vendeur_police);
      })
      .catch(() => {});
  }, []);

  const [gestionnaire, setGestionnaire] = useState<GestionnaireUser>(() => {
    if (gestionnaireUser) return gestionnaireUser;
    try {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { id: 0, email: '', nom: 'Gestionnaire', nom_boutique: null, role: 'gestionnaire' };
  });

  // ── Bannière courriel non vérifié ────────────────────────────────────────
  const HAUTEUR_BANNIERE_EMAIL = 48;
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [renvoiMessage, setRenvoiMessage] = useState<string | null>(null);
  const [renvoiCooldown, setRenvoiCooldown] = useState(0);

  // Rafraîchit l'état email_verifie depuis le serveur (au montage + au retour sur l'onglet),
  // pour que la bannière disparaisse même si la vérification a eu lieu dans un autre onglet.
  const rafraichirStatutEmail = () => {
    if (!gestionnaire?.id) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/moi`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.email_verifie === 'boolean') {
          setGestionnaire(prev => ({ ...prev, email_verifie: data.email_verifie }));
        }
      })
      .catch(() => {});
  };
  useEffect(() => {
    rafraichirStatutEmail();
    const onFocus = () => rafraichirStatutEmail();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [gestionnaire?.id]);

  useEffect(() => {
    if (renvoiCooldown <= 0) return;
    const t = setTimeout(() => setRenvoiCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [renvoiCooldown]);

  const renvoyerVerificationEmail = async () => {
    if (renvoiEnCours || renvoiCooldown > 0) return;
    setRenvoiEnCours(true);
    setRenvoiMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaire.id}/renvoyer-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRenvoiMessage('✅ Courriel envoyé ! Vérifiez votre boîte de réception.');
        setRenvoiCooldown(60);
      } else {
        setRenvoiMessage(data.error || 'Erreur lors de l\'envoi.');
      }
    } catch {
      setRenvoiMessage('Erreur de connexion.');
    }
    setRenvoiEnCours(false);
  };

  // Options add-ons du gestionnaire (cacher_propulse, verificateur_age, etc.)
  const [options, setOptions] = useState<Record<string, any>>({});
  const rechargerOptions = () => {
    if (!gestionnaire?.id) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/${gestionnaire.id}/options`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
    }).then(r => r.ok ? r.json() : {}).then(data => { if (data) setOptions(data); }).catch(() => {});
  };
  useEffect(() => { rechargerOptions(); }, [gestionnaire?.id]);

  useEffect(() => {
    if (gestionnaireUser) setGestionnaire(gestionnaireUser);
  }, [gestionnaireUser]);

  // ── Charger le template_id du site Studio (une seule fois) ──────────────
  const [templateCharge, setTemplateCharge] = useState(false);
  useEffect(() => {
    if (!gestionnaire?.id || templateCharge) return;
    setTemplateCharge(true);
    fetch(`${API_BASE}/studio/sites/${gestionnaire.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.template_id && !templateIdChoisi) {
          setGestionnaire(prev => ({ ...prev, site_template_id: data.template_id }));
        }
      })
      .catch(() => {});
  }, [gestionnaire?.id]);

  useEffect(() => {
    if (!gestionnaire?.id) return;
    const chargerFonctionnalites = async () => {
      try {
        const res = await fetch(`${API_BASE}/fonctionnalites/vendeur/${gestionnaire.id}/resolues`, {
          credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          const res2 = await fetch(`${API_BASE}/plans/vendeur/${gestionnaire.id}/plan-actif`, {
            credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` }
          });
          if (!res2.ok) return;
          const data2 = await res2.json();
          if (data2?.limites?.fonctionnalites) setFonctionnalitesPlan(data2.limites.fonctionnalites);
          return;
        }
        const data = await res.json();
        if (data?.fonctionnalites) setFonctionnalitesPlan(data.fonctionnalites);
      } catch (e) {
        console.error('Erreur chargement fonctionnalités plan:', e);
      }
    };
    chargerFonctionnalites();
  }, [gestionnaire?.id, gestionnaire?.plan]);

  useEffect(() => {
    const chargerMaster = async () => {
      try {
        const res = await fetch(`${API_BASE}/fonctionnalites`);
        if (!res.ok) return;
        const liste: Array<{ cle: string; actif: boolean }> = await res.json();
        const map: Record<string, boolean> = {};
        liste.forEach(f => { if (f.actif) map[f.cle] = true; });
        setFonctsMaster(map);
      } catch (e) {
        console.warn('⚠️ fonctionnalites_master non chargé:', e);
      }
    };
    chargerMaster();
    const interval = setInterval(chargerMaster, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const aAcces = (cle: string): boolean => {
    if (isAdminImpersonation) return true;
    if (Object.keys(fonctsMaster).length > 0 && !fonctsMaster[cle]) return false;
    if (fonctionnalitesPlan === null) return true;
    return fonctionnalitesPlan[cle] === true;
  };

  const ouvrirModal = useCallback(() => setModalOuvert(true), []);
  const fermerModal = useCallback(() => setModalOuvert(false), []);
  const envoyerMessage = useCallback(() => { setMessage(''); fermerModal(); }, [fermerModal]);

  // 👇 FONCTION POUR SÉLECTIONNER UNE PHOTO UNSplash
  const handleSelectPhoto = (photo) => {
    const url = photo.urls.regular;
    console.log('📷 Photo sélectionnée:', url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('✅ URL de la photo copiée !');
      }).catch(() => {});
    }
    setModalPhotoOuvert(false);
  };

  const initialeAvatar = gestionnaire.nom?.charAt(0)?.toUpperCase() || 'V';

  const ouvrirBoutiqueNouvelOnglet = async () => {
    try {
      const res = await fetch(`/api/studio/sites/${gestionnaire.id}`);
      const data = res.ok ? await res.json() : null;
      if (data?.domaine_perso && data?.domaine_statut !== 'suspendu') {
        window.open(`https://${data.domaine_perso}`, '_blank', 'noopener,noreferrer');
      } else if (data?.sous_domaine) {
        window.open(`https://${data.sous_domaine}.e-vendstudio.ca`, '_blank', 'noopener,noreferrer');
      } else {
        window.open(`/site-preview?vendeurId=${gestionnaire.id}`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(`/site-preview?vendeurId=${gestionnaire.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMenuClick = (menuId: string) => setMenuOuvert(menuOuvert === menuId ? null : menuId);

  // ── Item page 404 — commun à tous les menus CONFIGURATION ───────────────
  const itemPage404: SousMenuItem = { id: 'studio-page-404', label: 'Page 404', icon: '🔍' };
  const itemPolitiques: SousMenuItem = { id: 'studio-mes-politiques', label: 'Mes politiques', icon: '📜' };
  const itemPages: SousMenuItem      = { id: 'studio-mes-pages',      label: 'Mes pages',             icon: '📄' };
  const itemSeo: SousMenuItem        = { id: 'studio-seo-site',        label: 'Référencement SEO',     icon: '🔍' };
  const itemCookies: SousMenuItem    = { id: 'studio-cookies-site',    label: 'Gestion des cookies',   icon: '🍪' };
  const itemVerificateurAge = { id:'config-verificateur-age', label:'Vérificateur d\'âge 🔞', icon:'🔞' };
  const itemPopupAnnonce    = { id:'config-popup-annonce',    label:'Popup Annonce 📢',          icon:'📢' };
  const itemPhotos: SousMenuItem     = { id: 'studio-photos-vendeur',   label: 'Mes photos de site',    icon: '🖼️' };
  const itemFormulaireContact = { id: 'config-formulaire-contact', label: 'Formulaire de contact', icon: '📋' };
  const itemConfigGenerale: SousMenuItem = { id: 'config-generale',     label: 'Config générale',    icon: '⚙️' };
  const itemConfigMV: SousMenuItem       = { id: 'config-multivendeur', label: 'Config multivendeur', icon: '🏪' };
  const itemConfigPaiements: SousMenuItem = { id: 'config-paiements',   label: 'Config paiement',     icon: '💳' };

  // ── Groupe du template actif ──────────────────────────────────────────────
  const templateActif = templateIdChoisi || gestionnaire.site_template_id || '';
  const estVitrine       = templateActif.startsWith('vitrine-') || templateActif === 'vitrine';
  const estReservation   = templateActif.startsWith('reservation-');
  const estCagnotte      = templateActif.startsWith('cagnotte-');
  const estBoutiqueSimple   = templateActif === 'boutique-simple';
  const estBoutiqueComplete = templateActif === 'boutique-complete';
  const estBoutique      = estBoutiqueSimple || estBoutiqueComplete;
  const estEnchere       = ['enchere-flash', 'enchere-galerie', 'enchere-live'].includes(templateActif);
  const estVitrinePro    = ['vitrine-pro-entrepreneur', 'vitrine-pro-tech', 'vitrine-pro-beaute', 'vitrine-pro-mariage', 'vitrine-pro-sante', 'vitrine-paysager', 'vitrine-avocat', 'vitrine-resto', 'vitrine-bistro', 'cours-piano', 'cours-langues', 'cours-web', 'cours-cuisine', 'cours-yoga', 'cours-equitation','cours-peinture','cours-danse','vitrine-foodtruck','vitrine-boulangerie','cours-coach'].includes(templateActif);
  const estSalon         = templateActif === 'salon-coiffure';
  const estSimplisse     = templateActif.startsWith('boutique-simplisse') && !templateActif.startsWith('boutique-simplisse-mode');
  const estPremium       = templateActif.startsWith('boutique-premium');
  const estSimplisseMode = templateActif.startsWith('boutique-simplisse-mode');
  const estBeaute        = templateActif.startsWith('boutique-beaute');
  const estMultiVendeur  = templateActif.startsWith('multi-vendeur-premium');
  const aucunTemplate    = !templateActif;

  // ── Menus Studio (communs à tous) ────────────────────────────────────────
  const menuStudio: MenuItem = {
    id: 'studio', label: 'MON SITE STUDIO', icon: '🎨',
    sousMenu: [
      { id: 'studio-apercu',            label: 'Aperçu de mon site',          icon: '👁',  onClick: () => window.open(`/site-preview?vendeurId=${gestionnaire.id}`, '_blank', 'noopener,noreferrer') },
      { id: 'studio-choisir-template',  label: 'Choisir un template',         icon: '🗂️' },
      { id: 'studio-config-template',   label: 'Modifier mon site',           icon: '✏️' },
      { id: 'studio-domaine',           label: 'Mon domaine',                 icon: '🌐' },
      { id: 'studio-import-evend',      label: 'Importer mes annonces e-Vend',icon: '📦' },
    ]
  };

  // ── Mes réservations école (add-on réservation_ecole, sans sous-menu) ──────
  const menuMesReservations: MenuItem = {
    id: 'mes-reservations', label: 'MES RÉSERVATIONS ÉCOLES', icon: '📅',
  };

  // ── Mes abonnements clients (add-on abonnement_ecole, sans sous-menu) ──────
  const menuMesAbonnements: MenuItem = {
    id: 'abonnements-clients', label: 'ABONNEMENTS CLIENTS', icon: '💳',
  };

  // ── Mes sponsors (add-on pub_sponsor, sans sous-menu) ──────────────────────
  const menuMesSponsors: MenuItem = {
    id: 'mes-sponsors', label: 'MES SPONSORS', icon: '⭐',
  };

  const menuMesAnalytique: MenuItem = {
    id: 'mes-analytique', label: 'ANALYTIQUE', icon: '📈',
  };

  const menuMesChatbot: MenuItem = {
    id: 'mes-chatbot', label: 'CHAT BOT', icon: '💬',
  };

  // ── Mes collaborateurs (commun à tous) ─────────────────────────────────────
  const menuSousVendeurs: MenuItem = {
    id: 'collaborateurs', label: 'MES COLLABORATEURS', icon: '🏪',
    sousMenu: [
      { id: 'collaborateurs-liste',  label: 'Liste des collaborateurs', icon: '👥' },
      { id: 'collaborateurs-blogs',  label: 'Blog collaborateurs',      icon: '📝' },
    ]
  };

  // ── Badges (commun à tous) ────────────────────────────────────────────────
  const menuBadges: MenuItem = {
    id: 'badges', label: 'BADGES', icon: '🏅',
    sousMenu: [
      { id: 'badges-gestion',   label: 'Gérer les badges',  icon: '🏅' },
      { id: 'badges-attribues', label: 'Badges attribués',  icon: '🎖️' },
    ]
  };

  // ── Blog collaborateurs ────────────────────────────────────────────────────
  const menuBlogsSV: MenuItem = {
    id: 'blogs-collaborateurs', label: 'BLOGS COLLABORATEURS', icon: '📝',
  };

  const menuFaqsSV: MenuItem = {
    id: 'faqs-collaborateurs', label: 'FAQ COLLABORATEURS', icon: '❓',
  };

  const menuChatSV: MenuItem = {
    id: 'chat-acheteur-sv', label: 'CHAT ACHETEUR-COLLAB', icon: '💬',
  };

  // ── Profil (commun à tous) ────────────────────────────────────────────────
  const menuProfil: MenuItem = {
    id: 'profil', label: 'PROFIL', icon: '👤',
    sousMenu: [
      { id: 'profil-compte',        label: 'Mon compte',        icon: '👤' },
      { id: 'profil-paiement',      label: 'Détails de paiement', icon: '💳' },
      { id: 'profil-forfait',       label: 'Mon forfait',       icon: '📊' },
      { id: 'mes-services',          label: 'Mes services',      icon: '💼' },
      { id: 'profil-rapport',       label: 'Rapport financier', icon: '📈' },
      { id: 'profil-factures',      label: 'Factures',          icon: '🧾' },
    ]
  };

  // ── Messagerie (commun à tous) ────────────────────────────────────────────
  const menuMessagerie: MenuItem = {
    id: 'messagerie', label: 'MESSAGERIE', icon: '✉️',
    badge: nonLus.total > 0 ? nonLus.total : undefined,
    cleAcces: 'messagerie',
    sousMenu: [
      { id: 'messagerie-admin',         label: 'Message administration', icon: '🛡️', badge: nonLus.admin > 0 ? nonLus.admin : undefined },
      { id: 'messagerie-notifications', label: 'Notifications e-Vend',  icon: '🔔', badge: nonLus.notifs > 0 ? nonLus.notifs : undefined },
      { id: 'messagerie-contact',       label: 'Messages via formulaire contact', icon: '📋', badge: nonLus.contact > 0 ? nonLus.contact : undefined },
    ]
  };

  // ── Add-ons (commun à tous) ───────────────────────────────────────────────
  const menuAddOn: MenuItem = {
    id: 'addon', label: 'ADD-ONS', icon: '🧩',
  };

  // 🟢 Branding & options — visible sur tous les templates SAUF multivendeur
  // (le multivendeur aura son propre système d'add-ons séparé plus tard)
  const menuBrandingOptions: MenuItem = {
    id: 'branding-options', label: 'Branding & options', icon: '⚙️',
  };

  const menuStudioSimplisse: MenuItem = { id:'studio',label:'MON SITE STUDIO',icon:'🎨',sousMenu:[{ id:'studio-apercu',label:'Aperçu de mon site',icon:'👁',onClick:()=>window.open(`/site-preview?vendeurId=${gestionnaire.id}`,'_blank','noopener,noreferrer') },{ id:'studio-choisir-template',label:'Choisir un template',icon:'🗂️' },{ id:'studio-domaine',label:'Mon domaine',icon:'🌐' }] };
  const menuVosAnnoncesSimplisse: MenuItem = { id:'annonces',label:'VOS ANNONCES',icon:'📦',sousMenu:[{ id:'annonces-liste',label:'Liste des produits',icon:'📋' },{ id:'annonces-encheres',label:'Mes enchères',icon:'🔨',cleAcces:'modeEncheres' },{ id:'annonces-make-offer',label:'Mes offres reçues',icon:'💬' },{ id:'annonces-tags',label:'Tags produits',icon:'🏷️' },{ id:'annonces-types',label:'Types produits',icon:'📑' },{ id:'annonces-categories',label:'Collections',icon:'🗂️',cleAcces:'collections' },{ id:'annonces-promos',label:'Réductions & codes',icon:'🏷️',cleAcces:'codesPromo' },{ id:'annonces-creer',label:'Ajouter un produit',icon:'➕' }] };
  const menuConfigMesPages: MenuItem = { id:'config-mes-pages',label:'CONFIG MES PAGES',icon:'🎨',sousMenu:[{ id:'simplisse-config-pages',label:'Configurer mes pages',icon:'✏️' },{ id:'simplisse-plan',label:'Mon plan & limites',icon:'📊' },{ id:'simplisse-branding',label:'Branding & options',icon:'⚙️' }] };

  const menuStudioPremium: MenuItem = { id:'studio',label:'MON SITE STUDIO',icon:'🎨',sousMenu:[{ id:'studio-apercu',label:'Aperçu de mon site',icon:'👁',onClick:()=>window.open(`/site-preview?vendeurId=${gestionnaire.id}`,'_blank','noopener,noreferrer') },{ id:'studio-choisir-template',label:'Choisir un template',icon:'🗂️' },{ id:'studio-domaine',label:'Mon domaine',icon:'🌐' }] };
  const menuVosAnnoncesPremium: MenuItem = { id:'annonces',label:'VOS ANNONCES',icon:'📦',sousMenu:[{ id:'annonces-liste',label:'Liste des produits',icon:'📋' },{ id:'annonces-encheres',label:'Mes enchères',icon:'🔨',cleAcces:'modeEncheres' },{ id:'annonces-make-offer',label:'Mes offres reçues',icon:'💬' },{ id:'annonces-tags',label:'Tags produits',icon:'🏷️' },{ id:'annonces-types',label:'Types produits',icon:'📑' },{ id:'annonces-categories',label:'Collections',icon:'🗂️',cleAcces:'collections' },{ id:'annonces-promos',label:'Réductions & codes',icon:'🏷️',cleAcces:'codesPromo' },{ id:'annonces-creer',label:'Ajouter un produit',icon:'➕' }] };
  const menuConfigPremium: MenuItem = { id:'config-premium',label:'CONFIG MES PAGES',icon:'💎',sousMenu:[{ id:'premium-config-pages',label:'Configurer mes pages',icon:'✏️' },{ id:'premium-plan',label:'Mon plan & limites',icon:'📊' },{ id:'premium-branding',label:'Branding & options',icon:'⚙️' }] };

  const menuStudioMode: MenuItem = { id:'studio',label:'MON SITE STUDIO',icon:'🎨',sousMenu:[{ id:'studio-apercu',label:'Aperçu de mon site',icon:'👁',onClick:()=>window.open(`/site-preview?vendeurId=${gestionnaire.id}`,'_blank','noopener,noreferrer') },{ id:'studio-choisir-template',label:'Choisir un template',icon:'🗂️' },{ id:'studio-domaine',label:'Mon domaine',icon:'🌐' }] };
  const menuVosAnnoncesMode: MenuItem = { id:'annonces',label:'VOS ANNONCES',icon:'👗',sousMenu:[{ id:'annonces-liste',label:'Liste des produits',icon:'📋' },{ id:'annonces-tags',label:'Tags produits',icon:'🏷️' },{ id:'annonces-categories',label:'Collections',icon:'🗂️',cleAcces:'collections' },{ id:'annonces-promos',label:'Réductions & codes',icon:'🏷️',cleAcces:'codesPromo' },{ id:'annonces-creer',label:'Ajouter un produit',icon:'➕' }] };
  const menuConfigMode: MenuItem = { id:'config-mode',label:'CONFIG MES PAGES',icon:'👗',sousMenu:[{ id:'mode-config-pages',label:'Configurer mes pages',icon:'✏️' },{ id:'mode-plan',label:'Mon plan & limites',icon:'📊' },{ id:'mode-branding',label:'Branding & options',icon:'⚙️' }] };

  const menuStudioBeaute: MenuItem = { id:'studio',label:'MON SITE STUDIO',icon:'🎨',sousMenu:[{ id:'studio-apercu',label:'Aperçu de mon site',icon:'👁',onClick:()=>window.open(`/site-preview?vendeurId=${gestionnaire.id}`,'_blank','noopener,noreferrer') },{ id:'studio-choisir-template',label:'Choisir un template',icon:'🗂️' },{ id:'studio-domaine',label:'Mon domaine',icon:'🌐' }] };
  const menuVosAnnoncesBeaute: MenuItem = { id:'annonces',label:'VOS PRODUITS',icon:'💄',sousMenu:[{ id:'annonces-liste',label:'Liste des produits',icon:'📋' },{ id:'annonces-categories',label:'Collections',icon:'🗂️',cleAcces:'collections' },{ id:'annonces-promos',label:'Réductions & codes',icon:'🏷️',cleAcces:'codesPromo' },{ id:'annonces-creer',label:'Ajouter un produit',icon:'➕' }] };
  const menuConfigBeaute: MenuItem = { id:'config-beaute',label:'CONFIG MES PAGES',icon:'💄',sousMenu:[{ id:'beaute-config-pages',label:'Configurer mes pages',icon:'✏️' },{ id:'beaute-plan',label:'Mon plan & limites',icon:'📊' },{ id:'beaute-branding',label:'Branding & options',icon:'⚙️' }] };
  const menuStudioMV: MenuItem     = { id:'studio',label:'MON SITE STUDIO',icon:'🎨',sousMenu:[{ id:'studio-apercu',label:'Aperçu de mon site',icon:'👁',onClick:()=>window.open(`/site-preview?vendeurId=${gestionnaire.id}`,'_blank','noopener,noreferrer') },{ id:'studio-choisir-template',label:'Choisir un template',icon:'🗂️' },{ id:'studio-domaine',label:'Mon domaine',icon:'🌐' }] };
  const menuConfigMV: MenuItem     = { id:'config-mv',label:'MULTI-VENDEUR',icon:'🏪',sousMenu:[{ id:'mv-premium-config-pages',label:'Configurer mes pages',icon:'✏️' },{ id:'mv-premium-plan',label:'Mon plan & limites',icon:'📊' },{ id:'mv-premium-branding',label:'Branding & options',icon:'⚙️' }] };
  const menuVendeurs: MenuItem     = { id:'vendeurs',label:'MES VENDEURS',icon:'👥',sousMenu:[{ id:'vendeurs-liste',label:'Liste des vendeurs',icon:'👥' },{ id:'vendeurs-demandes',label:'Demandes en attente',icon:'📥' },{ id:'vendeurs-paiements',label:'Paiements vendeurs',icon:'💰' }] };


  // ── Construction du menu selon le template ────────────────────────────────
  let menuItems: MenuItem[];

  if (aucunTemplate) {
    // Pas encore de template → menu minimal, forcer le choix
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estVitrine) {
    // Vitrine : pas de transactions — juste l'outil de config du site
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estReservation) {
    // Réservation : réservations + disponibilités au centre
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'commandes', label: 'RÉSERVATIONS', icon: '📅',
        sousMenu: [
          { id: 'commandes-reservations', label: 'Gestion des réservations', icon: '📅' },
          { id: 'commandes-liste',        label: 'Liste des commandes',      icon: '📋' },
          { id: 'commandes-paiements',    label: 'Paiements',                icon: '💰' },
          { id: 'commandes-documents',    label: 'Documents',                icon: '📄' },
        ]
      },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estCagnotte) {
    // Cagnotte : juste les dons reçus
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'commandes', label: 'MA CAGNOTTE', icon: '💝',
        sousMenu: [
          { id: 'commandes-cagnotte',  label: 'Ma Cagnotte',          icon: '💝' },
          { id: 'commandes-paiements', label: 'Paiements reçus',      icon: '💰' },
          { id: 'commandes-documents', label: 'Documents',            icon: '📄' },
        ]
      },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estVitrinePro) {
    // Vitrine Pro Premium — menu réduit comme vitrine
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      ...(options?.reservation_ecole ? [menuMesReservations] : []),
      ...(options?.abonnement_ecole ? [menuMesAbonnements] : []),
      ...(options?.pub_sponsor ? [menuMesSponsors] : []),
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      menuAddOn,
    ];
  } else if (estSalon) {
    // Salon de Coiffure — avec réservations en ligne
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'commandes', label: 'RÉSERVATIONS', icon: '📅',
        sousMenu: [
          { id: 'commandes-reservations', label: 'Gestion des réservations', icon: '📅' },
          { id: 'commandes-paiements',    label: 'Paiements reçus',          icon: '💰' },
          { id: 'commandes-documents',    label: 'Documents',                icon: '📄' },
        ]
      },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estEnchere) {
    // Enchères → menu minimaliste : config du site + mes enchères
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'commandes', label: 'MES ENCHÈRES', icon: '🔨',
        sousMenu: [
          { id: 'annonces-encheres', label: 'Mes enchères actives', icon: '🔨' },
          { id: 'commandes-paiements', label: 'Paiements reçus',   icon: '💰' },
          { id: 'commandes-documents', label: 'Documents',         icon: '📄' },
        ]
      },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',    icon: '📧' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else if (estSimplisse) {
    menuItems = [{ id:'dashboard',label:'TABLEAU DE BORD',icon:'📊' },menuVosAnnoncesSimplisse,{ id:'commandes',label:'VOS COMMANDES',icon:'🛒',sousMenu:[{ id:'commandes-liste',label:'Liste des commandes',icon:'📋' },{ id:'commandes-paiements',label:'Paiements & commissions',icon:'💰' },{ id:'commandes-retours',label:'Retour & remboursement',icon:'🔄' },{ id:'commandes-documents',label:'Documents gestionnaire',icon:'📄' }] },{ id:'acheteurs',label:'MES ACHETEURS',icon:'👥',sousMenu:[{ id:'acheteurs-liste',label:'Liste des acheteurs',icon:'👥' }] },menuStudioSimplisse,menuConfigMesPages,{ id:'config',label:'CONFIGURATION',icon:'⚙️',sousMenu:[itemConfigGenerale,itemConfigMV,itemConfigPaiements,{ id:'config-expedition',label:"Méthode d'expédition",icon:'🚚' },{ id:'config-modeles-courriel',label:'Modèles de courriel',icon:'📧' },itemPage404,itemPolitiques,itemPages,itemSeo,itemCookies,itemPhotos, itemFormulaireContact,...(options?.verificateur_age ? [itemVerificateurAge] : []),...(options?.popup_annonce ? [itemPopupAnnonce] : [])] },menuProfil,menuMessagerie,...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),menuAddOn];

  } else if (estPremium) {
    menuItems = [{ id:'dashboard',label:'TABLEAU DE BORD',icon:'📊' },menuVosAnnoncesPremium,{ id:'commandes',label:'VOS COMMANDES',icon:'🛒',sousMenu:[{ id:'commandes-liste',label:'Liste des commandes',icon:'📋' },{ id:'commandes-paiements',label:'Paiements & commissions',icon:'💰' },{ id:'commandes-retours',label:'Retour & remboursement',icon:'🔄' },{ id:'commandes-documents',label:'Documents gestionnaire',icon:'📄' }] },{ id:'acheteurs',label:'MES ACHETEURS',icon:'👥',sousMenu:[{ id:'acheteurs-liste',label:'Liste des acheteurs',icon:'👥' }] },menuStudioPremium,menuConfigPremium,{ id:'config',label:'CONFIGURATION',icon:'⚙️',sousMenu:[itemConfigGenerale,itemConfigMV,itemConfigPaiements,{ id:'config-expedition',label:"Méthode d'expédition",icon:'🚚' },{ id:'config-modeles-courriel',label:'Modèles de courriel',icon:'📧' },itemPage404,itemPolitiques,itemPages,itemSeo,itemCookies,itemPhotos, itemFormulaireContact,...(options?.verificateur_age ? [itemVerificateurAge] : []),...(options?.popup_annonce ? [itemPopupAnnonce] : [])] },menuProfil,menuMessagerie,...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),menuAddOn];

  } else if (estSimplisseMode) {
    menuItems = [{ id:'dashboard',label:'TABLEAU DE BORD',icon:'📊' },menuVosAnnoncesMode,{ id:'commandes',label:'VOS COMMANDES',icon:'🛒',sousMenu:[{ id:'commandes-liste',label:'Liste des commandes',icon:'📋' },{ id:'commandes-paiements',label:'Paiements & commissions',icon:'💰' },{ id:'commandes-retours',label:'Retour & remboursement',icon:'🔄' },{ id:'commandes-documents',label:'Documents gestionnaire',icon:'📄' }] },{ id:'acheteurs',label:'MES ACHETEURS',icon:'👥',sousMenu:[{ id:'acheteurs-liste',label:'Liste des acheteurs',icon:'👥' }] },menuStudioMode,menuConfigMode,{ id:'config',label:'CONFIGURATION',icon:'⚙️',sousMenu:[itemConfigGenerale,itemConfigMV,itemConfigPaiements,{ id:'config-expedition',label:"Méthode d'expédition",icon:'🚚' },{ id:'config-modeles-courriel',label:'Modèles de courriel',icon:'📧' },itemPage404,itemPolitiques,itemPages,itemSeo,itemCookies,itemPhotos, itemFormulaireContact,...(options?.verificateur_age ? [itemVerificateurAge] : []),...(options?.popup_annonce ? [itemPopupAnnonce] : [])] },menuProfil,menuMessagerie,...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),menuAddOn];

  } else if (estMultiVendeur) {
    menuItems = [{ id:'dashboard',label:'TABLEAU DE BORD',icon:'📊' },menuVendeurs,menuSousVendeurs,menuBadges,menuBlogsSV,menuFaqsSV,menuChatSV,{ id:'annonces',label:'VOS ANNONCES',icon:'📦',sousMenu:[{ id:'annonces-liste',label:'Liste des produits',icon:'📦' },{ id:'annonces-creer',label:'Créer une annonce',icon:'➕' }] },{ id:'commandes',label:'VOS COMMANDES',icon:'🛒',sousMenu:[{ id:'commandes-liste',label:'Liste des commandes',icon:'📋' },{ id:'commandes-paiements',label:'Paiements & commissions',icon:'💰' }] },menuStudioMV,menuConfigMV,{ id:'config',label:'CONFIGURATION',icon:'⚙️',sousMenu:[itemConfigGenerale,itemConfigPaiements,{ id:'config-expedition',label:"Méthode d'expédition",icon:'🚚' },itemPage404,itemPolitiques,itemSeo,itemCookies,itemPhotos,...(options?.verificateur_age ? [itemVerificateurAge] : []),...(options?.popup_annonce ? [itemPopupAnnonce] : [])] },menuProfil,menuMessagerie];

  } else if (estBeaute) {
    menuItems = [{ id:'dashboard',label:'TABLEAU DE BORD',icon:'📊' },menuVosAnnoncesBeaute,{ id:'commandes',label:'VOS COMMANDES',icon:'🛒',sousMenu:[{ id:'commandes-liste',label:'Liste des commandes',icon:'📋' },{ id:'commandes-paiements',label:'Paiements & commissions',icon:'💰' },{ id:'commandes-retours',label:'Retour & remboursement',icon:'🔄' },{ id:'commandes-documents',label:'Documents gestionnaire',icon:'📄' }] },{ id:'acheteurs',label:'MES ACHETEURS',icon:'👥',sousMenu:[{ id:'acheteurs-liste',label:'Liste des acheteurs',icon:'👥' }] },menuStudioBeaute,menuConfigBeaute,{ id:'config',label:'CONFIGURATION',icon:'⚙️',sousMenu:[itemConfigGenerale,itemConfigMV,itemConfigPaiements,{ id:'config-expedition',label:"Méthode d'expédition",icon:'🚚' },{ id:'config-modeles-courriel',label:'Modèles de courriel',icon:'📧' },itemPage404,itemPolitiques,itemPages,itemSeo,itemCookies,itemPhotos, itemFormulaireContact,...(options?.verificateur_age ? [itemVerificateurAge] : []),...(options?.popup_annonce ? [itemPopupAnnonce] : [])] },menuProfil,menuMessagerie,...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),menuAddOn];

  } else if (estBoutiqueSimple) {
    // Boutique Simple (mono-produit) : commandes + config basique
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'commandes', label: 'VOS COMMANDES', icon: '📦',
        sousMenu: [
          { id: 'commandes-liste',    label: 'Liste des commandes',      icon: '📋' },
          { id: 'commandes-paiements',label: 'Paiements & commissions',  icon: '💰' },
          { id: 'commandes-retours',  label: 'Retour & remboursement',   icon: '🔄' },
          { id: 'commandes-documents',label: 'Documents gestionnaire',       icon: '📄' },
        ]
      },
      {
        id: 'acheteurs', label: 'MES ACHETEURS', icon: '👥',
        sousMenu: [
          { id: 'acheteurs-liste', label: 'Liste des acheteurs', icon: '👥' },
        ]
      },
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-expedition',       label: "Méthode d'expédition",    icon: '🚚' },
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',     icon: '📧' },
          { id: 'config-facture',          label: 'Modèle de facture',       icon: '🧾' },
          itemPage404,
          itemPolitiques,
          itemPages,
          itemSeo,
          itemCookies,
          itemPhotos, itemFormulaireContact, ...(options?.verificateur_age ? [itemVerificateurAge] : []), ...(options?.popup_annonce ? [itemPopupAnnonce] : []),
        ]
      },
      menuProfil,
      menuMessagerie,
      menuBrandingOptions,
      ...(options?.analytique ? [menuMesAnalytique] : []),...(options?.chatbot ? [menuMesChatbot] : []),
      menuAddOn,
    ];
  } else {
    // boutique-complete + défaut → menu COMPLET e-Vend
    menuItems = [
      { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
      {
        id: 'annonces', label: 'VOS ANNONCES', icon: '📦',
        sousMenu: [
          { id: 'annonces-liste',      label: 'Liste des produits',    icon: '📋' },
          { id: 'annonces-encheres',   label: 'Mes enchères',          icon: '🔨', cleAcces: 'modeEncheres' },
          { id: 'annonces-make-offer', label: 'Mes offres reçues',     icon: '💬' },
          { id: 'annonces-tags',       label: 'Tags produits',         icon: '🏷️' },
          { id: 'annonces-types',      label: 'Types produits',        icon: '📑' },
          { id: 'annonces-categories', label: 'Collections',           icon: '🗂️', cleAcces: 'collections' },
          { id: 'annonces-promos',     label: 'Réductions & codes',    icon: '🏷️', cleAcces: 'codesPromo' },
        ]
      },
      {
        id: 'commandes', label: 'VOS COMMANDES', icon: '📦',
        sousMenu: [
          { id: 'commandes-liste',        label: 'Liste des commandes',      icon: '📋' },
          { id: 'commandes-cagnotte',     label: 'Ma Cagnotte',              icon: '💝' },
          { id: 'commandes-paiements',    label: 'Paiements & commissions',  icon: '💰' },
          { id: 'commandes-retours',      label: 'Retour & remboursement',   icon: '🔄' },
          { id: 'commandes-brouillon',    label: 'Commande brouillon',       icon: '📝', cleAcces: 'commandesBrouillon' },
          { id: 'commandes-documents',    label: 'Documents gestionnaire',       icon: '📄' },
          { id: 'commandes-reservations', label: 'Gestion des réservations', icon: '📅' },
        ]
      },
      {
        id: 'acheteurs', label: 'MES ACHETEURS', icon: '👥',
        sousMenu: [
          { id: 'acheteurs-liste', label: 'Liste des acheteurs', icon: '👥' },
        ]
      },
      {
        id: 'config', label: 'CONFIGURATION', icon: '⚙️',
        sousMenu: [
          itemConfigGenerale,
          itemConfigMV,
          itemConfigPaiements,
          { id: 'config-expedition',       label: "Méthode d'expédition",    icon: '🚚' },
          { id: 'config-modeles-courriel', label: 'Modèles de courriel',     icon: '📧' },
          { id: 'config-facture',          label: 'Modèle de facture',       icon: '🧾' },
        ]
      },
      {
        id: 'profil', label: 'PROFIL', icon: '👤',
        sousMenu: [
          { id: 'profil-compte',        label: 'Mon compte',          icon: '👤' },
          { id: 'ma-boutique',          label: 'Ma boutique',         icon: '🏪', onClick: ouvrirBoutiqueNouvelOnglet },
          { id: 'profil-paiement',      label: 'Détails de paiement', icon: '💳' },
          { id: 'profil-avis',          label: 'Mes avis',            icon: '⭐' },
          { id: 'profil-avis-produits', label: 'Mes avis produits',   icon: '📝' },
          { id: 'profil-blogs',         label: 'Mes Blogs',           icon: '📝', cleAcces: 'blog' },
          { id: 'profil-faq',           label: 'Ma FAQ',              icon: '❓', cleAcces: 'faq' },
          { id: 'profil-badges',        label: 'Mes badges',          icon: '🏅' },
          { id: 'profil-forfait',       label: 'Mon forfait',         icon: '📊' },
          { id: 'mes-services',          label: 'Mes services',        icon: '💼' },
          { id: 'profil-rapport',       label: 'Rapport financier',   icon: '📈' },
          { id: 'profil-factures',      label: 'Factures',            icon: '🧾' },
        ]
      },
      {
        id: 'guides', label: 'GUIDES', icon: '📚',
        sousMenu: [
          { id: 'guides-baisse-prix',  label: 'Alerte de baisse de prix',       icon: '🔔', href: 'https://e-vend.ca/documents/alerte-de-baisse-de-prix' },
          { id: 'guides-faq',          label: 'FAQ',                             icon: '❓', href: 'https://e-vend.ca/documents/faq-vendeur' },
          { id: 'guides-expedition',   label: "Frais et méthodes d'expédition", icon: '📦', href: 'https://e-vend.ca/documents/frais-expedition' },
          { id: 'guides-commandes',    label: 'Gestion des commandes',          icon: '🛒', href: 'https://e-vend.ca/documents/gestion-des-commandes' },
          { id: 'guides-vendeur',      label: 'Guide du gestionnaire',               icon: '📘', href: 'https://e-vend.ca/documents/tableau-bord-vendeur' },
          { id: 'guides-plans',        label: 'Les plans gestionnaires (Forfaits)',   icon: '💎', href: 'https://e-vend.ca/documents/les-vendeurs-e-vend' },
          { id: 'guides-score',        label: 'Score de confiance',             icon: '⭐', href: 'https://e-vend.ca/documents/guide-systeme-scores-confiances' },
          { id: 'guides-stripe',       label: 'Guide Stripe Connect',           icon: '💳', href: 'https://e-vend.ca/documents/introduction-compte-stripe' },
        ]
      },
      menuMessagerie,
      menuBrandingOptions,
      menuAddOn,
      menuSousVendeurs,
      menuBadges,
      menuBlogsSV,
      menuFaqsSV,
      menuChatSV,
      menuStudio,
      { id: 'creer', label: 'CRÉER UNE ANNONCE', icon: '➕' },
    ];
  }

  const menuStyle: React.CSSProperties = {
    width: isMobile ? (menuMobileOuvert ? '280px' : '0px') : '280px',
    background: '#111111',
    backgroundImage: 'linear-gradient(180deg, #111111 0%, #1a1a1a 100%)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    color: '#fff',
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
    zIndex: 1000,
    transition: 'width 0.3s ease',
    overflowX: 'hidden'
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    marginLeft: isMobile ? '0px' : '280px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    overflow: 'hidden',
    transition: 'margin-left 0.3s ease'
  };

  const topBarFixedStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isMobile ? '0px' : '280px',
    right: 0,
    zIndex: 900,
    height: '56px',
    transition: 'left 0.3s ease'
  };

  const footerFixedStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: isMobile ? '0px' : '280px',
    right: 0,
    height: '40px',
    backgroundColor: '#2c3e50',
    borderTop: '1px solid #34495e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '10px' : '12px',
    color: '#ecf0f1',
    zIndex: 900,
    transition: 'left 0.3s ease'
  };

  const handleResetConfig = async () => {
    setResetLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaire.id}/reset`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setResetDone(true);
      setResetConfirm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      alert('Erreur lors de la réinitialisation.');
    }
    setResetLoading(false);
  };

  const renderPage = () => {
    if (pageActive === 'creer') return <CreerAnnonce onRetour={() => setPageActive('annonces-liste')} />;
    if (pageActive.startsWith('creer-annonce?dupliquer=')) {
      const dupliquerDeId = pageActive.replace('creer-annonce?dupliquer=', '');
      return <CreerAnnonce dupliquerDeId={dupliquerDeId} onRetour={() => setPageActive('annonces-liste')} gestionnaireId={gestionnaire.id} />;
    }
    if (pageActive.startsWith('modifier-annonce?id=')) {
      const produitId = pageActive.replace('modifier-annonce?id=', '');
      return <CreerAnnonce produitId={produitId} gestionnaireId={gestionnaire.id} onRetour={() => setPageActive('annonces-liste')} />;
    }
    if (pageActive.startsWith('modifier-annonce-')) {
      const produitId = pageActive.replace('modifier-annonce-', '');
      return <CreerAnnonce produitId={produitId} gestionnaireId={gestionnaire.id} onRetour={() => setPageActive('annonces-liste')} />;
    }
    if (pageActive === 'profil-compte')         return <StudioMonCompte           gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'commandes-liste') return <ListeCommandes naviguerVers={(page: string) => setPageActive(page)} gestionnaireId={gestionnaire.id} onVoirCommande={(id: number) => { setCommandeSelectionnee(id); setPageActive('commande-detail'); }} />;
    if (pageActive === 'commande-detail') {
      if (!commandeSelectionnee) { setPageActive('commandes-liste'); return null; }
      return <DetailCommande commandeId={commandeSelectionnee} retourListe={() => setPageActive('commandes-liste')} />;
    }
    if (pageActive === 'commandes-paiements') return <PaiementsCommandes />;
    if (pageActive === 'commandes-retours') return <RetourRemboursements />;
    if (pageActive === 'commandes-brouillon') return <CommandesBrouillons />;
    if (pageActive === 'commandes-documents') return <DocumentsVendeur />;
    if (pageActive === 'config-generale') return <StudioConfigGenerale gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-expedition') return <MethodesExpedition gestionnaireId={gestionnaire.id} onRetour={() => setPageActive('dashboard')} />;
    if (pageActive === 'config-modeles-courriel') return <ModelesCourrielStudio vendeurId={gestionnaire.id} />;
    if (pageActive === 'commandes-reservations') return <GestionReservations vendeurId={gestionnaire.id} />;
    if (pageActive === 'mes-reservations') return <MesReservationsEcole gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'abonnements-clients') return <MesAbonnementsEcole gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mes-sponsors') return <MesSponsorsGestionnaire gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mes-analytique') return <AnalytiqueGestionnaire gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mes-chatbot') return <ChatbotConfig gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-paiements') return <ConfigurationPaiements gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'commandes-cagnotte') return <MaCagnotte vendeurId={gestionnaire.id} />;
    if (pageActive === 'acheteurs-liste') return <MesAcheteurs vendeurId={gestionnaire.id} />;
    if (pageActive === 'collaborateurs-liste') return <StudioSousVendeurs    gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'collaborateurs-blogs')      return <StudioBlogSousVendeur gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'blogs-collaborateurs')      return <StudioBlogSousVendeur gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'faqs-collaborateurs')       return <StudioFaqSousVendeur  gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'chat-acheteur-sv')         return <SurveillanceChats     gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'badges-gestion')      return <StudioGestionBadges   gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'badges-attribues')    return <StudioBadgesAttribues gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'addon')               return <AddOn />;
    if (pageActive === 'branding-options')     return <BrandingEtOptions gestionnaireId={gestionnaire.id} onOptionsUpdated={rechargerOptions} />;
    if (pageActive === 'annonces-liste') return <ListeProduits naviguerVers={setPageActive} gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'annonces-encheres') return <MesEncheres />;
    if (pageActive === 'annonces-make-offer') return <MesOffres />;
    if (pageActive === 'annonces-categories') return <Categories />;
    if (pageActive === 'annonces-promos') return <ReductionsRabais />;
    if (pageActive === 'annonces-tags') return <TagsProduits />;
    if (pageActive === 'annonces-types') return <TypesProduits />;
    if (pageActive === 'messagerie-gestionnaire') return <MessagerieAdministration />;
    if (pageActive === 'messagerie-admin') return <MessagerieAdministration />;
    if (pageActive === 'messagerie-notifications') return <MessagerieNotifications />;
    if (pageActive === 'messagerie-contact') return <MessagerieFormulaireContact gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'profil-forfait') return <MonForfait />;
    if (pageActive === 'mes-services')   return <MesServices gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'plans-membership') return <PlansMembership naviguerVers={setPageActive} />;
    if (pageActive === 'profil-rapport') return <RapportVendeur nomVendeur={gestionnaire.nom_boutique || gestionnaire.nom} />;
    if (pageActive === 'profil-avis') return <MesAvis />;
    if (pageActive === 'profil-avis-produits') return <AvisProduits />;
    if (pageActive === 'profil-blogs') return <MesBlogs />;
    if (pageActive === 'profil-faq') return <MaFaq />;
    if (pageActive === 'profil-badges') return <MesBadges />;
    if (pageActive === 'profil-factures') return <FacturesVendeur naviguerVers={setPageActive} />;
    if (pageActive === 'connecter-boutique') return <ConnecterBoutique onRetour={() => setPageActive('dashboard')} vendorId={gestionnaire.id.toString()} />;
    // import-ebay supprimé — pas disponible dans Studio

    // ── Routes e-Vend Studio ──
    if (pageActive === 'studio-choisir-template') return (
      <PageChoisirTemplate gestionnaireId={gestionnaire.id} onChoisir={(templateId) => {
        const token = localStorage.getItem('token');
        fetch(`/api/studio/sites/${gestionnaire.id}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ template_id: templateId }),
        })
        .then(r => { if (!r.ok) console.error('Erreur sauvegarde template'); else console.log('Template sauvegardé:', templateId); })
        .catch(err => console.error('Erreur fetch template:', err));
        setTemplateIdChoisi(templateId);
        setGestionnaire(prev => ({ ...prev, site_template_id: templateId }));
        // boutique-complete → dashboard (config via menus existants)
        // tous les autres → configurateur dédié
        if (templateId === 'boutique-complete') {
          // boutique-complete → dashboard directement (menus existants)
          setPageActive('dashboard');
        } else if (templateId.startsWith('boutique-simplisse-mode')) {
          setPageActive('mode-config-pages');
        } else if (templateId.startsWith('boutique-simplisse')) {
          setPageActive('simplisse-config-pages');
        } else if (templateId.startsWith('boutique-premium')) {
          setPageActive('premium-config-pages');
        } else if (templateId.startsWith('boutique-beaute')) {
          setPageActive('beaute-config-pages');
        } else if (templateId.startsWith('multi-vendeur-premium')) {
          setPageActive('mv-premium-plan');
        } else if (['enchere-flash', 'enchere-galerie', 'enchere-live'].includes(templateId)) {
          // enchères → config template (+ aperçu)
          setPageActive('studio-config-template');
        } else {
          setPageActive('studio-config-template');
        }
      }} />
    );
    if (pageActive === 'studio-config-template') {
      // Pas de template choisi — rediriger vers le choix plutot que d'ouvrir vitrine par defaut
      if (aucunTemplate) {
        return (
          <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>Aucun template selectionne</h2>
            <p style={{ fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>
              Vous devez d'abord choisir un template avant de pouvoir modifier votre site.
            </p>
            <button
              onClick={() => setPageActive('studio-choisir-template')}
              style={{ background: 'linear-gradient(135deg,#c9a96e,#a07840)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,169,110,0.35)' }}>
              Choisir un template →
            </button>
          </div>
        );
      }
      const templateId = templateIdChoisi || gestionnaire.site_template_id || 'vitrine';
      console.log('DEBUG templateIdChoisi:', templateIdChoisi, '| site_template_id:', gestionnaire.site_template_id);
      return (
        <ConfigTemplate
          vendeurId={gestionnaire.id}
          templateId={templateId}
          resetConfirm={resetConfirm}
          resetLoading={resetLoading}
          resetDone={resetDone}
          setResetConfirm={setResetConfirm}
          onResetConfig={handleResetConfig}
        />
      );
    }
        if (pageActive === 'studio-domaine') return <MonDomaine gestionnaireId={gestionnaire.id} emailVerifie={gestionnaire.email_verifie !== false} />;
    if (pageActive === 'studio-import-evend') return <ImportEvend gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'simplisse-config-pages') return <ConfigMesPagesSimplisse    gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'simplisse-plan')         return <SimplissePlan              gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'simplisse-branding')     return <BrandingEtOptions          gestionnaireId={gestionnaire.id} onOptionsUpdated={rechargerOptions} />;
    if (pageActive === 'premium-config-pages')   return <ConfigMesPagesPremium      gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'premium-plan')           return <PremiumPlan                gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'premium-branding')       return <BrandingEtOptions          gestionnaireId={gestionnaire.id} onOptionsUpdated={rechargerOptions} />;
    if (pageActive === 'mode-config-pages')      return <ConfigMesPagesSimplisseMode gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mode-plan')              return <SimplissePlan              gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mode-branding')          return <BrandingEtOptions          gestionnaireId={gestionnaire.id} onOptionsUpdated={rechargerOptions} />;
    if (pageActive === 'beaute-config-pages')    return <ConfigMesPagesBeaute       gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'beaute-plan')            return <BeautePlan                 gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mv-premium-config-pages') return <ConfigMultiVendeurPremium  gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mv-premium-plan')        return <MVPremiumPlan              gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'mv-premium-branding')    return <AddOn />;
    if (pageActive === 'beaute-branding')        return <BrandingEtOptions          gestionnaireId={gestionnaire.id} onOptionsUpdated={rechargerOptions} />;
    if (pageActive === 'annonces-creer')         return <CreerAnnonce onRetour={() => setPageActive('annonces-liste')} gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-apercu') return null; // géré par onClick (nouvel onglet)
    if (pageActive === 'studio-page-404') return <StudioConfigPage404 gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-mes-politiques') return <StudioMesPolitiques gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-mes-pages')      return <StudioMesPages      gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-seo-site')       return <StudioSeoSite       gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-cookies-site')   return <StudioCookiesSite   gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-verificateur-age') return <ConfigVerificateurAge gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-popup-annonce') return <ConfigPopupAnnonce gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-formulaire-contact') return <ConfigFormulaireContact gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'studio-photos-vendeur') return <StudioGestionPhotosVendeur gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-generale')       return <StudioConfigGenerale      gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'config-multivendeur')   return <StudioConfigMultivendeur  gestionnaireId={gestionnaire.id} />;
    if (pageActive === 'profil-compte')         return <StudioMonCompte           gestionnaireId={gestionnaire.id} />;

    // ── Premier login : aucun template choisi → forcer le choix ────────────
    if (aucunTemplate && pageActive === 'dashboard') {
      return (
        <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎨</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>Bienvenue sur e-Vend Studio!</h1>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
            Pour commencer, choisissez le type de site qui correspond à votre activité.<br/>
            Votre dashboard sera adapté selon votre choix.
          </p>
          <button
            onClick={() => setPageActive('studio-choisir-template')}
            style={{ background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 48px', fontSize: 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 28px rgba(201,169,110,0.4)' }}>
            Choisir mon template →
          </button>
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 16 }}>Vous pourrez changer de template en tout temps depuis le menu <strong>MON SITE STUDIO</strong>.</p>
        </div>
      );
    }

    return <Dashboard vendeur={gestionnaire} />;
  };

  const topBarContent = (
    <div style={{
      backgroundColor: '#0f0f0f',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: isMobile ? '12px' : '24px',
      paddingRight: isMobile ? '12px' : '24px',
      gap: isMobile ? '8px' : '12px',
      width: '100%',
      borderBottom: '1px solid rgba(201,169,110,0.2)',
    }}>
      {isMobile && <button onClick={() => setMenuMobileOuvert(!menuMobileOuvert)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: '8px' }}>☰</button>}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', marginLeft: 'auto' }}>
        {/* 👇 BOUTON PHOTOS */}
        <button 
          onClick={() => setModalPhotoOuvert(true)}
          style={{
            background: 'linear-gradient(135deg, #c9a96e, #a07840)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 16px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(201,169,110,0.3)'
          }}
        >
          <span>📷</span> Photos
        </button>
        {/* Notif messages */}
        <button onClick={() => setPageActive('messagerie')} title="Vos messages"
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center' }}>
          🔔
          {nonLus.total > 0 && (
            <span style={{ position: 'absolute', top: -6, left: 12, background: '#E74C3C', borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1a1a', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 2px' }}>
              {nonLus.total > 99 ? '99+' : nonLus.total}
            </span>
          )}
        </button>
        {/* Voir ma boutique */}
        <button onClick={ouvrirBoutiqueNouvelOnglet} title="Voir mon site"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>
          👁️
        </button>
        {!isMobile && (
          <button onClick={() => window.open('/', '_self')} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', flexShrink: 0 }}>
            🏠 Retour à la plateforme
          </button>
        )}
      </div>
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <SessionIndicator statut={gestionnaire.statut} />
        </div>
      )}
      {isMobile && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SessionIndicator statut={gestionnaire.statut} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        html, body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        
        .menu-item { 
          transition: all .2s ease; 
          border-radius: 8px; 
          margin: 2px 10px;
          color: rgba(255,255,255,0.9);
        }
        .menu-item:hover { 
          background: rgba(59,130,246,0.3); 
        }
        .menu-item.active { 
          background: linear-gradient(135deg, #2563eb, #1e40af);
          box-shadow: 0 4px 10px rgba(37,99,235,0.3);
        }
        .menu-item.active .menu-label { 
          color:#fff; 
          font-weight:700; 
        }
        .sous-menu-item { 
          transition: all .2s ease; 
          border-radius: 6px; 
          color: rgba(255,255,255,0.8);
        }
        .sous-menu-item:hover { 
          background: rgba(59,130,246,0.2); 
        }
        .sous-menu-item.active { 
          background: rgba(37,99,235,0.4); 
          border-left: 3px solid #60a5fa; 
        }
        .menu-header {
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          border-radius: 8px;
          margin: 2px 10px;
          transition: all .2s ease;
        }
        .menu-header:hover {
          background: rgba(59,130,246,0.3);
        }
        .menu-header.open {
          background: rgba(37,99,235,0.2);
          border-left: 3px solid #3b82f6;
        }
        
        .app-container {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          overflow: hidden;
        }
        
        .scrollable-area {
          flex: 1;
          overflow-y: auto;
          height: calc(100vh - 40px);
          color: #333;
          padding-bottom: 40px;
        }
        
        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
      `}</style>

      <div className="app-container">
        <div style={menuStyle}>
          <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: isMobile ? '28px' : '32px' }}>🛍️</span>
              {(!isMobile || menuMobileOuvert) && (
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: '#fff' }}>
                  {nomPlateforme.includes('-') ? <>{nomPlateforme.slice(0, nomPlateforme.indexOf('-'))}<span style={{ color: '#60a5fa' }}>-</span>{nomPlateforme.slice(nomPlateforme.indexOf('-') + 1)}</> : nomPlateforme}
                </span>
              )}
            </div>
            {(!isMobile || menuMobileOuvert) && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Espace gestionnaire</p>}
          </div>

          <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {menuItems.map((item) => (
              <div key={item.id}>
                {!item.sousMenu ? (
                  <div
                    className={`menu-item ${pageActive === item.id ? 'active' : ''}`}
                    onClick={() => {
                      if (item.cleAcces && !aAcces(item.cleAcces)) { setPageActive('profil-forfait'); if (isMobile) setMenuMobileOuvert(false); return; }
                      setPageActive(item.id); setMenuOuvert(null); if (isMobile) setMenuMobileOuvert(false);
                    }}
                    style={{ padding: isMobile ? '10px 12px' : '12px 16px', cursor: item.cleAcces && !aAcces(item.cleAcces) ? 'not-allowed' : 'pointer', opacity: item.cleAcces && !aAcces(item.cleAcces) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '14px' }}
                  >
                    <span style={{ fontSize: isMobile ? '20px' : '22px', width: '28px' }}>{item.icon}</span>
                    {(!isMobile || menuMobileOuvert) && (
                      <>
                        <span className="menu-label" style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{item.label}</span>
                        {item.cleAcces && !aAcces(item.cleAcces) ? <span style={{ marginLeft: 'auto', fontSize: '13px' }}>🔒</span> : item.badge ? <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px' }}>{item.badge}</span> : null}
                      </>
                    )}
                  </div>
                ) : (
                  (!isMobile || menuMobileOuvert) && (
                    <>
                      <div
                        className={`menu-header ${menuOuvert === item.id ? 'open' : ''}`}
                        onClick={() => {
                          if (item.cleAcces && !aAcces(item.cleAcces)) { setPageActive('profil-forfait'); if (isMobile) setMenuMobileOuvert(false); return; }
                          handleMenuClick(item.id);
                        }}
                        style={{ 
                          padding: isMobile ? '10px 12px' : '12px 16px',
                          cursor: item.cleAcces && !aAcces(item.cleAcces) ? 'not-allowed' : 'pointer',
                          opacity: item.cleAcces && !aAcces(item.cleAcces) ? 0.5 : 1,
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '14px',
                          backgroundColor: menuOuvert === item.id ? 'rgba(201,169,110,0.15)' : 'transparent',
                          borderLeft: menuOuvert === item.id ? '3px solid #c9a96e' : '3px solid transparent'
                        }}
                      >
                        <span style={{ fontSize: isMobile ? '20px' : '22px', width: '28px' }}>{item.icon}</span>
                        <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {item.cleAcces && !aAcces(item.cleAcces) ? '🔒' : menuOuvert === item.id ? '▼' : '▶'}
                        </span>
                      </div>
                      {menuOuvert === item.id && (
                        <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                          {item.sousMenu.map((sousItem) => {
                            const estBloque = sousItem.cleAcces ? !aAcces(sousItem.cleAcces) : false;
                            const styleCommun: React.CSSProperties = { 
                              padding: isMobile ? '8px 10px' : '8px 12px', 
                              marginLeft: isMobile ? '32px' : '46px', 
                              marginRight: '10px', 
                              marginBottom: '2px', 
                              cursor: estBloque ? 'not-allowed' : 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              position: 'relative',
                              opacity: estBloque ? 0.5 : 1,
                              backgroundColor: pageActive === sousItem.id ? 'rgba(201,169,110,0.2)' : 'transparent',
                              borderRadius: '6px',
                              textDecoration: 'none',
                            };
                            const contenuSousItem = (
                              <>
                                <span style={{ fontSize: isMobile ? '16px' : '18px', width: '24px', flexShrink: 0 }}>{sousItem.icon}</span>
                                <span style={{ fontSize: isMobile ? '12px' : '14px', color: pageActive === sousItem.id ? '#fff' : 'rgba(255,255,255,0.9)', lineHeight: '1.3' }}>{sousItem.label}</span>
                                {estBloque ? <span style={{ marginLeft: 'auto', fontSize: '13px' }} title="Non inclus dans votre plan">🔒</span> : sousItem.href ? <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>↗</span> : sousItem.badge ? <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px' }}>{sousItem.badge}</span> : null}
                              </>
                            );
                            return sousItem.href ? (
                              <a key={sousItem.id} href={estBloque ? undefined : sousItem.href} target="_blank" rel="noopener noreferrer" className="sous-menu-item" onClick={() => { if (isMobile) setMenuMobileOuvert(false); }} style={styleCommun}>{contenuSousItem}</a>
                            ) : (
                              <div key={sousItem.id} className={`sous-menu-item ${pageActive === sousItem.id ? 'active' : ''}`} onClick={() => { if (estBloque) { setPageActive('profil-forfait'); if (isMobile) setMenuMobileOuvert(false); return; } if (sousItem.onClick) sousItem.onClick(); else setPageActive(sousItem.id); if (isMobile) setMenuMobileOuvert(false); }} style={styleCommun}>{contenuSousItem}</div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            ))}
          </div>

          {(!isMobile || menuMobileOuvert) && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#c9a96e,#a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid rgba(201,169,110,0.3)' }}>{initialeAvatar}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gestionnaire.nom}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#c9a96e', fontWeight: 600 }}>ID: {gestionnaire?.id}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{gestionnaire.nom_boutique || gestionnaire.nom || 'Gestionnaire'}</p>
                  {templateActif
                    ? <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, background: 'rgba(201,169,110,0.2)', color: '#c9a96e', padding: '2px 8px', borderRadius: 12, letterSpacing: '0.05em' }}>
                        🎨 {templateActif}
                      </span>
                    : <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 12, cursor: 'pointer' }}
                        onClick={() => setPageActive('studio-choisir-template')}>
                        ⚠️ Choisir un template
                      </span>
                  }
                </div>
              </div>
              {onLogout && (
                <button onClick={onLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>🚪 Déconnexion</button>
              )}
            </div>
          )}
        </div>

        {isMobile && menuMobileOuvert && <div className="mobile-overlay" onClick={() => setMenuMobileOuvert(false)} />}

        <div className="main-content" style={mainContentStyle}>
          <div className="top-bar-fixed" style={topBarFixedStyle}>{topBarContent}</div>
          {banniereVendeurActive && banniereVendeurMessage && (
            <div style={{ position: 'fixed', top: '56px', left: isMobile ? '0px' : '280px', right: 0, zIndex: 899, height: `${banniereVendeurHauteur}px`, backgroundColor: banniereVendeurCouleurBg, color: banniereVendeurCouleurTx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${banniereVendeurPolice}px`, fontWeight: '600', padding: '0 16px', textAlign: 'center', transition: 'left 0.3s ease' }}>
              {banniereVendeurMessage}
            </div>
          )}
          {gestionnaire.email_verifie === false && (
            <div style={{
              position: 'fixed',
              top: `${56 + (banniereVendeurActive && banniereVendeurMessage ? Number(banniereVendeurHauteur) : 0)}px`,
              left: isMobile ? '0px' : '280px', right: 0, zIndex: 898,
              minHeight: `${HAUTEUR_BANNIERE_EMAIL}px`,
              backgroundColor: '#dc2626', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
              gap: '10px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', textAlign: 'center',
              transition: 'left 0.3s ease',
            }}>
              <span>🔒 Votre adresse courriel n'est pas vérifiée — vous ne pouvez pas mettre votre site en ligne tant qu'elle ne l'est pas.</span>
              <button
                onClick={renvoyerVerificationEmail}
                disabled={renvoiEnCours || renvoiCooldown > 0}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '6px', color: '#fff', padding: '4px 12px', fontSize: '12px', fontWeight: 700,
                  cursor: (renvoiEnCours || renvoiCooldown > 0) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {renvoiEnCours ? '⏳ Envoi...' : renvoiCooldown > 0 ? `Renvoyer (${renvoiCooldown}s)` : '📧 Renvoyer le courriel'}
              </button>
              {renvoiMessage && <span style={{ fontSize: '12px', fontWeight: 400 }}>{renvoiMessage}</span>}
            </div>
          )}
          <BandeauEssai
            gestionnaireId={gestionnaire.id}
            isMobile={isMobile}
            offsetTop={56 + (banniereVendeurActive && banniereVendeurMessage ? Number(banniereVendeurHauteur) : 0) + (gestionnaire.email_verifie === false ? HAUTEUR_BANNIERE_EMAIL : 0)}
            onHauteur={setHauteurBandeauEssai}
          />
          <div className="scrollable-area" style={{ paddingTop: `${56 + (banniereVendeurActive && banniereVendeurMessage ? Number(banniereVendeurHauteur) : 0) + (gestionnaire.email_verifie === false ? HAUTEUR_BANNIERE_EMAIL : 0) + hauteurBandeauEssai}px`, backgroundColor: pageActive === 'studio-choisir-template' ? '#0d0d12' : undefined }}>
            {renderPage()}
          </div>
          <div className="footer-fixed" style={footerFixedStyle}>{footerText}</div>
        </div>
      </div>

      {/* 👇 MODALE UNSplash */}
      <ModalUnsplash 
        isOpen={modalPhotoOuvert}
        onClose={() => setModalPhotoOuvert(false)}
        onSelectPhoto={handleSelectPhoto}
      />

      {/* Modal messagerie */}
      {modalOuvert && (
        <div onClick={fermerModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Contacter l'administration</h3>
              <button onClick={fermerModal} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Votre message</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Écrivez votre message ici..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={fermerModal} style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={envoyerMessage} style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppGestionnaire;

// ══════════════════════════════════════════════════════════════
// PAGES STUDIO — Placeholders à développer
// ══════════════════════════════════════════════════════════════