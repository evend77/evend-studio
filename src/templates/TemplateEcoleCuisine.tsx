// src/templates/TemplateEcoleCuisine.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template École de Cuisine
// Style : fond ivoire #faf8f3 / accent brique #c0392b + or #d4a017
// Typo : Playfair Display (titres élégants) + Lato (corps)
// Effets : vapeur SVG, particules épices, assiette rotative, ticker ustensiles,
//          menu parchemin, plats plein écran au scroll, thermomètre niveau
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface PlatSignature {
  nom: string;
  description: string;
  photo: string;
  chef: string;
  difficulte: number; // 1-5
  temps: string;
  categorie: string;
}

export interface CoursAtelier {
  titre: string;
  description: string;
  photo: string;
  duree: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Expert';
  places: number;
  prix: string;
  inclus: string[];
  themes: string[];
}

export interface ChefFormateur {
  nom: string;
  titre: string;
  specialite: string;
  bio: string;
  photo: string;
  etoiles?: number;
  annees: number;
  signature: string; // plat signature
}

export interface AvisCuisine {
  texte: string;
  auteur: string;
  cours: string;
  photo: string;
  note: number;
}

export interface ConfigEcoleCuisine {
  // Identité
  nomEcole: string;
  tagline: string;
  sousTagline: string;
  descriptionHero: string;
  descriptionAPropos: string;
  philosophie: string;

  // Photos
  photoHero: string;
  photoAPropos1: string;
  photoAPropos2: string;
  photoAPropos3: string;

  // Couleurs
  couleurFond: string;       // #faf8f3 ivoire
  couleurBrique: string;     // #c0392b brique/rouge
  couleurOr: string;         // #d4a017 or
  couleurFondSombre: string; // #1a0f0a brun très sombre
  couleurTexte: string;      // #2c1810

  // Stats
  stats: { valeur: string; label: string; icone: string }[];

  // Plats signatures (galerie immersive)
  plats: PlatSignature[];

  // Cours & Ateliers
  cours: CoursAtelier[];

  // Chefs formateurs
  chefs: ChefFormateur[];

  // Avis
  avis: AvisCuisine[];

  // Formules
  formules: {
    nom: string;
    prix: string;
    periode: string;
    description: string;
    inclus: string[];
    populaire?: boolean;
    couleur?: string;
  }[];

