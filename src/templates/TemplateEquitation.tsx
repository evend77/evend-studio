// src/templates/TemplateEquitation.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Centre d'Équitation
// Style : fond ivoire #faf8f3 / accent bordeaux #8b2635 + or #c9a84c + vert prairie #4a7c59
// Typo : Playfair Display (titres nobles) + Lato (corps)
// Effets WOW :
//   - Cheval SVG au galop qui traverse le hero avec sabots étincelants
//   - Herbe SVG animée qui se balance dans le vent
//   - Particules dorées (sabots)
//   - Carrousel photos chevaux avec perspective 3D
//   - Parallax coucher de soleil multicouche
//   - Texture cuir/bois sur les cartes
//   - Ruban palmarès animé
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface CoursEquitation {
  titre: string;
  description: string;
  photo: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Compétition';
  age: string;
  duree: string;
  prix: string;
  inclus: string[];
  disciplines: string[];
}

export interface Cheval {
  nom: string;
  race: string;
  age: number;
  description: string;
  photo: string;
  discipline: string;
  caracteristiques: string[];
}

export interface Instructeur {
  nom: string;
  titre: string;
  specialite: string;
  bio: string;
  photo: string;
  palmares: string[];
  annees: number;
  citation: string;
}

export interface AvisEquitation {
  texte: string;
  auteur: string;
  cours: string;
  photo: string;
  note: number;
  depuis: string;
}

export interface FormulaireAbonnement {
  nom: string;
  prix: string;
  periode: string;
  description: string;
  inclus: string[];
  populaire?: boolean;
}

export interface EvenementEquitation {
  titre: string;
  date: string;
  description: string;
  type: string;
}

export interface ConfigEquitation {
  nomCentre: string;
  tagline: string;
  sousTagline: string;
  descriptionHero: string;
  descriptionAPropos: string;
  citation: string;
  auteurCitation: string;
  fondee: string;
  superficie: string;
  nbChevaux: string;

  couleurFond: string;
  couleurBordeaux: string;
  couleurOr: string;
  couleurPrairie: string;
  couleurTexte: string;
  couleurFondSombre: string;

  photoHero: string;
  photoAPropos1: string;
  photoAPropos2: string;
  photoAPropos3: string;
  photoBanner: string;

