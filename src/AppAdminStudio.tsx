// CHEMIN : src/AppAdminStudio.tsx
import React, { useState, useEffect, useRef } from 'react';
import GestionPlans          from './pages/admin/GestionPlans';
import CreerPlan             from './pages/admin/CreerPlan';
import GestionCommandes      from './pages/admin/GestionCommandes';
import GestionDomaines       from './pages/admin/GestionDomaines';
import DetailCommande        from './pages/admin/DetailCommande';
import LitigesRetours        from './pages/admin/LitigesRetours';
import FinancesCommissions   from './pages/admin/FinancesCommissions';
import RapportsFinanciers    from './pages/admin/RapportsFinanciers';
import AbonnementsActifs     from './pages/admin/AbonnementsActifs';
import AbonnementDetail      from './pages/admin/AbonnementDetail';
import ApprobationsEnAttente from './pages/admin/ApprobationsEnAttente';
import ComptesSuspendus      from './pages/admin/ComptesSuspendus';
import PaiementsVendeurs     from './pages/admin/PaiementsVendeurs';
import Notifications         from './pages/admin/Notifications';
import ChatVendeurs          from './pages/admin/ChatVendeurs';
import ChatAcheteurs         from './pages/admin/ChatAcheteurs';
import SurveillanceLitiges   from './pages/admin/SurveillanceLitiges';
import Marketing             from './pages/admin/Marketing';
import ReponseClient         from './pages/admin/ReponseClient';
import JournauxAudits        from './pages/admin/JournauxAudits';
import ConfigurationGenerale from './pages/admin/ConfigurationGenerale';
import ConfigurationEnchere  from './pages/admin/ConfigurationEnchere';
import GestionEncheres       from './pages/admin/GestionEncheres';
import ConfigurationStripe    from './pages/admin/ConfigurationStripe';
import ConfigurationPaypal    from './pages/admin/ConfigurationPaypal';
import ConfigurationWishList  from './pages/admin/ConfigurationWishList';
import ConfigurationParutionFutur from './pages/admin/ConfigurationParutionFutur';
import ConfigurationMakeOffer    from './pages/admin/ConfigurationMakeOffer';
import ModelesCourriel      from './pages/admin/ModelesCourriel';
import ModelesDocument      from './pages/admin/ModelesDocument';
import ListeVendeurs, { Vendeur } from './pages/admin/ListeVendeurs';
import ListeGestionnaires, { Gestionnaire } from './pages/admin/ListeGestionnaires';
import ListeSponsors, { Sponsor } from './pages/admin/ListeSponsors';
import AdminForfaitsPhoto from './pages/admin/AdminForfaitsPhoto';
import AdminForfaitsPub from './pages/admin/AdminForfaitsPub';
import AdminPhotosSponsors from './pages/admin/AdminPhotosSponsors';
import AdminPubsSponsors from './pages/admin/AdminPubsSponsors';
import AdminMonetisationSponsors from './pages/admin/AdminMonetisationSponsors';
import AdminSignalementsSponsors from './pages/admin/AdminSignalementsSponsors';
import ListeProduits         from './pages/admin/ListeProduits';
import GestionTagsEtTypes    from './pages/admin/GestionTagsEtTypes';
import GestionBadges         from './pages/admin/GestionBadges';
import BadgesAttitres        from './pages/admin/BadgesAttitres';
// (import InscriptionVendeur retiré — fonctionnalité "admin crée un compte
// vendeur" abandonnée, tout passe désormais par les formulaires d'inscription officiels)
import GestionCategories    from './pages/admin/GestionCategories';
import ListeAcheteurs        from './pages/admin/ListeAcheteurs';
import GestionSignalements   from './pages/admin/GestionSignalements';
import IntegrationCode from './pages/admin/IntegrationCode';
import AdminAddons from './pages/admin/AdminAddons';
import GuidesAddons from './pages/admin/GuidesAddons';
import ReferencementSEO from './pages/admin/ReferencementSEO';
import AddonsActives from './pages/admin/AddonsActives';
import PageAdminTemplatesPrix from './pages/admin/PageAdminTemplatesPrix';
import StatistiquesSignalements from './pages/admin/StatistiquesSignalements';
import MonForfaitPlateforme from './pages/admin/MonForfaitPlateforme';
import ChampsPersonnalises from './pages/admin/ChampsPersonnalises';
import BlacklistContact from './pages/admin/BlacklistContact';
import ListeAlertesPrix from './pages/admin/ListeAlertesPrix';
import ListeWishlists from './pages/admin/ListeWishlists';
import GestionMenus from './pages/admin/GestionMenus';
import BlogPlateforme from './pages/admin/BlogPlateforme';
import FaqPlateformeAdmin from './pages/admin/FaqPlateformeAdmin';
import GestionCookies from './pages/admin/GestionCookies';
import PolitiquesPlateforme from './pages/admin/PolitiquesPlateforme';
import PagesPlateforme from './pages/admin/PagesPlateforme';
import Photo from './pages/admin/Photo';
import { API_BASE } from './config/api';

// Imports pour les traductions
import { TranslationProvider } from './contexts/TranslationContext';

// ── Thème ─────────────────────────────────────────────────────────────────────
const THEME = {
  sidebar:      '#1a2436',
  sidebarHover: '#243044',
  sidebarActive:'#2d6a9f',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  topbar:       '#ffffff',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
};

interface SousSection { id: string; label: string; icon: string; badge?: number; }
interface NavItem {
  id: string; label: string; icon: string; badge?: number;
  sousSections?: SousSection[];
}