  // FAQ
  faq: { question: string; reponse: string }[];

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  coordGoogleMaps: string;
  reseaux: { instagram?: string; facebook?: string; youtube?: string };

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_CUISINE_DEFAUT: ConfigEcoleCuisine = {
  nomEcole: 'L\'Atelier du Goût',
  tagline: 'L\'art culinaire,',
  sousTagline: 'maîtrisé.',
  descriptionHero: 'Apprenez les techniques des grands chefs dans une ambiance chaleureuse et professionnelle. Du couteau au dressage, transformez votre passion en expertise.',
  descriptionAPropos: 'Fondée par des chefs passionnés, L\'Atelier du Goût est bien plus qu\'une école de cuisine. C\'est un lieu où la tradition rencontre la créativité, où chaque cours est une aventure sensorielle unique.',
  philosophie: 'Cuisiner, c\'est créer de l\'amour.',

  photoHero: 'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoAPropos2: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoAPropos3: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',

  couleurFond: '#faf8f3',
  couleurBrique: '#c0392b',
  couleurOr: '#d4a017',
  couleurFondSombre: '#1a0f0a',
  couleurTexte: '#2c1810',

  stats: [
    { valeur: '3,200+', label: 'Élèves formés',    icone: '👨‍🍳' },
    { valeur: '48',     label: 'Ateliers / mois',  icone: '🍳' },
    { valeur: '12',     label: 'Chefs étoilés',    icone: '⭐' },
    { valeur: '98%',    label: 'Satisfaction',      icone: '❤️' },
  ],

  plats: [
    { nom: 'Risotto à la Truffe Noire',  description: 'Riz Arborio, bouillon de poulet maison, truffe noire du Périgord, parmesan 24 mois.',     photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600', chef: 'Chef Marc Bourdon', difficulte: 4, temps: '45 min', categorie: 'Risotto' },
    { nom: 'Saint-Jacques Poêlées',       description: 'Saint-Jacques de plongée, purée de topinambour, émulsion au beurre blanc, oseille.',       photo: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=1600', chef: 'Chef Isabelle Roy',  difficulte: 5, temps: '30 min', categorie: 'Fruits de mer' },
    { nom: 'Soufflé au Grand Marnier',    description: 'Appareil léger au Grand Marnier, crème anglaise à la vanille Bourbon, tuile caramélisée.',  photo: 'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=1600', chef: 'Chef Pierre Lévesque', difficulte: 5, temps: '35 min', categorie: 'Dessert'  },
    { nom: 'Bœuf Bourguignon Revisité',   description: 'Joue de bœuf confite 12h, légumes glacés, jus corsé au vin de Bourgogne.',                photo: 'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=1600', chef: 'Chef Marc Bourdon', difficulte: 3, temps: '12h',   categorie: 'Viande'   },
  ],

  cours: [
    {
      titre: 'Les Bases de la Cuisine Française',
      description: 'Maîtrisez les techniques fondamentales : fonds, sauces mères, tailles de légumes, et cuissons essentielles.',
      photo: 'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=800',
      duree: '4h / séance',
      niveau: 'Débutant',
      places: 8,
      prix: '120$',
      inclus: ['Tablier professionnel offert', 'Livret de recettes', 'Dégustation en fin de cours', 'Verre de vin inclus'],
      themes: ['Couteaux & tailles', 'Fonds & bouillons', 'Sauces classiques', 'Cuissons de base'],
    },
    {
      titre: 'Pâtisserie Fine & Dressage',
      description: 'Créez des desserts dignes des plus grandes tables : entremets, macarons, décors en sucre et chocolat.',
      photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      duree: '5h / séance',
      niveau: 'Intermédiaire',
      places: 6,
      prix: '165$',
      inclus: ['Matériel pâtisserie fourni', 'Recettes exclusives', 'Emporter vos créations', 'Café & macarons'],
      themes: ['Pâtes feuilletées', 'Entremets & mousses', 'Macarons & petits fours', 'Décors chocolat'],
    },
    {
      titre: 'Cuisine Gastronomique : Le Cours du Chef',
      description: 'Une expérience immersive avec un chef étoilé. Techniques avancées, produits d\'exception, dressage haute cuisine.',
      photo: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',
      duree: '6h / séance',
      niveau: 'Expert',
      places: 4,
      prix: '285$',
      inclus: ['Produits d\'exception fournis', 'Tablier & toque', 'Repas gastronomique 3 services', 'Accord mets & vins'],
      themes: ['Produits nobles (truffe, foie gras)', 'Cuissons basse température', 'Émulsions & espumas', 'Dressage étoilé'],
    },
  ],

  chefs: [
    {
      nom: 'Marc Bourdon',
      titre: 'Chef Exécutif & Directeur pédagogique',
      specialite: 'Cuisine française classique & bistro moderne',
      bio: 'Formé chez Bocuse et Troisgros, Marc a dirigé la cuisine de l\'Hôtel Ritz Paris pendant 8 ans avant de fonder L\'Atelier du Goût pour transmettre sa passion.',
      photo: 'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=400',
      etoiles: 2,
      annees: 22,
      signature: 'Bœuf Bourguignon revisité',
    },
    {
      nom: 'Isabelle Roy',
      titre: 'Chef Pâtissière',
      specialite: 'Pâtisserie fine & confiserie artisanale',
      bio: 'Championne de France de pâtisserie 2019, Isabelle a travaillé chez Pierre Hermé et Ladurée. Ses cours de macarons font l\'objet d\'une liste d\'attente de 3 mois.',
      photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
      etoiles: 1,
      annees: 15,
      signature: 'Soufflé au Grand Marnier',
    },
    {
      nom: 'Pierre Lévesque',
      titre: 'Chef Poissonnier & Fruits de Mer',
      specialite: 'Cuisines de la mer & produits de la pêche',
      bio: 'Originaire de Bretagne, Pierre a fait ses armes dans les meilleurs restaurants de poissons en Europe avant de s\'établir à Montréal où il célèbre les produits marins québécois.',
      photo: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400',
      annees: 18,
      signature: 'Saint-Jacques poêlées',
    },
  ],

  avis: [
    { texte: 'Une expérience absolument magique! J\'ai appris à faire des macarons parfaits en une seule séance. Chef Isabelle est extraordinaire, patiente et passionnée. Je recommande à 1000%!', auteur: 'Sophie Tremblay', cours: 'Pâtisserie Fine & Dressage', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Le cours gastronomique avec Chef Marc est une expérience de vie. Produits d\'exception, techniques que je n\'aurais jamais apprises ailleurs, et un repas final à couper le souffle.', auteur: 'Jean-Philippe Côté', cours: 'Cuisine Gastronomique', photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Idéal pour les débutants comme moi. L\'atmosphère est chaleureuse, sans jugement. En 4h, j\'ai appris plus que pendant 10 ans à regarder des émissions culinaires!', auteur: 'Marie-Claude Gagnon', cours: 'Les Bases de la Cuisine Française', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
  ],

  formules: [
    { nom: 'Découverte', prix: '120$', periode: '/ atelier', description: 'Parfait pour commencer ou offrir en cadeau.', inclus: ['1 atelier au choix', 'Tablier fourni', 'Livret de recettes', 'Dégustation'], populaire: false, couleur: '#d4a017' },
    { nom: 'Passionné', prix: '385$', periode: '/ mois', description: 'Le pass mensuel pour progresser rapidement.', inclus: ['4 ateliers / mois', 'Accès médiathèque vidéos', 'Carnet de recettes exclusif', 'Réduction boutique 15%', 'Priorité sur les cours chef'], populaire: true, couleur: '#c0392b' },
    { nom: 'Professionnel', prix: '890$', periode: '/ trimestre', description: 'Pour viser une reconversion ou ouvrir votre table.', inclus: ['Ateliers illimités', 'Mentorat 1-on-1 chef', 'Stage en cuisine partenaire', 'Certification reconnue', 'Portfolio culinaire', 'Mise en réseau chefs'], populaire: false, couleur: '#1a0f0a' },
  ],

  faq: [
    { question: 'Faut-il apporter son propre matériel?', reponse: 'Non, tout le matériel professionnel est fourni — couteaux japonais, batterie de cuisine, tablier et toque. Venez juste avec votre enthousiasme!' },
    { question: 'Les cours conviennent-ils aux débutants absolus?', reponse: 'Absolument! Nos cours "Bases de la cuisine française" sont conçus pour des personnes qui ne savent pas tenir un couteau. Nos chefs ont l\'habitude d\'adapter leur enseignement à tous les niveaux.' },
    { question: 'Peut-on offrir un cours en cadeau?', reponse: 'Oui! Nous proposons de magnifiques cartes-cadeaux sous forme de parchemin calligraphié. Disponibles en boutique ou par courriel. Un cadeau mémorable qui sort vraiment de l\'ordinaire.' },
    { question: 'Y a-t-il une dégustation à la fin?', reponse: 'Bien sûr! Tout ce que vous préparez pendant le cours, vous le dégustez en fin de séance. Et ce que vous ne mangez pas, vous l\'emportez dans de beaux contenants. Pas de gaspillage à l\'Atelier!' },
    { question: 'Les cours sont-ils disponibles en format privé (EVJF, team building)?', reponse: 'Oui! Nos ateliers privés sont très populaires pour les EVJFs, anniversaires, team buildings en entreprise et célébrations. Nous pouvons accueillir jusqu\'à 20 personnes en format privatif.' },
  ],

  adresse: '420 rue Saint-Paul Ouest',
  ville: 'Montréal, QC H2Y 1Y9',
  telephone: '(514) 555-0320',
  email: 'bonjour@atelierdugoût.ca',
  horaires: ['Mar – Ven : 10h – 21h', 'Samedi : 9h – 22h', 'Dimanche : 10h – 18h', 'Lundi : Fermé'],
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',
  reseaux: { instagram: '#', facebook: '#', youtube: '#' },

  sections: [
    { id: 'hero',       actif: true, ordre: 1, label: 'Hero + Vapeur'           },
    { id: 'ticker',     actif: true, ordre: 2, label: 'Ticker ustensiles'        },
    { id: 'stats',      actif: true, ordre: 3, label: 'Chiffres clés'           },
    { id: 'plats',      actif: true, ordre: 4, label: 'Plats signatures'         },
    { id: 'apropos',    actif: true, ordre: 5, label: 'À propos & philosophie'   },
    { id: 'cours',      actif: true, ordre: 6, label: 'Nos cours & ateliers'     },
    { id: 'chefs',      actif: true, ordre: 7, label: 'Nos chefs'               },
    { id: 'avis',       actif: true, ordre: 8, label: 'Avis des élèves'         },
    { id: 'formules',   actif: true, ordre: 9, label: 'Formules & Tarifs'        },
    { id: 'faq',        actif: true, ordre: 10, label: 'FAQ'                    },
    { id: 'contact',    actif: true, ordre: 11, label: 'Réservation & Contact'  },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useReveal(t = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: t });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [t]);
  return { ref, vis };
}

function ea<T>(val: any, def: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : def;
}

// ─── STYLES GLOBAUX ───────────────────────────────────────────────────────────

const getGlobalStyle = (config: ConfigEcoleCuisine) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Lato:wght@300;400;700&family=Dancing+Script:wght@600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* Animations */
@keyframes steamRise {
  0%   { transform: translateY(0) scaleX(1); opacity: 0; }
  20%  { opacity: 0.6; }
  80%  { opacity: 0.3; }
  100% { transform: translateY(-120px) scaleX(1.8); opacity: 0; }
}
@keyframes steamWiggle {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(6px) rotate(4deg); }
  75%     { transform: translateX(-6px) rotate(-4deg); }
}
@keyframes spicesFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes plateRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes tickerScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUpDelay { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
@keyframes shineSwipe {
  0%   { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(250%) skewX(-20deg); }
}
@keyframes thermometre {
  from { height: 0; }
  to   { height: var(--h); }
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-8px); }
}
@keyframes parchemin {
  from { transform: scaleY(0); opacity: 0; transform-origin: top; }
  to   { transform: scaleY(1); opacity: 1; transform-origin: top; }
}
@keyframes glowPulse {
  0%,100% { box-shadow: 0 0 20px ${config.couleurOr}40; }
  50%     { box-shadow: 0 0 40px ${config.couleurOr}80, 0 0 80px ${config.couleurOr}30; }
}

.rv { opacity:0; transform:translateY(36px); transition:opacity .8s ease,transform .8s ease; }
.rv.vis { opacity:1; transform:translateY(0); }
.rv-l { opacity:0; transform:translateX(-48px); transition:opacity .8s ease,transform .8s ease; }
.rv-l.vis { opacity:1; transform:translateX(0); }
.rv-r { opacity:0; transform:translateX(48px); transition:opacity .8s ease,transform .8s ease; }
.rv-r.vis { opacity:1; transform:translateX(0); }

.btn-brique {
  background: ${config.couleurBrique};
  color: #fff; border: none; padding: 15px 36px;
  font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
  position: relative; overflow: hidden; transition: filter .25s, transform .2s;
}
.btn-brique::after {
  content: ''; position: absolute; top: 0; left: 0; width: 60px; height: 100%;
  background: rgba(255,255,255,0.25); transform: translateX(-150%) skewX(-20deg);
}
.btn-brique:hover { filter: brightness(1.15); transform: translateY(-2px); }
.btn-brique:hover::after { animation: shineSwipe .6s ease forwards; }

.btn-or-outline {
  background: transparent; color: ${config.couleurOr};
  border: 1.5px solid ${config.couleurOr}; padding: 14px 34px;
  font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
  transition: all .25s;
}
.btn-or-outline:hover { background: ${config.couleurOr}15; transform: translateY(-2px); }

.nav-lien {
  font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,0.8); cursor: pointer; background: none; border: none;
  letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 0;
  transition: color .2s; position: relative;
}
.nav-lien::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 1.5px;
  background: ${config.couleurOr}; transform: scaleX(0); transition: transform .3s; transform-origin: left;
}
.nav-lien:hover, .nav-lien.active { color: ${config.couleurOr}; }
.nav-lien:hover::after, .nav-lien.active::after { transform: scaleX(1); }

