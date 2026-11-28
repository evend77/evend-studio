// CHEMIN : src/pages/SitePreview.tsx
// e-Vend Studio — Aperçu du site du vendeur (rendu réel)
// Accessible via /site-preview?vendeurId=X
// Mode démo : /site-preview?forceTemplate=xxx&demo=true — 100% hardcodé, zéro API

import { fermerApercu } from '../utils/apercu';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Page404Public                  from './Page404Public';
import CookieBanner                   from '../components/CookieBanner';
import { useAnalytics }               from '../hooks/useAnalytics';
import ChatbotWidget                  from '../components/ChatbotWidget';
import BoutiqueChatbotWidget           from '../components/BoutiqueChatbotWidget';
import BoutiquePopupAnnonce            from '../components/BoutiquePopupAnnonce';
import VerificateurAge                from '../components/VerificateurAge';
import VitrineBoutonInstallerApp       from '../components/VitrineBoutonInstallerApp';
import EffetsVitrine                   from '../components/EffetsVitrine';   // add-on vitrine « Effets de boutique »
import TemplateVitrine                from '../templates/TemplateVitrine';
import TemplateReservation            from '../templates/TemplateReservation';
import TemplateLocationAstro          from '../templates/TemplateLocationAstro';
import TemplateSpectacle              from '../templates/TemplateSpectacle';
import TemplateCagnotteClassique      from '../templates/TemplateCagnotteClassique';
import TemplateCagnotteCause          from '../templates/TemplateCagnotteCause';
import TemplateCagnotteHorizon        from '../templates/TemplateCagnotteHorizon';
import TemplateBoutiqueSimple         from '../templates/TemplateBoutiqueSimple';
import TemplateBoutiqueComplete, { migrerComplete } from '../templates/TemplateBoutiqueComplete';
import TemplateBoutiqueCatalogue from '../templates/TemplateBoutiqueCatalogue';
import TemplateBoutiqueAgricole from '../templates/TemplateBoutiqueAgricole';
import TemplateBoutiqueArtisan from '../templates/TemplateBoutiqueArtisan';
import TemplateBoutiqueAuto from '../templates/TemplateBoutiqueAuto';
import TemplateBoutiqueJouets from '../templates/TemplateBoutiqueJouets';
import TemplateBoutiqueGothique from '../templates/TemplateBoutiqueGothique';
import TemplateBoutiqueBD from '../templates/TemplateBoutiqueBD';
import TemplateBoutiqueFuturiste from '../templates/TemplateBoutiqueFuturiste';
import TemplateBoutiqueTech from '../templates/TemplateBoutiqueTech';
import TemplateBoutiqueRose from '../templates/TemplateBoutiqueRose';
import TemplateBoutiqueBonbon from '../templates/TemplateBoutiqueBonbon';
import TemplateBoutiqueSoleil from '../templates/TemplateBoutiqueSoleil';
import TemplateBoutiqueSentier from '../templates/TemplateBoutiqueSentier';
import TemplateBoutiqueChantier from '../templates/TemplateBoutiqueChantier';
import TemplateBoutiqueCafe from '../templates/TemplateBoutiqueCafe';
import TemplateBoutiqueSakura from '../templates/TemplateBoutiqueSakura';
import TemplateBoutiqueSport from '../templates/TemplateBoutiqueSport';
import TemplateBoutiqueJoyau from '../templates/TemplateBoutiqueJoyau';
import TemplateBoutiqueEcume from '../templates/TemplateBoutiqueEcume';
import TemplateBoutiqueAudace from '../templates/TemplateBoutiqueAudace';
import TemplateBoutiqueCarnaval from '../templates/TemplateBoutiqueCarnaval';
import TemplateBoutiquePatchwork from '../templates/TemplateBoutiquePatchwork';
import TemplateBoutiqueVigie from '../templates/TemplateBoutiqueVigie';
import TemplateBoutiqueAurore from '../templates/TemplateBoutiqueAurore';
import TemplateBoutiqueGalerie from '../templates/TemplateBoutiqueGalerie';
import TemplateBoutiqueRallye from '../templates/TemplateBoutiqueRallye';
import TemplateBoutiquePaon from '../templates/TemplateBoutiquePaon';
import TemplateBoutiquePop from '../templates/TemplateBoutiquePop';
import TemplateBoutiqueNocturne from '../templates/TemplateBoutiqueNocturne';
import TemplateBoutiqueOrbite from '../templates/TemplateBoutiqueOrbite';
import TemplateAgricole               from '../templates/TemplateAgricole';
import TemplateVitrineProSante        from '../templates/TemplateVitrineProSante';
import TemplateVitrineProMariage      from '../templates/TemplateVitrineProMariage';
import TemplateVitrineProBeaute       from '../templates/TemplateVitrineProBeaute';
import TemplateVitrineProTech         from '../templates/TemplateVitrineProTech';
import TemplateVitrineProEntrepreneur from '../templates/TemplateVitrineProEntrepreneur';
import TemplateEnchereGalerie         from '../templates/TemplateEnchereGalerie';
import TemplateAnnoncesClassique      from '../templates/TemplateAnnoncesClassique';
import TemplateAnnoncesAutoClassique  from '../templates/TemplateAnnoncesAutoClassique';
import TemplateAnnoncesImmoClassique  from '../templates/TemplateAnnoncesImmoClassique';
import TemplateAnnoncesAutoShowroom   from '../templates/TemplateAnnoncesAutoShowroom';
import TemplateAnnoncesAutoLease      from '../templates/TemplateAnnoncesAutoLease';
import TemplateAnnoncesVolt           from '../templates/TemplateAnnoncesVolt';
import TemplateAnnoncesNeon           from '../templates/TemplateAnnoncesNeon';
import TemplateAnnoncesImmeuble       from '../templates/TemplateAnnoncesImmeuble';
import TemplateAnnoncesAllegro        from '../templates/TemplateAnnoncesAllegro';
import TemplateAnnoncesServices       from '../templates/TemplateAnnoncesServices';
import TemplateAnnoncesChalet         from '../templates/TemplateAnnoncesChalet';
import TemplateEnchereLive            from '../templates/TemplateEnchereLive';
import TemplateSalon                  from '../templates/TemplateSalon';
import TemplatePaysager               from '../templates/TemplatePaysager';
import TemplateAvocat                 from '../templates/TemplateAvocat';
import TemplateResto                  from '../templates/TemplateResto';
import TemplateBistro                 from '../templates/TemplateBistro';
import TemplatePiano                  from '../templates/TemplatePiano';
import TemplateLangues                from '../templates/TemplateLangues';
import TemplateFormationWeb           from '../templates/TemplateFormationWeb';
import TemplateEcoleCuisine           from '../templates/TemplateEcoleCuisine';
import TemplateStudioYoga             from '../templates/TemplateStudioYoga';
import TemplateEquitation             from '../templates/TemplateEquitation';
import TemplateEcolePeinture          from '../templates/TemplateEcolePeinture';
import TemplateEcoleDanse             from '../templates/TemplateEcoleDanse';
import TemplateFoodTruck              from '../templates/TemplateFoodTruck';
import TemplateBoulangerie            from '../templates/TemplateBoulangerie';
import TemplateCoachVie               from '../templates/TemplateCoachVie';
import TemplateBoutiqueSimplisse      from '../templates/TemplateBoutiqueSimplisse';
import TemplateBoutiqueSimplisseMode, { migrerMode } from '../templates/TemplateBoutiqueSimplisseMode';
import TemplateBoutiquePremium        from '../templates/TemplateBoutiquePremium';
import TemplateBoutiqueBeaute         from '../templates/TemplateBoutiqueBeaute';
import TemplateMultiVendeurPremium    from '../templates/multivendeur/TemplateMultiVendeurPremium';
import { configPremiumAvecBadge, configSimplisseAvecBadge, configSimpleAvecBadge, configCompleteAvecBadge, configCatalogueAvecBadge, configModeAvecBadge, configFermeAvecBadge, configArtisanAvecBadge, configAutoAvecBadge, configJouetsAvecBadge, configGothiqueAvecBadge, configBDAvecBadge, configFuturisteAvecBadge, configTechAvecBadge, configRoseAvecBadge, configBonbonAvecBadge, configSoleilAvecBadge, configSentierAvecBadge, configChantierAvecBadge, configCafeAvecBadge, configSakuraAvecBadge, configSportAvecBadge, configJoyauAvecBadge, configEcumeAvecBadge, configAudaceAvecBadge, configCarnavalAvecBadge, configPatchworkAvecBadge, configVigieAvecBadge, configAuroreAvecBadge, configGalerieAvecBadge, configRallyeAvecBadge, configPaonAvecBadge, configPopAvecBadge, configNocturneAvecBadge, configOrbiteAvecBadge } from '../templates/shared/addons/badgeEvendMasquer';
import EffetsBoutiqueSolo             from '../components/EffetsBoutiqueSolo';   // add-on « Effets de boutique » : décorations de saison / de vente et musique de fond

const API_BASE = '/api';

// Templates boutique SOLO : leurs add-ons viennent de l'API boutique (Mon plan & limites). Les autres templates ne changent pas.
// Simplisse (pas Simplisse-Mode) : le template monte lui-même l'Analytique et le Vérificateur d'âge (add-ons boutique)
// Mono-produit (boutique-simple, comparé EXACTEMENT : « boutique-simplisse » commence par « boutique-simple ») : même moteur que Simplisse, donc même montage.
const estMonoProduit = (t: string) => t === 'boutique-simple';
const estCompleteBoutique = (t: string) => t === 'boutique-complete';
const estCatalogueBoutique = (t: string) => t === 'boutique-catalogue';
const estAgricoleBoutique = (t: string) => t === 'boutique-agricole';
const estArtisanBoutique = (t: string) => t === 'boutique-artisan';
const estAutoBoutique = (t: string) => t === 'boutique-auto';
const estJouetsBoutique = (t: string) => t === 'boutique-jouets';
const estGothiqueBoutique = (t: string) => t === 'boutique-gothique';
const estBDBoutique = (t: string) => t === 'boutique-bd';
const estFuturisteBoutique = (t: string) => t === 'boutique-futuriste';
const estTechBoutique = (t: string) => t === 'boutique-tech';
const estRoseBoutique = (t: string) => t === 'boutique-rose';
const estBonbonBoutique = (t: string) => t === 'boutique-bonbon';
const estSoleilBoutique = (t: string) => t === 'boutique-soleil';
const estSentierBoutique = (t: string) => t === 'boutique-sentier';
const estChantierBoutique = (t: string) => t === 'boutique-chantier';
const estCafeBoutique = (t: string) => t === 'boutique-cafe';
const estSakuraBoutique = (t: string) => t === 'boutique-sakura';
const estSportBoutique = (t: string) => t === 'boutique-sport';
const estJoyauBoutique = (t: string) => t === 'boutique-joyau';
const estEcumeBoutique = (t: string) => t === 'boutique-ecume';
const estAudaceBoutique = (t: string) => t === 'boutique-audace';
const estCarnavalBoutique = (t: string) => t === 'boutique-carnaval';
const estPatchworkBoutique = (t: string) => t === 'boutique-patchwork';
const estVigieBoutique = (t: string) => t === 'boutique-vigie';
const estAuroreBoutique = (t: string) => t === 'boutique-aurore';
const estGalerieBoutique = (t: string) => t === 'boutique-galerie';
const estRallyeBoutique = (t: string) => t === 'boutique-rallye';
const estPaonBoutique = (t: string) => t === 'boutique-paon';
const estPopBoutique = (t: string) => t === 'boutique-pop';
const estNocturneBoutique = (t: string) => t === 'boutique-nocturne';
const estOrbiteBoutique = (t: string) => t === 'boutique-orbite';
const estModeBoutique = (t: string) => t.startsWith('boutique-simplisse-mode');
const estSimplisseSeul = (t: string) => (t.startsWith('boutique-simplisse') && !t.startsWith('boutique-simplisse-mode')) || estMonoProduit(t) || estCompleteBoutique(t) || estCatalogueBoutique(t) || estAgricoleBoutique(t) || estArtisanBoutique(t) || estAutoBoutique(t) || estJouetsBoutique(t) || estGothiqueBoutique(t) || estBDBoutique(t) || estFuturisteBoutique(t) || estTechBoutique(t) || estRoseBoutique(t) || estBonbonBoutique(t) || estSoleilBoutique(t) || estSentierBoutique(t) || estChantierBoutique(t) || estCafeBoutique(t) || estSakuraBoutique(t) || estSportBoutique(t) || estJoyauBoutique(t) || estEcumeBoutique(t) || estAudaceBoutique(t) || estCarnavalBoutique(t) || estPatchworkBoutique(t) || estVigieBoutique(t) || estAuroreBoutique(t) || estGalerieBoutique(t) || estRallyeBoutique(t) || estPaonBoutique(t) || estPopBoutique(t) || estNocturneBoutique(t) || estOrbiteBoutique(t) || estModeBoutique(t);
const estBoutiqueSolo = (t: string) => ['boutique-premium', 'boutique-simplisse', 'boutique-beaute'].some(p => t.startsWith(p)) || estMonoProduit(t) || estCompleteBoutique(t) || estCatalogueBoutique(t) || estAgricoleBoutique(t) || estArtisanBoutique(t) || estAutoBoutique(t) || estJouetsBoutique(t) || estGothiqueBoutique(t) || estBDBoutique(t) || estFuturisteBoutique(t) || estTechBoutique(t) || estRoseBoutique(t) || estBonbonBoutique(t) || estSoleilBoutique(t) || estSentierBoutique(t) || estChantierBoutique(t) || estCafeBoutique(t) || estSakuraBoutique(t) || estSportBoutique(t) || estJoyauBoutique(t) || estEcumeBoutique(t) || estAudaceBoutique(t) || estCarnavalBoutique(t) || estPatchworkBoutique(t) || estVigieBoutique(t) || estAuroreBoutique(t) || estGalerieBoutique(t) || estRallyeBoutique(t) || estPaonBoutique(t) || estPopBoutique(t) || estNocturneBoutique(t) || estOrbiteBoutique(t);

interface SitePreviewProps {
  vendeurIdProp?: number | string;
  hidePreviewBar?: boolean;
}

// ─── Configs démo 100% hardcodées — zéro API ─────────────────────────────────
const DEMO_PRODUITS_PREMIUM = [
  { id:1, titre:'Montre Édition Limitée', prix:299.99, prix_promo:249.99, stock:5, categorie:'Accessoires', note_moyenne:4.8, nb_avis:124, description:'Montre de luxe avec boîtier en acier inoxydable et cadran saphir. Étanche 50m. Garantie 2 ans.', photo_principale:'', emoji:'⌚' },
  { id:2, titre:'Sac Cuir Véritable', prix:189.99, stock:12, categorie:'Maroquinerie', note_moyenne:4.9, nb_avis:87, description:'Sac en cuir pleine fleur tanné végétal. Doublure en suède. Fabriqué à la main.', photo_principale:'', emoji:'👜' },
  { id:3, titre:'Parfum Signature', prix:149.99, stock:20, categorie:'Beauté', note_moyenne:4.7, nb_avis:203, description:'Eau de parfum 100ml. Notes de tête: bergamote. Notes de cœur: rose, jasmin.', photo_principale:'', emoji:'🧴' },
  { id:4, titre:'Coffret Soins Premium', prix:89.99, prix_promo:69.99, stock:8, categorie:'Beauté', note_moyenne:4.6, nb_avis:56, description:'Coffret de 5 produits de soin visage haut de gamme.', photo_principale:'', emoji:'🎁' },
  { id:5, titre:'Ceinture Cuir Italien', prix:119.99, stock:15, categorie:'Maroquinerie', note_moyenne:4.8, nb_avis:41, description:'Ceinture en cuir de veau italien. Boucle en laiton doré.', photo_principale:'', emoji:'👔' },
  { id:6, titre:'Écharpe Cachemire', prix:199.99, prix_promo:159.99, stock:7, categorie:'Mode', note_moyenne:4.9, nb_avis:67, description:'Écharpe 100% cachemire mongolien. Tissage fait main.', photo_principale:'', emoji:'🧣' },
  { id:7, titre:'Chapeau Fedora', prix:59.99, stock:10, categorie:'Accessoires', note_moyenne:4.5, nb_avis:34, description:'Chapeau fedora en laine feutrée. Ruban en soie.', photo_principale:'', emoji:'🎩' },
  { id:8, titre:'Portefeuille Slim', prix:79.99, stock:25, categorie:'Maroquinerie', note_moyenne:4.7, nb_avis:92, description:'Portefeuille ultra-mince en cuir de veau. 6 emplacements cartes.', photo_principale:'', emoji:'👛' },
];

