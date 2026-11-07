// CHEMIN : src/templates/multivendeur/TemplateMultiVendeurPremium.tsx
// e-Vend Studio — Template Multi-Vendeur Premium
// Fichier de navigation principal — importe chaque page séparément

import { useState, useEffect } from 'react';
import MVPremiumAccueil    from './MVPremiumAccueil';
import { setDevise } from '../shared/devise';
import VerificateurAge from '../../components/VerificateurAge';
import MVPremiumCatalogue  from './MVPremiumCatalogue';
import MVPremiumBoutiques  from './MVPremiumBoutiques';
import MVPremiumBoutiquePage from './MVPremiumBoutiquePage';
import MVPremiumProduit    from './MVPremiumProduit';
import MVPremiumEncheres   from './MVPremiumEncheres';
import MVPremiumDocuments  from './MVPremiumDocuments';
import MVPremiumPolitique  from './MVPremiumPolitique';
import MVPremiumContact    from './MVPremiumContact';
import MarketplaceLogin               from '../shared/MarketplaceLogin';
import MarketplaceInscriptionAcheteur from '../shared/MarketplaceInscriptionAcheteur';
import MarketplaceInscriptionCollaborateur  from '../shared/MarketplaceInscriptionCollaborateur';
import AppAcheteur                    from '../../AppAcheteur';
import AppCollaborateur               from '../../AppCollaborateur';

const API_BASE = '/api';

export type PageMVPremium =
  | 'accueil'
  | 'catalogue'
  | 'boutiques'
  | 'boutique-page'
  | 'produit'
  | 'encheres'
  | 'documents'
  | 'politique'
  | 'contact'
  | 'login'
  | 'inscription-acheteur'
  | 'inscription-collaborateur'
  | 'dashboard-acheteur'
  | 'dashboard-collaborateur';

export interface NavMVPremium {
  page: PageMVPremium;
  produitId?: number;
  categorieSlug?: string;
  boutiqueSlug?: string;
  politiqueSlug?: string;
  documentSlug?: string;
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
}

type TypeCompte = 'acheteur' | 'collaborateur';

