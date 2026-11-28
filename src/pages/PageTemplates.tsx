// CHEMIN : src/pages/PageTemplates.tsx
// e-Vend Studio — Galerie publique des templates disponibles

import { ouvrirApercu as ouvrirApercuPwa } from '../utils/apercu';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuPublic from '../components/MenuPublic';
import BasDePage from '../components/BasDePage';

// ─── PHOTOS par catégorie (Pexels libre de droits) ───────────────────────────
export const PHOTOS: Record<string, string> = {
  hero:                   'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1600',
  // Boutique — Générique
  'boutique-simplisse':    'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-premium':      'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-simple':       'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-complete':     'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-catalogue':    'https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Boutique — Par industrie
  'boutique-simplisse-mode':      'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-artisan':             'https://images.pexels.com/photos/33684107/pexels-photo-33684107.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-auto':                'https://images.pexels.com/photos/8985967/pexels-photo-8985967.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-jouets':              'https://images.pexels.com/photos/5665500/pexels-photo-5665500.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-gothique':            'https://images.pexels.com/photos/3109671/pexels-photo-3109671.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-bd':                  'https://images.pexels.com/photos/6654172/pexels-photo-6654172.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-futuriste':           'https://images.pexels.com/photos/9996339/pexels-photo-9996339.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-tech':                'https://images.pexels.com/photos/38498457/pexels-photo-38498457.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-rose':                'https://images.pexels.com/photos/6543153/pexels-photo-6543153.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-bonbon':              'https://images.pexels.com/photos/1875919/pexels-photo-1875919.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-soleil':              'https://images.pexels.com/photos/796606/pexels-photo-796606.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-sentier':             'https://images.pexels.com/photos/30925315/pexels-photo-30925315.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-chantier':             'https://images.pexels.com/photos/8960996/pexels-photo-8960996.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-cafe':             'https://images.pexels.com/photos/4940744/pexels-photo-4940744.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-sakura':             'https://images.pexels.com/photos/92340/pexels-photo-92340.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-sport':             'https://images.pexels.com/photos/12918252/pexels-photo-12918252.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-joyau':             'https://images.pexels.com/photos/12636308/pexels-photo-12636308.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-ecume':             'https://images.pexels.com/photos/10493845/pexels-photo-10493845.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-audace':             'https://images.pexels.com/photos/12918252/pexels-photo-12918252.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-carnaval':             'https://images.pexels.com/photos/7624977/pexels-photo-7624977.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-patchwork':             'https://images.pexels.com/photos/11369379/pexels-photo-11369379.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-vigie':             'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-aurore':             'https://images.pexels.com/photos/39572247/pexels-photo-39572247.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-galerie':             'https://images.pexels.com/photos/2962086/pexels-photo-2962086.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-rallye':             'https://images.pexels.com/photos/5383809/pexels-photo-5383809.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-paon':             'https://images.pexels.com/photos/4013073/pexels-photo-4013073.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-pop':             'https://images.pexels.com/photos/5382917/pexels-photo-5382917.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-nocturne':        '/apercus/boutique-nocturne.jpg',
  'boutique-orbite':          '/apercus/boutique-orbite.jpg',
  'agricole':                     'https://images.pexels.com/photos/2255801/pexels-photo-2255801.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-agricole':             'https://images.pexels.com/photos/2255801/pexels-photo-2255801.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Multi-vendeur
  'multi-vendeur-premium': 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=800',
  'multi-vendeur-local':   'https://images.pexels.com/photos/375880/pexels-photo-375880.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Vitrine
  'vitrine-portfolio':    'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-carte':        'https://images.pexels.com/photos/6347888/pexels-photo-6347888.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-cv':           'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-evenementiel': 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Réservation
  'reservation-restaurant':'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800',
  'reservation-location': 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=800',
  'reservation-service':  'https://images.pexels.com/photos/3993212/pexels-photo-3993212.jpeg?auto=compress&cs=tinysrgb&w=800',
  'reservation-spectacle':'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Cagnotte
  'cagnotte-classique':   '/apercus/cagnotte-classique.jpg',
  'cagnotte-cause':       '/apercus/cagnotte-cause.jpg',
  'cagnotte-horizon':     '/apercus/cagnotte-horizon.jpg',
  // Profession
  'vitrine-avocat':           'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800',
  'salon-coiffure':           'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Vitrine avec formulaire
  'vitrine-pro-entrepreneur': 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-tech':         'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-beaute':       'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-mariage':      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-sante':        'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-paysager':         'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Restaurant & Fast Food
  'vitrine-resto':            'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-bistro':           'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-foodtruck':        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-boulangerie':      'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Cours & Formation
  'cours-piano':              'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-langues':            'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-web':                'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-cuisine':            'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-yoga':               'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-equitation':         'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-peinture':           'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-danse':              'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-coach':              'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Enchères
  'enchere-galerie':      'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=800',
  'enchere-live':         'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Petites annonces
  'annonces-classique':   'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-auto-classique': 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-immo-classique': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-auto-showroom': 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-auto-lease': 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-volt': 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-neon': 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-allegro': 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-services-neo': 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'annonces-chalet': '/apercus/annonces-chalet.jpg',
  'annonces-immeuble': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
};

// ─── DONNÉES VRAIS TEMPLATES ──────────────────────────────────────────────────
// Synchronisé avec les groupes de PageChoisirTemplate.tsx

export type Groupe =
  | 'boutique-generique'
  | 'boutique-industrie'
  | 'multi-vendeur'
  | 'vitrine'
  | 'vitrine-contact'
  | 'cours'
  | 'resto'
  | 'profession'
  | 'reservation'
  | 'cagnotte'
  | 'enchere'
  | 'annonces';

export interface Template {
  id: string;
  nom: string;
  groupe: Groupe;
  description: string;
  fonctionnalites: string[];
  disponible: boolean;
  nouveau: boolean;
  couleur: string;
  prix?: string;  // ex: '25$ / achat unique' — vide = gratuit
  icone?: string; // emoji optionnel, sinon 📄 par défaut (utilisé dans PageAdminTemplatesPrix)
}

