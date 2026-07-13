// src/templates/TemplateEcoleDanse.tsx
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template École de Danse
// Style : fond sombre #0a0a0f / magenta #e91e8c + or scène #ffd700
// Effets : rideau théâtre, silhouettes danseuses SVG, spotlight souris,
//          ondes sonores, paillettes, carrousel styles 3D
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AddonContact, { AddonTheme, AddonContactData, ChampFormulaire } from '../addons/contact/AddonContact';
import AddonReservationEcole, { AddonReservationTheme, AddonReservationData } from '../addons/reservation-ecole/AddonReservationEcole';
import AddonAbonnementEcole, { AddonAbonnementTheme, AddonAbonnementData } from '../addons/abonnement-ecole/AddonAbonnementEcole';

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface StyleDanse {
  id: string; nom: string; emoji: string; description: string;
  photo: string; couleurAccent: string; niveaux: string[];
}

export interface ProfesseurDanse {
  nom: string; titre: string; specialites: string[]; bio: string;
  photo: string; annees: number; palmares: string[]; citation: string;
}

export interface AvisDanse {
  texte: string; auteur: string; style: string;
  photo: string; note: number; depuis: string;
}

export interface FormulairePass {
  nom: string; prix: string; periode: string; description: string;
  inclus: string[]; couleur: string; populaire?: boolean;
}

export interface ConfigEcoleDanse {
  // 🟢 Injecté automatiquement par SitePreview.tsx via { ...configBD, vendeurId: Number(vendeurId||0) }
  // — le nom du champ est "vendeurId" dans tout le codebase, même s'il désigne un gestionnaire.
  vendeurId?: number;
  nomEcole: string; tagline: string; sousTagline: string;
  descriptionHero: string; descriptionAPropos: string;
  citation: string; auteurCitation: string; fondee: string;
  couleurFond: string; couleurMagenta: string; couleurOr: string;
  couleurViolet: string; couleurCyan: string; couleurFondSombre: string;
  photoHero: string; photoAPropos1: string; photoAPropos2: string; photoBanner: string;
  stats: { valeur: string; label: string; icone: string }[];
  stylesDanse: StyleDanse[];
  professeurs: ProfesseurDanse[];
  avis: AvisDanse[];
  pass: FormulairePass[];
  faq: { question: string; reponse: string }[];
  evenements: { titre: string; date: string; description: string; type: string; photo: string }[];
  adresse: string; ville: string; telephone: string; email: string;
  horairesStudio: string[];
  reseaux: { instagram?: string; facebook?: string; youtube?: string; tiktok?: string };
  coordGoogleMaps: string;
  sections: SectionConfig[];
}