export default function TemplateMultiVendeurPremium({ vendeurId, isDemo = false, config = {} }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id;
  setDevise(config?.multivendeur?.devise);   // Config marketplace → Devise : tous les montants du site l'utilisent
  const cleCompte = `mv_compte_${gestionnaireId}`;

  // Infos d'affichage non sensibles du compte connecté (le vrai jeton est dans
  // le cookie httpOnly, illisible par le navigateur). Le type vient du serveur.
  const lireTypeCompte = (): TypeCompte | null => {
    try {
      const brut = localStorage.getItem(cleCompte);
      if (!brut) return null;
      const t = JSON.parse(brut)?.type;
      return t === 'acheteur' || t === 'collaborateur' ? t : null;
    } catch {
      return null;
    }
  };

  // Lire l'URL pour la navigation initiale (permet l'ouverture directe dans un nouvel onglet)
  const lireNavDepuisURL = (): NavMVPremium => {
    if (typeof window === 'undefined') return { page: 'accueil' };
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') as PageMVPremium | null;
    const boutiqueId = params.get('boutiqueId');
    const produitId = params.get('produitId');
    const politiqueSlug = params.get('politiqueSlug');
    const documentSlug = params.get('documentSlug');
    if (page === 'boutique-page' && boutiqueId) return { page: 'boutique-page', boutiqueSlug: boutiqueId };
    if (page === 'produit' && produitId) return { page: 'produit', produitId: Number(produitId) };
    if (page === 'politique') return politiqueSlug ? { page: 'politique', politiqueSlug } : { page: 'politique' };
    if (page === 'documents' && documentSlug) return { page: 'documents', documentSlug };
    if (page === 'catalogue' || page === 'boutiques' || page === 'encheres' || page === 'documents' || page === 'contact' || page === 'login' || page === 'inscription-acheteur' || page === 'inscription-collaborateur') return { page };
    // Les tableaux de bord ne sont ouverts que si une session existe ; sinon connexion.
    if (page === 'dashboard-acheteur' || page === 'dashboard-collaborateur') {
      const t = lireTypeCompte();
      if (t && page === `dashboard-${t}`) return { page };
      return { page: 'login' };
    }
    return { page: 'accueil' };
  };

  const [nav, setNav] = useState<NavMVPremium>(lireNavDepuisURL());

  // Vérifie la session auprès du serveur (cookie httpOnly) et synchronise
  // localStorage. Renvoie le type de compte connecté, ou null.
  const verifierSession = async (): Promise<TypeCompte | null> => {
    if (isDemo || !gestionnaireId) return null;
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.compte) {
          try { localStorage.setItem(cleCompte, JSON.stringify(data.compte)); } catch { /* stockage indisponible */ }
          return data.compte.type === 'collaborateur' ? 'collaborateur' : 'acheteur';
        }
      }
      if (res.status === 401 || res.status === 403) {
        try { localStorage.removeItem(cleCompte); } catch { /* stockage indisponible */ }
      }
    } catch {
      // Réseau indisponible : on garde l'état local tel quel.
      return lireTypeCompte();
    }
    return null;
  };

  // Au chargement : si la session a expiré, on nettoie ; si on est sur un
  // tableau de bord sans session valide, retour à la connexion.
  useEffect(() => {
    let actif = true;
    verifierSession().then(type => {
      if (!actif) return;
      setNav(courant => {
        if (courant.page === 'dashboard-acheteur' || courant.page === 'dashboard-collaborateur') {
          if (!type || courant.page !== `dashboard-${type}`) return { page: 'login' };
        }
        return courant;
      });
    });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestionnaireId, isDemo]);

  // Add-on « Vérificateur d'âge » : la fenêtre s'affiche sur toutes les pages, seulement si l'add-on est actif
  // (activé, ou inclus au forfait) et si le gestionnaire l'a configurée (Config → Vérificateur d'âge).
  const [porteAge, setPorteAge] = useState(false);
  useEffect(() => {
    if (isDemo || !gestionnaireId) return;
    let actif = true;
    fetch(`${API_BASE}/studio-forfaits/public/${gestionnaireId}/addons`)
      .then(r => (r.ok ? r.json() : {}))
      .then((d: any) => { if (actif) setPorteAge(d?.verificateur_age === true); })
      .catch(() => {});
    return () => { actif = false; };
  }, [gestionnaireId, isDemo]);

  const naviguer = (dest: NavMVPremium) => {
    const type = lireTypeCompte();
    let cible = dest;

    // « Mon compte » : si une session existe, on ouvre directement le tableau de bord.
    if (dest.page === 'login' && type) {
      cible = { page: type === 'collaborateur' ? 'dashboard-collaborateur' : 'dashboard-acheteur' };
    }
    // Un tableau de bord n'est jamais ouvert sans session du bon type.
    if (dest.page === 'dashboard-acheteur' || dest.page === 'dashboard-collaborateur') {
      if (!type || dest.page !== `dashboard-${type}`) cible = { page: 'login' };
    }

    // En quittant un tableau de bord (ex. après une déconnexion), on resynchronise la session.
    const quitteDashboard = nav.page === 'dashboard-acheteur' || nav.page === 'dashboard-collaborateur';
    if (quitteDashboard && cible.page !== 'dashboard-acheteur' && cible.page !== 'dashboard-collaborateur') {
      verifierSession();
    }

    setNav(cible);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const props = { vendeurId, isDemo, config, naviguer };

  const contenu = (() => {
  switch (nav.page) {
    case 'catalogue':
      return <MVPremiumCatalogue {...props} categorieSlug={nav.categorieSlug} />;
    case 'boutiques':
      return <MVPremiumBoutiques {...props} boutiqueSlug={nav.boutiqueSlug} />;
    case 'boutique-page':
      return <MVPremiumBoutiquePage {...props} boutiqueSlug={nav.boutiqueSlug} />;
    case 'produit':
      return <MVPremiumProduit {...props} produitId={nav.produitId} />;
    case 'encheres':
      return <MVPremiumEncheres {...props} />;
    case 'documents':
      return <MVPremiumDocuments {...props} documentSlug={nav.documentSlug} />;
    case 'contact':
      return <MVPremiumContact {...props} />;
    case 'politique':
      return <MVPremiumPolitique {...props} politiqueSlug={nav.politiqueSlug} />;
    case 'login':
      return <MarketplaceLogin {...props} />;
    case 'inscription-acheteur':
      return <MarketplaceInscriptionAcheteur {...props} />;
    case 'inscription-collaborateur':
      return <MarketplaceInscriptionCollaborateur {...props} />;
    case 'dashboard-acheteur':
      return <AppAcheteur vendeurId={vendeurId} config={config} naviguerTemplate={naviguer} />;
    case 'dashboard-collaborateur':
      return <AppCollaborateur vendeurId={vendeurId} config={config} naviguerTemplate={naviguer} />;
    default:
      return <MVPremiumAccueil {...props} />;
  }
  })();

  return (
    <>
      {contenu}
      {porteAge && gestionnaireId ? <VerificateurAge vendeurId={Number(gestionnaireId)} /> : null}
    </>
  );
}