export const TEMPLATES: Template[] = [
  // ── BOUTIQUE EN LIGNE — GÉNÉRIQUE ──
  {
    id: 'boutique-simplisse',
    nom: 'Simplisse',
    groupe: 'boutique-generique',
    description: "La boutique complète, propre et professionnelle. Page d'accueil, catalogue avec filtres, page produit, blog, FAQ, contact et footer configurable. L'équivalent d'un Shopify sans le code.",
    fonctionnalites: ['Catalogue avec filtres', 'Fiche produit détaillée', 'Blog & FAQ intégrés', 'Footer configurable'],
    disponible: true, nouveau: true, couleur: '#2563eb',
  },
  {
    id: 'boutique-premium',
    nom: 'Premium',
    groupe: 'boutique-generique',
    description: 'La boutique haut de gamme — style sombre luxueux avec accents dorés. Zoom sur les photos, ticker défilant, page À propos, blog, FAQ, compte acheteur et panier intégrés.',
    fonctionnalites: ['Zoom sur les photos produit', 'Ticker défilant & page À propos', 'Blog & FAQ intégrés', 'Compte acheteur et panier intégrés'],
    disponible: true, nouveau: true, couleur: '#c9a96e',
  },
  {
    id: 'boutique-simple',
    nom: 'Mono-produit',
    groupe: 'boutique-generique',
    description: 'Une seule page de vente pour un seul produit, avec ses variantes et options. Vous composez la page avec des blocs réordonnables : accroches, vidéo de présentation, phrase défilante, valeurs, chronologie, tableau comparatif, bénéfices, avis et FAQ.',
    fonctionnalites: ['Page de vente en blocs : vous choisissez l\'ordre et ce qui s\'affiche', 'Vidéo YouTube ou Vimeo, phrase défilante, chronologie, tableau comparatif', 'Variantes et options (couleur, taille…) avec photo', 'Paiement Stripe ou PayPal', 'Compte acheteur et panier intégrés', 'Blog, FAQ, À propos et contact'],
    disponible: true, nouveau: false, couleur: '#a855f7',
  },
  {
    id: 'boutique-complete',
    nom: 'Boutique Complète',
    groupe: 'boutique-generique',
    description: "Boutique multi-produits au look clair : catalogue de vos annonces (recherche, filtres, fiche produit), panier et paiement, compte acheteur avec historique des commandes, blog, FAQ, à propos et contact. Logo, couleurs et police réglables.",
    fonctionnalites: ['Catalogue de vos annonces avec recherche, filtres et fiche produit', 'Panier, paiement Stripe ou PayPal et compte acheteur avec historique', 'Blog, FAQ, À propos et Contact sécurisé', 'Logo, couleurs et police (Moderne, Classique, Manuscrite) réglables', 'Compatible avec les add-ons (avis, favoris, infolettre, chatbot…)'],
    disponible: true, nouveau: true, couleur: '#16a34a',
  },
  {
    id: 'boutique-catalogue',
    nom: 'Catalogue Avancé',
    groupe: 'boutique-generique',
    description: "Boutique au thème sombre par défaut (clair au choix) avec menu à sous-menus et méga-menu configurables : vos catégories s'ouvrent au survol. Filtres avancés (prix, promo, stock, tri), tuiles de catégories, bande d'annonce défilante, panier et paiement, compte acheteur, blog, FAQ, à propos et contact.",
    fonctionnalites: ['Thème sombre ou clair, bouton de bascule pour le visiteur', 'Menu configurable : liens, listes déroulantes et méga-menus avec carte promo', 'Filtres avancés : prix, promo, en stock, tri', 'Panier, paiement Stripe ou PayPal et compte acheteur', 'Logo, couleurs et police réglables', 'Compatible avec les add-ons (avis, favoris, infolettre, chatbot…)'],
    disponible: true, nouveau: true, couleur: '#3b82f6',
  },
  // ── BOUTIQUE EN LIGNE — PAR INDUSTRIE ──
  {
    id: 'boutique-simplisse-mode',
    nom: 'Simplisse Mode',
    groupe: 'boutique-industrie',
    description: 'Boutique mode & vêtements au style éditorial ivoire & bordeaux. Lookbook, section Instagram, filtres taille/couleur tirés de vos variantes, guide des tailles que vous saisissez, bandeau défilant et popup promo. Panier, paiement et compte acheteur intégrés.',
    fonctionnalites: ['Lookbook & section Instagram', 'Filtres taille/couleur (vos variantes)', 'Guide des tailles configurable', 'Panier, paiement et compte acheteur', 'Compatible avec les add-ons'],
    disponible: true, nouveau: true, couleur: '#722f37',
  },
  {
    id: 'boutique-artisan',
    nom: 'Simplisse Artisan',
    groupe: 'boutique-industrie',
    description: "Boutique d'artisans et de créateurs au style galerie d'art : thème clair, hero plein écran, collections en tuiles, galerie de photos, blocs de collection, panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Sections masquables et réordonnables.",
    fonctionnalites: ['Galerie de photos et blocs de collection', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur', 'Logo, couleurs et police réglables'],
    disponible: true, nouveau: true, couleur: '#111111',
  },
  {
    id: 'boutique-auto',
    nom: 'Simplisse Auto',
    groupe: 'boutique-industrie',
    description: "Boutique de pièces auto et mécaniques : en-tête foncé avec recherche et « Mon garage », bandeau défilant, recherche par marque / modèle / année, cartes de catégories, tuiles promo, compte à rebours, marques, tableau comparatif, chiffres clés et réservation de rendez-vous. Panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Sections masquables et réordonnables.",
    fonctionnalites: ['Recherche par véhicule et « Mon garage »', 'Bandeau défilant, tuiles promo, compte à rebours', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#d9670b',
  },
  {
    id: 'boutique-jouets',
    nom: 'Simplisse Jouets',
    groupe: 'boutique-industrie',
    description: "Boutique de jouets colorée : barre bleue et en-tête rouge avec recherche, diaporama, rangées de produits qui défilent, grandes bannières, tuiles, chercheur de cadeau (âge, type, budget), photos de la communauté, mosaïque, chiffres clés, magasiner par âge, aperçu du blogue et pied de page bleu. Panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Tout est réglable.",
    fonctionnalites: ['Diaporama, rangées de produits et bannières réglables', 'Chercheur de cadeau (âge, type, budget)', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#de1b2d',
  },
  {
    id: 'boutique-gothique',
    nom: 'Simplisse Gothique',
    groupe: 'boutique-industrie',
    description: "Boutique noire à l'allure gothique : nom de la boutique en police gothique au centre, image pleine largeur, bandeaux défilants, grilles de produits à fines lignes, collections, grande affiche, avantages, avis et grand nom en pied de page. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Image pleine largeur et bandeaux défilants réglables', 'Police gothique au choix pour le nom de la boutique', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#e8590c',
  },
  {
    id: 'boutique-bd',
    nom: 'Simplisse BD',
    groupe: 'boutique-industrie',
    description: "Boutique colorée au style bande dessinée : diaporama avec bulle de BD, bandeau défilant, cartes promo, rangées de produits qui défilent, compte à rebours, collections, avis et blogue. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Diaporama avec bulle de BD et bandeau défilant', 'Rangées de produits, cartes promo et compte à rebours réglables', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#1570e0',
  },
  {
    id: 'boutique-futuriste',
    nom: 'Simplisse Futuriste',
    groupe: 'boutique-industrie',
    description: "Boutique futuriste en blocs noirs arrondis : diaporama texte sur photo, bandeau défilant violet, engagements en cartes, points forts numérotés, grandes bannières, accordéons de questions, grille de garanties, avis violets et compte à rebours. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Fond noir, vert néon et cartes arrondies réglables', 'Questions / réponses en accordéon et grille de garanties', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#1de48a',
  },
  {
    id: 'boutique-tech',
    nom: 'Simplisse Tech',
    groupe: 'boutique-industrie',
    description: "Boutique techno et gaming : fond bleu nuit, violet néon, diaporama plein écran, mosaïque de catégories, détails d'un produit, rangées de produits avec mot géant, tableau comparatif, avis en mosaïque et compte à rebours. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Fond bleu nuit et violet néon réglables', 'Mosaïque de catégories, détails produit et tableau comparatif', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#8b2cf5',
  },
  {
    id: 'boutique-rose',
    nom: 'Simplisse Rosé',
    groupe: 'boutique-industrie',
    description: "Boutique rose et lilas : bordures épaisses, bords ondulés, diaporama photo + texte, texte ondulé qui défile, collections, vitrine à points cliquables, tableau comparatif, avis et galerie de photos. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Rose et lilas réglables, bordures épaisses et bords ondulés', 'Vitrine à points, collections et tableau comparatif', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#e0147a',
  },
  {
    id: 'boutique-bonbon',
    nom: 'Simplisse Bonbon',
    groupe: 'boutique-industrie',
    description: "Boutique pastel bleu ciel et rose : menu latéral (catégories, réseaux, produits populaires), diaporama à flèches avec légende rose, bandeau dégradé, vidéo YouTube ou Vimeo, collections, avis. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Bleu ciel et rose réglables, nuages et soleil', 'Menu latéral : catégories, réseaux et produits populaires', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#d81e7c',
  },
  {
    id: 'boutique-soleil',
    nom: 'Simplisse Soleil',
    groupe: 'boutique-industrie',
    description: "Boutique ensoleillée : ciel bleu et fond crème, orange, menu latéral (catégories, réseaux, produits populaires en liste), diaporama à légende orange, bandeau d'offre, vidéo YouTube ou Vimeo, collines et soleil au pied de page. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Ciel bleu, crème et orange réglables, collines et soleil', 'Menu latéral : catégories, réseaux et produits populaires', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#c95500',
  },
  {
    id: 'boutique-sentier',
    nom: 'Simplisse Sentier',
    groupe: 'boutique-industrie',
    description: "Boutique sportive et sobre : fond noir et vert sauge, grande photo pleine largeur au titre en majuscules, produits sans cadre, bandeau d'offre, compte à rebours, vidéo YouTube ou Vimeo, pied de page sauge. Mode clair possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Noir et vert sauge réglables, mode clair possible', 'Grande photo pleine largeur au titre en majuscules', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#5d7157',
  },
  {
    id: 'boutique-chantier',
    nom: 'Simplisse Chantier',
    groupe: 'boutique-industrie',
    description: "Quincaillerie et outils : grand bloc jaune arrondi avec photo et deux produits, cartes blanches arrondies, bandeau d'offre jaune, compte à rebours, tableau comparatif, avis et blogue. Mode sombre possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Jaune, brun foncé et blanc réglables, mode sombre possible', 'Grand bloc jaune avec photo et deux produits', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#1c1309',
  },
  {
    id: 'boutique-cafe',
    nom: 'Simplisse Café',
    groupe: 'boutique-industrie',
    description: "Café et torréfaction : photo pleine largeur avec titre en bas à gauche, cartes caramel arrondies, bandeau d'offre brun, compte à rebours, avis et blogue. Mode sombre brun possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Caramel et brun réglables, mode sombre possible', 'Photo pleine largeur, titre en bas à gauche', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#2a1608',
  },
  {
    id: 'boutique-sakura',
    nom: 'Simplisse Sakura',
    groupe: 'boutique-generique',
    description: "Papeterie et créativité : fond rose pâle, corail, titres manuscrits, photo centrée avec flèches, lignes ondulées, bande défilante à motif d’écailles, avis et blogue. Mode sombre possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Rose pâle et corail réglables, mode sombre possible', 'Photo centrée, titres manuscrits', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#e0525c',
  },
  {
    id: 'boutique-sport',
    nom: 'Simplisse Sport',
    groupe: 'boutique-industrie',
    description: "Sport et souliers : marine et vert menthe, titres très gras, photo pleine largeur avec encoche en V, bande géante qui défile, séparateurs en chevrons, avis et blogue. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Marine et menthe réglables, mode clair ou sombre', 'Photo pleine largeur, titres très gras', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#4de3c1',
  },
  {
    id: 'boutique-joyau',
    nom: 'Simplisse Joyau',
    groupe: 'boutique-generique',
    description: "Bijoux et luxe : fond crème et terre cuite, titres à empattements, collections en cercles, bande géante en lettres creuses, avis avec bandeau vertical et calendrier d’événements. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Crème et terre cuite réglables, mode clair ou sombre', 'Collections en cercles, calendrier d’événements', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#b4532a',
  },
  {
    id: 'boutique-ecume',
    nom: 'Simplisse Écume',
    groupe: 'boutique-generique',
    description: "Style simple et lumineux : bleu cobalt et rose, grande photo centrée, ruban ondulé qui défile, bandes rayées, avis sur fond rose et accordéon avec photo. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Bleu cobalt et rose réglables, mode clair ou sombre', 'Grande photo centrée, ruban ondulé, bandes rayées', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#2c4fe6',
  },
  {
    id: 'boutique-audace',
    nom: 'Simplisse Audace',
    groupe: 'boutique-generique',
    description: "Style affirmé : marine et vert lime, titres en majuscules, photos inclinées avec ombres dures, bandeau défilant avec étiquette, palmarès numéroté, onglets de catégories. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Marine et lime réglables, mode clair ou sombre', 'Photos inclinées, bandeau défilant, palmarès numéroté', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#c8ff2e',
  },
  {
    id: 'boutique-carnaval',
    nom: 'Simplisse Carnaval',
    groupe: 'boutique-generique',
    description: "Style joyeux : bandes de couleurs franches, cadres noirs épais avec ombres dures, cartes à bandeau vert, onglets de collections, avis sur fond jaune, bandeau défilant avec étiquette. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Couleurs franches réglables, mode clair ou sombre', 'Cadres noirs, bandeau défilant, onglets de collections', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#ffc933',
  },
  {
    id: 'boutique-patchwork',
    nom: 'Simplisse Patchwork',
    groupe: 'boutique-generique',
    description: "Style doux et cousu : fond crème, cadres en pointillés comme des coutures, photos en arche, pastilles rondes, cartes arrondies à ombre légère, bandeau défilant avec étiquette. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Couleurs douces réglables, mode clair ou sombre', 'Cadres en pointillés, photos en arche, bandeau défilant', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#f6d56a',
  },
  {
    id: 'boutique-vigie',
    nom: 'Simplisse Vigie',
    groupe: 'boutique-generique',
    description: "Style sobre et moderne : fond noir, bandes bleu électrique, cartes à fine bordure, titres centrés, boutons bleus ou blancs, bandeau défilant avec étiquette. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Noir et bleu électrique réglables, mode clair ou sombre', 'Cartes à fine bordure, bandeau défilant, titres centrés', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#7d8bff',
  },
  {
    id: 'boutique-aurore',
    nom: 'Simplisse Aurore',
    groupe: 'boutique-generique',
    description: "Style lumineux : fond noir, grande vague et halos vert néon, cartes à fine bordure qui s'éclairent au survol, titres centrés, boutons vert profond, bandeau défilant avec étiquette. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Noir et vert néon réglables, mode clair ou sombre', 'Vague lumineuse, cartes lumineuses, bandeau défilant', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#22e65c',
  },
  {
    id: 'boutique-galerie',
    nom: 'Simplisse Galerie',
    groupe: 'boutique-generique',
    description: "Style éditorial noir et blanc : grand diaporama plein cadre, titres serif en majuscules, collections en escalier, cartes produits épurées, bandeau défilant. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Noir et blanc éditorial réglable, mode clair ou sombre', 'Diaporama plein cadre, collections en escalier, bandeau défilant', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#0a0a0a',
  },
  {
    id: 'boutique-rallye',
    nom: 'Simplisse Rallye',
    groupe: 'boutique-generique',
    description: "Style atelier : fond noir charbon et orange vif, étiquettes et logo inclinés, barre de menu orange, offre du jour avec compte à rebours, comparateur avant/après, cartes blanches. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Noir charbon et orange réglables, mode clair ou sombre', 'Offre du jour avec compte à rebours, mosaïque, avant/après', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#ff6a10',
  },
  {
    id: 'boutique-paon',
    nom: 'Simplisse Paon',
    groupe: 'boutique-generique',
    description: "Style éditorial : bleu pétrole et rose poudré en bandes alternées, énormes titres serif, traits fins, boutons à contour arrondi, ruban de promotion en diagonale, ventes flash avec compte à rebours. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Pétrole et rose poudré réglables, mode clair ou sombre', 'Offre spéciale, ventes flash avec compte à rebours, collections', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#e3c9c4',
  },
  {
    id: 'boutique-pop',
    nom: 'Simplisse Pop',
    groupe: 'boutique-generique',
    description: "Style ludique : crème, rouge tomate et jaune, gros traits noirs et ombres décalées, boutons en pastille, bandes à vagues, grand bandeau défilant, compte à rebours en cases. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Crème, rouge tomate et jaune réglables, mode clair ou sombre', 'Bandes à vagues, compte à rebours, tuiles de couleur', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#d93d23',
  },
  {
    id: 'boutique-nocturne',
    nom: 'Simplisse Nocturne',
    groupe: 'boutique-generique',
    description: "Style féerique : violet nuit et menthe, titres serif, fond étoilé qui scintille, photo en bulle, bandes à vagues, ornements étoilés. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Violet nuit et menthe réglables, mode clair ou sombre', 'Fond étoilé, bandes à vagues, titres serif', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#6d4fd8',
  },
  {
    id: 'boutique-orbite',
    nom: 'Simplisse Orbite',
    groupe: 'boutique-generique',
    description: "Style cosmique : marine profond et crème, grand titre sur photo, sphères colorées qui flottent, cartes en verre, fonds photo en bandes, titres à chasse fixe. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
    fonctionnalites: ['Marine, crème et sphères colorées réglables, mode clair ou sombre', 'Grand titre sur photo, fonds photo en bandes, cartes en verre', 'Sections masquables et réordonnables', 'Panier, paiement Stripe ou PayPal et compte acheteur'],
    disponible: true, nouveau: true, couleur: '#d81b60',
  },
  {
    id: 'boutique-agricole',
    nom: 'Boutique Agricole',
    groupe: 'boutique-industrie',
    description: "Boutique de ferme au look terroir sombre et doré : produits de la ferme, page Notre ferme, philosophie, visites, panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Textes, couleurs et police réglables.",
    fonctionnalites: ['Notre ferme, philosophie et visites réglables', 'Panier, paiement Stripe ou PayPal et compte acheteur', 'Catalogue avec filtres, variantes et promos', 'Blog, FAQ et Contact sécurisé'],
    disponible: true, nouveau: true, couleur: '#c9854a',
  },
  // ── TRANSACTIONNEL MULTI-VENDEUR ──
  {
    id: 'multi-vendeur-premium',
    nom: 'Multi-Vendeur Premium',
    groupe: 'multi-vendeur',
    description: 'Marketplace multi-vendeur complète. Accueil avec catégories, catalogue avec filtres avancés, boutiques vendeurs, fiche produit, enchères, documents et politiques. Style sombre & doré.',
    fonctionnalites: ['Boutiques vendeurs indépendantes', 'Catalogue unifié + filtres avancés', "Système d'enchères intégré", 'Documents & politiques'],
    disponible: true, nouveau: true, couleur: '#fbbf24',
  },
  {
    id: 'multi-vendeur-local',
    nom: 'Marché Local',
    groupe: 'multi-vendeur',
    description: 'Marketplace axée produits locaux et artisans régionaux. Bientôt.',
    fonctionnalites: ['Produits locaux & artisans', 'Marketplace régionale', 'Catalogue unifié', 'Bientôt disponible'],
    disponible: false, nouveau: false, couleur: '#78350f',
  },
  // ── VITRINE SANS FORMULAIRE ──
  {
    id: 'vitrine-carte',
    nom: 'Carte & Présentation',
    groupe: 'vitrine',
    description: 'Restaurants, bars et commerces locaux. Horaires, adresse, maps. Simple et efficace.',
    fonctionnalites: ["Horaires d'ouverture", 'Adresse + carte', 'Menu / services', "Appel à l'action"],
    disponible: true, nouveau: false, couleur: '#f97316',
  },
  {
    id: 'vitrine-evenementiel',
    nom: 'Événementiel',
    groupe: 'vitrine',
    description: 'Mariages, conférences, festivals. Compte à rebours, programme et billetterie externe.',
    fonctionnalites: ['Compte à rebours', 'Programme détaillé', 'Galerie photos', 'Billetterie externe'],
    disponible: true, nouveau: false, couleur: '#ec4899',
  },
  // ── VITRINE AVEC FORMULAIRE ──
  {
    id: 'vitrine-portfolio',
    nom: 'Portfolio',
    groupe: 'vitrine-contact',
    description: 'Artistes, photographes, architectes. Galerie photo, bio et formulaire de contact.',
    fonctionnalites: ['Galerie photos', 'Section bio', 'Formulaire contact', 'Liens réseaux sociaux'],
    disponible: true, nouveau: false, couleur: '#c9a96e',
  },
  {
    id: 'vitrine-cv',
    nom: 'CV Professionnel',
    groupe: 'vitrine-contact',
    description: 'Coachs, consultants, avocats. Services, témoignages, prise de RDV et formulaire.',
    fonctionnalites: ['Services détaillés', 'Témoignages clients', 'Prise de RDV', 'Formulaire contact'],
    disponible: true, nouveau: false, couleur: '#0ea5e9',
  },
  {
    id: 'vitrine-pro-entrepreneur',
    nom: 'Pro Entrepreneur ⭐',
    groupe: 'vitrine-contact',
    description: 'Badge rotatif, stats animées, équipe, blog, témoignages, formulaire devis. Entrepreneurs & contractors.',
    fonctionnalites: ['Badge rotatif configurable', 'Stats animées (compteur)', 'Témoignages carrousel', 'Formulaire devis'],
    disponible: true, nouveau: true, couleur: '#f59e0b', prix: '25$ / achat unique',
  },
  {
    id: 'vitrine-pro-tech',
    nom: 'Pro Tech / SaaS ⭐',
    groupe: 'vitrine-contact',
    description: 'Ticker défilant, hero vidéo/photo, stats, solutions, tarifs, partenaires. Tech, SaaS et agences.',
    fonctionnalites: ['Ticker défilant (taille/vitesse)', 'Hero vidéo ou photo', 'Section tarifs', 'Témoignages plein écran'],
    disponible: true, nouveau: true, couleur: '#c026d3', prix: '25$ / achat unique',
  },
  {
    id: 'vitrine-pro-beaute',
    nom: 'Pro Beauté / Cosmétique ⭐',
    groupe: 'vitrine-contact',
    description: 'Pétales animés, papillons battant des ailes, fleur rotative configurable. Beauté, cosmétique, bien-être.',
    fonctionnalites: ['Pétales tombants animés', 'Papillons SVG animés', 'Fleur rotative (vitesse config.)', 'Carrousel témoignages'],
    disponible: true, nouveau: true, couleur: '#f4a5a0', prix: '25$ / achat unique',
  },
  {
    id: 'vitrine-pro-mariage',
    nom: 'Pro Mariage ⭐',
    groupe: 'vitrine-contact',
    description: 'Scroll reveal, parallax, galerie lightbox, modal RSVP avec confettis, compte à rebours, timeline. Pour mariages et grands événements.',
    fonctionnalites: ['Modal RSVP + confettis', 'Compte à rebours', 'Galerie lightbox', 'Scroll reveal + parallax'],
    disponible: true, nouveau: true, couleur: '#8b6914', prix: '25$ / achat unique',
  },
  {
    id: 'vitrine-pro-sante',
    nom: 'Pro Santé / Clinique ⭐',
    groupe: 'vitrine-contact',
    description: 'Clinique médicale, dentaire ou optométrie. Scroll reveal, carte Google Maps, formulaire contact, équipe, FAQ. Professionnel et sobre.',
    fonctionnalites: ['Carte Google Maps intégrée', 'Formulaire contact', 'Section équipe médicale', 'FAQ accordéon + scroll reveal'],
    disponible: true, nouveau: true, couleur: '#1e6fa8', prix: '25$ / achat unique',
  },
  {
    id: 'vitrine-paysager',
    nom: 'Entretien Paysager',
    groupe: 'vitrine-contact',
    description: "Entreprise d'entretien de pelouse et aménagement paysager. Style sombre bold, formulaire devis, galerie portfolio, avis défilement auto, processus 4 étapes.",
    fonctionnalites: ['Formulaire de soumission gratuite', 'Galerie portfolio masonry', 'Avis défilement automatique', 'Compteurs animés au scroll'],
    disponible: true, nouveau: true, couleur: '#b5e24a',
  },
  // ── COURS & FORMATION ──
  {
    id: 'cours-danse',
    nom: 'École de Danse',
    groupe: 'cours',
    description: 'Studio de danse sombre & glamour. Rideau théâtre, silhouettes SVG, spotlight, ondes sonores, paillettes au clic. Magenta & or.',
    fonctionnalites: ['Rideau théâtre animé', 'Silhouettes SVG & spotlight', 'Ondes sonores', 'Paillettes au clic'],
    disponible: true, nouveau: true, couleur: '#e91e8c',
  },
  {
    id: 'cours-peinture',
    nom: 'École de Peinture',
    groupe: 'cours',
    description: 'Atelier artistique vivant. Cube 3D CSS, éclaboussures SVG au clic, galerie 3D, pinceau animé, palette multicolore.',
    fonctionnalites: ['Cube 3D CSS', 'Éclaboussures SVG au clic', 'Galerie 3D', 'Palette multicolore'],
    disponible: true, nouveau: true, couleur: '#e63946',
  },
  {
    id: 'cours-equitation',
    nom: "Centre d'Équitation",
    groupe: 'cours',
    description: 'Centre équestre noble. Cheval SVG au galop, herbe animée, carrousel 3D chevaux, palmarès, cours, instructeurs, événements. Bordeaux & or.',
    fonctionnalites: ['Cheval SVG au galop', 'Herbe animée', 'Carrousel 3D chevaux', 'Palmarès & instructeurs'],
    disponible: true, nouveau: true, couleur: '#8b2635',
  },
  {
    id: 'cours-yoga',
    nom: 'Studio Yoga & Pilates',
    groupe: 'cours',
    description: 'Studio yoga fond ivoire & terracotta. Vague respirante, lotus animé, silhouettes poses, minuteur 4-7-8, horaires, abonnements.',
    fonctionnalites: ['Vague respirante animée', 'Lotus animé', 'Minuteur 4-7-8', 'Horaires & abonnements'],
    disponible: true, nouveau: true, couleur: '#c17f5a',
  },
  {
    id: 'cours-cuisine',
    nom: 'École de Cuisine',
    groupe: 'cours',
    description: 'École culinaire élégante. Vapeur animée, galerie plats plein écran, chefs, ateliers, thermomètre niveau. Ivoire & brique.',
    fonctionnalites: ['Vapeur animée', 'Galerie plats plein écran', 'Chefs & ateliers', 'Thermomètre niveau'],
    disponible: true, nouveau: true, couleur: '#c0392b',
  },
  {
    id: 'cours-web',
    nom: 'Formation Web & Dev',
    groupe: 'cours',
    description: 'École de dev fond sombre ultra-moderne. Engrenages 360° animés, modules, formateurs, tarifs, FAQ. Cyan & violet.',
    fonctionnalites: ['Engrenages 360° animés', 'Modules & formateurs', 'Tarifs & FAQ', 'Style sombre ultra-moderne'],
    disponible: true, nouveau: true, couleur: '#00d4ff',
  },
  {
    id: 'cours-langues',
    nom: 'École de Langues',
    groupe: 'cours',
    description: 'École de langues complète. 10 langues, formules, professeurs, FAQ, événements, blog, newsletter. Sections réordonnables.',
    fonctionnalites: ['10 langues, formules', 'Professeurs & FAQ', 'Événements & blog', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#4F46E5',
  },
  {
    id: 'cours-piano',
    nom: 'Cours de Piano',
    groupe: 'cours',
    description: 'Portfolio pianiste / musicien. Hero plein écran, grille diagonale, récompenses, tarifs cours & prestations, galerie. Menu hamburger fullscreen.',
    fonctionnalites: ['Hero plein écran', 'Grille diagonale', 'Récompenses & tarifs', 'Menu hamburger fullscreen'],
    disponible: true, nouveau: true, couleur: '#e8a87c',
  },
  {
    id: 'cours-coach',
    nom: 'Coach de Vie',
    groupe: 'cours',
    description: "Site de coaching premium. Roue 4 piliers animée, titre morphing, programmes flip 3D, spotlight souris, étoiles ascendantes, formulaire appel découverte. Sable & forêt.",
    fonctionnalites: ['Sections ON/OFF + réordonnables', 'Roue 4 piliers animée', 'Programmes flip 3D', 'Formulaire appel découverte gratuit'],
    disponible: true, nouveau: true, couleur: '#C9A96E',
  },
  // ── RESTAURANT & FAST FOOD ──
  {
    id: 'vitrine-boulangerie',
    nom: 'Boulangerie & Pâtisserie',
    groupe: 'resto',
    description: 'Site boulangerie artisanale. Croissant SVG 3D tournant, particules de farine, galerie produits flip 3D, badge sortie du four dynamique, formulaire commandes spéciales avec calendrier.',
    fonctionnalites: ['Croissant SVG 3D tournant', 'Particules de farine', 'Badge sortie du four live', 'Galerie flip 3D'],
    disponible: true, nouveau: true, couleur: '#8b4513',
  },
  {
    id: 'vitrine-foodtruck',
    nom: 'Food Truck',
    groupe: 'resto',
    description: 'Site food truck dynamique. Camion SVG animé avec flammes et fumée, map GPS du jour, badge Ouvert/Fermé automatique, menu flip 3D, horaires configurables.',
    fonctionnalites: ['Camion SVG animé + flammes', 'Emplacement GPS du jour', 'Badge Ouvert/Fermé auto', 'Menu flip 3D'],
    disponible: true, nouveau: true, couleur: '#ff6b00',
  },
  {
    id: 'vitrine-resto',
    nom: 'Restaurant & Fast Food',
    groupe: 'resto',
    description: 'Site restaurant fond noir & orange. Menu burgers, accompagnements, réservation de table, avis carrousel, Google Maps. Sections réordonnables.',
    fonctionnalites: ['Menu burgers animé', 'Réservation de table', 'Avis carrousel', 'Ticker défilant'],
    disponible: true, nouveau: true, couleur: '#e8820a',
  },
  {
    id: 'vitrine-bistro',
    nom: 'Bistro & Café',
    groupe: 'resto',
    description: 'Fond noir & brun doré. Galerie plein format, menu filtrable par catégorie, réservation, carte Google Maps, sections réordonnables.',
    fonctionnalites: ['Galerie plein format', 'Menu filtrable par catégorie', 'Réservation intégrée', 'Carte Google Maps'],
    disponible: true, nouveau: true, couleur: '#8b6914',
  },
  {
    id: 'agricole',
    nom: 'Vitrine Agricole',
    groupe: 'vitrine-contact',
    description: "Site vitrine de ferme, sans paiement en ligne : produits, Notre ferme, philosophie et visites. Le visiteur envoie une demande de commande par courriel, vous le contactez ensuite.",
    fonctionnalites: ['Produits de la ferme', 'Notre ferme, philosophie et visites', 'Demande de commande par courriel', 'Textes, couleurs et sections réglables'],
    disponible: true, nouveau: false, couleur: '#c9854a',
  },
  // ── PROFESSION ──
  {
    id: 'vitrine-avocat',
    nom: "Bureau d'Avocat",
    groupe: 'profession',
    description: "Cabinet juridique élégant marine & or. Domaines expertise, équipe, FAQ accordéon, consultation, Google Maps. Sections réordonnables.",
    fonctionnalites: ['FAQ accordéon', 'Formulaire consultation', 'Carte Google Maps', 'Compteurs animés'],
    disponible: true, nouveau: true, couleur: '#c9a84c',
  },
  {
    id: 'salon-coiffure',
    nom: 'Salon de Coiffure ⭐',
    groupe: 'profession',
    description: 'Salon de coiffure & beauté avec réservation en ligne, galerie transformations, équipe, formulaire contact. Effet page de livre + photos twist 3D.',
    fonctionnalites: ['Réservation en ligne (créneaux)', 'Galerie transformations', 'Effet page de livre animé', 'Photos twist 3D + scroll reveal'],
    disponible: true, nouveau: true, couleur: '#7b7cb6', prix: '25$ / achat unique',
  },
  // ── RÉSERVATIONS ──
  {
    id: 'reservation-restaurant',
    nom: 'Restaurant & Café',
    groupe: 'reservation',
    description: 'Réservation de table par créneau horaire avec calendrier visuel.',
    fonctionnalites: ['Réservation par créneau', 'Gestion capacité', 'Confirmation email', 'Calendrier admin'],
    disponible: true, nouveau: false, couleur: '#f97316',
  },
  {
    id: 'reservation-location',
    nom: "Location d'objet",
    groupe: 'reservation',
    description: 'Location de matériel, jeux gonflables, véhicules. Catalogue + calendrier de disponibilité.',
    fonctionnalites: ["Catalogue d'objets", 'Calendrier dispo', 'Formulaire location', 'Gestion conflits'],
    disponible: true, nouveau: false, couleur: '#6366f1',
  },
  {
    id: 'reservation-service',
    nom: 'Service & RDV',
    groupe: 'reservation',
    description: 'Coiffeur, médecin, coach. Prise de rendez-vous en ligne par créneau.',
    fonctionnalites: ['Grille de services', 'Créneaux horaires', 'Confirmation email', 'Dashboard réservations'],
    disponible: true, nouveau: false, couleur: '#0ea5e9',
  },
  {
    id: 'reservation-spectacle',
    nom: 'Spectacle & Billets',
    groupe: 'reservation',
    description: 'Plan de salle interactif avec sièges numérotés. Réservation avec anti-conflit en temps réel.',
    fonctionnalites: ['Plan de salle visuel', 'Sièges numérotés', 'Anti-conflit SQL', 'Gestion zones/rangées'],
    disponible: true, nouveau: true, couleur: '#ec4899',
  },
  // ── CAGNOTTE ──
  {
    id: 'cagnotte-classique',
    nom: 'Cagnotte Classique',
    groupe: 'cagnotte',
    description: 'Page de collecte de fonds élégante : barre de progression, dons par carte et PayPal directement sur votre compte, aucune commission. Prix fixe par campagne.',
    fonctionnalites: ['Barre de progression', 'Stripe et PayPal à vous', 'Aucune commission', 'Messages et mises à jour'],
    disponible: true, nouveau: true, couleur: '#c9a96e',
  },
  {
    id: 'cagnotte-cause',
    nom: 'Cagnotte Cause',
    groupe: 'cagnotte',
    description: 'Page complète pour une grande cause : grand thermomètre animé, sections avec photos, chronologie, galerie, vidéo, témoignages, équipe et FAQ. Dons directement sur votre compte, aucune commission.',
    fonctionnalites: ['Thermomètre animé', 'Sections et galerie photos', 'Chronologie et impact des dons', 'Témoignages, équipe, FAQ'],
    disponible: true, nouveau: true, couleur: '#e2651a',
  },
  {
    id: 'cagnotte-horizon',
    nom: 'Cagnotte Horizon',
    groupe: 'cagnotte',
    description: 'Style lancement de projet, bleu nuit et jaune : thermomètre géant, vidéo YouTube, chronologie numérotée, utilisation des fonds en graphique, partenaires et compte à rebours. Dons sur votre propre compte, aucune commission.',
    fonctionnalites: ['Thermomètre géant', 'Vidéo YouTube', 'Chronologie et graphique des fonds', 'Partenaires et compte à rebours'],
    disponible: true, nouveau: true, couleur: '#fdb913',
  },

  // ── ENCHÈRES ──
  {
    id: 'enchere-galerie',
    nom: 'Enchère Galerie',
    groupe: 'enchere',
    description: "Plusieurs lots, style maison de ventes premium. Filtres par catégorie, modal par lot.",
    fonctionnalites: ['Multi-lots', 'Modal par lot', 'Filtres catégories', 'Tri fin / prix'],
    disponible: true, nouveau: true, couleur: '#c9a96e',
  },
  {
    id: 'enchere-live',
    nom: 'Enchère Live',
    groupe: 'enchere',
    description: "Méga site style bourse — ticker défilant, sidebar lots, proxy bid, layout 2 colonnes.",
    fonctionnalites: ['Ticker temps réel', 'Multi-lots sidebar', 'Proxy bidding', 'Layout bourse'],
    disponible: true, nouveau: true, couleur: '#6366f1',
  },

  // ── PETITES ANNONCES ──
  {
    id: 'annonces-classique',
    nom: 'Annonces Classique',
    groupe: 'annonces',
    description: "Petites annonces généralistes : recherche, catégories, filtre de prix, photos, fiche détaillée et contact par formulaire. Affichage seulement, aucun paiement.",
    fonctionnalites: ['Recherche + filtres', 'Catégories', 'Fiche détaillée', 'Formulaire de contact'],
    disponible: true, nouveau: true, couleur: '#0f766e',
  },
  {
    id: 'annonces-auto-classique',
    nom: 'Auto Classique',
    groupe: 'annonces',
    description: "Annonces de véhicules (voitures, VUS, motos, VR, bateaux) : filtres marque, année, kilométrage, carburant, transmission. Affichage seulement, aucun paiement.",
    fonctionnalites: ['Filtres marque / année / km', 'Carburant & transmission', 'Fiche détaillée', 'Formulaire de contact'],
    disponible: true, nouveau: true, couleur: '#1e40af',
  },
  {
    id: 'annonces-auto-showroom',
    nom: 'Auto Showroom',
    groupe: 'annonces',
    description: "Site vitrine complet pour concessionnaire ou revendeur : bannière, étapes, véhicules avec filtres, forfaits, témoignages, promo et FAQ. Couleurs, photos, textes et sections entièrement configurables. Affichage seulement.",
    fonctionnalites: ['Sections réordonnables', 'Couleurs & photos configurables', 'Véhicules + filtres', 'Compte à rebours promo'],
    disponible: true, nouveau: true, couleur: '#f15a22',
  },
  {
    id: 'annonces-auto-lease',
    nom: 'Auto Leasing',
    groupe: 'annonces',
    description: "Site sombre à accent rouge pour la location ou la vente de véhicules : bannière à 2 boutons, atouts, types de contrat, véhicules en carrousel avec prix mensuel, meilleures offres, à propos, avis clients, nouvelles et contact. Couleurs, polices, photos, textes et sections entièrement configurables. Affichage seulement.",
    fonctionnalites: ['Sections réordonnables', 'Prix mensuel / mois', 'Carrousels de véhicules et d\'avis', 'Couleurs & polices configurables'],
    disponible: true, nouveau: true, couleur: '#e8173c',
  },
  {
    id: 'annonces-volt',
    nom: 'Volt',
    groupe: 'annonces',
    description: "Petites annonces généralistes au look sombre à accent jaune : bandeau à compte à rebours, bannière arrondie, catégories, Top 10 numéroté, avant/après, annonces à la une, nouveautés par onglets, catalogue complet et grand nom défilant. Couleurs, polices, photos, textes et sections entièrement configurables. Affichage seulement.",
    fonctionnalites: ['Thème sombre & jaune', 'Top 10 et à la une', 'Curseur avant / après', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#ffd60a',
  },
  {
    id: 'annonces-neon',
    nom: 'Néon',
    groupe: 'annonces',
    description: "Petites annonces généralistes sur fond noir avec accent néon et halo dégradé : grande bannière centrée, étiquette inclinée, avantages, catégories en pastilles, annonces à la une, bandeau d'offre avec compte à rebours, catalogue complet, FAQ et contact. Couleurs, polices, photos, textes et sections entièrement configurables. Affichage seulement.",
    fonctionnalites: ['Noir & néon avec halo', 'Étiquette inclinée', 'Offre avec compte à rebours', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#00d84a',
  },
  {
    id: 'annonces-allegro',
    nom: 'Allegro',
    groupe: 'annonces',
    description: "Petites annonces généralistes au look vivant : en-tête rouge avec recherche, barre bleue, titres à dégradé, tuiles de catégories colorées, carrousel d'annonces, bannières en mosaïque, section sombre d'actualités. Couleurs, polices, photos, textes et sections entièrement configurables. Affichage seulement.",
    fonctionnalites: ['Recherche dans l\'en-tête', 'Titres à dégradé', 'Bannières en mosaïque', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#d90f2e',
  },
  {
    id: 'annonces-services-neo',
    nom: 'Néo Services',
    groupe: 'annonces',
    description: "Emplois et services pour une entreprise : vos services et vos offres d'emploi, sur fond noir avec bleu néon. Bannière avec formulaire de demande, bande bleue de 3 cartes, chiffres clés, catégories, filtres par nature, contrat et lieu, étapes, forfaits, témoignages, FAQ et contact. Tout est configurable. Affichage seulement.",
    fonctionnalites: ['Emplois et services', 'Formulaire dans la bannière', 'Filtres nature / contrat / lieu', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#2f3bff',
  },
  {
    id: 'annonces-chalet',
    nom: 'Chalet Boréal',
    groupe: 'annonces',
    description: "Location de vacances et chalets pour un propriétaire : bannière photo avec recherche de séjour (région, voyageurs), carrousel de chalets avec prix par nuit, régions, filtres (voyageurs, chambres, spa, animaux, prix), fiche détaillée avec équipements et carte du secteur, avis, activités, FAQ et demande de séjour. Tout est configurable. Aucune réservation ni paiement en ligne.",
    fonctionnalites: ['Recherche de séjour', 'Prix par nuit', 'Filtres spa / animaux / chambres', 'Sections réordonnables'],
    disponible: true, nouveau: true, couleur: '#7dffd5',
  },
  {
    id: 'annonces-immeuble',
    nom: 'Immeubles à revenus',
    groupe: 'annonces',
    description: "Annonces de duplex, triplex, multiplex et immeubles commerciaux : fiche détaillée avec tableaux (caractéristiques, évaluation municipale, taxes et revenus), rendement brut calculé automatiquement et carte Google selon l'adresse. Filtres par type, nombre de logements et revenus. Affichage seulement, aucun paiement.",
    fonctionnalites: ['Carte Google selon l\'adresse', 'Évaluation, taxes et revenus', 'Rendement brut calculé', 'Formulaire de contact'],
    disponible: true, nouveau: true, couleur: '#1e3a5f',
  },
  {
    id: 'annonces-immo-classique',
    nom: 'Immobilier Classique',
    groupe: 'annonces',
    description: "Annonces immobilières à vendre ou à louer : filtres chambres, salles de bain, superficie. Affichage seulement, aucun paiement.",
    fonctionnalites: ['À vendre / À louer', 'Chambres, sdb, superficie', 'Fiche détaillée', 'Formulaire de contact'],
    disponible: true, nouveau: true, couleur: '#92400e',
  },
];

export const GROUPES: { id: Groupe; label: string; icone: string; couleur: string; desc: string }[] = [
  { id: 'boutique-generique', label: 'Boutique en ligne — Générique',       icone: '🛍', couleur: '#2563eb', desc: 'Votre boutique complète, personnalisable, gérée depuis votre tableau de bord' },
  { id: 'boutique-industrie', label: 'Boutique en ligne — Par industrie',   icone: '🎨', couleur: '#d97706', desc: "Boutiques prêtes-à-l'emploi avec thème visuel dédié à votre secteur" },
  { id: 'multi-vendeur',      label: 'Transactionnel multi-produit — multi-vendeur', icone: '🏪', couleur: '#fbbf24', desc: 'Marketplace complète avec plusieurs vendeurs indépendants' },
  { id: 'vitrine',            label: 'Sites vitrine (sans formulaire)',     icone: '🖼', couleur: '#c9a96e', desc: 'Présence en ligne simple — carte de visite, événement, horaires' },
  { id: 'vitrine-contact',    label: 'Sites vitrine (avec formulaire)',     icone: '✉️', couleur: '#0ea5e9', desc: 'Portfolio, CV, pages pro avec formulaire de contact ou devis' },
  { id: 'cours',              label: 'Cours & Formation',                  icone: '🎹', couleur: '#e8a87c', desc: 'Portfolio artistique et page de cours pour musiciens, coachs et formateurs' },
  { id: 'resto',              label: 'Restaurant & Fast Food',             icone: '🍔', couleur: '#e8820a', desc: 'Menu, réservation de table, avis et carte Google Maps' },
  { id: 'profession',         label: 'Profession',                        icone: '💼', couleur: '#c9a84c', desc: "Sites professionnels dédiés aux services : avocat, coiffure et plus" },
  { id: 'reservation',        label: 'Formulaires & Réservations',         icone: '📅', couleur: '#6366f1', desc: 'Système de réservation intégré — sans paiement en ligne' },
  { id: 'cagnotte',           label: 'Cagnottes',                          icone: '💝', couleur: '#ec4899', desc: 'Collecte de fonds en ligne — dons sur votre propre Stripe / PayPal, prix fixe par campagne, aucune commission' },
  { id: 'enchere',            label: 'Enchères en ligne',                  icone: '🔨', couleur: '#dc2626', desc: "Sites d'enchères en temps réel — du mono-produit au méga site multi-lots" },
  { id: 'annonces',           label: 'Petites annonces',                   icone: '📋', couleur: '#14b8a6', desc: "Annonces affichées par vous, contact direct par formulaire — sans paiement" },
];

// ─── CATÉGORIES PUBLIQUES (SEO) ────────────────────────────────────────────────
// Regroupe les 11 "Groupe" internes en 6 grandes catégories, alignées avec
// les onglets de PageChoisirTemplate.tsx (dashboard gestionnaire). Les GROUPES
// et le champ Template.groupe ci-dessus restent INCHANGÉS — cette couche ne fait
// qu'organiser l'affichage public, sans toucher aux données existantes.
export interface Categorie {
  id: string;
  titre: string;
  icone: string;
  couleur: string;
  // Description longue, pensée pour le référencement (mots-clés, cas d'usage).
  seoDesc: string;
  groupes: Groupe[];        // sous-groupes classiques, basés sur Template.groupe
  templateIds?: string[];   // override : catégorie construite à partir d'ids précis (ex: Locations)
  excludeIds?: string[];    // ids à retirer des groupes ci-dessus (évite les doublons entre catégories)
}

export const CATEGORIES: Categorie[] = [
  {
    id: 'vitrines', titre: 'Sites Vitrine', icone: '🖼', couleur: '#c9a96e',
    seoDesc: "Créez un site vitrine professionnel pour présenter votre entreprise, vos services ou votre portfolio en ligne, sans vendre de produits. Idéal pour les restaurants, bureaux d'avocats, salons de coiffure, coachs, artistes, écoles de danse, de cuisine ou de musique, et tout professionnel indépendant qui veut une présence web soignée. Formulaire de contact, prise de rendez-vous, galerie photo, avis clients et référencement Google inclus dans chaque template.",
    groupes: ['vitrine', 'vitrine-contact', 'cours', 'resto', 'profession', 'reservation'],
    excludeIds: ['reservation-location'],
  },
  {
    id: 'boutiques', titre: 'Boutiques en ligne', icone: '🛍', couleur: '#2563eb',
    seoDesc: "Lancez votre boutique en ligne complète avec catalogue de produits, panier d'achat et paiement sécurisé par Stripe, gérée entièrement depuis votre tableau de bord — sans écrire une ligne de code. Que vous vendiez des vêtements, de l'artisanat, des produits fermiers ou des produits numériques, nos templates de commerce électronique s'adaptent à votre secteur d'activité au Québec et au Canada.",
    groupes: ['boutique-generique', 'boutique-industrie'],
  },
  {
    id: 'multivendeur', titre: 'Marketplace Multivendeur', icone: '🏪', couleur: '#fbbf24',
    seoDesc: "Bâtissez votre propre marketplace en ligne avec plusieurs vendeurs indépendants, chacun avec sa boutique, son catalogue et son système d'enchères. Une solution complète inspirée des grandes places de marché, idéale pour les regroupements de commerçants, marchés locaux et plateformes spécialisées par secteur.",
    groupes: ['multi-vendeur'],
  },
  {
    id: 'locations', titre: 'Location de biens', icone: '🏠', couleur: '#84cc16',
    seoDesc: "Offrez la location de matériel, d'équipement, de jeux gonflables ou de véhicules directement en ligne, avec un calendrier de disponibilité intégré et une prise de réservation simplifiée. Parfait pour les entreprises de location d'outils, d'équipements événementiels ou de véhicules récréatifs.",
    groupes: [],
    templateIds: ['reservation-location'],
  },
  {
    id: 'cagnottes', titre: 'Cagnottes & Collecte de fonds', icone: '💝', couleur: '#ec4899',
    seoDesc: "Collectez des dons en ligne pour une cause personnelle, un projet créatif, une communauté ou une urgence, avec paiement sécurisé Stripe versé directement dans votre compte. Une solution simple et transparente pour vos campagnes de financement participatif.",
    groupes: ['cagnotte'],
  },
  {
    id: 'encheres', titre: 'Enchères en ligne', icone: '🔨', couleur: '#dc2626',
    seoDesc: "Organisez des enchères en temps réel — d'un seul produit vedette jusqu'à un site complet multi-lots avec mises automatiques et suivi en direct. Idéal pour les encans, ventes de succession, levées de fonds par enchère ou maisons de ventes spécialisées.",
    groupes: ['enchere'],
  },
  {
    id: 'annonces', titre: 'Petites annonces', icone: '📋', couleur: '#14b8a6',
    seoDesc: "Créez un site de petites annonces : affichez vos articles, véhicules ou propriétés avec photos, recherche et filtres, et recevez les messages des visiteurs directement par courriel. Aucun paiement en ligne, aucune commission.",
    groupes: ['annonces'],
  },
];

// Retourne les templates qui appartiennent à une catégorie donnée, à partir
// d'une liste source (permet de composer avec templatesFiltres pour la recherche).
export function templatesDeCategorie(cat: Categorie, source: Template[]): Template[] {
  const base = cat.templateIds
    ? source.filter(t => cat.templateIds!.includes(t.id))
    : source.filter(t => cat.groupes.includes(t.groupe));
  return cat.excludeIds ? base.filter(t => !cat.excludeIds!.includes(t.id)) : base;
}


// Couleur d'un template rendue lisible sur fond sombre : si elle est trop foncée, on l'éclaircit.
// Texte du bandeau-titre d'une carte : foncé sur une couleur claire, blanc sinon.
function claire(hex: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62;
}

function lisible(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum >= 0.55) return hex;
  const k = Math.min(1, (0.62 - lum) / (1 - lum) + 0.1);
  const f = (v: number) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

// Couleur de texte lisible sur un fond de la couleur du template (noir si le fond est clair, blanc sinon).
function surCouleur(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.55 ? '#111111' : '#ffffff';
}

// ─── APERÇU (ouvre la démo dans un nouvel onglet) ─────────────────────────────
function ouvrirApercu(templateId: string) {
  const url = `/site-preview?forceTemplate=${templateId}&demo=true`;
  ouvrirApercuPwa(url);
}

// ─── COMPOSANT CARTE TEMPLATE ─────────────────────────────────────────────────

function CarteTemplate({ t, onCommencer, prixAffiche }: { t: Template; onCommencer: (id: string) => void; prixAffiche?: string }) {
  const [survol, setSurvol] = useState(false);
  const navigate = useNavigate();
  const prixFinal = prixAffiche || t.prix || 'Gratuit';
  const estGratuit = prixFinal === 'Gratuit';

  return (
    <div
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        background: '#111', borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${survol && t.disponible ? t.couleur + '60' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.3s ease',
        transform: survol && t.disponible ? 'translateY(-6px)' : 'none',
        boxShadow: survol && t.disponible ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${t.couleur}20` : 'none',
        opacity: t.disponible ? 1 : 0.55,
        display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
      {/* Bandeau-titre en couleur du modèle : nom + prix (même style que « Choisir un template ») */}
      <div className="template-card-band" style={{ padding: '13px 18px', background: `linear-gradient(100deg, ${t.couleur}, ${t.couleur}bb)`, display: 'flex', alignItems: 'center', gap: 12, minHeight: 58 }}>
        <span className="template-card-icon" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{t.icone || '📄'}</span>
        <h3 className="template-card-title" style={{ flex: 1, minWidth: 0, fontSize: 19, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1.15, margin: 0, color: claire(t.couleur) ? '#14141c' : '#fff', textShadow: claire(t.couleur) ? 'none' : '0 1px 6px rgba(0,0,0,0.45)', overflowWrap: 'break-word', wordBreak: 'normal' }}>{t.nom}</h3>
        <span className="template-card-price" style={{ flexShrink: 0, background: 'rgba(0,0,0,0.38)', color: !t.disponible ? '#fff' : estGratuit ? '#fff' : '#fbbf24', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {!t.disponible ? 'Bientôt' : prixFinal}
        </span>
      </div>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: '#1a1a2e' }}>
        <img
          src={`/apercus/${t.id}.jpg`}
          alt={`Aperçu de ${t.nom}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.4s ease', transform: survol ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => {
            // Pas de capture pour ce template : on retombe sur la photo générique, puis on masque.
            const im = e.target as HTMLImageElement;
            const secours = PHOTOS[t.id] || PHOTOS.hero;
            if (im.dataset.secours !== '1' && secours) { im.dataset.secours = '1'; im.src = secours; }
            else im.style.display = 'none';
          }}
        />
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          {t.nouveau && (
            <span style={{ background: '#f5a623', color: '#000', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
              NOUVEAU
            </span>
          )}
          {!t.disponible && (
            <span style={{ background: 'rgba(0,0,0,0.7)', color: '#aaa', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)' }}>
              BIENTÔT
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="template-card-content" style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <p className="template-card-desc" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
          {t.description}
        </p>

        {/* Fonctionnalités */}
        <div className="template-card-features" style={{ marginBottom: 16 }}>
          {t.fonctionnalites.slice(0, 3).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.couleur, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{f}</span>
            </div>
          ))}
          {t.fonctionnalites.length > 3 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 11 }}>
              +{t.fonctionnalites.length - 3} autres
            </span>
          )}
        </div>

        {/* Boutons */}
        {t.disponible ? (
          <>
            <div className="template-card-buttons" style={{ display: 'flex', gap: 8 }}>
              <button
                className="template-card-btn-apercu"
                onClick={e => { e.stopPropagation(); ouvrirApercu(t.id); }}
                style={{ padding: '11px 14px', background: '#fff', border: `2px solid ${t.couleur}`, borderRadius: 10, color: '#111111', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                👁 Aperçu
              </button>
              <button
                className="template-card-btn-main"
                onClick={() => onCommencer(t.id)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: survol ? t.couleur : `${t.couleur}25`,
                  color: survol ? surCouleur(t.couleur) : lisible(t.couleur),
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.25s',
                }}>
                Commencer →
              </button>
            </div>
            <button
              onClick={() => navigate(`/templates/${t.id}`)}
              style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', textAlign: 'center', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.couleur; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}>
              📖 Voir tous les détails →
            </button>
          </>
        ) : (
          <button
            className="template-card-btn-main"
            disabled
            style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)',
              fontSize: 13, fontWeight: 700, cursor: 'not-allowed',
            }}>
            Bientôt disponible
          </button>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

// ─── Prix d'une cagnotte : lus en direct dans les réglages de l'admin (route publique, aucun prix codé ici) ───
interface PrixCagnotte {
  paliers: { id: string; nom: string; objectif_max: number | null; prix: number }[];
  duree_max_jours: number; devise: string; remboursement: { actif: boolean; pct: number };
}
function formaterArgent(n: number, devise: string): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}
function EncadrePrixCagnotte({ prix }: { prix: PrixCagnotte }) {
  const tries = [...prix.paliers].sort((a, b) => (a.objectif_max === null ? Infinity : a.objectif_max) - (b.objectif_max === null ? Infinity : b.objectif_max));
  const argent = (n: number) => formaterArgent(n, prix.devise);
  const libelle = (p: { objectif_max: number | null }, i: number) => {
    if (p.objectif_max === null) return i > 0 && tries[i - 1].objectif_max !== null ? `Plus de ${argent(tries[i - 1].objectif_max as number)}` : 'Objectif illimité';
    return `Objectif jusqu'à ${argent(p.objectif_max)}`;
  };
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(236,72,153,0.45)', background: 'linear-gradient(135deg, rgba(236,72,153,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>💝 Combien coûte une cagnotte ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        Un <b style={{ color: '#fff' }}>prix fixe, payé une seule fois par campagne</b>, selon votre objectif. <b style={{ color: '#fff' }}>Aucune commission</b> sur les dons : l'argent va directement dans votre compte Stripe ou PayPal. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {tries.map((p, i) => (
          <div key={p.id} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f9a8d4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.nom}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{argent(p.prix)}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>{libelle(p, i)}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Durée maximale : {prix.duree_max_jours} jours.{prix.remboursement && prix.remboursement.actif ? ` Sans aucun don, ${prix.remboursement.pct} % du prix payé est remboursé.` : ''}
      </p>
    </div>
  );
}

// ─── Encadré « Combien coûtent les petites annonces ? » : même présentation que celui des cagnottes, lu dans la grille de l'admin ───
function EncadrePrixAnnonces({ paliers }: { paliers: { limite: number; prix: string; label: string }[] }) {
  const tries = [...paliers].sort((a, b) => a.limite - b.limite);
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(20,184,166,0.45)', background: 'linear-gradient(135deg, rgba(20,184,166,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>📋 Combien coûtent les petites annonces ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        Un <b style={{ color: '#fff' }}>prix fixe selon le nombre d'annonces actives</b> que vous publiez en même temps. <b style={{ color: '#fff' }}>Aucune commission</b> : vous affichez vos annonces, les acheteurs vous contactent directement. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {tries.map((p, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#5eead4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label || `${p.limite} annonces`}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{p.prix}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Jusqu'à {p.limite} annonce{p.limite > 1 ? 's' : ''} active{p.limite > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Les annonces expirées, vendues ou archivées ne comptent pas dans la limite.
      </p>
    </div>
  );
}

// ─── Encadré « Combien coûtent les boutiques ? » : même présentation que celui des cagnottes, lu dans la grille de l'admin ───
function EncadrePrixBoutiques({ paliers }: { paliers: { limite: number; prix: string; label: string }[] }) {
  const tries = [...paliers].sort((a, b) => a.limite - b.limite);
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(37,99,235,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>🛍 Combien coûtent les boutiques ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        Un <b style={{ color: '#fff' }}>prix fixe selon le nombre de produits actifs</b> que vous vendez en même temps. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {tries.map((p, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label || `${p.limite} produits`}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{p.prix}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Jusqu'à {p.limite} produit{p.limite > 1 ? 's' : ''} actif{p.limite > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Les produits en brouillon ou désactivés ne comptent pas dans la limite.
      </p>
    </div>
  );
}

// ─── Encadré « Combien coûtent les enchères ? » : même présentation que celui des cagnottes, lu dans la grille de l'admin ───
function EncadrePrixEncheres({ paliers }: { paliers: { limite: number; prix: string; label: string }[] }) {
  const tries = [...paliers].sort((a, b) => a.limite - b.limite);
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(220,38,38,0.45)', background: 'linear-gradient(135deg, rgba(220,38,38,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>🔨 Combien coûtent les enchères ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        Un <b style={{ color: '#fff' }}>prix fixe selon le nombre de lots actifs</b> que vous mettez aux enchères en même temps. <b style={{ color: '#fff' }}>Aucune commission</b> sur les ventes : le paiement se règle directement entre vous et le gagnant. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {tries.map((p, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label || `${p.limite} lots`}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{p.prix}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Jusqu'à {p.limite} lot{p.limite > 1 ? 's' : ''} actif{p.limite > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Les lots terminés ou annulés ne comptent pas dans la limite.
      </p>
    </div>
  );
}

// ─── Encadré « Combien coûte une marketplace multivendeur ? » : lu dans les forfaits MV de l'admin (⭐ Forfaits & Plans MV) ───
interface ForfaitMVPublic { plan_id: string; nom: string; prix: number; vendeurs_max: number | null; stockage_go: number | null; }
function EncadrePrixMV({ plans }: { plans: ForfaitMVPublic[] }) {
  const argent = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(251,191,36,0.45)', background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>🏪 Combien coûte une marketplace multivendeur ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
        Un <b style={{ color: '#fff' }}>forfait mensuel</b> selon le nombre de vendeurs actifs sur votre marketplace. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {plans.map(p => (
          <div key={p.plan_id} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.22)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.nom}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{argent(p.prix)}<span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}> / mois</span></div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>{p.vendeurs_max == null ? 'Vendeurs illimités' : `Jusqu'à ${p.vendeurs_max} vendeur${p.vendeurs_max > 1 ? 's' : ''} actif${p.vendeurs_max > 1 ? 's' : ''}`}</div>
            {p.stockage_go != null && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{String(p.stockage_go).replace('.', ',')} Go de stockage</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Encadrés « Combien coûte … ? » des Vitrines (un prix par sous-catégorie) et des Locations : même présentation que celui des cagnottes ───
const SOUS_CATEGORIES_VITRINES: { id: string; icone: string; label: string }[] = [
  { id: 'vitrine', icone: '🖼', label: 'Sites vitrine (sans formulaire)' },
  { id: 'vitrine-contact', icone: '✉️', label: 'Sites vitrine (avec formulaire)' },
  { id: 'cours', icone: '🎹', label: 'Cours & Formation' },
  { id: 'resto', icone: '🍔', label: 'Restaurant & Fast Food' },
  { id: 'profession', icone: '💼', label: 'Profession' },
  { id: 'reservation', icone: '📅', label: 'Formulaires & Réservations' },
];
function EncadrePrixListe({ icone, titre, texte, lignes }: { icone: string; titre: string; texte: React.ReactNode; lignes: { icone?: string; label: string; prix: string }[] }) {
  if (!lignes.length) return null;
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(251,191,36,0.45)', background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>{icone} {titre}</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>{texte}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
        {lignes.map((l, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.22)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l.icone ? l.icone + ' ' : ''}{l.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '4px 0 0' }}>{l.prix}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Encadré « Combien coûte la location de biens ? » : même présentation que celui des cagnottes, lu dans la grille de l'admin ───
function EncadrePrixLocations({ paliers }: { paliers: { limite: number; prix: string; label: string }[] }) {
  const tries = [...paliers].sort((a, b) => a.limite - b.limite);
  return (
    <div style={{ margin: '0 0 28px', borderRadius: 16, border: '1px solid rgba(132,204,22,0.45)', background: 'linear-gradient(135deg, rgba(132,204,22,0.10), rgba(255,255,255,0.03))', padding: '18px 20px', maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>🏠 Combien coûte la location de biens ?</h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        Un <b style={{ color: '#fff' }}>prix fixe selon le nombre d'annonces de location</b> que vous publiez. Taxes en sus.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {tries.map((p, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#bef264', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label || `${p.limite} annonces`}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{p.prix}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Jusqu'à {p.limite} annonce{p.limite > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Un prix fixe par palier, selon le nombre d'annonces de location permises.
      </p>
    </div>
  );
}

export default function PageTemplates() {
  const navigate = useNavigate();
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [prixParTemplate, setPrixParTemplate] = useState<Record<string, string>>({});
  const [prixCagnotte, setPrixCagnotte] = useState<PrixCagnotte | null>(null);
  // Petites annonces : grille de prix UNIQUE réglée dans l'admin (Templates → Annonces (tarifs)) ; vide = chaque template garde son « Prix Template »
  const [prixAnnonces, setPrixAnnonces] = useState('');
  const [paliersAnnonces, setPaliersAnnonces] = useState<{ limite: number; prix: string; label: string }[]>([]);
  // Enchères : grille de prix UNIQUE réglée dans l'admin (Templates → Enchères (tarifs)) ; vide = chaque template garde son « Prix Template »
  const [prixEncheres, setPrixEncheres] = useState('');
  const [paliersEncheres, setPaliersEncheres] = useState<{ limite: number; prix: string; label: string }[]>([]);
  // Boutiques : grille de prix UNIQUE réglée dans l'admin (Templates → Boutiques (tarifs)) ; vide = chaque template garde son « Prix Template »
  const [prixBoutiques, setPrixBoutiques] = useState('');
  const [paliersBoutiques, setPaliersBoutiques] = useState<{ limite: number; prix: string; label: string }[]>([]);
  // Locations : grille de paliers (nombre d'annonces de location permises) réglée dans l'admin (Templates → Locations (tarifs))
  const [prixLocations, setPrixLocations] = useState('');
  const [paliersLocations, setPaliersLocations] = useState<{ limite: number; prix: string; label: string }[]>([]);
  useEffect(() => {
    fetch('/api/locations/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !d.a_partir_de) return;
        setPrixLocations(String(d.a_partir_de).slice(0, 60));
        const pal = (Array.isArray(d.paliers) ? d.paliers : []).map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix);
        setPaliersLocations(pal);
      })
      .catch(() => { /* silencieux */ });
  }, []);
  // Multivendeur : forfaits réglés dans l'admin (⭐ Forfaits & Plans MV) — aucune grille séparée
  const [forfaitsMV, setForfaitsMV] = useState<ForfaitMVPublic[]>([]);
  useEffect(() => {
    fetch('/api/mv/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !Array.isArray(d.plans)) return;
        setForfaitsMV(d.plans.map((x: any) => ({ plan_id: String(x?.plan_id || ''), nom: String(x?.nom || '').slice(0, 40), prix: Number(x?.prix), vendeurs_max: x?.vendeurs_max == null ? null : parseInt(x.vendeurs_max, 10), stockage_go: x?.stockage_go == null ? null : Number(x.stockage_go) })).filter((x: ForfaitMVPublic) => x.plan_id && Number.isFinite(x.prix)));
      })
      .catch(() => { /* silencieux */ });
  }, []);
  // Vitrines : un prix par sous-catégorie (groupe), réglé dans l'admin (Templates → Vitrines (tarifs)) ; groupe sans prix = prix d'avant
  const [prixVitrines, setPrixVitrines] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/api/vitrines/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !d.groupes) return;
        const m: Record<string, string> = {};
        for (const g of Object.keys(d.groupes)) { const t = d.groupes[g] && d.groupes[g].prix_texte; if (t) m[g] = String(t).slice(0, 60); }
        setPrixVitrines(m);
      })
      .catch(() => { /* silencieux */ });
  }, []);
  useEffect(() => {
    fetch('/api/boutiques/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !d.a_partir_de) return;
        setPrixBoutiques(String(d.a_partir_de).slice(0, 60));
        const pal = (Array.isArray(d.paliers) ? d.paliers : []).map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix);
        setPaliersBoutiques(pal);
      })
      .catch(() => { /* silencieux */ });
  }, []);
  useEffect(() => {
    fetch('/api/encheres/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !d.a_partir_de) return;
        setPrixEncheres(String(d.a_partir_de).slice(0, 60));
        const pal = (Array.isArray(d.paliers) ? d.paliers : []).map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix);
        setPaliersEncheres(pal);
      })
      .catch(() => { /* silencieux */ });
  }, []);
  useEffect(() => {
    fetch('/api/annonces/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.success || !d.actif || !d.a_partir_de) return;
        setPrixAnnonces(String(d.a_partir_de).slice(0, 60));
        const pal = (Array.isArray(d.paliers) ? d.paliers : []).map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix);
        setPaliersAnnonces(pal);
      })
      .catch(() => { /* silencieux */ });
  }, []);
  useEffect(() => {
    fetch('/api/cagnotte/prix')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && d.success && Array.isArray(d.paliers) && d.paliers.length) setPrixCagnotte(d); })
      .catch(() => { /* silencieux : les cartes gardent le prix du dashboard admin */ });
  }, []);
  // Une carte cagnotte affiche « À partir de X » (le plus bas palier), toujours à jour avec l'admin.
  const prixAfficheDe = (t: Template): string | undefined => {
    if (t.groupe === 'cagnotte' && prixCagnotte) {
      const min = Math.min(...prixCagnotte.paliers.map(p => p.prix));
      return `À partir de ${formaterArgent(min, prixCagnotte.devise)} / campagne`;
    }
    if (t.groupe === 'annonces' && prixAnnonces) return prixAnnonces;
    if (t.groupe === 'enchere' && prixEncheres) return prixEncheres;
    if (t.id === 'reservation-location' && prixLocations) return prixLocations;   // location de biens : grille de paliers
    if (prixVitrines[t.groupe]) return prixVitrines[t.groupe];   // vitrines : prix de la sous-catégorie
    if (t.groupe === 'multi-vendeur' && forfaitsMV.length) return `À partir de ${formaterArgent(Math.min(...forfaitsMV.map(p => p.prix)), 'CAD')} / mois`;
    // Boutiques solo : la grille unique remplace le prix par template (sauf Mono-produit)
    if ((t.groupe === 'boutique-generique' || t.groupe === 'boutique-industrie') && prixBoutiques && t.id !== 'boutique-simple') return prixBoutiques;
    return prixParTemplate[t.id];
  };

  // Prix réels configurés dans le dashboard admin — si l'appel échoue,
  // les cartes retombent simplement sur t.prix codé en dur (ou "Gratuit").
  // Résolution : surcharge du template > défaut de sa catégorie > "Gratuit".
  useEffect(() => {
    fetch('/api/templates/prix')
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        const map: Record<string, string> = {};
        for (const t of TEMPLATES) {
          const surcharge = data.templates[t.id]?.prix_texte;
          const defautCategorie = data.groupes[t.groupe]?.prix_texte;
          map[t.id] = surcharge || defautCategorie || 'Gratuit';
        }
        setPrixParTemplate(map);
      })
      .catch(() => { /* silencieux — fallback sur les prix codés en dur */ });
  }, []);

  const categorieActive = CATEGORIES.find(c => c.id === filtreCategorie);

  const templatesFiltres = TEMPLATES.filter(t => {
    if (categorieActive && !templatesDeCategorie(categorieActive, TEMPLATES).some(ct => ct.id === t.id)) return false;
    if (recherche) {
      const q = recherche.toLowerCase();
      return t.nom.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const categoriesAffichees = filtreCategorie === 'tous'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === filtreCategorie);

  const onCommencer = (templateId: string) => {
    // Redirige vers l'inscription avec le template présélectionné
    navigate(`/inscription?template=${templateId}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-with-sidebar { margin-left: 0 !important; }
          .nav-links-desktop { display: none !important; }
        }
        @media (max-width: 480px) {
          .nav-logo-text { display: none !important; }
          .nav-btn-login, .nav-btn-signup {
            padding: 7px 12px !important;
            font-size: 12px !important;
          }
        }
        @media (max-width: 640px) {
          .hero-chip {
            font-size: 12px !important;
            padding: 7px 14px !important;
            max-width: calc(100vw - 48px) !important;
            white-space: normal !important;
            text-align: center !important;
          }
          .templates-mobile-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .templates-mobile-grid > * { min-width: 0 !important; }
          .template-card-content { padding: 10px 10px 12px !important; }
          .template-card-band { flex-direction: column !important; align-items: flex-start !important; justify-content: center !important; padding: 9px 10px !important; min-height: 0 !important; gap: 5px !important; }
          .template-card-icon { display: none !important; }
          .template-card-title { font-size: 14px !important; width: 100% !important; flex: none !important; }
          .template-card-price { font-size: 10px !important; padding: 2px 8px !important; margin-left: 0 !important; max-width: 100% !important; white-space: normal !important; }
          .template-card-desc { display: none !important; }
          .template-card-features { display: none !important; }
          .template-card-buttons { flex-direction: column !important; gap: 6px !important; }
          .template-card-btn-apercu {
            width: 100% !important;
            padding: 7px !important;
            font-size: 11px !important;
          }
          .template-card-btn-main {
            padding: 8px !important;
            font-size: 11px !important;
          }
          .template-card-buttons button, .template-card-content button { max-width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>

      {/* ── MENU DU HAUT (géré dans Paramètres > Menu) ─────────────────────── */}
      <MenuPublic reserverEspace={false} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <header style={{ paddingTop: 68, position: 'relative', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${PHOTOS.hero})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #000 0%, transparent 30%, #000 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '64px 24px 56px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a96e', marginBottom: 14 }}>
            {TEMPLATES.filter(t => t.disponible).length} templates disponibles
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            Choisissez votre <span style={{ background: 'linear-gradient(135deg,#c9a96e,#e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>template</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto 32px' }}>
            Des designs professionnels prêts à l'emploi. Configurez votre site en quelques minutes, sans coder.
          </p>
          {/* Chips catégories */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="hero-chip" onClick={() => setFiltreCategorie('tous')}
              style={{ padding: '8px 20px', borderRadius: 30, border: `1.5px solid ${filtreCategorie === 'tous' ? '#c9a96e' : 'rgba(255,255,255,0.15)'}`, background: filtreCategorie === 'tous' ? '#c9a96e' : 'transparent', color: filtreCategorie === 'tous' ? '#000' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Tous ({TEMPLATES.filter(t => t.disponible).length})
            </button>
            {CATEGORIES.map(c => {
              const count = templatesDeCategorie(c, TEMPLATES).filter(t => t.disponible).length;
              return (
                <button key={c.id} className="hero-chip" onClick={() => setFiltreCategorie(c.id)}
                  style={{ padding: '8px 20px', borderRadius: 30, border: `1.5px solid ${filtreCategorie === c.id ? c.couleur : 'rgba(255,255,255,0.15)'}`, background: filtreCategorie === c.id ? c.couleur + '20' : 'transparent', color: filtreCategorie === c.id ? c.couleur : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {c.icone} {c.titre} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── CORPS ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px', display: 'flex', gap: 40, alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <aside className="sidebar-desktop" style={{ width: 240, flexShrink: 0, position: 'sticky', top: 88, paddingTop: 40 }}>
          {/* Recherche */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', marginBottom: 28 }}>
            <span style={{ marginRight: 8, opacity: 0.5 }}>🔍</span>
            <input
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
              placeholder="Rechercher..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />
          </div>

          {/* Filtres catégorie */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Type de site</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
            {[{ id: 'tous', label: 'Tous les templates', icone: '✦', couleur: '#c9a96e' }, ...CATEGORIES.map(c => ({ id: c.id, label: c.titre, icone: c.icone, couleur: c.couleur }))].map(item => (
              <button key={item.id} onClick={() => setFiltreCategorie(item.id)}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: `1px solid ${filtreCategorie === item.id ? item.couleur + '60' : 'rgba(255,255,255,0.07)'}`,
                  background: filtreCategorie === item.id ? item.couleur + '15' : 'transparent',
                  color: filtreCategorie === item.id ? item.couleur : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: filtreCategorie === item.id ? 700 : 400, cursor: 'pointer', textAlign: 'left',
                }}>
                {item.icone} {item.label}
              </button>
            ))}
          </div>

          {/* CTA inscription */}
          <div style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 14, padding: '18px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#c9a96e', marginBottom: 6 }}>🚀 Gratuit pour commencer</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>Tous les templates sont inclus. Aucune carte de crédit requise.</p>
            <button onClick={() => navigate('/inscription')}
              style={{ width: '100%', padding: '10px', background: '#c9a96e', border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Créer mon site →
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="main-with-sidebar" style={{ flex: 1, minWidth: 0, paddingTop: 40 }}>
          {templatesFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Aucun template trouvé pour "{recherche}"</p>
            </div>
          ) : (
            categoriesAffichees.map(categorie => {
              const tempsCategorie = templatesDeCategorie(categorie, templatesFiltres);
              if (tempsCategorie.length === 0) return null;
              // Sous-groupes internes (ex: Vitrines contient 6 sous-groupes ; Locations n'en a qu'un)
              const sousGroupeIds = categorie.groupes;
              return (
                <div key={categorie.id} style={{ marginBottom: 72 }} className="fade-up">
                  {/* En-tête de catégorie — description longue, importante pour le SEO */}
                  <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${categorie.couleur}25` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: categorie.couleur + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {categorie.icone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{categorie.titre}</h2>
                        <span style={{ fontSize: 11, background: categorie.couleur + '20', color: categorie.couleur, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                          {tempsCategorie.filter(t => t.disponible).length} disponibles
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 820 }}>{categorie.seoDesc}</p>
                  </div>

                  {categorie.id === 'cagnottes' && prixCagnotte && <EncadrePrixCagnotte prix={prixCagnotte} />}
                  {categorie.id === 'annonces' && paliersAnnonces.length > 0 && <EncadrePrixAnnonces paliers={paliersAnnonces} />}
                  {categorie.id === 'encheres' && paliersEncheres.length > 0 && <EncadrePrixEncheres paliers={paliersEncheres} />}
                  {categorie.id === 'boutiques' && paliersBoutiques.length > 0 && <EncadrePrixBoutiques paliers={paliersBoutiques} />}
                  {categorie.id === 'multivendeur' && forfaitsMV.length > 0 && <EncadrePrixMV plans={forfaitsMV} />}
                  {categorie.id === 'vitrines' && <EncadrePrixListe icone="🖼" titre="Combien coûte un site vitrine ?" texte={<>Un <b style={{ color: '#fff' }}>prix fixe par type de site</b> : tous les templates d'une même sous-catégorie ont le même prix. Les taxes s'ajoutent au prix.</>}
                    lignes={SOUS_CATEGORIES_VITRINES.map(g => { const t = TEMPLATES.find(x => x.groupe === g.id); const p = t ? prixAfficheDe(t) : undefined; return { icone: g.icone, label: g.label, prix: p || '' }; }).filter(l => l.prix)} />}
                  {categorie.id === 'locations' && paliersLocations.length > 0 && <EncadrePrixLocations paliers={paliersLocations} />}
                  {categorie.id === 'locations' && paliersLocations.length === 0 && <EncadrePrixListe icone="🏠" titre="Combien coûte la location de biens ?" texte={<>Le prix du template de location de biens (calendrier de disponibilité et dépôt inclus). Les taxes s'ajoutent au prix.</>}
                    lignes={tempsCategorie.map(t => ({ label: t.nom, prix: prixAfficheDe(t) || '' })).filter(l => l.prix)} />}

                  {/* Sous-groupes internes (si plusieurs) sinon grille directe */}
                  {sousGroupeIds.length > 1 ? (
                    sousGroupeIds.map(gId => {
                      const g = GROUPES.find(x => x.id === gId);
                      if (!g) return null;
                      const tempsSousGroupe = tempsCategorie.filter(t => t.groupe === gId);
                      if (tempsSousGroupe.length === 0) return null;
                      return (
                        <div key={gId} style={{ marginBottom: 40 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{g.icone} {g.label}</h3>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{g.desc}</p>
                          <div className="templates-mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                            {tempsSousGroupe.map((t, i) => (
                              <div key={t.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                                <CarteTemplate t={t} onCommencer={onCommencer} prixAffiche={prixAfficheDe(t)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="templates-mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                      {tempsCategorie.map((t, i) => (
                        <div key={t.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                          <CarteTemplate t={t} onCommencer={onCommencer} prixAffiche={prixAfficheDe(t)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* ── BAS DE PAGE (géré dans Paramètres > Menu) ──────────────────────── */}
      <BasDePage />
    </div>
  );
}