// ── Navigation ─────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  
  {
    id: 'acheteurs', label: 'Acheteurs', icon: '🛒',
    sousSections: [
      { id: 'acheteurs-liste',        label: 'Liste des acheteurs',      icon: '📋' },
      { id: 'acheteurs-suspendus',    label: 'Compte acheteurs suspendus', icon: '🚫' },
    ],
  },

  {
    id: 'gestionnaires', label: 'Gestionnaires', icon: '🧑',
    sousSections: [
      { id: 'gestionnaires-liste', label: 'Liste des gestionnaires', icon: '📋' },
    ],
  },

  {
    id: 'vendeurs', label: 'Vendeurs', icon: '🏪',
    sousSections: [
      { id: 'vendeurs-liste',        label: 'Liste des vendeurs',      icon: '📋' },
      { id: 'vendeurs-approbations', label: 'Approbations en attente', icon: '⏳' },
      { id: 'vendeurs-suspendus',    label: 'Comptes suspendus',       icon: '🚫' },
    ],
  },
  {
    id: 'sponsors', label: 'Sponsors', icon: '⭐',
    sousSections: [
      { id: 'sponsors-liste',       label: 'Liste sponsors',   icon: '📋' },
      { id: 'sponsors-photos',      label: 'Photos sponsors',  icon: '🖼️' },
      { id: 'sponsors-pubs',        label: 'Pub sponsor',      icon: '📢' },
      { id: 'sponsors-signalements', label: 'Signalements',    icon: '🚩' },
      { id: 'sponsors-monetisation', label: 'Monétisation',    icon: '💰' },
      { id: 'sponsors-forfait-photo', label: 'Forfait photo',  icon: '📸' },
      { id: 'sponsors-forfait-pub',  label: 'Forfait pub',     icon: '📣' },
    ],
  },
  {
    id: 'produits', label: 'Produits', icon: '📦',
    sousSections: [
      { id: 'produits-liste',   label: 'Liste des produits',      icon: '📋' },
      { id: 'produits-encheres', label: 'Enchères',               icon: '🔨' },
      { id: 'produits-collections', label: 'Catégories',         icon: '🗂️' },
      { id: 'produits-tags-types', label: 'Tags & Types',         icon: '🏷️' },
    ],
  },
  {
    id: 'commandes', label: 'Commandes', icon: '📦',
    sousSections: [
      { id: 'commandes-toutes',  label: 'Toutes les commandes', icon: '📋' },
      { id: 'commandes-litiges', label: 'Litiges & retours',    icon: '⚠️' },
    ],
  },
  {
    id: 'domaines', label: 'Domaines', icon: '🌐',
    sousSections: [
      { id: 'domaines-gestion', label: 'Gestion domaines', icon: '🛠️' },
    ],
  },
  {
    id: 'forfaits', label: 'Forfaits & Plans', icon: '⭐',
    sousSections: [
      { id: 'forfaits-liste',       label: 'Gérer les plans',    icon: '🗂️' },
      { id: 'forfaits-creer',       label: 'Créer un plan',      icon: '➕' },
      { id: 'forfaits-abonnements', label: 'Abonnements actifs', icon: '✅' },
    ],
  },
  {
    id: 'badges', label: 'Les Badges', icon: '🏅',
    sousSections: [
      { id: 'badges-gerer',     label: 'Gérer les badges',   icon: '📋' },
      { id: 'badges-attitres',  label: 'Les badges attitrés', icon: '🎯' },
    ],
  },
  {
    id: 'finances', label: 'Finances', icon: '💰',
    sousSections: [
      { id: 'finances-commissions', label: 'Commissions',         icon: '💸' },
      { id: 'finances-paiements',   label: 'Paiements vendeurs',  icon: '💳' },
      { id: 'finances-rapports',    label: 'Rapports financiers', icon: '📊' },
    ],
  },
  {
    id: 'wishlist', label: 'Wish list', icon: '❤️',
    sousSections: [
      { id: 'wishlist-listes',     label: 'Liste des wish list', icon: '📋' },
      { id: 'wishlist-alertes',    label: 'Liste alertes prix',  icon: '💰' },
    ],
  },
  {
    id: 'messagerie', label: 'Messagerie', icon: '✉️',
    sousSections: [
      { id: 'messagerie-notifications', label: 'Notifications',        icon: '📢' },
      { id: 'messagerie-vendeurs',      label: 'Chat — Vendeurs',      icon: '🏪' },
      { id: 'messagerie-acheteurs',     label: 'Chat — Acheteurs',     icon: '🛒' },
      { id: 'messagerie-litiges',       label: 'Surveillance Litiges', icon: '⚖️' },
      { id: 'messagerie-email-manuel',  label: 'E-mail manuel',        icon: '✉️' },
      { id: 'messagerie-email-marketing', label: 'E-mail marketing',   icon: '📧' },
    ],
  },
  {
    id: 'signalements', label: 'Signalements', icon: '🚩',
    sousSections: [
      { id: 'signalements-liste',         label: 'Tous les signalements', icon: '📋' },
      { id: 'signalements-en-cours',      label: 'En cours de traitement', icon: '⏳' },
      { id: 'signalements-resolus',       label: 'Résolus / Archivés',     icon: '✅' },
      { id: 'signalements-statistiques',  label: 'Statistiques',           icon: '📊' },
    ],
  },
  {
    id: 'plateforme', label: 'Plateforme', icon: '⚙️',
    sousSections: [
      { id: 'plateforme-champs-personnalises', label: 'Champs personnalisés (Méta)', icon: '🔖' },
      { id: 'plateforme-blacklist-contact', label: 'Liste noire anti-spam', icon: '🚫' },
      { id: 'plateforme-config',      label: 'Configuration générale', icon: '🔧' },
      { id: 'plateforme-parution',    label: 'Configuration date futur', icon: '🗓️' },
      { id: 'plateforme-enchere',     label: 'Configuration enchères',   icon: '🔨' },
      { id: 'plateforme-make-offer',  label: 'Configuration Make Offer', icon: '💬' },
      { id: 'plateforme-stripe',      label: 'Configuration Stripe',     icon: '💳' },
      { id: 'plateforme-paypal',      label: 'Configuration PayPal',     icon: '🅿️' },
      { id: 'plateforme-wishlist',    label: 'Configuration Wish List', icon: '❤️' },
      { id: 'plateforme-emails',      label: 'Modèles de courriels',   icon: '📧' },
      { id: 'plateforme-documents',   label: 'Modèles documents',      icon: '📄' },
      { id: 'plateforme-integration', label: 'Integration de code',    icon: '🔌' },
      { id: 'plateforme-mon-forfait', label: 'Mon forfait plateforme', icon: '⭐' },
    ],
  },
  {
    id: 'addons', label: 'Add-ons', icon: '🧩',
    sousSections: [
      { id: 'addons-gestion',  label: 'Gestion add-ons',  icon: '⚙️' },
      { id: 'addons-guides',   label: 'Guides add-ons',   icon: '📖' },
      { id: 'addons-actives',  label: 'Add-ons activés',  icon: '✅' },
    ],
  },
  {
    id: 'templates', label: 'Templates', icon: '🎨',
    sousSections: [
      { id: 'templates-prix', label: 'Prix Template', icon: '💰' },
    ],
  },
  {
    id: 'parametres', label: 'Paramètres', icon: '🛠️',
    sousSections: [
      { id: 'parametres-menu',          label: 'Menu',                        icon: '📋' },
      { id: 'parametres-pages',         label: 'Pages',                       icon: '📄' },
      { id: 'parametres-photo',         label: 'Photo',                       icon: '🖼️' },
      { id: 'parametres-politique',     label: 'Politique',                   icon: '📜' },
      { id: 'parametres-blog',          label: 'Blog plateforme',             icon: '✏️' },
      { id: 'parametres-faq',           label: 'FAQ plateforme',              icon: '❓' },
      { id: 'parametres-cookies',       label: 'Gestion des cookies',         icon: '🍪' },
      { id: 'parametres-seo',           label: 'Référencement naturel (SEO)', icon: '🔍' },
      { id: 'parametres-config-pages',  label: 'Configuration des pages',    icon: '📄' },
    ],
  },
  { id: 'logs', label: 'Journaux & Audits', icon: '📋' },
];

