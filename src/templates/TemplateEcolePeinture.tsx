// src/templates/TemplateEcolePeinture.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template École de Peinture & Arts Visuels
// Style : fond blanc #fefefe / accents multicolores vivants
// Typo : Bebas Neue (titres impact) + Nunito (corps) + Dancing Script (déco)
// Effets WOW :
//   - Cube 3D CSS tournant avec toiles sur chaque face (hero)
//   - Éclaboussures SVG de peinture au clic partout
//   - Trait de pinceau SVG qui se dessine sous les titres
//   - Galerie toiles en rotation 3D perspective
//   - Particules multicolores flottantes
//   - Palette SVG animée
//   - Sections révélées au scroll "effet peinture"
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AddonReservationEcole, { AddonReservationTheme, AddonReservationData } from '../addons/reservation-ecole/AddonReservationEcole';
import AddonAbonnementEcole, { AddonAbonnementTheme, AddonAbonnementData } from '../addons/abonnement-ecole/AddonAbonnementEcole';

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface CoursArt {
  titre: string;
  description: string;
  photo: string;
  medium: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
  duree: string;
  prix: string;
  inclus: string[];
  couleurAccent: string;
}

export interface ArtisteProfesseur {
  nom: string;
  titre: string;
  specialite: string;
  bio: string;
  photo: string;
  oeuvreSignature: string;
  expositions: string[];
  citation: string;
  annees: number;
}

export interface OeuvreEleve {
  titre: string;
  eleve: string;
  photo: string;
  medium: string;
  cours: string;
  annee: string;
}

export interface AvisArt {
  texte: string;
  auteur: string;
  cours: string;
  photo: string;
  note: number;
}

export interface AtlierFormule {
  nom: string;
  prix: string;
  periode: string;
  description: string;
  inclus: string[];
  populaire?: boolean;
  couleur: string;
}

export interface ConfigEcolePeinture {
  nomEcole: string;
  tagline: string;
  sousTagline: string;
  descriptionHero: string;
  descriptionAPropos: string;
  citation: string;
  auteurCitation: string;

  // Couleurs signature (palette)
  couleur1: string; // rouge
  couleur2: string; // bleu
  couleur3: string; // jaune
  couleur4: string; // vert
  couleur5: string; // violet
  couleurFond: string;
  couleurTexte: string;
  couleurSombre: string;

  photoHero: string;
  photoAPropos1: string;
  photoAPropos2: string;
  photoBanner: string;

  stats: { valeur: string; label: string; icone: string }[];
  cours: CoursArt[];
  professeurs: ArtisteProfesseur[];
  oeuvresEleves: OeuvreEleve[];
  avis: AvisArt[];
  formules: AtlierFormule[];
  faq: { question: string; reponse: string }[];
  evenements: { titre: string; date: string; description: string; type: string }[];

  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  reseaux: { instagram?: string; facebook?: string; youtube?: string };
  coordGoogleMaps: string;
  sections: SectionConfig[];
  vendeurId?: number;
  titreAbonnements: string;
  titreAbonnementsAccent: string;
}

