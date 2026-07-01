// src/templates/TemplateStudioYoga.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Studio Yoga & Pilates
// Style : fond crème #faf9f6 / accent terracotta #c17f5a + vert sauge #6b8f71
// Typo : Cormorant Garamond (élégant serif) + Nunito Sans (corps)
// Effets WOW :
//   - Vague SVG respirante (inspiration/expiration animée)
//   - Silhouettes de poses yoga qui changent
//   - Particules flottantes douces
//   - Lotus SVG qui s'ouvre pétale par pétale
//   - Minuteur de respiration guidée 4-7-8
//   - Parallax doux au scroll
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import { useIsMobile } from '../hooks/useIsMobile';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface CoursYoga {
  titre: string;
  description: string;
  photo: string;
  style: string; // Hatha, Vinyasa, Pilates, Yin, etc.
  niveau: 'Tous niveaux' | 'Débutant' | 'Intermédiaire' | 'Avancé';
  duree: string;
  prix: string;
  horaires: string[];
  bienfaits: string[];
}

export interface ProfesseurYoga {
  nom: string;
  titre: string;
  specialite: string;
  bio: string;
  photo: string;
  certifications: string[];
  annees: number;
  citation: string;
}

export interface AvisYoga {
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
  couleur?: string;
}

export interface ConfigStudioYoga {
  // Identité
  nomStudio: string;
  tagline: string;
  sousTagline: string;
  descriptionHero: string;
  descriptionAPropos: string;
  citationPhilosophie: string;
  auteurCitation: string;

  // Couleurs
  couleurFond: string;       // #faf9f6
  couleurTerre: string;      // #c17f5a terracotta
  couleurSauge: string;      // #6b8f71 vert sauge
  couleurCreme: string;      // #f0ebe0 crème foncé
  couleurTexte: string;      // #2d2926
  couleurFondSombre: string; // #1c1f1a nuit

  // Photos
  photoHero: string;
  photoAPropos1: string;
  photoAPropos2: string;
  photoAtmosphere: string;
  photoProfesseurs: string;

  // Stats
  stats: { valeur: string; label: string; icone: string }[];

  // Cours
  cours: CoursYoga[];

  // Professeurs
  professeurs: ProfesseurYoga[];

  // Avis
  avis: AvisYoga[];

  // Abonnements
  abonnements: FormulaireAbonnement[];

  // Horaires studio
  horairesStudio: { jour: string; horaires: string[] }[];

