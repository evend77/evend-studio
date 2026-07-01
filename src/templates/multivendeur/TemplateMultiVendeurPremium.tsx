// src/templates/multivendeur/TemplateMultiVendeurPremium.tsx
// e-Vend Studio — Template Multi-Vendeur Premium
// Fichier de navigation principal — importe chaque page séparément

import { useState } from 'react';
import MVPremiumAccueil    from './MVPremiumAccueil';
import MVPremiumCatalogue  from './MVPremiumCatalogue';
import MVPremiumBoutiques  from './MVPremiumBoutiques';
import MVPremiumBoutiquePage from './MVPremiumBoutiquePage';
import MVPremiumProduit    from './MVPremiumProduit';
import MVPremiumEncheres   from './MVPremiumEncheres';
import MVPremiumDocuments  from './MVPremiumDocuments';
import MVPremiumPolitique  from './MVPremiumPolitique';
import MarketplaceLogin               from '../shared/MarketplaceLogin';
import MarketplaceInscriptionAcheteur from '../shared/MarketplaceInscriptionAcheteur';
import MarketplaceInscriptionCollaborateur  from '../shared/MarketplaceInscriptionCollaborateur';
import AppAcheteur                    from '../../AppAcheteur';
import AppCollaborateur               from '../../AppCollaborateur';

export type PageMVPremium =
  | 'accueil'
  | 'catalogue'
  | 'boutiques'
  | 'boutique-page'
  | 'produit'
  | 'encheres'
  | 'documents'
  | 'politique'
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
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
}

export default function TemplateMultiVendeurPremium({ vendeurId, isDemo = false, config = {} }: Props) {
  // Lire l'URL pour la navigation initiale (permet l'ouverture directe dans un nouvel onglet)
  const lireNavDepuisURL = (): NavMVPremium => {
    if (typeof window === 'undefined') return { page: 'accueil' };
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') as PageMVPremium | null;
    const boutiqueId = params.get('boutiqueId');
    const produitId = params.get('produitId');
    const politiqueSlug = params.get('politiqueSlug');
    if (page === 'boutique-page' && boutiqueId) return { page: 'boutique-page', boutiqueSlug: boutiqueId };
    if (page === 'produit' && produitId) return { page: 'produit', produitId: Number(produitId) };
    if (page === 'politique' && politiqueSlug) return { page: 'politique', politiqueSlug };
    if (page === 'catalogue' || page === 'boutiques' || page === 'encheres' || page === 'documents' || page === 'login' || page === 'inscription-acheteur' || page === 'inscription-collaborateur') return { page };
    return { page: 'accueil' };
  };

  const [nav, setNav] = useState<NavMVPremium>(lireNavDepuisURL());

  const naviguer = (dest: NavMVPremium) => {
    setNav(dest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const props = { vendeurId, isDemo, config, naviguer };

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
      return <MVPremiumDocuments {...props} />;
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
}