export const CONFIG_PEINTURE_DEFAUT: ConfigEcolePeinture = {
  nomEcole: 'Atelier Chromatic',
  tagline: 'Créez.',
  sousTagline: 'Exprimez-vous.',
  descriptionHero: 'Un espace de création libre et bienveillant où chaque coup de pinceau devient une découverte. Peinture, aquarelle, acrylique, dessin — apprenez l\'art visuel à votre rythme.',
  descriptionAPropos: 'Fondé en 2012 par l\'artiste Marie-Soleil Beaumont, l\'Atelier Chromatic est bien plus qu\'une école — c\'est une communauté de créateurs passionnés. Dans nos ateliers lumineux, la technique rencontre la liberté d\'expression.',
  citation: 'Peindre, c\'est une autre façon de tenir un journal.',
  auteurCitation: 'Pablo Picasso',

  couleur1: '#e63946',
  couleur2: '#2196f3',
  couleur3: '#ffb300',
  couleur4: '#4caf50',
  couleur5: '#9c27b0',
  couleurFond: '#fefefe',
  couleurTexte: '#1a1a1a',
  couleurSombre: '#12131a',

  photoHero: 'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos2: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoBanner: 'https://images.pexels.com/photos/1183992/pexels-photo-1183992.jpeg?auto=compress&cs=tinysrgb&w=1600',

  stats: [
    { valeur: '1,200+', label: 'Artistes formés', icone: '🎨' },
    { valeur: '18',     label: 'Ateliers / semaine', icone: '🖌️' },
    { valeur: '8',      label: 'Professeurs artistes', icone: '🖼️' },
    { valeur: '97%',    label: 'Satisfaction', icone: '⭐' },
  ],

  cours: [
    {
      titre: 'Peinture Acrylique — Les Bases',
      description: 'Découvrez la peinture acrylique, ses techniques fondamentales et la théorie des couleurs. Idéal pour les débutants complets.',
      photo: 'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Acrylique', niveau: 'Débutant', duree: '3h / séance', prix: '55$',
      inclus: ['Matériel fourni', 'Toile incluse', 'Livret de techniques', 'Tablier offert'],
      couleurAccent: '#e63946',
    },
    {
      titre: 'Aquarelle Intuitive',
      description: 'Laissez-vous emporter par la fluidité de l\'aquarelle. Techniques de lavis, transparences et effets mouillés-mouillés dans un esprit de lâcher-prise.',
      photo: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Aquarelle', niveau: 'Tous niveaux', duree: '2h30 / séance', prix: '48$',
      inclus: ['Papier aquarelle 300g', 'Pigments professionnels', 'Accès médiathèque', 'Thé & café'],
      couleurAccent: '#2196f3',
    },
    {
      titre: 'Dessin Académique & Portrait',
      description: 'Maîtrisez les proportions, la lumière et l\'ombre. Du crayon HB au fusain, développez votre sens de l\'observation.',
      photo: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Dessin', niveau: 'Intermédiaire', duree: '2h / séance', prix: '42$',
      inclus: ['Papier & crayons fournis', 'Modèle vivant (mensuel)', 'Correction personnalisée', 'Portfolio PDF'],
      couleurAccent: '#ffb300',
    },
    {
      titre: 'Peinture à l\'Huile — Maîtrise',
      description: 'La noblesse des maîtres anciens. Empâtements, glacis, sfumato — explorez toutes les possibilités de l\'huile sur toile.',
      photo: 'https://images.pexels.com/photos/1183992/pexels-photo-1183992.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Huile', niveau: 'Avancé', duree: '4h / séance', prix: '75$',
      inclus: ['Pigments Old Holland', 'Châssis lin triple apprêt', 'Vernissage privé', 'Certificat de niveau'],
      couleurAccent: '#9c27b0',
    },
    {
      titre: 'Art Numérique & Illustration',
      description: 'Tablette graphique, Procreate et Photoshop — créez des illustrations digitales professionnelles dans un cadre créatif stimulant.',
      photo: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Numérique', niveau: 'Débutant', duree: '3h / séance', prix: '65$',
      inclus: ['Tablette iPad fournie', 'Licence Procreate', 'Ressources numériques', 'Portfolio en ligne'],
      couleurAccent: '#4caf50',
    },
    {
      titre: 'Atelier Libre — Création Personnelle',
      description: 'Un espace ouvert pour pratiquer votre discipline au rythme qui vous convient. Conseil sur demande par nos artistes résidents.',
      photo: 'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=800',
      medium: 'Libre', niveau: 'Tous niveaux', duree: '3h', prix: '35$',
      inclus: ['Accès atelier équipé', 'Matériel de base dispo', 'Musique & ambiance', 'Café & snacks'],
      couleurAccent: '#ff5722',
    },
  ],

  professeurs: [
    {
      nom: 'Marie-Soleil Beaumont',
      titre: 'Fondatrice & Artiste Peintre',
      specialite: 'Peinture abstraite & Acrylique',
      bio: 'Diplômée de l\'UQAM en arts visuels, Marie-Soleil a exposé dans plus de 30 galeries au Québec et en Europe. Sa pédagogie douce et intuitive a transformé des centaines de débutants en artistes confiants.',
      photo: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400',
      oeuvreSignature: 'Série "Chromatic Dreams" (2022)',
      expositions: ['Musée d\'art contemporain — 2023', 'Galerie Simon Blais — 2021', 'Biennale de Montréal — 2019'],
      citation: 'Chaque erreur est un coup de pinceau inattendu.',
      annees: 14,
    },
    {
      nom: 'Jacques Tremblante',
      titre: 'Maître en Aquarelle',
      specialite: 'Aquarelle & Techniques mixtes',
      bio: 'Formé à Paris aux Beaux-Arts, Jacques est reconnu comme l\'un des aquarellistes les plus talentueux du Québec. Ses cours fusionnent rigueur technique et liberté créatrice.',
      photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400',
      oeuvreSignature: '"Lumières sur le Saint-Laurent" (2021)',
      expositions: ['Salon des aquarellistes de France — 2022', 'Galerie Orange — 2020'],
      citation: 'L\'aquarelle pardonne et surprend toujours.',
      annees: 18,
    },
    {
      nom: 'Sofia Nakamura',
      titre: 'Illustratrice & Prof Art Numérique',
      specialite: 'Illustration numérique & Character design',
      bio: 'Ex-directrice artistique pour une agence de design primée, Sofia apporte son expertise du monde professionnel en studio. Ses élèves ont été publiés dans des magazines et exposés lors de festivals.',
      photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      oeuvreSignature: '"Série Botanical AI" — NFT collection (2023)',
      expositions: ['Adobe MAX Gallery — 2023', 'Fantasia Festival — 2022'],
      citation: 'Les pixels ont autant d\'âme que la toile.',
      annees: 9,
    },
  ],

  oeuvresEleves: [
    { titre: 'Montréal au crépuscule', eleve: 'Isabelle T.', photo: 'https://images.pexels.com/photos/1183992/pexels-photo-1183992.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Acrylique', cours: 'Peinture Acrylique', annee: '2024' },
    { titre: 'Série florale', eleve: 'Pierre A.', photo: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Aquarelle', cours: 'Aquarelle Intuitive', annee: '2024' },
    { titre: 'Portrait imaginaire', eleve: 'Camille R.', photo: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Fusain', cours: 'Dessin Académique', annee: '2023' },
    { titre: 'Abstraction urbaine', eleve: 'Marc L.', photo: 'https://images.pexels.com/photos/1646953/pexels-photo-1646953.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Huile', cours: 'Peinture à l\'Huile', annee: '2024' },
    { titre: 'Character design', eleve: 'Ana S.', photo: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Numérique', cours: 'Art Numérique', annee: '2024' },
    { titre: 'Paysage intérieur', eleve: 'Jean-Paul M.', photo: 'https://images.pexels.com/photos/1183992/pexels-photo-1183992.jpeg?auto=compress&cs=tinysrgb&w=600', medium: 'Acrylique', cours: 'Atelier Libre', annee: '2023' },
  ],

  avis: [
    { texte: 'Je n\'avais jamais tenu un pinceau de ma vie à 52 ans. Après 3 mois avec Marie-Soleil, j\'ai réalisé ma première exposition! L\'atmosphère de l\'atelier est magique — jamais de jugement, toujours des encouragements.', auteur: 'Louise Bergeron', cours: 'Peinture Acrylique', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Les cours d\'aquarelle de Jacques ont complètement transformé ma façon de voir la lumière. Sa pédagogie est extraordinaire — technique solide et liberté créative en même temps.', auteur: 'François Côté', cours: 'Aquarelle Intuitive', photo: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Sofia est une enseignante hors pair. Grâce à ses cours d\'illustration numérique, j\'ai décroché mon premier contrat avec une maison d\'édition. Atelier Chromatic a changé ma vie!', auteur: 'Kim Nguyen', cours: 'Art Numérique', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
  ],

  formules: [
    { nom: 'Curieux', prix: '95$', periode: '/ mois', description: '2 ateliers par mois pour explorer l\'art à votre rythme.', inclus: ['2 ateliers au choix', 'Matériel de base inclus', 'Accès galerie membres', 'Newsletter artistes'], populaire: false, couleur: '#ffb300' },
    { nom: 'Créateur', prix: '195$', periode: '/ mois', description: 'Pratiquez intensément et progressez rapidement.', inclus: ['6 ateliers / mois', 'Matériel illimité', 'Atelier libre mensuel', 'Accès bibliothèque art', 'Critique mensuelle', 'Vernissage saisonnier'], populaire: true, couleur: '#e63946' },
    { nom: 'Artiste', prix: '340$', periode: '/ mois', description: 'L\'expérience complète pour qui prend l\'art au sérieux.', inclus: ['Ateliers illimités', 'Cours privé mensuel', 'Studio personnel 10h/mois', 'Portfolio professionnel', 'Exposition annuelle garantie', 'Matériel premium offert'], populaire: false, couleur: '#9c27b0' },
  ],

  faq: [
    { question: 'Dois-je avoir du talent pour commencer?', reponse: 'Absolument pas! Le talent est une croyance — la technique s\'apprend. Nos professeurs ont accompagné des centaines de "je ne sais pas du tout dessiner" qui sont devenus de vrais artistes. L\'essentiel c\'est l\'envie.' },
    { question: 'Quel medium dois-je choisir pour commencer?', reponse: 'L\'acrylique est idéal pour débuter — elle sèche vite, se corrige facilement et est peu coûteuse. L\'aquarelle est plus intuitive mais moins pardonnante. Venez nous rencontrer et on vous guidera selon votre personnalité créative!' },
    { question: 'Puis-je apporter mon propre matériel?', reponse: 'Oui, absolument! Mais tout le matériel nécessaire est fourni dans nos cours, alors vous n\'avez rien à acheter pour commencer. Avec le temps, vous développerez vos préférences.' },
    { question: 'Y a-t-il des ateliers pour enfants?', reponse: 'Oui! Nous offrons des ateliers spéciaux pour les 6-12 ans et les 12-17 ans, le samedi matin. Ces cours sont adaptés pour allier apprentissage technique et jeu créatif.' },
    { question: 'Comment se déroule un vernissage?', reponse: 'Deux fois par an, nous organisons un vernissage où les élèves exposent leurs meilleures créations. C\'est un événement festif ouvert au public, avec vin et fromages, qui célèbre les progrès de notre communauté.' },
  ],

  evenements: [
    { titre: 'Vernissage Printemps', date: '14 juin 2026', description: 'Exposition des œuvres de nos élèves de la saison. Vernissage public avec vin et musique live.', type: 'Vernissage' },
    { titre: 'Atelier Spécial — Encre de Chine', date: '28 juin 2026', description: 'Une journée immersive dans l\'art millénaire de l\'encre. Maître invité de Paris.', type: 'Atelier spécial' },
    { titre: 'Paint & Sip — Soirée Rosé', date: '12 juillet 2026', description: 'Un atelier convivial en soirée, verre de rosé à la main. Parfait pour débutants et entre amis!', type: 'Soirée' },
    { titre: 'Stage Intensif — Été', date: '4-8 août 2026', description: 'Une semaine complète d\'immersion artistique, du dessin au vernissage final.', type: 'Stage' },
  ],

  adresse: '4200 rue Saint-Denis',
  ville: 'Montréal, QC H2J 2K8',
  telephone: '(514) 555-0490',
  email: 'bonjour@atelierchromatic.ca',
  horaires: ['Mar – Ven : 10h – 21h', 'Samedi : 9h – 17h', 'Dimanche : 10h – 16h', 'Lundi : Fermé'],
  reseaux: { instagram: '#', facebook: '#', youtube: '#' },
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',

  sections: [
    { id: 'hero',        actif: true, ordre: 1,  label: 'Hero + Cube 3D'              },
    { id: 'stats',       actif: true, ordre: 2,  label: 'Chiffres clés'               },
    { id: 'cours',       actif: true, ordre: 3,  label: 'Nos ateliers'                },
    { id: 'horaires',    actif: true, ordre: 4,  label: 'Horaires & Réservation'      },
    { id: 'galerie3d',   actif: true, ordre: 5,  label: 'Galerie 3D — Œuvres élèves'  },
    { id: 'apropos',     actif: true, ordre: 6,  label: 'À propos & philosophie'      },
    { id: 'professeurs', actif: true, ordre: 7,  label: 'Nos artistes-professeurs'    },
    { id: 'evenements',  actif: true, ordre: 8,  label: 'Événements à venir'          },
    { id: 'avis',        actif: true, ordre: 9,  label: 'Témoignages'                 },
    { id: 'formules',    actif: true, ordre: 10, label: 'Abonnements'                 },
    { id: 'faq',         actif: true, ordre: 11, label: 'FAQ'                         },
    { id: 'contact',     actif: true, ordre: 12, label: 'Contact & Inscription'       },
  ],
  titreAbonnements: 'Votre',
  titreAbonnementsAccent: 'pass création',
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

// ─── STYLES ───────────────────────────────────────────────────────────────────

const getStyle = (c: ConfigEcolePeinture) => `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@300;400;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}

@keyframes cube3d { from{transform:rotateX(-15deg) rotateY(0deg)} to{transform:rotateX(-15deg) rotateY(360deg)} }
@keyframes cubeFloat { 0%,100%{transform:rotateX(-15deg) rotateY(0deg) translateY(0)} 50%{transform:rotateX(-20deg) rotateY(180deg) translateY(-20px)} }
@keyframes eclaboussure {
  0%   {transform:scale(0) rotate(0deg);opacity:1;}
  60%  {transform:scale(1.2) rotate(var(--rot));opacity:.9;}
  100% {transform:scale(1) rotate(var(--rot));opacity:0;}
}
@keyframes particleFloat {
  0%   {transform:translateY(0) translateX(0) rotate(0deg);opacity:.6;}
  33%  {transform:translateY(-30px) translateX(15px) rotate(120deg);opacity:.8;}
  66%  {transform:translateY(-10px) translateX(-10px) rotate(240deg);opacity:.5;}
  100% {transform:translateY(0) translateX(0) rotate(360deg);opacity:.6;}
}
@keyframes traitPinceau {
  from{stroke-dashoffset:400;}
  to{stroke-dashoffset:0;}
}
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes peintureTache {
  0%  {clip-path:circle(0% at 50% 50%);}
  100%{clip-path:circle(150% at 50% 50%);}
}
@keyframes couleurPalette {
  0%  {filter:hue-rotate(0deg);}
  100%{filter:hue-rotate(360deg);}
}
@keyframes spinSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes shimmer {
  0%  {background-position:-200% 0}
  100%{background-position:200% 0}
}
@keyframes brushWrite {
  from{width:0;}
  to{width:100%;}
}

.rv  {opacity:0;transform:translateY(32px);transition:opacity .9s,transform .9s;}
.rv.vis{opacity:1;transform:none;}
.rv-l{opacity:0;transform:translateX(-44px);transition:opacity .9s,transform .9s;}
.rv-l.vis{opacity:1;transform:none;}
.rv-r{opacity:0;transform:translateX(44px);transition:opacity .9s,transform .9s;}
.rv-r.vis{opacity:1;transform:none;}

/* Peinture reveal au scroll */
.paint-reveal{
  clip-path:circle(0% at 10% 50%);
  transition:clip-path 1.2s cubic-bezier(.4,0,.2,1);
}
.paint-reveal.vis{
  clip-path:circle(150% at 10% 50%);
}

.btn-art {
  background:${c.couleur1};color:#fff;border:none;padding:15px 38px;
  font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;cursor:pointer;
  border-radius:3px;transition:filter .25s,transform .2s,box-shadow .3s;
  position:relative;overflow:hidden;
  box-shadow: 4px 4px 0 rgba(0,0,0,.15);
}
.btn-art:hover{filter:brightness(1.12);transform:translate(-2px,-2px);box-shadow:6px 6px 0 rgba(0,0,0,.2);}

.btn-outline-art {
  background:transparent;color:${c.couleurTexte};
  border:2px solid ${c.couleurTexte};padding:14px 36px;
  font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;cursor:pointer;
  border-radius:3px;transition:all .25s;
}
.btn-outline-art:hover{background:${c.couleurTexte};color:#fff;transform:translate(-2px,-2px);}

.nav-art{
  font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;
  letter-spacing:.15em;text-transform:uppercase;
  color:rgba(255,255,255,.85);cursor:pointer;background:none;border:none;
  transition:color .2s;position:relative;padding:4px 0;
}
.nav-art::after{
  content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;
  background:${c.couleur3};transform:scaleX(0);transition:transform .3s;
}
.nav-art:hover,.nav-art.active{color:${c.couleur3};}
.nav-art:hover::after,.nav-art.active::after{transform:scaleX(1);}

.carte-cours{
  overflow:hidden;cursor:pointer;
  transition:transform .4s cubic-bezier(.34,1.56,.64,1),box-shadow .4s;
  border:3px solid transparent;
}
.carte-cours:hover{transform:translateY(-10px) rotate(-1deg);box-shadow:8px 8px 0 rgba(0,0,0,.12);}

.tag-medium{
  display:inline-block;padding:4px 12px;border-radius:2px;
  font-family:'Nunito',sans-serif;font-size:10px;font-weight:800;
  letter-spacing:.1em;text-transform:uppercase;color:#fff;
}

.faq-btn{
  width:100%;background:none;border:none;cursor:pointer;padding:18px 0;
  display:flex;justify-content:space-between;align-items:center;
  font-family:'Nunito',sans-serif;font-size:16px;font-weight:700;
  color:${c.couleurTexte};text-align:left;
  border-bottom:2px solid rgba(0,0,0,.06);transition:color .2s;
}
.faq-btn:hover{color:${c.couleur1};}

.fw-inp{
  width:100%;padding:12px 16px;background:rgba(0,0,0,.03);
  border:none;border-bottom:2px solid rgba(0,0,0,.15);
  color:${c.couleurTexte};font-family:'Nunito',sans-serif;font-size:14px;
  outline:none;box-sizing:border-box;transition:border-color .2s;
}
.fw-inp:focus{border-bottom-color:${c.couleur1};}
.fw-inp::placeholder{color:rgba(0,0,0,.3);}

/* Toile 3D */
.scene-3d{perspective:800px;width:260px;height:260px;margin:0 auto;}
.cube{
  width:260px;height:260px;position:relative;transform-style:preserve-3d;
  animation:cubeFloat 12s ease-in-out infinite;
}
.cube-face{
  position:absolute;width:260px;height:260px;
  border:3px solid rgba(255,255,255,.3);
  backface-visibility:visible;overflow:hidden;
}
.cube-face img{width:100%;height:100%;object-fit:cover;}
.face-front  {transform:translateZ(130px);}
.face-back   {transform:rotateY(180deg) translateZ(130px);}
.face-right  {transform:rotateY(90deg) translateZ(130px);}
.face-left   {transform:rotateY(-90deg) translateZ(130px);}
.face-top    {transform:rotateX(90deg) translateZ(130px);}
.face-bottom {transform:rotateX(-90deg) translateZ(130px);}
`;

// ─── ÉCLABOUSSURES SVG ────────────────────────────────────────────────────────

interface Eclabousse {
  id: number; x: number; y: number;
  couleur: string; taille: number; rotation: number;
}

function EclaboussureLayer({ couleurs }: { couleurs: string[] }) {
  const [eclaboussures, setEclaboussures] = useState<Eclabousse[]>([]);
  const idRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nouvelles = Array.from({ length: 6 }, () => ({
      id: idRef.current++,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 60,
      couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
      taille: 20 + Math.random() * 60,
      rotation: Math.random() * 360,
    }));
    setEclaboussures(prev => [...prev, ...nouvelles]);
    setTimeout(() => setEclaboussures(prev => prev.slice(6)), 900);
  }, [couleurs]);

  return (
    <div onClick={handleClick} style={{ position: 'absolute', inset: 0, cursor: 'crosshair', zIndex: 5, pointerEvents: 'all' }}>
      {eclaboussures.map(e => (
        <svg key={e.id} style={{
          position: 'absolute', left: e.x - e.taille, top: e.y - e.taille,
          width: e.taille * 2, height: e.taille * 2, pointerEvents: 'none',
          animation: `eclaboussure .8s ease-out forwards`,
          ['--rot' as any]: `${e.rotation}deg`,
          zIndex: 10,
        }} viewBox="0 0 100 100">
          {/* Tache de peinture SVG organique */}
          <path d="M50,15 Q70,10 80,30 Q95,45 85,65 Q75,85 55,88 Q35,92 20,75 Q5,58 15,38 Q25,18 50,15Z"
            fill={e.couleur} opacity="0.85" />
          <circle cx="65" cy="35" r="8" fill={e.couleur} opacity="0.7" />
          <circle cx="30" cy="65" r="5" fill={e.couleur} opacity="0.6" />
          <ellipse cx="75" cy="70" rx="10" ry="6" fill={e.couleur} opacity="0.5" transform={`rotate(${e.rotation * 0.3} 75 70)`} />
        </svg>
      ))}
    </div>
  );
}

// ─── PARTICULES MULTICOLORES ──────────────────────────────────────────────────

function ParticulesArt({ couleurs }: { couleurs: string[] }) {
  const { isMobile } = useIsMobile();
  const particules = Array.from({ length: 24 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    taille: 4 + Math.random() * 10,
    couleur: couleurs[i % couleurs.length],
    delay: Math.random() * 5,
    duree: 5 + Math.random() * 4,
    forme: Math.random() > 0.5 ? 'circle' : 'rect',
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particules.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.taille, height: p.taille,
          borderRadius: p.forme === 'circle' ? '50%' : '2px',
          background: p.couleur,
          opacity: 0.5,
          animation: `particleFloat ${p.duree}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── TRAIT PINCEAU SVG ────────────────────────────────────────────────────────

function TraitPinceau({ couleur, vis, largeur = 300 }: { couleur: string; vis: boolean; largeur?: number }) {
  const { isMobile } = useIsMobile();
  return (
    <svg width={largeur} height={18} viewBox={`0 0 ${largeur} 18`} style={{ display: 'block', marginTop: 4, overflow: 'visible' }}>
      <path
        d={`M0,12 Q${largeur * 0.15},4 ${largeur * 0.3},10 Q${largeur * 0.5},18 ${largeur * 0.7},8 Q${largeur * 0.85},2 ${largeur},10`}
        fill="none" stroke={couleur} strokeWidth="5" strokeLinecap="round"
        strokeDasharray="400" opacity="0.7"
        style={{
          strokeDashoffset: vis ? 0 : 400,
          transition: vis ? 'stroke-dashoffset 1.2s ease .3s' : 'none',
        }}
      />
    </svg>
  );
}

// ─── CUBE 3D ──────────────────────────────────────────────────────────────────

function Cube3D({ photos, couleurs }: { photos: string[]; couleurs: string[] }) {
  const { isMobile } = useIsMobile();
  const faces = [
    { cls: 'face-front',  photo: photos[0] || '' },
    { cls: 'face-back',   photo: photos[1] || '' },
    { cls: 'face-right',  photo: photos[2] || '' },
    { cls: 'face-left',   photo: photos[3] || '' },
    { cls: 'face-top',    photo: photos[4] || '', couleur: couleurs[0] },
    { cls: 'face-bottom', photo: photos[5] || '', couleur: couleurs[1] },
  ];

  return (
    <div className="scene-3d">
      <div className="cube">
        {faces.map((face, i) => (
          <div key={i} className={`cube-face ${face.cls}`}
            style={{ background: face.couleur || '#111' }}>
            {face.photo && <img src={face.photo} alt="" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PALETTE SVG ──────────────────────────────────────────────────────────────

function PaletteSVG({ couleurs }: { couleurs: string[] }) {
  const { isMobile } = useIsMobile();
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" style={{ animation: 'couleurPalette 8s linear infinite', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.3))' }}>
      <ellipse cx="55" cy="55" rx="50" ry="42" fill="white" stroke="rgba(0,0,0,.1)" strokeWidth="1" />
      <ellipse cx="30" cy="70" rx="12" ry="8" fill="white" />
      {/* Taches de couleur */}
      {[
        { cx: 30, cy: 30, r: 12, c: couleurs[0] },
        { cx: 55, cy: 20, r: 11, c: couleurs[1] },
        { cx: 80, cy: 28, r: 12, c: couleurs[2] },
        { cx: 90, cy: 52, r: 11, c: couleurs[3] },
        { cx: 75, cy: 75, r: 12, c: couleurs[4] },
        { cx: 45, cy: 78, r: 10, c: couleurs[0] },
      ].map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.c} opacity="0.9" />
      ))}
      {/* Trou de la palette */}
      <circle cx="28" cy="68" r="8" fill="rgba(0,0,0,.1)" />
    </svg>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigEcolePeinture; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [
    ['accueil','Accueil'], ['cours-page','Ateliers'], ['galerie-page','Galerie'],
    ['professeurs-page','Artistes'], ['contact-page','Inscription'],
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? `rgba(18,19,26,.97)` : 'rgba(18,19,26,.85)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `2px solid ${config.couleur1}` : 'none',
      transition: 'all .4s', padding: isMobile ? '0 20px' : '0 48px',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <PaletteSVG couleurs={[config.couleur1, config.couleur2, config.couleur3, config.couleur4, config.couleur5]} />
          <div>
            <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>{config.nomEcole}</p>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 11, color: config.couleur3, letterSpacing: '0.05em' }}>École d'arts visuels</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {liens.map(([id, label]) => (
            <button key={id} className={`nav-art${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>{label}</button>
          ))}
        </div>
        <button className="btn-art" onClick={() => setPage('contact-page')} style={{ padding: '10px 22px', fontSize: 11 }}>
          🎨 S'inscrire
        </button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigEcolePeinture; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const couleurs = [config.couleur1, config.couleur2, config.couleur3, config.couleur4, config.couleur5];
  const rv = useReveal(0.01);

  const photosEleves = ea(config.oeuvresEleves, CONFIG_PEINTURE_DEFAUT.oeuvresEleves).map(o => o.photo);

  return (
    <section ref={rv.ref} style={{
      background: config.couleurSombre, minHeight: '100vh', position: 'relative',
      overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 68,
    }}>
      {/* Photo fond */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.22)' }} />

      {/* Particules multicolores */}
      <ParticulesArt couleurs={couleurs} />

      {/* Couche éclaboussures cliquables */}
      <EclaboussureLayer couleurs={couleurs} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: isMobile ? '48px 20px' : '60px 48px', width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60, alignItems: 'center', zIndex: 6 }}>
        {/* Texte gauche */}
        <div>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, color: config.couleur3, marginBottom: 16, animation: 'fadeUp .7s ease both' }}>
            🖌️ Bienvenue à {config.nomEcole}
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(72px, 11vw, 140px)', color: '#fff', lineHeight: 0.88, letterSpacing: '0.02em', marginBottom: 8, animation: 'fadeUp .8s .1s ease both' }}>
            {config.tagline}
          </h1>
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(72px, 11vw, 140px)', lineHeight: 0.88, letterSpacing: '0.02em', marginBottom: 28, animation: 'fadeUp .8s .15s ease both',
            background: `linear-gradient(90deg, ${config.couleur1}, ${config.couleur2}, ${config.couleur3}, ${config.couleur4}, ${config.couleur5})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%',
            animationName: 'fadeUp, shimmer', animationDuration: '.8s, 3s', animationDelay: '.15s, 1s', animationTimingFunction: 'ease, linear', animationFillMode: 'both, none', animationIterationCount: '1, infinite',
          }}>
            {config.sousTagline}
          </h1>

          <TraitPinceau couleur={config.couleur1} vis={rv.vis} largeur={320} />

          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, color: 'rgba(255,255,255,.65)', lineHeight: 1.9, maxWidth: 480, marginBottom: 40, marginTop: 20, animation: 'fadeUp .8s .3s ease both' }}>
            {config.descriptionHero}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeUp .8s .4s ease both' }}>
            <button className="btn-art" onClick={() => setPage('cours-page')}>Voir nos ateliers</button>
            <button className="btn-outline-art" onClick={() => setPage('contact-page')} style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>Essai gratuit</button>
          </div>

          {/* Hint clic */}
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 14, color: 'rgba(255,255,255,.35)', marginTop: 28, animation: 'fadeUp .8s .6s ease both' }}>
            ✨ Cliquez n'importe où pour éclabousser de la peinture!
          </p>
        </div>

        {/* Cube 3D droite */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Cube3D
            photos={photosEleves.slice(0, 6).concat(photosEleves).slice(0, 6)}
            couleurs={[config.couleur1, config.couleur2]}
          />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
            Œuvres de nos élèves
          </p>

          {/* Palette décorative */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[config.couleur1, config.couleur2, config.couleur3, config.couleur4, config.couleur5].map((col, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: col, border: '3px solid rgba(255,255,255,.3)', cursor: 'pointer', transition: 'transform .2s', boxShadow: `0 0 16px ${col}80` }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const stats = ea(config.stats, CONFIG_PEINTURE_DEFAUT.stats);
  const couleurs = [config.couleur1, config.couleur2, config.couleur3, config.couleur4];

  return (
    <section style={{ background: config.couleurFond, padding: '0' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: couleurs[i % couleurs.length], padding: '48px 24px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Effet peinture révélé */}
            <div className={`paint-reveal${rv.vis ? ' vis' : ''}`} style={{ position: 'absolute', inset: 0, background: `${couleurs[i % couleurs.length]}cc`, transitionDelay: `${i * 0.15}s` }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icone}</div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 56, color: '#fff', lineHeight: 1, marginBottom: 6, textShadow: '2px 2px 0 rgba(0,0,0,.2)' }}>{s.valeur}</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.85)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION COURS ────────────────────────────────────────────────────────────

function SectionCours({ config, setPage }: { config: ConfigEcolePeinture; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cours = ea(config.cours, CONFIG_PEINTURE_DEFAUT.cours);

  const niveauEmoji: Record<string, string> = { 'Débutant': '🌱', 'Intermédiaire': '🌿', 'Avancé': '🌳', 'Tous niveaux': '🎨' };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      {/* Ligne décorative gauche */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: `linear-gradient(180deg, ${config.couleur1}, ${config.couleur2}, ${config.couleur3}, ${config.couleur4}, ${config.couleur5})` }} />

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur1, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 10 }}>Nos ateliers</p>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px, 6vw, 80px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1 }}>
              Choisissez votre médium
            </h2>
            <TraitPinceau couleur={config.couleur2} vis={rv.vis} largeur={400} />
          </div>
          <button className="btn-outline-art" onClick={() => setPage('cours-page')}>Tous les ateliers →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
          {cours.map((c, i) => (
            <div key={i} className="carte-cours" style={{ background: '#fff', border: `3px solid ${c.couleurAccent}` }}>
              {/* Photo */}
              <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                <img src={c.photo} alt={c.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.07)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'none'} />
                {/* Prix badge */}
                <div style={{ position: 'absolute', top: 0, right: 0, background: c.couleurAccent, color: '#fff', padding: '12px 18px', fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: '0.04em', lineHeight: 1 }}>
                  {c.prix}
                </div>
                {/* Medium tag */}
                <div className="tag-medium" style={{ position: 'absolute', bottom: 14, left: 14, background: c.couleurAccent }}>
                  {c.medium}
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding: '20px 24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: c.couleurAccent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {niveauEmoji[c.niveau]} {c.niveau}
                  </span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'rgba(0,0,0,.4)', fontWeight: 700 }}>⏱ {c.duree}</span>
                </div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 19, fontWeight: 800, color: config.couleurTexte, marginBottom: 10, lineHeight: 1.3 }}>{c.titre}</h3>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7, marginBottom: 16 }}>{c.description}</p>

                {/* Inclus */}
                <div style={{ borderTop: `2px solid ${c.couleurAccent}20`, paddingTop: 14, marginBottom: 18 }}>
                  {c.inclus.map((item, j) => (
                    <p key={j} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(0,0,0,.5)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: c.couleurAccent, fontSize: 14 }}>✓</span>{item}
                    </p>
                  ))}
                </div>

                <button style={{ width: '100%', padding: '13px', border: 'none', background: c.couleurAccent, color: '#fff', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'filter .2s, transform .15s', boxShadow: `4px 4px 0 rgba(0,0,0,.12)` }}
                  onClick={() => setPage('contact-page')}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '6px 6px 0 rgba(0,0,0,.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0 rgba(0,0,0,.12)'; }}>
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

// ─── SECTION GALERIE 3D ───────────────────────────────────────────────────────

function SectionGalerie3D({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const oeuvres = ea(config.oeuvresEleves, CONFIG_PEINTURE_DEFAUT.oeuvresEleves);
  const [actif, setActif] = useState(0);
  const couleurs = [config.couleur1, config.couleur2, config.couleur3, config.couleur4, config.couleur5];

  useEffect(() => {
    const id = setInterval(() => setActif(a => (a + 1) % oeuvres.length), 4000);
    return () => clearInterval(id);
  }, [oeuvres.length]);

  return (
    <section style={{ background: config.couleurSombre, padding: isMobile ? '60px 20px' : '100px 48px', overflow: 'hidden', position: 'relative' }}>
      <ParticulesArt couleurs={couleurs} />
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur3, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Galerie</p>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,6vw,80px)', color: '#fff', letterSpacing: '0.02em', lineHeight: 1 }}>
            Œuvres de nos élèves
          </h2>
          <TraitPinceau couleur={config.couleur3} vis={rv.vis} largeur={300} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          </div>
        </div>

        {/* Galerie 3D perspective */}
        <div style={{ position: 'relative', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1400px' }}>
          {oeuvres.map((oe, i) => {
            const offset = i - actif;
            const absOff = Math.abs(offset);
            const isActif = i === actif;
            const rot = offset * (isActif ? 0 : -25);
            const tx = offset * (isActif ? 0 : 340);
            const tz = isActif ? 0 : -300;
            const couleurBord = couleurs[i % couleurs.length];

            return (
              <div key={i} onClick={() => setActif(i)} style={{
                position: 'absolute',
                width: isActif ? 480 : 300,
                height: isActif ? 380 : 240,
                transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rot}deg)`,
                opacity: absOff > 2 ? 0 : isActif ? 1 : 0.5,
                transition: 'all .7s cubic-bezier(.4,0,.2,1)',
                cursor: isActif ? 'default' : 'pointer',
                overflow: 'hidden',
                border: `4px solid ${isActif ? couleurBord : 'transparent'}`,
                zIndex: isActif ? 10 : 5 - absOff,
                boxShadow: isActif ? `0 32px 80px rgba(0,0,0,.6), 0 0 0 1px ${couleurBord}40` : 'none',
              }}>
                <img src={oe.photo} alt={oe.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isActif ? 'brightness(.8)' : 'brightness(.4)' }} />
                {isActif && (
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${config.couleurSombre} 0%, transparent 50%)` }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 28px' }}>
                      <div className="tag-medium" style={{ background: couleurBord, marginBottom: 8 }}>{oe.medium}</div>
                      <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{oe.titre}</h3>
                      <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 16, color: couleurBord }}>{oe.eleve} · {oe.cours} · {oe.annee}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation couleurs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36 }}>
          {oeuvres.map((_, i) => (
            <button key={i} onClick={() => setActif(i)} style={{
              width: i === actif ? 36 : 12, height: 12, borderRadius: 6, border: 'none',
              cursor: 'pointer', background: i === actif ? couleurs[i % couleurs.length] : 'rgba(255,255,255,.3)',
              transition: 'all .3s',
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      {/* Barre couleurs horizontale déco */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${config.couleur1}, ${config.couleur2}, ${config.couleur3}, ${config.couleur4}, ${config.couleur5})` }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Photos */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/3', height: 320, overflow: 'hidden', border: `4px solid ${config.couleur1}` }}>
              <img src={config.photoAPropos1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'none'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden', border: `4px solid ${config.couleur2}` }}>
              <img src={config.photoAPropos2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'none'} />
            </div>
            <div style={{ height: 200, background: `linear-gradient(135deg, ${config.couleur3}, ${config.couleur4})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${config.couleur3}` }}>
              <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 20, color: '#fff', textAlign: 'center', padding: '0 16px', lineHeight: 1.5 }}>
                "{config.citation}"<br />
                <span style={{ fontSize: 14, opacity: 0.8 }}>— {config.auteurCitation}</span>
              </p>
            </div>
          </div>
          {/* Badge rond */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 88, height: 88, borderRadius: '50%', background: config.couleurSombre, border: `4px solid ${config.couleur1}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 28px rgba(0,0,0,.3)` }}>
            <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: config.couleur1, lineHeight: 1 }}>2012</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 8, color: 'rgba(255,255,255,.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fondée</p>
          </div>
        </div>

        {/* Texte */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur1, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Notre atelier</p>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,5vw,70px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1, marginBottom: 8 }}>
            Bien plus qu'une école
          </h2>
          <TraitPinceau couleur={config.couleur4} vis={rvR.vis} largeur={280} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: 'rgba(0,0,0,.6)', lineHeight: 1.9, marginBottom: 28, marginTop: 16 }}>
            {config.descriptionAPropos}
          </p>
          {/* Valeurs colorées */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 36 }}>
            {[
              [config.couleur1, '🎨', 'Liberté créative', 'Aucun jugement, toute expression est valide'],
              [config.couleur2, '🖌️', 'Technique solide', 'Bases rigoureuses pour s\'exprimer librement'],
              [config.couleur3, '🤝', 'Communauté', 'Des artistes qui se soutiennent mutuellement'],
              [config.couleur4, '🌟', 'Excellence', 'Des professeurs artistes reconnus'],
            ].map(([col, ico, titre, desc]) => (
              <div key={titre} style={{ borderLeft: `3px solid ${col}`, paddingLeft: 14 }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: config.couleurTexte, marginBottom: 2 }}>{ico} {titre}</p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'rgba(0,0,0,.45)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <button className="btn-art">Visiter l'atelier 🖌️</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PROFESSEURS ──────────────────────────────────────────────────────

function SectionProfesseurs({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const profs = ea(config.professeurs, CONFIG_PEINTURE_DEFAUT.professeurs);
  const couleurs = [config.couleur1, config.couleur2, config.couleur5];
  const [actif, setActif] = useState<number | null>(null);

  return (
    <section style={{ background: '#f8f8f8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur5, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Vos mentors</p>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,6vw,80px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1 }}>
            Artistes & Pédagogues
          </h2>
          <TraitPinceau couleur={config.couleur5} vis={rv.vis} largeur={280} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(profs.length, 3)}, 1fr)`, gap: 28 }}>
          {profs.map((p, i) => {
            const col = couleurs[i % couleurs.length];
            return (
              <div key={i} onClick={() => setActif(actif === i ? null : i)}
                style={{ background: '#fff', overflow: 'hidden', cursor: 'pointer', border: `4px solid transparent`, transition: 'all .4s', borderColor: actif === i ? col : 'transparent', transform: actif === i ? 'translateY(-8px)' : 'none', boxShadow: actif === i ? `8px 8px 0 ${col}40` : 'none' }}>
                {/* Photo */}
                <div style={{ height: 300, overflow: 'hidden', position: 'relative' }}>
                  <img src={p.photo} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s', filter: 'brightness(.85)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'none'} />
                  {/* Barre couleur bas */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: col }} />
                  <div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, padding: '16px 20px', background: `linear-gradient(to top, rgba(0,0,0,.8), transparent)` }}>
                    <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff' }}>{p.nom}</h3>
                    <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 14, color: col }}>{p.specialite}</p>
                  </div>
                </div>

                <div style={{ padding: '18px 22px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: col, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{p.titre}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7 }}>{p.bio}</p>

                  <div style={{ maxHeight: actif === i ? 300 : 0, overflow: 'hidden', transition: 'max-height .4s ease' }}>
                    <blockquote style={{ borderLeft: `4px solid ${col}`, paddingLeft: 14, margin: '16px 0 14px' }}>
                      <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, color: col }}>"{p.citation}"</p>
                    </blockquote>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🖼️ {p.oeuvreSignature}</p>
                    {p.expositions.map((exp, j) => (
                      <p key={j} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(0,0,0,.45)', marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${col}30` }}>
                        {exp}
                      </p>
                    ))}
                  </div>

                  <p style={{ marginTop: 12, color: col, fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                    {actif === i ? '↑ Masquer' : `${p.annees} ans d'expérience — En savoir plus ↓`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉVÉNEMENTS ───────────────────────────────────────────────────────

function SectionEvenements({ config, setPage }: { config: ConfigEcolePeinture; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const evs = ea(config.evenements, CONFIG_PEINTURE_DEFAUT.evenements);
  const couleurs = [config.couleur1, config.couleur2, config.couleur3, config.couleur4];
  const typeCouleur: Record<string, string> = { 'Vernissage': config.couleur5, 'Atelier spécial': config.couleur2, 'Soirée': config.couleur1, 'Stage': config.couleur4 };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur1, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Agenda</p>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,5vw,70px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1 }}>Événements à venir</h2>
            <TraitPinceau couleur={config.couleur3} vis={rv.vis} largeur={280} />
          </div>
          <button className="btn-outline-art" onClick={() => setPage('contact-page')}>S'inscrire →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {evs.map((ev, i) => {
            const col = typeCouleur[ev.type] || couleurs[i % couleurs.length];
            const [jour, ...moisAn] = ev.date.split(' ');
            return (
              <div key={i} style={{ background: '#fff', border: `3px solid ${col}`, overflow: 'hidden', transition: 'transform .3s,box-shadow .3s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px) rotate(-1deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `6px 6px 0 ${col}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                {/* Header couleur */}
                <div style={{ background: col, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center', minWidth: 56 }}>
                    <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 40, color: '#fff', lineHeight: 1 }}>{jour}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: 'rgba(255,255,255,.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{moisAn.join(' ')}</p>
                  </div>
                  <div>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.8)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,.2)', padding: '2px 8px' }}>{ev.type}</span>
                    <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 6, lineHeight: 1.2 }}>{ev.titre}</h3>
                  </div>
                </div>
                {/* Corps */}
                <div style={{ padding: '18px 22px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7, marginBottom: 16 }}>{ev.description}</p>
                  <button onClick={() => setPage('contact-page')} style={{ background: 'none', border: `2px solid ${col}`, color: col, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all .2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = col; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = col; }}>
                    S'inscrire
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const avis = ea(config.avis, CONFIG_PEINTURE_DEFAUT.avis);
  const couleurs = [config.couleur1, config.couleur2, config.couleur4];

  return (
    <section style={{ background: '#f8f8f8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur3, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,6vw,80px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1 }}>Ils ont créé avec nous</h2>
          <TraitPinceau couleur={config.couleur3} vis={rv.vis} largeur={280} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(avis.length, 3)}, 1fr)`, gap: 24 }}>
          {avis.map((a, i) => {
            const col = couleurs[i % couleurs.length];
            return (
              <div key={i} style={{ background: '#fff', padding: '28px 26px', borderTop: `4px solid ${col}`, boxShadow: `4px 4px 0 ${col}20`, transition: 'transform .3s,box-shadow .3s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translate(-3px,-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `8px 8px 0 ${col}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = `4px 4px 0 ${col}20`; }}>
                <div style={{ fontSize: 48, color: col, opacity: .2, lineHeight: 1, marginBottom: 8, fontFamily: "'Bebas Neue', cursive" }}>"</div>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.65)', lineHeight: 1.8, marginBottom: 22, fontStyle: 'italic' }}>{a.texte}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={a.photo} alt={a.auteur} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${col}` }} />
                  <div>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, color: config.couleurTexte }}>{a.auteur}</p>
                    <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 13, color: col }}>{a.cours}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                    {[...Array(a.note)].map((_, j) => <span key={j} style={{ color: config.couleur3, fontSize: 14 }}>★</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FORMULES ─────────────────────────────────────────────────────────

// Add-on injectable — src/addons/abonnement-ecole/AddonAbonnementEcole.tsx
// Ce bloc est SEULEMENT l'adaptateur de thème — n'affiche rien si l'add-on est inactif.
function SectionFormules({ config, siteId, abonnementActive }: { config: ConfigEcolePeinture; setPage: (p: string) => void; siteId?: number|string; abonnementActive?: boolean }) {
  const themeAbonnement: AddonAbonnementTheme = {
    primary: config.couleur1,
    accentSecondaire: config.couleur3,
    bg: config.couleurSombre,
    cardBg: 'rgba(255,255,255,.05)',
    border: 'rgba(255,255,255,.12)',
    text: '#fff',
    textDim: 'rgba(255,255,255,.5)',
    fontTitre: "'Bebas Neue',cursive",
    fontTexte: "'Nunito',sans-serif",
  };
  const dataAbonnement: AddonAbonnementData = {
    siteId, abonnementActif: abonnementActive,
    titreLabel: 'Formules',
    titre: config.titreAbonnements,
    titreAccent: config.titreAbonnementsAccent,
  };
  return <AddonAbonnementEcole theme={themeAbonnement} data={dataAbonnement} />;
}

// Add-on injectable — src/addons/reservation-ecole/AddonReservationEcole.tsx
// Nouvelle section (n'existait pas avant) — même principe.
function SectionHoraires({ config, setPage, siteId, reservationActive }: { config: ConfigEcolePeinture; setPage: (p: string) => void; siteId?: number|string; reservationActive?: boolean }) {
  const themeReservation: AddonReservationTheme = {
    primary: config.couleur1,
    accentSecondaire: config.couleur3,
    bg: config.couleurSombre,
    cardBg: 'rgba(255,255,255,.05)',
    border: 'rgba(255,255,255,.12)',
    text: '#fff',
    textDim: 'rgba(255,255,255,.5)',
    fontTitre: "'Bebas Neue',cursive",
    fontTexte: "'Nunito',sans-serif",
  };
  const dataReservation: AddonReservationData = {
    siteId, reservationActive,
    titreLabel: 'Planning',
    titre: 'Horaires des',
    titreAccent: 'ateliers',
    labelBoutonHeader: 'Réserver une place',
    onClicBoutonHeader: () => setPage('contact-page'),
    couleurParStyle: () => config.couleur2,
  };
  return <AddonReservationEcole theme={themeReservation} data={dataReservation} />;
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const faq = ea(config.faq, CONFIG_PEINTURE_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px', borderLeft: `6px solid ${config.couleur3}` }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur3, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px,5vw,70px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1 }}>Questions Fréquentes</h2>
          <TraitPinceau couleur={config.couleur3} vis={rv.vis} largeur={260} />
        </div>
        {faq.map((f, i) => (
          <div key={i}>
            <button className="faq-btn" onClick={() => setOuvert(ouvert === i ? null : i)}>
              <span>🎨 {f.question}</span>
              <span style={{ color: config.couleur1, fontSize: 24, flexShrink: 0, transition: 'transform .3s', transform: ouvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            <div style={{ overflow: 'hidden', maxHeight: ouvert === i ? '300px' : '0', transition: 'max-height .4s ease' }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.6)', lineHeight: 1.9, padding: '10px 0 24px', borderLeft: `4px solid ${config.couleur1}`, paddingLeft: 20 }}>{f.reponse}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigEcolePeinture }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const horaires = ea(config.horaires, CONFIG_PEINTURE_DEFAUT.horaires);
  const cours = ea(config.cours, CONFIG_PEINTURE_DEFAUT.cours);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', cours: '', message: '', experience: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ecole: config.nomEcole, type: 'contact-peinture', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook setLoading(false);
  };

  return (
    <section style={{ background: '#f8f8f8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 32 : 80 }}>
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: config.couleur1, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Nous rejoindre</p>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(36px,4vw,60px)', color: config.couleurTexte, letterSpacing: '0.02em', lineHeight: 1, marginBottom: 8 }}>Commencez à créer</h2>
            <TraitPinceau couleur={config.couleur1} vis={rv.vis} largeur={220} />
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[{ i: '📍', l: 'Adresse', v: `${config.adresse}, ${config.ville}` }, { i: '✉️', l: 'Courriel', v: config.email }, { i: '📞', l: 'Téléphone', v: config.telephone }].map((info, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: [config.couleur1, config.couleur2, config.couleur3][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{info.i}</div>
                  <div>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>{info.l}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(0,0,0,.7)' }}>{info.v}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderLeft: `4px solid ${config.couleur3}`, padding: '16px 20px', marginTop: 24, marginBottom: 24 }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: config.couleur3, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Horaires</p>
              {horaires.map((h, i) => <p key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', marginBottom: 5 }}>{h}</p>)}
            </div>
            {/* Bande couleurs */}
            <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${config.couleur1}, ${config.couleur2}, ${config.couleur3}, ${config.couleur4}, ${config.couleur5})` }} />
            <div style={{ height: 220, overflow: 'hidden', marginTop: 20, border: `3px solid ${config.couleur1}` }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" title="Localisation" />
            </div>
          </div>
          <div style={{ background: '#fff', padding: '40px 36px', borderTop: `4px solid ${config.couleur1}`, borderLeft: `4px solid ${config.couleur2}` }}>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎨</div>
                <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: config.couleurTexte, letterSpacing: '0.04em', marginBottom: 12 }}>Message envoyé!</h3>
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: config.couleur1 }}>À très bientôt à l'atelier!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: config.couleurTexte, letterSpacing: '0.04em', marginBottom: 4 }}>Inscription ou renseignements</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  {[['Prénom *', 'prenom', 'Prénom'], ['Nom *', 'nom', 'Nom']].map(([label, key, ph]) => (
                    <div key={key}>
                      <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input className="fw-inp" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email *</label>
                  <input type="email" className="fw-inp" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.ca" />
                </div>
                <div>
                  <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Atelier souhaité</label>
                  <select className="fw-inp" value={form.cours} onChange={e => setForm({ ...form, cours: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Choisir un atelier...</option>
                    {cours.map((c, i) => <option key={i} value={c.titre}>{c.titre} ({c.medium}) — {c.prix}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Expérience artistique</label>
                  <select className="fw-inp" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Votre niveau...</option>
                    {['Aucune expérience', 'J\'ai déjà peint un peu', 'Débutant régulier', 'Intermédiaire', 'Artiste avancé'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea className="fw-inp" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Questions, objectifs, médium préféré..." style={{ resize: 'none' }} />
                </div>
              <button disabled={loading || !form.prenom || !form.email}
                  style={{ opacity: !form.prenom || !form.email ? .5 : 1, textAlign: 'center', padding: '16px', width: '100%' }}>
                  {loading ? '🎨 Envoi...' : '🖌️ Envoyer ma demande'}
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

function Footer({ config, setPage }: { config: ConfigEcolePeinture; setPage: (p: string) => void }) {
  const cours = ea(config.cours, CONFIG_PEINTURE_DEFAUT.cours);

  // 🟢 Badge "Propulsé par e-Vend Studio" — caché uniquement si le gestionnaire
  // a payé l'option "Cacher le branding" (table options_gestionnaire).
  const [cacherBadge, setCacherBadge] = useState(false);
  useEffect(() => {
    if (!config.vendeurId) return;
    fetch(`/api/branding-public/gestionnaire/${config.vendeurId}/cacher-propulse`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCacherBadge(!!d.cacher_propulse); })
      .catch(() => {}); // silencieux — badge visible par défaut si l'appel échoue
  }, [config.vendeurId]);

  return (
    <footer style={{ background: config.couleurSombre, padding: '60px 48px 0' }}>
      {/* Barre multicolore top */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${config.couleur1}, ${config.couleur2}, ${config.couleur3}, ${config.couleur4}, ${config.couleur5})`, margin: '-60px -48px 48px' }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <PaletteSVG couleurs={[config.couleur1, config.couleur2, config.couleur3, config.couleur4, config.couleur5]} />
            <div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: '#fff', letterSpacing: '0.04em' }}>{config.nomEcole}</p>
              <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 11, color: config.couleur3 }}>École d'arts visuels</p>
            </div>
          </div>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, color: config.couleur3, marginBottom: 16 }}>"{config.citation}"</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['instagram','📸'],['facebook','📘'],['youtube','📺']].map(([k,ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, textDecoration: 'none', transition: 'all .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = config.couleur1}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.15)'}>
                  {ico}
                </a>
              ) : null
            )}
          </div>
        </div>
        {[
          { titre: 'Navigation', liens: [['accueil','Accueil'],['cours-page','Ateliers'],['galerie-page','Galerie'],['professeurs-page','Artistes'],['contact-page','Contact']] },
          { titre: 'Ateliers', liens: cours.slice(0,4).map(c => ['cours-page', c.titre]) },
          { titre: 'Contact', liens: [[config.email,''],[config.telephone,''],[config.ville,'']] },
        ].map((col, ci) => (
          <div key={ci}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: [config.couleur1,config.couleur3,config.couleur2][ci], letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{col.titre}</p>
            {col.liens.map(([id,label],j) => (
              <p key={j} onClick={label ? () => setPage(id) : undefined}
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 7, cursor: label ? 'pointer' : 'default', transition: 'color .2s' }}
                onMouseEnter={e => { if(label)(e.currentTarget as HTMLParagraphElement).style.color=config.couleur3; }}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color='rgba(255,255,255,.4)'}>
                {label||id}
              </p>
            ))}
          </div>
        ))}
      </div>
      {/* Bottom bar multicolore */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '20px 0', maxWidth: 1320, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 14, color: 'rgba(255,255,255,.25)' }}>🎨 Créer, c'est vivre</p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomEcole}</p>
      </div>
      {!cacherBadge && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '12px 0', textAlign: 'center' as const }}>
          <a href="https://e-vendstudio.ca" target="_blank" rel="noreferrer" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: 'rgba(255,255,255,.25)', textDecoration: 'none' }}>
            Propulsé par e-Vend Studio
          </a>
        </div>
      )}
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateEcolePeintureProps {
  config?: Partial<ConfigEcolePeinture>;
  isPreview?: boolean;
  siteId?: number | string;
  reservationActive?: boolean;
  abonnementActive?: boolean;
}