  // FAQ
  faq: { question: string; reponse: string }[];

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  reseaux: { instagram?: string; facebook?: string; youtube?: string };
  coordGoogleMaps: string;

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_YOGA_DEFAUT: ConfigStudioYoga = {
  nomStudio: 'Studio Lumière',
  tagline: 'Respirez.',
  sousTagline: 'Transformez-vous.',
  descriptionHero: 'Un sanctuaire dédié au bien-être, au mouvement conscient et à la paix intérieure. Découvrez le yoga et le Pilates dans une atmosphère chaleureuse et bienveillante.',
  descriptionAPropos: 'Studio Lumière est né d\'une vision simple : créer un espace où chaque individu peut explorer son corps, calmer son esprit et retrouver son équilibre. Depuis 2018, nous guidons des centaines de personnes sur leur chemin de transformation.',
  citationPhilosophie: 'Le yoga n\'est pas une pratique de plus dans votre vie — c\'est la pratique qui transforme toute votre vie.',
  auteurCitation: 'Patanjali',

  couleurFond: '#faf9f6',
  couleurTerre: '#c17f5a',
  couleurSauge: '#6b8f71',
  couleurCreme: '#f0ebe0',
  couleurTexte: '#2d2926',
  couleurFondSombre: '#1c1f1a',

  photoHero: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/3822668/pexels-photo-3822668.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos2: 'https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAtmosphere: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoProfesseurs: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=900',

  stats: [
    { valeur: '850+', label: 'Membres actifs',    icone: '🧘' },
    { valeur: '24',   label: 'Cours par semaine', icone: '📅' },
    { valeur: '6',    label: 'Professeurs certifiés', icone: '⭐' },
    { valeur: '98%',  label: 'Satisfaction',      icone: '❤️' },
  ],

  cours: [
    {
      titre: 'Hatha Yoga — L\'Éveil',
      description: 'Le fondement de toute pratique yoga. Postures statiques, alignement précis et respiration consciente pour un équilibre corps-esprit profond.',
      photo: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800',
      style: 'Hatha',
      niveau: 'Tous niveaux',
      duree: '75 min',
      prix: '22$',
      horaires: ['Lun 8h00', 'Mer 12h00', 'Sam 9h00'],
      bienfaits: ['Flexibilité', 'Concentration', 'Réduction du stress', 'Posture'],
    },
    {
      titre: 'Vinyasa Flow',
      description: 'Une danse fluide entre le souffle et le mouvement. Enchaînements dynamiques synchronisés avec la respiration pour un effet méditation en mouvement.',
      photo: 'https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800',
      style: 'Vinyasa',
      niveau: 'Intermédiaire',
      duree: '60 min',
      prix: '24$',
      horaires: ['Mar 7h00', 'Jeu 18h30', 'Sam 10h30'],
      bienfaits: ['Cardio doux', 'Force', 'Fluidité', 'Énergie'],
    },
    {
      titre: 'Pilates Mat & Réforme',
      description: 'Renforcement profond du centre de gravité — le "core". Travail de précision sur la posture, la stabilité et la conscience corporelle.',
      photo: 'https://images.pexels.com/photos/3822668/pexels-photo-3822668.jpeg?auto=compress&cs=tinysrgb&w=800',
      style: 'Pilates',
      niveau: 'Tous niveaux',
      duree: '55 min',
      prix: '26$',
      horaires: ['Lun 17h30', 'Mer 9h00', 'Ven 12h00'],
      bienfaits: ['Gainage', 'Dos fort', 'Tonicité', 'Équilibre'],
    },
    {
      titre: 'Yin & Restauratif',
      description: 'Le yoga des fascias et du lâcher-prise. Poses tenues 3-5 minutes dans une douceur absolue pour libérer les tensions profondes et retrouver le calme.',
      photo: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800',
      style: 'Yin',
      niveau: 'Tous niveaux',
      duree: '90 min',
      prix: '22$',
      horaires: ['Mer 20h00', 'Dim 16h00'],
      bienfaits: ['Récupération', 'Souplesse', 'Sommeil', 'Sérénité'],
    },
  ],

  professeurs: [
    {
      nom: 'Sophie Beaumont',
      titre: 'Fondatrice & Professeure Senior',
      specialite: 'Hatha & Méditation',
      bio: 'Formée en Inde à l\'Ananda Ashram avec 15 ans de pratique, Sophie a co-fondé Studio Lumière pour partager la sagesse du yoga authentique. Ses cours sont réputés pour leur profondeur et leur bienveillance.',
      photo: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400',
      certifications: ['RYT-500 Yoga Alliance', 'Méditation MBSR', 'Yoga Thérapeutique'],
      annees: 15,
      citation: 'Chaque respiration est une opportunité de recommencer.',
    },
    {
      nom: 'Marc-Antoine Leblanc',
      titre: 'Professeur Vinyasa & Pilates',
      specialite: 'Vinyasa Flow & Core Work',
      bio: 'Ancien danseur de ballet reconverti en professeur de yoga, Marc-Antoine apporte une approche artistique unique au Vinyasa. Ses classes dynamiques sont parmi les plus demandées du studio.',
      photo: 'https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=400',
      certifications: ['RYT-300 Vinyasa', 'Pilates BASI', 'Fascia Yoga'],
      annees: 8,
      citation: 'Le mouvement est une prière du corps.',
    },
    {
      nom: 'Camille Fontaine',
      titre: 'Professeure Yin & Bien-être',
      specialite: 'Yin Yoga & Méditation Nidra',
      bio: 'Diplômée en kinésiologie et en yoga thérapeutique, Camille allie expertise corporelle et sensibilité intuitive. Ses séances de Yin laissent un état de paix rare.',
      photo: 'https://images.pexels.com/photos/3822668/pexels-photo-3822668.jpeg?auto=compress&cs=tinysrgb&w=400',
      certifications: ['RYT-200 Yin Yoga', 'Yoga Nidra', 'Kinésiologie'],
      annees: 6,
      citation: 'Dans le silence, on entend ce qui compte vraiment.',
    },
  ],

  avis: [
    { texte: 'J\'ai commencé le yoga pour le mal de dos et je suis restée pour la transformation totale. Sophie est une guide extraordinaire — bienveillante, précise et inspirante. Studio Lumière est devenu mon sanctuaire hebdomadaire.', auteur: 'Isabelle Tremblay', cours: 'Hatha Yoga', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 2 ans' },
    { texte: 'Les cours de Pilates de Marc-Antoine m\'ont transformé physiquement. Après 3 mois, j\'ai un gainage que je n\'aurais jamais cru possible. Et l\'ambiance est tellement douce et sans jugement!', auteur: 'Jean-François Roy', cours: 'Pilates Mat', photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 8 mois' },
    { texte: 'Le Yin Yoga de Camille le dimanche soir est mon rituel le plus précieux. Je ressors chaque fois comme si j\'avais fait un reset complet. Impossible d\'imaginer ma semaine sans ça maintenant.', auteur: 'Audrey Lafleur', cours: 'Yin & Restauratif', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 3 ans' },
    { texte: 'En tant que débutante absolue, j\'avais peur d\'être perdue. Dès le premier cours, j\'ai été guidée avec tellement de gentillesse. 6 mois plus tard, je pratique 4 fois par semaine!', auteur: 'Marie-Claude Gagnon', cours: 'Hatha Yoga', photo: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5, depuis: 'Membre depuis 6 mois' },
  ],

  abonnements: [
    {
      nom: 'Découverte',
      prix: '29$',
      periode: '/ mois',
      description: 'Parfait pour commencer votre voyage. 4 cours par mois pour explorer à votre rythme.',
      inclus: ['4 cours au choix / mois', 'Accès application mobile', 'Tapis fourni en studio', 'Cours d\'introduction offert'],
      populaire: false,
    },
    {
      nom: 'Équilibre',
      prix: '89$',
      periode: '/ mois',
      description: 'Notre formule la plus populaire. Pratiquez autant que vous le souhaitez.',
      inclus: ['Cours illimités', 'Priorité réservation', 'Accès contenu vidéo', 'Atelier mensuel inclus', 'Réduction boutique 10%', '1 invité / mois'],
      populaire: true,
    },
    {
      nom: 'Lumière',
      prix: '149$',
      periode: '/ mois',
      description: 'L\'expérience complète pour une transformation profonde et durable.',
      inclus: ['Cours illimités + privés', 'Séance privée 1h / mois', 'Retraite annuelle incluse', 'Massage mensuel 30 min', 'Accès médithèque complet', 'Priorité absolue + invités illimités'],
      populaire: false,
    },
  ],

  horairesStudio: [
    { jour: 'Lundi',    horaires: ['7h00 Vinyasa', '8h00 Hatha', '12h00 Pilates', '17h30 Pilates', '19h00 Yin'] },
    { jour: 'Mardi',    horaires: ['7h00 Vinyasa', '10h00 Hatha débutant', '18h30 Hatha'] },
    { jour: 'Mercredi', horaires: ['9h00 Pilates', '12h00 Hatha', '18h00 Vinyasa', '20h00 Yin'] },
    { jour: 'Jeudi',    horaires: ['7h00 Hatha', '18h30 Vinyasa', '19h30 Méditation'] },
    { jour: 'Vendredi', horaires: ['8h00 Vinyasa', '12h00 Pilates', '17h00 Yin doux'] },
    { jour: 'Samedi',   horaires: ['9h00 Hatha', '10h30 Vinyasa', '12h00 Pilates', '14h00 Atelier'] },
    { jour: 'Dimanche', horaires: ['10h00 Hatha doux', '16h00 Yin & Restauratif'] },
  ],

  faq: [
    { question: 'Dois-je être flexible pour commencer le yoga?', reponse: 'Absolument pas! Le yoga est justement là pour développer votre flexibilité, pas le contraire. Nos professeurs adaptent chaque posture à votre corps d\'aujourd\'hui. Venez exactement comme vous êtes.' },
    { question: 'Quelle est la différence entre yoga et Pilates?', reponse: 'Le yoga est une pratique millénaire qui unit corps, souffle et esprit avec une dimension philosophique. Le Pilates est une méthode moderne (années 1920) centrée sur le renforcement du centre du corps ("core"). Les deux se complètent merveilleusement bien!' },
    { question: 'Que dois-je apporter à mon premier cours?', reponse: 'Juste vous-même et des vêtements confortables! Nous fournissons les tapis, les blocs et les sangles. Évitez de manger dans les 2h avant le cours. Arrivez 10 minutes en avance pour votre premier cours — nous adorons accueillir les nouveaux membres!' },
    { question: 'Puis-je essayer avant de m\'abonner?', reponse: 'Oui! Nous offrons un cours d\'essai à 15$ pour que vous puissiez ressentir l\'ambiance et trouver le cours qui vous convient. Beaucoup de nos membres fidèles ont commencé par cet essai.' },
    { question: 'Y a-t-il des cours adaptés aux blessures ou conditions particulières?', reponse: 'Oui! Notre programme de Yoga Thérapeutique est spécialement conçu pour les douleurs au dos, les blessures sportives et les conditions comme l\'arthrite. Contactez-nous pour une consultation gratuite de 15 minutes avec Sophie.' },
  ],

  adresse: '225 avenue Laurier Ouest',
  ville: 'Montréal, QC H2T 2N8',
  telephone: '(514) 555-0244',
  email: 'bonjour@studiolumiere.ca',
  reseaux: { instagram: '#', facebook: '#', youtube: '#' },
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',

  sections: [
    { id: 'hero',        actif: true, ordre: 1,  label: 'Hero + Vague respirante'   },
    { id: 'respiration', actif: true, ordre: 2,  label: 'Minuteur de respiration'   },
    { id: 'stats',       actif: true, ordre: 3,  label: 'Chiffres clés'             },
    { id: 'cours',       actif: true, ordre: 4,  label: 'Nos cours'                 },
    { id: 'lotus',       actif: true, ordre: 5,  label: 'Lotus & Philosophie'       },
    { id: 'apropos',     actif: true, ordre: 6,  label: 'À propos du studio'        },
    { id: 'professeurs', actif: true, ordre: 7,  label: 'Nos professeurs'           },
    { id: 'avis',        actif: true, ordre: 8,  label: 'Témoignages'               },
    { id: 'abonnements', actif: true, ordre: 9,  label: 'Abonnements'               },
    { id: 'horaires',    actif: true, ordre: 10, label: 'Horaires du studio'        },
    { id: 'faq',         actif: true, ordre: 11, label: 'FAQ'                       },
    { id: 'contact',     actif: true, ordre: 12, label: 'Contact & Réservation'     },
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

const getStyle = (c: ConfigStudioYoga) => `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Nunito+Sans:wght@300;400;600;700&family=Dancing+Script:wght@600;700&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }

/* Animations */
@keyframes breatheIn  { 0%,100%{d:path("M0 60 Q180 60 360 60 Q540 60 720 60 Q900 60 1080 60 Q1260 60 1440 60")} 50%{d:path("M0 60 Q180 20 360 60 Q540 100 720 60 Q900 20 1080 60 Q1260 100 1440 60")} }
@keyframes wavePath   {
  0%   { d: path("M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60"); }
  50%  { d: path("M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60"); }
  100% { d: path("M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60"); }
}
@keyframes floatParticle { 0%,100%{transform:translateY(0) translateX(0);opacity:.4} 33%{transform:translateY(-18px) translateX(8px);opacity:.8} 66%{transform:translateY(-8px) translateX(-6px);opacity:.5} }
@keyframes poseChange   { 0%,85%{opacity:1} 90%,100%{opacity:0} }
@keyframes poseEnter    { 0%{opacity:0;transform:scale(.94)} 15%,85%{opacity:1;transform:scale(1)} 100%{opacity:0} }
@keyframes petalOpen    { from{transform:rotate(var(--r)) scaleY(0) translateY(-30px);opacity:0} to{transform:rotate(var(--r)) scaleY(1) translateY(-30px);opacity:1} }
@keyframes lotusGlow    { 0%,100%{filter:drop-shadow(0 0 8px ${c.couleurTerre}60)} 50%{filter:drop-shadow(0 0 22px ${c.couleurTerre}aa)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
@keyframes fadeUpD{ from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
@keyframes parallaxBg { from{background-position:center 0} to{background-position:center -80px} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes pulse { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.04);opacity:1} }
@keyframes breathCircle { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.35);opacity:1} }
@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

.rv  { opacity:0;transform:translateY(36px);transition:opacity .9s ease,transform .9s ease; }
.rv.vis { opacity:1;transform:translateY(0); }
.rv-l{ opacity:0;transform:translateX(-44px);transition:opacity .9s ease,transform .9s ease; }
.rv-l.vis { opacity:1;transform:translateX(0); }
.rv-r{ opacity:0;transform:translateX(44px);transition:opacity .9s ease,transform .9s ease; }
.rv-r.vis { opacity:1;transform:translateX(0); }

.btn-terre {
  background:${c.couleurTerre}; color:#fff; border:none; padding:14px 38px;
  font-family:'Nunito Sans',sans-serif; font-size:13px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; cursor:pointer;
  border-radius:50px; transition:filter .25s, transform .2s, box-shadow .3s;
  box-shadow:0 4px 24px ${c.couleurTerre}40;
}
.btn-terre:hover { filter:brightness(1.12); transform:translateY(-2px); box-shadow:0 8px 32px ${c.couleurTerre}60; }

.btn-sauge-outline {
  background:transparent; color:${c.couleurSauge}; border:1.5px solid ${c.couleurSauge};
  padding:13px 36px; font-family:'Nunito Sans',sans-serif; font-size:13px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; cursor:pointer;
  border-radius:50px; transition:all .25s;
}
.btn-sauge-outline:hover { background:${c.couleurSauge}15; transform:translateY(-2px); }

.nav-y {
  font-family:'Nunito Sans',sans-serif; font-size:12px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); cursor:pointer; background:none; border:none;
  transition:color .2s;
}
.nav-y:hover,.nav-y.active { color:${c.couleurTerre}; }

.cours-card { transition:transform .4s,box-shadow .4s; overflow:hidden; cursor:default; }
.cours-card:hover { transform:translateY(-8px); box-shadow:0 24px 60px rgba(0,0,0,.12); }
.cours-card img { transition:transform .7s; }
.cours-card:hover img { transform:scale(1.06); }

.faq-btn {
  width:100%; background:none; border:none; cursor:pointer; padding:20px 0;
  display:flex; justify-content:space-between; align-items:center;
  font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:500;
  color:${c.couleurTexte}; text-align:left; border-bottom:1px solid rgba(0,0,0,.07); transition:color .2s;
}
.faq-btn:hover { color:${c.couleurTerre}; }

.fw-inp {
  width:100%; padding:13px 16px; background:${c.couleurCreme};
  border:none; border-bottom:1.5px solid rgba(0,0,0,.15);
  color:${c.couleurTexte}; font-family:'Nunito Sans',sans-serif; font-size:14px;
  outline:none; box-sizing:border-box; transition:border-color .2s; border-radius:0;
}
.fw-inp:focus { border-bottom-color:${c.couleurTerre}; }
.fw-inp::placeholder { color:rgba(0,0,0,.35); }
`;

// ─── VAGUE RESPIRANTE SVG ─────────────────────────────────────────────────────

function VagueRespirante({ couleur, opacity = 0.5, vitesse = 4 }: { couleur: string; opacity?: number; vitesse?: number }) {
  return (
    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block' }}>
      <path
        d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60"
        fill="none" stroke={couleur} strokeWidth="2.5" opacity={opacity}
        style={{ animation: `wavePath ${vitesse}s ease-in-out infinite` }}
      />
      <path
        d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60"
        fill="none" stroke={couleur} strokeWidth="1.5" opacity={opacity * 0.5}
        style={{ animation: `wavePath ${vitesse * 1.3}s ease-in-out infinite reverse` }}
      />
    </svg>
  );
}

// ─── PARTICULES FLOTTANTES ────────────────────────────────────────────────────

function Particules({ couleur1, couleur2 }: { couleur1: string; couleur2: string }) {
  const particules = Array.from({ length: 18 }, (_, i) => ({
    x: 5 + (i * 5.5) % 90,
    y: 5 + (i * 7.3) % 90,
    r: 3 + (i % 4) * 2,
    delay: i * 0.4,
    duree: 4 + (i % 3) * 2,
    couleur: i % 2 === 0 ? couleur1 : couleur2,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particules.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.r * 2, height: p.r * 2,
          borderRadius: '50%',
          background: p.couleur,
          opacity: 0.4,
          animation: `floatParticle ${p.duree}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── SILHOUETTES POSES YOGA ───────────────────────────────────────────────────

function SilhouettesPoses({ couleur }: { couleur: string }) {
  const poses = [
    // Pose de l'arbre (Vrksasana)
    <svg key="arbre" viewBox="0 0 120 200" width="120" height="200" fill={couleur} opacity={0.7}>
      <circle cx="60" cy="22" r="14" /> {/* tête */}
      <rect x="54" y="38" width="12" height="50" rx="6" /> {/* corps */}
      <path d="M66 55 Q90 45 95 65 Q88 70 72 65" /> {/* bras droit */}
      <path d="M54 55 Q30 45 25 65 Q32 70 48 65" /> {/* bras gauche */}
      <rect x="54" y="88" width="10" height="55" rx="5" /> {/* jambe gauche (en bas) */}
      <path d="M62 105 Q85 95 90 115 Q80 118 62 112" /> {/* jambe droite levée */}
    </svg>,
    // Guerrier II (Virabhadrasana)
    <svg key="guerrier" viewBox="0 0 180 200" width="180" height="200" fill={couleur} opacity={0.7}>
      <circle cx="90" cy="22" r="14" />
      <rect x="82" y="38" width="14" height="45" rx="6" />
      <rect x="10" y="68" width="80" height="10" rx="5" /> {/* bras gauche */}
      <rect x="96" y="68" width="74" height="10" rx="5" /> {/* bras droit */}
      <path d="M82 83 L55 180 Q50 182 48 178 L72 85" /> {/* jambe gauche */}
      <path d="M96 83 L120 180 Q125 182 127 178 L104 85" /> {/* jambe droite */}
    </svg>,
    // Lotus (Padmasana)
    <svg key="lotus" viewBox="0 0 160 180" width="160" height="180" fill={couleur} opacity={0.7}>
      <circle cx="80" cy="22" r="14" />
      <rect x="72" y="38" width="14" height="42" rx="6" />
      <ellipse cx="80" cy="130" rx="60" ry="25" /> {/* corps en lotus */}
      <path d="M80 80 Q50 60 30 75 Q35 90 55 85" /> {/* bras gauche */}
      <path d="M80 80 Q110 60 130 75 Q125 90 105 85" /> {/* bras droit */}
    </svg>,
    // Chien tête en bas (Adho Mukha)
    <svg key="chien" viewBox="0 0 200 180" width="200" height="180" fill={couleur} opacity={0.7}>
      <circle cx="30" cy="50" r="14" />
      <path d="M40 55 Q80 20 140 20 L145 32 Q85 32 52 65Z" /> {/* corps */}
      <rect x="140" y="20" width="12" height="60" rx="6" transform="rotate(15 146 20)" /> {/* jambe droite */}
      <rect x="122" y="22" width="12" height="60" rx="6" transform="rotate(10 128 22)" /> {/* jambe gauche */}
      <rect x="18" y="60" width="11" height="55" rx="5" transform="rotate(-20 23 60)" /> {/* bras gauche */}
      <rect x="36" y="58" width="11" height="50" rx="5" transform="rotate(-15 41 58)" /> {/* bras droit */}
    </svg>,
  ];

  const [poseCourante, setPoseCourante] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPoseCourante(p => (p + 1) % poses.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {poses.map((pose, i) => (
        <div key={i} style={{
          position: 'absolute',
          opacity: i === poseCourante ? 1 : 0,
          transform: i === poseCourante ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 1s ease, transform 1s ease',
          filter: `drop-shadow(0 0 16px ${couleur}50)`,
        }}>
          {pose}
        </div>
      ))}
    </div>
  );
}

// ─── LOTUS SVG ANIMÉ ─────────────────────────────────────────────────────────

function LotusAnime({ couleur, taille = 180, vis }: { couleur: string; taille?: number; vis: boolean }) {
  const petales = 8;
  return (
    <svg width={taille} height={taille} viewBox="-100 -100 200 200"
      style={{ animation: vis ? `lotusGlow 3s ease-in-out infinite` : 'none', overflow: 'visible' }}>
      {Array.from({ length: petales }, (_, i) => {
        const angle = (i / petales) * 360;
        const delai = vis ? i * 0.15 : 0;
        return (
          <ellipse
            key={i}
            cx="0" cy="-45"
            rx="16" ry="38"
            fill={`${couleur}${i % 2 === 0 ? 'cc' : '88'}`}
            stroke={couleur} strokeWidth="0.5"
            style={{
              transformOrigin: '0 0',
              transform: `rotate(${angle}deg)`,
              transformBox: 'fill-box',
              animation: vis ? `petalOpen .8s ${delai}s cubic-bezier(.34,1.56,.64,1) both` : 'none',
              ['--r' as any]: `${angle}deg`,
            }}
          />
        );
      })}
      {/* Centre */}
      <circle cx="0" cy="0" r="18" fill={couleur} opacity="0.9" />
      <circle cx="0" cy="0" r="10" fill="#fff" opacity="0.6" />
      <circle cx="0" cy="0" r="4"  fill={couleur} />
    </svg>
  );
}

// ─── MINUTEUR DE RESPIRATION ──────────────────────────────────────────────────

function MinuteurRespiration({ couleurTerre, couleurSauge }: { couleurTerre: string; couleurSauge: string }) {
  // Technique 4-7-8
  const phases = [
    { label: 'Inspirez',  duree: 4, couleur: couleurSauge,  instruction: 'Inspirez par le nez...' },
    { label: 'Retenez',   duree: 7, couleur: couleurTerre,  instruction: 'Retenez doucement...' },
    { label: 'Expirez',   duree: 8, couleur: '#8b7355',     instruction: 'Expirez lentement...' },
  ];

  const [actif, setActif] = useState(false);
  const [phase, setPhase] = useState(0);
  const [compteur, setCompteur] = useState(phases[0].duree);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!actif) return;
    intervalRef.current = setInterval(() => {
      setCompteur(prev => {
        if (prev <= 1) {
          setPhase(p => {
            const next = (p + 1) % phases.length;
            if (next === 0) setCycle(c => c + 1);
            setCompteur(phases[next].duree);
            return next;
          });
          return phases[(phase + 1) % phases.length].duree;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [actif, phase]);

  const handleToggle = () => {
    if (actif) { clearInterval(intervalRef.current); setActif(false); setPhase(0); setCompteur(phases[0].duree); setCycle(0); }
    else { setActif(true); }
  };

  const progress = 1 - (compteur / phases[phase].duree);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  return (
    <div style={{ textAlign: 'center', padding: '48px 40px' }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, fontWeight: 600, color: couleurTerre, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>
        Technique 4-7-8
      </p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
        Respiration guidée
      </h2>
      <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>
        Une technique ancestrale pour calmer le système nerveux en 2 minutes
      </p>

      {/* Cercle animé */}
      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Cercle de fond pulsant */}
        {actif && (
          <div style={{
            position: 'absolute', inset: -20,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${phases[phase].couleur}25, transparent)`,
            animation: `breathCircle ${phases[phase].duree}s ease-in-out`,
          }} />
        )}
        <svg width="160" height="160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle cx="80" cy="80" r="54" fill="none"
            stroke={phases[phase].couleur} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={actif ? dashOffset : circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            {compteur}
          </p>
          <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, color: phases[phase].couleur, fontWeight: 700, letterSpacing: '0.1em' }}>
            {actif ? phases[phase].label : 'PRÊT'}
          </p>
        </div>
      </div>

      {/* Instruction */}
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: 'rgba(255,255,255,0.7)', minHeight: 28, marginBottom: 24 }}>
        {actif ? phases[phase].instruction : 'Cliquez pour commencer...'}
      </p>

      {/* Cycles */}
      {cycle > 0 && (
        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, color: couleurTerre, marginBottom: 16 }}>
          ✓ {cycle} cycle{cycle > 1 ? 's' : ''} complété{cycle > 1 ? 's' : ''}
        </p>
      )}