const DEMO_PRODUITS_SIMPLISSE_MODE = [
  { id:1, titre:'Robe Midi Fleurie', prix:89.99, prix_promo:69.99, stock:15, categorie:'Robes', note_moyenne:4.8, nb_avis:42, est_nouveau:true, photo_principale:'', emoji:'👗', variantes:[{ nom:'Couleur', valeurs:['Rouge','Bleu','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:2, titre:'Blazer Oversized Crème', prix:129.99, stock:8, categorie:'Vestes', note_moyenne:4.9, nb_avis:28, photo_principale:'', emoji:'🧥', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:3, titre:'Jean Taille Haute', prix:74.99, prix_promo:59.99, stock:20, categorie:'Pantalons', note_moyenne:4.7, nb_avis:61, photo_principale:'', emoji:'👖', variantes:[{ nom:'Couleur', valeurs:['Noir','Bleu','Blanc'], type:'couleur' },{ nom:'Taille', valeurs:['36','38','40','42','44'], type:'taille' }] },
  { id:4, titre:'Top Épaules Dénudées', prix:44.99, stock:25, categorie:'Hauts', note_moyenne:4.6, nb_avis:33, est_nouveau:true, photo_principale:'', emoji:'👚', variantes:[{ nom:'Couleur', valeurs:['Blanc','Rose','Sauge'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:5, titre:'Manteau Long Camel', prix:189.99, prix_promo:149.99, stock:6, categorie:'Manteaux', note_moyenne:4.9, nb_avis:19, photo_principale:'', emoji:'🧥', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:6, titre:'Jupe Plissée Midi', prix:59.99, stock:18, categorie:'Jupes', note_moyenne:4.7, nb_avis:47, photo_principale:'', emoji:'👗', variantes:[{ nom:'Couleur', valeurs:['Bordeaux','Vert','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
];

const DEMO_PRODUITS_SIMPLISSE = [
  { id: 1, titre: 'T-Shirt Premium Blanc', prix: 29.99, prix_promo: 19.99, stock: 50, categorie: 'Vêtements', description: 'T-shirt 100% coton bio, coupe régulière. Disponible en S, M, L, XL.', photo_principale:'', emoji:'👕' },
  { id: 2, titre: 'Tuque Tricotée',   prix: 24.99, stock: 30,  categorie: 'Accessoires', description: 'Tuque en laine douce, doublée polaire.', photo_principale:'', emoji:'🧢' },
  { id: 3, titre: 'Sac Tote Canvas',       prix: 34.99, stock: 25,  categorie: 'Accessoires', description: 'Sac fourre-tout en canvas épais. Contenance 15L.', photo_principale:'', emoji:'👜' },
  { id: 4, titre: 'Chandail Molleton Gris',       prix: 59.99, prix_promo: 44.99, stock: 20, categorie: 'Vêtements', description: 'Chandail en molleton doux. Poche kangourou.', photo_principale:'', emoji:'🧶' },
  { id: 5, titre: 'Bottes d\'Hiver',   prix: 14.99, stock: 100, categorie: 'Chaussures', description: 'Bottes imperméables, semelle antidérapante.', photo_principale:'', emoji:'🥾' },
  { id: 6, titre: 'Outil Multifonction',  prix: 39.99, stock: 40,  categorie: 'Maison',      description: 'Outil multifonction en acier inoxydable, 12 fonctions.', photo_principale:'', emoji:'🔧' },
];

// Boutique Complète : démonstration seulement — une vraie boutique n'affiche jamais ces exemples
const DEMO_PRODUITS_COMPLETE = [
  { id: 1, titre: 'T-Shirt Coton Blanc', prix: 29.99, prix_promo: 19.99, stock: 50, categorie: 'Vêtements', description: 'T-shirt 100% coton, coupe régulière. Exemple de produit : remplacez-le par les vôtres.', photo_principale:'', emoji:'👕' },
  { id: 2, titre: 'Tuque Tricotée', prix: 24.99, stock: 30, categorie: 'Accessoires', description: 'Tuque en laine douce, doublée polaire.', photo_principale:'', emoji:'🧢' },
  { id: 3, titre: 'Sac Tote Canvas', prix: 34.99, stock: 25, categorie: 'Accessoires', description: 'Sac fourre-tout en canvas épais.', photo_principale:'', emoji:'👜' },
  { id: 4, titre: 'Chandail Molleton Gris', prix: 59.99, prix_promo: 44.99, stock: 20, categorie: 'Vêtements', description: 'Chandail en molleton doux.', photo_principale:'', emoji:'🧶' },
  { id: 5, titre: 'Bottes d\'Hiver', prix: 14.99, stock: 100, categorie: 'Chaussures', description: 'Bottes imperméables, semelle antidérapante.', photo_principale:'', emoji:'🥾' },
  { id: 6, titre: 'Outil Multifonction', prix: 39.99, stock: 40, categorie: 'Maison', description: 'Outil multifonction en acier inoxydable, 12 fonctions.', photo_principale:'', emoji:'🔧' },
];
const DEMO_CONFIG_COMPLETE = { complete: { footer: { nomBoutique: 'Ma Boutique', afficherPropulse: true } } };
// Catalogue Avancé : démonstration seulement (produits d'exemple jamais affichés sur une vraie boutique)
const DEMO_PRODUITS_CATALOGUE = DEMO_PRODUITS_COMPLETE;
const DEMO_CONFIG_MODE = { mode: { footer: { nomBoutique: 'Ma Boutique Mode', afficherPropulse: true } } };
// Boutique Agricole : démonstration seulement — produits d'exemple (emojis, aucune photo) jamais affichés sur une vraie boutique
const DEMO_PRODUITS_AGRICOLE = [
  { id: 1, titre: 'Tomates anciennes', prix: 4.5, stock: 40, categorie: 'Légumes', description: 'Exemple de produit : remplacez-le par les vôtres.', photo_principale:'', emoji:'🍅' },
  { id: 2, titre: 'Carottes', prix: 3.8, prix_promo: 2.99, stock: 60, categorie: 'Légumes', description: 'Exemple de produit de démonstration.', photo_principale:'', emoji:'🥕' },
  { id: 3, titre: 'Chou frisé', prix: 3.2, stock: 30, categorie: 'Légumes', description: 'Exemple de produit de démonstration.', photo_principale:'', emoji:'🥬' },
  { id: 4, titre: 'Pommes', prix: 5.5, stock: 50, categorie: 'Fruits', description: 'Exemple de produit de démonstration.', photo_principale:'', emoji:'🍎' },
  { id: 5, titre: 'Oeufs de la ferme', prix: 6.0, stock: 25, categorie: 'Produits de la ferme', description: 'Exemple de produit de démonstration.', photo_principale:'', emoji:'🥚' },
  { id: 6, titre: 'Miel', prix: 12.0, stock: 20, categorie: 'Produits de la ferme', description: 'Exemple de produit de démonstration.', photo_principale:'', emoji:'🍯' },
];
const DEMO_CONFIG_AGRICOLE = { ferme: { footer: { nomBoutique: 'Ma Ferme', afficherPropulse: true } } };
// Simplisse Artisan : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const PX = (id: number, w = 800) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const DEMO_PRODUITS_ARTISAN = [
  { id: 1,  titre: 'Toile abstraite — Éclats',        prix: 189, stock: 3,  categorie: 'Toiles',             description: 'Exemple de produit de démonstration.', photo_principale: PX(1418595) },
  { id: 2,  titre: 'Toile texturée — Brume',          prix: 249, prix_promo: 199, stock: 1, categorie: 'Toiles', description: 'Exemple de produit de démonstration.', photo_principale: PX(10532816) },
  { id: 3,  titre: 'Toile colorée — Mouvement',       prix: 159, stock: 5,  categorie: 'Toiles',             description: 'Exemple de produit de démonstration.', photo_principale: PX(1563016) },
  { id: 4,  titre: 'Peinture expressive — Élan',      prix: 219, stock: 2,  categorie: 'Toiles',             description: 'Exemple de produit de démonstration.', photo_principale: PX(1848647) },
  { id: 5,  titre: 'Encre fluide — Nuit dorée',       prix: 129, prix_promo: 99, stock: 4, categorie: 'Œuvres sur papier', description: 'Exemple de produit de démonstration.', photo_principale: PX(5506217) },
  { id: 6,  titre: 'Fluide — Tons de sable',          prix: 139, stock: 6,  categorie: 'Œuvres sur papier', description: 'Exemple de produit de démonstration.', photo_principale: PX(32079990) },
  { id: 7,  titre: 'Toile verticale — Vert et or',    prix: 179, stock: 2,  categorie: 'Œuvres sur papier', description: 'Exemple de produit de démonstration.', photo_principale: PX(15062251) },
  { id: 8,  titre: "Céramiques d'atelier",            prix: 74,  stock: 8,  categorie: 'Céramique',          description: 'Exemple de produit de démonstration.', photo_principale: PX(8066048) },
  { id: 9,  titre: 'Pot en argile',                   prix: 64,  prix_promo: 54, stock: 10, categorie: 'Céramique', description: 'Exemple de produit de démonstration.', photo_principale: PX(33912318) },
  { id: 10, titre: 'Tasses en grès',                  prix: 48,  stock: 12, categorie: 'Céramique',          description: 'Exemple de produit de démonstration.', photo_principale: PX(9733314) },
  { id: 11, titre: 'Étagère de céramiques',           prix: 89,  stock: 7,  categorie: 'Céramique',          description: 'Exemple de produit de démonstration.', photo_principale: PX(3094041) },
];
const DEMO_CONFIG_ARTISAN = { artisan: {
  accueil: {
    hero: { titre: 'Des œuvres uniques, faites à la main', sousTitre: "Découvrez les créations de l'atelier : pièces originales, séries limitées et objets d'artisan.", boutonLabel: 'Voir la boutique', boutonLien: '/catalogue', photo: PX(33684107, 1600), style: 'image-fond' },
    galerie: { titre: 'Expressions abstraites', sousTitre: "Exemple de démonstration : remplacez ces photos par les vôtres (Config Mes pages → Accueil → Galerie).", photos: [PX(1418595), PX(1070527), PX(7222027), PX(9508911), PX(1970337), PX(1321935)] },
    blocs: [
      { titre: 'Toiles et œuvres murales', texte: "Exemple de démonstration : présentez une collection, son inspiration et ses techniques.", photo: PX(34688122), lien: '/catalogue', labelLien: 'Découvrir' },
      { titre: "Céramiques d'atelier", texte: "Exemple de démonstration : parlez de vos matériaux et de votre façon de travailler.", photo: PX(5490165), lien: '/catalogue', labelLien: 'Voir la collection' },
      { titre: 'Créations sur commande', texte: "Exemple de démonstration : expliquez si vous acceptez les demandes personnalisées.", photo: PX(3817498), lien: '/contact', labelLien: 'Nous écrire' },
    ],
    philosophie: { sousTitre: "Mot de l'artisan", titre: 'Chaque pièce raconte une histoire', photo: PX(3720778, 1600) },
  },
  footer: { nomBoutique: 'Mon Atelier', afficherPropulse: true, images: [PX(1070527, 500), PX(7222027, 500), PX(15062251, 500), PX(9508911, 500)] },
} };
// Simplisse Auto : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_AUTO = [
  { id: 1,  titre: 'Plaquettes de frein avant — Honda Civic 2016-2021', prix: 64,  stock: 12, categorie: 'Freinage',      description: 'Exemple de produit de démonstration. Compatible Honda Civic.', sku: 'FR-1001', photo_principale: PX(8986132) },
  { id: 2,  titre: 'Disques de frein ventilés — Toyota Corolla 2014-2019', prix: 119, prix_promo: 99, stock: 6, categorie: 'Freinage', description: 'Exemple de produit de démonstration. Compatible Toyota Corolla.', sku: 'FR-1002', photo_principale: PX(4489749) },
  { id: 3,  titre: "Filtre à l'huile — Ford F-150 2015-2023",         prix: 14,  stock: 40, categorie: 'Entretien',    description: 'Exemple de produit de démonstration. Compatible Ford F-150.', sku: 'EN-2001', photo_principale: PX(8985510) },
  { id: 4,  titre: 'Courroie de distribution — Honda Civic 2012-2015', prix: 89,  stock: 5,  categorie: 'Moteur',       description: 'Exemple de produit de démonstration. Compatible Honda Civic.', sku: 'MO-3001', photo_principale: PX(11455717) },
  { id: 5,  titre: 'Bougies d\'allumage (jeu de 4) — Toyota Corolla',  prix: 36,  stock: 25, categorie: 'Moteur',       description: 'Exemple de produit de démonstration. Compatible Toyota Corolla.', sku: 'MO-3002', photo_principale: PX(5158155) },
  { id: 6,  titre: 'Amortisseur arrière — Ford Escape 2013-2019',       prix: 94,  prix_promo: 79, stock: 8, categorie: 'Suspension', description: 'Exemple de produit de démonstration. Compatible Ford Escape.', sku: 'SU-4001', photo_principale: PX(3807517) },
  { id: 7,  titre: 'Rotule de suspension — Chevrolet Silverado',        prix: 52,  stock: 10, categorie: 'Suspension',   description: 'Exemple de produit de démonstration. Compatible Chevrolet Silverado.', sku: 'SU-4002', photo_principale: PX(12765673) },
  { id: 8,  titre: 'Jeu de 4 pneus quatre saisons 205/55R16',           prix: 520, stock: 4,  categorie: 'Pneus et roues', description: 'Exemple de produit de démonstration.', sku: 'PN-5001', photo_principale: PX(7807035) },
  { id: 9,  titre: 'Ampoules de phare DEL (paire) — H11',               prix: 45,  stock: 30, categorie: 'Éclairage',    description: 'Exemple de produit de démonstration.', sku: 'EC-6001', photo_principale: PX(65623) },
  { id: 10, titre: 'Batterie 12 V 650 CCA',                             prix: 159, prix_promo: 139, stock: 9, categorie: 'Électrique', description: 'Exemple de produit de démonstration.', sku: 'EL-7001', photo_principale: PX(8478259) },
];
const DEMO_CONFIG_AUTO = { auto: {
  accueil: {
    hero: { titre: 'Pièces auto et mécaniques', sousTitre: "Exemple de démonstration : trouvez les pièces qu'il vous faut pour votre véhicule.", boutonLabel: 'Voir les pièces', boutonLien: '/catalogue', photo: PX(8985967, 1600), style: 'image-fond' },
    entete: { couleurFond: '#111111', couleurTexte: '#ffffff', afficherRecherche: true, afficherGarage: true, barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide : 514 000-0000' } },
    ticker: { messages: 'Exemple : commandez avant 13 h pour une livraison le lendemain !\nExemple : retours acceptés selon votre politique\nExemple : conseils gratuits au comptoir', vitesse: 'normale', couleurFond: '#d9670b', couleurTexte: '#ffffff', lien: '' },
    vehicule: { titre: 'Trouvez les pièces pour votre véhicule', sousTitre: 'Choisissez votre marque, votre modèle et votre année.', photo: PX(34337558, 1600), anneeMin: 1995, anneeMax: 2026, note: 'Exemple de démonstration : la recherche cherche le nom du véhicule dans les fiches produits. Vérifiez toujours la compatibilité.',
      marques: 'Honda: Civic, Accord, CR-V\nToyota: Corolla, Camry, RAV4\nFord: F-150, Escape, Focus\nChevrolet: Silverado, Equinox, Malibu\nHyundai: Elantra, Tucson, Sonata' },
    cartes: [
      { titre: 'Freinage', texte: 'Plaquettes, disques et étriers.', photo: PX(4489749), bouton: 'Magasiner', lien: 'cat:Freinage' },
      { titre: 'Moteur', texte: 'Courroies, bougies, joints.', photo: PX(65623), bouton: 'Magasiner', lien: 'cat:Moteur' },
      { titre: 'Suspension', texte: 'Amortisseurs, rotules, ressorts.', photo: PX(3807517), bouton: 'Magasiner', lien: 'cat:Suspension' },
    ],
    pieces: { titre: 'Chercher par type de pièce', types: 'Freinage\nMoteur\nSuspension\nPneus et roues\nÉclairage\nÉlectrique\nEntretien' },
    tuiles: [
      { titre: 'Entretien saisonnier', texte: 'Exemple : huile, filtres et balais.', photo: PX(8985510), lien: 'cat:Entretien' },
      { titre: 'Pneus et roues', texte: 'Exemple : tous les formats.', photo: PX(7807035), lien: 'cat:Pneus et roues' },
    ],
    compteRebours: { titre: 'Vente de fin de saison', texte: 'Exemple de démonstration : rabais sur une sélection de pièces.', dateFin: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16), photo: PX(12765673, 1600), bouton: 'Voir les promos', lien: 'catalogue' },
    marques: { titre: 'Nos marques', items: 'Bosch\nDenso\nNGK\nMonroe\nAkebono\nGates' },
    comparatif: { titre: 'Pourquoi nous choisir', colonnes: 'Nous | Autre boutique A | Autre boutique B', lignes: 'Conseils personnalisés | oui | non | non\nRecherche par véhicule | oui | oui | non\nRendez-vous pour la pose | oui | non | non\nExemple de critère | oui | oui | oui' },
    chiffres: { items: '15 | Ans d\'expérience\n5000 | Pièces en inventaire\n40 | Marques\n24 h | Réponse aux courriels' },
    reservation: { titre: 'Réserver une pose ou un diagnostic', sousTitre: 'Exemple de démonstration : choisissez un service et une date, nous vous confirmons le rendez-vous.', photo: PX(8985967, 1000), services: 'Installation de pièces\nDiagnostic\nChangement de pneus\nEntretien', bouton: 'Envoyer la demande', messageSucces: 'Demande envoyée. Nous vous répondrons bientôt.' },
  },
  footer: { nomBoutique: 'Ma Boutique Auto', afficherPropulse: true },
} };
// Simplisse Jouets : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_JOUETS = [
  { id: 1,  titre: 'Ourson en peluche brun',               prix: 24, stock: 14, categorie: 'Peluches',          description: 'Exemple de produit de démonstration.', sku: 'PE-1001', photo_principale: PX(245914) },
  { id: 2,  titre: 'Ourson en peluche blanc',              prix: 29, prix_promo: 22, stock: 3, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1002', photo_principale: PX(185848) },
  { id: 3,  titre: 'Assortiment de petites voitures',      prix: 18, stock: 30, categorie: 'Véhicules',        description: 'Exemple de produit de démonstration.', sku: 'VE-2001', photo_principale: PX(2767817) },
  { id: 4,  titre: 'Circuit de course et voitures',        prix: 59, prix_promo: 49, stock: 9, categorie: 'Véhicules', description: 'Exemple de produit de démonstration.', sku: 'VE-2002', photo_principale: PX(3567681) },
  { id: 5,  titre: 'Casse-tête de 100 pièces',             prix: 16, stock: 20, categorie: 'Casse-têtes et jeux', description: 'Exemple de produit de démonstration.', sku: 'CA-3001', photo_principale: PX(6255656) },
  { id: 6,  titre: 'Jeu de logique en bois',               prix: 27, stock: 8,  categorie: 'Casse-têtes et jeux', description: 'Exemple de produit de démonstration.', sku: 'CA-3002', photo_principale: PX(7296496) },
  { id: 7,  titre: 'Jouet alphabet à manipuler',           prix: 21, stock: 4,  categorie: 'Apprentissage',    description: 'Exemple de produit de démonstration.', sku: 'AP-4001', photo_principale: PX(7334320) },
  { id: 8,  titre: 'Géoplan à élastiques',                 prix: 19, stock: 12, categorie: 'Apprentissage',    description: 'Exemple de produit de démonstration.', sku: 'AP-4002', photo_principale: PX(8504340) },
  { id: 9,  titre: 'Ours en peluche classique',            prix: 32, stock: 10, categorie: 'Peluches',          description: 'Exemple de produit de démonstration.', sku: 'PE-1003', photo_principale: PX(264917) },
  { id: 10, titre: 'Ourson brun et blanc',                 prix: 26, prix_promo: 20, stock: 7, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1004', photo_principale: PX(42230) },
];
const DEMO_ARTICLES_JOUETS = [
  { id: 9001, titre: 'Exemple : choisir un jouet selon l\'âge', slug: 'exemple-age', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5665500), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : jouer en famille', slug: 'exemple-famille', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7296490), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Idées', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : apprendre en jouant', slug: 'exemple-apprendre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6692843), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Éducation', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9004, titre: 'Exemple : cadeaux de fête', slug: 'exemple-fete', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(4487869), date_publication: new Date(Date.now() - 30 * 864e5).toISOString(), categorie: 'Cadeaux', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const DEMO_CONFIG_JOUETS = { jouets: {
  accueil: {
    hero: { titre: 'Des jouets qui font sourire', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(5665500, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' }, pastille: { titre: 'Trouver le bon jouet', sousTitre: 'Chercheur de cadeau', lien: 'chercheur' } },
    diaporama: [
      { titre: 'Jouer, *rire* et grandir', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(5665500, 1600) },
      { titre: 'Des cadeaux *magiques*', texte: 'Exemple de démonstration : un deuxième message de votre boutique.', bouton: 'Voir les peluches', lien: 'cat:Peluches', photo: PX(4487869, 1600) },
      { titre: 'Pleins feux sur les *véhicules*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les véhicules', lien: 'cat:Véhicules', photo: PX(4491563, 1600) },
    ],
    avantages: [],
    vedette: { titre: 'Meilleurs *vendeurs*', sousTitre: '', categorie: '', nombre: 10 },
    bandeaux: [{ titre: 'Un *été* de jeux', sousTitre: 'Exemple de démonstration', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4484785, 1800) }],
    presentation: { surtitre: 'Exemple de démonstration', titre: 'Des jouets *vraiment* spéciaux', texte: 'Exemple de démonstration : présentez ici votre boutique, vos valeurs et ce qui vous distingue.', bouton: 'En savoir plus', lien: 'a-propos' },
    tuiles: [
      { titre: 'Peluches', texte: 'Des câlins à chaque âge', bouton: 'Magasiner', lien: 'cat:Peluches', photo: PX(245914, 1200), couleur: '#1b1b4f' },
      { titre: 'Véhicules', texte: 'Vroum vroum', bouton: 'Magasiner', lien: 'cat:Véhicules', photo: PX(3567681, 1200), couleur: '#1d6fc4' },
    ],
    tuilesDisposition: 'large-premier',
    focus: { surtitre: 'Exemple', titre: 'Jeux de *logique*', bouton: 'Découvrir', lien: 'cat:Casse-têtes et jeux', photo: PX(7296496, 1200), titreDroite: 'Apprendre en s\'amusant', texte: 'Exemple de démonstration : décrivez ici un produit ou une collection à mettre en avant.', photoDroite: PX(8504340, 1200) },
    selection: { titre: 'Notre *sélection*', sousTitre: '', categorie: '', nombre: 10 },
    communaute: { titre: 'Joué, aimé et *partagé* par vous', sousTitre: 'Exemple de démonstration : ajoutez les photos de vos clients (avec leur permission).', items: `${PX(4491563)} | @exemple1 | \n${PX(6692843)} | @exemple2 | \n${PX(4487869)} | @exemple3 | \n${PX(7334320)} | @exemple4 | \n${PX(5665500)} | @exemple5 | \n${PX(4484785)} | @exemple6 | ` },
    chercheur: { titre: 'Trouvez le cadeau *parfait*', sousTitre: 'Choisissez un âge, un type de jouet et un budget.', ageLabel: 'Âge', typeLabel: 'Type de jouet', budgetLabel: 'Budget', bouton: 'Chercher', note: 'Exemple de démonstration : la recherche utilise les mots-clés ci-dessous dans vos fiches et le prix. Indiquez l\'âge dans vos fiches produits.', photo: PX(3567681, 1800),
      ageOptions: '0 à 2 ans | bébé\n3 à 5 ans | enfant\n6 à 8 ans | jeu', typeOptions: 'Peluches | peluche\nVéhicules | voiture\nCasse-têtes | casse-tête\nApprentissage | alphabet', budgetOptions: 'Moins de 20 $ | | 20\n20 $ à 30 $ | 20 | 30\n30 $ et plus | 30 | ' },
    ticker: { messages: 'Exemple : commandez avant 13 h pour une livraison le lendemain !\nExemple : un autre message de votre boutique', vitesse: 'normale', couleurFond: '#c2188a', couleurTexte: '#ffffff', couleurAccent: '#67e8f9', icone: '🎁', lien: '' },
    mosaique: { titre: '@exemple_boutique', sousTitre: 'Exemple de démonstration', items: `${PX(5665500)} | Exemple | Date | \n${PX(4487869)} | Exemple | Date | \n${PX(4491563)} | Exemple | Date | \n${PX(6692843)} | Exemple | Date | ` },
    chiffres: { titre: 'Pourquoi *magasiner* chez nous ?', sousTitre: 'Exemple de démonstration : remplacez ces chiffres par les vôtres (chiffres vrais seulement).', items: 'Exemple | 10+ | Années d\'expérience\nExemple | 500 | Jouets en magasin\nExemple | 24 h | Réponse aux courriels' },
    temoignagesTitre: 'Ce que disent nos clients',
    cercles: { titre: 'Magasiner par *âge*', items: `${PX(245914)} | 0 à 2 ans | catalogue\n${PX(7334320)} | 3 à 5 ans | catalogue\n${PX(6255656)} | 6 à 8 ans | catalogue\n${PX(8504340)} | 9 ans et plus | catalogue` },
    tuiles2: [
      { titre: 'Boutique *filles*', texte: 'Exemple', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4487869, 1200), couleur: '#c2188a' },
      { titre: 'Boutique *garçons*', texte: 'Exemple', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4491563, 1200), couleur: '#1d6fc4' },
    ],
    tuiles2Disposition: 'egale',
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
  },
  footer: { nomBoutique: 'Ma boutique de jouets', slogan: 'Exemple de démonstration', afficherPropulse: true,
    bande: 'Paiement sécurisé | Exemple\nLivraison | Exemple\nAide | Exemple',
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: PX(7296490, 800) },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Gothique : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_GOTHIQUE = [
  { id: 1,  titre: 'Veste de cuir noire',            prix: 189, prix_promo: 149, stock: 3, categorie: 'Vêtements',   description: 'Exemple de produit de démonstration.', sku: 'VE-1001', photo_principale: PX(6044127) },
  { id: 2,  titre: 'Chandail à capuchon noir',       prix: 79,  stock: 14, categorie: 'Vêtements',   description: 'Exemple de produit de démonstration.', sku: 'VE-1002', photo_principale: PX(8206318) },
  { id: 3,  titre: 'T-shirt noir',                   prix: 39,  stock: 30, categorie: 'Vêtements',   description: 'Exemple de produit de démonstration.', sku: 'VE-1003', photo_principale: PX(8532616) },
  { id: 4,  titre: 'Bottes noires',                  prix: 159, stock: 9,  categorie: 'Chaussures',  description: 'Exemple de produit de démonstration.', sku: 'CH-2001', photo_principale: PX(2929281) },
  { id: 5,  titre: 'Souliers noirs',                 prix: 129, prix_promo: 99, stock: 6, categorie: 'Chaussures', description: 'Exemple de produit de démonstration.', sku: 'CH-2002', photo_principale: PX(27274312) },
  { id: 6,  titre: 'Bague argentée',                 prix: 45,  stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-3001', photo_principale: PX(2732096) },
  { id: 7,  titre: 'Bijoux argentés',                prix: 65,  stock: 8,  categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-3002', photo_principale: PX(20719544) },
  { id: 8,  titre: 'Sac de cuir noir',               prix: 119, stock: 4,  categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-3003', photo_principale: PX(2962086) },
  { id: 9,  titre: 'Sac à main noir',                prix: 99,  stock: 12, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-3004', photo_principale: PX(16484534) },
  { id: 10, titre: 'Lunettes noires',                prix: 55,  prix_promo: 42, stock: 7, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-3005', photo_principale: PX(31305965) },
];
const DEMO_ARTICLES_GOTHIQUE = [
  { id: 9001, titre: 'Exemple : composer une tenue tout en noir', slug: 'exemple-noir', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7679725), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Style', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : entretenir le cuir', slug: 'exemple-cuir', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6045049), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : nos accessoires préférés', slug: 'exemple-accessoires', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(12901704), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Idées', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const DEMO_CONFIG_GOTHIQUE = { gothique: {
  accueil: {
    hero: { titre: 'Nouvelle collection', sousTitre: '', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(3109671, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { titre: 'Nouvelle collection', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(3109671, 1600) },
      { titre: 'Après la tombée du jour', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les vêtements', lien: 'cat:Vêtements', photo: PX(11048654, 1600) },
      { titre: 'Pas à pas', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les chaussures', lien: 'cat:Chaussures', photo: PX(17955862, 1600) },
    ],
    ticker: { messages: 'Exemple : un premier message de votre boutique\nExemple : un autre message de votre boutique', vitesse: 'normale', icone: '✦', lien: '' },
    ticker2: { messages: 'Exemple : un message pour vos clients\nExemple : une autre annonce', vitesse: 'lente', icone: '✦', lien: '' },
    focus: { titre: 'Titre', texte: 'Exemple de démonstration : décrivez ici une collection à mettre en avant.', bouton: 'Découvrir', lien: 'cat:Vêtements', photo: PX(983497, 1200), categorie: '' },
    vedette: { titre: 'Meilleurs vendeurs', sousTitre: '', categorie: '', nombre: 6 },
    bandeaux: [{ titre: 'Après la nuit', bouton: '', lien: 'catalogue', photo: PX(13160240, 1800) }],
    collections: { titre: 'Magasiner par collection', items: 'Nouveautés | catalogue\nVêtements | cat:Vêtements\nChaussures | cat:Chaussures\nAccessoires | cat:Accessoires' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 6 },
    affiche: { texte: 'SOLDES jusqu\'à 70 %', couleurFond: '#ffffff', couleurTexte: '#000000', lien: 'catalogue' },
    temoignagesTitre: 'Avis',
    blogApercu: { titre: 'Blogue', bouton: 'Lire le blogue' },
  },
  footer: { nomBoutique: 'Nocturne', slogan: '', texte: 'Exemple de démonstration : présentez ici votre boutique en quelques lignes.', afficherPropulse: true, paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse BD : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_BD = [
  { id: 1,  titre: 'Lot de bandes dessinées d\'aventure', prix: 25, stock: 14, categorie: 'Bandes dessinées', description: 'Exemple de produit de démonstration.', sku: 'BD-1001', photo_principale: PX(7809122) },
  { id: 2,  titre: 'Collection de revues illustrées',     prix: 18, prix_promo: 14, stock: 3, categorie: 'Bandes dessinées', description: 'Exemple de produit de démonstration.', sku: 'BD-1002', photo_principale: PX(6654177) },
  { id: 3,  titre: 'Assortiment de bandes dessinées',     prix: 32, stock: 30, categorie: 'Bandes dessinées', description: 'Exemple de produit de démonstration.', sku: 'BD-1003', photo_principale: PX(6654172) },
  { id: 4,  titre: 'Album à collectionner',               prix: 29, stock: 9,  categorie: 'Romans graphiques', description: 'Exemple de produit de démonstration.', sku: 'RG-2001', photo_principale: PX(5883534) },
  { id: 5,  titre: 'Pile de bandes dessinées',            prix: 45, prix_promo: 39, stock: 6, categorie: 'Romans graphiques', description: 'Exemple de produit de démonstration.', sku: 'RG-2002', photo_principale: PX(7524998) },
  { id: 6,  titre: 'Lot de mangas',                       prix: 38, stock: 20, categorie: 'Mangas', description: 'Exemple de produit de démonstration.', sku: 'MA-3001', photo_principale: PX(18848524) },
  { id: 7,  titre: 'Bande dessinée jeunesse',             prix: 15, stock: 12, categorie: 'Jeunesse', description: 'Exemple de produit de démonstration.', sku: 'JE-4001', photo_principale: PX(8342186) },
  { id: 8,  titre: 'Vitrine de bandes dessinées',         prix: 52, stock: 4,  categorie: 'Romans graphiques', description: 'Exemple de produit de démonstration.', sku: 'RG-2003', photo_principale: PX(20085947) },
  { id: 9,  titre: 'Carnet de croquis',                   prix: 12, stock: 25, categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-5001', photo_principale: PX(6044265) },
  { id: 10, titre: 'Tablette à dessin',                   prix: 89, stock: 7,  categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-5002', photo_principale: PX(7147701) },
];
const DEMO_ARTICLES_BD = [
  { id: 9001, titre: 'Exemple : par où commencer en bande dessinée', slug: 'exemple-debuter', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(8342186), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : bien conserver sa collection', slug: 'exemple-conserver', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7809122), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Collection', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : rencontre avec un illustrateur', slug: 'exemple-illustrateur', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7859510), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Entrevues', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const BD_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_BD = { bd: {
  accueil: {
    hero: { titre: 'Des histoires à lire', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(6654172, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { titre: 'Des *aventures* à portée de main', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Découvrir', lien: 'catalogue', photo: PX(6654172, 1600) },
      { titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(7809122, 1600) },
      { titre: 'Collectionnez, lisez, *partagez*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les romans graphiques', lien: 'cat:Romans graphiques', photo: PX(5883534, 1600) },
    ],
    ticker: { messages: 'Exemple : un premier message de votre boutique\nExemple : un autre message de votre boutique', vitesse: 'normale', couleurFond: '#ffd93b', couleurTexte: '#001a3d', icone: '💥', lien: '' },
    marques: { items: ' | Éditeur exemple 1 | \n | Éditeur exemple 2 | \n | Éditeur exemple 3 | \n | Éditeur exemple 4 | \n | Éditeur exemple 5 | ' },
    tuiles: [
      { titre: 'Des albums à *vendre* ?', texte: 'Exemple de démonstration : décrivez ici votre service de rachat.', bouton: 'Nous joindre', lien: 'contact', photo: PX(7524998, 1000), couleur: '' },
      { titre: 'Nos *romans graphiques*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Romans graphiques', photo: PX(20085947, 1000), couleur: '' },
    ],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(7859510, 1000), categorie: '', nombre: 10 },
    decompte: { titre: 'Les *abonnements* démarrent bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: BD_FIN_DEMO, photo: PX(6654177, 1600), bouton: 'En savoir plus', lien: 'contact' },
    vedette: { titre: 'Nos *favoris*', sousTitre: '', categorie: '', nombre: 10 },
    bandeaux: [{ titre: 'Nos artistes *dessinent* pour vous', sousTitre: '', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(7147701, 1800) }],
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    presentation: { titre: 'À propos de la boutique', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    temoignagesTitre: 'Avis de nos clients',
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
  },
  footer: { nomBoutique: 'Ma boutique BD', slogan: 'Exemple de démonstration', afficherPropulse: true,
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Futuriste : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_FU = [
  { id: 1,  titre: 'Casque sans fil',          prix: 129, stock: 14, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1001', photo_principale: PX(1649771) },
  { id: 2,  titre: 'Écouteurs compacts',       prix: 79, prix_promo: 59, stock: 3, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1002', photo_principale: PX(10292808) },
  { id: 3,  titre: 'Montre connectée',         prix: 189, stock: 30, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2001', photo_principale: PX(5081914) },
  { id: 4,  titre: 'Clavier lumineux',         prix: 99, stock: 9,  categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3001', photo_principale: PX(28842075) },
  { id: 5,  titre: 'Clavier mécanique RVB',    prix: 149, prix_promo: 119, stock: 6, categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3002', photo_principale: PX(33888380) },
  { id: 6,  titre: 'Chaussures de sport',      prix: 140, stock: 20, categorie: 'Sport', description: 'Exemple de produit de démonstration.', sku: 'SP-4001', photo_principale: PX(12306282) },
  { id: 7,  titre: 'Paire d\'haltères',        prix: 65, stock: 12, categorie: 'Sport', description: 'Exemple de produit de démonstration.', sku: 'SP-4002', photo_principale: PX(7209145) },
  { id: 8,  titre: 'Ensemble clavier et souris', prix: 109, stock: 4,  categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3003', photo_principale: PX(28779689) },
  { id: 9,  titre: 'Bracelet d\'activité',     prix: 69, stock: 25, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2002', photo_principale: PX(7530583) },
  { id: 10, titre: 'Enceinte portable',        prix: 89, stock: 7,  categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1003', photo_principale: PX(9767549) },
];
const DEMO_ARTICLES_FU = [
  { id: 9001, titre: 'Exemple : bien choisir son casque', slug: 'exemple-casque', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(1649771), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : aménager un poste de jeu', slug: 'exemple-poste', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(28842075), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : reprendre la course', slug: 'exemple-course', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(2524744), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Sport', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const FU_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_FUTURISTE = { futuriste: {
  accueil: {
    hero: { titre: 'Passez au niveau supérieur', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(9996339, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { titre: 'Passez au *niveau* supérieur', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(9996339, 1600) },
      { titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(12555415, 1600) },
      { titre: 'Équipez votre *poste de jeu*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir le jeu', lien: 'cat:Jeu', photo: PX(28842075, 1600) },
    ],
    ticker: { messages: 'Exemple : un premier message de votre boutique\nExemple : un autre message de votre boutique', vitesse: 'normale', couleurFond: '#8c3dff', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '⚡', lien: '' },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(2524744, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'Magasiner', lien: 'catalogue' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(1649771, 1200), inverser: false },
    bandeaux: [{ titre: 'Transformez votre *espace*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', photo: PX(33888380, 1800) }],
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(12306282, 1000), couleur: '' },
      { titre: 'Notre *audio*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Audio', photo: PX(10292808, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(12555414, 1000), categorie: '', nombre: 10 },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: FU_FIN_DEMO, photo: PX(9996339, 1600), bouton: 'En savoir plus', lien: 'contact' },
    vedette: { titre: 'Nos *favoris*', sousTitre: '', categorie: '', nombre: 10 },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nTroisième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    pastilles: { titre: 'Nos garanties', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n💬 | Service à la clientèle\n⭐ | Sélection soignée\n🎁 | Emballage soigné' },
    temoignagesTitre: 'Avis de nos clients',
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.\nTroisième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
  },
  footer: { nomBoutique: 'Ma boutique Futuriste', slogan: 'Exemple de démonstration', afficherPropulse: true,
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Tech : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_TECH = [
  { id: 1,  titre: 'Manette sans fil',          prix: 79, stock: 14, categorie: 'Manettes', description: 'Exemple de produit de démonstration.', sku: 'MA-1001', photo_principale: PX(6006298) },
  { id: 2,  titre: 'Manette blanche',           prix: 69, prix_promo: 54, stock: 3, categorie: 'Manettes', description: 'Exemple de produit de démonstration.', sku: 'MA-1002', photo_principale: PX(4497076) },
  { id: 3,  titre: 'Casque audio',              prix: 129, stock: 30, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-2001', photo_principale: PX(1649771) },
  { id: 4,  titre: 'Écouteurs compacts',        prix: 79, prix_promo: 59, stock: 9, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-2002', photo_principale: PX(10292808) },
  { id: 5,  titre: 'Clavier mécanique RVB',     prix: 149, prix_promo: 119, stock: 6, categorie: 'Claviers', description: 'Exemple de produit de démonstration.', sku: 'CL-3001', photo_principale: PX(33888380) },
  { id: 6,  titre: 'Clavier lumineux',          prix: 99, stock: 9, categorie: 'Claviers', description: 'Exemple de produit de démonstration.', sku: 'CL-3002', photo_principale: PX(28842075) },
  { id: 7,  titre: 'Ensemble clavier et souris', prix: 109, stock: 4, categorie: 'Claviers', description: 'Exemple de produit de démonstration.', sku: 'CL-3003', photo_principale: PX(28779689) },
  { id: 8,  titre: 'Casque de réalité virtuelle', prix: 399, stock: 5, categorie: 'Réalité virtuelle', description: 'Exemple de produit de démonstration.', sku: 'VR-4001', photo_principale: PX(7776217) },
  { id: 9,  titre: 'Montre connectée',          prix: 189, stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-5001', photo_principale: PX(5081914) },
  { id: 10, titre: 'Enceinte portable',         prix: 89, stock: 7, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-2003', photo_principale: PX(9767549) },
];
const DEMO_ARTICLES_TECH = [
  { id: 9001, titre: 'Exemple : bien choisir sa manette', slug: 'exemple-manette', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6006298), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : aménager un poste de jeu', slug: 'exemple-poste', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(38498457), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : choisir un clavier', slug: 'exemple-clavier', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(33888380), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const TK_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_TECH = { tech: {
  accueil: {
    hero: { titre: 'Passez au niveau supérieur', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(38498457, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Un poste de jeu *sans limite*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(38498457, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(34697345, 1600) },
      { surtitre: 'Claviers', titre: 'Écrivez, jouez, *dominez*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les claviers', lien: 'cat:Claviers', photo: PX(31018745, 1600) },
    ],
    ticker: { messages: 'Exemple : un premier message de votre boutique\nExemple : un autre message de votre boutique', vitesse: 'normale', couleurFond: '#6d28d9', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '🎮', lien: '' },
    mosaique: { titre: 'Magasiner par *catégorie*', sousTitre: 'Exemple de démonstration', fantome: 'Catégories', items: 'Manettes | ' + PX(6006298, 800) + ' | cat:Manettes\nAudio | ' + PX(1649771, 800) + ' | cat:Audio\nClaviers | ' + PX(33888380, 1000) + ' | cat:Claviers\nRéalité virtuelle | ' + PX(7776217, 1000) + ' | cat:Réalité virtuelle' },
    vedette: { titre: 'Nos *favoris*', sousTitre: 'Exemple de démonstration', fantome: 'Favoris', categorie: '', nombre: 10 },
    bandeaux: [{ titre: 'Transformez votre *espace*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(33050961, 1800) }],
    details: { titre: 'Pensé pour la *performance*', sousTitre: 'Exemple de démonstration', fantome: 'Détails', photo: PX(33888380, 900), points: 'Touches mécaniques | Exemple de démonstration : décrivez ici un point fort réel.\nÉclairage RVB | Exemple de démonstration : un deuxième point fort.\nSans fil | Exemple de démonstration : un troisième point fort.\nBatterie longue durée | Exemple de démonstration : un quatrième point fort.', bouton: 'Voir le produit', lien: 'catalogue' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', fantome: 'Nouveau', categorie: '', nombre: 10 },
    recherche: { titre: 'Vous n\'avez pas trouvé ce que vous cherchiez ?', bouton: 'Rechercher' },
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(13071304, 1000), categorie: '', nombre: 4 },
    comparatif: { titre: 'Comparez nos *casques*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', fantome: 'Comparer', produits: PX(1649771, 600) + ' | Casque audio | 129 $ | catalogue\n' + PX(10292808, 600) + ' | Écouteurs | 79 $ | catalogue\n' + PX(7776217, 600) + ' | Casque VR | 399 $ | catalogue', criteres: 'Autonomie | 30 h | 8 h | 3 h\nConnexion | Sans fil | Sans fil | Sans fil\nGarantie | 1 an | 1 an | 2 ans' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesFantome: 'Avis', temoignagesPhoto: PX(34697345, 1000),
    avantages: [],
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(31018745, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(1649771, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(4497076, 1000), couleur: '' },
      { titre: 'Notre *audio*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Audio', photo: PX(10292808, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: TK_FIN_DEMO, photo: PX(34697345, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    pastilles: { titre: 'Nos garanties', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n💬 | Service à la clientèle\n⭐ | Sélection soignée\n🎁 | Emballage soigné' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
  },
  footer: { nomBoutique: 'Ma boutique Tech', slogan: 'Exemple de démonstration', afficherPropulse: true,
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Rosé : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_ROSE = [
  { id: 1,  titre: 'Sérum éclat',          prix: 48, stock: 14, categorie: 'Soins visage', description: 'Exemple de produit de démonstration.', sku: 'SV-1001', photo_principale: PX(15930068) },
  { id: 2,  titre: 'Sérum hydratant',      prix: 42, prix_promo: 34, stock: 3, categorie: 'Soins visage', description: 'Exemple de produit de démonstration.', sku: 'SV-1002', photo_principale: PX(4841353) },
  { id: 3,  titre: 'Crème douceur',        prix: 36, stock: 30, categorie: 'Soins visage', description: 'Exemple de produit de démonstration.', sku: 'SV-1003', photo_principale: PX(13516789) },
  { id: 4,  titre: 'Crème en pot rose',    prix: 29, prix_promo: 24, stock: 9, categorie: 'Soins visage', description: 'Exemple de produit de démonstration.', sku: 'SV-1004', photo_principale: PX(13006781) },
  { id: 5,  titre: 'Rouge à lèvres rose',  prix: 24, prix_promo: 19, stock: 6, categorie: 'Maquillage', description: 'Exemple de produit de démonstration.', sku: 'MQ-2001', photo_principale: PX(2533266) },
  { id: 6,  titre: 'Duo de rouges',        prix: 32, stock: 9, categorie: 'Maquillage', description: 'Exemple de produit de démonstration.', sku: 'MQ-2002', photo_principale: PX(3373746) },
  { id: 7,  titre: 'Poudre rose pastel',   prix: 27, stock: 4, categorie: 'Maquillage', description: 'Exemple de produit de démonstration.', sku: 'MQ-2003', photo_principale: PX(8776814) },
  { id: 8,  titre: 'Parfum fleuri',        prix: 78, stock: 5, categorie: 'Parfums', description: 'Exemple de produit de démonstration.', sku: 'PF-3001', photo_principale: PX(12563417) },
  { id: 9,  titre: 'Parfum flacon rose',   prix: 69, stock: 20, categorie: 'Parfums', description: 'Exemple de produit de démonstration.', sku: 'PF-3002', photo_principale: PX(9957576) },
  { id: 10, titre: 'Bombe de bain',        prix: 9, stock: 40, categorie: 'Bain et corps', description: 'Exemple de produit de démonstration.', sku: 'BC-4001', photo_principale: PX(7175328) },
  { id: 11, titre: 'Trio de bombes de bain', prix: 24, stock: 12, categorie: 'Bain et corps', description: 'Exemple de produit de démonstration.', sku: 'BC-4002', photo_principale: PX(6724360) },
  { id: 12, titre: 'Crème pour les mains', prix: 18, stock: 25, categorie: 'Bain et corps', description: 'Exemple de produit de démonstration.', sku: 'BC-4003', photo_principale: PX(27393233) },
];
const DEMO_ARTICLES_ROSE = [
  { id: 9001, titre: 'Exemple : composer sa routine du soir', slug: 'exemple-routine', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7143283), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : bien choisir son sérum', slug: 'exemple-serum', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(4841353), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : un bain tout en douceur', slug: 'exemple-bain', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6724360), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const ROSE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_ROSE = { rose: {
  accueil: {
    hero: { titre: 'Un peu de rose dans votre quotidien', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(6543153, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Une peau *douce*, un teint rose', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(6543153, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(11179672, 1600) },
      { surtitre: 'Parfums', titre: 'Des parfums qui *fleurissent*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les parfums', lien: 'cat:Parfums', photo: PX(7524968, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *favoris*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des soins {1} choisis avec amour, une routine {2} simple et des produits {3} faits pour vous', photos: PX(5912194, 500) + '\n' + PX(13516789, 500) + '\n' + PX(2533266, 500), sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(5240446, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Soins visage', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre soin', titre: 'Quelle est votre priorité du moment ?', photo: PX(3762562, 1000), options: 'Hydrater en profondeur | cat:Soins visage\nUn teint éclatant | cat:Maquillage\nUn parfum qui me ressemble | cat:Parfums\nUn moment de détente | cat:Bain et corps' },
    comparatif: { titre: 'Comparez nos *sérums*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos sérums', produits: PX(15930068, 600) + ' | Sérum éclat | 48 $ | catalogue\n' + PX(4841353, 600) + ' | Sérum hydratant | 42 $ | catalogue\n' + PX(13516789, 600) + ' | Crème douceur | 36 $ | catalogue', criteres: 'Sans parfum | oui | oui | non\nPeaux sensibles | oui | oui | oui\nFormat | 30 ml | 30 ml | 50 ml\nÉcoresponsable | non | oui | oui' },
    temoignagesTitre: 'Avis de nos *clientes*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(5912194, 700) + '\n' + PX(29044029, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(6621025, 600) + ' | catalogue\n' + PX(6543149, 600) + ' | catalogue\n' + PX(7143283, 600) + ' | catalogue\n' + PX(15108320, 600) + ' | catalogue\n' + PX(3910068, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🌸 | Sélection soignée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Rosé' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#e0147a', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '🌸', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *vous*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(6621033, 1800) }],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(3910068, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(7321491, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(5912194, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(2533266, 1000), couleur: '' },
      { titre: 'Nos *parfums*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Parfums', photo: PX(9957574, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: ROSE_FIN_DEMO, photo: PX(11179672, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Rosée', slogan: 'Exemple de démonstration', afficherPropulse: true,
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Bonbon : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_BONBON = [
  { id: 1,  titre: 'Mélange de bonbons colorés', prix: 8,  stock: 40, categorie: 'Bonbons', description: 'Exemple de produit de démonstration.', sku: 'BO-1001', photo_principale: PX(5469042) },
  { id: 2,  titre: 'Bonbons aux fruits',         prix: 7,  prix_promo: 5, stock: 3, categorie: 'Bonbons', description: 'Exemple de produit de démonstration.', sku: 'BO-1002', photo_principale: PX(1906435) },
  { id: 3,  titre: 'Guimauves arc-en-ciel',      prix: 6,  stock: 25, categorie: 'Bonbons', description: 'Exemple de produit de démonstration.', sku: 'BO-1003', photo_principale: PX(325526) },
  { id: 4,  titre: 'Sucettes cœur',              prix: 9,  prix_promo: 7, stock: 12, categorie: 'Sucettes', description: 'Exemple de produit de démonstration.', sku: 'SU-2001', photo_principale: PX(9852065) },
  { id: 5,  titre: 'Sucettes animaux',           prix: 10, stock: 0, categorie: 'Sucettes', description: 'Exemple de produit de démonstration.', sku: 'SU-2002', photo_principale: PX(17107430) },
  { id: 6,  titre: 'Sucettes jaunes',            prix: 8,  stock: 18, categorie: 'Sucettes', description: 'Exemple de produit de démonstration.', sku: 'SU-2003', photo_principale: PX(4475279) },
  { id: 7,  titre: 'Ourson en peluche',          prix: 24, stock: 9, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-3001', photo_principale: PX(245914) },
  { id: 8,  titre: 'Gros ourson blanc',          prix: 39, prix_promo: 32, stock: 5, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-3002', photo_principale: PX(754178) },
  { id: 9,  titre: 'Ourson de naissance',        prix: 19, stock: 14, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-3003', photo_principale: PX(54547) },
  { id: 10, titre: 'Blocs en bois colorés',      prix: 29, stock: 11, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-4001', photo_principale: PX(6990329) },
  { id: 11, titre: 'Blocs de construction',      prix: 22, stock: 20, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-4002', photo_principale: PX(7304419) },
  { id: 12, titre: 'Ballons pastel',             prix: 12, stock: 30, categorie: 'Fête', description: 'Exemple de produit de démonstration.', sku: 'FE-5001', photo_principale: PX(3905855) },
];
const DEMO_ARTICLES_BONBON = [
  { id: 9001, titre: 'Exemple : organiser une fête colorée', slug: 'exemple-fete', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(796606), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : choisir un premier jouet', slug: 'exemple-jouet', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7269707), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : des idées de cadeaux', slug: 'exemple-cadeaux', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(245914), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const BONBON_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_BONBON = { bonbon: {
  accueil: {
    hero: { titre: 'Un peu de couleur dans votre quotidien', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(796606, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Des bonbons de toutes les *couleurs*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(1875919, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(3905885, 1600) },
      { surtitre: 'Peluches', titre: 'Des peluches à *câliner*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les peluches', lien: 'cat:Peluches', photo: PX(5719233, 1600) },
    ],
    lateral: { actif: true, titreCategories: 'Catégories', titreSocial: 'Restez en contact', texteSocial: 'Exemple de démonstration : suivez-nous.', titrePopulaires: 'Produits populaires', nombre: 4 },
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *favoris*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Chaque jour, on choisit avec amour ce qui fait *sourire* les petits et les grands', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: 'Découvrez nos *spéciaux*', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir les spéciaux', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(7304419, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Jeux', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez le bon cadeau', titre: 'Qu\'est-ce qui lui ferait plaisir ?', photo: PX(3661389, 1000), options: 'Des friandises | cat:Bonbons\nUne peluche | cat:Peluches\nUn jeu | cat:Jeux\nDe quoi faire la fête | cat:Fête' },
    comparatif: { titre: 'Comparez nos *peluches*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos peluches', produits: PX(245914, 600) + ' | Ourson | 24 $ | catalogue\n' + PX(754178, 600) + ' | Gros ourson blanc | 39 $ | catalogue\n' + PX(54547, 600) + ' | Ourson de naissance | 19 $ | catalogue', criteres: 'Lavable | oui | oui | oui\nDès la naissance | non | non | oui\nFormat | moyen | grand | petit' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(3661390, 700) + '\n' + PX(5997574, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(4474779, 600) + ' | catalogue\n' + PX(6951987, 600) + ' | catalogue\n' + PX(5560639, 600) + ' | catalogue\n' + PX(11308362, 600) + ' | catalogue\n' + PX(3905855, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🍬 | Sélection soignée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Bonbon' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#d81e7c', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '🍬', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *vous*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(796606, 1800) }],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(1875919, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(7117345, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(3661386, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(9852065, 1000), couleur: '' },
      { titre: 'Nos *peluches*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Peluches', photo: PX(5719233, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: BONBON_FIN_DEMO, photo: PX(3905885, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Bonbon', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Soleil : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_SOLEIL = [
  { id: 1,  titre: 'Ourson en peluche',        prix: 24, stock: 9,  categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1001', photo_principale: PX(245914) },
  { id: 2,  titre: 'Gros ourson blanc',        prix: 39, prix_promo: 32, stock: 5, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1002', photo_principale: PX(754178) },
  { id: 3,  titre: 'Ourson de naissance',      prix: 19, stock: 0,  categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1003', photo_principale: PX(54547) },
  { id: 4,  titre: 'Ourson brun',              prix: 27, prix_promo: 21, stock: 12, categorie: 'Peluches', description: 'Exemple de produit de démonstration.', sku: 'PE-1004', photo_principale: PX(860882) },
  { id: 5,  titre: 'Blocs en bois colorés',    prix: 29, stock: 11, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-2001', photo_principale: PX(6990329) },
  { id: 6,  titre: 'Blocs de construction',    prix: 22, stock: 20, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-2002', photo_principale: PX(7304419) },
  { id: 7,  titre: 'Blocs en bois naturel',    prix: 25, stock: 14, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-2003', photo_principale: PX(7269693) },
  { id: 8,  titre: 'Briques colorées',         prix: 18, prix_promo: 14, stock: 30, categorie: 'Jeux', description: 'Exemple de produit de démonstration.', sku: 'JE-2004', photo_principale: PX(298825) },
  { id: 9,  titre: 'Ballons pastel',           prix: 12, stock: 30, categorie: 'Fête', description: 'Exemple de produit de démonstration.', sku: 'FE-3001', photo_principale: PX(3905855) },
  { id: 10, titre: 'Ballons et confettis',     prix: 9,  stock: 40, categorie: 'Fête', description: 'Exemple de produit de démonstration.', sku: 'FE-3002', photo_principale: PX(796606) },
  { id: 11, titre: 'Ballons assortis',         prix: 8,  stock: 25, categorie: 'Fête', description: 'Exemple de produit de démonstration.', sku: 'FE-3003', photo_principale: PX(772478) },
  { id: 12, titre: 'Ballons pastel (lot)',     prix: 15, stock: 18, categorie: 'Fête', description: 'Exemple de produit de démonstration.', sku: 'FE-3004', photo_principale: PX(3905885) },
];
const DEMO_ARTICLES_SOLEIL = [
  { id: 9001, titre: 'Exemple : organiser une fête colorée', slug: 'exemple-fete', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(796606), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : choisir un premier jouet', slug: 'exemple-jouet', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7269707), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : des idées de cadeaux', slug: 'exemple-cadeaux', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(245914), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const SOLEIL_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_SOLEIL = { soleil: {
  accueil: {
    hero: { titre: 'Du soleil dans votre quotidien', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(796606, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Des jouets pour *rêver*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(796606, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(3905885, 1600) },
      { surtitre: 'Peluches', titre: 'Des peluches à *câliner*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les peluches', lien: 'cat:Peluches', photo: PX(5719233, 1600) },
    ],
    lateral: { actif: true, titreCategories: 'Catégories', titreSocial: 'Restez en contact', texteSocial: 'Exemple de démonstration : suivez-nous.', titrePopulaires: 'Produits populaires', nombre: 5 },
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *favoris*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Chaque jour, on choisit avec amour ce qui fait *sourire* les petits et les grands', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: 'Une grande *vente* de saison', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir les spéciaux', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(7304419, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Jeux', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez le bon cadeau', titre: 'Qu\'est-ce qui lui ferait plaisir ?', photo: PX(3661389, 1000), options: 'Une peluche | cat:Peluches\nUn jeu | cat:Jeux\nDe quoi faire la fête | cat:Fête' },
    comparatif: { titre: 'Comparez nos *peluches*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos peluches', produits: PX(245914, 600) + ' | Ourson | 24 $ | catalogue\n' + PX(754178, 600) + ' | Gros ourson blanc | 39 $ | catalogue\n' + PX(54547, 600) + ' | Ourson de naissance | 19 $ | catalogue', criteres: 'Lavable | oui | oui | oui\nDès la naissance | non | non | oui\nFormat | moyen | grand | petit' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(3661390, 700) + '\n' + PX(5997574, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(245914, 600) + ' | catalogue\n' + PX(6951987, 600) + ' | catalogue\n' + PX(5560639, 600) + ' | catalogue\n' + PX(772478, 600) + ' | catalogue\n' + PX(3905855, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n☀️ | Sélection soignée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Soleil' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#c95500', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '☀️', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *vous*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(796606, 1800) }],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(1875919, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(7117345, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(3661386, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(754178, 1000), couleur: '' },
      { titre: 'Nos *peluches*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Peluches', photo: PX(5719233, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: SOLEIL_FIN_DEMO, photo: PX(3905885, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Soleil', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };
// Simplisse Sentier : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_SENTIER = [
  { id: 1,  titre: 'Vélo de sentier',        prix: 1899, stock: 4,  categorie: 'Vélos', description: 'Exemple de produit de démonstration.', sku: 'VE-1001', photo_principale: PX(9287747) },
  { id: 2,  titre: 'Vélo tout-terrain',      prix: 2499, prix_promo: 2199, stock: 2, categorie: 'Vélos', description: 'Exemple de produit de démonstration.', sku: 'VE-1002', photo_principale: PX(8926961) },
  { id: 3,  titre: 'Vélo enduro vert',       prix: 3299, stock: 0,  categorie: 'Vélos', description: 'Exemple de produit de démonstration.', sku: 'VE-1003', photo_principale: PX(90454) },
  { id: 4,  titre: 'Vélo de route rouge',    prix: 1599, stock: 6,  categorie: 'Vélos', description: 'Exemple de produit de démonstration.', sku: 'VE-1004', photo_principale: PX(8060703) },
  { id: 5,  titre: 'Casque de sentier',      prix: 149, stock: 15, categorie: 'Casques', description: 'Exemple de produit de démonstration.', sku: 'CA-2001', photo_principale: PX(19431254) },
  { id: 6,  titre: 'Casque intégral',        prix: 229, prix_promo: 189, stock: 8, categorie: 'Casques', description: 'Exemple de produit de démonstration.', sku: 'CA-2002', photo_principale: PX(5836902) },
  { id: 7,  titre: 'Casque noir',            prix: 119, stock: 20, categorie: 'Casques', description: 'Exemple de produit de démonstration.', sku: 'CA-2003', photo_principale: PX(5807803) },
  { id: 8,  titre: 'Casque léger',           prix: 99,  stock: 12, categorie: 'Casques', description: 'Exemple de produit de démonstration.', sku: 'CA-2004', photo_principale: PX(12031140) },
  { id: 9,  titre: 'Mise au point complète', prix: 129, stock: 30, categorie: 'Atelier', description: 'Exemple de service de démonstration.', sku: 'AT-3001', photo_principale: PX(10263877) },
  { id: 10, titre: 'Réparation de roue',     prix: 59,  stock: 30, categorie: 'Atelier', description: 'Exemple de service de démonstration.', sku: 'AT-3002', photo_principale: PX(33506466) },
];
const DEMO_ARTICLES_SENTIER = [
  { id: 9001, titre: 'Exemple : choisir son premier vélo de sentier', slug: 'exemple-fete', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(30925315), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : entretenir son vélo après la pluie', slug: 'exemple-entretien', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(23410485), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : bien choisir son casque', slug: 'exemple-cadeaux', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(245914), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const SENTIER_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_SENTIER = { sentier: {
  accueil: {
    hero: { titre: 'Prêt pour la prochaine descente', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(30925315, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Une nouvelle *saison* de sentiers', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(30925315, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(34382682, 1600) },
      { surtitre: 'Casques', titre: 'Roulez en *sécurité*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les casques', lien: 'cat:Casques', photo: PX(22812008, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *favoris*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des vélos et d\'équipement choisis par des *passionnés* de sentiers', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: 'Grande *vente* de fin de saison', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir les spéciaux', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(8926961, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Vélos', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre équipement', titre: 'Que cherchez-vous ?', photo: PX(28005837, 1000), options: 'Un vélo | cat:Vélos\nUn casque | cat:Casques\nUne mise au point | cat:Atelier' },
    comparatif: { titre: 'Comparez nos *casques*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos casques', produits: PX(19431254, 600) + ' | Casque de sentier | 149 $ | catalogue\n' + PX(5836902, 600) + ' | Casque intégral | 229 $ | catalogue\n' + PX(5807803, 600) + ' | Casque noir | 119 $ | catalogue', criteres: 'Mentonnière | non | oui | non\nVentilation | oui | oui | oui\nPoids | léger | lourd | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(12328608, 700) + '\n' + PX(5900725, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(12328608, 600) + ' | catalogue\n' + PX(6937088, 600) + ' | catalogue\n' + PX(3569754, 600) + ' | catalogue\n' + PX(163491, 600) + ' | catalogue\n' + PX(1174106, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🚵 | Sélection soignée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Sentier' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#5d7157', couleurTexte: '#ffffff', couleurAccent: '#ffffff', icone: '🚵', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *vous*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(34382682, 1800) }],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(2248713, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(10263877, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(33506466, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(9287747, 1000), couleur: '' },
      { titre: 'Nos *casques*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Casques', photo: PX(5719233, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Un *lancement* approche', sousTitre: 'Exemple de démonstration : date fictive', fin: SENTIER_FIN_DEMO, photo: PX(3905885, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Sentier', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Chantier : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_CHANTIER = [
  { id: 1,  titre: 'Perceuse sans fil',      prix: 129, stock: 8,  categorie: 'Outils électriques', description: 'Exemple de produit de démonstration.', sku: 'OE-1001', photo_principale: PX(8811530) },
  { id: 2,  titre: 'Perceuse à percussion',  prix: 159, prix_promo: 129, stock: 5, categorie: 'Outils électriques', description: 'Exemple de produit de démonstration.', sku: 'OE-1002', photo_principale: PX(6790808) },
  { id: 3,  titre: 'Scie circulaire',        prix: 189, stock: 0,  categorie: 'Outils électriques', description: 'Exemple de produit de démonstration.', sku: 'OE-1003', photo_principale: PX(20317629) },
  { id: 4,  titre: 'Meuleuse d\'angle',      prix: 99,  stock: 12, categorie: 'Outils électriques', description: 'Exemple de produit de démonstration.', sku: 'OE-1004', photo_principale: PX(5466156) },
  { id: 5,  titre: 'Coffret de douilles',    prix: 79,  stock: 15, categorie: 'Outils à main', description: 'Exemple de produit de démonstration.', sku: 'OM-2001', photo_principale: PX(9607054) },
  { id: 6,  titre: 'Ensemble d\'outils',     prix: 119, prix_promo: 89, stock: 9, categorie: 'Outils à main', description: 'Exemple de produit de démonstration.', sku: 'OM-2002', photo_principale: PX(175039) },
  { id: 7,  titre: 'Boîte à outils garnie',  prix: 149, stock: 6,  categorie: 'Outils à main', description: 'Exemple de produit de démonstration.', sku: 'OM-2003', photo_principale: PX(8985454) },
  { id: 8,  titre: 'Casque et gants',        prix: 45,  stock: 20, categorie: 'Sécurité', description: 'Exemple de produit de démonstration.', sku: 'SE-3001', photo_principale: PX(8488037) },
  { id: 9,  titre: 'Équipement de protection', prix: 39, stock: 25, categorie: 'Sécurité', description: 'Exemple de produit de démonstration.', sku: 'SE-3002', photo_principale: PX(8487733) },
  { id: 10, titre: 'Quincaillerie assortie', prix: 24,  stock: 40, categorie: 'Matériaux', description: 'Exemple de produit de démonstration.', sku: 'MA-4001', photo_principale: PX(19582317) },
];
const DEMO_ARTICLES_CHANTIER = [
  { id: 9001, titre: 'Exemple : choisir sa première perceuse', slug: 'exemple-perceuse', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5974053), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : bien équiper son atelier', slug: 'exemple-atelier', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5357150), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : la sécurité sur le chantier', slug: 'exemple-securite', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7788227), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const CHANTIER_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_CHANTIER = { chantier: {
  accueil: {
    hero: { titre: 'L\'avenir du chantier', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(8960996, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'L\'*avenir* du chantier', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(8960996, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *outils* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les outils', lien: 'catalogue', photo: PX(5974053, 1600) },
      { surtitre: 'Sécurité', titre: 'Travaillez en *sécurité*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir la sécurité', lien: 'cat:Sécurité', photo: PX(8488037, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *incontournables*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des outils et du matériel choisis par des *pros* du chantier', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offres* de la semaine', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir les offres', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(175039, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Outils à main', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre outil', titre: 'Que cherchez-vous ?', photo: PX(1029243, 1000), options: 'Un outil électrique | cat:Outils électriques\nUn outil à main | cat:Outils à main\nDe la sécurité | cat:Sécurité' },
    comparatif: { titre: 'Comparez nos *perceuses*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos outils', produits: PX(8811530, 600) + ' | Perceuse sans fil | 129 $ | catalogue\n' + PX(6790808, 600) + ' | Perceuse à percussion | 159 $ | catalogue\n' + PX(5974053, 600) + ' | Perceuse sur colonne | 249 $ | catalogue', criteres: 'Sans fil | oui | non | non\nPercussion | non | oui | non\nPoids | léger | moyen | lourd' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(7788227, 700) + '\n' + PX(8960996, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(1029243, 600) + ' | catalogue\n' + PX(5357150, 600) + ' | catalogue\n' + PX(9607054, 600) + ' | catalogue\n' + PX(8985454, 600) + ' | catalogue\n' + PX(19582317, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🔨 | Outils éprouvés' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Chantier' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#ffd60a', couleurTexte: '#1c1309', couleurAccent: '#1c1309', icone: '🔨', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *bâtir*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(8960996, 1800) }],
    focus: { titre: 'Outil *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(8811530, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(5710870, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(5710870, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(8811530, 1000), couleur: '' },
      { titre: 'Nos *équipements de sécurité*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Sécurité', photo: PX(8487733, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: CHANTIER_FIN_DEMO, photo: PX(175039, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma quincaillerie Chantier', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Café : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_CAFE = [
  { id: 1,  titre: 'Café en grains Colombie', prix: 18.5, stock: 24, categorie: 'Cafés', description: 'Exemple de produit de démonstration.', sku: 'CA-1001', photo_principale: PX(669162) },
  { id: 2,  titre: 'Café en grains Éthiopie', prix: 21, prix_promo: 17, stock: 15, categorie: 'Cafés', description: 'Exemple de produit de démonstration.', sku: 'CA-1002', photo_principale: PX(33788268) },
  { id: 3,  titre: 'Mélange maison', prix: 16, stock: 0, categorie: 'Cafés', description: 'Exemple de produit de démonstration.', sku: 'CA-1003', photo_principale: PX(1695052) },
  { id: 4,  titre: 'Torréfaction foncée', prix: 17.5, stock: 30, categorie: 'Cafés', description: 'Exemple de produit de démonstration.', sku: 'CA-1004', photo_principale: PX(585750) },
  { id: 5,  titre: 'Moulin à café manuel', prix: 59, stock: 8, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2001', photo_principale: PX(2159129) },
  { id: 6,  titre: 'Cafetière filtre V60', prix: 34, prix_promo: 27, stock: 12, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2002', photo_principale: PX(8004598) },
  { id: 7,  titre: 'Porte-filtre', prix: 42, stock: 6, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2003', photo_principale: PX(30899952) },
  { id: 8,  titre: 'Tasse à latte', prix: 14, stock: 40, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-2004', photo_principale: PX(11137171) },
  { id: 9,  titre: 'Coffret découverte', prix: 49, stock: 10, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3001', photo_principale: PX(894695) },
  { id: 10, titre: 'Abonnement mensuel', prix: 38, stock: 99, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3002', photo_principale: PX(4227012) },
];
const DEMO_ARTICLES_CAFE = [
  { id: 9001, titre: 'Exemple : réussir son café filtre', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(15672170), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : du grain à la tasse', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(4940744), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Coulisses', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : choisir sa mouture', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6205579), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const CAFE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_CAFE = { cafe: {
  accueil: {
    hero: { titre: 'Torréfié avec soin', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(4940744, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Torréfié avec *soin*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4940744, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *cafés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les cafés', lien: 'catalogue', photo: PX(6205579, 1600) },
      { surtitre: 'Cadeaux', titre: 'Un café *d\'exception*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les cadeaux', lien: 'cat:Cadeaux', photo: PX(30630942, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *cafés* préférés', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des grains choisis et torréfiés en petits lots pour un café *remarquable* à chaque tasse', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(8429813, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre café', titre: 'Que cherchez-vous ?', photo: PX(894695, 1000), options: 'Du café en grains | cat:Cafés\nDe l\'équipement | cat:Accessoires\nUn cadeau | cat:Cadeaux' },
    comparatif: { titre: 'Comparez nos *cafés*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos cafés', produits: PX(669162, 600) + ' | Colombie | 18,50 $ | catalogue\n' + PX(33788268, 600) + ' | Éthiopie | 21 $ | catalogue\n' + PX(585750, 600) + ' | Foncée | 17,50 $ | catalogue', criteres: 'Torréfaction | moyenne | claire | foncée\nNotes | chocolat | agrumes | noisette\nFormat | 340 g | 340 g | 340 g' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(4353572, 700) + '\n' + PX(9050554, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(11137171, 600) + ' | catalogue\n' + PX(4227012, 600) + ' | catalogue\n' + PX(30630942, 600) + ' | catalogue\n' + PX(6660543, 600) + ' | catalogue\n' + PX(8004598, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n☕ | Torréfié en petits lots' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Café' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#2a1608', couleurTexte: '#f6e3cc', couleurAccent: '#dcae82', icone: '☕', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *savourer*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(4940744, 1800) }],
    focus: { titre: 'Café *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(6660543, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(15672170, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(15672170, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(6660543, 1000), couleur: '' },
      { titre: 'Notre *équipement*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Cadeaux', photo: PX(2159129, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: CAFE_FIN_DEMO, photo: PX(8429813, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Café', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Sakura : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_SAKURA = [
  { id: 1,  titre: 'Carnet à couverture rigide', prix: 16, stock: 24, categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-1001', photo_principale: PX(6193089) },
  { id: 2,  titre: 'Carnet de croquis', prix: 12, prix_promo: 9, stock: 15, categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-1002', photo_principale: PX(4508071) },
  { id: 3,  titre: 'Papier origami coloré', prix: 8, stock: 0, categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-1003', photo_principale: PX(10905403) },
  { id: 4,  titre: 'Cartes de souhaits', prix: 5.5, stock: 40, categorie: 'Papeterie', description: 'Exemple de produit de démonstration.', sku: 'PA-1004', photo_principale: PX(8715576) },
  { id: 5,  titre: 'Ensemble de pinceaux', prix: 24, stock: 8, categorie: 'Art et dessin', description: 'Exemple de produit de démonstration.', sku: 'AR-2001', photo_principale: PX(3777876) },
  { id: 6,  titre: 'Crayons de couleur', prix: 19, prix_promo: 15, stock: 12, categorie: 'Art et dessin', description: 'Exemple de produit de démonstration.', sku: 'AR-2002', photo_principale: PX(187334) },
  { id: 7,  titre: 'Lanterne en papier', prix: 14, stock: 6, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3001', photo_principale: PX(5745869) },
  { id: 8,  titre: 'Guirlande de lanternes', prix: 22, stock: 10, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3002', photo_principale: PX(5745864) },
  { id: 9,  titre: 'Carte florale', prix: 6, stock: 30, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3003', photo_principale: PX(3826676) },
  { id: 10, titre: 'Coffret créatif', prix: 39, stock: 10, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CD-3004', photo_principale: PX(5493268) },
];
const DEMO_ARTICLES_SAKURA = [
  { id: 9001, titre: 'Exemple : bien choisir son carnet', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(584305), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : l’art du pliage', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(92340), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Créations', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : idées de cartes à offrir', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(1509485), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Idées', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const SAKURA_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_SAKURA = { sakura: {
  accueil: {
    hero: { titre: 'Créez, plié après plié', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(92340, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Créez, plié après *plié*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(92340, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la semaine', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(1509485, 1600) },
      { surtitre: 'Cadeaux', titre: 'Un cadeau *fait main*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les cadeaux', lien: 'cat:Cadeaux', photo: PX(479385, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *coups de cœur*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Du papier, des couleurs et des idées pour une création *unique* chaque jour', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(13791077, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Art et dessin', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre idée', titre: 'Que cherchez-vous ?', photo: PX(5493268, 1000), options: 'Du papier et des carnets | cat:Papeterie\nDu matériel d\'art | cat:Art et dessin\nUn cadeau | cat:Cadeaux' },
    comparatif: { titre: 'Comparez nos *carnets*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos carnets', produits: PX(6193089, 600) + ' | Rigide | 16 $ | catalogue\n' + PX(4508071, 600) + ' | Croquis | 12 $ | catalogue\n' + PX(10905403, 600) + ' | Origami | 8 $ | catalogue', criteres: 'Pages | 120 | 80 | 50\nPapier | ligné | uni | coloré\nFormat | A5 | A5 | 15 cm' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(30207944, 700) + '\n' + PX(5745869, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(5745869, 600) + ' | catalogue\n' + PX(5745864, 600) + ' | catalogue\n' + PX(479385, 600) + ' | catalogue\n' + PX(8660223, 600) + ' | catalogue\n' + PX(187334, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🌸 | Choisi avec soin' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Sakura' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#e0525c', couleurTexte: '#ffffff', couleurAccent: '#ffe3df', icone: '🌸', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *créer*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(92340, 1800) }],
    focus: { titre: 'Coup de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(8660223, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(584305, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(584305, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(8660223, 1000), couleur: '' },
      { titre: 'Notre *matériel d’art*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Cadeaux', photo: PX(3777876, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: SAKURA_FIN_DEMO, photo: PX(13791077, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Sakura', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Sport : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_SPORT = [
  { id: 1,  titre: 'Traverse 2.0', prix: 257, stock: 24, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1001', photo_principale: PX(2529148) },
  { id: 2,  titre: 'Glide', prix: 257, stock: 15, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1002', photo_principale: PX(1456705) },
  { id: 3,  titre: 'Ridgeline', prix: 286, prix_promo: 242, stock: 12, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1003', photo_principale: PX(5413294) },
  { id: 4,  titre: 'Tempo', prix: 184, stock: 0, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1004', photo_principale: PX(6050912) },
  { id: 5,  titre: 'Cove', prix: 257, stock: 18, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2001', photo_principale: PX(1464625) },
  { id: 6,  titre: 'Surge', prix: 198, stock: 10, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2002', photo_principale: PX(14174467) },
  { id: 7,  titre: 'Circuit', prix: 198, prix_promo: 172, stock: 9, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3001', photo_principale: PX(2529147) },
  { id: 8,  titre: 'Squat', prix: 330, stock: 6, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3002', photo_principale: PX(20298288) },
  { id: 9,  titre: 'Bouteille isotherme', prix: 32, stock: 40, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(8033043) },
  { id: 10, titre: 'Tapis d’entraînement', prix: 52, stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4002', photo_principale: PX(7880203) },
];
const DEMO_ARTICLES_SPORT = [
  { id: 9001, titre: 'Exemple : bien choisir ses souliers de course', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(10433248), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : préparer sa première course', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(12918252), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Entraînement', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : entretenir son équipement', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7624977), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const SPORT_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_SPORT = { sport: {
  accueil: {
    hero: { titre: 'Bougez, dépassez-vous', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(12918252, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Bougez, *dépassez-vous*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(12918252, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(7624977, 1600) },
      { surtitre: 'Équipement', titre: 'Un équipement *qui performe*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir l’équipement', lien: 'cat:Accessoires', photo: PX(5310739, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des souliers et de l’équipement pensés pour la course, l’entraînement et le quotidien, avec un confort *durable*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(14502821, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre paire', titre: 'Que cherchez-vous ?', photo: PX(3927387, 1000), options: 'Des souliers de course | cat:Course\nDe l\'entraînement | cat:Entraînement\nUn cadeau | cat:Accessoires' },
    comparatif: { titre: 'Comparez nos *souliers*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos souliers', produits: PX(2529148, 600) + ' | Course | 257 $ | catalogue\n' + PX(1456705, 600) + ' | Quotidien | 198 $ | catalogue\n' + PX(6050912, 600) + ' | Gym | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(34213999, 700) + '\n' + PX(6740823, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(6740823, 600) + ' | catalogue\n' + PX(6740820, 600) + ' | catalogue\n' + PX(5310739, 600) + ' | catalogue\n' + PX(7961664, 600) + ' | catalogue\n' + PX(8033043, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n👟 | Confort testé' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Sport' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#0f1829', couleurTexte: '#4de3c1', couleurAccent: '#d9f36a', icone: '👟', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque sortie*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(12918252, 1800) }],
    focus: { titre: 'Souliers *vedettes*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(7961664, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(10433248, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(10433248, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(7961664, 1000), couleur: '' },
      { titre: 'Notre *entraînement*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Accessoires', photo: PX(7880203, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: SPORT_FIN_DEMO, photo: PX(14502821, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Sport', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Joyau : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_JOYAU = [
  { id: 1,  titre: 'Collier solitaire', prix: 480, stock: 8, categorie: 'Colliers', description: 'Exemple de produit de démonstration.', sku: 'CO-1001', photo_principale: PX(12194265) },
  { id: 2,  titre: 'Collier pendentif', prix: 560, prix_promo: 448, stock: 5, categorie: 'Colliers', description: 'Exemple de produit de démonstration.', sku: 'CO-1002', photo_principale: PX(7407595) },
  { id: 3,  titre: 'Collier chaîne fine', prix: 320, stock: 12, categorie: 'Colliers', description: 'Exemple de produit de démonstration.', sku: 'CO-1003', photo_principale: PX(13325931) },
  { id: 4,  titre: 'Collier plateau', prix: 390, stock: 0, categorie: 'Colliers', description: 'Exemple de produit de démonstration.', sku: 'CO-1004', photo_principale: PX(12194386) },
  { id: 5,  titre: 'Boucles solitaires', prix: 620, stock: 6, categorie: 'Boucles d’oreilles', description: 'Exemple de produit de démonstration.', sku: 'BO-2001', photo_principale: PX(5370642) },
  { id: 6,  titre: 'Boucles dorées', prix: 410, stock: 9, categorie: 'Boucles d’oreilles', description: 'Exemple de produit de démonstration.', sku: 'BO-2002', photo_principale: PX(20943477) },
  { id: 7,  titre: 'Boucles florales', prix: 540, prix_promo: 459, stock: 4, categorie: 'Boucles d’oreilles', description: 'Exemple de produit de démonstration.', sku: 'BO-2003', photo_principale: PX(31459468) },
  { id: 8,  titre: 'Pendentif doré', prix: 290, stock: 14, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CA-3001', photo_principale: PX(4595723) },
  { id: 9,  titre: 'Parure traditionnelle', prix: 720, stock: 3, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CA-3002', photo_principale: PX(29228980) },
  { id: 10, titre: 'Collier délicat', prix: 260, stock: 20, categorie: 'Cadeaux', description: 'Exemple de produit de démonstration.', sku: 'CA-3003', photo_principale: PX(7134458) },
];
const DEMO_ARTICLES_JOYAU = [
  { id: 9001, titre: 'Exemple : bien choisir son collier', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(13672226), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : prendre soin de ses bijoux', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7615245), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : idées de cadeaux', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6153894), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const JOYAU_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_JOYAU = { joyau: {
  accueil: {
    hero: { titre: 'Des bijoux éclatants, conçus avec soin', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(7615245, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Des bijoux *éclatants*, conçus avec soin', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(7615245, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(6153894, 1600) },
      { surtitre: 'Cadeaux', titre: 'Un cadeau *qui dure*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les cadeaux', lien: 'cat:Cadeaux', photo: PX(12636308, 1600) },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Conçus avec soin, *durables* par choix', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Une conscience aussi *claire* que nos pierres : des bijoux choisis avec soin, pensés pour durer et se transmettre', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(8459343, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Cadeaux', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre bijou', titre: 'Que cherchez-vous ?', photo: PX(18477570, 1000), options: 'Un collier | cat:Colliers\nDes boucles d\'oreilles | cat:Boucles d’oreilles\nUn cadeau | cat:Cadeaux' },
    comparatif: { titre: 'Comparez nos *colliers*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos colliers', produits: PX(12194265, 600) + ' | Solitaire | 480 $ | catalogue\n' + PX(7407595, 600) + ' | Pendentif | 560 $ | catalogue\n' + PX(4595723, 600) + ' | Chaîne | 320 $ | catalogue', criteres: 'Style | classique | moderne | fin\nMétal | or | or | or\nLongueur | 45 cm | 40 cm | 42 cm' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(11955523, 700) + '\n' + PX(20943477, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(20943477, 600) + ' | catalogue\n' + PX(29228980, 600) + ' | catalogue\n' + PX(12636308, 600) + ' | catalogue\n' + PX(9649265, 600) + ' | catalogue\n' + PX(12194386, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n💍 | Choisi avec soin' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    evenements: { titre: 'Calendrier des *événements*', sousTitre: 'Exemple de démonstration : événements fictifs', photo: PX(18477570, 1200), items: '20 déc | Exemple : soirée | Soirée de présentation des fêtes | Exemple de démonstration : décrivez ici votre événement. | '+PX(9393222, 500)+' | contact\n09 oct | Exemple : atelier | Atelier de découverte | Exemple de démonstration : un deuxième événement. | '+PX(11955523, 500)+' | contact\n14 sept | Exemple : exposition | Exposition de la collection | Exemple de démonstration : un troisième événement. | '+PX(18477570, 500)+' | contact' },
    grandnom: { texte: 'Joyau' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#f5ede3', couleurTexte: '#b4532a', couleurAccent: '#b4532a', icone: '💍', lien: '' },
    bandeaux: [{ titre: 'Un moment pour *briller*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(7615245, 1800) }],
    focus: { titre: 'Pièce *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(9649265, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *choisir* nos produits', photo: PX(13672226, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(13672226, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(9649265, 1000), couleur: '' },
      { titre: 'Nos *boucles d’oreilles*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Cadeaux', photo: PX(13325931, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: JOYAU_FIN_DEMO, photo: PX(8459343, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Joyau', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Écume : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_ECUME = [
  { id: 1,  titre: 'Chapeau de paille', prix: 38, stock: 14, categorie: 'Chapeaux', description: 'Exemple de produit de démonstration.', sku: 'CH-1001', photo_principale: PX(8093145) },
  { id: 2,  titre: 'Chapeau à large bord', prix: 45, prix_promo: 36, stock: 6, categorie: 'Chapeaux', description: 'Exemple de produit de démonstration.', sku: 'CH-1002', photo_principale: PX(16770399) },
  { id: 3,  titre: 'Lunettes de soleil', prix: 59, stock: 9, categorie: 'Lunettes', description: 'Exemple de produit de démonstration.', sku: 'LU-2001', photo_principale: PX(46710) },
  { id: 4,  titre: 'Panier de plage', prix: 64, stock: 5, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-3001', photo_principale: PX(8093198) },
  { id: 5,  titre: 'Trousse d’été', prix: 28, stock: 20, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-3002', photo_principale: PX(20817639) },
  { id: 6,  titre: 'Serviette rayée bleue', prix: 42, prix_promo: 34, stock: 8, categorie: 'Serviettes', description: 'Exemple de produit de démonstration.', sku: 'SE-4001', photo_principale: PX(30982095) },
  { id: 7,  titre: 'Serviette à franges', prix: 48, stock: 11, categorie: 'Serviettes', description: 'Exemple de produit de démonstration.', sku: 'SE-4002', photo_principale: PX(30982098) },
  { id: 8,  titre: 'Ensemble de plage', prix: 89, stock: 0, categorie: 'Ensembles', description: 'Exemple de produit de démonstration.', sku: 'EN-5001', photo_principale: PX(30982094) },
  { id: 9,  titre: 'Panier d’été', prix: 52, stock: 7, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-3003', photo_principale: PX(12604648) },
  { id: 10, titre: 'Valise de vacances', prix: 120, stock: 3, categorie: 'Ensembles', description: 'Exemple de produit de démonstration.', sku: 'EN-5002', photo_principale: PX(8185803) },
];
const DEMO_ARTICLES_ECUME = [
  { id: 9001, titre: 'Exemple : préparer sa valise d’été', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(8185803), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : une journée à la plage', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(8157111), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : idées d’accessoires', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(1884417), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const ECUME_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_ECUME = { ecume: {
  accueil: {
    hero: { titre: 'Un été lumineux, en toute simplicité', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(10493845, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: '' } },
    diaporama: [
      { titre: 'Un été *lumineux*, en toute simplicité', texte: '', bouton: 'Magasiner', lien: 'catalogue', photo: PX(10493845, 1600) },
      { surtitre: 'Exemple de démonstration', titre: 'Tout pour une journée à la *mer*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Voir la boutique', lien: 'catalogue', photo: PX(4931333, 1600) },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les nouveautés', lien: 'cat:Serviettes', photo: PX(8759777, 1600) },
    ],
    onde: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    vedette: { titre: 'Nos *préférés* de la saison', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des essentiels *simples* et jolis : une sélection pensée pour les journées au soleil', photos: PX(30982098, 500) + '\n' + PX(8093145, 500), sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(30982094, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Serviettes', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre essentiel', titre: 'Que cherchez-vous ?', photo: PX(8157111, 1000), options: 'Un chapeau | cat:Chapeaux\nDes lunettes | cat:Lunettes\nUn sac | cat:Sacs' },
    comparatif: { titre: 'Comparez nos *serviettes*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos serviettes', produits: PX(30982095, 600) + ' | Rayée bleue | 42 $ | catalogue\n' + PX(30982098, 600) + ' | À franges | 48 $ | catalogue\n' + PX(30982094, 600) + ' | Ensemble | 89 $ | catalogue', criteres: 'Format | grand | grand | moyen\nTissu | coton | coton | coton\nFranges | non | oui | oui' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: '', temoignagesPhotos: '',
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(8093198, 600) + ' | catalogue\n' + PX(30982095, 600) + ' | catalogue\n' + PX(16770399, 600) + ' | catalogue\n' + PX(12604648, 600) + ' | catalogue\n' + PX(20817639, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🌊 | Choisi avec soin' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    evenements: { titre: 'Calendrier des *événements*', sousTitre: 'Exemple de démonstration : événements fictifs', photo: PX(8157111, 1200), items: '20 juin | Exemple : atelier | Atelier de découverte | Exemple de démonstration : décrivez ici votre événement. | '+PX(1884417, 500)+' | contact\n09 juil | Exemple : marché | Marché d\'été | Exemple de démonstration : un deuxième événement. | '+PX(8093198, 500)+' | contact' },
    grandnom: { texte: 'Écume' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#fcedf8', couleurTexte: '#2a1238', couleurAccent: '#2c4fe6', icone: '🌊', lien: '' },
    bandeaux: [{ titre: 'Une journée à la *plage*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(4931333, 1800) }],
    focus: { titre: 'Notre *coup de cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(30982094, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *l’adorer*', photo: PX(20817639, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.\nQuatrième point fort | Exemple de démonstration : un quatrième avantage.', bouton: '', lien: '' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: '', inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(30982094, 1000), couleur: '' },
      { titre: 'Nos *chapeaux*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Chapeaux', photo: PX(8093145, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: ECUME_FIN_DEMO, photo: PX(4931333, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Pourquoi *nous choisir*', photo: PX(4944674, 1000), items: 'Premier point | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième point | Exemple de démonstration : le détail s\'affiche ici.\nTroisième point | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', photo: '', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Écume', slogan: 'Exemple de démonstration', afficherPropulse: true,
    bande: '🚚 Livraison | Exemple de démonstration\n🌊 Choisi avec soin | Exemple de démonstration\n🔒 Paiement sécurisé | Exemple de démonstration\n↩️ Retours simples | Exemple de démonstration',
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Audace : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_AUDACE = [
  { id: 1,  titre: 'Traverse 2.0', prix: 257, stock: 24, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1001', photo_principale: PX(2529148) },
  { id: 2,  titre: 'Glide', prix: 257, stock: 15, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1002', photo_principale: PX(1456705) },
  { id: 3,  titre: 'Ridgeline', prix: 286, prix_promo: 242, stock: 12, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1003', photo_principale: PX(5413294) },
  { id: 4,  titre: 'Tempo', prix: 184, stock: 0, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1004', photo_principale: PX(6050912) },
  { id: 5,  titre: 'Cove', prix: 257, stock: 18, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2001', photo_principale: PX(1464625) },
  { id: 6,  titre: 'Surge', prix: 198, stock: 10, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2002', photo_principale: PX(14174467) },
  { id: 7,  titre: 'Circuit', prix: 198, prix_promo: 172, stock: 9, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3001', photo_principale: PX(2529147) },
  { id: 8,  titre: 'Squat', prix: 330, stock: 6, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3002', photo_principale: PX(20298288) },
  { id: 9,  titre: 'Bouteille isotherme', prix: 32, stock: 40, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(8033043) },
  { id: 10, titre: 'Tapis d’entraînement', prix: 52, stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4002', photo_principale: PX(7880203) },
];
const DEMO_ARTICLES_AUDACE = [
  { id: 9001, titre: 'Exemple : bien choisir ses souliers de course', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(10433248), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : préparer sa première course', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(12918252), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Entraînement', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : entretenir son équipement', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7624977), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const AUDACE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_AUDACE = { audace: {
  accueil: {
    hero: { titre: 'Bougez, dépassez-vous', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(12918252, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Osez le *grand format*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(12918252, 1200), photo2: PX(2529148, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(7624977, 1200) },
      { surtitre: 'Équipement', titre: 'Un équipement *qui performe*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir l’équipement', lien: 'cat:Accessoires', photo: PX(5310739, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des souliers et de l’équipement pensés pour la course, l’entraînement et le quotidien, avec un confort *durable*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(14502821, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre paire', titre: 'Que cherchez-vous ?', photo: PX(3927387, 1000), options: 'Des souliers de course | cat:Course\nDe l\'entraînement | cat:Entraînement\nUn cadeau | cat:Accessoires' },
    comparatif: { titre: 'Comparez nos *souliers*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos souliers', produits: PX(2529148, 600) + ' | Course | 257 $ | catalogue\n' + PX(1456705, 600) + ' | Quotidien | 198 $ | catalogue\n' + PX(6050912, 600) + ' | Gym | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(34213999, 700) + '\n' + PX(6740823, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(6740823, 600) + ' | catalogue\n' + PX(6740820, 600) + ' | catalogue\n' + PX(5310739, 600) + ' | catalogue\n' + PX(7961664, 600) + ' | catalogue\n' + PX(8033043, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🔥 | Confort testé' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Audace' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', etiquette: 'Nouveau', couleurFond: '#0e1330', couleurTexte: '#ffffff', couleurAccent: '#c8ff2e', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque sortie*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(12918252, 1800) }],
    focus: { titre: 'Souliers *vedettes*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(7961664, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(10433248, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(10433248, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(7961664, 1000), couleur: '' },
      { titre: 'Notre *entraînement*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Accessoires', photo: PX(7880203, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: AUDACE_FIN_DEMO, photo: PX(14502821, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Audace', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Carnaval : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_CARNAVAL = [
  { id: 1,  titre: 'Traverse 2.0', prix: 257, stock: 24, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1001', photo_principale: PX(2529148) },
  { id: 2,  titre: 'Glide', prix: 257, stock: 15, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1002', photo_principale: PX(1456705) },
  { id: 3,  titre: 'Ridgeline', prix: 286, prix_promo: 242, stock: 12, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1003', photo_principale: PX(5413294) },
  { id: 4,  titre: 'Tempo', prix: 184, stock: 0, categorie: 'Course', description: 'Exemple de produit de démonstration.', sku: 'CO-1004', photo_principale: PX(6050912) },
  { id: 5,  titre: 'Cove', prix: 257, stock: 18, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2001', photo_principale: PX(1464625) },
  { id: 6,  titre: 'Surge', prix: 198, stock: 10, categorie: 'Quotidien', description: 'Exemple de produit de démonstration.', sku: 'QU-2002', photo_principale: PX(14174467) },
  { id: 7,  titre: 'Circuit', prix: 198, prix_promo: 172, stock: 9, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3001', photo_principale: PX(2529147) },
  { id: 8,  titre: 'Squat', prix: 330, stock: 6, categorie: 'Entraînement', description: 'Exemple de produit de démonstration.', sku: 'EN-3002', photo_principale: PX(20298288) },
  { id: 9,  titre: 'Bouteille isotherme', prix: 32, stock: 40, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(8033043) },
  { id: 10, titre: 'Tapis d’entraînement', prix: 52, stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4002', photo_principale: PX(7880203) },
];
const DEMO_ARTICLES_CARNAVAL = [
  { id: 9001, titre: 'Exemple : bien choisir ses souliers de course', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(10433248), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : préparer sa première course', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(12918252), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Entraînement', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : entretenir son équipement', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7624977), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const CARNAVAL_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_CARNAVAL = { carnaval: {
  accueil: {
    hero: { titre: 'Bougez, dépassez-vous', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(12918252, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'La fête commence *ici*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(12918252, 1200), photo2: PX(2529148, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(7624977, 1200) },
      { surtitre: 'Équipement', titre: 'Un équipement *qui performe*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir l’équipement', lien: 'cat:Accessoires', photo: PX(5310739, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des souliers et de l’équipement pensés pour la course, l’entraînement et le quotidien, avec un confort *durable*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(14502821, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre paire', titre: 'Que cherchez-vous ?', photo: PX(3927387, 1000), options: 'Des souliers de course | cat:Course\nDe l\'entraînement | cat:Entraînement\nUn cadeau | cat:Accessoires' },
    comparatif: { titre: 'Comparez nos *souliers*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos souliers', produits: PX(2529148, 600) + ' | Course | 257 $ | catalogue\n' + PX(1456705, 600) + ' | Quotidien | 198 $ | catalogue\n' + PX(6050912, 600) + ' | Gym | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(34213999, 700) + '\n' + PX(6740823, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(6740823, 600) + ' | catalogue\n' + PX(6740820, 600) + ' | catalogue\n' + PX(5310739, 600) + ' | catalogue\n' + PX(7961664, 600) + ' | catalogue\n' + PX(8033043, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🔥 | Confort testé' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Carnaval' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', etiquette: 'Nouveau', couleurFond: '#ffc933', couleurTexte: '#1a1026', couleurAccent: '#6a1bb0', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque sortie*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(12918252, 1800) }],
    focus: { titre: 'Souliers *vedettes*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(7961664, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(10433248, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(10433248, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(7961664, 1000), couleur: '' },
      { titre: 'Notre *entraînement*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Accessoires', photo: PX(7880203, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: CARNAVAL_FIN_DEMO, photo: PX(14502821, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Carnaval', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Patchwork : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_PATCHWORK = [
  { id: 1,  titre: 'Barboteuse douce', prix: 34, stock: 24, categorie: 'Bébé', description: 'Exemple de produit de démonstration.', sku: 'BE-1001', photo_principale: PX(11369379) },
  { id: 2,  titre: 'Ensemble de naissance', prix: 48, stock: 15, categorie: 'Bébé', description: 'Exemple de produit de démonstration.', sku: 'BE-1002', photo_principale: PX(11369390) },
  { id: 3,  titre: 'Ensemble brodé', prix: 56, prix_promo: 46, stock: 12, categorie: 'Bébé', description: 'Exemple de produit de démonstration.', sku: 'BE-1003', photo_principale: PX(5693888) },
  { id: 4,  titre: 'Gigoteuse', prix: 42, stock: 0, categorie: 'Bébé', description: 'Exemple de produit de démonstration.', sku: 'BE-1004', photo_principale: PX(32410088) },
  { id: 5,  titre: 'Tenue colorée', prix: 39, stock: 18, categorie: 'Enfant', description: 'Exemple de produit de démonstration.', sku: 'EN-2001', photo_principale: PX(29857631) },
  { id: 6,  titre: 'Tenue du dimanche', prix: 52, stock: 10, categorie: 'Enfant', description: 'Exemple de produit de démonstration.', sku: 'EN-2002', photo_principale: PX(6261877) },
  { id: 7,  titre: 'Salopette en coton', prix: 45, prix_promo: 38, stock: 9, categorie: 'Enfant', description: 'Exemple de produit de démonstration.', sku: 'EN-2003', photo_principale: PX(12198194) },
  { id: 8,  titre: 'Pyjama deux pièces', prix: 36, stock: 6, categorie: 'Pyjamas', description: 'Exemple de produit de démonstration.', sku: 'PY-3001', photo_principale: PX(11369379) },
  { id: 9,  titre: 'Cardigan tricoté', prix: 49, stock: 20, categorie: 'Pyjamas', description: 'Exemple de produit de démonstration.', sku: 'PY-3002', photo_principale: PX(5693888) },
  { id: 10, titre: 'Couverture douce', prix: 58, stock: 20, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(32410088) },
];
const DEMO_ARTICLES_PATCHWORK = [
  { id: 9001, titre: 'Exemple : bien choisir la taille de bébé', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(11369390), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : préparer la valise de naissance', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5693888), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Entraînement', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : entretenir les tissus délicats', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(29857631), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const PATCHWORK_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_PATCHWORK = { patchwork: {
  accueil: {
    hero: { titre: 'Bougez, dépassez-vous', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(6261877, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Petites *merveilles*, grands sourires', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(12198194, 1200), photo2: PX(32410088, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(11369379, 1200) },
      { surtitre: 'Douceur', titre: 'Des tissus *tout doux*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir la douceur', lien: 'cat:Pyjamas', photo: PX(11369390, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner pour', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des vêtements doux pour bébés et enfants, pensés pour jouer, dormir et grandir avec un confort *durable*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(5693888, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Enfant', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez la bonne taille', titre: 'Que cherchez-vous ?', photo: PX(29857631, 1000), options: 'Pour bébé | cat:Bébé\nPour enfant | cat:Enfant\nUn cadeau | cat:Accessoires' },
    comparatif: { titre: 'Comparez nos *ensembles*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos ensembles', produits: PX(6261877, 600) + ' | Bébé | 48 $ | catalogue\n' + PX(12198194, 600) + ' | Enfant | 52 $ | catalogue\n' + PX(32410088, 600) + ' | Pyjama | 36 $ | catalogue', criteres: 'Âge | 0-6 mois | 2-4 ans | 3-6 ans\nTissu | coton | coton | coton\nLavable | oui | oui | oui' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(11369379, 700) + '\n' + PX(11369390, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(5693888, 600) + ' | catalogue\n' + PX(29857631, 600) + ' | catalogue\n' + PX(6261877, 600) + ' | catalogue\n' + PX(12198194, 600) + ' | catalogue\n' + PX(32410088, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n🔥 | Confort testé' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Patchwork' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', etiquette: 'Nouveau', couleurFond: '#f6d56a', couleurTexte: '#4a3426', couleurAccent: '#b4533a', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque saison*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(11369379, 1800) }],
    focus: { titre: 'Notre *coup de cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(11369390, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(5693888, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(29857631, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(6261877, 1000), couleur: '' },
      { titre: 'Nos *pyjamas*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Accessoires', photo: PX(12198194, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: PATCHWORK_FIN_DEMO, photo: PX(32410088, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Patchwork', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Vigie : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_VIGIE = [
  { id: 1,  titre: 'Casque audio sans fil', prix: 129, stock: 30, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1001', photo_principale: PX(1649771) },
  { id: 2,  titre: 'Enceinte portable', prix: 89, stock: 15, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1002', photo_principale: PX(9767549) },
  { id: 3,  titre: 'Montre connectée', prix: 189, prix_promo: 159, stock: 12, categorie: 'Montres', description: 'Exemple de produit de démonstration.', sku: 'MO-2001', photo_principale: PX(5081914) },
  { id: 4,  titre: 'Écouteurs compacts', prix: 79, stock: 0, categorie: 'Audio', description: 'Exemple de produit de démonstration.', sku: 'AU-1003', photo_principale: PX(10292808) },
  { id: 5,  titre: 'Manette sans fil', prix: 79, stock: 18, categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3001', photo_principale: PX(6006298) },
  { id: 6,  titre: 'Clavier mécanique', prix: 149, prix_promo: 119, stock: 10, categorie: 'Bureau', description: 'Exemple de produit de démonstration.', sku: 'BU-4001', photo_principale: PX(33888380) },
  { id: 7,  titre: 'Clavier lumineux', prix: 99, stock: 9, categorie: 'Bureau', description: 'Exemple de produit de démonstration.', sku: 'BU-4002', photo_principale: PX(28842075) },
  { id: 8,  titre: 'Casque de réalité virtuelle', prix: 399, stock: 6, categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3002', photo_principale: PX(7776217) },
  { id: 9,  titre: 'Manette blanche', prix: 69, prix_promo: 54, stock: 9, categorie: 'Jeu', description: 'Exemple de produit de démonstration.', sku: 'JE-3003', photo_principale: PX(4497076) },
  { id: 10,  titre: 'Ensemble clavier et souris', prix: 109, stock: 20, categorie: 'Bureau', description: 'Exemple de produit de démonstration.', sku: 'BU-4003', photo_principale: PX(28779689) },
];
const DEMO_ARTICLES_VIGIE = [
  { id: 9001, titre: 'Exemple : bien choisir son casque audio', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(1649771), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : aménager son poste de travail', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(9767549), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : prendre soin de ses appareils', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5081914), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const VIGIE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_VIGIE = { vigie: {
  accueil: {
    hero: { titre: 'Du sérieux, sans compromis', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(10292808, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Du matériel *fiable*, livré chez vous', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(6006298, 1200), photo2: PX(33888380, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* du moment', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(28842075, 1200) },
      { surtitre: 'Sélection', titre: 'Un choix *sans souci*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir la sélection', lien: 'cat:Bureau', photo: PX(7776217, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des produits choisis avec soin, testés et garantis, pour un usage de tous les jours *sans souci*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(4497076, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre produit', titre: 'Que cherchez-vous ?', photo: PX(28779689, 1000), options: 'De l\'audio | cat:Audio\nDu matériel de jeu | cat:Jeu\nUn cadeau | cat:Bureau' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(1649771, 600) + ' | Audio | 257 $ | catalogue\n' + PX(9767549, 600) + ' | Montres | 198 $ | catalogue\n' + PX(5081914, 600) + ' | Jeu | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(10292808, 700) + '\n' + PX(6006298, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(33888380, 600) + ' | catalogue\n' + PX(28842075, 600) + ' | catalogue\n' + PX(7776217, 600) + ' | catalogue\n' + PX(4497076, 600) + ' | catalogue\n' + PX(28779689, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Vigie' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', etiquette: 'Nouveau', couleurFond: '#0a14d0', couleurTexte: '#ffffff', couleurAccent: '#c9d0ff', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *tous vos usages*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(1649771, 1800) }],
    focus: { titre: 'Produits *vedettes*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(9767549, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(5081914, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(10292808, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(6006298, 1000), couleur: '' },
      { titre: 'Notre *bureau*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Bureau', photo: PX(33888380, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: VIGIE_FIN_DEMO, photo: PX(28842075, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Vigie', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Aurore : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_AURORE = [
  { id: 1,  titre: 'Bougie parfumée', prix: 24, stock: 30, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1001', photo_principale: PX(39572247) },
  { id: 2,  titre: 'Duo de bougies', prix: 36, stock: 15, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1002', photo_principale: PX(39572248) },
  { id: 3,  titre: 'Chandelier noir', prix: 48, prix_promo: 39, stock: 12, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1003', photo_principale: PX(11776187) },
  { id: 4,  titre: 'Lampe de bureau noire', prix: 79, stock: 0, categorie: 'Lampes', description: 'Exemple de produit de démonstration.', sku: 'LA-2001', photo_principale: PX(1552616) },
  { id: 5,  titre: 'Lampe jaune design', prix: 89, stock: 18, categorie: 'Lampes', description: 'Exemple de produit de démonstration.', sku: 'LA-2002', photo_principale: PX(28461166) },
  { id: 6,  titre: 'Trio de lampes en métal', prix: 119, prix_promo: 99, stock: 10, categorie: 'Lampes', description: 'Exemple de produit de démonstration.', sku: 'LA-2003', photo_principale: PX(7439756) },
  { id: 7,  titre: 'Coussins décoratifs', prix: 42, stock: 9, categorie: 'Textiles', description: 'Exemple de produit de démonstration.', sku: 'TE-3001', photo_principale: PX(11673765) },
  { id: 8,  titre: 'Coussins en lin', prix: 38, stock: 14, categorie: 'Textiles', description: 'Exemple de produit de démonstration.', sku: 'TE-3002', photo_principale: PX(4635231) },
  { id: 9,  titre: 'Vase en céramique', prix: 45, stock: 6, categorie: 'Décoration', description: 'Exemple de produit de démonstration.', sku: 'DE-4001', photo_principale: PX(4611612) },
  { id: 10,  titre: 'Plante en pot', prix: 28, stock: 20, categorie: 'Décoration', description: 'Exemple de produit de démonstration.', sku: 'DE-4002', photo_principale: PX(2176116) },
];
const DEMO_ARTICLES_AURORE = [
  { id: 9001, titre: 'Exemple : bien choisir sa bougie', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6908500), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : créer une ambiance chaleureuse', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5400775), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : prendre soin de ses luminaires', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(36563156), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const AURORE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_AURORE = { aurore: {
  accueil: {
    hero: { titre: 'Une lumière chaleureuse', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(11673765, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Une maison qui *rayonne*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4611612, 1200), photo2: PX(2176116, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(11776187, 1200) },
      { surtitre: 'Ambiance', titre: 'Des soirées *plus douces*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir l’ambiance', lien: 'cat:Lampes', photo: PX(39572247, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des objets choisis avec soin pour créer une ambiance chaleureuse, *jour après jour*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(6908500, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre ambiance', titre: 'Que cherchez-vous ?', photo: PX(5400775, 1000), options: 'Des bougies | cat:Bougies\nDes lampes | cat:Lampes\nUn cadeau | cat:Lampes' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(36563156, 600) + ' | Bougies | 257 $ | catalogue\n' + PX(11673765, 600) + ' | Lampes | 198 $ | catalogue\n' + PX(4611612, 600) + ' | Textiles | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(2176116, 700) + '\n' + PX(11776187, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(39572247, 600) + ' | catalogue\n' + PX(6908500, 600) + ' | catalogue\n' + PX(5400775, 600) + ' | catalogue\n' + PX(36563156, 600) + ' | catalogue\n' + PX(11673765, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Aurore' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', etiquette: 'Nouveau', couleurFond: '#06361a', couleurTexte: '#ffffff', couleurAccent: '#7dffa8', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *les longues soirées*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(4611612, 1800) }],
    focus: { titre: 'Coups de *cœur*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(2176116, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(11776187, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(39572247, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(6908500, 1000), couleur: '' },
      { titre: 'Notre *déco*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Lampes', photo: PX(5400775, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: AURORE_FIN_DEMO, photo: PX(36563156, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Aurore', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Galerie : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_GALERIE = [
  { id: 1,  titre: 'Sac cabas en cuir', prix: 189, stock: 12, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-1001', photo_principale: PX(9327162) },
  { id: 2,  titre: 'Sacoche bicolore', prix: 159, prix_promo: 129, stock: 9, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-1002', photo_principale: PX(1152077) },
  { id: 3,  titre: 'Sac à main noir', prix: 219, stock: 6, categorie: 'Sacs', description: 'Exemple de produit de démonstration.', sku: 'SA-1003', photo_principale: PX(13525167) },
  { id: 4,  titre: 'Portefeuille brun', prix: 79, stock: 0, categorie: 'Portefeuilles', description: 'Exemple de produit de démonstration.', sku: 'PO-2001', photo_principale: PX(915917) },
  { id: 5,  titre: 'Portefeuille artisanal', prix: 89, stock: 18, categorie: 'Portefeuilles', description: 'Exemple de produit de démonstration.', sku: 'PO-2002', photo_principale: PX(4452509) },
  { id: 6,  titre: 'Porte-cartes noir', prix: 49, stock: 25, categorie: 'Portefeuilles', description: 'Exemple de produit de démonstration.', sku: 'PO-2003', photo_principale: PX(6127090) },
  { id: 7,  titre: 'Ceinture à boucle métal', prix: 99, prix_promo: 79, stock: 14, categorie: 'Ceintures', description: 'Exemple de produit de démonstration.', sku: 'CE-3001', photo_principale: PX(31432650) },
  { id: 8,  titre: 'Ceintures assorties', prix: 69, stock: 20, categorie: 'Ceintures', description: 'Exemple de produit de démonstration.', sku: 'CE-3002', photo_principale: PX(1023937) },
  { id: 9,  titre: 'Ceinture noire cloutée', prix: 85, stock: 8, categorie: 'Ceintures', description: 'Exemple de produit de démonstration.', sku: 'CE-3003', photo_principale: PX(34443362) },
  { id: 10,  titre: 'Ensemble d’accessoires', prix: 149, stock: 7, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(34150928) },
];
const DEMO_ARTICLES_GALERIE = [
  { id: 9001, titre: 'Exemple : bien entretenir son cuir', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(13525167), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : choisir son premier sac', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(34150928), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : reconnaître un cuir de qualité', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(9327162), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const GALERIE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_GALERIE = { galerie: {
  accueil: {
    hero: { titre: 'Le geste, la matière', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(1152077, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Le *cuir*, travaillé avec patience', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(31432650, 1200), photo2: PX(1023937, 600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* de la saison', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(915917, 1200) },
      { surtitre: 'Atelier', titre: 'Des pièces *faites pour durer*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir l’atelier', lien: 'cat:Sacs', photo: PX(4452509, 1200), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des pièces en cuir pensées pour vieillir *avec élégance*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(13525167, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Accessoires', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre pièce', titre: 'Que cherchez-vous ?', photo: PX(34150928, 1000), options: 'Un sac | cat:Sacs\nUn portefeuille | cat:Portefeuilles\nUn cadeau | cat:Sacs' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(9327162, 600) + ' | Sacs | 257 $ | catalogue\n' + PX(1152077, 600) + ' | Portefeuilles | 198 $ | catalogue\n' + PX(31432650, 600) + ' | Ceintures | 330 $ | catalogue', criteres: 'Usage | route | ville | gym\nSemelle | souple | ferme | stable\nPoids | léger | moyen | moyen' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(1023937, 700) + '\n' + PX(915917, 700),
    avantages: [],
    galerie: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(4452509, 600) + ' | catalogue\n' + PX(13525167, 600) + ' | catalogue\n' + PX(34150928, 600) + ' | catalogue\n' + PX(9327162, 600) + ' | catalogue\n' + PX(1152077, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Élégance' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#ffffff', couleurTexte: '#0a0a0a', couleurAccent: '#0a0a0a', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque saison*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(31432650, 1800) }],
    focus: { titre: 'Pièces *vedettes*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(1023937, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(915917, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(4452509, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(13525167, 1000), couleur: '' },
      { titre: 'Nos *accessoires*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Sacs', photo: PX(34150928, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: GALERIE_FIN_DEMO, photo: PX(9327162, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Galerie', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Rallye : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_RALLYE = [
  { id: 1,  titre: 'Perceuse-visseuse sans fil', prix: 189, stock: 12, categorie: 'Outils', description: 'Exemple de produit de démonstration : un outil robuste pour le chantier comme pour l’atelier.', sku: 'OU-1001', photo_principale: PX(8961401) },
  { id: 2,  titre: 'Perceuse d’atelier', prix: 159, prix_promo: 129, stock: 9, categorie: 'Outils', description: 'Exemple de produit de démonstration.', sku: 'OU-1002', photo_principale: PX(6790808) },
  { id: 3,  titre: 'Coffret de ciseaux à bois', prix: 119, stock: 6, categorie: 'Outils', description: 'Exemple de produit de démonstration.', sku: 'OU-1003', photo_principale: PX(5711901) },
  { id: 4,  titre: 'Coffret d’outils de menuisier', prix: 249, stock: 0, categorie: 'Outils', description: 'Exemple de produit de démonstration.', sku: 'OU-1004', photo_principale: PX(5711899) },
  { id: 5,  titre: 'Casque de chantier', prix: 39, stock: 40, categorie: 'Protection', description: 'Exemple de produit de démonstration.', sku: 'PR-2001', photo_principale: PX(8487720) },
  { id: 6,  titre: 'Gants et casque de protection', prix: 69, prix_promo: 54, stock: 25, categorie: 'Protection', description: 'Exemple de produit de démonstration.', sku: 'PR-2002', photo_principale: PX(8487733) },
  { id: 7,  titre: 'Casque orange et perceuse', prix: 99, stock: 14, categorie: 'Protection', description: 'Exemple de produit de démonstration.', sku: 'PR-2003', photo_principale: PX(5383809) },
  { id: 8,  titre: 'Lampe frontale', prix: 59, stock: 20, categorie: 'Éclairage', description: 'Exemple de produit de démonstration.', sku: 'EC-3001', photo_principale: PX(762420) },
  { id: 9,  titre: 'Lampe de tête rechargeable', prix: 49, prix_promo: 39, stock: 18, categorie: 'Éclairage', description: 'Exemple de produit de démonstration.', sku: 'EC-3002', photo_principale: PX(12058915) },
  { id: 10, titre: 'Sac de randonnée', prix: 149, stock: 7, categorie: 'Plein air', description: 'Exemple de produit de démonstration.', sku: 'PA-4001', photo_principale: PX(8220243) },
];
const DEMO_ARTICLES_RALLYE = [
  { id: 9001, titre: 'Exemple : bien entretenir ses outils', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5711901), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : choisir sa première perceuse', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(8220243), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : bien s’équiper pour le chantier', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(8961401), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const RALLYE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_RALLYE = { rallye: {
  accueil: {
    hero: { titre: 'Le geste, la matière', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(6790808, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Prêt pour le *chantier*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(8961401, 1600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* du moment', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(5383809, 1600) },
      { surtitre: 'Plein air', titre: 'Équipez-vous pour *l’aventure*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir le plein air', lien: 'cat:Plein air', photo: PX(8220243, 1600), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    mosaique: { photo: PX(8220243, 1000), titre: 'Explorez le terrain', texte: 'Exemple de démonstration : du matériel solide pour chaque projet, au chantier comme en plein air.', bouton: 'Magasiner', lien: 'catalogue', photos: PX(8487720, 600) + ' | cat:Protection\n' + PX(5383809, 600) + ' | cat:Protection\n' + PX(8487733, 600) + ' | cat:Protection\n' + PX(762420, 600) + ' | cat:Éclairage' },
    offrejour: { etiquette: 'Offre du jour', badge: 'Nouveau', accroche: 'Dépêchez-vous : se termine dans', fin: RALLYE_FIN_DEMO, gros: 'Rabais 60 %', categorie: 'Outils', bouton: 'Voir le produit', tuiles: 'Offres limitées | ' + PX(5383809, 900) + ' | catalogue\nTrouvez votre équipement | ' + PX(8961401, 900) + ' | catalogue' },
    avantapres: { surtitre: 'Exemple de démonstration', titre: 'Un atelier *transformé*', texte: 'Exemple de démonstration : deux photos de votre choix et un curseur pour les comparer.', photoAvant: PX(5711901, 1400), photoApres: PX(6790808, 1400), etiquetteAvant: 'Avant', etiquetteApres: 'Après', categorie: 'Outils', nombre: 3 },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Du matériel pensé pour durer *sur le terrain*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Magasiner par *collection*', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(5711901, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Plein air', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre équipement', titre: 'Que cherchez-vous ?', photo: PX(8220243, 1000), options: 'Un outil | cat:Outils\nDe la protection | cat:Protection\nUn sac | cat:Plein aircat:Outils' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(8961401, 600) + ' | Outils | 257 $ | catalogue\n' + PX(6790808, 600) + ' | Protection | 198 $ | catalogue\n' + PX(5383809, 600) + ' | Plein air | 330 $ | catalogue', criteres: 'Usage | chantier | atelier | plein air\nPoids | léger | moyen | léger\nGarantie | 2 ans | 1 an | 1 an' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(762420, 700) + '\n' + PX(5711899, 700),
    avantages: [],
    rallye: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(8487720, 600) + ' | catalogue\n' + PX(5711901, 600) + ' | catalogue\n' + PX(8220243, 600) + ' | catalogue\n' + PX(8961401, 600) + ' | catalogue\n' + PX(6790808, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    grandnom: { texte: 'Rallye' },
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#ff6a10', couleurTexte: '#141414', couleurAccent: '#141414', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt pour *chaque chantier*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(5383809, 1800) }],
    focus: { titre: 'Équipement *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(762420, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(5711899, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(8487720, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(5711901, 1000), couleur: '' },
      { titre: 'Nos *accessoires*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Outils', photo: PX(8220243, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: RALLYE_FIN_DEMO, photo: PX(8961401, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Rallye', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Paon : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_PAON = [
  { id: 1, titre: 'Bougie parfumée', prix: 34, stock: 12, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1001', photo_principale: PX(4013073) },
  { id: 2, titre: 'Bougies sur lin', prix: 48, prix_promo: 39, stock: 12, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1002', photo_principale: PX(10610004) },
  { id: 3, titre: 'Trio de bougies', prix: 59, stock: 12, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1003', photo_principale: PX(5760879) },
  { id: 4, titre: 'Bougie au parfum boisé', prix: 29, stock: 12, categorie: 'Bougies', description: 'Exemple de produit de démonstration.', sku: 'BO-1004', photo_principale: PX(7704461) },
  { id: 5, titre: 'Tasses artisanales', prix: 42, stock: 12, categorie: 'Céramique', description: 'Exemple de produit de démonstration.', sku: 'CE-2001', photo_principale: PX(11410247) },
  { id: 6, titre: 'Vaisselle en céramique', prix: 89, prix_promo: 69, stock: 12, categorie: 'Céramique', description: 'Exemple de produit de démonstration.', sku: 'CE-2002', photo_principale: PX(3094041) },
  { id: 7, titre: 'Service de table', prix: 129, stock: 12, categorie: 'Table', description: 'Exemple de produit de démonstration.', sku: 'TA-3001', photo_principale: PX(262882) },
  { id: 8, titre: 'Mise en table', prix: 79, stock: 0, categorie: 'Table', description: 'Exemple de produit de démonstration.', sku: 'TA-3002', photo_principale: PX(6310305) },
  { id: 9, titre: 'Coussins et plaid', prix: 64, prix_promo: 49, stock: 12, categorie: 'Textiles', description: 'Exemple de produit de démonstration.', sku: 'TE-4001', photo_principale: PX(14188395) },
  { id: 10, titre: 'Coussins en lin', prix: 54, stock: 12, categorie: 'Textiles', description: 'Exemple de produit de démonstration.', sku: 'TE-4002', photo_principale: PX(1248583) },
  { id: 11, titre: 'Coussins du salon', prix: 72, stock: 12, categorie: 'Textiles', description: 'Exemple de produit de démonstration.', sku: 'TE-4003', photo_principale: PX(4857772) },
];
const DEMO_ARTICLES_PAON = [
  { id: 9001, titre: 'Exemple : prendre soin de ses bougies', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(4013073), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : dresser une jolie table', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(11410247), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : habiller son salon de textiles', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(4857772), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const PAON_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_PAON = { paon: {
  accueil: {
    hero: { titre: 'Le geste, la matière', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(37023129, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Douceur de *maison*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4857772, 1600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* du moment', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(14188395, 1600) },
      { surtitre: 'Table', titre: 'Une table *à partager*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir la table', lien: 'cat:Table', photo: PX(11410247, 1600), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    mosaique: { photo: PX(11410247, 1000), titre: 'Explorez la maison', texte: 'Exemple de démonstration : des objets simples et soignés pour chaque pièce de la maison.', bouton: 'Magasiner', lien: 'catalogue', photos: PX(10610004, 600) + ' | cat:Céramique\n' + PX(14188395, 600) + ' | cat:Céramique\n' + PX(5760879, 600) + ' | cat:Céramique\n' + PX(6311800, 600) + ' | cat:Textiles' },
    offrejour: { etiquette: 'Offre du jour', badge: 'Nouveau', accroche: 'Dépêchez-vous : se termine dans', fin: PAON_FIN_DEMO, gros: 'Rabais 40 %', categorie: 'Bougies', bouton: 'Voir le produit', tuiles: 'Offres limitées | ' + PX(14188395, 900) + ' | catalogue\nTrouvez votre style | ' + PX(4857772, 900) + ' | catalogue' },
    avantapres: { surtitre: 'Exemple de démonstration', titre: 'Un salon *transformé*', texte: 'Exemple de démonstration : deux photos de votre choix et un curseur pour les comparer.', photoAvant: PX(4013073, 1400), photoApres: PX(37023129, 1400), etiquetteAvant: 'Avant', etiquetteApres: 'Après', categorie: 'Bougies', nombre: 3 },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des objets pensés pour durer *à la maison*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Collections', sousTitre: 'Exemple de démonstration : choisissez ce qui vous inspire.', bouton: 'Voir tout', boutonExplorer: 'Explorer' },
    vitrine: { photo: PX(4013073, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Table', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre style', titre: 'Que cherchez-vous ?', photo: PX(11410247, 1000), options: 'Une bougie | cat:Bougies\nDe la vaisselle | cat:Céramique\nUn textile | cat:Textilescat:Bougies' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(4857772, 600) + ' | Bougies | 257 $ | catalogue\n' + PX(37023129, 600) + ' | Céramique | 198 $ | catalogue\n' + PX(14188395, 600) + ' | Table | 330 $ | catalogue', criteres: 'Usage | chantier | atelier | plein air\nPoids | léger | moyen | léger\nGarantie | 2 ans | 1 an | 1 an' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(6311800, 700) + '\n' + PX(262882, 700),
    avantages: [],
    paon: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(10610004, 600) + ' | catalogue\n' + PX(4013073, 600) + ' | catalogue\n' + PX(11410247, 600) + ' | catalogue\n' + PX(4857772, 600) + ' | catalogue\n' + PX(37023129, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    offrespe: { titre: 'Offre spéciale', texte: 'Exemple de démonstration : mettez en avant une sélection de saison, avec un court texte pour donner envie.', mention: 'Jusqu’à -30 % sur la sélection', categorie: 'Bougies', nombre: 3 },
    ventesflash: { titre: 'Ventes flash', fin: PAON_FIN_DEMO, texte: 'Exemple de démonstration : une vente à durée limitée.', bouton: 'Voir les promotions', lien: 'catalogue', categorie: '', nombre: 3 },
    bandes: true, couleurBande: '#e3c9c4', etiquettePromo: 'Vente flash',
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#021f28', couleurTexte: '#f6ece8', couleurAccent: '#e3c9c4', icone: '●', lien: '' },
    bandeaux: [{ titre: 'Une maison *douce*', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(14188395, 1800) }],
    focus: { titre: 'Sélection *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(6311800, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(262882, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(10610004, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(4013073, 1000), couleur: '' },
      { titre: 'Nos *accessoires*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Bougies', photo: PX(11410247, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: PAON_FIN_DEMO, photo: PX(4857772, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Paon', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Pop : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_POP = [
  { id: 1, titre: 'Cahier à spirale', prix: 9, stock: 15, categorie: 'Cahiers', description: 'Exemple de produit de démonstration.', sku: 'CA-1001', photo_principale: PX(6193017) },
  { id: 2, titre: 'Cahiers colorés', prix: 18, prix_promo: 14, stock: 15, categorie: 'Cahiers', description: 'Exemple de produit de démonstration.', sku: 'CA-1002', photo_principale: PX(6193089) },
  { id: 3, titre: 'Carnet de croquis', prix: 12, stock: 15, categorie: 'Cahiers', description: 'Exemple de produit de démonstration.', sku: 'CA-1003', photo_principale: PX(5088019) },
  { id: 4, titre: 'Boîte de peinture', prix: 29, stock: 15, categorie: 'Peinture', description: 'Exemple de produit de démonstration.', sku: 'PE-2001', photo_principale: PX(6925028) },
  { id: 5, titre: 'Set de pinceaux', prix: 22, prix_promo: 17, stock: 15, categorie: 'Peinture', description: 'Exemple de produit de démonstration.', sku: 'PE-2002', photo_principale: PX(3777876) },
  { id: 6, titre: 'Atelier créatif', prix: 45, stock: 15, categorie: 'Peinture', description: 'Exemple de produit de démonstration.', sku: 'PE-2003', photo_principale: PX(29589096) },
  { id: 7, titre: 'Crayons de couleur', prix: 15, stock: 15, categorie: 'Crayons', description: 'Exemple de produit de démonstration.', sku: 'CR-3001', photo_principale: PX(5554656) },
  { id: 8, titre: 'Marqueurs assortis', prix: 19, stock: 0, categorie: 'Crayons', description: 'Exemple de produit de démonstration.', sku: 'CR-3002', photo_principale: PX(4968504) },
  { id: 9, titre: 'Crayons et trombones', prix: 11, prix_promo: 9, stock: 15, categorie: 'Crayons', description: 'Exemple de produit de démonstration.', sku: 'CR-3003', photo_principale: PX(7054779) },
  { id: 10, titre: 'Kit de bricolage', prix: 24, stock: 15, categorie: 'Loisirs', description: 'Exemple de produit de démonstration.', sku: 'LO-4001', photo_principale: PX(17042499) },
  { id: 11, titre: 'Rubans adhésifs', prix: 8, stock: 15, categorie: 'Loisirs', description: 'Exemple de produit de démonstration.', sku: 'LO-4002', photo_principale: PX(8250941) },
];
const DEMO_ARTICLES_POP = [
  { id: 9001, titre: 'Exemple : bien choisir son carnet', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5382917), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : démarrer la peinture à l’aquarelle', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(17042499), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : organiser son coin créatif', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(6193089), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const POP_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_POP = { pop: {
  accueil: {
    hero: { titre: 'Le geste, la matière', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(28503352, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Exemple de démonstration', titre: 'Créez *sans limites*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(6193089, 1600), badge: 'Nouveau' },
      { surtitre: 'Nouveautés', titre: 'Les *nouveautés* du moment', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les nouveautés', lien: 'catalogue', photo: PX(5554656, 1600) },
      { surtitre: 'Peinture', titre: 'Un atelier *coloré*', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir la peinture', lien: 'cat:Peinture', photo: PX(17042499, 1600), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    mosaique: { photo: PX(17042499, 1000), titre: 'Explorez l’atelier', texte: 'Exemple de démonstration : du matériel coloré pour dessiner, peindre et bricoler.', bouton: 'Magasiner', lien: 'catalogue', photos: PX(3777876, 600) + ' | cat:Crayons\n' + PX(5554656, 600) + ' | cat:Crayons\n' + PX(5088019, 600) + ' | cat:Crayons\n' + PX(4968504, 600) + ' | cat:Loisirs' },
    offrejour: { etiquette: 'Offre du jour', badge: 'Nouveau', accroche: 'Dépêchez-vous : se termine dans', fin: POP_FIN_DEMO, gros: 'Rabais 40 %', categorie: 'Cahiers', bouton: 'Voir le produit', tuiles: 'Offres limitées | ' + PX(5554656, 900) + ' | catalogue\nTrouvez votre matériel | ' + PX(6193089, 900) + ' | catalogue' },
    avantapres: { surtitre: 'Exemple de démonstration', titre: 'Un bureau *transformé*', texte: 'Exemple de démonstration : deux photos de votre choix et un curseur pour les comparer.', photoAvant: PX(5382917, 1400), photoApres: PX(28503352, 1400), etiquetteAvant: 'Avant', etiquetteApres: 'Après', categorie: 'Cahiers', nombre: 3 },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Du matériel pensé pour *créer*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre boutique en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Collections', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(5382917, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Peinture', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre matériel', titre: 'Que cherchez-vous ?', photo: PX(17042499, 1000), options: 'Un cahier | cat:Cahiers\nDes crayons | cat:Crayons\nDu bricolage | cat:Loisirscat:Cahiers' },
    comparatif: { titre: 'Comparez nos *produits*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos produits', produits: PX(6193089, 600) + ' | Cahiers | 257 $ | catalogue\n' + PX(28503352, 600) + ' | Crayons | 198 $ | catalogue\n' + PX(5554656, 600) + ' | Peinture | 330 $ | catalogue', criteres: 'Usage | chantier | atelier | plein air\nPoids | léger | moyen | léger\nGarantie | 2 ans | 1 an | 1 an' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(4968504, 700) + '\n' + PX(6925028, 700),
    avantages: [],
    pop: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(3777876, 600) + ' | catalogue\n' + PX(5382917, 600) + ' | catalogue\n' + PX(17042499, 600) + ' | catalogue\n' + PX(6193089, 600) + ' | catalogue\n' + PX(28503352, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison suivie\n↩️ | Retours simples\n✅ | Qualité vérifiée' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    bandes: true, couleurBande: '#ffd166',
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#fff7e6', couleurTexte: '#d93d23', couleurAccent: '#d93d23', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Prêt à *créer* ?', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(5554656, 1800) }],
    focus: { titre: 'Sélection *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(4968504, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(6925028, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(3777876, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendus*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(5382917, 1000), couleur: '' },
      { titre: 'Nos *accessoires*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Cahiers', photo: PX(17042499, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: POP_FIN_DEMO, photo: PX(6193089, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Pop', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Nocturne : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_NOCTURNE = [
  { id: 1, titre: 'Monstera en pot', prix: 34, stock: 15, categorie: 'Plantes', description: 'Exemple de produit de démonstration.', sku: 'PL-1001', photo_principale: PX(5075473) },
  { id: 2, titre: 'Plante en pot gris', prix: 28, prix_promo: 22, stock: 15, categorie: 'Plantes', description: 'Exemple de produit de démonstration.', sku: 'PL-1002', photo_principale: PX(8581056) },
  { id: 3, titre: 'Duo de plantes d’intérieur', prix: 54, stock: 15, categorie: 'Plantes', description: 'Exemple de produit de démonstration.', sku: 'PL-1003', photo_principale: PX(4846104) },
  { id: 4, titre: 'Plante sur socle', prix: 39, stock: 15, categorie: 'Plantes', description: 'Exemple de produit de démonstration.', sku: 'PL-1004', photo_principale: PX(3153524) },
  { id: 5, titre: 'Cactus en pot d’argile', prix: 16, stock: 15, categorie: 'Succulentes', description: 'Exemple de produit de démonstration.', sku: 'SU-2001', photo_principale: PX(4100579) },
  { id: 6, titre: 'Trio de succulentes', prix: 24, prix_promo: 19, stock: 15, categorie: 'Succulentes', description: 'Exemple de produit de démonstration.', sku: 'SU-2002', photo_principale: PX(1424672) },
  { id: 7, titre: 'Cactus de fenêtre', prix: 14, stock: 0, categorie: 'Succulentes', description: 'Exemple de produit de démonstration.', sku: 'SU-2003', photo_principale: PX(1201798) },
  { id: 8, titre: 'Terrarium en bocal', prix: 32, stock: 15, categorie: 'Terrariums', description: 'Exemple de produit de démonstration.', sku: 'TE-3001', photo_principale: PX(1466434) },
  { id: 9, titre: 'Terrarium en verre', prix: 48, prix_promo: 39, stock: 15, categorie: 'Terrariums', description: 'Exemple de produit de démonstration.', sku: 'TE-3002', photo_principale: PX(1105671) },
  { id: 10, titre: 'Terreau et pots', prix: 18, stock: 15, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4001', photo_principale: PX(4750383) },
  { id: 11, titre: 'Kit de rempotage', prix: 26, stock: 15, categorie: 'Accessoires', description: 'Exemple de produit de démonstration.', sku: 'AC-4002', photo_principale: PX(3094208) },
];
const DEMO_ARTICLES_NOCTURNE = [
  { id: 9001, titre: 'Exemple : bien arroser ses plantes', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(5830763), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : réussir son premier terrarium', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(7639970), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : rempoter en cinq étapes', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(3094220), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const NOCTURNE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_NOCTURNE = { nocturne: {
  accueil: {
    hero: { titre: 'Des plantes pour rêver', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(10163243, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Livraison rapide · Pousses garanties · Arrivages de saison', titre: 'Des plantes pour *rêver*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre. Chaque plante est choisie avec soin pour s’épanouir chez vous.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(10163243, 1600) },
      { surtitre: 'Succulentes · Faciles d’entretien', titre: 'Un coin *vert* chez vous', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les succulentes', lien: 'cat:Succulentes', photo: PX(4100579, 1600), badge: 'Nouveau' },
      { surtitre: 'Terrariums · Faits main', titre: 'Un petit *jardin* sous verre', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les terrariums', lien: 'cat:Terrariums', photo: PX(1466434, 1600), badge: '-20 %' },
    ],
    onde: { messages: 'Exemple : un premier message\nExemple : un deuxième message\nExemple : un troisième message' },
    mosaique: { photo: PX(4846104, 1000), titre: 'Explorez la serre', texte: 'Exemple de démonstration : des plantes, des pots et du terreau pour tout le salon.', bouton: 'Magasiner', lien: 'catalogue', photos: PX(1424672, 600) + ' | cat:Succulentes\n' + PX(4100579, 600) + ' | cat:Succulentes\n' + PX(1105671, 600) + ' | cat:Terrariums\n' + PX(4750383, 600) + ' | cat:Accessoires' },
    offrejour: { etiquette: 'Offre du jour', badge: 'Nouveau', accroche: 'Dépêchez-vous : se termine dans', fin: NOCTURNE_FIN_DEMO, gros: 'Rabais 40 %', categorie: 'Plantes', bouton: 'Voir le produit', tuiles: 'Offres limitées | ' + PX(1424672, 900) + ' | catalogue\nTrouvez votre plante | ' + PX(5075473, 900) + ' | catalogue' },
    avantapres: { surtitre: 'Exemple de démonstration', titre: 'Un salon *transformé*', texte: 'Exemple de démonstration : deux photos de votre choix et un curseur pour les comparer.', photoAvant: PX(7907407, 1400), photoApres: PX(10163243, 1400), etiquetteAvant: 'Avant', etiquetteApres: 'Après', categorie: 'Plantes', nombre: 3 },
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    top10: { titre: 'Notre *sélection*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 8 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    grostexte: { texte: 'Des plantes pensées pour *vivre chez vous*', photos: '', sousTexte: 'Exemple de démonstration : présentez ici votre boutique en quelques phrases. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos' },
    bandepromo: { titre: '*Offre* du mois', texte: 'Exemple de démonstration : une offre à mettre en avant.', bouton: 'Voir l\'offre', lien: 'catalogue' },
    video: { titre: 'Notre serre en *vidéo*', sousTitre: 'Exemple de démonstration', url: '' },
    collections: { titre: 'Collections', sousTitre: 'Exemple de démonstration' },
    vitrine: { photo: PX(4846104, 1200), points: '30 | 40 | catalogue\n62 | 58 | catalogue', categorie: 'Plantes', nombre: 4, bouton: 'Choisir' },
    nouveautes: { titre: 'Nouveautés', sousTitre: '', categorie: '', nombre: 10 },
    trouveur: { etiquette: 'Trouvez votre plante', titre: 'Que cherchez-vous ?', photo: PX(4484184, 1000), options: 'Une plante verte | cat:Plantes\nUne succulente | cat:Succulentes\nUn terrarium | cat:Terrariums' },
    comparatif: { titre: 'Comparez nos *plantes*', sousTitre: 'Exemple de démonstration : tableau saisi à la main', libelle: 'Nos plantes', produits: PX(5075473, 600) + ' | Monstera | 34 $ | catalogue\n' + PX(4100579, 600) + ' | Cactus | 16 $ | catalogue\n' + PX(1466434, 600) + ' | Terrarium | 32 $ | catalogue', criteres: 'Lumière | vive | forte | douce\nArrosage | modéré | rare | rare\nEntretien | facile | très facile | facile' },
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(1982095, 700) + '\n' + PX(793012, 700),
    avantages: [],
    nocturne: { titre: 'Sur les *réseaux*', sousTitre: 'Exemple de démonstration', items: PX(4100579, 600) + ' | catalogue\n' + PX(1466434, 600) + ' | catalogue\n' + PX(5075473, 600) + ' | catalogue\n' + PX(4846104, 600) + ' | catalogue\n' + PX(1424672, 600) + ' | catalogue' },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison soignée\n↩️ | Retours simples\n🌱 | Plantes garanties' },
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    bandes: true, couleurBande: '#2a1d52', etoiles: true, ornements: true, pointFinal: true, boutonFlottant: true, flottantTexte: 'Découvrir la boutique', flottantLien: '/catalogue',
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#130d28', couleurTexte: '#cdc3f8', couleurAccent: '#b6f7a0', icone: '✦', lien: '' },
    bandeaux: [{ titre: 'Envie de *verdure* ?', sousTitre: 'Exemple de démonstration : un texte court sous le titre.', bouton: 'Découvrir', lien: 'catalogue', bouton2: 'En savoir plus', lien2: 'a-propos', photo: PX(1982095, 1800) }],
    focus: { titre: 'Sélection *vedette*', texte: 'Exemple de démonstration', bouton: 'Découvrir', lien: 'catalogue', photo: PX(8581056, 1000), categorie: '', nombre: 4 },
    etapes: { titre: 'Pourquoi *nous choisir*', photo: PX(4484184, 1200), items: 'Premier point fort | Exemple de démonstration : décrivez ici un avantage réel de votre boutique.\nDeuxième point fort | Exemple de démonstration : un deuxième avantage.\nTroisième point fort | Exemple de démonstration : un troisième avantage.', bouton: 'En savoir plus', lien: 'a-propos' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(3094208, 1200), inverser: false },
    tuiles: [
      { titre: 'Les *plus vendues*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(7639970, 1000), couleur: '' },
      { titre: 'Nos *accessoires*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Accessoires', photo: PX(5144485, 1000), couleur: '' },
    ],
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: NOCTURNE_FIN_DEMO, photo: PX(4484184, 1600), bouton: 'En savoir plus', lien: 'contact' },
    accordeon: { titre: 'Caractéristiques', items: 'Première caractéristique | Exemple de démonstration : le détail s\'affiche ici.\nDeuxième caractéristique | Exemple de démonstration : le détail s\'affiche ici.' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.\nTroisième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
  },
  footer: { nomBoutique: 'Ma boutique Nocturne', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

// Simplisse Orbite : démonstration seulement — photos libres de droits (Pexels, usage commercial permis sans attribution), jamais affichées sur une vraie boutique
const DEMO_PRODUITS_ORBITE = [
  { id: 1, titre: 'Lampe de table design', prix: 64, stock: 15, categorie: 'Lampes de table', description: 'Exemple de produit de démonstration.', sku: 'LT-1001', photo_principale: PX(34237532) },
  { id: 2, titre: 'Lampe rose et jaune', prix: 58, prix_promo: 46, stock: 15, categorie: 'Lampes de table', description: 'Exemple de produit de démonstration.', sku: 'LT-1002', photo_principale: PX(1023067) },
  { id: 3, titre: 'Lampe de bureau chaude', prix: 49, stock: 15, categorie: 'Lampes de table', description: 'Exemple de produit de démonstration.', sku: 'LT-1003', photo_principale: PX(33164413) },
  { id: 4, titre: 'Lampe de chevet', prix: 42, stock: 15, categorie: 'Lampes de table', description: 'Exemple de produit de démonstration.', sku: 'LT-1004', photo_principale: PX(30107913) },
  { id: 5, titre: 'Duo de suspensions noires', prix: 120, stock: 15, categorie: 'Suspensions', description: 'Exemple de produit de démonstration.', sku: 'SU-2001', photo_principale: PX(408847) },
  { id: 6, titre: 'Suspension en verre', prix: 98, prix_promo: 79, stock: 15, categorie: 'Suspensions', description: 'Exemple de produit de démonstration.', sku: 'SU-2002', photo_principale: PX(13613289) },
  { id: 7, titre: 'Lampe d’ambiance salon', prix: 76, stock: 0, categorie: 'Ambiance', description: 'Exemple de produit de démonstration.', sku: 'AM-3001', photo_principale: PX(34726411) },
  { id: 8, titre: 'Lampe sur plateau', prix: 54, stock: 15, categorie: 'Ambiance', description: 'Exemple de produit de démonstration.', sku: 'AM-3002', photo_principale: PX(21649114) },
  { id: 9, titre: 'Veilleuse minimaliste', prix: 28, stock: 15, categorie: 'Veilleuses', description: 'Exemple de produit de démonstration.', sku: 'VE-4001', photo_principale: PX(33096005) },
  { id: 10, titre: 'Projecteur de galaxie', prix: 45, prix_promo: 36, stock: 15, categorie: 'Veilleuses', description: 'Exemple de produit de démonstration.', sku: 'VE-4002', photo_principale: PX(4021523) },
  { id: 11, titre: 'Enseigne néon', prix: 69, stock: 15, categorie: 'Veilleuses', description: 'Exemple de produit de démonstration.', sku: 'VE-4003', photo_principale: PX(10827984) },
];
const DEMO_ARTICLES_ORBITE = [
  { id: 9001, titre: 'Exemple : choisir sa lampe de chevet', slug: 'exemple-filtre', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(33096005), date_publication: new Date(Date.now() - 5 * 864e5).toISOString(), categorie: 'Conseils', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9002, titre: 'Exemple : réussir l’éclairage d’un salon', slug: 'exemple-torrefaction', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(30107913), date_publication: new Date(Date.now() - 12 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
  { id: 9003, titre: 'Exemple : une suspension en cinq étapes', slug: 'exemple-mouture', extrait: 'Article d\'exemple de la démonstration.', image_couverture: PX(13344261), date_publication: new Date(Date.now() - 20 * 864e5).toISOString(), categorie: 'Guides', contenu: 'Exemple de démonstration : votre vrai blogue remplace cet article.' },
];
const ORBITE_FIN_DEMO = (() => { const d = new Date(Date.now() + 15 * 864e5); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; })();
const DEMO_CONFIG_ORBITE = { orbite: {
  accueil: {
    hero: { titre: 'Des lueurs pour rêver', sousTitre: 'Exemple de démonstration', boutonLabel: 'Magasiner', boutonLien: '/catalogue', photo: PX(4021523, 1600), style: 'image-fond' },
    entete: { barreHaut: { actif: true, gauche: 'Exemple de démonstration : message de la barre du haut', droite: 'Aide | contact\nBlogue | blog' } },
    diaporama: [
      { surtitre: 'Livraison rapide · Garantie 2 ans · Nouveautés chaque mois', titre: 'Des lueurs pour *rêver*', texte: 'Exemple de démonstration : remplacez ce texte par le vôtre. Chaque luminaire est choisi avec soin pour habiller vos soirées.', bouton: 'Magasiner', lien: 'catalogue', photo: PX(4021523, 1600), photo2: PX(1023067, 500), badge: 'Nouveau' },
      { surtitre: 'Veilleuses · Douces et colorées', titre: 'Un coin *doux* chez vous', texte: 'Exemple de démonstration : un deuxième message.', bouton: 'Voir les veilleuses', lien: 'cat:Veilleuses', photo: PX(10827984, 1600) },
      { surtitre: 'Suspensions · Design', titre: 'Une *lumière* qui suspend le temps', texte: 'Exemple de démonstration : un troisième message.', bouton: 'Voir les suspensions', lien: 'cat:Suspensions', photo: PX(13613289, 1600), badge: '-20 %' },
    ],
    parcourir: { titre: 'Magasiner par catégorie', nombre: 6 },
    vedette: { titre: 'Nos *meilleurs vendeurs*', sousTitre: 'Exemple de démonstration', categorie: '', nombre: 10 },
    pastilles: { titre: 'Nos *garanties*', items: '🔒 | Paiement sécurisé\n🚚 | Livraison soignée\n↩️ | Retours simples\n💡 | Garantie 2 ans' },
    presentation: { titre: 'À propos de la *boutique*', texte: 'Exemple de démonstration : présentez ici votre boutique, votre sélection et ce qui vous distingue. Ce texte est remplacé par le vôtre.', bouton: 'En savoir plus', lien: 'a-propos', photo: PX(34726411, 1200), inverser: false },
    etapes: { titre: 'Comment ça *marche*', photo: PX(33164413, 1200), items: 'Choisissez | Exemple de démonstration : parcourez le catalogue et ajoutez vos coups de cœur au panier.\nCommandez | Exemple de démonstration : paiement sécurisé et confirmation immédiate.\nRecevez | Exemple de démonstration : livraison soignée, prête à brancher.', bouton: 'En savoir plus', lien: 'a-propos' },
    avantages: [
      { ico: '✨', titre: 'Pièces choisies', desc: 'Exemple de démonstration : décrivez ici un engagement réel de votre boutique.' },
      { ico: '🎨', titre: 'Ambiances variées', desc: 'Exemple de démonstration : un deuxième engagement.' },
      { ico: '🔧', titre: 'Prêt à poser', desc: 'Exemple de démonstration : un troisième engagement.' },
      { ico: '💬', titre: 'Conseils offerts', desc: 'Exemple de démonstration : un quatrième engagement.' },
    ],
    temoignagesTitre: 'Avis de nos *clients*', temoignagesSousTitre: 'Exemple de démonstration', temoignagesPhotos: PX(1982095, 700) + '\n' + PX(793012, 700),
    decompte: { titre: 'Une *vente* se termine bientôt', sousTitre: 'Exemple de démonstration : date fictive', fin: ORBITE_FIN_DEMO, photo: PX(3213577, 1600), bouton: 'En savoir plus', lien: 'contact' },
    tuiles: [
      { titre: 'Les *plus vendues*', texte: 'Exemple de démonstration : une carte promo.', bouton: 'Voir maintenant', lien: 'catalogue', photo: PX(30107913, 1000), couleur: '' },
      { titre: 'Nos *veilleuses*', texte: 'Exemple de démonstration : une deuxième carte promo.', bouton: 'Voir maintenant', lien: 'cat:Veilleuses', photo: PX(33096005, 1000), couleur: '' },
    ],
    blogApercu: { titre: 'Notre *blogue*', sousTitre: 'Exemple de démonstration', bouton: 'Lire le blogue' },
    accordeon2: { titre: 'Questions fréquentes', items: 'Première question ? | Exemple de démonstration : la réponse s\'affiche ici.\nDeuxième question ? | Exemple de démonstration : la réponse s\'affiche ici.\nTroisième question ? | Exemple de démonstration : la réponse s\'affiche ici.' },
    marques: { items: ' | Marque exemple 1 | \n | Marque exemple 2 | \n | Marque exemple 3 | \n | Marque exemple 4 | ' },
    bandes: true, couleurBande: '#14194f', etoiles: true, ornements: true, boutonFlottant: true, flottantTexte: 'Découvrir la boutique', flottantLien: '/catalogue',
    photoBande1: PX(7603274, 1800), photoBande2: PX(10828609, 1800), photoBande3: PX(3213577, 1800),
    ticker: { messages: 'Exemple : un message de votre boutique\nExemple : un autre message', vitesse: 'normale', couleurFond: '#0f1240', couleurTexte: '#e6e8ff', couleurAccent: '#ffe9a3', icone: '✦', lien: '' },
  },
  footer: { nomBoutique: 'Ma boutique Orbite', slogan: 'Exemple de démonstration', afficherPropulse: true,
    reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
    aide: { titre: 'Besoin d\'aide ?', texte: 'Exemple de démonstration : une équipe pour vous conseiller.', bouton: 'Nous joindre', lien: 'contact', photo: '' },
    paiements: 'Visa\nMastercard\nPayPal' },
} };

const DEMO_CONFIG_CATALOGUE = { avance: { footer: { nomBoutique: 'Ma Boutique', afficherPropulse: true } } };

// Mono-produit : UN seul produit, avec options (démonstration seulement — une vraie boutique n'affiche jamais ces exemples)
const DEMO_PRODUITS_MONO = [
  { id: 1, titre: 'Sac à dos Voyageur', prix: 129.99, prix_promo: 99.99, stock: 20, categorie: 'Sacs', description: 'Un sac à dos robuste pour tous vos déplacements. Exemple de produit : remplacez-le par le vôtre.', photo_principale:'', emoji:'🎒', photos: [],
    variantes: [
      { nom: 'Noir / 20L', prix: 99.99, stock: 8, options: { Couleur: 'Noir', Capacité: '20L' } },
      { nom: 'Noir / 30L', prix: 119.99, stock: 5, options: { Couleur: 'Noir', Capacité: '30L' } },
      { nom: 'Kaki / 20L', prix: 99.99, stock: 7, options: { Couleur: 'Kaki', Capacité: '20L' } },
      { nom: 'Kaki / 30L', prix: 119.99, stock: 0, options: { Couleur: 'Kaki', Capacité: '30L' } },
    ] },
];

const DEMO_CONFIG_SIMPLE = { simple: { footer: { nomBoutique: 'Ma Boutique', afficherPropulse: true } } };

const DEMO_CONFIG_SIMPLISSE = {
  simplisse: {
    accueil: {
      couleurPrimaire: '#2563eb', couleurSecondaire: '#64748b',
      couleurFondPage: '#ffffff', couleurTexte: '#1a1a1a', police: 'Inter',
      banniere: { actif: true, texte: '🎉 Livraison gratuite dès 75$ !', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      hero: { titre: 'Bienvenue dans Ma Belle Boutique', sousTitre: 'Découvrez notre sélection de produits soigneusement choisis pour vous.', boutonLabel: 'Voir le catalogue', boutonLien: '/catalogue', photo: '', couleurFond: '#f8fafc', couleurTitre: '#1a1a1a', couleurBouton: '#2563eb', style: 'centre' },
      sections: [
        { id: 'banniere',    label: 'Bannière',    icone: '📢', actif: true, ordre: 1 },
        { id: 'hero',        label: 'Hero',        icone: '🖼', actif: true, ordre: 2 },
        { id: 'avantages',   label: 'Avantages',   icone: '✅', actif: true, ordre: 3 },
        { id: 'vedette',     label: 'Vedette',     icone: '⭐', actif: true, ordre: 4 },
        { id: 'categories',  label: 'Catégories',  icone: '🗂', actif: true, ordre: 5 },
        { id: 'temoignages', label: 'Témoignages', icone: '💬', actif: true, ordre: 6 },
      ],
    },
    catalogue: {
      titre: 'Notre catalogue', sousTitre: 'Tous nos produits disponibles.',
      colonnes: 3, afficherFiltres: true, afficherRecherche: true, afficherPrix: true, afficherStock: true,
      sections: [],
    },
    faq: {
      titre: 'Questions fréquentes', sousTitre: 'Trouvez rapidement les réponses à vos questions.',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      items: [
        { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables.' },
        { question: 'Puis-je retourner un article ?', reponse: 'Oui, sous 30 jours suivant la réception.' },
        { question: 'Quels modes de paiement acceptez-vous ?', reponse: 'Visa, Mastercard et Apple Pay via Stripe.' },
      ],
    },
    blog: {
      titre: 'Notre blogue', sousTitre: 'Actualités, conseils et nouveautés.',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      afficherAuteur: true, afficherDate: true, colonnes: 3,
    },
    contact: {
      titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      adresse: '123 rue Principale, Montréal, QC H2X 1Y6',
      telephone: '514 000-0000', courriel: 'info@mabellboutique.ca',
      afficherCarte: false, urlCarte: '',
    },
    footer: {
      nomBoutique: 'Ma Belle Boutique', slogan: 'Qualité artisanale depuis 2020',
      couleurFond: '#111827', couleurTexte: '#ffffff', afficherPropulse: true,
      reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', tiktok: '', twitter: '', youtube: '', linkedin: '', pinterest: '' },
      colonnes: { titre1: 'Boutique', liens1: 'Accueil\nCatalogue\nBlog\nFAQ', titre2: 'Aide', liens2: 'Contact', titre3: '', liens3: '' },
      politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true },
    },
  },
  // Surcharger les méthodes de fetch pour retourner les produits démo
  __demo__: true,
};

// Config démo générique pour tous les autres templates
const DEMO_CONFIG_GENERIQUE = {
  nom_boutique: 'Boutique Démo',
  description: 'Ceci est un aperçu démo du template.',
};

export default function SitePreview({ vendeurIdProp, hidePreviewBar }: SitePreviewProps = {}) {
  const [params]  = useSearchParams();
  const vendeurId = vendeurIdProp != null ? String(vendeurIdProp) : params.get('vendeurId');
  const forceTemplate = params.get('forceTemplate');
  const isDemo    = params.get('demo') === 'true';

  const [siteData, setSiteData] = useState<any>(null);
  const [configMV, setConfigMV] = useState<any>({});
  const [options, setOptions] = useState<any>({});
  const [addonsBoutique, setAddonsBoutique] = useState<Record<string, boolean> | null>(null);   // add-ons boutique solo (null = pas encore chargés)
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState('');

  useEffect(() => {
    // Mode démo — zéro appel API
    if (isDemo && forceTemplate) {
      setLoading(false);
      return;
    }
    if (!vendeurId) { setErreur('ID vendeur manquant.'); setLoading(false); return; }
    fetch(`${API_BASE}/studio/sites/${vendeurId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSiteData(data);
        else setErreur('Site non trouvé ou non configuré.');
      })
      .catch(() => setErreur('Erreur de connexion.'))
      .finally(() => setLoading(false));

    // Charger la config spécifique multi-vendeur (table séparée)
    fetch(`${API_BASE}/gestionnaires/${vendeurId}/config-multivendeur`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data) setConfigMV(data); })
      .catch(() => {});

    // Charger les options/add-ons activés (route publique) — ex: reservation_ecole
    fetch(`${API_BASE}/gestionnaires/${vendeurId}/options`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data) setOptions(data); })
      .catch(() => {});
  }, [vendeurId, forceTemplate, isDemo]);

  useEffect(() => {
    if (siteData || (isDemo && forceTemplate)) window.scrollTo(0, 0);
  }, [siteData, isDemo, forceTemplate]);

  // Add-ons de la boutique solo (route publique) — jamais en mode démo
  useEffect(() => {
    if (isDemo || !vendeurId || !estBoutiqueSolo(String(siteData?.template_id || ''))) return;
    let actif = true;
    fetch(`${API_BASE}/boutique/catalogue/${vendeurId}/addons`)
      .then(r => r.ok ? r.json() : { addons: {} })
      .then(d => { if (actif) setAddonsBoutique((d && d.addons) || {}); })
      .catch(() => { if (actif) setAddonsBoutique({}); });
    return () => { actif = false; };
  }, [siteData?.template_id, vendeurId, isDemo]);

  // Add-on Analytique — track le chargement du site, respecte le consentement
  // cookie du visiteur. Jamais actif en mode démo ni sans vendeurId.
  useAnalytics(vendeurId, !isDemo && !!options?.analytique && !(forceTemplate || siteData?.template_id || '').startsWith('multi-vendeur-premium') && !(forceTemplate || siteData?.template_id || '').startsWith('boutique-premium') && !estSimplisseSeul(forceTemplate || siteData?.template_id || ''));   // le template Multi-vendeur Premium suit ses pages internes lui-même ; la boutique Premium utilise son propre add-on Analytique (useBoutiqueAnalytique)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16, background: '#0d0d0d' }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <p style={{ color: '#888', fontSize: 15 }}>Chargement de l'aperçu...</p>
    </div>
  );

  if (erreur) return <Page404Public gestionnaireId={vendeurId} />;

  // ── Déterminer templateId et config ───────────────────────────────────────
  const templateId = forceTemplate || siteData?.template_id || 'vitrine';
  const siteId     = siteData?.id;
  const configBD   = isDemo
    ? (estModeBoutique(templateId) ? DEMO_CONFIG_MODE : templateId.startsWith('boutique-simplisse') ? DEMO_CONFIG_SIMPLISSE : estMonoProduit(templateId) ? DEMO_CONFIG_SIMPLE : estCompleteBoutique(templateId) ? DEMO_CONFIG_COMPLETE : estCatalogueBoutique(templateId) ? DEMO_CONFIG_CATALOGUE : estAgricoleBoutique(templateId) ? DEMO_CONFIG_AGRICOLE : estArtisanBoutique(templateId) ? DEMO_CONFIG_ARTISAN : estAutoBoutique(templateId) ? DEMO_CONFIG_AUTO : estJouetsBoutique(templateId) ? DEMO_CONFIG_JOUETS : estGothiqueBoutique(templateId) ? DEMO_CONFIG_GOTHIQUE : estBDBoutique(templateId) ? DEMO_CONFIG_BD : estFuturisteBoutique(templateId) ? DEMO_CONFIG_FUTURISTE : estTechBoutique(templateId) ? DEMO_CONFIG_TECH : estRoseBoutique(templateId) ? DEMO_CONFIG_ROSE : estBonbonBoutique(templateId) ? DEMO_CONFIG_BONBON : estSoleilBoutique(templateId) ? DEMO_CONFIG_SOLEIL : estSentierBoutique(templateId) ? DEMO_CONFIG_SENTIER : estChantierBoutique(templateId) ? DEMO_CONFIG_CHANTIER : estCafeBoutique(templateId) ? DEMO_CONFIG_CAFE : estSakuraBoutique(templateId) ? DEMO_CONFIG_SAKURA : estSportBoutique(templateId) ? DEMO_CONFIG_SPORT : estJoyauBoutique(templateId) ? DEMO_CONFIG_JOYAU : estEcumeBoutique(templateId) ? DEMO_CONFIG_ECUME : estAudaceBoutique(templateId) ? DEMO_CONFIG_AUDACE : estCarnavalBoutique(templateId) ? DEMO_CONFIG_CARNAVAL : estPatchworkBoutique(templateId) ? DEMO_CONFIG_PATCHWORK : estVigieBoutique(templateId) ? DEMO_CONFIG_VIGIE : estAuroreBoutique(templateId) ? DEMO_CONFIG_AURORE : estGalerieBoutique(templateId) ? DEMO_CONFIG_GALERIE : estRallyeBoutique(templateId) ? DEMO_CONFIG_RALLYE : estPaonBoutique(templateId) ? DEMO_CONFIG_PAON : estPopBoutique(templateId) ? DEMO_CONFIG_POP : estNocturneBoutique(templateId) ? DEMO_CONFIG_NOCTURNE : estOrbiteBoutique(templateId) ? DEMO_CONFIG_ORBITE : templateId === 'agricole' ? {} : DEMO_CONFIG_GENERIQUE)
    : (siteData?.config || {});
  const config = { ...configBD, vendeurId: Number(vendeurId || 0) };

  // ── Rendu du template ─────────────────────────────────────────────────────
  const renderTemplate = () => {
    if (templateId === 'salon-coiffure')           return <TemplateSalon config={config} vendeurId={String(vendeurId || '0')} />;
    if (templateId === 'vitrine-paysager')         return <TemplatePaysager config={config} />;
    if (templateId === 'vitrine-avocat')           return <TemplateAvocat config={config} />;
    if (templateId === 'vitrine-resto')            return <TemplateResto config={config} />;
    if (templateId === 'vitrine-bistro')           return <TemplateBistro config={config} />;
    if (templateId === 'cours-piano')              return <TemplatePiano config={config} />;
    if (templateId === 'cours-langues')            return <TemplateLangues config={config} />;
    if (templateId === 'cours-web')                return <TemplateFormationWeb config={config} />;
    if (templateId === 'cours-cuisine')            return <TemplateEcoleCuisine config={config} />;
    if (templateId === 'cours-yoga')               return <TemplateStudioYoga config={config} />;
    if (templateId === 'cours-equitation')         return <TemplateEquitation config={config} />;
    if (templateId === 'cours-peinture')           return <TemplateEcolePeinture config={config} siteId={siteId} reservationActive={!!options.reservation_ecole} abonnementActive={!!options.abonnement_ecole} />;
    if (templateId === 'cours-danse')              return <TemplateEcoleDanse config={config} siteId={siteId} reservationActive={!!options.reservation_ecole} abonnementActive={!!options.abonnement_ecole} pubActive={!!options.pub_sponsor} />;
    if (templateId === 'vitrine-foodtruck')        return <TemplateFoodTruck config={config} />;
    if (templateId === 'vitrine-boulangerie')      return <TemplateBoulangerie config={config} />;
    if (templateId === 'cours-coach')              return <TemplateCoachVie config={config} />;
    if (templateId === 'agricole')                 return <TemplateAgricole config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-sante')        return <TemplateVitrineProSante config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-mariage')      return <TemplateVitrineProMariage config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-beaute')       return <TemplateVitrineProBeaute config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-tech')         return <TemplateVitrineProTech config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-entrepreneur') return <TemplateVitrineProEntrepreneur config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-galerie')          return <TemplateEnchereGalerie config={{ ...(config as any), ...(((config as any).enchere && typeof (config as any).enchere === 'object') ? (config as any).enchere : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-classique')       return <TemplateAnnoncesClassique config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-auto-classique')   return <TemplateAnnoncesAutoClassique config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-auto-showroom')   return <TemplateAnnoncesAutoShowroom config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-auto-lease')      return <TemplateAnnoncesAutoLease config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-volt')           return <TemplateAnnoncesVolt config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-neon')           return <TemplateAnnoncesNeon config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-allegro')           return <TemplateAnnoncesAllegro config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-services-neo')           return <TemplateAnnoncesServices config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-chalet')                 return <TemplateAnnoncesChalet config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-immeuble')           return <TemplateAnnoncesImmeuble config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'annonces-immo-classique')   return <TemplateAnnoncesImmoClassique config={{ ...(config as any), ...(((config as any).annonces && typeof (config as any).annonces === 'object') ? (config as any).annonces : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-live')             return <TemplateEnchereLive config={{ ...(config as any), ...(((config as any).enchere && typeof (config as any).enchere === 'object') ? (config as any).enchere : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'boutique-complete') {
      // Boutique Complète : vraies annonces du gestionnaire ; en démo seulement, des produits d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_COMPLETE } : config;
      return <TemplateBoutiqueComplete config={isDemo ? configDemo : configCompleteAvecBadge(configDemo, addonsBoutique, migrerComplete(configDemo))} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-catalogue') {
      // Catalogue Avancé : vraies annonces du gestionnaire ; en démo seulement, des produits d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_CATALOGUE } : config;
      return <TemplateBoutiqueCatalogue config={isDemo ? configDemo : configCatalogueAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.avance) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-artisan') {
      // Simplisse Artisan : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_ARTISAN } : config;
      return <TemplateBoutiqueArtisan config={isDemo ? configDemo : configArtisanAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.artisan) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-auto') {
      // Simplisse Auto : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_AUTO } : config;
      return <TemplateBoutiqueAuto config={isDemo ? configDemo : configAutoAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.auto) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-jouets') {
      // Simplisse Jouets : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_JOUETS, __articles_demo__: DEMO_ARTICLES_JOUETS } : config;
      return <TemplateBoutiqueJouets config={isDemo ? configDemo : configJouetsAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.jouets) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-gothique') {
      // Simplisse Gothique : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_GOTHIQUE, __articles_demo__: DEMO_ARTICLES_GOTHIQUE } : config;
      return <TemplateBoutiqueGothique config={isDemo ? configDemo : configGothiqueAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.gothique) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-bd') {
      // Simplisse BD : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_BD, __articles_demo__: DEMO_ARTICLES_BD } : config;
      return <TemplateBoutiqueBD config={isDemo ? configDemo : configBDAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.bd) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-futuriste') {
      // Simplisse Futuriste : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_FU, __articles_demo__: DEMO_ARTICLES_FU } : config;
      return <TemplateBoutiqueFuturiste config={isDemo ? configDemo : configFuturisteAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.futuriste) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-tech') {
      // Simplisse Tech : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_TECH, __articles_demo__: DEMO_ARTICLES_TECH } : config;
      return <TemplateBoutiqueTech config={isDemo ? configDemo : configTechAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.tech) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-rose') {
      // Simplisse Rosé : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_ROSE, __articles_demo__: DEMO_ARTICLES_ROSE } : config;
      return <TemplateBoutiqueRose config={isDemo ? configDemo : configRoseAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.rose) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-bonbon') {
      // Simplisse Bonbon : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_BONBON, __articles_demo__: DEMO_ARTICLES_BONBON } : config;
      return <TemplateBoutiqueBonbon config={isDemo ? configDemo : configBonbonAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.bonbon) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-soleil') {
      // Simplisse Soleil : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SOLEIL, __articles_demo__: DEMO_ARTICLES_SOLEIL } : config;
      return <TemplateBoutiqueSoleil config={isDemo ? configDemo : configSoleilAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.soleil) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-sentier') {
      // Simplisse Sentier : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SENTIER, __articles_demo__: DEMO_ARTICLES_SENTIER } : config;
      return <TemplateBoutiqueSentier config={isDemo ? configDemo : configSentierAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.sentier) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-chantier') {
      // Simplisse Chantier : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_CHANTIER, __articles_demo__: DEMO_ARTICLES_CHANTIER } : config;
      return <TemplateBoutiqueChantier config={isDemo ? configDemo : configChantierAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.chantier) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-cafe') {
      // Simplisse Café : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_CAFE, __articles_demo__: DEMO_ARTICLES_CAFE } : config;
      return <TemplateBoutiqueCafe config={isDemo ? configDemo : configCafeAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.cafe) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-sakura') {
      // Simplisse Sakura : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SAKURA, __articles_demo__: DEMO_ARTICLES_SAKURA } : config;
      return <TemplateBoutiqueSakura config={isDemo ? configDemo : configSakuraAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.sakura) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-sport') {
      // Simplisse Sport : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SPORT, __articles_demo__: DEMO_ARTICLES_SPORT } : config;
      return <TemplateBoutiqueSport config={isDemo ? configDemo : configSportAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.sport) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-joyau') {
      // Simplisse Joyau : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_JOYAU, __articles_demo__: DEMO_ARTICLES_JOYAU } : config;
      return <TemplateBoutiqueJoyau config={isDemo ? configDemo : configJoyauAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.joyau) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-ecume') {
      // Simplisse Écume : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_ECUME, __articles_demo__: DEMO_ARTICLES_ECUME } : config;
      return <TemplateBoutiqueEcume config={isDemo ? configDemo : configEcumeAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.ecume) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-audace') {
      // Simplisse Audace : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_AUDACE, __articles_demo__: DEMO_ARTICLES_AUDACE } : config;
      return <TemplateBoutiqueAudace config={isDemo ? configDemo : configAudaceAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.audace) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-carnaval') {
      // Simplisse Carnaval : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_CARNAVAL, __articles_demo__: DEMO_ARTICLES_CARNAVAL } : config;
      return <TemplateBoutiqueCarnaval config={isDemo ? configDemo : configCarnavalAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.carnaval) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-patchwork') {
      // Simplisse Patchwork : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_PATCHWORK, __articles_demo__: DEMO_ARTICLES_PATCHWORK } : config;
      return <TemplateBoutiquePatchwork config={isDemo ? configDemo : configPatchworkAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.patchwork) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-vigie') {
      // Simplisse Vigie : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_VIGIE, __articles_demo__: DEMO_ARTICLES_VIGIE } : config;
      return <TemplateBoutiqueVigie config={isDemo ? configDemo : configVigieAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.vigie) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-aurore') {
      // Simplisse Aurore : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_AURORE, __articles_demo__: DEMO_ARTICLES_AURORE } : config;
      return <TemplateBoutiqueAurore config={isDemo ? configDemo : configAuroreAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.aurore) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-galerie') {
      // Simplisse Galerie : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_GALERIE, __articles_demo__: DEMO_ARTICLES_GALERIE } : config;
      return <TemplateBoutiqueGalerie config={isDemo ? configDemo : configGalerieAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.galerie) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-rallye') {
      // Simplisse Rallye : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_RALLYE, __articles_demo__: DEMO_ARTICLES_RALLYE } : config;
      return <TemplateBoutiqueRallye config={isDemo ? configDemo : configRallyeAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.rallye) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-paon') {
      // Simplisse Paon : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_PAON, __articles_demo__: DEMO_ARTICLES_PAON } : config;
      return <TemplateBoutiquePaon config={isDemo ? configDemo : configPaonAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.paon) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-pop') {
      // Simplisse Pop : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_POP, __articles_demo__: DEMO_ARTICLES_POP } : config;
      return <TemplateBoutiquePop config={isDemo ? configDemo : configPopAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.pop) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-nocturne') {
      // Simplisse Nocturne : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_NOCTURNE, __articles_demo__: DEMO_ARTICLES_NOCTURNE } : config;
      return <TemplateBoutiqueNocturne config={isDemo ? configDemo : configNocturneAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.nocturne) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-orbite') {
      // Simplisse Orbite : vraies annonces du gestionnaire ; en démo seulement, des produits et photos d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_ORBITE, __articles_demo__: DEMO_ARTICLES_ORBITE } : config;
      return <TemplateBoutiqueOrbite config={isDemo ? configDemo : configOrbiteAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.orbite) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'boutique-agricole') {
      // Boutique Agricole : vraies annonces du gestionnaire ; en démo seulement, des produits d'exemple. Badge « Propulsé par » masqué seulement avec l'add-on.
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_AGRICOLE } : config;
      return <TemplateBoutiqueAgricole config={isDemo ? configDemo : configFermeAvecBadge(configDemo, addonsBoutique, (configDemo && configDemo.ferme) || {})} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (estMonoProduit(templateId)) {
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_MONO } : config;
      // Add-on « Cacher le branding » : badge « Propulsé par » masqué seulement si l'add-on est activé
      return <TemplateBoutiqueSimple config={isDemo ? configDemo : configSimpleAvecBadge(configDemo, addonsBoutique)} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('boutique-premium')) {
      const configDemo = isDemo
        ? { ...config, __produits_demo__: DEMO_PRODUITS_PREMIUM }
        : config;
      // Add-on « Cacher le branding » : badge « Propulsé par » masqué seulement si l'add-on est activé
      return <TemplateBoutiquePremium config={isDemo ? configDemo : configPremiumAvecBadge(configDemo, addonsBoutique)} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('boutique-beaute')) {
      const DEMO_PRODUITS_BEAUTE = [
        { id:1, titre:'Sérum Éclat Vitamine C', prix:49.99, prix_promo:39.99, stock:25, categorie:'Soins Visage', est_nouveau:true, note_moyenne:4.8, nb_avis:142, description:'Sérum concentré en vitamine C pure à 15%.', photo_principale:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', variantes:[{nom:'Format',valeurs:['30ml','50ml'],type:'taille'}] },
        { id:2, titre:'Crème Hydratante Rose', prix:34.99, stock:40, categorie:'Soins Visage', note_moyenne:4.9, nb_avis:87, description:'Crème riche à l\'extrait de rose de Damas.', photo_principale:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80' },
        { id:3, titre:'Palette Yeux « Sunset »', prix:42.00, stock:18, categorie:'Maquillage', est_nouveau:true, note_moyenne:4.7, nb_avis:203, description:'Palette de 12 fards aux teintes rosées et dorées.', photo_principale:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80' },
        { id:4, titre:'Brume Fixatrice Hydra', prix:24.99, prix_promo:18.99, stock:60, categorie:'Maquillage', note_moyenne:4.6, nb_avis:56, description:'Brume fixatrice formule aloe vera.', photo_principale:'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80' },
        { id:5, titre:'Masque Purifiant Argile', prix:29.99, stock:35, categorie:'Soins Visage', note_moyenne:4.8, nb_avis:41, description:'Masque à l\'argile verte et au charbon actif.', photo_principale:'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80' },
        { id:6, titre:'Rouge à Lèvres Mat Velours', prix:19.99, stock:50, categorie:'Maquillage', note_moyenne:4.7, nb_avis:92, description:'Rouge à lèvres mat longue tenue.', photo_principale:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', variantes:[{nom:'Couleur',valeurs:['Rose Nude','Rouge Passion','Bordeaux','Corail','Fuchsia'],type:'couleur'}] },
      ];
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_BEAUTE } : config;
      return <TemplateBoutiqueBeaute config={configDemo} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('multi-vendeur-premium')) {
      const configMVFinal = isDemo ? config : { ...config, ...configMV };
      return <TemplateMultiVendeurPremium config={configMVFinal} vendeurId={Number(vendeurId || 0)} isDemo={isDemo} />;
    }
    if (templateId.startsWith('boutique-simplisse-mode')) {
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SIMPLISSE_MODE } : config;
      return <TemplateBoutiqueSimplisseMode config={isDemo ? configDemo : configModeAvecBadge(configDemo, addonsBoutique, migrerMode(configDemo && configDemo.mode))} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('boutique-simplisse')) {
      // En mode démo — injecter les produits hardcodés via config
      const configDemo = isDemo
        ? { ...config, __produits_demo__: DEMO_PRODUITS_SIMPLISSE }
        : config;
      // Add-on « Cacher le branding » : badge « Propulsé par » masqué seulement si l'add-on est activé
      return <TemplateBoutiqueSimplisse config={isDemo ? configDemo : configSimplisseAvecBadge(configDemo, addonsBoutique)} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId === 'cagnotte-horizon')         return <TemplateCagnotteHorizon config={{ ...(config as any), ...(((config as any).cagnotte && typeof (config as any).cagnotte === 'object') ? (config as any).cagnotte : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'cagnotte-cause')           return <TemplateCagnotteCause config={{ ...(config as any), ...(((config as any).cagnotte && typeof (config as any).cagnotte === 'object') ? (config as any).cagnotte : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId.startsWith('cagnotte-'))        return <TemplateCagnotteClassique config={{ ...(config as any), ...(((config as any).cagnotte && typeof (config as any).cagnotte === 'object') ? (config as any).cagnotte : {}) }} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'reservation-spectacle')    return <TemplateSpectacle config={config} siteId={siteId} />;
    if (templateId === 'reservation-location-astro') return <TemplateLocationAstro config={config as any} siteId={siteId} />;
    if (templateId.startsWith('reservation-'))     return <TemplateReservation config={{ ...config, sousType: templateId.replace('reservation-', '') as any }} siteId={siteId} />;
    return <TemplateVitrine config={config} />;
  };

  return (
    <>
      {/* Bandeau MODE DÉMO — en bas pour ne pas cacher le header des templates */}
      {isDemo && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000, background: '#f59e0b', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'sans-serif', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>🎭</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>MODE DÉMO — Aperçu du template</span>
            <span style={{ fontSize: 11, color: '#444' }}>Aucune donnée n'est sauvegardée. Les produits et contenus sont fictifs.</span>
          </div>
          <button onClick={() => fermerApercu()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ✕ Fermer
          </button>
        </div>
      )}

      {/* Barre d'aperçu normale (non démo, non site public live) */}
      {!isDemo && !hidePreviewBar && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 36, background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a96e', letterSpacing: '1px' }}>e-VEND STUDIO</span>
            <span style={{ color: '#444', fontSize: 11 }}>›</span>
            <span style={{ fontSize: 11, color: '#666' }}>Mode aperçu — {templateId}</span>
          </div>
          <button onClick={() => fermerApercu()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            ✕ Fermer
          </button>
        </div>
      )}

      {/* Cookies — seulement en mode normal */}
      {!isDemo && vendeurId && <CookieBanner vendeurId={Number(vendeurId)} />}

      {/* Chatbot — actif seulement si l'add-on est activé, jamais en mode démo */}
      {/* Templates boutique (solo) : le chatbot suit l'add-on « Chatbot » de la boutique (jamais options_gestionnaire) ; les autres templates gardent leur comportement */}
      {!isDemo && vendeurId && estBoutiqueSolo(String(forceTemplate || siteData?.template_id || '')) && !!addonsBoutique?.chatbot && <BoutiqueChatbotWidget gestionnaireId={Number(vendeurId)} />}
      {!isDemo && vendeurId && !estBoutiqueSolo(String(forceTemplate || siteData?.template_id || '')) && !!options?.chatbot && <ChatbotWidget gestionnaireId={Number(vendeurId)} />}

      {/* Vérificateur d'âge — actif seulement si l'add-on est activé, jamais en mode démo.
          Le template Multi-vendeur Premium monte le sien (règle forfait/add-on) : on ne le double pas ici,
          sinon deux fenêtres s'empilent et il faut cliquer deux fois pour la fermer. */}
      {!isDemo && vendeurId && !templateId.startsWith('multi-vendeur-premium') && !templateId.startsWith('boutique-premium') && !estSimplisseSeul(templateId) && <VerificateurAge vendeurId={Number(vendeurId)} />}

      {/* Popup Annonce — templates boutique (solo) : suit l'add-on « Popup Annonce » de la boutique (jamais options_gestionnaire), jamais en mode démo.
          Placé avant le contenu : la bannière du haut se place dans la page, au-dessus du menu. */}
      {!isDemo && vendeurId && estBoutiqueSolo(String(forceTemplate || siteData?.template_id || '')) && !!addonsBoutique?.popup_annonce && <BoutiquePopupAnnonce gestionnaireId={Number(vendeurId)} decalageBas={!hidePreviewBar ? 44 : 0} reserveChat={!!addonsBoutique?.chatbot} />}

      {/* Effets de boutique — templates boutique (solo) : suit l'add-on « Effets de boutique », jamais en mode démo */}
      {!isDemo && vendeurId && estBoutiqueSolo(String(forceTemplate || siteData?.template_id || '')) && !!addonsBoutique?.effets_boutique && <EffetsBoutiqueSolo gestionnaireId={Number(vendeurId)} />}

      {/* Effets de boutique — sites vitrine (add-on effets_vitrine ; le serveur vérifie que le site est bien une vitrine), jamais en mode démo */}
      {!isDemo && vendeurId && !!options?.effets_vitrine && <EffetsVitrine gestionnaireId={Number(vendeurId)} />}

      {/* Contenu */}
      <div style={{ paddingBottom: 44 }}>
        {renderTemplate()}
        {/* Sites vitrine : bouton « Installer l'app » (n'apparaît que si le serveur a ajouté la PWA vitrine, sur mobile) */}
        {!isDemo && <VitrineBoutonInstallerApp />}
      </div>
    </>
  );
}