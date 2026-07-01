// src/pages/PageTemplates.tsx
// e-Vend Studio — Galerie publique des templates disponibles

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── PHOTOS par catégorie (Pexels libre de droits) ───────────────────────────
const PHOTOS: Record<string, string> = {
  hero:                   'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1600',
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
  'cagnotte-personnel':   'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cagnotte-projet':      'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cagnotte-communaute':  'https://images.pexels.com/photos/6646914/pexels-photo-6646914.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cagnotte-environnement':'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cagnotte-urgence':     'https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Boutique
  'boutique-simple':      'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-complete':    'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=800',
  'boutique-catalogue':   'https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Premium
  'vitrine-pro-entrepreneur': 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-tech':         'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-beaute':       'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-mariage':      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-pro-sante':        'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800',
  'salon-coiffure':           'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-paysager':         'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-avocat':           'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-resto':            'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-bistro':           'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-piano':              'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-langues':            'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-web':                'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-cuisine':            'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-yoga':               'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-equitation':         'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-peinture':           'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-danse':              'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cours-coach':              'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-foodtruck':        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vitrine-boulangerie':      'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Enchères
  'enchere-flash':        'https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=800',
  'enchere-galerie':      'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=800',
  'enchere-live':         'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=800',
};

// ─── DONNÉES VRAIS TEMPLATES ──────────────────────────────────────────────────

type Groupe = 'vitrine' | 'vitrine-contact' | 'reservation' | 'cagnotte' | 'boutique' | 'enchere' | 'salon' | 'avocat' | 'resto' | 'bistro' | 'cours';

interface Template {
  id: string;
  nom: string;
  groupe: Groupe;
  description: string;
  fonctionnalites: string[];
  disponible: boolean;
  nouveau: boolean;
  couleur: string;
  prix?: string;  // ex: '25$ / achat unique' — vide = gratuit
}