// ============================================================================
// COMPOSANT INDICATEUR DE SESSION
// ============================================================================
function SessionIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const intervalRef = useRef<any>(null);

  // La session est un cookie httpOnly (illisible en JS) : seul le serveur peut dire si elle est valide.
  // On ne dépend donc plus de la présence d'un jeton dans localStorage.
  const verifierToken = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      setIsConnected(response.ok);
    } catch (error) {
      console.error('Erreur vérification session:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    verifierToken();
    intervalRef.current = window.setInterval(verifierToken, 10000);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') verifierToken();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isConnected === null) {
    return <span style={{ color: '#aaa', fontSize: '11px' }}>⏳ Vérification...</span>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      backgroundColor: isConnected ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
      border: `1px solid ${isConnected ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
    }}>
      <span style={{ fontSize: '12px' }}>{isConnected ? '✅' : '❌'}</span>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600,
        color: isConnected ? '#16a34a' : '#dc2626'
      }}>
        {isConnected ? 'Session connectée' : 'Session déconnectée'}
      </span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ icon, titre, valeur, sousTitre, couleur, tendance }: {
  icon: string; titre: string; valeur: string; sousTitre: string;
  couleur: string; tendance?: { val: string; positif: boolean };
}) {
  return (
    <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: couleur + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
        {tendance && (
          <span style={{ fontSize: '12px', fontWeight: '700', color: tendance.positif ? THEME.success : THEME.danger, backgroundColor: tendance.positif ? '#dcfce7' : '#fee2e2', padding: '3px 8px', borderRadius: '20px' }}>
            {tendance.positif ? '↑' : '↓'} {tendance.val}
          </span>
        )}
      </div>
      <p style={{ fontSize: '28px', fontWeight: '800', color: THEME.text, margin: '0 0 4px 0', lineHeight: 1 }}>{valeur}</p>
      <p style={{ fontSize: '13px', fontWeight: '600', color: THEME.textLight, margin: '0 0 2px 0' }}>{titre}</p>
      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{sousTitre}</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardStats({ naviguerVers, vendeurs }: { naviguerVers: (p: string) => void; vendeurs: Vendeur[] }) {
  const totalVentes      = vendeurs.reduce((s, v) => s + (Number(v.totalVentes) || 0), 0);
  const totalCommissions = vendeurs.reduce((s, v) => s + (Number(v.commission) || 0), 0);
  const vendActifs       = vendeurs.filter(v => v.statut === 'actif').length;
  const enAttente        = vendeurs.filter(v => v.statut === 'en_attente' || v.statut === 'pending').length;
  const activite = [...vendeurs]
    .filter(v => v.dateInscription)
    .sort((a, b) => b.dateInscription.localeCompare(a.dateInscription))
    .slice(0, 5)
    .map(v => {
      const suspendu = v.statut === 'suspendu';
      const actif = v.statut === 'actif';
      return {
        id: v.id,
        date: v.dateInscription,
        texte: `${v.nom} a créé un compte${v.nom_boutique ? ` (${v.nom_boutique})` : ''} — ${actif ? 'actif' : suspendu ? 'suspendu' : "en attente d'approbation"}`,
        couleur: actif ? THEME.success : suspendu ? THEME.danger : THEME.warning,
        icon: actif ? '✅' : suspendu ? '🚨' : '⏳',
      };
    });

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tableau de bord</h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Vue d'ensemble de la plateforme e-Vend Studio</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KPICard icon="💰" titre="Revenus totaux"           valeur={`${totalVentes.toFixed(0)} $`}      sousTitre="Toutes boutiques" couleur={THEME.success} />
        <KPICard icon="🏦" titre="Commissions perçues"      valeur={`${totalCommissions.toFixed(0)} $`} sousTitre="Cumul"            couleur={THEME.accent} />
        <KPICard icon="🏪" titre="Vendeurs actifs"          valeur={String(vendActifs)}                  sousTitre={`${vendeurs.length} au total`} couleur={THEME.warning} />
        <KPICard icon="⏳" titre="En attente d'approbation" valeur={String(enAttente)}                   sousTitre="Nouveaux vendeurs" couleur={THEME.danger} tendance={enAttente > 0 ? { val: `${enAttente} nouveau${enAttente > 1 ? 'x' : ''}`, positif: false } : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Vendeurs récents */}
        <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.accent}`, backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏪 Vendeurs récents</h3>
            <button onClick={() => naviguerVers('vendeurs-liste')} style={{ fontSize: '12px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Voir tous →</button>
          </div>
          {vendeurs.length === 0 && <p style={{ padding: '16px 20px', margin: 0, fontSize: '12px', color: '#aaa' }}>Aucun vendeur pour le moment.</p>}
          {vendeurs.slice(0, 5).map((v, i) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < 4 ? `1px solid #f5f5f5` : 'none', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: THEME.accent }}>{v.nom.charAt(0)}</div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{v.nom}</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{v.nom_boutique} · {v.plan}</p>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: v.statut === 'actif' ? '#dcfce7' : v.statut === 'suspendu' ? '#fee2e2' : '#fef9c3', color: v.statut === 'actif' ? THEME.success : v.statut === 'suspendu' ? THEME.danger : THEME.warning }}>
                {v.statut === 'actif' ? '✓ Actif' : v.statut === 'suspendu' ? '✗ Suspendu' : '⏳ En attente'}
              </span>
            </div>
          ))}
        </div>

        {/* Répartition par plan */}
        <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.accent}`, backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Répartition par forfait</h3>
            <button onClick={() => naviguerVers('forfaits-abonnements')} style={{ fontSize: '12px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Détails →</button>
          </div>
          <div style={{ padding: '20px' }}>
            {[
              { plan: '👑 Plan Fondateur', count: vendeurs.filter(v => v.plan === 'Plan Fondateur').length, couleur: '#6d4fc2' },
              { plan: '🚀 Plan Extrême',   count: vendeurs.filter(v => v.plan === 'Plan Extrême').length,   couleur: '#537373' },
              { plan: '🥇 Plan Or',        count: vendeurs.filter(v => v.plan === 'Plan Or').length,        couleur: '#c9961a' },
              { plan: '🥈 Plan Argent',    count: vendeurs.filter(v => v.plan === 'Plan Argent').length,    couleur: '#7a8fa6' },
              { plan: '🥉 Plan Bronze',    count: vendeurs.filter(v => v.plan === 'Plan Bronze').length,    couleur: '#a07850' },
            ].map((item, i) => {
              const pourcentage = vendeurs.length > 0 ? (item.count / vendeurs.length) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: THEME.text }}>{item.plan}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight }}>{item.count} vendeur{item.count > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: item.couleur, height: '100%', width: `${Math.max(pourcentage, item.count > 0 ? 6 : 0)}%`, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dernières inscriptions (données réelles) */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.accent}`, backgroundColor: '#f8fafc' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🕐 Dernières inscriptions</h3>
        </div>
        {activite.length === 0 && (
          <p style={{ padding: '16px 20px', margin: 0, fontSize: '12px', color: '#aaa' }}>Aucune inscription pour le moment.</p>
        )}
        {activite.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 20px', borderBottom: i < activite.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.icon}</span>
            <span style={{ fontSize: '11px', color: '#aaa', minWidth: '74px', fontWeight: '600' }}>{a.date}</span>
            <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: a.couleur, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: THEME.text }}>{a.texte}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Placeholder ───────────────────────────────────────────────────────────────