export const CONFIG_DANSE_DEFAUT: ConfigEcoleDanse = {
  nomEcole: 'Studio Éclat',
  tagline: 'Dansez.',
  sousTagline: 'Brillez.',
  descriptionHero: 'Bienvenue dans l\'univers de la danse — un espace où chaque mouvement est une histoire, chaque cours une transformation. Ballet, hip-hop, contemporain, salsa : trouvez votre rythme.',
  descriptionAPropos: 'Fondé en 2010 par la danseuse étoile Isabelle Morin, Studio Éclat est devenu le studio de référence de Montréal. Nos 450 élèves de tous âges y découvrent, progressent et brillent sur scène chaque saison.',
  citation: 'La danse est le langage secret de l\'âme.',
  auteurCitation: 'Martha Graham',
  fondee: '2010',
  couleurFond: '#0a0a0f',
  couleurMagenta: '#e91e8c',
  couleurOr: '#ffd700',
  couleurViolet: '#7c3aed',
  couleurCyan: '#00d4ff',
  couleurFondSombre: '#050508',
  photoHero: 'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos2: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoBanner: 'https://images.pexels.com/photos/358010/pexels-photo-358010.jpeg?auto=compress&cs=tinysrgb&w=1600',
  stats: [
    { valeur: '450+', label: 'Élèves actifs',      icone: '💃' },
    { valeur: '14',   label: 'Styles enseignés',   icone: '🎭' },
    { valeur: '32',   label: 'Cours / semaine',    icone: '📅' },
    { valeur: '15',   label: 'Ans d\'expérience', icone: '⭐' },
  ],
  stylesDanse: [
    { id:'ballet', nom:'Ballet Classique', emoji:'🩰', description:'La noblesse du mouvement pur. Technique académique pour développer grâce, force et discipline.', photo:'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#e91e8c', niveaux:['Initiation','Niveau 1','Niveau 2','Avancé','Pointes'] },
    { id:'hiphop', nom:'Hip-Hop & Urban', emoji:'🎤', description:'Groove, style, énergie. Du breakdance au new style, exprimez votre personnalité.', photo:'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#ffd700', niveaux:['Débutant','Intermédiaire','Avancé','Battle prep'] },
    { id:'contemporain', nom:'Contemporain', emoji:'🌊', description:'Liberté totale du corps. Fusion de techniques qui libère le mouvement et l\'expression artistique.', photo:'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#00d4ff', niveaux:['Découverte','Intermédiaire','Avancé'] },
    { id:'salsa', nom:'Salsa & Latin', emoji:'🌺', description:'Feu et sensualité. Salsa, bachata, merengue — laissez le rythme latin vous emporter.', photo:'https://images.pexels.com/photos/358010/pexels-photo-358010.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#ff6b35', niveaux:['Débutant','Social','Chorégraphie','Performance'] },
    { id:'jazz', nom:'Jazz & Show', emoji:'✨', description:'Showmanship et technique. Personnalité explosive, fouettés et grandes lignes pour briller sur scène.', photo:'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#7c3aed', niveaux:['Initiation','Niveau 1','Scène','Compétition'] },
    { id:'eveil', nom:'Éveil & Enfants', emoji:'🌸', description:'Pour les 3-8 ans. Découverte du corps, de la musique et du mouvement dans un univers ludique.', photo:'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800', couleurAccent:'#4caf50', niveaux:['3-5 ans','6-8 ans'] },
  ],
  professeurs: [
    { nom:'Isabelle Morin', titre:'Fondatrice & Professeure Ballet', specialites:['Ballet classique','Pointes','Contemporain'], bio:'Ancienne danseuse étoile des Grands Ballets Canadiens pendant 12 ans, Isabelle apporte une expertise rare et une pédagogie chaleureuse. Ses élèves ont intégré les meilleures compagnies au monde.', photo:'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', annees:20, palmares:['Danseuse étoile GBC 2005-2017','Prix d\'excellence pédagogique 2021','Chorégraphe Festival MTL en lumière'], citation:'Chaque élève porte en lui une danse unique — mon rôle est de l\'aider à la révéler.' },
    { nom:'Karim Touré', titre:'Professeur Hip-Hop & Urban', specialites:['Hip-Hop','Breaking','New Style'], bio:'Champion du Québec de breakdance 2018 et 2020, Karim a tourné avec des artistes internationaux. Son énergie contagieuse fait de ses cours des expériences inoubliables.', photo:'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400', annees:10, palmares:['Champion Québec Breaking 2018 & 2020','Juge Red Bull BC One 2022'], citation:'Le hip-hop, c\'est ton histoire que tu racontes avec ton corps.' },
    { nom:'Léa Dubois', titre:'Professeure Contemporain & Jazz', specialites:['Danse contemporaine','Jazz show','Improvisation'], bio:'Formée au Conservatoire de danse de Paris, Léa mêle technique académique et recherche corporelle pour des cours qui transforment le regard sur le mouvement.', photo:'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400', annees:12, palmares:['Diplôme Conservatoire Paris','Chorégraphe Festif 2023'], citation:'Dansez comme si personne ne regardait — puis faites-le comme si tout le monde regardait.' },
    { nom:'Carlos Reyes', titre:'Professeur Latin & Salsa', specialites:['Salsa On2','Bachata','Merengue'], bio:'Né à Cali, berceau de la salsa, Carlos a dansé sur 3 continents. Champion de salsa sociale, il transforme même les deux pieds gauches en partenaires de danse.', photo:'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=400', annees:15, palmares:['Champion salsa Montréal 2019','Artiste résident Festival Latino'], citation:'La salsa n\'est pas une danse — c\'est une conversation.' },
  ],
  avis: [
    { texte:'J\'ai commencé le ballet à 32 ans. Deux ans plus tard, j\'ai joué dans le spectacle devant 500 personnes. La meilleure décision de ma vie!', auteur:'Marie-Hélène Côté', style:'Ballet', photo:'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note:5, depuis:'Élève depuis 2 ans' },
    { texte:'Karim est un prof extraordinaire. Mes fils ont arrêté les jeux vidéo pour venir danser 3 fois par semaine. Je ne savais pas que c\'était possible!', auteur:'Sylvie Tremblay', style:'Hip-Hop', photo:'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note:5, depuis:'Membre depuis 1 an' },
    { texte:'Carlos a transformé mon rapport à la danse sociale. Maintenant je suis sur la piste toute la nuit. La salsa de Studio Éclat, c\'est magique!', auteur:'Jean-Paul Arsenault', style:'Salsa', photo:'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200', note:5, depuis:'Élève depuis 6 mois' },
    { texte:'Ma fille de 5 ans attend le samedi matin avec une impatience folle pour son éveil à la danse. Julie est merveilleuse avec les enfants!', auteur:'Nathalie Beauchamp', style:'Éveil', photo:'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=200', note:5, depuis:'Membre depuis 8 mois' },
  ],
  pass: [
    { nom:'Découverte', prix:'79$', periode:'/mois', description:'2 cours par mois dans le style de votre choix.', inclus:['2 cours au choix','Essai premier cours gratuit','Accès vestiaires'], couleur:'#00d4ff', populaire:false },
    { nom:'Danseur', prix:'149$', periode:'/mois', description:'Notre pass le plus populaire — dansez à votre rythme.', inclus:['6 cours/mois','Vidéos récap chorégraphies','Réduction boutique 10%','Invité 1x/mois','Priorité spectacle annuel'], couleur:'#e91e8c', populaire:true },
    { nom:'Étoile', prix:'249$', periode:'/mois', description:'Pour qui veut tout — technique, scène et communauté.', inclus:['Cours illimités','1 cours privé/mois','Participation spectacles','Costume offert','Séance photo pro'], couleur:'#ffd700', populaire:false },
  ],
  faq: [
    { question:'Faut-il avoir de l\'expérience pour s\'inscrire?', reponse:'Aucune! Tous nos styles ont des niveaux Initiation conçus pour les personnes sans expérience. L\'important c\'est l\'envie — pas le passé.' },
    { question:'À partir de quel âge peut-on danser?', reponse:'Dès 3 ans avec notre éveil à la danse! Et il n\'y a pas d\'âge maximum — nous avons des élèves de 70 ans qui dansent la salsa avec le même enthousiasme que nos ados.' },
    { question:'Dois-je acheter des chaussures spéciales?', reponse:'Pour commencer, des chaussures souples suffisent. Notre équipe peut vous conseiller lors de votre premier cours — qui est toujours gratuit!' },
    { question:'Y a-t-il des spectacles de fin d\'année?', reponse:'Oui! Chaque juin, tous nos élèves montent sur scène pour notre Gala annuel devant 800 personnes. Un moment magique que tout le monde attend.' },
    { question:'Peut-on changer de cours si le niveau ne convient pas?', reponse:'Absolument! Nous évaluons votre niveau dès les premières séances et vous orientons librement entre les groupes.' },
  ],
  evenements: [
    { titre:'Gala Annuel — Lumière', date:'14 juin 2026', description:'Le grand spectacle de fin d\'année. 400 danseurs, 25 chorégraphies, 800 spectateurs. Un soir inoubliable!', type:'Spectacle', photo:'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { titre:'Stage Intensif Hip-Hop', date:'5-7 juillet 2026', description:'Un week-end immersif avec Karim et artiste invité de Paris. Battle le dimanche soir.', type:'Stage', photo:'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { titre:'Soirée Latin — Bailamos!', date:'26 juillet 2026', description:'Soirée sociale salsa & bachata ouverte à tous niveaux. DJ live, buffet, initiation à 19h.', type:'Soirée', photo:'https://images.pexels.com/photos/358010/pexels-photo-358010.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { titre:'Auditions Compagnie Jeunesse', date:'15 août 2026', description:'Rejoignez notre compagnie semi-professionnelle 15-25 ans. Tous styles. Tournée automne 2026.', type:'Audition', photo:'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=600' },
  ],
  adresse: '3500 avenue du Parc, Suite 200',
  ville: 'Montréal, QC H2X 2H7',
  telephone: '(514) 555-0360',
  email: 'bonjour@studio-eclat.ca',
  horairesStudio: ['Lun – Ven : 15h – 22h', 'Samedi : 9h – 19h', 'Dimanche : 10h – 17h'],
  reseaux: { instagram:'#', facebook:'#', youtube:'#', tiktok:'#' },
  coordGoogleMaps: '', // vide = génération auto depuis adresse+ville (voir getUrlMaps)
  sections: [
    { id:'hero',        actif:true, ordre:1,  label:'Hero + Rideau + Silhouettes' },
    { id:'stats',       actif:true, ordre:2,  label:'Chiffres clés' },
    { id:'styles',      actif:true, ordre:3,  label:'Styles de danse' },
    { id:'horaires',    actif:true, ordre:4,  label:'Horaires & Cours' },
    { id:'apropos',     actif:true, ordre:5,  label:'À propos du studio' },
    { id:'professeurs', actif:true, ordre:6,  label:'Nos professeurs' },
    { id:'evenements',  actif:true, ordre:7,  label:'Événements à venir' },
    { id:'avis',        actif:true, ordre:8,  label:'Témoignages' },
    { id:'pass',        actif:true, ordre:9,  label:'Abonnements' },
    { id:'faq',         actif:true, ordre:10, label:'FAQ' },
    { id:'contact',     actif:true, ordre:11, label:'Contact & Inscription' },
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
  if (Array.isArray(val) && val.length > 0) return val;
  // Si c'est un objet avec des clés numériques (JSON mal parsé), convertir en tableau
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const arr = Object.values(val) as T[];
    if (arr.length > 0) return arr;
  }
  return def;
}

// ─── STYLES CSS ───────────────────────────────────────────────────────────────

const getStyle = (c: ConfigEcoleDanse) => `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Poppins:wght@300;400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
@keyframes rideauG { from{transform:translateX(0)} to{transform:translateX(-100%)} }
@keyframes rideauD { from{transform:translateX(0)} to{transform:translateX(100%)} }
@keyframes paillette { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
@keyframes ondeBar  { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes glow     { 0%,100%{box-shadow:0 0 20px ${c.couleurMagenta}40} 50%{box-shadow:0 0 50px ${c.couleurMagenta}80} }
@keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes spotlight{ 0%,100%{opacity:.15} 50%{opacity:.22} }
.rv  {opacity:0;transform:translateY(32px);transition:opacity .9s,transform .9s;}
.rv.vis{opacity:1;transform:none;}
.rv-l{opacity:0;transform:translateX(-44px);transition:opacity .9s,transform .9s;}
.rv-l.vis{opacity:1;transform:none;}
.rv-r{opacity:0;transform:translateX(44px);transition:opacity .9s,transform .9s;}
.rv-r.vis{opacity:1;transform:none;}
.btn-m{background:${c.couleurMagenta};color:#fff;border:none;padding:15px 40px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;border-radius:50px;transition:all .3s;box-shadow:0 6px 30px ${c.couleurMagenta}60;}
.btn-m:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 12px 40px ${c.couleurMagenta}80;}
.btn-o{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.5);padding:14px 38px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;border-radius:50px;transition:all .3s;}
.btn-o:hover{background:rgba(255,255,255,.1);border-color:#fff;transform:translateY(-2px);}
.nav-d{font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.8);cursor:pointer;background:none;border:none;transition:color .2s;position:relative;padding:4px 0;}
.nav-d::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:2px;background:${c.couleurMagenta};transform:scaleX(0);transition:transform .3s;}
.nav-d:hover,.nav-d.active{color:${c.couleurMagenta};}
.nav-d:hover::after,.nav-d.active::after{transform:scaleX(1);}
.faq-btn{width:100%;background:none;border:none;cursor:pointer;padding:20px 0;display:flex;justify-content:space-between;align-items:center;font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:#fff;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);transition:color .2s;}
.faq-btn:hover{color:${c.couleurMagenta};}
.fw-inp{width:100%;padding:13px 16px;background:rgba(255,255,255,.06);border:none;border-bottom:1.5px solid rgba(255,255,255,.2);color:#fff;font-family:'Poppins',sans-serif;font-size:14px;outline:none;box-sizing:border-box;transition:border-color .2s;}
.fw-inp:focus{border-bottom-color:${c.couleurMagenta};}
.fw-inp::placeholder{color:rgba(255,255,255,.3);}
.fw-inp option{background:#1a1a2e;color:#fff;}
.hr-row{display:grid;grid-template-columns:110px 1fr 90px 90px 60px;gap:12px;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.06);transition:background .2s;}
.hr-row:hover{background:rgba(255,255,255,.04);}
`;

// ─── RIDEAU ───────────────────────────────────────────────────────────────────

function Rideau({ onFin }: { onFin: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOuvert(true), 500);
    const t2 = setTimeout(onFin, 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (!ouvert && typeof window === 'undefined') return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', pointerEvents:ouvert?'none':'all' }}>
      <div style={{ flex:1, background:'linear-gradient(90deg,#1a0010,#3d0025 50%,#2d0018)', animation:ouvert?'rideauG 1.2s cubic-bezier(.7,0,.3,1) forwards':'none', position:'relative' }}>
        {[15,32,48,64,80].map((x,i) => <div key={i} style={{ position:'absolute', left:`${x}%`, top:0, bottom:0, width:2, background:'rgba(0,0,0,.3)' }} />)}
      </div>
      <div style={{ flex:1, background:'linear-gradient(270deg,#1a0010,#3d0025 50%,#2d0018)', animation:ouvert?'rideauD 1.2s cubic-bezier(.7,0,.3,1) forwards':'none', position:'relative' }}>
        {[20,36,52,68,84].map((x,i) => <div key={i} style={{ position:'absolute', left:`${x}%`, top:0, bottom:0, width:2, background:'rgba(0,0,0,.3)' }} />)}
      </div>
    </div>
  );
}

// ─── SILHOUETTES SVG ──────────────────────────────────────────────────────────


// ─── ONDES SONORES ────────────────────────────────────────────────────────────

function Ondes({ c1, c2 }: { c1: string; c2: string }) {
  const { isMobile } = useIsMobile();
  const bars = Array.from({length:24}, (_,i) => ({
    h: 15 + Math.random()*70,
    delay: Math.random()*2,
    dur: .5 + Math.random(),
    col: i%3===0?c2:i%3===1?c1:'rgba(255,255,255,.4)',
  }));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:70, padding:'0 16px' }}>
      {bars.map((b,i) => (
        <div key={i} style={{ flex:1, background:b.col, borderRadius:'3px 3px 0 0', opacity:.65, animation:`ondeBar ${b.dur}s ${b.delay}s ease-in-out infinite`, transformOrigin:'bottom', minHeight:6, height:b.h }} />
      ))}
    </div>
  );
}

// ─── PAILLETTES ───────────────────────────────────────────────────────────────

function Paillettes({ actif, couleurs }: { actif: boolean; couleurs: string[] }) {
  const { isMobile } = useIsMobile();
  if (!actif) return null;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9000, overflow:'hidden' }}>
      {Array.from({length:40}, (_,i) => (
        <div key={i} style={{ position:'absolute', left:`${Math.random()*100}%`, top:'-10px', width:4+Math.random()*8, height:4+Math.random()*8, borderRadius:Math.random()>.5?'50%':'1px', background:couleurs[i%couleurs.length], animation:`paillette ${3+Math.random()*2}s ${Math.random()*1.5}s ease-in forwards` }} />
      ))}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigEcoleDanse; page: string; setPage:(p:string)=>void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setMenuOuvert(false); }, [page]); // fermer le menu après avoir choisi une page
  useEffect(() => {
    if (isMobile && menuOuvert) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isMobile, menuOuvert]);
  const liens = [['accueil','Accueil'],['styles-page','Styles'],['horaires-page','Horaires'],['professeurs-page','Professeurs'],['contact-page',"S'inscrire"]];
  const cm = config.couleurMagenta;
  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:scrolled?'rgba(10,10,15,.97)':'rgba(10,10,15,.88)', backdropFilter:'blur(16px)', borderBottom:scrolled?`1px solid ${cm}30`:'none', transition:'all .4s', padding:isMobile?'0 14px':'0 48px', width:'100%', boxSizing:'border-box' }}>
      <div style={{ maxWidth:1320, margin:'0 auto', height:68, display:'flex', flexWrap:'nowrap', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div onClick={() => setPage('accueil')} style={{ cursor:'pointer', minWidth:0, flex:'1 1 auto', overflow:'hidden' }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:10, color:cm, letterSpacing:'0.3em', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Studio de Danse</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:isMobile?19:24, fontWeight:600, color:'#fff', letterSpacing:'0.06em', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{config.nomEcole}</p>
        </div>

        {isMobile ? (
          <button onClick={() => setMenuOuvert(v => !v)} aria-label="Menu"
            style={{ background:'none', border:'none', width:36, height:36, flexShrink:0, flexGrow:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <div style={{ width:20, display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ height:2, background:menuOuvert?cm:'#fff', width:'100%', transition:'all .25s', transform:menuOuvert?'translateY(7px) rotate(45deg)':'none' }} />
              <span style={{ height:2, background:'#fff', width:'100%', opacity:menuOuvert?0:1, transition:'opacity .2s' }} />
              <span style={{ height:2, background:menuOuvert?cm:'#fff', width:'100%', transition:'all .25s', transform:menuOuvert?'translateY(-7px) rotate(-45deg)':'none' }} />
            </div>
          </button>
        ) : (
          <>
            <div style={{ display:'flex', gap:32 }}>
              {liens.map(([id,label]) => <button key={id} className={`nav-d${page===id?' active':''}`} onClick={() => setPage(id)}>{label}</button>)}
            </div>
            <button className="btn-m" onClick={() => setPage('contact-page')} style={{ padding:'10px 24px', fontSize:11 }}>💃 Premier cours gratuit</button>
          </>
        )}
      </div>

      {/* Panneau mobile — plein écran, au-dessus de tout, scroll de fond verrouillé */}
      {isMobile && menuOuvert && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'#0a0a0f', display:'flex', flexDirection:'column', boxSizing:'border-box' }}>
          <div style={{ height:68, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:`1px solid ${cm}20` }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, fontWeight:600, color:'#fff', margin:0 }}>{config.nomEcole}</p>
            <button onClick={() => setMenuOuvert(false)} aria-label="Fermer"
              style={{ background:'none', border:'none', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:22, flexShrink:0 }}>
              ✕
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', padding:'20px 20px 32px', gap:4, WebkitOverflowScrolling:'touch' }}>
            {liens.map(([id,label]) => (
              <button key={id} onClick={() => setPage(id)}
                style={{ textAlign:'left', background:page===id?`${cm}15`:'none', border:'none', borderLeft:page===id?`3px solid ${cm}`:'3px solid transparent', padding:'16px 14px', fontFamily:"'Poppins',sans-serif", fontSize:16, fontWeight:600, color:page===id?cm:'#fff', cursor:'pointer', borderRadius:'0 8px 8px 0' }}>
                {label}
              </button>
            ))}
            <button className="btn-m" onClick={() => setPage('contact-page')} style={{ marginTop:16, padding:'16px', fontSize:13, width:'100%', boxSizing:'border-box' }}>💃 Premier cours gratuit</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function SectionHero({ config, setPage, rideauFini }: { config:ConfigEcoleDanse; setPage:(p:string)=>void; rideauFini:boolean }) {
  const { isMobile } = useIsMobile();
  const cm = config.couleurMagenta; const co = config.couleurOr;
  const [spot, setSpot] = useState({ x:60, y:40 });
  const [paillettes, setPaillettes] = useState(false);
  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSpot({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 });
  }, []);
  useEffect(() => {
    if (!rideauFini) return;
    const t = setTimeout(() => { setPaillettes(true); setTimeout(() => setPaillettes(false), 4000); }, 800);
    return () => clearTimeout(t);
  }, [rideauFini]);
  const styles = ea(config.stylesDanse, CONFIG_DANSE_DEFAUT.stylesDanse);
  return (
    <section onMouseMove={handleMove} style={{ background:config.couleurFond, minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', paddingTop:68 }}>
      <Paillettes actif={paillettes} couleurs={[cm, co, config.couleurViolet, config.couleurCyan, '#fff']} />
      <div style={{ position:'absolute', inset:0, backgroundImage:`url(${config.photoHero})`, backgroundSize:'cover', backgroundPosition:'center 30%', filter:'brightness(0.18)' }} />
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle 380px at ${spot.x}% ${spot.y}%, rgba(255,255,255,.11) 0%, transparent 70%)`, transition:'background .08s ease', animation:'spotlight 4s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, ${config.couleurFond}ee 0%, ${config.couleurFond}99 35%, transparent 52%)`, pointerEvents:'none' }} />
      <div style={{ flex:1, position:'relative', zIndex:3, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:isMobile?'48px 20px':'60px 48px', width:'100%', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?24:60, alignItems:'center' }}>
          <div>
            <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:20, color:co, marginBottom:14, animation:'fadeUp .7s ease both' }}>🎭 Bienvenue à {config.nomEcole}</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(72px,11vw,140px)', fontWeight:700, color:'#fff', lineHeight:.9, letterSpacing:'-.01em', marginBottom:6, animation:'fadeUp .8s .1s ease both' }}>{config.tagline}</h1>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'clamp(72px,11vw,140px)', fontWeight:300, lineHeight:.9, marginBottom:28, animation:'fadeUp .8s .15s ease both', background:`linear-gradient(135deg,${cm},${co},${config.couleurViolet})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{config.sousTagline}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22, animation:'fadeUp .8s .2s ease both' }}>
              <div style={{ height:1, width:60, background:`linear-gradient(90deg,${cm},transparent)` }} />
              <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:16, color:'rgba(255,255,255,.45)', fontStyle:'italic' }}>{config.citation}</p>
            </div>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, color:'rgba(255,255,255,.6)', lineHeight:1.9, maxWidth:480, marginBottom:44, animation:'fadeUp .8s .3s ease both' }}>{config.descriptionHero}</p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', animation:'fadeUp .8s .4s ease both' }}>
              <button className="btn-m" onClick={() => setPage('styles-page')}>Nos styles de danse</button>
              <button className="btn-o" onClick={() => { setPaillettes(true); setTimeout(() => setPaillettes(false), 4000); }}>✨ Paillettes!</button>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:28, animation:'fadeUp .8s .5s ease both' }}>
              {styles.map(s => <span key={s.id} style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, padding:'4px 12px', borderRadius:20, background:`${s.couleurAccent}20`, border:`1px solid ${s.couleurAccent}50`, color:s.couleurAccent, fontWeight:600 }}>{s.emoji} {s.nom}</span>)}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, position:'relative', zIndex:8 }}>
            <Ondes c1={cm} c2={co} />
          </div>
        </div>
      </div>
      <Ondes c1={`${cm}50`} c2={`${co}40`} />
    </section>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function SectionStats({ config }: { config:ConfigEcoleDanse }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.1);
  const stats = ea(config.stats, CONFIG_DANSE_DEFAUT.stats);
  const cols = [config.couleurMagenta, config.couleurOr, config.couleurViolet, config.couleurCyan];
  return (
    <section style={{ background:'#0f0f1a', padding:0 }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)' }}>
        {stats.map((s,i) => (
          <div key={i} style={{ padding:'48px 24px', textAlign:'center', borderRight:i<3?'1px solid rgba(255,255,255,.06)':'none', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at center,${cols[i]}08,transparent)` }} />
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:36, marginBottom:12, animation:`float 3s ${i*.5}s ease-in-out infinite` }}>{s.icone}</div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(40px,5vw,64px)', fontWeight:700, color:cols[i], lineHeight:1, marginBottom:8, textShadow:`0 0 30px ${cols[i]}60` }}>{s.valeur}</p>
              <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'rgba(255,255,255,.45)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── STYLES DE DANSE ──────────────────────────────────────────────────────────

function SectionStyles({ config, setPage }: { config:ConfigEcoleDanse; setPage:(p:string)=>void }) {
  const { isMobile, isTablet } = useIsMobile();
  const rv = useReveal(.05);
  const styles = ea(config.stylesDanse, CONFIG_DANSE_DEFAUT.stylesDanse);
  const [actif, setActif] = useState(0);
  const s = styles[actif] || styles[0];
  const isSmall = isMobile || isTablet;
  return (
    <section style={{ background:config.couleurFond, padding:'100px 0' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`}>
        <div style={{ maxWidth:1320, margin:'0 auto 36px', padding:isMobile?'0 20px':'0 48px' }}>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:config.couleurMagenta, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:12 }}>Nos disciplines</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(36px,5vw,72px)', fontWeight:600, color:'#fff', lineHeight:1.05 }}>
            Choisissez votre <em style={{ fontStyle:'italic', color:config.couleurMagenta }}>style</em>
          </h2>
        </div>
        <div style={{ display:'flex', flexDirection:isSmall?'column':'row', gap:0, overflowX:isSmall?'visible':'auto', padding:isMobile?'0 20px':'0 48px', marginBottom:48, scrollbarWidth:'none' as any, msOverflowStyle:'none' as any, WebkitOverflowScrolling:'touch' as any }}>
          {styles.map((st,i) => (
            <button key={i} onClick={() => setActif(i)} style={{ flexShrink:0, padding:'14px 24px', cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', background:actif===i?st.couleurAccent:'transparent', color:actif===i?'#fff':'rgba(255,255,255,.5)', border:'none', borderBottom:`3px solid ${actif===i?st.couleurAccent:'transparent'}`, transition:'all .3s' }}>
              {st.emoji} {st.nom}
            </button>
          ))}
        </div>
        <div key={actif} style={{ maxWidth:1320, margin:'0 auto', padding:isMobile?'0 20px':'0 48px', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?24:60, alignItems:'center', animation:'fadeUp .5s ease both' }}>
          <div style={{ position:'relative', overflow:'hidden', height:440 }}>
            <img src={s.photo} alt={s.nom} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.65)' }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${s.couleurAccent}30,transparent)` }} />
            <div style={{ position:'absolute', top:24, left:24, fontSize:56 }}>{s.emoji}</div>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'40px 28px 24px', background:`linear-gradient(to top,${config.couleurFond},transparent)` }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:'#fff' }}>{s.nom}</p>
            </div>
          </div>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'rgba(255,255,255,.75)', lineHeight:1.8, marginBottom:32 }}>{s.description}</p>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Niveaux disponibles</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:36 }}>
              {(s.niveaux || []).map((n,j) => (
                <div key={j} style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, padding:'8px 18px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.8)', borderRadius:4, fontWeight:600, cursor:'default', transition:'all .2s' }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.background=`${s.couleurAccent}20`; el.style.borderColor=s.couleurAccent; el.style.color=s.couleurAccent; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.background='rgba(255,255,255,.06)'; el.style.borderColor='rgba(255,255,255,.12)'; el.style.color='rgba(255,255,255,.8)'; }}>
                  {n}
                </div>
              ))}
            </div>
            <button className="btn-m" onClick={() => setPage('contact-page')} style={{ background:s.couleurAccent, boxShadow:`0 6px 30px ${s.couleurAccent}50` }}>
              S'inscrire en {s.nom}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