const TEMPLATES: Template[] = [
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
    fonctionnalites: ["Ticker défilant (taille/vitesse)", 'Hero vidéo ou photo', 'Section tarifs', 'Témoignages plein écran'],
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
    id: 'vitrine-boulangerie',
    nom: 'Boulangerie & Pâtisserie',
    groupe: 'resto' as Groupe,
    description: "Site boulangerie artisanale. Croissant SVG 3D tournant, particules de farine, galerie produits flip 3D, badge sortie du four dynamique, formulaire commandes spéciales avec calendrier.",
    fonctionnalites: ['Sections ON/OFF + réordonnables','Croissant SVG 3D','Particules farine','Badge sortie four dynamique','Galerie flip 3D','Formulaire commande spéciale'],
    disponible: true, nouveau: true, couleur: '#8b4513',
  },
  {
    id: 'vitrine-foodtruck',
    nom: 'Food Truck',
    groupe: 'resto' as Groupe,
    description: "Site food truck dynamique. Camion SVG animé avec flammes et fumée, map GPS du jour, badge Ouvert/Fermé automatique, menu flip 3D, horaires configurables.",
    fonctionnalites: ['Sections ON/OFF + réordonnables','Camion SVG animé','Emplacement du jour (map)','Badge Ouvert/Fermé auto','Menu flip 3D','Horaires configurables'],
    disponible: true, nouveau: true, couleur: '#ff6b00',
  },
  {
    id: 'vitrine-resto',
    nom: 'Restaurant & Fast Food',
    groupe: 'resto' as Groupe,
    description: "Site restaurant fond noir & orange. Menu burgers, accompagnements, réservation de table, avis carrousel, Google Maps. Sections réordonnables.",
    fonctionnalites: ['Sections ON/OFF + réordonnables', 'Menu burgers animé', 'Réservation de table', 'Avis carrousel', 'Ticker défilant', '6 palettes'],
    disponible: true, nouveau: true, couleur: '#e8820a',
  },
  {
    id: 'vitrine-avocat',
    nom: "Bureau d'Avocat",
    groupe: 'avocat' as Groupe,
    description: "Cabinet juridique élégant marine & or. Domaines expertise, équipe, FAQ accordéon, consultation, Google Maps. Sections réordonnables.",
    fonctionnalites: ['Sections ON/OFF + réordonnables', 'FAQ accordéon', 'Formulaire consultation', 'Carte Google Maps', 'Compteurs animés', '6 palettes'],
    disponible: true, nouveau: true, couleur: '#c9a84c',
  },
  {
    id: 'vitrine-paysager',
    nom: 'Entretien Paysager',
    groupe: 'vitrine-contact',
    description: 'Entreprise d\'entretien de pelouse et aménagement paysager. Style sombre bold, formulaire devis, galerie portfolio, avis défilement auto, processus 4 étapes.',
    fonctionnalites: ['Formulaire de soumission gratuite', 'Galerie portfolio masonry', 'Avis défilement automatique', 'Compteurs animés au scroll'],
    disponible: true, nouveau: true, couleur: '#b5e24a',
  },
  // ── SALON ──
  {
    id: 'salon-coiffure',
    nom: 'Salon de Coiffure ⭐',
    groupe: 'salon' as Groupe,
    description: 'Salon de coiffure & beauté avec réservation en ligne, galerie transformations, équipe, formulaire contact. Effet page de livre + photos twist 3D.',
    fonctionnalites: ['Réservation en ligne (créneaux)', 'Galerie transformations', 'Effet page de livre animé', 'Photos twist 3D + scroll reveal'],
    disponible: true, nouveau: true, couleur: '#7b7cb6', prix: '25$ / achat unique',
  },
  {
    id: 'agricole',
    nom: 'Boutique Agricole',
    groupe: 'boutique',
    description: 'Ferme maraîchère avec panier drawer intégré, 3 pages (Accueil / Produits / Notre Ferme), style sombre terroir doré. Idéal pour producteurs locaux.',
    fonctionnalites: ['Panier drawer latéral', 'Modal produit + quantité', 'Catalogue avec filtres', 'Page Notre Ferme'],
    disponible: true, nouveau: true, couleur: '#c9854a',
  },
  // ── COURS & FORMATION ──
  {
    id: 'cours-coach',
    nom: 'Coach de Vie',
    groupe: 'cours' as Groupe,
    description: "Site de coaching premium. Roue 4 piliers animée, titre morphing, programmes flip 3D, spotlight souris, étoiles ascendantes, formulaire appel découverte. Sable & forêt.",
    fonctionnalites: ['Sections ON/OFF + réordonnables', 'Roue 4 piliers animée', 'Programmes flip 3D', 'Formulaire appel découverte gratuit'],
    disponible: true, nouveau: true, couleur: '#C9A96E',
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
    id: 'cagnotte-personnel',
    nom: 'Personnel',
    groupe: 'cagnotte',
    description: 'Aide financière, frais médicaux, accident de vie. Collectez des dons via Stripe.',
    fonctionnalites: ['Barre de progression', 'Dons via Stripe', 'Messages donateurs', 'Anonymat optionnel'],
    disponible: true, nouveau: false, couleur: '#ec4899',
  },
  {
    id: 'cagnotte-projet',
    nom: 'Projet',
    groupe: 'cagnotte',
    description: 'Financer un projet créatif, artistique ou entrepreneurial. Montants suggérés.',
    fonctionnalites: ['Objectif de financement', 'Mises à jour', 'Montants suggérés', 'Partage réseaux sociaux'],
    disponible: true, nouveau: false, couleur: '#6366f1',
  },
  {
    id: 'cagnotte-communaute',
    nom: 'Communauté',
    groupe: 'cagnotte',
    description: 'Association, équipe sportive, école. Mobilisez votre communauté.',
    fonctionnalites: ['Page campagne', 'Compteur donateurs', 'Objectif affiché', 'Délai campagne'],
    disponible: true, nouveau: false, couleur: '#0ea5e9',
  },
  {
    id: 'cagnotte-environnement',
    nom: 'Environnement',
    groupe: 'cagnotte',
    description: 'Cause verte, protection des animaux, nature. Sensibilisez et collectez.',
    fonctionnalites: ['Design naturel', 'Barre de progression', 'Dons Stripe', 'Historique dons'],
    disponible: true, nouveau: false, couleur: '#16a34a',
  },
  {
    id: 'cagnotte-urgence',
    nom: 'Urgence',
    groupe: 'cagnotte',
    description: 'Catastrophe naturelle, sinistre, crise humanitaire. Récolte de fonds rapide.',
    fonctionnalites: ['Mise en ligne rapide', 'Dons instantanés', 'Compteur temps réel', 'Partage viral'],
    disponible: true, nouveau: false, couleur: '#dc2626',
  },
  // ── BOUTIQUE ──
  {
    id: 'boutique-simple',
    nom: 'Mono-produit',
    groupe: 'boutique',
    description: 'Une page complète pour un seul produit. Galerie, variantes, checkout Stripe intégré.',
    fonctionnalites: ['Galerie photos + vidéo', 'Variantes (couleur/taille)', 'Checkout Stripe', 'Taxes TPS+TVQ auto'],
    disponible: true, nouveau: false, couleur: '#a855f7',
  },
  {
    id: 'boutique-complete',
    nom: 'Boutique Complète',
    groupe: 'boutique',
    description: 'Navigation, catalogue multi-produits, panier et compte acheteur avec historique.',
    fonctionnalites: ['Catalogue multi-produits', 'Panier persistant', 'Compte acheteur', 'Historique commandes'],
    disponible: true, nouveau: true, couleur: '#16a34a',
  },
  {
    id: 'boutique-catalogue',
    nom: 'Catalogue avancé',
    groupe: 'boutique',
    description: 'Grille de produits avec filtres avancés, pages produit individuelles. Bientôt disponible.',
    fonctionnalites: ['Filtres avancés', 'Pages produit', 'Comparateur', 'Recherche'],
    disponible: false, nouveau: false, couleur: '#0ea5e9',
  },
  // ── ENCHÈRES ──
  {
    id: 'enchere-flash',
    nom: 'Enchère Flash',
    groupe: 'enchere',
    description: 'Un produit, une page, tension maximale. Compte à rebours géant, mises en temps réel, proxy bid.',
    fonctionnalites: ['Compte à rebours live', 'Mises temps réel', 'Proxy bidding', 'Historique des mises'],
    disponible: true, nouveau: true, couleur: '#dc2626',
  },
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
];