  stats: { valeur: string; label: string; icone: string }[];
  cours: CoursEquitation[];
  chevaux: Cheval[];
  instructeurs: Instructeur[];
  avis: AvisEquitation[];
  abonnements: FormulaireAbonnement[];
  evenements: EvenementEquitation[];
  faq: { question: string; reponse: string }[];
  palmares: { annee: string; titre: string; discipline: string }[];

  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  coordGoogleMaps: string;
  reseaux: { instagram?: string; facebook?: string; youtube?: string };
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_EQUITATION_DEFAUT: ConfigEquitation = {
  nomCentre: 'Écurie Bellerive',
  tagline: 'L\'excellence équestre,',
  sousTagline: 'à votre portée.',
  descriptionHero: 'Découvrez la magie du cheval dans un cadre naturel exceptionnel. Cours d\'équitation pour tous les niveaux, de l\'initiation à la compétition.',
  descriptionAPropos: 'Fondée en 2005 au cœur de la campagne québécoise, l\'Écurie Bellerive est bien plus qu\'un centre équestre — c\'est un lieu de vie où humains et chevaux créent des liens uniques. Notre équipe passionnée accueille cavaliers de tous âges dans le respect du cheval et des traditions équestres.',
  citation: 'Le cheval vous donne ce que vous lui donnez.',
  auteurCitation: 'Antoine de Pluvinel',
  fondee: '2005',
  superficie: '45 hectares',
  nbChevaux: '32 chevaux',

  couleurFond: '#faf8f3',
  couleurBordeaux: '#8b2635',
  couleurOr: '#c9a84c',
  couleurPrairie: '#4a7c59',
  couleurTexte: '#2c1f1a',
  couleurFondSombre: '#1a0f0a',

  photoHero: 'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos2: 'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos3: 'https://images.pexels.com/photos/52500/horse-herd-fog-nature-52500.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoBanner: 'https://images.pexels.com/photos/2123375/pexels-photo-2123375.jpeg?auto=compress&cs=tinysrgb&w=1600',

  stats: [
    { valeur: '450+', label: 'Cavaliers formés', icone: '🏇' },
    { valeur: '32',   label: 'Chevaux',          icone: '🐎' },
    { valeur: '18',   label: 'Années d\'expérience', icone: '🏆' },
    { valeur: '98%',  label: 'Satisfaction',     icone: '⭐' },
  ],

  cours: [
    {
      titre: 'Initiation & Premiers Pas',
      description: 'Découvrez le monde du cheval en toute sécurité. Approche, pansage, monte en longe et premiers équilibres en selle.',
      photo: 'https://images.pexels.com/photos/1620653/pexels-photo-1620653.jpeg?auto=compress&cs=tinysrgb&w=800',
      niveau: 'Débutant', age: 'Dès 5 ans', duree: '45 min',
      prix: '45$',
      inclus: ['Casque fourni', 'Accompagnement moniteur', 'Pansage inclus', 'Carnet de bord'],
      disciplines: ['Mise en selle', 'Longe', 'Pansage', 'Sécurité'],
    },
    {
      titre: 'Cours Collectifs — Perfectionnement',
      description: 'Améliorez votre assiette, votre équilibre et la communication avec votre monture. Travail au trot et premiers galops.',
      photo: 'https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=800',
      niveau: 'Intermédiaire', age: 'Tous âges', duree: '60 min',
      prix: '65$',
      inclus: ['Groupe max 6 personnes', 'Cheval assigné', 'Évaluation mensuelle', 'Accès théorie'],
      disciplines: ['Trot assis/enlevé', 'Galop', 'Obstacles intro', 'Volte & serpentine'],
    },
    {
      titre: 'Stage Intensif — Obstacles',
      description: 'Une semaine complète d\'immersion pour progresser rapidement en saut d\'obstacles. Idéal pour les cavaliers ambitieux.',
      photo: 'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=800',
      niveau: 'Avancé', age: '12 ans+', duree: '5 jours',
      prix: '480$',
      inclus: ['2 séances/jour', 'Repas inclus', 'Logement possible', 'Certification Galop'],
      disciplines: ['Barres au sol', 'Verticales', 'Oxers', 'Parcours complet'],
    },
    {
      titre: 'Préparation Compétition',
      description: 'Entraînement personnalisé avec nos instructeurs brevetés pour viser le podium en concours officiel.',
      photo: 'https://images.pexels.com/photos/2123375/pexels-photo-2123375.jpeg?auto=compress&cs=tinysrgb&w=800',
      niveau: 'Compétition', age: '14 ans+', duree: '90 min',
      prix: '95$',
      inclus: ['Coach dédié', 'Vidéo analyse', 'Plan d\'entraînement', 'Accompagnement concours'],
      disciplines: ['Technique avancée', 'Mentale', 'Parcours FEI', 'Chronométrage'],
    },
  ],

  chevaux: [
    { nom: 'Sultan', race: 'Lusitanien', age: 9, description: 'Sultan est notre cheval pédagogique par excellence. Doux, patient et à l\'écoute, il accompagne nos débutants avec une sérénité remarquable.', photo: 'https://images.pexels.com/photos/52500/horse-herd-fog-nature-52500.jpeg?auto=compress&cs=tinysrgb&w=600', discipline: 'Initiation & Dressage', caracteristiques: ['Très docile', 'Idéal débutants', 'Taille 1.62m'] },
    { nom: 'Tempête', race: 'Selle Français', age: 7, description: 'Vive et athlétique, Tempête excelle dans le saut d\'obstacles. Ses cavaliers intermédiaires adorent son énergie communicative.', photo: 'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=600', discipline: 'Obstacles & Compétition', caracteristiques: ['Energique', 'Saut naturel', 'Taille 1.68m'] },
    { nom: 'Caramel', race: 'Quarter Horse', age: 12, description: 'Notre vétéran adoré. Caramel a formé des centaines de cavaliers depuis 2015. Calme et fiable, il inspire confiance instantanément.', photo: 'https://images.pexels.com/photos/1620653/pexels-photo-1620653.jpeg?auto=compress&cs=tinysrgb&w=600', discipline: 'Tous niveaux', caracteristiques: ['Très expérimenté', 'Calme absolu', 'Taille 1.55m'] },
  ],

  instructeurs: [
    {
      nom: 'Marie-Ève Fontaine',
      titre: 'Directrice & Instructeure en chef',
      specialite: 'Saut d\'obstacles & Pédagogie jeunesse',
      bio: 'Cavalière depuis l\'âge de 4 ans, Marie-Ève a représenté le Canada en concours hippique international. Elle a fondé Écurie Bellerive pour partager son amour du cheval avec tous.',
      photo: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400',
      palmares: ['Championne provinciale CSO 2018', 'Médaille d\'or Jeux du Québec 2015', 'Brevet d\'État 2e degré'],
      annees: 22,
      citation: 'La connexion avec un cheval est une des plus belles choses qu\'on puisse vivre.',
    },
    {
      nom: 'Jacques Beaumont',
      titre: 'Instructeur Senior — Dressage',
      specialite: 'Dressage classique & Équitation de travail',
      bio: 'Formé à l\'École Nationale d\'Équitation de Saumur, Jacques apporte une expertise rare en dressage classique. Ses cours combinent tradition française et méthodes douces modernes.',
      photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400',
      palmares: ['Élève de Saumur 2006', 'Instructeur national FEQ', 'Formateur de formateurs'],
      annees: 16,
      citation: 'L\'équitation est une conversation silencieuse entre deux êtres.',
    },
  ],

  avis: [
    { texte: 'Mon fils a commencé à 6 ans avec Sultan. En deux ans, il est passé de "j\'ai peur des chevaux" à "je veux faire de la compétition". L\'équipe est tellement bienveillante avec les enfants!', auteur: 'Nathalie Côté', cours: 'Initiation', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 2 ans' },
    { texte: 'J\'ai recommencé l\'équitation à 45 ans après 20 ans d\'arrêt. Marie-Ève et son équipe m\'ont remis en confiance en quelques séances. Le cadre est magnifique, les chevaux superbes.', auteur: 'Pierre-Antoine Leroux', cours: 'Perfectionnement', photo: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 1 an' },
    { texte: 'Le stage intensif obstacles a transformé ma technique. La vidéo-analyse avec Jacques est vraiment révélatrice. J\'ai décroché mon Galop 5 au premier essai!', auteur: 'Sofia Marchand', cours: 'Stage Obstacles', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 3 ans' },
  ],

  abonnements: [
    { nom: 'Découverte', prix: '185$', periode: '/ mois', description: '4 cours par mois pour débuter votre aventure équestre.', inclus: ['4 cours collectifs', 'Équipement fourni', 'Accès aux écuries', 'Assurance incluse'], populaire: false },
    { nom: 'Cavalier', prix: '320$', periode: '/ mois', description: 'Notre formule phare pour progresser régulièrement.', inclus: ['8 cours collectifs', '1 cours semi-privé', 'Accès paddock libre', 'Évaluation trimestrielle', 'Pansage illimité', 'Accès soirées thématiques'], populaire: true },
    { nom: 'Champion', prix: '580$', periode: '/ mois', description: 'La formule complète pour viser la compétition.', inclus: ['Cours illimités', '2 cours privés / sem.', 'Préparation concours', 'Cheval dédié', 'Coach personnel', 'Hébergement cheval inclus'], populaire: false },
  ],

  evenements: [
    { titre: 'Journée Portes Ouvertes', date: '15 juillet 2026', description: 'Venez découvrir nos écuries, rencontrer nos chevaux et assister à une démonstration des instructeurs. Entrée gratuite!', type: 'Portes ouvertes' },
    { titre: 'Concours Interne — CSO', date: '9 août 2026', description: 'Notre traditionnel concours d\'obstacles annuel. Toutes les catégories de Galop 3 à Amateur. Trophées et surprises!', type: 'Compétition' },
    { titre: 'Stage de Noël', date: '22-26 décembre 2026', description: 'Cinq jours de stage intensif dans l\'ambiance feutrée de l\'hiver québécois. Places très limitées.', type: 'Stage' },
  ],

  palmares: [
    { annee: '2024', titre: 'Champion provincial CSO Amateur', discipline: 'Saut d\'obstacles' },
    { annee: '2023', titre: 'Coupe du Québec — 2e place', discipline: 'Dressage' },
    { annee: '2022', titre: 'Centre équestre de l\'année FEQ', discipline: 'Excellence pédagogique' },
    { annee: '2021', titre: 'Médaille d\'or Jeux équestres', discipline: 'Saut d\'obstacles' },
  ],

  faq: [
    { question: 'À partir de quel âge peut-on commencer l\'équitation?', reponse: 'Nous accueillons les enfants dès 5 ans en initiation sur nos poneys. Les cours réguliers commencent à 7 ans. Il n\'y a pas d\'âge maximum — nous avons des cavaliers qui ont commencé à 60 ans!' },
    { question: 'Dois-je avoir mon propre équipement?', reponse: 'Non! Casques, vestes de protection et bottes sont disponibles gratuitement à l\'Écurie. Pour les cours réguliers, nous recommandons d\'investir dans votre propre casque pour des raisons d\'hygiène.' },
    { question: 'Comment se déroule le premier cours?', reponse: 'Votre premier cours commence par une rencontre avec votre instructeur, une visite des écuries et la présentation de votre cheval. Vous apprendrez à le panser avant de monter pour la première fois en toute sécurité.' },
    { question: 'Proposez-vous des cours pour adultes débutants?', reponse: 'Absolument! Environ 40% de nos nouveaux cavaliers sont des adultes. Nos instructeurs sont formés pour travailler avec tous les âges. Beaucoup de nos membres adultes disent que l\'équitation est devenu leur passion principale!' },
    { question: 'Y a-t-il des soins apportés aux chevaux en dehors des cours?', reponse: 'Nos chevaux sont soignés 365 jours par an par notre équipe de palefreniers dévoués. Veterinaire, maréchal-ferrant et ostéopathe équin interviennent régulièrement. Le bien-être de nos chevaux est notre priorité absolue.' },
  ],

  adresse: '1250 chemin des Écuries',
  ville: 'Saint-Hippolyte, QC J8A 1A1',
  telephone: '(450) 555-0380',
  email: 'bonjour@ecurie-bellerive.ca',
  horaires: ['Lun – Ven : 8h – 20h', 'Samedi : 7h – 21h', 'Dimanche : 8h – 18h'],
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',
  reseaux: { instagram: '#', facebook: '#', youtube: '#' },

  sections: [
    { id: 'hero',         actif: true, ordre: 1,  label: 'Hero + Cheval au galop'   },
    { id: 'stats',        actif: true, ordre: 2,  label: 'Chiffres clés'            },
    { id: 'cours',        actif: true, ordre: 3,  label: 'Nos cours'                },
    { id: 'chevaux',      actif: true, ordre: 4,  label: 'Nos chevaux'              },
    { id: 'apropos',      actif: true, ordre: 5,  label: 'À propos de l\'écurie'    },
    { id: 'instructeurs', actif: true, ordre: 6,  label: 'Nos instructeurs'         },
    { id: 'palmares',     actif: true, ordre: 7,  label: 'Palmarès & Récompenses'   },
    { id: 'evenements',   actif: true, ordre: 8,  label: 'Événements à venir'       },
    { id: 'avis',         actif: true, ordre: 9,  label: 'Témoignages'              },
    { id: 'abonnements',  actif: true, ordre: 10, label: 'Formules & Tarifs'        },
    { id: 'faq',          actif: true, ordre: 11, label: 'FAQ'                      },
    { id: 'contact',      actif: true, ordre: 12, label: 'Contact & Réservation'    },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

// ─── STYLES ───────────────────────────────────────────────────────────────────

const getStyle = (c: ConfigEquitation) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Lato:wght@300;400;700;900&family=Dancing+Script:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}

@keyframes galop {
  0%   { transform: translateX(-180px) scaleX(1); }
  48%  { transform: translateX(calc(100vw + 60px)) scaleX(1); }
  50%  { transform: translateX(calc(100vw + 60px)) scaleX(-1); }
  98%  { transform: translateX(-180px) scaleX(-1); }
  100% { transform: translateX(-180px) scaleX(1); }
}
@keyframes sabotEtincelle {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}
@keyframes herbeBalancement {
  0%,100% { transform: rotate(var(--r0)) skewX(0deg); }
  50%     { transform: rotate(var(--r1)) skewX(2deg); }
}
@keyframes fadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
@keyframes fadeLeft { from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)} }
@keyframes fadeRight { from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)} }
@keyframes rubanEntree { from{transform:rotate(-12deg) scale(0);opacity:0} to{transform:rotate(-12deg) scale(1);opacity:1} }
@keyframes parallaxBg { from{background-position:center 0}to{background-position:center -60px} }
@keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
@keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
@keyframes flottePhoto { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
@keyframes compteNum { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }

.rv  {opacity:0;transform:translateY(32px);transition:opacity .9s,transform .9s;}
.rv.vis{opacity:1;transform:none;}
.rv-l{opacity:0;transform:translateX(-44px);transition:opacity .9s,transform .9s;}
.rv-l.vis{opacity:1;transform:none;}
.rv-r{opacity:0;transform:translateX(44px);transition:opacity .9s,transform .9s;}
.rv-r.vis{opacity:1;transform:none;}

.btn-bordeaux{
  background:${c.couleurBordeaux};color:#fff;border:none;padding:15px 38px;
  font-family:'Lato',sans-serif;font-size:13px;font-weight:900;
  letter-spacing:.12em;text-transform:uppercase;cursor:pointer;
  border-radius:2px;transition:filter .25s,transform .2s,box-shadow .3s;
  box-shadow:0 4px 20px ${c.couleurBordeaux}50;
}
.btn-bordeaux:hover{filter:brightness(1.15);transform:translateY(-2px);box-shadow:0 8px 32px ${c.couleurBordeaux}70;}

.btn-or-outline{
  background:transparent;color:${c.couleurOr};border:1.5px solid ${c.couleurOr};
  padding:14px 36px;font-family:'Lato',sans-serif;font-size:13px;font-weight:900;
  letter-spacing:.12em;text-transform:uppercase;cursor:pointer;border-radius:2px;
  transition:all .25s;
}
.btn-or-outline:hover{background:${c.couleurOr}18;transform:translateY(-2px);}

.nav-eq{
  font-family:'Lato',sans-serif;font-size:11px;font-weight:900;
  letter-spacing:.2em;text-transform:uppercase;
  color:rgba(255,255,255,.8);cursor:pointer;background:none;border:none;
  transition:color .2s;position:relative;
}
.nav-eq::after{
  content:'';position:absolute;bottom:-3px;left:0;right:0;height:1.5px;
  background:${c.couleurOr};transform:scaleX(0);transition:transform .3s;
}
.nav-eq:hover,.nav-eq.active{color:${c.couleurOr};}
.nav-eq:hover::after,.nav-eq.active::after{transform:scaleX(1);}

.carte-cuir{
  background:linear-gradient(145deg,#fdf9f0,#f5ede0);
  border:1px solid rgba(201,168,76,.25);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 2px 12px rgba(0,0,0,.06);
}

.faq-btn{
  width:100%;background:none;border:none;cursor:pointer;padding:20px 0;
  display:flex;justify-content:space-between;align-items:center;
  font-family:'Playfair Display',serif;font-size:17px;font-weight:500;
  color:${c.couleurTexte};text-align:left;
  border-bottom:1px solid rgba(0,0,0,.08);transition:color .2s;
}
.faq-btn:hover{color:${c.couleurBordeaux};}

.fw-inp{
  width:100%;padding:12px 16px;background:#fff;
  border:none;border-bottom:1.5px solid rgba(0,0,0,.15);
  color:${c.couleurTexte};font-family:'Lato',sans-serif;font-size:14px;
  outline:none;box-sizing:border-box;transition:border-color .2s;
}
.fw-inp:focus{border-bottom-color:${c.couleurBordeaux};}
.fw-inp::placeholder{color:rgba(0,0,0,.3);}

.niveau-debutant{background:rgba(74,124,89,.15);color:#4a7c59;border:1px solid rgba(74,124,89,.3);}
.niveau-intermediaire{background:rgba(201,168,76,.15);color:#9a7a20;border:1px solid rgba(201,168,76,.3);}
.niveau-avance{background:rgba(139,38,53,.15);color:#8b2635;border:1px solid rgba(139,38,53,.3);}
.niveau-competition{background:rgba(30,30,30,.12);color:#1a1a1a;border:1px solid rgba(30,30,30,.25);}
`;

// ─── CHEVAL SVG AU GALOP ──────────────────────────────────────────────────────

function ChevalGalop({ couleurOr, couleurBordeaux }: { couleurOr: string; couleurBordeaux: string }) {
  const [etincelles, setEtincelles] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
  const idRef = useRef(0);

  // Générer étincelles périodiquement (sabots)
  useEffect(() => {
    const interval = setInterval(() => {
      const nouvelles = Array.from({ length: 4 }, () => ({
        id: idRef.current++,
        x: Math.random() * 40 + 60,
        y: 130 + Math.random() * 20,
        dx: (Math.random() - 0.5) * 30,
        dy: -(Math.random() * 20 + 10),
      }));
      setEtincelles(prev => [...prev.slice(-12), ...nouvelles]);
      setTimeout(() => setEtincelles(prev => prev.slice(4)), 600);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'absolute', bottom: 60, left: 0, width: '100%', height: 160, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Étincelles sabots */}
      {etincelles.map(e => (
        <div key={e.id} style={{
          position: 'absolute', left: e.x, top: e.y,
          width: 4, height: 4, borderRadius: '50%',
          background: couleurOr, opacity: 0.9,
          animation: `sabotEtincelle .6s ease-out forwards`,
          ['--dx' as any]: `${e.dx}px`,
          ['--dy' as any]: `${e.dy}px`,
        }} />
      ))}

      {/* Cheval SVG */}
      <div style={{ animation: 'galop 12s linear infinite', position: 'absolute', bottom: 10, left: 0 }}>
        <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ filter: `drop-shadow(0 4px 12px ${couleurBordeaux}60)` }}>
          {/* Corps */}
          <ellipse cx="80" cy="80" rx="50" ry="28" fill={couleurBordeaux} opacity="0.9" />
          {/* Cou */}
          <path d="M100 65 Q115 40 105 25 Q100 18 95 22 Q90 28 92 45 L95 65Z" fill={couleurBordeaux} opacity="0.9" />
          {/* Tête */}
          <ellipse cx="108" cy="20" rx="14" ry="10" fill={couleurBordeaux} opacity="0.9" transform="rotate(-20 108 20)" />
          {/* Museau */}
          <ellipse cx="118" cy="24" rx="7" ry="5" fill="#a03040" transform="rotate(-20 118 24)" />
          {/* Narine */}
          <ellipse cx="122" cy="26" rx="2" ry="1.5" fill="#7a2030" transform="rotate(-20 122 26)" />
          {/* Œil */}
          <circle cx="105" cy="16" r="3" fill="#1a1a1a" />
          <circle cx="106" cy="15" r="1" fill="#fff" />
          {/* Crinière */}
          <path d="M98 22 Q103 15 108 10 Q105 8 100 12 Q95 16 95 22Z" fill={couleurOr} opacity="0.85" />
          <path d="M95 30 Q90 22 88 16 Q85 14 83 18 Q85 24 90 30Z" fill={couleurOr} opacity="0.7" />
          {/* Queue */}
          <path d="M30 72 Q15 60 10 75 Q12 90 22 85 Q28 82 30 72Z" fill={couleurOr} opacity="0.8" />
          <path d="M28 75 Q8 72 5 85 Q8 98 20 92" stroke={couleurOr} strokeWidth="2" fill="none" opacity="0.6" />
          {/* Jambes — galop stylisé */}
          {/* Avant-droit levé */}
          <path d="M100 100 Q108 110 105 125 L108 125 Q112 110 107 100Z" fill={couleurBordeaux} opacity="0.85" />
          {/* Avant-gauche tendu */}
          <path d="M90 102 Q85 118 82 130 L86 130 Q90 118 94 102Z" fill={couleurBordeaux} opacity="0.85" />
          {/* Arrière-droit */}
          <path d="M58 100 Q50 115 48 130 L52 130 Q55 115 62 100Z" fill={couleurBordeaux} opacity="0.85" />
          {/* Arrière-gauche levé */}
          <path d="M68 98 Q75 108 78 118 L74 122 Q68 112 64 98Z" fill={couleurBordeaux} opacity="0.85" />
          {/* Sabots */}
          <ellipse cx="83" cy="130" rx="5" ry="2.5" fill="#2c1a0a" />
          <ellipse cx="50" cy="130" rx="5" ry="2.5" fill="#2c1a0a" />
          {/* Poitrail / ventre contour */}
          <path d="M55 95 Q80 108 110 95" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

// ─── HERBE SVG ANIMÉE ─────────────────────────────────────────────────────────

function HerbeAnimee({ couleurPrairie }: { couleurPrairie: string }) {
  const { isMobile } = useIsMobile();
  const brins = Array.from({ length: 40 }, (_, i) => ({
    x: (i / 40) * 100 + (Math.random() - 0.5) * 2,
    h: 20 + Math.random() * 30,
    w: 2 + Math.random() * 2,
    delay: Math.random() * 3,
    duree: 2 + Math.random() * 2,
    r0: (Math.random() - 0.5) * 8,
    r1: (Math.random() - 0.5) * 14,
    opacity: 0.5 + Math.random() * 0.5,
  }));

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {brins.map((b, i) => (
          <rect
            key={i}
            x={b.x} y={80 - b.h} width={b.w} height={b.h}
            rx={b.w / 2}
            fill={couleurPrairie}
            opacity={b.opacity}
            style={{
              transformOrigin: `${b.x + b.w / 2}px 80px`,
              animation: `herbeBalancement ${b.duree}s ${b.delay}s ease-in-out infinite`,
              ['--r0' as any]: `${b.r0}deg`,
              ['--r1' as any]: `${b.r1}deg`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigEquitation; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [
    ['accueil', 'Accueil'], ['cours-page', 'Cours'], ['chevaux-page', 'Nos Chevaux'],
    ['instructeurs-page', 'Instructeurs'], ['contact-page', 'Réserver'],
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(26,15,10,0.97)' : 'rgba(26,15,10,.85)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${config.couleurOr}25` : 'none',
      transition: 'all .4s', padding: isMobile ? '0 20px' : '0 48px',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, fontStyle: 'italic', color: config.couleurOr, letterSpacing: '0.3em', marginBottom: 2 }}>Centre Équestre</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>{config.nomCentre}</p>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {liens.map(([id, label]) => (
            <button key={id} className={`nav-eq${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>{label}</button>
          ))}
        </div>
        <button className="btn-bordeaux" onClick={() => setPage('contact-page')} style={{ padding: '10px 22px', fontSize: 11 }}>
          📞 Nous appeler
        </button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigEquitation; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cp = config.couleurPrairie;
  const cf = config.couleurFondSombre;

  return (
    <section style={{ background: cf, minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: 70 }}>
      {/* Photo fond parallax */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${config.photoHero})`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
        filter: 'brightness(0.32)',
        transition: 'background-position .1s',
      }} />

      {/* Gradient multicouche */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 20%, ${cf}aa 60%, ${cf} 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${cf}dd 0%, transparent 55%)` }} />

      {/* Herbe animée */}
      <HerbeAnimee couleurPrairie={cp} />

      {/* Cheval au galop */}
      <ChevalGalop couleurOr={co} couleurBordeaux={cb} />

      {/* Contenu */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: isMobile ? '48px 20px' : '60px 48px', width: '100%' }}>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 20, color: co, letterSpacing: '0.04em', marginBottom: 16, animation: 'fadeUp .8s ease both' }}>
            🐎 {config.nomCentre}
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(52px, 8.5vw, 110px)',
            fontWeight: 800, color: '#fff', lineHeight: 0.92,
            letterSpacing: '-0.02em', marginBottom: 20,
            animation: 'fadeUp .9s .1s ease both',
          }}>
            {config.tagline}<br />
            <em style={{ fontStyle: 'italic', color: co }}>{config.sousTagline}</em>
          </h1>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: 'rgba(255,255,255,.65)', lineHeight: 1.9, maxWidth: 520, marginBottom: 44, animation: 'fadeUp .9s .2s ease both' }}>
            {config.descriptionHero}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeUp .9s .3s ease both' }}>
            <button className="btn-bordeaux" onClick={() => setPage('cours-page')}>Découvrir nos cours</button>
            <button className="btn-or-outline" onClick={() => setPage('contact-page')}>Réserver une visite</button>
          </div>

          {/* Badges fondation */}
          <div style={{ display: 'flex', gap: 28, marginTop: 52, flexWrap: 'wrap', animation: 'fadeUp .9s .4s ease both' }}>
            {[
              ['🏇', config.fondee, 'Fondée en'],
              ['🐎', config.nbChevaux, 'Nos chevaux'],
              ['🌿', config.superficie, 'De prairies'],
            ].map(([ico, val, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{ico}</span>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: co, lineHeight: 1 }}>{val}</p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: 'rgba(255,255,255,.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const co = config.couleurOr;
  const cb = config.couleurBordeaux;
  const stats = ea(config.stats, CONFIG_EQUITATION_DEFAUT.stats);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '80px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 2, background: 'rgba(0,0,0,.04)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: config.couleurFond, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, animation: `pulse 3s ${i * .5}s ease-in-out infinite` }}>{s.icone}</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px,4vw,56px)', fontWeight: 800, color: cb, lineHeight: 1, marginBottom: 8 }}>{s.valeur}</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(0,0,0,.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION COURS ────────────────────────────────────────────────────────────

function SectionCours({ config, setPage }: { config: ConfigEquitation; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cours = ea(config.cours, CONFIG_EQUITATION_DEFAUT.cours);

  const niveauClass = (n: string) => {
    if (n === 'Débutant') return 'niveau-debutant';
    if (n === 'Intermédiaire') return 'niveau-intermediaire';
    if (n === 'Avancé') return 'niveau-avance';
    return 'niveau-competition';
  };

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nos programmes</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
              Trouvez votre <em style={{ fontStyle: 'italic', color: cb }}>programme idéal</em>
            </h2>
          </div>
          <button className="btn-or-outline" onClick={() => setPage('cours-page')}>Tous les cours →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
          {cours.map((c, i) => (
            <div key={i} className="carte-cuir" style={{ overflow: 'hidden', borderRadius: 4, transition: 'transform .4s,box-shadow .4s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 24px 60px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              {/* Photo */}
              <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                <img src={c.photo} alt={c.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.07)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
                <div style={{ position: 'absolute', top: 14, right: 14, background: cb, color: '#fff', padding: '8px 14px', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>
                  {c.prix}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top, #f5f0e8, transparent)` }} />
              </div>

              {/* Contenu */}
              <div style={{ padding: '20px 24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className={niveauClass(c.niveau)} style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20 }}>
                    {c.niveau}
                  </span>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(0,0,0,.4)', fontWeight: 700 }}>⏱ {c.duree} · {c.age}</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: config.couleurTexte, marginBottom: 10, lineHeight: 1.25 }}>{c.titre}</h3>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7, marginBottom: 16 }}>{c.description}</p>

                {/* Disciplines */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {c.disciplines.map((d, j) => (
                    <span key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, padding: '3px 9px', background: `${co}18`, border: `1px solid ${co}35`, color: config.couleurTexte, fontWeight: 700 }}>
                      🐴 {d}
                    </span>
                  ))}
                </div>

                {/* Inclus */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 14, marginBottom: 18 }}>
                  {c.inclus.map((item, j) => (
                    <p key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(0,0,0,.5)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: cb, fontSize: 10 }}>✓</span>{item}
                    </p>
                  ))}
                </div>

                <button className="btn-bordeaux" style={{ width: '100%', textAlign: 'center', padding: '12px' }} onClick={() => setPage('contact-page')}>
                  Réserver ce cours
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CHEVAUX ──────────────────────────────────────────────────────────

function SectionChevaux({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;
  const chevaux = ea(config.chevaux, CONFIG_EQUITATION_DEFAUT.chevaux);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActif(a => (a + 1) % chevaux.length), 5000);
    return () => clearInterval(id);
  }, [chevaux.length]);

  return (
    <section style={{ background: cf, padding: '100px 0', overflow: 'hidden' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`}>
        <div style={{ maxWidth: 1320, margin: '0 auto 56px', padding: isMobile ? '0 20px' : '0 48px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Notre herd</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            Rencontrez nos <em style={{ fontStyle: 'italic', color: co }}>compagnons</em>
          </h2>
        </div>

        {/* Carrousel photos perspective 3D */}
        <div style={{ position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px' }}>
          {chevaux.map((ch, i) => {
            const offset = i - actif;
            const absOffset = Math.abs(offset);
            const isActif = i === actif;
            return (
              <div key={i} onClick={() => setActif(i)}
                style={{
                  position: 'absolute',
                  width: isActif ? 520 : 300,
                  height: isActif ? 380 : 240,
                  transform: `translateX(${offset * (isActif ? 0 : 320)}px) translateZ(${isActif ? 0 : -200}px) rotateY(${offset * (isActif ? 0 : -12)}deg)`,
                  opacity: absOffset > 1 ? 0 : isActif ? 1 : 0.6,
                  transition: 'all .7s cubic-bezier(.4,.0,.2,1)',
                  cursor: isActif ? 'default' : 'pointer',
                  overflow: 'hidden',
                  borderRadius: 4,
                  zIndex: isActif ? 10 : 5 - absOffset,
                  boxShadow: isActif ? '0 32px 80px rgba(0,0,0,.5)' : 'none',
                }}>
                <img src={ch.photo} alt={ch.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isActif ? 'brightness(.7)' : 'brightness(.5)', transition: 'filter .5s' }} />
                {isActif && (
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${cf} 0%, transparent 50%)` }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 32px' }}>
                      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>{ch.race} · {ch.age} ans · {ch.discipline}</p>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{ch.nom}</h3>
                      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, marginBottom: 14 }}>{ch.description}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {ch.caracteristiques.map((c2, j) => (
                          <span key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, padding: '3px 10px', background: `${co}25`, border: `1px solid ${co}40`, color: co, fontWeight: 700 }}>{c2}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {!isActif && (
                  <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>{ch.nom}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Points navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32 }}>
          {chevaux.map((_, i) => (
            <button key={i} onClick={() => setActif(i)} style={{ width: i === actif ? 28 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === actif ? co : 'rgba(255,255,255,.3)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Photos mosaïque */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/3', height: 300, overflow: 'hidden' }}>
              <img src={config.photoAPropos1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden' }}>
              <img src={config.photoAPropos2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden' }}>
              <img src={config.photoAPropos3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
            </div>
          </div>
          {/* Médaillon doré */}
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%',
            background: `linear-gradient(135deg, ${co}, #a07840)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 28px ${co}50`,
          }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{config.fondee}</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, color: 'rgba(255,255,255,.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fondée</p>
          </div>
        </div>

        {/* Texte */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>Notre histoire</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,3.5vw,50px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.15, marginBottom: 24 }}>
            Bien plus qu'une<br /><em style={{ fontStyle: 'italic', color: cb }}>écurie</em>
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, color: 'rgba(0,0,0,.6)', lineHeight: 1.9, marginBottom: 24 }}>
            {config.descriptionAPropos}
          </p>
          <blockquote style={{ borderLeft: `3px solid ${co}`, paddingLeft: 20, margin: '24px 0 32px' }}>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: co, lineHeight: 1.4 }}>"{config.citation}"</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(0,0,0,.4)', marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>— {config.auteurCitation}</p>
          </blockquote>
          <button className="btn-bordeaux">Visiter l'écurie</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION INSTRUCTEURS ─────────────────────────────────────────────────────

function SectionInstructeurs({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;
  const instructeurs = ea(config.instructeurs, CONFIG_EQUITATION_DEFAUT.instructeurs);
  const [actif, setActif] = useState<number | null>(null);

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>L'équipe</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Nos <em style={{ fontStyle: 'italic', color: cb }}>instructeurs</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(instructeurs.length, 3)}, 1fr)`, gap: 28 }}>
          {instructeurs.map((inst, i) => (
            <div key={i} onClick={() => setActif(actif === i ? null : i)} className="carte-cuir"
              style={{ overflow: 'hidden', borderRadius: 4, cursor: 'pointer', transition: 'transform .4s,box-shadow .4s',
                transform: actif === i ? 'translateY(-6px)' : 'none',
                boxShadow: actif === i ? `0 24px 60px ${cb}20` : 'none' }}>
              <div style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
                <img src={inst.photo} alt={inst.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(.8)', transition: 'transform .6s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${config.couleurTexte}cc, transparent 50%)` }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{inst.nom}</p>
                  <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 13, color: co }}>{inst.specialite}</p>
                </div>
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{inst.titre}</p>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7 }}>{inst.bio}</p>

                {/* Bio étendue */}
                <div style={{ maxHeight: actif === i ? 300 : 0, overflow: 'hidden', transition: 'max-height .4s ease' }}>
                  <blockquote style={{ borderLeft: `3px solid ${co}`, paddingLeft: 14, margin: '16px 0 14px' }}>
                    <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 16, color: co, lineHeight: 1.5 }}>"{inst.citation}"</p>
                  </blockquote>
                  {inst.palmares.map((p, j) => (
                    <p key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(0,0,0,.5)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: co }}>🏆</span>{p}
                    </p>
                  ))}
                </div>
                <p style={{ marginTop: 12, color: cb, fontSize: 11, fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
                  {actif === i ? '↑ Masquer' : `${inst.annees} ans d'expérience — En savoir plus ↓`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PALMARÈS ────────────────────────────────────────────────────────

function SectionPalmares({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;
  const palmares = ea(config.palmares, CONFIG_EQUITATION_DEFAUT.palmares);

  return (
    <section style={{ background: cf, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      {/* Fond cheval flou décoratif */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoBanner})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nos titres</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            Notre <em style={{ fontStyle: 'italic', color: co }}>palmarès</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {palmares.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.06)', border: `1px solid ${co}30`,
              borderRadius: 4, padding: '28px 24px', position: 'relative', overflow: 'hidden',
              animation: rv.vis ? `fadeUp .6s ${i * .1}s ease both` : 'none',
            }}>
              {/* Ruban doré animé */}
              <div style={{
                position: 'absolute', top: 18, right: -28,
                background: `linear-gradient(135deg, ${co}, #a07840)`,
                color: '#fff', fontSize: 10, fontWeight: 900, fontFamily: "'Lato', sans-serif",
                padding: '4px 44px', letterSpacing: '0.1em', textTransform: 'uppercase',
                animation: rv.vis ? `rubanEntree .6s ${i * .15}s ease both` : 'none',
              }}>
                {p.annee}
              </div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{p.titre}</p>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: co, fontWeight: 700, letterSpacing: '0.05em' }}>{p.discipline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉVÉNEMENTS ───────────────────────────────────────────────────────

function SectionEvenements({ config, setPage }: { config: ConfigEquitation; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cp = config.couleurPrairie;
  const evenements = ea(config.evenements, CONFIG_EQUITATION_DEFAUT.evenements);

  const typeCouleur: Record<string, string> = {
    'Portes ouvertes': cp,
    'Compétition': cb,
    'Stage': co,
  };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Agenda</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
              Événements à <em style={{ fontStyle: 'italic', color: cb }}>venir</em>
            </h2>
          </div>
          <button className="btn-or-outline" onClick={() => setPage('contact-page')}>S'inscrire →</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evenements.map((ev, i) => {
            const couleur = typeCouleur[ev.type] || co;
            return (
              <div key={i} className="carte-cuir" style={{ borderRadius: 4, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 28, transition: 'transform .2s,box-shadow .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `4px 0 0 ${couleur} inset,0 8px 32px rgba(0,0,0,.1)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ flexShrink: 0, textAlign: 'center', background: `${couleur}18`, border: `2px solid ${couleur}40`, borderRadius: 4, padding: '12px 20px', minWidth: 90 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: couleur, lineHeight: 1 }}>
                    {ev.date.split(' ')[0]}
                  </p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: couleur, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    {ev.date.split(' ')[1]}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, padding: '2px 10px', background: `${couleur}20`, border: `1px solid ${couleur}40`, color: couleur, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {ev.type}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: config.couleurTexte, marginBottom: 6 }}>{ev.titre}</h3>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.6 }}>{ev.description}</p>
                </div>
                <button className="btn-bordeaux" style={{ flexShrink: 0, padding: '10px 20px', fontSize: 11 }} onClick={() => setPage('contact-page')}>
                  S'inscrire
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const avis = ea(config.avis, CONFIG_EQUITATION_DEFAUT.avis);

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Ils ont <em style={{ fontStyle: 'italic', color: cb }}>vécu l'aventure</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(avis.length, 3)}, 1fr)`, gap: 24 }}>
          {avis.map((a, i) => (
            <div key={i} className="carte-cuir" style={{ borderRadius: 4, padding: '28px 24px', borderTop: `4px solid ${co}`, transition: 'transform .3s,box-shadow .3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              <div style={{ fontSize: 40, color: co, opacity: .2, lineHeight: 1, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>"</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.65)', lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>{a.texte}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${co}` }} />
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: config.couleurTexte }}>{a.auteur}</p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: cb, fontStyle: 'italic' }}>{a.cours}</p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: 'rgba(0,0,0,.35)' }}>{a.depuis}</p>
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

// ─── SECTION ABONNEMENTS ──────────────────────────────────────────────────────

function SectionAbonnements({ config, setPage }: { config: ConfigEquitation; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const cf = config.couleurFondSombre;
  const abonnements = ea(config.abonnements, CONFIG_EQUITATION_DEFAUT.abonnements);

  return (
    <section style={{ background: cf, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoBanner})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.06 }} />
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Formules</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            Votre <em style={{ fontStyle: 'italic', color: co }}>abonnement</em> équestre
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(abonnements.length, 3)}, 1fr)`, gap: 20, alignItems: 'start' }}>
          {abonnements.map((a, i) => (
            <div key={i} style={{
              background: a.populaire ? '#fff' : 'rgba(255,255,255,.05)',
              border: `2px solid ${a.populaire ? co : 'rgba(255,255,255,.1)'}`,
              padding: '36px 28px', borderRadius: 4, position: 'relative',
              transform: a.populaire ? 'scale(1.04)' : 'none',
            }}>
              {a.populaire && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: co, color: config.couleurTexte, fontSize: 10, fontWeight: 900, fontFamily: "'Lato', sans-serif", padding: '4px 20px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  🏆 PLUS POPULAIRE
                </div>
              )}
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, color: a.populaire ? co : 'rgba(255,255,255,.5)', marginBottom: 10 }}>Formule</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: a.populaire ? config.couleurTexte : '#fff', marginBottom: 8 }}>{a.nom}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 800, color: a.populaire ? cb : co, lineHeight: 1 }}>{a.prix}</span>
                <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: a.populaire ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.4)' }}>{a.periode}</span>
              </div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: a.populaire ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.5)', marginBottom: 24, lineHeight: 1.6 }}>{a.description}</p>
              <div style={{ height: 1, background: a.populaire ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.1)', marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', marginBottom: 28 }}>
                {a.inclus.map((item, j) => (
                  <li key={j} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: a.populaire ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.6)', marginBottom: 10, display: 'flex', gap: 10 }}>
                    <span style={{ color: co, flexShrink: 0 }}>🐎</span>{item}
                  </li>
                ))}
              </ul>
              {a.populaire
                ? <button className="btn-bordeaux" style={{ width: '100%', textAlign: 'center', padding: '14px' }} onClick={() => setPage('contact-page')}>S'abonner →</button>
                : <button className="btn-or-outline" style={{ width: '100%', textAlign: 'center', padding: '13px', color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.2)' }} onClick={() => setPage('contact-page')}>Sélectionner →</button>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const faq = ea(config.faq, CONFIG_EQUITATION_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Vos <em style={{ fontStyle: 'italic', color: cb }}>questions</em>
          </h2>
        </div>
        {faq.map((f, i) => (
          <div key={i}>
            <button className="faq-btn" onClick={() => setOuvert(ouvert === i ? null : i)}>
              <span>🐴 {f.question}</span>
              <span style={{ color: co, fontSize: 22, flexShrink: 0, transition: 'transform .3s', transform: ouvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            <div style={{ overflow: 'hidden', maxHeight: ouvert === i ? '300px' : '0', transition: 'max-height .4s ease' }}>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.6)', lineHeight: 1.9, paddingBottom: 24, paddingTop: 10 }}>{f.reponse}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigEquitation }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cb = config.couleurBordeaux;
  const co = config.couleurOr;
  const horaires = ea(config.horaires, CONFIG_EQUITATION_DEFAUT.horaires);
  const cours = ea(config.cours, CONFIG_EQUITATION_DEFAUT.cours);

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', cours: '', message: '', niveau: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, centre: config.nomCentre, type: 'contact-equitation', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 32 : 80 }}>
          {/* Infos */}
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 900, color: cb, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nous trouver</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3vw,44px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.2, marginBottom: 32 }}>
              Venez nous<br /><em style={{ fontStyle: 'italic', color: cb }}>rencontrer</em>
            </h2>
            {[{ i: '📍', l: 'Adresse', v: `${config.adresse}, ${config.ville}` }, { i: '📞', l: 'Téléphone', v: config.telephone }, { i: '✉️', l: 'Courriel', v: config.email }].map((info, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{info.i}</span>
                <div>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: co, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>{info.l}</p>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.65)' }}>{info.v}</p>
                </div>
              </div>
            ))}
            <div style={{ background: '#fff', padding: '18px 22px', borderLeft: `4px solid ${co}`, marginBottom: 24 }}>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: co, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Heures d'ouverture</p>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', marginBottom: 5 }}>{h}</p>
              ))}
            </div>
            <div style={{ height: 220, overflow: 'hidden', borderRadius: 4, border: `1px solid ${co}20` }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" title="Localisation" />
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background: '#fff', padding: '40px 36px', borderTop: `4px solid ${cb}` }}>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🐎</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: config.couleurTexte, marginBottom: 12 }}>Message envoyé!</h3>
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: co }}>À très bientôt à l'écurie!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: config.couleurTexte, marginBottom: 8 }}>Réservation ou contact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  {[['Prénom *', 'prenom', 'Prénom', 'text'], ['Nom *', 'nom', 'Nom', 'text']].map(([label, key, ph]) => (
                    <div key={key}>
                      <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input className="fw-inp" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
                    </div>
                  ))}
                </div>
                {[['Email *', 'email', 'votre@email.ca', 'email'], ['Téléphone', 'telephone', '(514) 555-0000', 'tel']].map(([label, key, ph, type]) => (
                  <div key={key}>
                    <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input type={type} className="fw-inp" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Cours souhaité</label>
                  <select className="fw-inp" value={form.cours} onChange={e => setForm({ ...form, cours: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Choisir un cours...</option>
                    {cours.map((c, i) => <option key={i} value={c.titre}>{c.titre} — {c.prix}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Niveau actuel</label>
                  <select className="fw-inp" value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Votre niveau...</option>
                    {['Jamais monté', 'Débutant', 'Intermédiaire', 'Avancé', 'Compétition'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea className="fw-inp" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Âge, objectifs, questions sur nos chevaux..." style={{ resize: 'none' }} />
                </div>
              <button disabled={loading || !form.prenom || !form.email}
                  style={{ opacity: !form.prenom || !form.email ? .5 : 1, textAlign: 'center', padding: '16px' }}>
                  {loading ? '⏳ Envoi...' : '🐎 Envoyer ma demande'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigEquitation; setPage: (p: string) => void }) {
  const co = config.couleurOr;
  const cb = config.couleurBordeaux;
  const cf = config.couleurFondSombre;
  const cours = ea(config.cours, CONFIG_EQUITATION_DEFAUT.cours);

  return (
    <footer style={{ background: '#0f0804', borderTop: `1px solid ${co}20`, padding: '60px 48px 24px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 10, color: co, letterSpacing: '0.3em', marginBottom: 4 }}>Centre Équestre</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{config.nomCentre}</p>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, color: co, marginBottom: 16 }}>"{config.citation}"</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['instagram', '📸'], ['facebook', '📘'], ['youtube', '📺']].map(([k, ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,.06)', border: `1px solid ${co}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, textDecoration: 'none', borderRadius: 2, transition: 'all .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${co}20`}>{ico}</a>
              ) : null
            )}
          </div>
        </div>
        {[
          { titre: 'Navigation', liens: [['accueil', 'Accueil'], ['cours-page', 'Nos Cours'], ['chevaux-page', 'Nos Chevaux'], ['instructeurs-page', 'Instructeurs'], ['contact-page', 'Contact']] },
          { titre: 'Cours', liens: cours.slice(0, 4).map(c => ['cours-page', c.titre]) },
          { titre: 'Contact', liens: [[config.email, ''], [config.telephone, ''], [`${config.adresse}`, '']] },
        ].map((col, ci) => (
          <div key={ci}>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 900, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{col.titre}</p>
            {col.liens.map(([id, label], j) => (
              <p key={j} onClick={label ? () => setPage(id) : undefined}
                style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 7, cursor: label ? 'pointer' : 'default', transition: 'color .2s' }}
                onMouseEnter={e => { if (label) (e.currentTarget as HTMLParagraphElement).style.color = co; }}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,.4)'}>
                {label || id}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,.2)' }}>🐎 Fièrement équestre</p>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomCentre} — Tous droits réservés</p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateEquitationProps {
  config?: Partial<ConfigEquitation>;
  isPreview?: boolean;
}

export default function TemplateEquitation({ config: partiel, isPreview }: TemplateEquitationProps) {
  const estCouleurClaire = (hex?: string) => {
    if (!hex || hex.length < 7) return false;
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  };
  const fondValide = estCouleurClaire(partiel?.couleurFond);

  const config: ConfigEquitation = {
    ...CONFIG_EQUITATION_DEFAUT, ...partiel,
    couleurFond:   fondValide ? (partiel?.couleurFond   || CONFIG_EQUITATION_DEFAUT.couleurFond)   : CONFIG_EQUITATION_DEFAUT.couleurFond,
    couleurTexte:  fondValide ? (partiel?.couleurTexte  || CONFIG_EQUITATION_DEFAUT.couleurTexte)  : CONFIG_EQUITATION_DEFAUT.couleurTexte,
    couleurBordeaux:  partiel?.couleurBordeaux  || CONFIG_EQUITATION_DEFAUT.couleurBordeaux,
    couleurOr:        partiel?.couleurOr        || CONFIG_EQUITATION_DEFAUT.couleurOr,
    couleurPrairie:   partiel?.couleurPrairie   || CONFIG_EQUITATION_DEFAUT.couleurPrairie,
    couleurFondSombre:partiel?.couleurFondSombre|| CONFIG_EQUITATION_DEFAUT.couleurFondSombre,
  };

  const VALID_IDS = ['hero', 'stats', 'cours', 'chevaux', 'apropos', 'instructeurs', 'palmares', 'evenements', 'avis', 'abonnements', 'faq', 'contact'];
  const rawSections = ea(partiel?.sections, CONFIG_EQUITATION_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_EQUITATION_DEFAUT.sections;

  config.stats        = ea(partiel?.stats,        CONFIG_EQUITATION_DEFAUT.stats);
  config.cours        = ea(partiel?.cours,         CONFIG_EQUITATION_DEFAUT.cours);
  config.chevaux      = ea(partiel?.chevaux,       CONFIG_EQUITATION_DEFAUT.chevaux);
  config.instructeurs = ea(partiel?.instructeurs,  CONFIG_EQUITATION_DEFAUT.instructeurs);
  config.avis         = ea(partiel?.avis,          CONFIG_EQUITATION_DEFAUT.avis);
  config.abonnements  = ea(partiel?.abonnements,   CONFIG_EQUITATION_DEFAUT.abonnements);
  config.evenements   = ea(partiel?.evenements,    CONFIG_EQUITATION_DEFAUT.evenements);
  config.faq          = ea(partiel?.faq,           CONFIG_EQUITATION_DEFAUT.faq);
  config.palmares     = ea(partiel?.palmares,      CONFIG_EQUITATION_DEFAUT.palmares);
  config.horaires     = ea(partiel?.horaires,      CONFIG_EQUITATION_DEFAUT.horaires);

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':         return <SectionHero         config={config} setPage={handlePage} />;
      case 'stats':        return <SectionStats        config={config} />;
      case 'cours':        return <SectionCours        config={config} setPage={handlePage} />;
      case 'chevaux':      return <SectionChevaux      config={config} />;
      case 'apropos':      return <SectionAPropos      config={config} />;
      case 'instructeurs': return <SectionInstructeurs config={config} />;
      case 'palmares':     return <SectionPalmares     config={config} />;
      case 'evenements':   return <SectionEvenements   config={config} setPage={handlePage} />;
      case 'avis':         return <SectionAvis         config={config} />;
      case 'abonnements':  return <SectionAbonnements  config={config} setPage={handlePage} />;
      case 'faq':          return <SectionFAQ          config={config} />;
      case 'contact':      return <SectionContact      config={config} />;
      default:             return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{getStyle(config)}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 70 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'cours-page'        && (<><SectionCours        config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'chevaux-page'      && (<><SectionChevaux      config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'instructeurs-page' && (<><SectionInstructeurs config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page'      && (<><SectionContact      config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}