// ─── HORAIRES ─────────────────────────────────────────────────────────────────
// Add-on injectable — src/addons/reservation-ecole/AddonReservationEcole.tsx
// Ce bloc est SEULEMENT l'adaptateur de thème, comme pour AddonContact.
function SectionHoraires({ config, setPage, siteId, reservationActive }: { config:ConfigEcoleDanse; setPage:(p:string)=>void; siteId?:number|string; reservationActive?:boolean }) {
  const themeReservation: AddonReservationTheme = {
    primary: config.couleurMagenta,
    accentSecondaire: config.couleurOr,
    bg: '#0f0f1a',
    cardBg: 'rgba(255,255,255,.03)',
    border: 'rgba(255,255,255,.08)',
    text: '#fff',
    textDim: 'rgba(255,255,255,.5)',
    fontTitre: "'Cormorant Garamond',serif",
    fontTexte: "'Poppins',sans-serif",
  };
  const styles = ea(config.stylesDanse, CONFIG_DANSE_DEFAUT.stylesDanse);
  const dataReservation: AddonReservationData = {
    siteId, reservationActive,
    titreLabel: 'Planning',
    titre: 'Horaires du',
    titreAccent: 'studio',
    labelBoutonHeader: 'Réserver une place',
    onClicBoutonHeader: () => setPage('contact-page'),
    couleurParStyle: (style: string) => styles.find(s => (s.nom || '').toLowerCase().includes((style || '').toLowerCase()) || (style || '').toLowerCase().includes(s.id || ''))?.couleurAccent,
  };
  return <AddonReservationEcole theme={themeReservation} data={dataReservation} />;
}
// ─── À PROPOS ─────────────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config:ConfigEcoleDanse }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(.08); const rvR = useReveal(.08);
  const cm = config.couleurMagenta; const co = config.couleurOr;
  return (
    <section style={{ background:config.couleurFond, padding:isMobile?'60px 20px':'100px 48px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:5, background:`linear-gradient(180deg,${cm},${co},${config.couleurViolet})` }} />
      <div style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?32:80, alignItems:'center' }}>
        <div ref={rvL.ref} className={`rv-l${rvL.vis?' vis':''}`} style={{ position:'relative' }}>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:10 }}>
            <div style={{ gridColumn:'1/3', height:300, overflow:'hidden', border:`2px solid ${cm}40` }}>
              <img src={config.photoAPropos1} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
            </div>
            <div style={{ height:220, overflow:'hidden', border:`2px solid ${co}40` }}>
              <img src={config.photoAPropos2} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
            </div>
            <div style={{ height:220, background:`linear-gradient(135deg,${cm}30,${config.couleurViolet}30)`, border:`2px solid ${cm}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center', padding:'0 16px' }}>
                <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:20, color:co, lineHeight:1.5, marginBottom:8 }}>"{config.citation}"</p>
                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'rgba(255,255,255,.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>— {config.auteurCitation}</p>
              </div>
            </div>
          </div>
          <div style={{ position:'absolute', top:-16, right:-16, width:84, height:84, borderRadius:'50%', background:`linear-gradient(135deg,${cm},${config.couleurViolet})`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 32px ${cm}50` }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>{config.fondee}</p>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:8, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Fondé</p>
          </div>
        </div>
        <div ref={rvR.ref} className={`rv-r${rvR.vis?' vis':''}`}>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:cm, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Notre histoire</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,4vw,54px)', fontWeight:600, color:'#fff', lineHeight:1.15, marginBottom:24 }}>Plus qu'un studio —<br /><em style={{ fontStyle:'italic', color:cm }}>une famille</em></h2>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, color:'rgba(255,255,255,.55)', lineHeight:1.9, marginBottom:28 }}>{config.descriptionAPropos}</p>
          {[['💃','Tous styles',"6 disciplines, de l'éveil enfant à la compétition"],['🌟','Tous niveaux',"De l'absolu débutant au semi-professionnel"],['🎭','Scène réelle',"Nos élèves montent sur scène chaque année"],['❤️','Communauté','450 danseurs qui grandissent ensemble']].map(([ico,titre,desc]) => (
            <div key={titre} style={{ display:'flex', gap:14, marginBottom:16, alignItems:'flex-start' }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{ico}</span>
              <div>
                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{titre}</p>
                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,.4)' }}>{desc}</p>
              </div>
            </div>
          ))}
          <button className="btn-m" style={{ marginTop:16 }}>Visiter le studio 🎭</button>
        </div>
      </div>
    </section>
  );
}