const GROUPES: { id: Groupe; label: string; icone: string; couleur: string; desc: string }[] = [
  { id: 'vitrine',        label: 'Sites vitrine (sans formulaire)',  icone: '🖼',  couleur: '#c9a96e', desc: 'Présence en ligne simple — carte de visite, événement, horaires' },
  { id: 'vitrine-contact',label: 'Sites vitrine (avec formulaire)',  icone: '✉️',  couleur: '#0ea5e9', desc: 'Portfolio, CV, Pro Entrepreneur, Pro Tech — avec formulaire contact' },
  { id: 'salon',          label: 'Salon & Beauté',                   icone: '✂️',  couleur: '#7b7cb6', desc: 'Salon de coiffure avec réservation en ligne, galerie et équipe' },
  { id: 'avocat',         label: 'Bureau d\'Avocat',                  icone: '⚖️',  couleur: '#c9a84c', desc: 'Cabinet juridique avec FAQ, consultation, équipe et Google Maps' },
  { id: 'reservation',    label: 'Réservations',                     icone: '📅',  couleur: '#6366f1', desc: 'Système de réservation intégré — restaurant, location, RDV, spectacle' },
  { id: 'cagnotte',       label: 'CagnottePro',                      icone: '💝',  couleur: '#ec4899', desc: 'Collecte de fonds en ligne — recevez des dons via Stripe' },
  { id: 'boutique',       label: 'Boutique en ligne',                icone: '🛒',  couleur: '#16a34a', desc: 'Ventes avec panier et paiement Stripe intégré' },
  { id: 'enchere',        label: 'Enchères en ligne',                icone: '🔨',  couleur: '#dc2626', desc: "Sites d'enchères en temps réel — Flash, Galerie ou Live" },
  { id: 'cours',          label: 'Cours & Formation',                icone: '🎓',  couleur: '#C9A96E', desc: 'Écoles, studios et coachs — cours, programmes, horaires et réservations' },
];

// ─── COMPOSANT CARTE TEMPLATE ─────────────────────────────────────────────────