      <button className="btn-terre" onClick={handleToggle} style={{ minWidth: 160 }}>
        {actif ? '⏸ Pause' : '▶ Commencer'}
      </button>

      {/* Phases */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28 }}>
        {phases.map((p, i) => (
          <div key={i} style={{ textAlign: 'center', opacity: !actif || i === phase ? 1 : 0.35, transition: 'opacity .4s' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.couleur, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.duree}</span>
            </div>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigStudioYoga; page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const ct = config.couleurTerre;
  const cf = config.couleurFondSombre;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [['accueil','Accueil'],['cours-page','Cours'],['professeurs-page','Professeurs'],['horaires-page','Horaires'],['contact-page','Contact']];

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:1000,
      background: scrolled ? `rgba(28,31,26,0.96)` : 'rgba(28,31,26,.85)',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      borderBottom: scrolled ? `1px solid ${ct}25` : 'none',
      transition:'all .4s', padding:'0 48px',
    }}>
      <div style={{ maxWidth:1320, margin:'0 auto', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {/* Logo */}
        <div onClick={() => setPage('accueil')} style={{ cursor:'pointer' }}>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:10, fontStyle:'italic', color:ct, letterSpacing:'0.3em', marginBottom:2 }}>Studio de bien-être</p>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:600, color:'#fff', letterSpacing:'0.06em', lineHeight:1 }}>{config.nomStudio}</p>
        </div>
        {/* Liens */}
        <div style={{ display:'flex', gap:32 }}>
          {liens.map(([id,label]) => (
            <button key={id} className={`nav-y${page===id?' active':''}`} onClick={() => setPage(id)}>{label}</button>
          ))}
        </div>
        {/* CTA */}
        <button className="btn-terre" onClick={() => setPage('contact-page')} style={{ padding:'10px 24px', fontSize:12 }}>
          Essai gratuit
        </button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigStudioYoga; setPage:(p:string)=>void }) {
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const cf = config.couleurFondSombre;

  return (
    <section style={{ background:cf, minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', paddingTop:68 }}>
      {/* Photo fond */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`url(${config.photoHero})`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.28)' }} />
      {/* Overlay gradient */}
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${cf}f0 0%, ${cf}80 50%, transparent 100%)` }} />

      {/* Particules flottantes */}
      <Particules couleur1={`${ct}60`} couleur2={`${cs}50`} />

      {/* Contenu */}
      <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'60px 48px', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          {/* Texte gauche */}
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:16, color:ct, letterSpacing:'0.1em', marginBottom:20, animation:'fadeUp .8s ease both' }}>
              ☽  Bienvenue au {config.nomStudio}
            </p>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(56px,9vw,120px)', fontWeight:300, color:'#fff', lineHeight:0.9, letterSpacing:'-0.01em', marginBottom:16, animation:'fadeUp .9s .1s ease both' }}>
              {config.tagline}<br />
              <em style={{ fontStyle:'italic', color:ct }}>{config.sousTagline}</em>
            </h1>
            <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:15, color:'rgba(255,255,255,.6)', lineHeight:1.9, maxWidth:460, marginBottom:40, animation:'fadeUp .9s .2s ease both' }}>
              {config.descriptionHero}
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', animation:'fadeUp .9s .3s ease both' }}>
              <button className="btn-terre" onClick={() => setPage('cours-page')}>Découvrir nos cours</button>
              <button className="btn-sauge-outline" onClick={() => setPage('contact-page')}>Essai gratuit</button>
            </div>
          </div>

          {/* Silhouettes poses droite */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <SilhouettesPoses couleur={ct} />
            {/* Citation */}
            <div style={{ textAlign:'center', maxWidth:320 }}>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,.55)', lineHeight:1.7, marginBottom:8 }}>
                "{config.citationPhilosophie}"
              </p>
              <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, color:ct, letterSpacing:'0.15em', textTransform:'uppercase' }}>
                — {config.auteurCitation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vague respirante bas */}
      <div style={{ position:'relative', zIndex:2 }}>
        <VagueRespirante couleur={ct} opacity={0.5} vitesse={5} />
        <VagueRespirante couleur={config.couleurSauge} opacity={0.3} vitesse={7} />
      </div>
    </section>
  );
}

// ─── SECTION RESPIRATION ──────────────────────────────────────────────────────

function SectionRespiration({ config }: { config: ConfigStudioYoga }) {
  const { isMobile } = useIsMobile();
  const cf = config.couleurFondSombre;
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;

  return (
    <section style={{ background: cf, padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
      <Particules couleur1={`${ct}40`} couleur2={`${cs}30`} />
      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
        <MinuteurRespiration couleurTerre={ct} couleurSauge={cs} />
      </div>
      <VagueRespirante couleur={ct} opacity={0.3} vitesse={6} />
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigStudioYoga }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const ct = config.couleurTerre;
  const stats = ea(config.stats, CONFIG_YOGA_DEFAUT.stats);

  return (
    <section style={{ background: config.couleurCreme, padding: isMobile ? '60px 20px' : '80px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, background:'rgba(0,0,0,.05)' }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:config.couleurCreme, padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12, animation:`pulse 3s ${i*.5}s ease-in-out infinite` }}>{s.icone}</div>
            <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(36px,4vw,56px)', fontWeight:600, color:ct, lineHeight:1, marginBottom:8 }}>{s.valeur}</p>
            <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:12, color:'rgba(0,0,0,.45)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION COURS ────────────────────────────────────────────────────────────

function SectionCours({ config, setPage }: { config: ConfigStudioYoga; setPage:(p:string)=>void }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const cours = ea(config.cours, CONFIG_YOGA_DEFAUT.cours);
  const [filtre, setFiltre] = useState('Tous');
  const styles = ['Tous', ...Array.from(new Set(cours.map(c => c.style)))];
  const filtres = filtre === 'Tous' ? cours : cours.filter(c => c.style === filtre);

  const niveauCouleur = (n: string) => {
    if (n === 'Débutant') return cs;
    if (n === 'Intermédiaire') return ct;
    if (n === 'Avancé') return '#8b5e3c';
    return config.couleurSauge;
  };

  return (
    <section style={{ background:config.couleurFond, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48 }}>
          <div>
            <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Nos Pratiques</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,60px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.1 }}>
              Trouvez votre <em style={{ fontStyle:'italic', color:ct }}>pratique idéale</em>
            </h2>
          </div>
          <button className="btn-sauge-outline" onClick={() => setPage('cours-page')}>Tous les cours →</button>
        </div>

        {/* Filtres style */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:36 }}>
          {styles.map(s => (
            <button key={s} onClick={() => setFiltre(s)} style={{ padding:'8px 20px', borderRadius:50, cursor:'pointer', fontFamily:"'Nunito Sans', sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.08em', transition:'all .2s', background:filtre===s ? ct : 'transparent', color:filtre===s ? '#fff' : config.couleurTexte, border:`1.5px solid ${filtre===s ? ct : 'rgba(0,0,0,.15)'}` }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
          {filtres.map((cours, i) => (
            <div key={i} className="cours-card" style={{ background:'#fff' }}>
              {/* Photo */}
              <div style={{ height:220, overflow:'hidden', position:'relative' }}>
                <img src={cours.photo} alt={cours.titre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                {/* Badge style */}
                <div style={{ position:'absolute', top:14, left:14, background:niveauCouleur(cours.niveau), color:'#fff', padding:'4px 12px', borderRadius:50, fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {cours.style}
                </div>
                {/* Prix */}
                <div style={{ position:'absolute', bottom:14, right:14, background:'rgba(255,255,255,.95)', color:ct, padding:'6px 14px', borderRadius:50, fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700 }}>
                  {cours.prix}
                </div>
                {/* Vague décorative bas photo */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0 }}>
                  <svg viewBox="0 0 400 30" style={{ display:'block', width:'100%' }}>
                    <path d="M0 20 Q100 5 200 20 Q300 35 400 20 L400 30 L0 30Z" fill="#fff" opacity="0.95" />
                  </svg>
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding:'20px 24px 28px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:niveauCouleur(cours.niveau), letterSpacing:'0.08em', textTransform:'uppercase' }}>{cours.niveau}</span>
                  <span style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, color:'rgba(0,0,0,.4)', fontWeight:600 }}>⏱ {cours.duree}</span>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:600, color:config.couleurTexte, marginBottom:10, lineHeight:1.3 }}>{cours.titre}</h3>
                <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color:'rgba(0,0,0,.55)', lineHeight:1.7, marginBottom:16 }}>{cours.description}</p>

                {/* Bienfaits */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                  {cours.bienfaits.map((b,j) => (
                    <span key={j} style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, padding:'3px 10px', background:`${cs}18`, border:`1px solid ${cs}30`, borderRadius:20, color:config.couleurTexte, fontWeight:700 }}>
                      ✦ {b}
                    </span>
                  ))}
                </div>

                {/* Horaires */}
                <div style={{ borderTop:`1px solid rgba(0,0,0,.06)`, paddingTop:12, marginBottom:16 }}>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Horaires</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {cours.horaires.map((h,j) => (
                      <span key={j} style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, padding:'2px 8px', background:`${ct}12`, borderRadius:4, color:ct, fontWeight:700 }}>{h}</span>
                    ))}
                  </div>
                </div>

                <button className="btn-terre" onClick={() => setPage('contact-page')} style={{ width:'100%', textAlign:'center', padding:'12px' }}>
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

// ─── SECTION LOTUS & PHILOSOPHIE ─────────────────────────────────────────────

function SectionLotus({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.15);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const cf = config.couleurFondSombre;

  return (
    <section style={{ background:cf, padding:'100px 48px', position:'relative', overflow:'hidden', textAlign:'center' }}>
      <Particules couleur1={`${ct}40`} couleur2={`${cs}30`} />

      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:700, margin:'0 auto', position:'relative' }}>
        {/* Lotus */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:36 }}>
          <LotusAnime couleur={ct} taille={160} vis={rv.vis} />
        </div>

        <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'clamp(20px,3vw,32px)', fontWeight:400, color:'rgba(255,255,255,.85)', lineHeight:1.7, marginBottom:24 }}>
          "{config.citationPhilosophie}"
        </p>
        <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:12, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:40 }}>
          — {config.auteurCitation}
        </p>

        <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:15, color:'rgba(255,255,255,.55)', lineHeight:1.9, marginBottom:36 }}>
          {config.descriptionAPropos}
        </p>

        <button className="btn-terre">Notre histoire →</button>
      </div>

      <div style={{ position:'absolute', bottom:0, left:0, right:0, opacity:0.3 }}>
        <VagueRespirante couleur={ct} opacity={0.5} vitesse={8} />
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigStudioYoga }) {
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;

  return (
    <section style={{ background:config.couleurFond, padding:'100px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
        {/* Photos mosaïque */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis?' vis':''}`} style={{ position:'relative' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ gridColumn:'1/3', height:280, overflow:'hidden', borderRadius:4 }}>
              <img src={config.photoAPropos1} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1)'} />
            </div>
            <div style={{ height:220, overflow:'hidden', borderRadius:4 }}>
              <img src={config.photoAPropos2} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1)'} />
            </div>
            <div style={{ height:220, overflow:'hidden', borderRadius:4, position:'relative' }}>
              <img src={config.photoAtmosphere} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1)'} />
              {/* Lotus décoratif */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(28,31,26,.45)' }}>
                <LotusAnime couleur="#fff" taille={80} vis={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Texte */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis?' vis':''}`}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:16 }}>Notre espace</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px,3.5vw,52px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.15, marginBottom:24 }}>
            Un sanctuaire pour<br /><em style={{ fontStyle:'italic', color:ct }}>votre transformation</em>
          </h2>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:15, color:'rgba(0,0,0,.6)', lineHeight:1.9, marginBottom:28 }}>
            {config.descriptionAPropos}
          </p>
          {/* Valeurs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:36 }}>
            {[['🌿','Authenticité','Pratiques fidèles aux traditions'],['🤍','Bienveillance','Espace sans jugement pour tous'],['🌅','Équilibre','Corps, esprit et âme'],['🌸','Communauté','Une famille qui vous soutient']].map(([ico,titre,desc]) => (
              <div key={titre} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{ico}</span>
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:15, fontWeight:600, color:config.couleurTexte, marginBottom:2 }}>{titre}</p>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, color:'rgba(0,0,0,.45)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-terre">Visiter le studio</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PROFESSEURS ──────────────────────────────────────────────────────

function SectionProfesseurs({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const profs = ea(config.professeurs, CONFIG_YOGA_DEFAUT.professeurs);
  const [actif, setActif] = useState<number|null>(null);

  return (
    <section style={{ background:config.couleurCreme, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Vos guides</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,60px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.1 }}>
            Des professeurs <em style={{ fontStyle:'italic', color:ct }}>passionnés</em>
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(profs.length,3)},1fr)`, gap:28 }}>
          {profs.map((prof, i) => (
            <div key={i} onClick={() => setActif(actif===i?null:i)} style={{
              background:'#fff', overflow:'hidden', cursor:'pointer',
              transition:'transform .4s,box-shadow .4s',
              boxShadow: actif===i ? `0 24px 60px ${ct}20` : 'none',
              transform: actif===i ? 'translateY(-6px)' : 'none',
            }}>
              {/* Photo */}
              <div style={{ height:320, overflow:'hidden', position:'relative' }}>
                <img src={prof.photo} alt={prof.nom} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'brightness(.85)', transition:'transform .6s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1)'} />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${config.couleurFondSombre}cc, transparent 50%)` }} />
                <div style={{ position:'absolute', bottom:20, left:20, right:20 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:600, color:'#fff', marginBottom:4 }}>{prof.nom}</p>
                  <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:13, color:ct }}>{prof.specialite}</p>
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding:'20px 24px' }}>
                <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{prof.titre}</p>
                <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color:'rgba(0,0,0,.55)', lineHeight:1.7, marginBottom:16 }}>{prof.bio}</p>

                {/* Bio étendue au clic */}
                <div style={{ maxHeight:actif===i?300:0, overflow:'hidden', transition:'max-height .4s ease' }}>
                  {/* Citation */}
                  <blockquote style={{ borderLeft:`3px solid ${ct}`, paddingLeft:16, marginBottom:14 }}>
                    <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:16, color:ct, lineHeight:1.5 }}>"{prof.citation}"</p>
                  </blockquote>
                  {/* Certifications */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {prof.certifications.map((cert,j) => (
                      <span key={j} style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, padding:'3px 10px', background:`${cs}20`, border:`1px solid ${cs}40`, borderRadius:20, color:config.couleurTexte, fontWeight:700 }}>
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:12, color:ct, fontSize:11, fontFamily:"'Nunito Sans', sans-serif", fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                  {actif===i ? '↑ Masquer' : `${prof.annees} ans d'expérience — En savoir plus ↓`}
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

function SectionAvis({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const avis = ea(config.avis, CONFIG_YOGA_DEFAUT.avis);

  return (
    <section style={{ background:config.couleurFond, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Témoignages</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,60px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.1 }}>
            Ce qu'ils ont <em style={{ fontStyle:'italic', color:ct }}>ressenti</em>
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
          {avis.map((a,i) => (
            <div key={i} style={{ background:config.couleurCreme, padding:'28px 24px', borderRadius:4, borderTop:`3px solid ${ct}`, transition:'transform .3s,box-shadow .3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 48px rgba(0,0,0,.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}>
              <div style={{ fontSize:32, color:ct, opacity:.2, lineHeight:1, marginBottom:6, fontFamily:"'Cormorant Garamond', serif" }}>"</div>
              <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color:'rgba(0,0,0,.65)', lineHeight:1.8, marginBottom:20, fontStyle:'italic' }}>{a.texte}</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:`2px solid ${ct}40` }} />
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:16, fontWeight:600, color:config.couleurTexte }}>{a.auteur}</p>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, color:ct, fontWeight:700 }}>{a.cours}</p>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, color:'rgba(0,0,0,.35)' }}>{a.depuis}</p>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:2 }}>
                  {[...Array(a.note)].map((_,j) => <span key={j} style={{ color:ct, fontSize:13 }}>★</span>)}
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