.faq-btn {
  width:100%; background:none; border:none; cursor:pointer;
  padding:20px 0; display:flex; justify-content:space-between; align-items:center;
  font-family:'Playfair Display',serif; font-size:17px; font-weight:500;
  color:${config.couleurTexte}; text-align:left; border-bottom:1px solid rgba(0,0,0,0.08);
  transition:color .2s;
}
.faq-btn:hover { color:${config.couleurBrique}; }

.fw-input-cuisine {
  width:100%; padding:13px 16px;
  background:#fff; border:1.5px solid rgba(0,0,0,0.15);
  color:${config.couleurTexte}; font-family:'Lato',sans-serif; font-size:14px; outline:none;
  box-sizing:border-box; transition:border-color .2s; border-radius:0;
}
.fw-input-cuisine:focus { border-color:${config.couleurBrique}; }
.fw-input-cuisine::placeholder { color:rgba(0,0,0,0.3); }
`;

// ─── VAPEUR SVG ───────────────────────────────────────────────────────────────

function Vapeur({ x, delay, couleur }: { x: number; delay: number; couleur: string }) {
  const { isMobile } = useIsMobile();
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: `${x}%`,
      width: 24, height: 80, pointerEvents: 'none',
      animation: `steamRise 2.8s ${delay}s ease-in-out infinite`,
    }}>
      <svg viewBox="0 0 24 80" width="24" height="80" style={{ animation: `steamWiggle 2.8s ${delay}s ease-in-out infinite` }}>
        <path
          d="M12 80 Q6 65 12 50 Q18 35 12 20 Q6 5 12 0"
          fill="none" stroke={couleur} strokeWidth="3"
          strokeLinecap="round" opacity="0.6"
        />
      </svg>
    </div>
  );
}

// ─── PARTICULES ÉPICES ────────────────────────────────────────────────────────

function ParticulesEpices({ actif }: { actif: boolean }) {
  const { isMobile } = useIsMobile();
  const epices = ['🌶️', '🧄', '🌿', '⭐', '🫚', '✨', '🧅', '🌶️', '🫙'];
  if (!actif) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {epices.map((e, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${10 + i * 10}%`,
          top: `-5%`,
          fontSize: `${16 + (i % 3) * 8}px`,
          animation: `spicesFall ${3 + i * 0.4}s ${i * 0.3}s linear forwards`,
          opacity: 0.85,
        }}>
          {e}
        </span>
      ))}
    </div>
  );
}