function PageEnConstruction({ titre }: { titre: string }) {
  return (
    <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.3 }}>🔧</div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: THEME.text, margin: '0 0 8px 0', textTransform: 'uppercase' }}>{titre}</h2>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Cette section est en cours de développement.</p>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
function AppAdmin({ onLogout, onImpersonate, onImpersonateAcheteur, onImpersonateGestionnaire }: { onLogout?: () => void; onImpersonate?: (vendeur: any) => void; onImpersonateAcheteur?: (acheteur: any) => void; onImpersonateGestionnaire?: (gestionnaire: any, token: string) => void }) {
  return (
    <TranslationProvider>
      <AppAdminContent onLogout={onLogout} onImpersonate={onImpersonate} onImpersonateAcheteur={onImpersonateAcheteur} onImpersonateGestionnaire={onImpersonateGestionnaire} />
    </TranslationProvider>
  );
}

// ── Contenu principal de l'admin ───────────────────────────────────────────
function AppAdminContent({ onLogout, onImpersonate, onImpersonateAcheteur, onImpersonateGestionnaire }: { onLogout?: () => void; onImpersonate?: (vendeur: any) => void; onImpersonateAcheteur?: (acheteur: any) => void; onImpersonateGestionnaire?: (gestionnaire: any, token: string) => void }) {
  const [pageActive, setPageActive] = useState('dashboard');
  const [sectionOuverte, setSectionOuverte] = useState<string | null>(null);
  const [heureActuelle, setHeureActuelle] = useState(new Date());
  const [vendeurImpersonne, setVendeurImpersonne] = useState<Vendeur | null>(null);
  const [vendeurAImpersonner, setVendeurAImpersonner] = useState<Vendeur | null>(null);
  const [modalImpersonateOuvert, setModalImpersonateOuvert] = useState(false);
  const [gestionnaireImpersonne, setGestionnaireImpersonne] = useState<Gestionnaire | null>(null);
  const [gestionnaireAImpersonner, setGestionnaireAImpersonner] = useState<{ gestionnaire: Gestionnaire; token: string } | null>(null);
  const [modalImpersonateGestionnaireOuvert, setModalImpersonateGestionnaireOuvert] = useState(false);
  const [sponsorAImpersonner, setSponsorAImpersonner] = useState<{ sponsor: Sponsor; token: string } | null>(null);
  const [modalImpersonateSponsorOuvert, setModalImpersonateSponsorOuvert] = useState(false);
  const [planAEditer, setPlanAEditer] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  
  // États pour les données de la base de données
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [nbSignalementsNouveaux, setNbSignalementsNouveaux] = useState(0);
  const [nbSignalementsPubNouveaux, setNbSignalementsPubNouveaux] = useState(0);
  const [footerText, setFooterText] = useState(`© Copyright ${new Date().getFullYear()} e-Vend Studio Administration — Accès restreint`);
  const [nomPlateforme, setNomPlateforme] = useState('e-Vend');

  // Charger les vendeurs depuis l'API
  useEffect(() => {
    fetch(`${API_BASE}/admin/configuration/config-publique`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.footer_text) setFooterText(data.footer_text + ' — Accès restreint');
        if (data?.nom_plateforme) setNomPlateforme(data.nom_plateforme);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/gestionnaires`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data: any[]) => {
        const transformedData: Vendeur[] = data.map((v) => ({
          id: v.id,
          sellerId: v.seller_id || `VEN-${String(v.id).padStart(6, '0')}`,
          nom: v.nom,
          email: v.email,
          nom_boutique: v.nom_boutique || v.boutique || '',
          plan: v.plan,
          statut: v.statut,
          dateInscription: v.date_inscription ? v.date_inscription.split('T')[0] : '',
          totalVentes: parseFloat(v.total_ventes) || 0,
          commission: parseFloat(v.commission) || 0,
          produits: v.produits || 0,
          notes: [],
          nbSignalements: v.nb_signalements || 0,
          nbCommandes: 0,
          gravite: (v.gravite as 'faible' | 'moyenne' | 'grave') || 'faible',
          twoFactorEnabled: v.two_factor_enabled ?? false,
        }));
        setVendeurs(transformedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur chargement vendeurs:', err);
        setLoading(false);
        // Pas de fausses données en cas d'échec : liste vide, plus honnête qu'une fausse liste convaincante.
        setVendeurs([]);
      });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeureActuelle(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Badge signalements
  useEffect(() => {
    const fetchCount = () => {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE}/signalements/count`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setNbSignalementsNouveaux(data.nouveaux || 0); })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge signalements de pubs sponsors (système séparé, propre à Studio)
  useEffect(() => {
    const fetchCountPub = () => {
      const token = localStorage.getItem('token');
      fetch(`/api/sponsors/admin/signalements/compte`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setNbSignalementsPubNouveaux(data.nouveaux || 0); })
        .catch(() => {});
    };
    fetchCountPub();
    const interval = setInterval(fetchCountPub, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Cercles rouges : uniquement de vrais compteurs ────────────────────────
  // (la Messagerie n'en a pas encore : il faudra une route serveur qui compte les messages non lus)
  const nbEnAttente = vendeurs.filter(v => v.statut === 'en_attente' || v.statut === 'pending').length;
  const badgeSection = (id: string): number => {
    if (id === 'vendeurs') return nbEnAttente + nbSignalementsNouveaux;
    if (id === 'signalements') return nbSignalementsNouveaux;
    return 0;
  };
  const badgeSousSection = (id: string): number => {
    if (id === 'vendeurs-liste') return nbSignalementsNouveaux;
    if (id === 'vendeurs-approbations') return nbEnAttente;
    if (id === 'sponsors-signalements') return nbSignalementsPubNouveaux;
    if (id === 'signalements-liste') return nbSignalementsNouveaux;
    return 0;
  };

  const toggleSection = (id: string) => {
    setSectionOuverte(prev => prev === id ? null : id);
  };

  const naviguerVers = (page: string, data?: any) => {
    if (page === 'forfaits-creer') setPlanAEditer(data ?? null);
    setPageData(data ?? null);
    setPageActive(page);
  };

  // ── Routeur complet ──────────────────────────────────────────────────────
  const renderPage = () => {
    if (loading && pageActive === 'dashboard') {
      return (
        <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: THEME.textLight }}>Chargement des données...</p>
          </div>
        </div>
      );
    }

    switch (pageActive) {
      case 'dashboard':
        return <DashboardStats naviguerVers={naviguerVers} vendeurs={vendeurs} />;

      case 'acheteurs':
      case 'acheteurs-liste':
        return <ListeAcheteurs onNaviguerVers={naviguerVers} onImpersonate={onImpersonateAcheteur} />;
      case 'acheteurs-suspendus':
        return <PageEnConstruction titre="Acheteurs suspendus" />;

      case 'gestionnaires':
      case 'gestionnaires-liste':
        return <ListeGestionnaires
                 onImpersonate={(gestionnaire, token) => { setGestionnaireAImpersonner({ gestionnaire, token }); setModalImpersonateGestionnaireOuvert(true); }}
                 onNaviguerVers={naviguerVers}
               />;

      case 'sponsors':
      case 'sponsors-liste':
        return <ListeSponsors
                 onImpersonate={(sponsor, token) => { setSponsorAImpersonner({ sponsor, token }); setModalImpersonateSponsorOuvert(true); }}
                 onNaviguerVers={naviguerVers}
               />;
      case 'sponsors-photos':
        return <AdminPhotosSponsors />;
      case 'sponsors-pubs':
        return <AdminPubsSponsors />;
      case 'sponsors-signalements':
        return <AdminSignalementsSponsors />;
      case 'sponsors-monetisation':
        return <AdminMonetisationSponsors />;
      case 'sponsors-forfait-photo':
        return <AdminForfaitsPhoto />;
      case 'sponsors-forfait-pub':
        return <AdminForfaitsPub />;

      case 'vendeurs':
      case 'vendeurs-liste':
        return <ListeVendeurs 
                 onImpersonate={v => { setVendeurAImpersonner(v); setModalImpersonateOuvert(true); }} 
                 onNaviguerVers={naviguerVers}
                 vendeurs={vendeurs}
                 onStatutChange={(vendeurId, nouveauStatut) => {
                   setVendeurs(prev => prev.map(v => v.id === vendeurId ? { ...v, statut: nouveauStatut as any } : v));
                 }}
               />;
      case 'vendeurs-approbations':
        return <ApprobationsEnAttente naviguerVers={naviguerVers} />;
      case 'vendeurs-suspendus':
        return <ComptesSuspendus naviguerVers={naviguerVers} />;

      case 'produits':
      case 'produits-liste':
        return <ListeProduits />;
      case 'produits-encheres':
        return <GestionEncheres naviguerVers={naviguerVers} />;
      case 'produits-collections':
        return <GestionCategories onNaviguerVers={naviguerVers} />;
      case 'produits-tags-types':
        return <GestionTagsEtTypes />;

      case 'commandes':
      case 'commandes-toutes':
        return <GestionCommandes naviguerVers={naviguerVers} />;
      case 'commande-detail':
        return pageData
          ? <DetailCommande commande={pageData} naviguerVers={naviguerVers} />
          : <GestionCommandes naviguerVers={naviguerVers} />;
      case 'commandes-litiges':
        return <LitigesRetours naviguerVers={naviguerVers} />;

      case 'domaines':
      case 'domaines-gestion':
        return <GestionDomaines />;

      case 'forfaits':
      case 'forfaits-liste':
        return <GestionPlans naviguerVers={naviguerVers} />;
      case 'forfaits-creer':
        return <CreerPlan naviguerVers={naviguerVers} planAEditer={planAEditer} />;
      case 'forfaits-abonnements':
        return <AbonnementsActifs naviguerVers={naviguerVers} />;
      case 'abonnement-detail':
        return pageData
          ? <AbonnementDetail vendeur={pageData} naviguerVers={naviguerVers} />
          : <AbonnementsActifs naviguerVers={naviguerVers} />;

      case 'badges':
      case 'badges-gerer':
        return <GestionBadges />;
      case 'badges-attitres':
        return <BadgesAttitres />;

      case 'finances-commissions':
        return <FinancesCommissions naviguerVers={naviguerVers} />;
      case 'finances-paiements':
        return <PaiementsVendeurs naviguerVers={naviguerVers} />;
      case 'finances-rapports':
        return <RapportsFinanciers naviguerVers={naviguerVers} />;

      case 'wishlist':
      case 'wishlist-listes':
        return <ListeWishlists />;
      case 'wishlist-alertes':
        return <ListeAlertesPrix />;

      case 'messagerie':
      case 'messagerie-notifications':
        return <Notifications naviguerVers={naviguerVers} />;
      case 'messagerie-vendeurs':
        return <ChatVendeurs naviguerVers={naviguerVers} />;
      case 'messagerie-acheteurs':
        return <ChatAcheteurs naviguerVers={naviguerVers} />;
      case 'messagerie-litiges':
        return <SurveillanceLitiges naviguerVers={naviguerVers} />;
      case 'messagerie-email-manuel':
        return <ReponseClient />;
      case 'messagerie-email-marketing':
        return <Marketing />;

      case 'signalements':
      case 'signalements-liste':
        return <GestionSignalements filtre="tous" naviguerVers={naviguerVers} />;
      case 'signalements-en-cours':
        return <GestionSignalements filtre="en_cours" naviguerVers={naviguerVers} />;
      case 'signalements-resolus':
        return <GestionSignalements filtre="resolus" naviguerVers={naviguerVers} />;
      case 'signalements-statistiques':
        return <StatistiquesSignalements naviguerVers={naviguerVers} />;

      case 'plateforme-champs-personnalises':
        return <ChampsPersonnalises naviguerVers={naviguerVers} />;
      case 'plateforme-blacklist-contact':
        return <BlacklistContact />;
      case 'plateforme-paypal':
        return <ConfigurationPaypal naviguerVers={naviguerVers} />;
      case 'plateforme-wishlist':
        return <ConfigurationWishList naviguerVers={naviguerVers} />;
      case 'plateforme-mon-forfait':
        return <MonForfaitPlateforme naviguerVers={naviguerVers} />;

      case 'logs':
        return <JournauxAudits naviguerVers={naviguerVers} />;
      case 'plateforme-parution':
        return <ConfigurationParutionFutur naviguerVers={naviguerVers} />;
      case 'plateforme-enchere':
        return <ConfigurationEnchere naviguerVers={naviguerVers} />;
      case 'plateforme-make-offer':
        return <ConfigurationMakeOffer naviguerVers={naviguerVers} />;
      case 'plateforme-config':
        return <ConfigurationGenerale naviguerVers={naviguerVers} />;
      case 'plateforme-stripe':
        return <ConfigurationStripe naviguerVers={naviguerVers} />;
      case 'plateforme-emails':
        return <ModelesCourriel naviguerVers={naviguerVers} />;
      case 'plateforme-documents':
        return <ModelesDocument naviguerVers={naviguerVers} />;
      case 'plateforme-integration':
        return <IntegrationCode naviguerVers={naviguerVers} />;
      // ✅ ROUTE CORRIGÉE - Utilise AdminAddons
      case 'plateforme-addon':
      case 'addons':
      case 'addons-gestion':
        return <AdminAddons naviguerVers={naviguerVers} />;
      case 'addons-guides':
        return <GuidesAddons />;
      case 'addons-actives':
        return <AddonsActives naviguerVers={naviguerVers} />;

      case 'templates':
      case 'templates-prix':
        return <PageAdminTemplatesPrix />;

      case 'parametres':
      case 'parametres-menu':
        return <GestionMenus naviguerVers={naviguerVers} />;
      case 'parametres-pages':
        return <PagesPlateforme naviguerVers={naviguerVers} />;
      case 'parametres-photo':
        return <Photo />;
      case 'parametres-politique':
        return <PolitiquesPlateforme naviguerVers={naviguerVers} />;
      case 'parametres-blog':
        return <BlogPlateforme naviguerVers={naviguerVers} />;
      case 'parametres-faq':
        return <FaqPlateformeAdmin naviguerVers={naviguerVers} />;
      case 'parametres-cookies':
        return <GestionCookies naviguerVers={naviguerVers} />;
      case 'parametres-seo':
        return <ReferencementSEO naviguerVers={naviguerVers} />;
      case 'parametres-config-pages':
        return <PageEnConstruction titre={pageActive.replace('parametres-', '').replace(/-/g, ' ')} />;

      default:
        return <PageEnConstruction titre={pageActive.replace(/-/g, ' ')} />;
    }
  };

  const pageAppartientA = (itemId: string) => {
    if (pageActive === itemId) return true;
    if (pageActive.startsWith(itemId + '-')) return true;
    if (itemId === 'forfaits'  && pageActive === 'abonnement-detail') return true;
    if (itemId === 'commandes' && pageActive === 'commande-detail')   return true;
    if (itemId === 'signalements' && (pageActive.startsWith('signalements-'))) return true;
    if (itemId === 'addons' && pageActive.startsWith('addons-')) return true;
    if (itemId === 'plateforme' && pageActive === 'plateforme-tags') {
      setPageActive('produits-tags-types');
      return true;
    }
    return false;
  };

  const ssEstActif = (ssId: string) => {
    if (pageActive === ssId) return true;
    if (ssId === 'forfaits-abonnements' && pageActive === 'abonnement-detail') return true;
    if (ssId === 'commandes-toutes'     && pageActive === 'commande-detail')   return true;
    if (ssId === 'signalements-liste' && pageActive.startsWith('signalements-')) return true;
    return false;
  };

  const pageFullHeight = [
    'messagerie-vendeurs',
    'messagerie-acheteurs',
    'messagerie-litiges',
  ].includes(pageActive);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const sidebar = (
    <div style={{ width: '250px', backgroundColor: THEME.sidebar, height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <img src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo5.png?v=1758814369" alt="e-Vend" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <div>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: '800', margin: 0, fontFamily: "'Sora', sans-serif" }}>
              {nomPlateforme.includes('-')
                ? (() => {
                    const idx = nomPlateforme.indexOf('-');
                    const avant = nomPlateforme.slice(0, idx);
                    const apres = nomPlateforme.slice(idx + 1);
                    return <>{avant}<span style={{ color: '#93c5fd' }}>-</span>{apres}</>;
                  })()
                : nomPlateforme
              }
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Administration</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(45,106,159,0.25)', border: '1px solid rgba(45,106,159,0.4)', borderRadius: '6px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd' }}>Mode Admin</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0 16px' }}>
        {NAV_ITEMS.map(item => {
          const estOuvert = sectionOuverte === item.id;
          const sectionActive = pageAppartientA(item.id);

          return (
            <div key={item.id}>
              <div
                onClick={() => item.sousSections ? toggleSection(item.id) : naviguerVers(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 16px 9px 14px', cursor: 'pointer',
                  borderLeft: sectionActive && !item.sousSections
                    ? '3px solid #60a5fa'
                    : sectionActive ? '3px solid rgba(96,165,250,0.4)' : '3px solid transparent',
                  backgroundColor: sectionActive && !item.sousSections
                    ? THEME.sidebarActive
                    : sectionActive ? 'rgba(45,106,159,0.15)' : 'transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!sectionActive) (e.currentTarget as HTMLElement).style.backgroundColor = THEME.sidebarHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = sectionActive && !item.sousSections ? THEME.sidebarActive : sectionActive ? 'rgba(45,106,159,0.15)' : 'transparent'; }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: sectionActive ? '700' : '500', color: sectionActive ? 'white' : 'rgba(255,255,255,0.65)', flex: 1 }}>{item.label}</span>
                {badgeSection(item.id) > 0 ? (
                  <span style={{ backgroundColor: THEME.danger, color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
                    {badgeSection(item.id)}
                  </span>
                ) : null}
                {item.sousSections && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{estOuvert ? '▲' : '▼'}</span>
                )}
              </div>

              {item.sousSections && estOuvert && (
                <div style={{ paddingTop: '2px', paddingBottom: '4px' }}>
                  {item.sousSections.map(ss => {
                    const actif = ssEstActif(ss.id);
                    return (
                      <div key={ss.id} onClick={() => naviguerVers(ss.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginLeft: '36px', marginRight: '10px',
                          padding: '7px 10px 7px 12px', borderRadius: '7px', marginBottom: '2px',
                          cursor: 'pointer',
                          backgroundColor: actif ? 'rgba(45,106,159,0.4)' : 'transparent',
                          borderLeft: actif ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (!actif) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = actif ? 'rgba(45,106,159,0.4)' : 'transparent'; }}>
                        <span style={{ fontSize: '13px', opacity: actif ? 1 : 0.55 }}>{ss.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: actif ? '700' : '400', color: actif ? 'white' : 'rgba(255,255,255,0.5)', flex: 1 }}>{ss.label}</span>
                        {badgeSousSection(ss.id) > 0 ? (
                          <span style={{ backgroundColor: (ss.id === 'vendeurs-liste' || ss.id === 'sponsors-signalements') ? '#dc2626' : THEME.danger, color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '8px', minWidth: '16px', textAlign: 'center' }}>
                            {ss.id === 'vendeurs-liste' ? `🚩${badgeSousSection(ss.id)}` : badgeSousSection(ss.id)}
                          </span>
                        ) : null}
                        {actif && <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#60a5fa', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white' }}>A</div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'white', margin: 0 }}>Administrateur</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>admin@evend.ca</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
          }}
        >
          <span>🚪</span>
          <span>Déconnexion sécuritaire</span>
        </button>
      </div>
    </div>
  );

  const topbar = (
    <div style={{ position: 'fixed', top: 0, left: '250px', right: 0, height: '56px', backgroundColor: THEME.topbar, borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', paddingLeft: '24px', paddingRight: '24px', gap: '16px', zIndex: 99, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {vendeurImpersonne && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef9c3', border: '1px solid #d97706', borderRadius: '8px', padding: '6px 14px' }}>
          <span>👤</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Impersonation : {vendeurImpersonne.nom} — {vendeurImpersonne.nom_boutique}</span>
          <button onClick={() => setVendeurImpersonne(null)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✕ Quitter</button>
        </div>
      )}
      {gestionnaireImpersonne && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef9c3', border: '1px solid #d97706', borderRadius: '8px', padding: '6px 14px' }}>
          <span>👤</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Impersonation : {gestionnaireImpersonne.nom} — {gestionnaireImpersonne.nom_boutique}</span>
          <button onClick={() => setGestionnaireImpersonne(null)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✕ Quitter</button>
        </div>
      )}
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: '13px', color: THEME.textLight, fontWeight: '500' }}>
          {heureActuelle.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          <span style={{ marginLeft: '16px', color: '#aaa' }}>{heureActuelle.toLocaleTimeString('fr-CA')}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{ position: 'relative', cursor: 'pointer', fontSize: '20px' }}
          onClick={() => { setPageActive('signalements-liste'); setSectionOuverte('signalements'); }}
          title={nbSignalementsNouveaux > 0 ? `${nbSignalementsNouveaux} signalement(s) nouveau(x)` : 'Notifications'}>
          🔔
          {nbSignalementsNouveaux > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: THEME.danger, borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: '900', color: 'white', border: '2px solid white', whiteSpace: 'nowrap' }}>
              🚩{nbSignalementsNouveaux}
            </span>
          )}
        </div>
        <div
          style={{ position: 'relative', cursor: 'pointer', fontSize: '20px' }}
          onClick={() => { setPageActive('sponsors-signalements'); setSectionOuverte('sponsors'); }}
          title={nbSignalementsPubNouveaux > 0 ? `${nbSignalementsPubNouveaux} signalement(s) de pub non lu(s)` : 'Signalements de pubs sponsors'}>
          🚩
          {nbSignalementsPubNouveaux > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: THEME.danger, borderRadius: '50%', minWidth: '16px', height: '16px', padding: '0 3px', fontSize: '9px', fontWeight: '900', color: 'white', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {nbSignalementsPubNouveaux}
            </span>
          )}
        </div>
        <SessionIndicator />
        <button 
          onClick={() => window.open('/', '_self')} 
          style={{ 
            color: THEME.accent, 
            fontWeight: '700', 
            fontSize: '13px', 
            backgroundColor: THEME.accentLight, 
            padding: '6px 14px', 
            borderRadius: '8px', 
            border: `1px solid ${THEME.accent}40`, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            transition: 'all 0.2s' 
          }} 
          onMouseEnter={e => { 
            e.currentTarget.style.backgroundColor = THEME.accent; 
            e.currentTarget.style.color = 'white'; 
          }} 
          onMouseLeave={e => { 
            e.currentTarget.style.backgroundColor = THEME.accentLight; 
            e.currentTarget.style.color = THEME.accent; 
          }}
        >
          🏠 Retour à la plateforme
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ fontFamily: 'inherit', backgroundColor: THEME.bg, minHeight: '100vh' }}>
        {sidebar}
        {topbar}
        <div style={{
          marginLeft: '250px',
          marginTop: '56px',
          minHeight: 'calc(100vh - 56px)',
          ...(pageFullHeight
            ? { height: 'calc(100vh - 56px)', overflow: 'hidden' }
            : { paddingBottom: '60px' }),
        }}>
          {renderPage()}
        </div>

        {!pageFullHeight && (
          <div style={{ position: 'fixed', bottom: 0, left: '250px', right: 0, backgroundColor: '#e8eaed', borderTop: `1px solid ${THEME.border}`, padding: '8px', textAlign: 'center', fontSize: '12px', color: THEME.textLight, zIndex: 99 }}>
            © {footerText}
          </div>
        )}

        {modalImpersonateOuvert && vendeurAImpersonner && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 12px 48px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', backgroundColor: '#fef9c3', borderBottom: '2px solid #d97706' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#92400e', textTransform: 'uppercase' }}>👤 Accéder en tant que vendeur</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Vous allez accéder au dashboard de ce vendeur</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: `1px solid ${THEME.border}` }}>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: THEME.text, margin: '0 0 4px 0' }}>{vendeurAImpersonner.nom}</p>
                  <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 2px 0' }}>🏪 {vendeurAImpersonner.nom_boutique}</p>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{vendeurAImpersonner.email} · {vendeurAImpersonner.plan}</p>
                </div>
                <div style={{ backgroundColor: '#fef9c3', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', border: '1px solid #d97706' }}>
                  <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>⚠️ Toutes vos actions seront enregistrées dans les journaux d'audit.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalImpersonateOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => {
                    setVendeurImpersonne(vendeurAImpersonner);
                    setModalImpersonateOuvert(false);
                    if (onImpersonate && vendeurAImpersonner) {
                      onImpersonate(vendeurAImpersonner);
                    }
                  }} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    👤 Accéder au dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalImpersonateGestionnaireOuvert && gestionnaireAImpersonner && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 12px 48px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', backgroundColor: '#fef9c3', borderBottom: '2px solid #d97706' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#92400e', textTransform: 'uppercase' }}>👤 Accéder en tant que gestionnaire</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Vous allez accéder au dashboard de ce gestionnaire</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: `1px solid ${THEME.border}` }}>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: THEME.text, margin: '0 0 4px 0' }}>{gestionnaireAImpersonner.gestionnaire.nom}</p>
                  <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 2px 0' }}>🏪 {gestionnaireAImpersonner.gestionnaire.nom_boutique}</p>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{gestionnaireAImpersonner.gestionnaire.email} · {gestionnaireAImpersonner.gestionnaire.plan}</p>
                </div>
                <div style={{ backgroundColor: '#fef9c3', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', border: '1px solid #d97706' }}>
                  <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>⚠️ Toutes vos actions seront enregistrées dans les journaux d'audit.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalImpersonateGestionnaireOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => {
                    setGestionnaireImpersonne(gestionnaireAImpersonner.gestionnaire);
                    setModalImpersonateGestionnaireOuvert(false);
                    if (onImpersonateGestionnaire) {
                      onImpersonateGestionnaire(gestionnaireAImpersonner.gestionnaire, gestionnaireAImpersonner.token);
                    }
                  }} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    👤 Accéder au dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalImpersonateSponsorOuvert && sponsorAImpersonner && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 12px 48px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', backgroundColor: '#fef3c7', borderBottom: '2px solid #f59e0b' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#92400e', textTransform: 'uppercase' }}>⭐ Accéder en tant que sponsor</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Vous allez accéder au dashboard de ce sponsor</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: `1px solid ${THEME.border}` }}>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: THEME.text, margin: '0 0 4px 0' }}>{sponsorAImpersonner.sponsor.nom}</p>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{sponsorAImpersonner.sponsor.email}</p>
                </div>
                <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', border: '1px solid #f59e0b' }}>
                  <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>⚠️ Toutes vos actions seront enregistrées dans les journaux d'audit.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalImpersonateSponsorOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => {
                    // Le cookie httpOnly a déjà été posé par le serveur au
                    // moment de l'appel à /api/sponsors/admin/:id/impersonate
                    // — plus besoin (et plus question) de stocker le JWT ici.
                    setModalImpersonateSponsorOuvert(false);
                    window.location.href = '/sponsor-dashboard';
                  }} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    👤 Accéder au dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AppAdmin;