export default function TemplateEcolePeinture({ config: partiel, isPreview, siteId, reservationActive, abonnementActive }: TemplateEcolePeintureProps) {
  const config: ConfigEcolePeinture = { ...CONFIG_PEINTURE_DEFAUT, ...partiel,
    couleur1: partiel?.couleur1 || CONFIG_PEINTURE_DEFAUT.couleur1,
    couleur2: partiel?.couleur2 || CONFIG_PEINTURE_DEFAUT.couleur2,
    couleur3: partiel?.couleur3 || CONFIG_PEINTURE_DEFAUT.couleur3,
    couleur4: partiel?.couleur4 || CONFIG_PEINTURE_DEFAUT.couleur4,
    couleur5: partiel?.couleur5 || CONFIG_PEINTURE_DEFAUT.couleur5,
  };

  const VALID_IDS = ['hero','stats','cours','horaires','galerie3d','apropos','professeurs','evenements','avis','formules','faq','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_PEINTURE_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_PEINTURE_DEFAUT.sections;
  config.titreAbonnements = partiel?.titreAbonnements ?? CONFIG_PEINTURE_DEFAUT.titreAbonnements;
  config.titreAbonnementsAccent = partiel?.titreAbonnementsAccent ?? CONFIG_PEINTURE_DEFAUT.titreAbonnementsAccent;

  config.stats          = ea(partiel?.stats,          CONFIG_PEINTURE_DEFAUT.stats);
  config.cours          = ea(partiel?.cours,           CONFIG_PEINTURE_DEFAUT.cours);
  config.oeuvresEleves  = ea(partiel?.oeuvresEleves,   CONFIG_PEINTURE_DEFAUT.oeuvresEleves);
  config.professeurs    = ea(partiel?.professeurs,     CONFIG_PEINTURE_DEFAUT.professeurs);
  config.avis           = ea(partiel?.avis,            CONFIG_PEINTURE_DEFAUT.avis);
  config.formules       = ea(partiel?.formules,        CONFIG_PEINTURE_DEFAUT.formules);
  config.faq            = ea(partiel?.faq,             CONFIG_PEINTURE_DEFAUT.faq);
  config.evenements     = ea(partiel?.evenements,      CONFIG_PEINTURE_DEFAUT.evenements);
  config.horaires       = ea(partiel?.horaires,        CONFIG_PEINTURE_DEFAUT.horaires);

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'cours':       return <SectionCours       config={config} setPage={handlePage} />;
      case 'horaires':    return <SectionHoraires    config={config} setPage={handlePage} siteId={siteId} reservationActive={!!reservationActive} />;
      case 'galerie3d':   return <SectionGalerie3D   config={config} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'professeurs': return <SectionProfesseurs config={config} />;
      case 'evenements':  return <SectionEvenements  config={config} setPage={handlePage} />;
      case 'avis':        return <SectionAvis        config={config} />;
      case 'formules':    return <SectionFormules    config={config} setPage={handlePage} siteId={siteId} abonnementActive={!!abonnementActive} />;
      case 'faq':         return <SectionFAQ         config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond }}>
      <style>{getStyle(config)}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 68 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'cours-page'        && (<><SectionCours        config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'galerie-page'      && (<><SectionGalerie3D    config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'professeurs-page'  && (<><SectionProfesseurs  config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page'      && (<><SectionContact      config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}