// ─── ASSIETTE ROTATIVE ────────────────────────────────────────────────────────

function AssietteSVG({ taille = 200, couleurOr }: { taille?: number; couleurOr: string }) {
  const { isMobile } = useIsMobile();
  const R = taille / 2;
  return (
    <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}
      style={{ animation: 'plateRotate 20s linear infinite' }}>
      {/* Assiette principale */}
      <circle cx={R} cy={R} r={R - 4} fill="#fff" stroke={couleurOr} strokeWidth="3" />
      {/* Rebord décoratif */}
      <circle cx={R} cy={R} r={R - 16} fill="none" stroke={couleurOr} strokeWidth="1" strokeDasharray="4 6" />
      {/* Motif floral simplifié */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = R + (R - 26) * Math.cos(rad);
        const y = R + (R - 26) * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r={5} fill={couleurOr} opacity={0.6} />;
      })}
      {/* Centre */}
      <circle cx={R} cy={R} r={12} fill="none" stroke={couleurOr} strokeWidth="1.5" />
      <circle cx={R} cy={R} r={5} fill={couleurOr} opacity={0.5} />
    </svg>
  );
}

// ─── THERMOMÈTRE NIVEAU ───────────────────────────────────────────────────────

function Thermometre({ niveau, couleurBrique }: { niveau: 'Débutant' | 'Intermédiaire' | 'Expert'; couleurBrique: string }) {
  const { isMobile } = useIsMobile();
  const niveaux = { 'Débutant': 33, 'Intermédiaire': 66, 'Expert': 100 };
  const h = niveaux[niveau];
  const couleurs = { 'Débutant': '#10b981', 'Intermédiaire': '#f59e0b', 'Expert': couleurBrique };
  const col = couleurs[niveau];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 40, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: '100%', background: col, borderRadius: 4, height: `${h}%`, marginTop: 'auto', transition: 'height 1s ease', display: 'flex', alignItems: 'flex-end' }} />
      </div>
      <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: col, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{niveau}</span>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigEcoleCuisine; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const cb = config.couleurBrique;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [
    ['accueil', 'Accueil'],
    ['cours-page', 'Ateliers'],
    ['chefs-page', 'Nos Chefs'],
    ['plats-page', 'Menu'],
    ['reservation-page', 'Réserver'],
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? `rgba(26,15,10,0.97)` : 'rgba(26,15,10,.85)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${co}30` : 'none',
      transition: 'all .4s', padding: isMobile ? '0 20px' : '0 48px',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 400, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 2 }}>
            École de Cuisine
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
            {config.nomEcole}
          </p>
        </div>

        {/* Liens */}
        <div style={{ display: 'flex', gap: 32 }}>
          {liens.map(([id, label]) => (
            <button key={id} className={`nav-lien${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button className="btn-brique" onClick={() => setPage('reservation-page')} style={{ padding: '11px 24px', fontSize: 12 }}>
          Réserver un atelier
        </button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigEcoleCuisine; setPage: (p: string) => void }) {
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;
  const [showSpices, setShowSpices] = useState(false);

  return (
    <section style={{ background: cf, minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', paddingTop: 70 }}>
      {/* Photo hero en fond */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${config.photoHero})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.35)',
      }} />

      {/* Overlay gradient bas */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${cf} 0%, ${cf}aa 30%, transparent 60%)` }} />

      {/* Assiette flottante à gauche */}
      <div style={{
        position: 'absolute', left: '6%', top: '30%',
        animation: 'float 5s ease-in-out infinite',
        opacity: 0.25,
      }}>
        <AssietteSVG taille={220} couleurOr={co} />
      </div>
      {/* Petite assiette droite */}
      <div style={{
        position: 'absolute', right: '8%', top: '20%',
        animation: 'float 7s ease-in-out infinite 1s',
        opacity: 0.15,
      }}>
        <AssietteSVG taille={140} couleurOr={co} />
      </div>

      {/* Vapeur au-dessus de la photo */}
      <div style={{ position: 'absolute', bottom: '42%', left: '40%', width: '20%', height: 100 }}>
        <Vapeur x={10} delay={0}    couleur={co} />
        <Vapeur x={35} delay={0.8}  couleur={'#fff'} />
        <Vapeur x={60} delay={1.5}  couleur={co} />
        <Vapeur x={80} delay={0.4}  couleur={'#fff'} />
      </div>

      {/* Particules épices au survol */}
      <ParticulesEpices actif={showSpices} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: '0 48px 80px', width: '100%' }}>
        {/* Phrase script décorative */}
        <p style={{
          fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(18px, 2.5vw, 28px)',
          color: co, letterSpacing: '0.04em', marginBottom: 12,
          animation: 'fadeUp .8s ease both',
        }}>
          {config.philosophie}
        </p>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(52px, 9vw, 118px)',
          fontWeight: 800, color: '#fff', lineHeight: 0.92,
          letterSpacing: '-0.02em',
          animation: 'fadeUp .9s .1s ease both',
        }}>
          {config.tagline}<br />
          <em style={{ fontStyle: 'italic', color: co }}>{config.sousTagline}</em>
        </h1>

        <p style={{
          fontFamily: "'Lato', sans-serif", fontSize: 16,
          color: 'rgba(255,255,255,0.65)', lineHeight: 1.9,
          maxWidth: 540, marginTop: 24, marginBottom: 40,
          animation: 'fadeUp .9s .2s ease both',
        }}>
          {config.descriptionHero}
        </p>

        <div style={{ display: 'flex', gap: 14, animation: 'fadeUp .9s .3s ease both', flexWrap: 'wrap' }}>
          <button className="btn-brique" onClick={() => setPage('cours-page')}>
            Découvrir nos ateliers
          </button>
          <button className="btn-or-outline" onClick={() => { setShowSpices(true); setTimeout(() => setShowSpices(false), 3500); }}>
            ✨ Surprise chef!
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', right: 48, bottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>Défiler</p>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${co}, transparent)` }} />
        </div>
      </div>
    </section>
  );
}