// ─── PROFESSEURS ──────────────────────────────────────────────────────────────

function SectionProfesseurs({ config }: { config:ConfigEcoleDanse }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const profs = ea(config.professeurs, CONFIG_DANSE_DEFAUT.professeurs);
  const [actif, setActif] = useState<number|null>(null);
  const cols = [config.couleurMagenta, config.couleurOr, config.couleurCyan, config.couleurViolet];
  return (
    <section style={{ background:'#0f0f1a', padding:isMobile?'60px 20px':'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:config.couleurMagenta, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>L'équipe</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(36px,5vw,68px)', fontWeight:600, color:'#fff', lineHeight:1.05 }}>Nos <em style={{ fontStyle:'italic', color:config.couleurMagenta }}>artistes-professeurs</em></h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':`repeat(${Math.min(profs.length,4)},1fr)`, gap:20 }}>
          {profs.map((p,i) => {
            const col = cols[i%cols.length];
            return (
              <div key={i} onClick={() => setActif(actif===i?null:i)} style={{ cursor:'pointer', overflow:'hidden', border:`2px solid ${actif===i?col:'rgba(255,255,255,.08)'}`, transition:'all .4s', transform:actif===i?'translateY(-6px)':'none', boxShadow:actif===i?`0 20px 60px ${col}30`:'none' }}>
                <div style={{ height:280, overflow:'hidden', position:'relative' }}>
                  <img src={p.photo} alt={p.nom} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'brightness(.75)', transition:'transform .6s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,10,15,.95),transparent 50%)' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:16 }}>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#fff', marginBottom:4 }}>{p.nom}</p>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {(p.specialites || []).slice(0,2).map((sp,j) => <span key={j} style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, padding:'2px 8px', background:`${col}30`, border:`1px solid ${col}50`, color:col, borderRadius:10, fontWeight:700 }}>{sp}</span>)}
                    </div>
                  </div>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:col }} />
                </div>
                <div style={{ padding:'16px 18px', background:'rgba(255,255,255,.03)' }}>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:col, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{p.titre}</p>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.6 }}>{(p.bio || '').slice(0,100)}...</p>
                  <div style={{ maxHeight:actif===i?280:0, overflow:'hidden', transition:'max-height .45s ease' }}>
                    <blockquote style={{ borderLeft:`3px solid ${col}`, paddingLeft:14, margin:'14px 0' }}>
                      <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:16, color:col, lineHeight:1.4 }}>"{p.citation || ''}"</p>
                    </blockquote>
                    {(p.palmares || []).map((pa,j) => <p key={j} style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:5, paddingLeft:8, borderLeft:`2px solid ${col}30` }}>🏆 {pa}</p>)}
                  </div>
                  <p style={{ marginTop:10, color:col, fontSize:11, fontFamily:"'Poppins',sans-serif", fontWeight:700 }}>{actif===i?'↑ Masquer':`${p.annees} ans d'expérience ↓`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── ÉVÉNEMENTS ───────────────────────────────────────────────────────────────

function SectionEvenements({ config, setPage }: { config:ConfigEcoleDanse; setPage:(p:string)=>void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const evs = ea(config.evenements, CONFIG_DANSE_DEFAUT.evenements);
  const cols = [config.couleurMagenta, config.couleurOr, config.couleurCyan, config.couleurViolet];
  return (
    <section style={{ background:config.couleurFond, padding:isMobile?'60px 20px':'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48 }}>
          <div>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:config.couleurOr, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:12 }}>Agenda</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(36px,5vw,68px)', fontWeight:600, color:'#fff', lineHeight:1.05 }}>Événements à <em style={{ fontStyle:'italic', color:config.couleurOr }}>venir</em></h2>
          </div>
          <button className="btn-m" onClick={() => setPage('contact-page')}>S'inscrire →</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:24 }}>
          {evs.map((ev,i) => {
            const col = cols[i%cols.length];
            const dateParts = (ev.date || '').split(' ');
            const jour = dateParts[0] || '';
            const reste = dateParts.slice(1);
            return (
              <div key={i} style={{ overflow:'hidden', border:`2px solid ${col}30`, transition:'all .3s' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.borderColor=col; el.style.transform='translateY(-6px)'; el.style.boxShadow=`0 20px 50px ${col}25`; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.borderColor=`${col}30`; el.style.transform='none'; el.style.boxShadow='none'; }}>
                <div style={{ height:180, overflow:'hidden', position:'relative' }}>
                  <img src={ev.photo} alt={ev.titre} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.55)', transition:'transform .6s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
                  <div style={{ position:'absolute', top:16, left:16, background:col, padding:'8px 16px', textAlign:'center' }}>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>{jour}</p>
                    <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, color:'rgba(255,255,255,.85)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>{reste.join(' ')}</p>
                  </div>
                  <div style={{ position:'absolute', top:16, right:16, background:'rgba(0,0,0,.7)', border:`1px solid ${col}50`, padding:'4px 12px' }}>
                    <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, color:col, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>{ev.type}</span>
                  </div>
                </div>
                <div style={{ padding:'18px 20px', background:'rgba(255,255,255,.03)' }}>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#fff', marginBottom:8 }}>{ev.titre}</h3>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.7, marginBottom:16 }}>{ev.description}</p>
                  <button onClick={() => setPage('contact-page')} style={{ background:'transparent', border:`1.5px solid ${col}`, color:col, fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:700, padding:'7px 18px', cursor:'pointer', letterSpacing:'0.12em', textTransform:'uppercase', transition:'all .2s', borderRadius:20 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background=col; (e.currentTarget as HTMLButtonElement).style.color='#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color=col; }}>
                    Réserver ma place
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

// ─── AVIS ─────────────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config:ConfigEcoleDanse }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const avis = ea(config.avis, CONFIG_DANSE_DEFAUT.avis);
  const [actif, setActif] = useState(0);
  const cols = [config.couleurMagenta, config.couleurOr, config.couleurCyan, config.couleurViolet];
  useEffect(() => {
    const id = setInterval(() => setActif(a => (a+1)%avis.length), 5000);
    return () => clearInterval(id);
  }, [avis.length]);
  return (
    <section style={{ background:'#0f0f1a', padding:isMobile?'60px 20px':'100px 48px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`url(${config.photoBanner})`, backgroundSize:'cover', backgroundPosition:'center', opacity:.05 }} />
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:config.couleurMagenta, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>Témoignages</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(36px,5vw,68px)', fontWeight:600, color:'#fff', lineHeight:1.05 }}>Ils ont <em style={{ fontStyle:'italic', color:config.couleurMagenta }}>trouvé leur rythme</em></h2>
        </div>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          {avis.map((a,i) => {
            const col = cols[i%cols.length];
            return (
              <div key={i} style={{ display:i===actif?'block':'none', background:'rgba(255,255,255,.04)', border:`2px solid ${col}25`, padding:'40px 48px', animation:'fadeUp .5s ease' }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:20, color:'rgba(255,255,255,.8)', lineHeight:1.8, marginBottom:28 }}>"{a.texte}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <img src={a.photo} alt={a.auteur} style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:`2px solid ${col}` }} />
                  <div>
                    <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700, color:'#fff' }}>{a.auteur}</p>
                    <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:col }}>{a.style} · {a.depuis}</p>
                  </div>
                  <div style={{ marginLeft:'auto', display:'flex', gap:3 }}>
                    {[...Array(a.note || 0)].map((_,j) => <span key={j} style={{ color:config.couleurOr, fontSize:16 }}>★</span>)}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:24 }}>
            {avis.map((_,i) => <button key={i} onClick={() => setActif(i)} style={{ width:i===actif?32:10, height:10, borderRadius:5, border:'none', cursor:'pointer', background:i===actif?cols[i%cols.length]:'rgba(255,255,255,.2)', transition:'all .3s' }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PASS ─────────────────────────────────────────────────────────────────────

// Add-on injectable — src/addons/abonnement-ecole/AddonAbonnementEcole.tsx
// Ce bloc est SEULEMENT l'adaptateur de thème, comme SectionHoraires pour la réservation.
// Remplace l'ancien contenu statique (config.pass) — n'affiche plus rien si l'add-on est inactif.
function SectionPass({ config, setPage, siteId, abonnementActive }: { config:ConfigEcoleDanse; setPage:(p:string)=>void; siteId?:number|string; abonnementActive?:boolean }) {
  const themeAbonnement: AddonAbonnementTheme = {
    primary: config.couleurMagenta,
    accentSecondaire: config.couleurOr,
    bg: config.couleurFond,
    cardBg: 'rgba(255,255,255,.04)',
    border: 'rgba(255,255,255,.1)',
    text: '#fff',
    textDim: 'rgba(255,255,255,.5)',
    fontTitre: "'Cormorant Garamond',serif",
    fontTexte: "'Poppins',sans-serif",
  };
  const dataAbonnement: AddonAbonnementData = {
    siteId, abonnementActif: abonnementActive,
    titreLabel: 'Abonnements',
    titre: 'Votre',
    titreAccent: 'pass danse',
  };
  return <AddonAbonnementEcole theme={themeAbonnement} data={dataAbonnement} />;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config:ConfigEcoleDanse }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const faq = ea(config.faq, CONFIG_DANSE_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number|null>(null);
  return (
    <section style={{ background:'#0f0f1a', padding:isMobile?'60px 20px':'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:860, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:config.couleurMagenta, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>FAQ</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(36px,5vw,68px)', fontWeight:600, color:'#fff', lineHeight:1.05 }}>Vos <em style={{ fontStyle:'italic', color:config.couleurMagenta }}>questions</em></h2>
        </div>
        {faq.map((f,i) => (
          <div key={i}>
            <button className="faq-btn" onClick={() => setOuvert(ouvert===i?null:i)}>
              <span>💃 {f.question}</span>
              <span style={{ color:config.couleurMagenta, fontSize:24, flexShrink:0, transition:'transform .3s', transform:ouvert===i?'rotate(45deg)':'none' }}>+</span>
            </button>
            <div style={{ overflow:'hidden', maxHeight:ouvert===i?'300px':'0', transition:'max-height .45s ease' }}>
              <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.9, padding:'12px 0 28px', paddingLeft:20, borderLeft:`3px solid ${config.couleurMagenta}40` }}>{f.reponse}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────

// ─── Add-on Contact : adaptateur de thème + valeurs par défaut ────────────────
// Traduit LES couleurs de CE template vers le contrat neutre de l'add-on.
// Ne contient AUCUNE logique de formulaire — juste de la couleur.
function getThemeContactDanse(config: ConfigEcoleDanse): AddonTheme {
  return {
    primary:   config.couleurMagenta,
    secondary: config.couleurOr,
    bg:        'rgba(255,255,255,.04)',
    text:      '#fff',
    textDim:   'rgba(255,255,255,.3)',
    border:    `${config.couleurMagenta}30`,
    fontTitre: "'Cormorant Garamond',serif",
    fontTexte: "'Poppins',sans-serif",
  };
}

// Valeurs PAR DÉFAUT si le gestionnaire n'a pas encore configuré son formulaire
// dans la page Add-ons > Contact. Dès qu'il le configure, sa config prend le dessus.
// "Style souhaité" ici reprend config.stylesDanse (dynamique, propre au studio) —
// une fois le gestionnaire passé par la page de config, il gère ces options lui-même.
function getDataContactDanseDefaut(config: ConfigEcoleDanse, styles: StyleDanse[], vendeurId: number | string): AddonContactData {
  return {
    titre: "S'inscrire ou nous contacter",
    boutonTexte: '🎭 Réserver mon premier cours gratuit',
    boutonTexteEnvoi: '💃 Envoi...',
    messageSuccesTitre: 'Message envoyé!',
    messageSuccesTexte: 'À très bientôt sur la piste!',
    messageSuccesEmoji: '💃',
    endpoint: '/api/studio/contact',
    vendeurId,
    templateId: 'cours-danse',
    champs: [
      { id:'prenom',  type:'text',     label:'Prénom', requis:true, placeholder:'Prénom' },
      { id:'nom',     type:'text',     label:'Nom',    requis:true, placeholder:'Nom' },
      { id:'email',   type:'email',    label:'Email',  requis:true, placeholder:'votre@email.ca', largeurPleine:true },
      { id:'style',   type:'select',   label:'Style souhaité', options: styles.map(s => `${s.emoji} ${s.nom}`) },
      { id:'age',     type:'text',     label:'Âge', placeholder:'Ex: 28 ans' },
      { id:'message', type:'textarea', label:'Message', placeholder:'Expérience, objectifs, questions...', largeurPleine:true },
    ],
  };
}

function getUrlMaps(config: ConfigEcoleDanse): string {
  const lienManuel = config.coordGoogleMaps?.trim();
  if (lienManuel) return lienManuel;
  const adresseComplete = [config.adresse, config.ville].filter(Boolean).join(', ');
  return `https://www.google.com/maps?q=${encodeURIComponent(adresseComplete)}&output=embed`;
}

function SectionContact({ config, vendeurId }: { config:ConfigEcoleDanse; vendeurId: number | string }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cm = config.couleurMagenta; const co = config.couleurOr;
  const styles = ea(config.stylesDanse, CONFIG_DANSE_DEFAUT.stylesDanse);
  const horairesStudio = ea(config.horairesStudio, CONFIG_DANSE_DEFAUT.horairesStudio);

  // 🟢 Config du gestionnaire (page Configuration > Formulaire de contact) si elle existe, sinon défaut du template
  const configAddon = (config as any).addons?.contact;
  const dataContact: AddonContactData = configAddon && configAddon.champs?.length
    ? {
        titre: configAddon.titre,
        sousTitre: configAddon.sousTitre,
        boutonTexte: configAddon.boutonTexte,
        messageSuccesTitre: configAddon.messageSuccesTitre,
        messageSuccesTexte: configAddon.messageSuccesTexte,
        endpoint: '/api/studio/contact',
        vendeurId,
        templateId: 'cours-danse',
        destinataireEmail: configAddon.destinataireEmail || undefined,
        champs: configAddon.champs as ChampFormulaire[],
      }
    : getDataContactDanseDefaut(config, styles, vendeurId);

  // 🟢 Fusionner les surcharges d'apparence du gestionnaire par-dessus le thème automatique du template
  const themeDefaut = getThemeContactDanse(config);
  const themeFinal: AddonTheme = configAddon
    ? {
        ...themeDefaut,
        text:    configAddon.couleurTexte  || themeDefaut.text,
        primary: configAddon.couleurAccent || themeDefaut.primary,
        fontTitre: configAddon.police || themeDefaut.fontTitre,
        fontTexte: configAddon.police || themeDefaut.fontTexte,
        taille: configAddon.tailleTexte,
      }
    : themeDefaut;

  return (
    <section style={{ background:config.couleurFond, padding:isMobile?'60px 20px':'100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1.4fr', gap:isMobile?32:80 }}>
          <div>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600, color:cm, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:12 }}>Rejoignez-nous</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,4vw,52px)', fontWeight:600, color:'#fff', lineHeight:1.15, marginBottom:32 }}>Premier cours<br /><em style={{ fontStyle:'italic', color:cm }}>gratuit!</em></h2>
            {[{ i:'📍', l:'Adresse', v:`${config.adresse}, ${config.ville}` },{ i:'📞', l:'Téléphone', v:config.telephone },{ i:'✉️', l:'Courriel', v:config.email }].map((info,i) => (
              <div key={i} style={{ display:'flex', gap:14, marginBottom:18 }}>
                <div style={{ width:42, height:42, background:`${[cm,co,config.couleurCyan][i]}20`, border:`1px solid ${[cm,co,config.couleurCyan][i]}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, borderRadius:'50%' }}>{info.i}</div>
                <div>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:3 }}>{info.l}</p>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,.6)' }}>{info.v}</p>
                </div>
              </div>
            ))}
            <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${cm}20`, padding:'18px 20px', marginBottom:20 }}>
              <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, fontWeight:700, color:cm, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:10 }}>Horaires</p>
              {horairesStudio.map((h,i) => {
                const texte = typeof h === 'string'
                  ? h
                  : (h && typeof h === 'object')
                    ? `${(h as any).jour || ''}${(h as any).jour && (h as any).horaires ? ' : ' : ''}${(h as any).horaires || ''}`
                    : '';
                return <p key={i} style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:5 }}>{texte}</p>;
              })}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[['instagram','📸'],['facebook','📘'],['youtube','📺'],['tiktok','🎵']].map(([k,ico]) =>
                config.reseaux?.[k as keyof typeof config.reseaux] ? (
                  <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer" style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none', transition:'all .2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor=cm; (e.currentTarget as HTMLAnchorElement).style.background=`${cm}20`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(255,255,255,.12)'; (e.currentTarget as HTMLAnchorElement).style.background='rgba(255,255,255,.06)'; }}>{ico}</a>
                ) : null
              )}
            </div>
            <div style={{ height:200, overflow:'hidden', marginTop:20, border:`2px solid ${cm}20`, borderRadius:4 }}>
              <iframe src={getUrlMaps(config)} width="100%" height="100%" style={{ border:0, display:'block' }} allowFullScreen loading="lazy" title="Localisation" />
            </div>
          </div>
          {/* 🟢 Add-on Contact — générique, réutilisé par tous les templates */}
          <AddonContact theme={themeFinal} data={dataContact} isMobile={isMobile} />
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config:ConfigEcoleDanse; setPage:(p:string)=>void }) {
  const { isMobile } = useIsMobile();
  const cm = config.couleurMagenta; const co = config.couleurOr;
  const styles = ea(config.stylesDanse, CONFIG_DANSE_DEFAUT.stylesDanse);

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
    <footer style={{ background:config.couleurFondSombre, padding:isMobile?'0 20px':'0 48px', paddingTop:48 }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${cm},${config.couleurViolet},${config.couleurCyan},${co})`, margin:'-48px -48px 48px' }} />
      <div style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr 1fr', gap:isMobile?24:48, paddingBottom:48 }}>
        <div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:10, color:cm, letterSpacing:'0.3em', marginBottom:4 }}>Studio de Danse</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, color:'#fff', marginBottom:12 }}>{config.nomEcole}</p>
          <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:18, color:co, marginBottom:18 }}>"{config.citation}"</p>
          <div style={{ display:'flex', gap:10 }}>
            {[['instagram','📸'],['facebook','📘'],['youtube','📺'],['tiktok','🎵']].map(([k,ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer" style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, textDecoration:'none', transition:'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor=cm; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(255,255,255,.1)'; }}>{ico}</a>
              ) : null
            )}
          </div>
        </div>
        {[
          { titre:'Navigation', liens:[['accueil','Accueil'],['styles-page','Styles'],['horaires-page','Horaires'],['professeurs-page','Professeurs'],['contact-page',"S'inscrire"]] },
          { titre:'Styles', liens:styles.slice(0,5).map(s => ['styles-page',`${s.emoji} ${s.nom}`]) },
          { titre:'Contact', liens:[[config.email,''],[config.telephone,''],[config.ville,'']] },
        ].map((col,ci) => (
          <div key={ci}>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, fontWeight:700, color:[cm,co,config.couleurCyan][ci], letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>{col.titre}</p>
            {col.liens.map(([id,label],j) => (
              <p key={j} onClick={label ? () => setPage(id) : undefined} style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:7, cursor:label?'pointer':'default', transition:'color .2s' }}
                onMouseEnter={e => { if(label)(e.currentTarget as HTMLParagraphElement).style.color=cm; }}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color='rgba(255,255,255,.35)'}>
                {label||id}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'20px 0', maxWidth:1320, margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:14, color:'rgba(255,255,255,.2)' }}>💃 Dansez, brillez, vivez</p>
        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomEcole}</p>
      </div>
      {!cacherBadge && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'12px 0', textAlign:'center' as const }}>
          <a href="https://e-vendstudio.ca" target="_blank" rel="noreferrer" style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:'rgba(255,255,255,.25)', textDecoration:'none' }}>
            Propulsé par e-Vend Studio
          </a>
        </div>
      )}
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateEcoleDanseProps {
  config?: Partial<ConfigEcoleDanse>;
  isPreview?: boolean;
  siteId?: number | string;
  reservationActive?: boolean;
  abonnementActive?: boolean;
}

export default function TemplateEcoleDanse({ config: partiel, isPreview, siteId, reservationActive, abonnementActive }: TemplateEcoleDanseProps) {
  const config: ConfigEcoleDanse = {
    ...CONFIG_DANSE_DEFAUT, ...partiel,
    couleurMagenta:     partiel?.couleurMagenta     || CONFIG_DANSE_DEFAUT.couleurMagenta,
    couleurOr:          partiel?.couleurOr          || CONFIG_DANSE_DEFAUT.couleurOr,
    couleurViolet:      partiel?.couleurViolet      || CONFIG_DANSE_DEFAUT.couleurViolet,
    couleurCyan:        partiel?.couleurCyan        || CONFIG_DANSE_DEFAUT.couleurCyan,
    couleurFond:        partiel?.couleurFond        || CONFIG_DANSE_DEFAUT.couleurFond,
    couleurFondSombre:  partiel?.couleurFondSombre  || CONFIG_DANSE_DEFAUT.couleurFondSombre,
  };

  // 🟢 Injecté par SitePreview via config.vendeurId — 0 en secours (aperçu/démo sans site réel)
  const vendeurId = config.vendeurId ?? 0;

  const VALID_IDS = ['hero','stats','styles','horaires','apropos','professeurs','evenements','avis','pass','faq','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_DANSE_DEFAUT.sections);
  config.sections     = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_DANSE_DEFAUT.sections;
  config.stats        = ea(partiel?.stats,         CONFIG_DANSE_DEFAUT.stats);
  config.stylesDanse  = ea(partiel?.stylesDanse,   CONFIG_DANSE_DEFAUT.stylesDanse);
  config.professeurs  = ea(partiel?.professeurs,   CONFIG_DANSE_DEFAUT.professeurs);
  config.avis         = ea(partiel?.avis,          CONFIG_DANSE_DEFAUT.avis);
  config.pass         = ea(partiel?.pass,          CONFIG_DANSE_DEFAUT.pass);
  config.faq          = ea(partiel?.faq,           CONFIG_DANSE_DEFAUT.faq);
  config.evenements   = ea(partiel?.evenements,    CONFIG_DANSE_DEFAUT.evenements);
  config.horairesStudio = ea(partiel?.horairesStudio, CONFIG_DANSE_DEFAUT.horairesStudio);

  const [page, setPage] = useState('accueil');
  const [rideauFini, setRideauFini] = useState(!!isPreview);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} rideauFini={rideauFini} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'styles':      return <SectionStyles      config={config} setPage={handlePage} />;
      case 'horaires':    return <SectionHoraires    config={config} setPage={handlePage} siteId={siteId} reservationActive={!!reservationActive} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'professeurs': return <SectionProfesseurs config={config} />;
      case 'evenements':  return <SectionEvenements  config={config} setPage={handlePage} />;
      case 'avis':        return <SectionAvis        config={config} />;
      case 'pass':        return <SectionPass        config={config} setPage={handlePage} siteId={siteId} abonnementActive={!!abonnementActive} />;
      case 'faq':         return <SectionFAQ         config={config} />;
      case 'contact':     return <SectionContact     config={config} vendeurId={vendeurId} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background:config.couleurFond }}>
      <style>{getStyle(config)}</style>
      {!isPreview && !rideauFini && <Rideau onFin={() => setRideauFini(true)} />}
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop:68 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'styles-page'      && (<><SectionStyles      config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'horaires-page'    && (<><SectionHoraires    config={config} setPage={handlePage} siteId={siteId} reservationActive={!!reservationActive} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'professeurs-page' && (<><SectionProfesseurs config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page'     && (<><SectionContact     config={config} vendeurId={vendeurId} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}