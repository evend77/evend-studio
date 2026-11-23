// CHEMIN : src/pages/SitePreview.tsx
// e-Vend Studio — Aperçu du site du vendeur (rendu réel)
// Accessible via /site-preview?vendeurId=X
// Mode démo : /site-preview?forceTemplate=xxx&demo=true — 100% hardcodé, zéro API

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Page404Public                  from './Page404Public';
import CookieBanner                   from '../components/CookieBanner';
import { useAnalytics }               from '../hooks/useAnalytics';
import ChatbotWidget                  from '../components/ChatbotWidget';
import BoutiqueChatbotWidget           from '../components/BoutiqueChatbotWidget';
import BoutiquePopupAnnonce            from '../components/BoutiquePopupAnnonce';
import VerificateurAge                from '../components/VerificateurAge';
import TemplateVitrine                from '../templates/TemplateVitrine';
import TemplateReservation            from '../templates/TemplateReservation';
import TemplateSpectacle              from '../templates/TemplateSpectacle';
import TemplateCagnottePro            from '../templates/TemplateCagnottePro';
import TemplateBoutiqueSimple         from '../templates/TemplateBoutiqueSimple';
import TemplateBoutiqueComplete, { migrerComplete } from '../templates/TemplateBoutiqueComplete';
import TemplateBoutiqueCatalogue from '../templates/TemplateBoutiqueCatalogue';
import TemplateBoutiqueAgricole from '../templates/TemplateBoutiqueAgricole';
import TemplateBoutiqueArtisan from '../templates/TemplateBoutiqueArtisan';
import TemplateBoutiqueAuto from '../templates/TemplateBoutiqueAuto';
import TemplateBoutiqueJouets from '../templates/TemplateBoutiqueJouets';
import TemplateAgricole               from '../templates/TemplateAgricole';
import TemplateVitrineProSante        from '../templates/TemplateVitrineProSante';
import TemplateVitrineProMariage      from '../templates/TemplateVitrineProMariage';
import TemplateVitrineProBeaute       from '../templates/TemplateVitrineProBeaute';
import TemplateVitrineProTech         from '../templates/TemplateVitrineProTech';
import TemplateVitrineProEntrepreneur from '../templates/TemplateVitrineProEntrepreneur';
import TemplateEnchereFlash           from '../templates/TemplateEnchereFlash';
import TemplateEnchereGalerie         from '../templates/TemplateEnchereGalerie';
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
import { configPremiumAvecBadge, configSimplisseAvecBadge, configSimpleAvecBadge, configCompleteAvecBadge, configCatalogueAvecBadge, configModeAvecBadge, configFermeAvecBadge, configArtisanAvecBadge, configAutoAvecBadge, configJouetsAvecBadge } from '../templates/shared/addons/badgeEvendMasquer';
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
const estModeBoutique = (t: string) => t.startsWith('boutique-simplisse-mode');
const estSimplisseSeul = (t: string) => (t.startsWith('boutique-simplisse') && !t.startsWith('boutique-simplisse-mode')) || estMonoProduit(t) || estCompleteBoutique(t) || estCatalogueBoutique(t) || estAgricoleBoutique(t) || estArtisanBoutique(t) || estAutoBoutique(t) || estJouetsBoutique(t) || estModeBoutique(t);
const estBoutiqueSolo = (t: string) => ['boutique-premium', 'boutique-simplisse', 'boutique-beaute'].some(p => t.startsWith(p)) || estMonoProduit(t) || estCompleteBoutique(t) || estCatalogueBoutique(t) || estAgricoleBoutique(t) || estArtisanBoutique(t) || estAutoBoutique(t) || estJouetsBoutique(t);

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
    ? (estModeBoutique(templateId) ? DEMO_CONFIG_MODE : templateId.startsWith('boutique-simplisse') ? DEMO_CONFIG_SIMPLISSE : estMonoProduit(templateId) ? DEMO_CONFIG_SIMPLE : estCompleteBoutique(templateId) ? DEMO_CONFIG_COMPLETE : estCatalogueBoutique(templateId) ? DEMO_CONFIG_CATALOGUE : estAgricoleBoutique(templateId) ? DEMO_CONFIG_AGRICOLE : estArtisanBoutique(templateId) ? DEMO_CONFIG_ARTISAN : estAutoBoutique(templateId) ? DEMO_CONFIG_AUTO : estJouetsBoutique(templateId) ? DEMO_CONFIG_JOUETS : templateId === 'agricole' ? {} : DEMO_CONFIG_GENERIQUE)
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
    if (templateId === 'enchere-flash')            return <TemplateEnchereFlash config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-galerie')          return <TemplateEnchereGalerie config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-live')             return <TemplateEnchereLive config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
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
    if (templateId.startsWith('cagnotte-'))        return <TemplateCagnottePro config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'reservation-spectacle')    return <TemplateSpectacle config={config} siteId={siteId} />;
    if (templateId.startsWith('reservation-'))     return <TemplateReservation config={config} siteId={siteId} />;
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
          <button onClick={() => window.close()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
          <button onClick={() => window.close()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
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

      {/* Contenu */}
      <div style={{ paddingBottom: 44 }}>
        {renderTemplate()}
      </div>
    </>
  );
}