// ─── TICKER USTENSILES ─────────────────────────────────────────────────────────

function SectionTicker({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const cb = config.couleurBrique;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;

  const items = [
    '🔪 Couteaux japonais', '🥄 Sauces mères', '🍳 Cuissons maîtrisées', '🫕 Mijotés d\'exception',
    '🎂 Pâtisserie fine', '🍷 Accords mets & vins', '🌿 Herbes fraîches', '🧈 Le beurre, toujours',
    '🫙 Conserves maison', '🔥 Feu & passion', '⭐ Techniques de chef', '🍽️ Dressage gastronomique',
  ];

  return (
    <section style={{ background: cf, padding: '0', overflow: 'hidden', borderTop: `1px solid ${co}20`, borderBottom: `1px solid ${co}20` }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 52, gap: 0, animation: 'tickerScroll 22s linear infinite', width: 'max-content' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{
            fontFamily: "'Playfair Display', serif", fontSize: 14, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap',
            padding: '0 28px', borderRight: `1px solid ${co}25`,
          }}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const stats = ea(config.stats, CONFIG_CUISINE_DEFAUT.stats);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '80px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(0,0,0,0.06)' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: config.couleurFond, padding: '40px 24px', textAlign: 'center', position: 'relative' }}>
              {/* Icône */}
              <div style={{ fontSize: 36, marginBottom: 12, animation: 'float 4s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}>{s.icone}</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4vw, 54px)', fontWeight: 800, color: cb, lineHeight: 1, marginBottom: 8 }}>
                {s.valeur}
              </p>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PLATS IMMERSIVE ──────────────────────────────────────────────────

function SectionPlats({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const [actif, setActif] = useState(0);
  const plats = ea(config.plats, CONFIG_CUISINE_DEFAUT.plats);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;

  // Auto-avance
  useEffect(() => {
    const id = setInterval(() => setActif(a => (a + 1) % plats.length), 5000);
    return () => clearInterval(id);
  }, [plats.length]);

  const p = plats[actif];

  return (
    <section style={{ background: cf, position: 'relative', overflow: 'hidden', minHeight: '90vh' }}>
      {/* Photo plein écran — transition douce */}
      {plats.map((plat, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${plat.photo})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === actif ? 1 : 0,
          transition: 'opacity 1.2s ease',
          filter: 'brightness(0.4)',
        }} />
      ))}

      {/* Overlay dégradé latéral */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${cf}f0 0%, ${cf}80 40%, transparent 70%)` }} />

      {/* Assiette rotative décorative */}
      <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}>
        <AssietteSVG taille={380} couleurOr={co} />
      </div>

      {/* Vapeur */}
      <div style={{ position: 'absolute', right: '25%', bottom: '30%', width: 120, height: 100 }}>
        <Vapeur x={10} delay={0}   couleur={co} />
        <Vapeur x={45} delay={1.2} couleur={'rgba(255,255,255,0.8)'} />
        <Vapeur x={80} delay={0.6} couleur={co} />
      </div>

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: isMobile ? '60px 20px' : '100px 48px', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>
          Nos plats signatures
        </p>
        <h2 key={actif} style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 5.5vw, 76px)', fontWeight: 800,
          color: '#fff', lineHeight: 1.05, marginBottom: 16,
          animation: 'fadeUp .6s ease both', maxWidth: 600,
        }}>
          {p.nom}
        </h2>
        <p key={`desc-${actif}`} style={{
          fontFamily: "'Lato', sans-serif", fontStyle: 'italic',
          fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8,
          maxWidth: 480, marginBottom: 28,
          animation: 'fadeUpDelay .7s .1s ease both',
        }}>
          {p.description}
        </p>

        {/* Méta */}
        <div key={`meta-${actif}`} style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 48, animation: 'fadeUpDelay .7s .2s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Chef</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontStyle: 'italic', color: co }}>{p.chef}</span>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Temps</span>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: '#fff', fontWeight: 700 }}>⏱ {p.temps}</span>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Niveau</span>
            <span style={{ display: 'flex', gap: 3 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize: 12, color: n <= p.difficulte ? co : 'rgba(255,255,255,0.2)' }}>★</span>
              ))}
            </span>
          </div>
        </div>

        {/* Sélecteur de plats */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {plats.map((pl, i) => (
            <button key={i} onClick={() => setActif(i)} style={{
              padding: '8px 18px', cursor: 'pointer', fontFamily: "'Lato', sans-serif", fontSize: 12,
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: i === actif ? co : 'transparent',
              color: i === actif ? config.couleurTexte : 'rgba(255,255,255,0.5)',
              border: `1px solid ${i === actif ? co : 'rgba(255,255,255,0.2)'}`,
              transition: 'all .3s',
            }}>
              {pl.categorie}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);
  const co = config.couleurOr;
  const cb = config.couleurBrique;

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Photos mosaïque gauche */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / 3', height: 300, overflow: 'hidden' }}>
              <img src={config.photoAPropos1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s', display: 'block' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden' }}>
              <img src={config.photoAPropos2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s', display: 'block' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
              <img src={config.photoAPropos3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s', display: 'block' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
              {/* Overlay dorée décorative */}
              <div style={{ position: 'absolute', inset: 0, border: `3px solid ${co}`, pointerEvents: 'none' }} />
            </div>
          </div>
          {/* Étiquette flottante */}
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 90, height: 90, borderRadius: '50%',
            background: cb, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            animation: 'glowPulse 3s ease-in-out infinite',
          }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>12</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chefs<br/>étoilés</p>
          </div>
        </div>

        {/* Texte droite */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 18 }}>Notre philosophie</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 50px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.15, marginBottom: 24, letterSpacing: '-0.01em' }}>
            Bien plus qu'une<br /><em style={{ fontStyle: 'italic', color: cb }}>école de cuisine</em>
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, color: 'rgba(0,0,0,0.6)', lineHeight: 1.9, marginBottom: 20 }}>
            {config.descriptionAPropos}
          </p>
          {/* Citation en script */}
          <blockquote style={{
            borderLeft: `3px solid ${co}`,
            paddingLeft: 20, margin: '24px 0 32px',
          }}>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: co, lineHeight: 1.4 }}>
              "{config.philosophie}"
            </p>
          </blockquote>
          <button className="btn-brique">En savoir plus</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION COURS ────────────────────────────────────────────────────────────

function SectionCours({ config, setPage }: { config: ConfigEcoleCuisine; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cours = ea(config.cours, CONFIG_CUISINE_DEFAUT.cours);

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nos Ateliers</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: config.couleurTexte, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Choisissez votre<br /><em style={{ fontStyle: 'italic', color: cb }}>aventure culinaire</em>
            </h2>
          </div>
          <button className="btn-or-outline" onClick={() => setPage('cours-page')}>Tous les ateliers →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cours.length, 3)}, 1fr)`, gap: 24 }}>
          {cours.map((c, i) => (
            <div key={i} style={{ background: '#fff', overflow: 'hidden', transition: 'transform .4s, box-shadow .4s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 24px 60px rgba(0,0,0,0.15)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              {/* Photo */}
              <div style={{ height: 240, overflow: 'hidden', position: 'relative' }}>
                <img src={c.photo} alt={c.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
                {/* Prix */}
                <div style={{ position: 'absolute', top: 16, right: 16, background: cb, color: '#fff', padding: '8px 14px', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>
                  {c.prix}
                </div>
                {/* Vapeur au bas de la photo */}
                <div style={{ position: 'absolute', bottom: 0, left: '30%', width: '40%', height: 60 }}>
                  <Vapeur x={15} delay={0}   couleur={co} />
                  <Vapeur x={50} delay={0.9} couleur={'rgba(255,255,255,0.8)'} />
                  <Vapeur x={80} delay={0.4} couleur={co} />
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding: '24px 24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Thermometre niveau={c.niveau} couleurBrique={cb} />
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    🕐 {c.duree} &nbsp;|&nbsp; 👥 {c.places} places
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: config.couleurTexte, marginBottom: 10, lineHeight: 1.25 }}>{c.titre}</h3>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,0.55)', lineHeight: 1.7, marginBottom: 18 }}>{c.description}</p>

                {/* Thèmes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {c.themes.map((t, j) => (
                    <span key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, padding: '3px 10px', background: `${co}15`, border: `1px solid ${co}40`, color: config.couleurTexte, fontWeight: 700, letterSpacing: '0.05em' }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Inclus */}
                <div style={{ borderTop: `1px solid rgba(0,0,0,0.06)`, paddingTop: 14 }}>
                  {c.inclus.map((item, j) => (
                    <p key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: cb, fontSize: 10 }}>✓</span>{item}
                    </p>
                  ))}
                </div>

                <button className="btn-brique" style={{ marginTop: 20, width: '100%', textAlign: 'center', padding: '12px' }}
                  onClick={() => setPage('reservation-page')}>
                  Réserver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CHEFS ────────────────────────────────────────────────────────────

function SectionChefs({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;
  const chefs = ea(config.chefs, CONFIG_CUISINE_DEFAUT.chefs);

  return (
    <section style={{ background: cf, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nos Maîtres</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Des chefs qui <em style={{ fontStyle: 'italic', color: co }}>transmettent</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(chefs.length, 3)}, 1fr)`, gap: 2 }}>
          {chefs.map((chef, i) => (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', cursor: 'default' }}
              onMouseEnter={e => { const img = (e.currentTarget as HTMLDivElement).querySelector('img') as HTMLImageElement; if (img) img.style.transform = 'scale(1.06)'; }}
              onMouseLeave={e => { const img = (e.currentTarget as HTMLDivElement).querySelector('img') as HTMLImageElement; if (img) img.style.transform = 'scale(1)'; }}>
              {/* Photo */}
              <div style={{ height: 480, overflow: 'hidden' }}>
                <img src={chef.photo} alt={chef.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)', transition: 'transform .7s' }} />
              </div>
              {/* Overlay bas */}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${cf} 0%, transparent 50%)` }} />

              {/* Infos */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 24px' }}>
                {/* Étoiles Michelin */}
                {chef.etoiles && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    {[...Array(chef.etoiles)].map((_, j) => (
                      <span key={j} style={{ fontSize: 16, color: co }}>⭐</span>
                    ))}
                  </div>
                )}
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Chef {chef.nom}
                </h3>
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 14, color: co, marginBottom: 8 }}>{chef.specialite}</p>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{chef.bio}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, padding: '4px 10px', background: `${co}20`, border: `1px solid ${co}40`, color: co }}>
                    {chef.annees} ans d'expérience
                  </span>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, padding: '4px 10px', background: `${cb}20`, border: `1px solid ${cb}40`, color: '#fff' }}>
                    🍽 {chef.signature}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const avis = ea(config.avis, CONFIG_CUISINE_DEFAUT.avis);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: config.couleurTexte, letterSpacing: '-0.01em' }}>
            Ce qu'ils <em style={{ fontStyle: 'italic', color: cb }}>ont vécu</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(avis.length, 3)}, 1fr)`, gap: 24 }}>
          {avis.map((a, i) => (
            <div key={i} style={{ background: '#fff', padding: '32px 28px', borderTop: `4px solid ${co}`, transition: 'transform .3s, box-shadow .3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              <div style={{ fontSize: 40, color: co, opacity: 0.2, lineHeight: 1, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>"</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,0.65)', lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>
                {a.texte}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${co}` }} />
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: config.couleurTexte }}>{a.auteur}</p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: cb, fontStyle: 'italic' }}>{a.cours}</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[...Array(a.note)].map((_, j) => <span key={j} style={{ color: co, fontSize: 12 }}>★</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FORMULES ─────────────────────────────────────────────────────────

function SectionFormules({ config, setPage }: { config: ConfigEcoleCuisine; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;
  const formules = ea(config.formules, CONFIG_CUISINE_DEFAUT.formules);

  return (
    <section style={{ background: cf, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      {/* Assiette décorative fond */}
      <div style={{ position: 'absolute', right: '-5%', bottom: '-10%', opacity: 0.06 }}>
        <AssietteSVG taille={500} couleurOr={co} />
      </div>

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Formules</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            Votre <em style={{ fontStyle: 'italic', color: co }}>passeport</em> culinaire
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(formules.length, 3)}, 1fr)`, gap: 20, alignItems: 'start' }}>
          {formules.map((f, i) => (
            <div key={i} style={{
              background: f.populaire ? '#fff' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${f.populaire ? co : 'rgba(255,255,255,0.1)'}`,
              padding: '36px 28px', position: 'relative',
              transform: f.populaire ? 'scale(1.04)' : 'none',
              transition: 'transform .3s',
            }}>
              {f.populaire && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: co, color: config.couleurTexte, fontSize: 11, fontWeight: 800, fontFamily: "'Lato', sans-serif", padding: '4px 18px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  RECOMMANDÉ
                </div>
              )}
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontStyle: 'italic', color: f.populaire ? co : 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                Formule
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: f.populaire ? config.couleurTexte : '#fff', marginBottom: 8 }}>
                {f.nom}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 800, color: f.populaire ? cb : co, lineHeight: 1 }}>{f.prix}</span>
                <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: f.populaire ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>{f.periode}</span>
              </div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: f.populaire ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>{f.description}</p>

              <div style={{ height: 1, background: f.populaire ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)', marginBottom: 20 }} />

              <ul style={{ listStyle: 'none', marginBottom: 28 }}>
                {f.inclus.map((item, j) => (
                  <li key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: f.populaire ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.6)', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: co, flexShrink: 0, marginTop: 2 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {f.populaire ? (
                <button className="btn-brique" onClick={() => setPage('reservation-page')} style={{ width: '100%', textAlign: 'center', padding: '14px' }}>
                  Commencer →
                </button>
              ) : (
                <button className="btn-or-outline" onClick={() => setPage('reservation-page')} style={{ width: '100%', textAlign: 'center', padding: '13px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Sélectionner →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const faq = ea(config.faq, CONFIG_CUISINE_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: config.couleurTexte, letterSpacing: '-0.01em' }}>
            Vos questions, nos <em style={{ fontStyle: 'italic', color: cb }}>réponses</em>
          </h2>
        </div>

        <div>
          {faq.map((f, i) => (
            <div key={i}>
              <button className="faq-btn" onClick={() => setOuvert(ouvert === i ? null : i)}>
                <span>{f.question}</span>
                <span style={{ color: co, fontSize: 22, flexShrink: 0, transition: 'transform .3s', transform: ouvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              <div style={{ overflow: 'hidden', maxHeight: ouvert === i ? '300px' : '0', transition: 'max-height .4s ease' }}>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.9, paddingBottom: 24, paddingTop: 8 }}>
                  {f.reponse}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT / RÉSERVATION ───────────────────────────────────────────

function SectionContact({ config }: { config: ConfigEcoleCuisine }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;
  const horaires = ea(config.horaires, CONFIG_CUISINE_DEFAUT.horaires);
  const cours = ea(config.cours, CONFIG_CUISINE_DEFAUT.cours);

  const [form, setForm] = useState({ nom: '', email: '', telephone: '', atelier: '', date: '', personnes: '1', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ecole: config.nomEcole, type: 'reservation-cuisine', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 32 : 80 }}>
          {/* Infos */}
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nous rejoindre</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 800, color: config.couleurTexte, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 32 }}>
              Réservez<br /><em style={{ fontStyle: 'italic', color: cb }}>votre place</em>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
              {[
                { icone: '📍', label: 'Adresse', val: `${config.adresse}, ${config.ville}` },
                { icone: '📞', label: 'Téléphone', val: config.telephone },
                { icone: '✉️', label: 'Courriel', val: config.email },
              ].map((info, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 20, width: 24, flexShrink: 0 }}>{info.icone}</span>
                  <div>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: co, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>{info.label}</p>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>{info.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f5f0e8', padding: '20px 22px', borderLeft: `4px solid ${co}` }}>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: co, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Heures d'ouverture</p>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 5 }}>{h}</p>
              ))}
            </div>

            {/* Carte Google Maps */}
            <div style={{ marginTop: 24, height: 220, overflow: 'hidden', border: `2px solid ${co}20` }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localisation" />
            </div>
          </div>

          {/* Formulaire réservation */}
          <div>
            <div style={{ background: '#fff', padding: '40px 36px', borderTop: `4px solid ${cb}` }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: config.couleurTexte, marginBottom: 28 }}>
                Formulaire de réservation
              </h3>

              {envoye ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: config.couleurTexte, marginBottom: 10 }}>
                    Réservation envoyée!
                  </h3>
                  <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 20, color: co }}>
                    À très bientôt en cuisine!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nom *</label>
                      <input className="fw-input-cuisine" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email *</label>
                      <input type="email" className="fw-input-cuisine" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.ca" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Atelier souhaité</label>
                    <select className="fw-input-cuisine" value={form.atelier} onChange={e => setForm({ ...form, atelier: e.target.value })} style={{ cursor: 'pointer' }}>
                      <option value="">Choisir un atelier...</option>
                      {cours.map((c, i) => <option key={i} value={c.titre}>{c.titre} — {c.prix}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Date souhaitée</label>
                      <input type="date" className="fw-input-cuisine" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre de personnes</label>
                      <select className="fw-input-cuisine" value={form.personnes} onChange={e => setForm({ ...form, personnes: e.target.value })} style={{ cursor: 'pointer' }}>
                        {[1,2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Message</label>
                    <textarea className="fw-input-cuisine" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Allergies, occasion spéciale, groupe d'entreprise..." style={{ resize: 'none' }} />
                  </div>
              <button disabled={loading || !form.nom || !form.email}
                    style={{ opacity: !form.nom || !form.email ? 0.5 : 1, textAlign: 'center', padding: '16px' }}>
                    {loading ? 'Envoi en cours...' : '🍳 Réserver ma place'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigEcoleCuisine; setPage: (p: string) => void }) {
  const co = config.couleurOr;
  const cb = config.couleurBrique;
  const cf = config.couleurFondSombre;

  return (
    <footer style={{ background: '#0f0704', borderTop: `1px solid ${co}20`, padding: '60px 48px 24px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, fontStyle: 'italic', color: co, letterSpacing: '0.2em', marginBottom: 4 }}>École de Cuisine</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{config.nomEcole}</p>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, color: co, marginBottom: 20 }}>"{config.philosophie}"</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['instagram', '📸'], ['facebook', '📘'], ['youtube', '📺']].map(([k, ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', border: `1px solid ${co}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', transition: 'all .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${co}20`}>{ico}</a>
              ) : null
            )}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
          {[['accueil','Accueil'],['cours-page','Ateliers'],['chefs-page','Nos Chefs'],['plats-page','Menu'],['reservation-page','Réserver']].map(([id,label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = co}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.45)'}>{label}</p>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Ateliers</p>
          {ea(config.cours, CONFIG_CUISINE_DEFAUT.cours).map((c, i) => (
            <p key={i} onClick={() => setPage('cours-page')} style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s', fontStyle: 'italic' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.4)'}>{c.titre}</p>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Contact</p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{config.adresse}</p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{config.ville}</p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: co }}>{config.email}</p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{config.telephone}</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Politique de confidentialité</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} {config.nomEcole} — Tous droits réservés</p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateEcoleCuisineProps {
  config?: Partial<ConfigEcoleCuisine>;
  isPreview?: boolean;
}

export default function TemplateEcoleCuisine({ config: partiel, isPreview }: TemplateEcoleCuisineProps) {
  // Valider couleurs — ce template est clair (fond ivoire)
  const estCouleurClaire = (hex?: string): boolean => {
    if (!hex || typeof hex !== 'string') return false;
    const h = hex.replace('#', '');
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return (r*299 + g*587 + b*114)/1000 > 150;
  };
  const fondValide = estCouleurClaire(partiel?.couleurFond);

  const config: ConfigEcoleCuisine = {
    ...CONFIG_CUISINE_DEFAUT,
    ...partiel,
    couleurFond:       fondValide ? (partiel?.couleurFond       || CONFIG_CUISINE_DEFAUT.couleurFond)       : CONFIG_CUISINE_DEFAUT.couleurFond,
    couleurBrique:     partiel?.couleurBrique     || CONFIG_CUISINE_DEFAUT.couleurBrique,
    couleurOr:         partiel?.couleurOr         || CONFIG_CUISINE_DEFAUT.couleurOr,
    couleurFondSombre: partiel?.couleurFondSombre || CONFIG_CUISINE_DEFAUT.couleurFondSombre,
    couleurTexte:      fondValide ? (partiel?.couleurTexte || CONFIG_CUISINE_DEFAUT.couleurTexte) : CONFIG_CUISINE_DEFAUT.couleurTexte,
  };

  // Validation IDs sections
  const VALID_IDS_CUISINE = ['hero','ticker','stats','plats','apropos','cours','chefs','avis','formules','faq','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_CUISINE_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS_CUISINE.includes(s.id)) ? rawSections : CONFIG_CUISINE_DEFAUT.sections;

  config.stats    = ea(partiel?.stats,    CONFIG_CUISINE_DEFAUT.stats);
  config.plats    = ea(partiel?.plats,    CONFIG_CUISINE_DEFAUT.plats);
  config.cours    = ea(partiel?.cours,    CONFIG_CUISINE_DEFAUT.cours);
  config.chefs    = ea(partiel?.chefs,    CONFIG_CUISINE_DEFAUT.chefs);
  config.avis     = ea(partiel?.avis,     CONFIG_CUISINE_DEFAUT.avis);
  config.formules = ea(partiel?.formules, CONFIG_CUISINE_DEFAUT.formules);
  config.faq      = ea(partiel?.faq,      CONFIG_CUISINE_DEFAUT.faq);
  config.horaires = ea(partiel?.horaires, CONFIG_CUISINE_DEFAUT.horaires);

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':     return <SectionHero     config={config} setPage={handlePage} />;
      case 'ticker':   return <SectionTicker   config={config} />;
      case 'stats':    return <SectionStats    config={config} />;
      case 'plats':    return <SectionPlats    config={config} />;
      case 'apropos':  return <SectionAPropos  config={config} />;
      case 'cours':    return <SectionCours    config={config} setPage={handlePage} />;
      case 'chefs':    return <SectionChefs    config={config} />;
      case 'avis':     return <SectionAvis     config={config} />;
      case 'formules': return <SectionFormules config={config} setPage={handlePage} />;
      case 'faq':      return <SectionFAQ      config={config} />;
      case 'contact':  return <SectionContact  config={config} />;
      default:         return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{getGlobalStyle(config)}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 70 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'cours-page'       && (<><SectionCours    config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'chefs-page'       && (<><SectionChefs    config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'plats-page'       && (<><SectionPlats    config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'reservation-page' && (<><SectionContact  config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}