function CarteTemplate({ t, onCommencer }: { t: Template; onCommencer: (id: string) => void }) {
  const [survol, setSurvol] = useState(false);

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
        display: 'flex', flexDirection: 'column',
      }}>
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: '#1a1a2e' }}>
        <img
          src={PHOTOS[t.id] || PHOTOS.hero}
          alt={t.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: survol ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{t.nom}</h3>
          <span style={{ background: t.prix ? '#f59e0b22' : t.couleur + '20', color: t.prix ? '#b45309' : t.couleur, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>
            {t.prix || 'Gratuit'}
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
          {t.description}
        </p>

        {/* Fonctionnalités */}
        <div style={{ marginBottom: 16 }}>
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

        {/* Bouton */}
        <button
          onClick={() => t.disponible && onCommencer(t.id)}
          disabled={!t.disponible}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            background: t.disponible
              ? survol ? t.couleur : `${t.couleur}25`
              : 'rgba(255,255,255,0.05)',
            color: t.disponible
              ? survol ? '#fff' : t.couleur
              : 'rgba(255,255,255,0.25)',
            fontSize: 13, fontWeight: 700, cursor: t.disponible ? 'pointer' : 'not-allowed',
            transition: 'all 0.25s',
          }}>
          {!t.disponible ? 'Bientôt disponible' : 'Commencer avec ce template →'}
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function PageTemplates() {
  const navigate = useNavigate();
  const [filtreGroupe, setFiltreGroupe] = useState<Groupe | 'tous'>('tous');
  const [recherche, setRecherche] = useState('');
  const [menuMobile, setMenuMobile] = useState(false);

  const templatesFiltres = TEMPLATES.filter(t => {
    if (filtreGroupe !== 'tous' && t.groupe !== filtreGroupe) return false;
    if (recherche) {
      const q = recherche.toLowerCase();
      return t.nom.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const groupesAffiches = filtreGroupe === 'tous'
    ? GROUPES
    : GROUPES.filter(g => g.id === filtreGroupe);

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
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#c9a96e,#e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>e</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>VEND STUDIO</span>
          </div>

          <div className="nav-links-desktop" style={{ display: 'flex', gap: 32 }}>
            {[['/', 'Accueil'], ['/templates', 'Templates'], ['/blog', 'Blog']].map(([href, label]) => (
              <span key={href} onClick={() => navigate(href)} style={{ color: href === '/templates' ? '#c9a96e' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                {label}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/login')}
              style={{ padding: '8px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 30, color: '#fff', fontSize: 14, cursor: 'pointer' }}>
              Connexion
            </button>
            <button onClick={() => navigate('/inscription')}
              style={{ padding: '8px 20px', background: '#c9a96e', border: 'none', borderRadius: 30, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Démarrer →
            </button>
          </div>
        </div>
      </nav>

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
          {/* Chips groupes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setFiltreGroupe('tous')}
              style={{ padding: '8px 20px', borderRadius: 30, border: `1.5px solid ${filtreGroupe === 'tous' ? '#c9a96e' : 'rgba(255,255,255,0.15)'}`, background: filtreGroupe === 'tous' ? '#c9a96e' : 'transparent', color: filtreGroupe === 'tous' ? '#000' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Tous ({TEMPLATES.filter(t => t.disponible).length})
            </button>
            {GROUPES.map(g => {
              const count = TEMPLATES.filter(t => t.groupe === g.id && t.disponible).length;
              return (
                <button key={g.id} onClick={() => setFiltreGroupe(g.id)}
                  style={{ padding: '8px 20px', borderRadius: 30, border: `1.5px solid ${filtreGroupe === g.id ? g.couleur : 'rgba(255,255,255,0.15)'}`, background: filtreGroupe === g.id ? g.couleur + '20' : 'transparent', color: filtreGroupe === g.id ? g.couleur : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {g.icone} {g.label} ({count})
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

          {/* Filtres groupe */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Type de site</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
            {[{ id: 'tous' as Groupe | 'tous', label: 'Tous les templates', icone: '✦', couleur: '#c9a96e' }, ...GROUPES.map(g => ({ id: g.id as Groupe | 'tous', label: g.label, icone: g.icone, couleur: g.couleur }))].map(item => (
              <button key={item.id} onClick={() => setFiltreGroupe(item.id)}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: `1px solid ${filtreGroupe === item.id ? item.couleur + '60' : 'rgba(255,255,255,0.07)'}`,
                  background: filtreGroupe === item.id ? item.couleur + '15' : 'transparent',
                  color: filtreGroupe === item.id ? item.couleur : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: filtreGroupe === item.id ? 700 : 400, cursor: 'pointer', textAlign: 'left',
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
        <main className="main-with-sidebar" style={{ flex: 1, paddingTop: 40 }}>
          {templatesFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Aucun template trouvé pour "{recherche}"</p>
            </div>
          ) : (
            groupesAffiches.map(groupe => {
              const tempsGroupe = templatesFiltres.filter(t => t.groupe === groupe.id);
              if (tempsGroupe.length === 0) return null;
              return (
                <div key={groupe.id} style={{ marginBottom: 64 }} className="fade-up">
                  {/* En-tête section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, paddingBottom: 16, borderBottom: `1px solid ${groupe.couleur}20` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: groupe.couleur + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {groupe.icone}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{groupe.label}</h2>
                        <span style={{ fontSize: 11, background: groupe.couleur + '20', color: groupe.couleur, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                          {tempsGroupe.filter(t => t.disponible).length} disponibles
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{groupe.desc}</p>
                    </div>
                  </div>

                  {/* Grille templates */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                    {tempsGroupe.map((t, i) => (
                      <div key={t.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                        <CarteTemplate t={t} onCommencer={onCommencer} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#c9a96e' }}>e</span>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>VEND STUDIO</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['/', 'Accueil'], ['/templates', 'Templates'], ['/blog', 'Blog'], ['/login', 'Connexion'], ['/inscription', 'S\'inscrire']].map(([href, label]) => (
            <span key={href} onClick={() => navigate(href)} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>{label}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 e-Vend Studio — Créez votre site en ligne facilement</p>
      </footer>
    </div>
  );
}