function SectionAbonnements({ config, setPage }: { config:ConfigStudioYoga; setPage:(p:string)=>void }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const cf = config.couleurFondSombre;
  const abonnements = ea(config.abonnements, CONFIG_YOGA_DEFAUT.abonnements);

  return (
    <section style={{ background:cf, padding:'100px 48px', position:'relative', overflow:'hidden' }}>
      <Particules couleur1={`${ct}30`} couleur2={`${cs}25`} />
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Abonnements</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,60px)', fontWeight:500, color:'#fff', letterSpacing:'-0.01em', lineHeight:1.1 }}>
            Votre <em style={{ fontStyle:'italic', color:ct }}>pratique</em> au quotidien
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(abonnements.length,3)},1fr)`, gap:20, alignItems:'start' }}>
          {abonnements.map((a,i) => (
            <div key={i} style={{
              background: a.populaire ? config.couleurCreme : 'rgba(255,255,255,.05)',
              border:`1.5px solid ${a.populaire ? ct : 'rgba(255,255,255,.1)'}`,
              padding:'36px 28px', borderRadius:4, position:'relative',
              transform: a.populaire ? 'scale(1.04)' : 'none',
            }}>
              {a.populaire && (
                <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:ct, color:'#fff', fontSize:10, fontWeight:800, fontFamily:"'Nunito Sans', sans-serif", padding:'4px 20px', borderRadius:50, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                  LE PLUS POPULAIRE ✦
                </div>
              )}
              {/* Lotus décoratif */}
              <div style={{ position:'absolute', top:16, right:16, opacity:.15 }}>
                <LotusAnime couleur={ct} taille={60} vis={true} />
              </div>

              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:14, color: a.populaire ? ct : 'rgba(255,255,255,.5)', marginBottom:10 }}>Formule</p>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color: a.populaire ? config.couleurTexte : '#fff', marginBottom:8 }}>{a.nom}</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:52, fontWeight:600, color: a.populaire ? ct : ct, lineHeight:1 }}>{a.prix}</span>
                <span style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color: a.populaire ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.4)' }}>{a.periode}</span>
              </div>
              <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color: a.populaire ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.5)', marginBottom:24, lineHeight:1.6 }}>{a.description}</p>
              <div style={{ height:1, background: a.populaire ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.1)', marginBottom:20 }} />
              <ul style={{ listStyle:'none', marginBottom:28 }}>
                {a.inclus.map((item,j) => (
                  <li key={j} style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color: a.populaire ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.6)', marginBottom:10, display:'flex', gap:10 }}>
                    <span style={{ color:cs, flexShrink:0 }}>✦</span>{item}
                  </li>
                ))}
              </ul>
              {a.populaire
                ? <button className="btn-terre" onClick={() => setPage('contact-page')} style={{ width:'100%', textAlign:'center', padding:'14px' }}>Commencer →</button>
                : <button className="btn-sauge-outline" onClick={() => setPage('contact-page')} style={{ width:'100%', textAlign:'center', padding:'13px', color:'rgba(255,255,255,.75)', borderColor:'rgba(255,255,255,.2)' }}>Sélectionner →</button>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION HORAIRES ─────────────────────────────────────────────────────────

function SectionHoraires({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const horaires = ea(config.horairesStudio, CONFIG_YOGA_DEFAUT.horairesStudio);
  const [jourActif, setJourActif] = useState(0);

  const jourEnCours = horaires[jourActif];

  return (
    <section style={{ background:config.couleurCreme, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Planning</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,60px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.1 }}>
            Horaires du <em style={{ fontStyle:'italic', color:ct }}>studio</em>
          </h2>
        </div>

        {/* Onglets jours */}
        <div style={{ display:'flex', gap:0, marginBottom:32, flexWrap:'wrap', borderBottom:`2px solid rgba(0,0,0,.08)` }}>
          {horaires.map((h,i) => (
            <button key={i} onClick={() => setJourActif(i)} style={{
              padding:'14px 20px', cursor:'pointer', fontFamily:"'Nunito Sans', sans-serif",
              fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              background:'transparent', color: i===jourActif ? ct : 'rgba(0,0,0,.35)',
              border:'none', borderBottom:`2px solid ${i===jourActif ? ct : 'transparent'}`,
              marginBottom:-2, transition:'all .2s',
            }}>
              {h.jour}
            </button>
          ))}
        </div>

        {/* Cours du jour */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16, minHeight:140 }}>
          {(jourEnCours?.horaires || []).map((cours,i) => {
            const [heure, ...nomParts] = cours.split(' ');
            const nomCours = nomParts.join(' ');
            return (
              <div key={i} style={{
                background:'#fff', padding:'20px 20px', borderLeft:`4px solid ${i%2===0?ct:cs}`,
                borderRadius:'0 4px 4px 0', transition:'transform .2s',
                animation:`fadeUpD .4s ${i*.08}s ease both`,
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform='translateX(4px)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform='none'}>
                <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:600, color:i%2===0?ct:cs, marginBottom:4 }}>{heure}</p>
                <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color:config.couleurTexte, fontWeight:700 }}>{nomCours}</p>
              </div>
            );
          })}
          {(jourEnCours?.horaires || []).length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'rgba(0,0,0,.3)', fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:20 }}>
              Journée de repos bien méritée ✦
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const faq = ea(config.faq, CONFIG_YOGA_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number|null>(null);

  return (
    <section style={{ background:config.couleurFond, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:860, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Questions fréquentes</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4.5vw,56px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.1 }}>
            Vos <em style={{ fontStyle:'italic', color:ct }}>questions</em>
          </h2>
        </div>
        <div>
          {faq.map((f,i) => (
            <div key={i}>
              <button className="faq-btn" onClick={() => setOuvert(ouvert===i?null:i)}>
                <span>{f.question}</span>
                <span style={{ color:ct, fontSize:22, flexShrink:0, transition:'transform .3s', transform:ouvert===i?'rotate(45deg)':'none' }}>+</span>
              </button>
              <div style={{ overflow:'hidden', maxHeight:ouvert===i?'300px':'0', transition:'max-height .45s ease' }}>
                <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:14, color:'rgba(0,0,0,.6)', lineHeight:1.9, paddingBottom:24, paddingTop:10 }}>{f.reponse}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigStudioYoga }) {
  const rv = useReveal(0.05);
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;

  const [form, setForm] = useState({ prenom:'', nom:'', email:'', telephone:'', cours:'', message:'' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ ...form, studio:config.nomStudio, type:'contact-yoga', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  const cours = ea(config.cours, CONFIG_YOGA_DEFAUT.cours);

  return (
    <section style={{ background:config.couleurCreme, padding:'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:80 }}>
          {/* Infos */}
          <div>
            <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:11, fontWeight:700, color:ct, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Nous rejoindre</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px,3.5vw,50px)', fontWeight:500, color:config.couleurTexte, letterSpacing:'-0.01em', lineHeight:1.15, marginBottom:32 }}>
              Commencez votre<br /><em style={{ fontStyle:'italic', color:ct }}>voyage</em>
            </h2>

            {[{i:'📍',l:'Adresse',v:`${config.adresse}, ${config.ville}`},{i:'📞',l:'Téléphone',v:config.telephone},{i:'✉️',l:'Courriel',v:config.email}].map((info,i) => (
              <div key={i} style={{ display:'flex', gap:14, marginBottom:20 }}>
                <span style={{ fontSize:20, flexShrink:0, marginTop:2 }}>{info.i}</span>
                <div>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:ct, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:3 }}>{info.l}</p>
                  <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:14, color:'rgba(0,0,0,.65)' }}>{info.v}</p>
                </div>
              </div>
            ))}

            {/* Carte Google Maps */}
            <div style={{ height:240, overflow:'hidden', borderRadius:4, marginTop:24, border:`1px solid ${ct}20` }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border:0, display:'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localisation" />
            </div>

            {/* Réseaux */}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              {[['instagram','📸'],['facebook','📘'],['youtube','📺']].map(([k,ico]) =>
                config.reseaux?.[k as keyof typeof config.reseaux] ? (
                  <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                    style={{ width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,.06)', border:`1px solid ${ct}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none', transition:'all .2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor=ct}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor=`${ct}25`}>{ico}</a>
                ) : null
              )}
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background:'#fff', padding:'40px 36px', borderTop:`4px solid ${ct}` }}>
            {envoye ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <LotusAnime couleur={ct} taille={100} vis={true} />
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:config.couleurTexte, marginTop:20, marginBottom:12 }}>Message envoyé ✦</h3>
                <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:20, color:ct }}>À très bientôt sur le tapis!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:600, color:config.couleurTexte, marginBottom:8 }}>Réserver ou nous contacter</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.4)', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Prénom *</label>
                    <input className="fw-inp" value={form.prenom} onChange={e => setForm({...form, prenom:e.target.value})} placeholder="Prénom" />
                  </div>
                  <div>
                    <label style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.4)', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Nom *</label>
                    <input className="fw-inp" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} placeholder="Nom" />
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.4)', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Email *</label>
                  <input type="email" className="fw-inp" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="votre@email.ca" />
                </div>
                <div>
                  <label style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.4)', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Cours d'intérêt</label>
                  <select className="fw-inp" value={form.cours} onChange={e => setForm({...form, cours:e.target.value})} style={{ cursor:'pointer' }}>
                    <option value="">Choisir un cours...</option>
                    {cours.map((c,i) => <option key={i} value={c.titre}>{c.titre} — {c.prix}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:'rgba(0,0,0,.4)', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Message</label>
                  <textarea className="fw-inp" rows={4} value={form.message} onChange={e => setForm({...form, message:e.target.value})} placeholder="Parlez-nous de votre pratique, vos objectifs, vos questions..." style={{ resize:'none' }} />
                </div>
              <button disabled={loading || !form.prenom || !form.email}
                  style={{ opacity:!form.prenom || !form.email ? .5 : 1, textAlign:'center', padding:'16px' }}>
                  {loading ? '🌸 Envoi...' : '🧘 Envoyer & Commencer mon voyage'}
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

function Footer({ config, setPage }: { config:ConfigStudioYoga; setPage:(p:string)=>void }) {
  const ct = config.couleurTerre;
  const cs = config.couleurSauge;
  const cf = config.couleurFondSombre;

  return (
    <footer style={{ background:'#111512', borderTop:`1px solid ${ct}20`, padding:'60px 48px 24px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48 }}>
        <div>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:10, color:ct, letterSpacing:'0.3em', marginBottom:4 }}>Studio de bien-être</p>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:600, color:'#fff', marginBottom:14 }}>{config.nomStudio}</p>
          <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:18, color:ct, marginBottom:20 }}>"{config.citationPhilosophie.slice(0,50)}..."</p>
          <div style={{ display:'flex', gap:10 }}>
            {[['instagram','📸'],['facebook','📘'],['youtube','📺']].map(([k,ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width:36, height:36, background:'rgba(255,255,255,.05)', border:`1px solid ${ct}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, textDecoration:'none', borderRadius:'50%', transition:'all .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor=ct}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor=`${ct}20`}>{ico}</a>
              ) : null
            )}
          </div>
        </div>
        {[
          { titre:'Navigation', liens:[['accueil','Accueil'],['cours-page','Cours'],['professeurs-page','Professeurs'],['horaires-page','Horaires'],['contact-page','Contact']] },
          { titre:'Pratiques',  liens:ea(config.cours,CONFIG_YOGA_DEFAUT.cours).slice(0,4).map(c=>[c.style,c.titre]) },
          { titre:'Contact',    liens:[[config.email,''],[ config.telephone,''],[ `${config.adresse}, ${config.ville}`,'']] },
        ].map((col,ci) => (
          <div key={ci}>
            <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:10, fontWeight:700, color:ct, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>{col.titre}</p>
            {col.liens.map(([id,label],j) => (
              <p key={j} onClick={label ? () => setPage(id) : undefined} style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:7, cursor:label?'pointer':'default', transition:'color .2s' }}
                onMouseEnter={e => { if(label) (e.currentTarget as HTMLParagraphElement).style.color=ct; }}
                onMouseLeave={e => { (e.currentTarget as HTMLParagraphElement).style.color='rgba(255,255,255,.4)'; }}>
                {label || id}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,.2)' }}>Namaste ✦</p>
        <p style={{ fontFamily:"'Nunito Sans', sans-serif", fontSize:12, color:'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomStudio} — Tous droits réservés</p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateStudioYogaProps {
  config?: Partial<ConfigStudioYoga>;
  isPreview?: boolean;
}

export default function TemplateStudioYoga({ config: partiel, isPreview }: TemplateStudioYogaProps) {
  const estCouleurClaire = (hex?: string): boolean => {
    if (!hex || typeof hex !== 'string') return false;
    const h = hex.replace('#', '');
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return (r*299+g*587+b*114)/1000 > 150;
  };
  const fondValide = estCouleurClaire(partiel?.couleurFond);

  const config: ConfigStudioYoga = {
    ...CONFIG_YOGA_DEFAUT, ...partiel,
    couleurFond:       fondValide ? (partiel?.couleurFond       || CONFIG_YOGA_DEFAUT.couleurFond)       : CONFIG_YOGA_DEFAUT.couleurFond,
    couleurCreme:      fondValide ? (partiel?.couleurCreme      || CONFIG_YOGA_DEFAUT.couleurCreme)      : CONFIG_YOGA_DEFAUT.couleurCreme,
    couleurTexte:      fondValide ? (partiel?.couleurTexte      || CONFIG_YOGA_DEFAUT.couleurTexte)      : CONFIG_YOGA_DEFAUT.couleurTexte,
    couleurTerre:      partiel?.couleurTerre      || CONFIG_YOGA_DEFAUT.couleurTerre,
    couleurSauge:      partiel?.couleurSauge      || CONFIG_YOGA_DEFAUT.couleurSauge,
    couleurFondSombre: partiel?.couleurFondSombre || CONFIG_YOGA_DEFAUT.couleurFondSombre,
  };

  const VALID_IDS = ['hero','respiration','stats','cours','lotus','apropos','professeurs','avis','abonnements','horaires','faq','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_YOGA_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_YOGA_DEFAUT.sections;

  config.stats         = ea(partiel?.stats,          CONFIG_YOGA_DEFAUT.stats);
  config.cours         = ea(partiel?.cours,          CONFIG_YOGA_DEFAUT.cours);
  config.professeurs   = ea(partiel?.professeurs,    CONFIG_YOGA_DEFAUT.professeurs);
  config.avis          = ea(partiel?.avis,           CONFIG_YOGA_DEFAUT.avis);
  config.abonnements   = ea(partiel?.abonnements,    CONFIG_YOGA_DEFAUT.abonnements);
  config.horairesStudio= ea(partiel?.horairesStudio, CONFIG_YOGA_DEFAUT.horairesStudio);
  config.faq           = ea(partiel?.faq,            CONFIG_YOGA_DEFAUT.faq);

    const { isMobile } = useIsMobile();
  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0,0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a,b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'respiration': return <SectionRespiration config={config} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'cours':       return <SectionCours       config={config} setPage={handlePage} />;
      case 'lotus':       return <SectionLotus       config={config} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'professeurs': return <SectionProfesseurs config={config} />;
      case 'avis':        return <SectionAvis        config={config} />;
      case 'abonnements': return <SectionAbonnements config={config} setPage={handlePage} />;
      case 'horaires':    return <SectionHoraires    config={config} />;
      case 'faq':         return <SectionFAQ         config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background:config.couleurFond, margin:0, padding:0 }}>
      <style>{getStyle(config)}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop:68 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'cours-page'       && (<><SectionCours       config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'professeurs-page' && (<><SectionProfesseurs config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'horaires-page'    && (<><SectionHoraires    config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page'     && (<><SectionContact     config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}