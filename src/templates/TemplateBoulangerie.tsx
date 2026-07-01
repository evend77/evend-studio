// src/templates/TemplateBoulangerie.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Boulangerie & Pâtisserie
// Style : fond crème #faf7f2 / accent brun chaud #8b4513 + or doré #d4a017
// Typo : Playfair Display (titres élégants) + Lato (corps)
// Effets WOW :
//   - Croissant SVG 3D qui tourne dans le hero
//   - Particules de farine qui tombent doucement
//   - Galerie gâteaux avec zoom + flip prix
//   - Badge "Sorti du four" dynamique
//   - Formulaire commande spéciale avec calendrier
//   - Barre chaleur four animée
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : resto

import React, { useState, useEffect, useRef } from 'react';

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface ProduitBoulangerie {
  nom: string;
  description: string;
  prix: string;
  photo: string;
  categorie: string;
  badge?: string;
  nouveaute?: boolean;
  allergenes?: string[];
}

export interface AvisBoulangerie {
  texte: string;
  auteur: string;
  note: number;
  photo: string;
  produitFavori: string;
}

export interface ConfigBoulangerie {
  nomBoulangerie: string;
  tagline: string;
  sousTagline: string;
  description: string;
  descriptionAPropos: string;
  histoire: string;
  citation: string;
  fondee: string;

  couleurPrimaire: string;    // brun chaud
  couleurAccent: string;      // or doré
  couleurFond: string;        // crème
  couleurFondSombre: string;  // brun sombre
  couleurTexte: string;

  photoHero: string;
  photoFour: string;
  photoEquipe: string;
  photoBanner: string;

  horaires: { jour: string; heures: string; ouvert: boolean; sortiesFour?: string[] }[];
  stats: { valeur: string; label: string; icone: string }[];
  categoriesProduits: string[];
  produits: ProduitBoulangerie[];
  avis: AvisBoulangerie[];
  specialites: { nom: string; description: string; icone: string }[];
  evenements: { titre: string; date: string; description: string }[];

  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  reseaux: { instagram?: string; facebook?: string };
  coordGoogleMaps: string;
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_BOULANGERIE_DEFAUT: ConfigBoulangerie = {
  nomBoulangerie: "La Mie Dorée",
  tagline: "Artisanat.",
  sousTagline: "Tradition. Passion.",
  description: "Boulangerie artisanale depuis 1987. Pains au levain, viennoiseries maison et pâtisseries créatives préparés chaque matin avec les meilleurs ingrédients locaux.",
  descriptionAPropos: "Depuis trois générations, La Mie Dorée perpétue l'art de la boulangerie artisanale. Notre four à bois, hérité de notre grand-père, chauffe dès 4h du matin pour vous offrir le pain le plus frais de Montréal.",
  histoire: "Fondée en 1987 par Marcel Beaumont, La Mie Dorée est devenue une institution du Plateau-Mont-Royal. Aujourd'hui, ses petits-enfants Marie et Thomas perpétuent la tradition avec des recettes centenaires et une touche de modernité créative.",
  citation: "Le bon pain, c'est l'art de la patience.",
  fondee: "1987",

  couleurPrimaire: "#8b4513",
  couleurAccent: "#d4a017",
  couleurFond: "#faf7f2",
  couleurFondSombre: "#2c1a0e",
  couleurTexte: "#2c1a0e",

  photoHero: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1600",
  photoFour: "https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=900",
  photoEquipe: "https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=900",
  photoBanner: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600",

  horaires: [
    { jour: "Lundi",    heures: "Fermé",       ouvert: false },
    { jour: "Mardi",    heures: "6h30 – 19h",  ouvert: true,  sortiesFour: ["7h00", "11h00", "15h00"] },
    { jour: "Mercredi", heures: "6h30 – 19h",  ouvert: true,  sortiesFour: ["7h00", "11h00", "15h00"] },
    { jour: "Jeudi",    heures: "6h30 – 19h",  ouvert: true,  sortiesFour: ["7h00", "11h00", "15h00"] },
    { jour: "Vendredi", heures: "6h30 – 20h",  ouvert: true,  sortiesFour: ["7h00", "10h00", "14h00", "17h00"] },
    { jour: "Samedi",   heures: "7h00 – 18h",  ouvert: true,  sortiesFour: ["7h30", "10h30", "13h30"] },
    { jour: "Dimanche", heures: "7h00 – 13h",  ouvert: true,  sortiesFour: ["7h30", "10h00"] },
  ],

  stats: [
    { valeur: "37", label: "Ans d'artisanat",   icone: "🏆" },
    { valeur: "40+", label: "Pains différents",  icone: "🍞" },
    { valeur: "4h", label: "Heure de lever",     icone: "⏰" },
    { valeur: "100%", label: "Fait maison",      icone: "❤️" },
  ],

  categoriesProduits: ["Pains", "Viennoiseries", "Pâtisseries", "Gâteaux", "Tartes", "Spéciaux"],

  produits: [
    { nom: "Pain au Levain Tradition", description: "Notre signature — levain naturel maison de 30 ans, farine bio T65, croûte croustillante et mie alvéolée. Cuit au four à bois.", prix: "7.50$", photo: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Pains", badge: "SIGNATURE", nouveaute: false, allergenes: ["Gluten"] },
    { nom: "Baguette Parisienne", description: "Façonnée à la main, cuite deux fois pour une croûte parfaite. La vraie baguette comme à Paris.", prix: "2.75$", photo: "https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Pains", nouveaute: false, allergenes: ["Gluten"] },
    { nom: "Croissant au Beurre", description: "Pur beurre AOP, feuilletage 27 couches, doré à l'oeuf. La viennoiserie parfaite pour commencer la journée.", prix: "3.50$", photo: "https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Viennoiseries", badge: "BEST-SELLER", nouveaute: false, allergenes: ["Gluten", "Lactose", "Oeufs"] },
    { nom: "Pain au Chocolat", description: "Deux barres de chocolat Valrhona 70% dans notre feuilletage maison. Fondant au coeur, croustillant dehors.", prix: "3.75$", photo: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Viennoiseries", nouveaute: false, allergenes: ["Gluten", "Lactose", "Cacao"] },
    { nom: "Tarte Citron Meringuée", description: "Crème citron maison ultra-citronnée, pâte sablée croustillante, meringue italienne flambée au chalumeau.", prix: "6.00$", photo: "https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Tartes", nouveaute: false, allergenes: ["Gluten", "Oeufs", "Lactose"] },
    { nom: "Éclair Café & Caramel", description: "Pâte à choux maison, crème pâtissière café, glaçage caramel beurre salé. Une création de Marie.", prix: "5.50$", photo: "https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Pâtisseries", badge: "NOUVEAU", nouveaute: true, allergenes: ["Gluten", "Oeufs", "Lactose"] },
    { nom: "Gâteau Fraisier des Champs", description: "Génoise moelleuse, crème mousseline vanille Bourbon, fraises du Québec en saison. Commande 48h à l'avance.", prix: "48$ (8 pers.)", photo: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Gâteaux", nouveaute: false, allergenes: ["Gluten", "Oeufs", "Lactose"] },
    { nom: "Kouign-Amann", description: "Spécialité bretonne — pâte levée, couche de sucre caramélisé, beurre fondu. Croustillant, fondant, irrésistible.", prix: "4.25$", photo: "https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=600", categorie: "Spéciaux", badge: "RARE", nouveaute: false, allergenes: ["Gluten", "Lactose"] },
  ],

  avis: [
    { texte: "Le meilleur pain au levain de Montréal, sans aucun doute. Je fais 20 minutes de route exprès chaque samedi matin. La croûte chante quand on la coupe — c'est magique!", auteur: "Isabelle Tremblay", note: 5, photo: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200", produitFavori: "Pain au Levain Tradition" },
    { texte: "Les croissants sont à pleurer tellement ils sont bons. Pur beurre, feuilletage parfait. Ma famille ne peut plus manger d'autre croissant ailleurs depuis qu'on a découvert La Mie Dorée.", auteur: "François Côté", note: 5, photo: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200", produitFavori: "Croissant au Beurre" },
    { texte: "J'ai commandé un gâteau d'anniversaire pour ma fille — ils ont créé quelque chose d'extraordinaire. Magnifique, délicieux, et un service aux petits oignons. Merci Marie!", auteur: "Sophie Lavoie", note: 5, photo: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200", produitFavori: "Gâteau sur commande" },
  ],

  specialites: [
    { nom: "Four à Bois", description: "Notre four centenaire en briques réfractaires — le secret d'une croûte incomparable", icone: "🔥" },
    { nom: "Levain Naturel", description: "Notre levain est vivant depuis 1987 — il donne au pain son caractère unique", icone: "🌾" },
    { nom: "Ingrédients Locaux", description: "Farine biologique du Québec, beurre AOP, fruits de producteurs régionaux", icone: "🌿" },
    { nom: "Commandes Spéciales", description: "Gâteaux de mariage, anniversaires, événements — créations personnalisées sur mesure", icone: "🎂" },
  ],

  evenements: [
    { titre: "Atelier Pain au Levain", date: "28 juin 2026 — 10h à 13h", description: "Apprenez à faire votre propre pain au levain avec nos boulangers. Places limitées à 8 personnes. Repartez avec votre pain et votre starter de levain!" },
    { titre: "Viennoiserie du Dimanche", date: "Tous les dimanches — dès 7h30", description: "Chaque dimanche, sortie spéciale de viennoiseries chaudes à 7h30. Arrivez tôt — ça part vite!" },
    { titre: "Gâteau de l'Été", date: "Juillet & Août 2026", description: "Notre création saisonnière aux fruits d'été du Québec. Disponible en portions individuelles et formats familiaux." },
  ],

  adresse: "4521 rue Saint-Denis",
  ville: "Montréal, QC H2J 2L2",
  telephone: "(514) 555-0193",
  email: "bonjour@lamiedoree.ca",
  reseaux: { instagram: "#", facebook: "#" },
  coordGoogleMaps: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1",

  sections: [
    { id: "hero",        actif: true, ordre: 1,  label: "Hero + Croissant 3D" },
    { id: "stats",       actif: true, ordre: 2,  label: "Chiffres clés" },
    { id: "produits",    actif: true, ordre: 3,  label: "Nos produits" },
    { id: "apropos",     actif: true, ordre: 4,  label: "Notre histoire" },
    { id: "specialites", actif: true, ordre: 5,  label: "Nos spécialités" },
    { id: "commande",    actif: true, ordre: 6,  label: "Commande spéciale" },
    { id: "evenements",  actif: true, ordre: 7,  label: "Ateliers & Événements" },
    { id: "avis",        actif: true, ordre: 8,  label: "Avis clients" },
    { id: "contact",     actif: true, ordre: 9,  label: "Contact & Horaires" },
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
function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

function prochaineSortie(horaires: ConfigBoulangerie["horaires"]): string | null {
  const now = new Date();
  const jours = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const jourActuel = jours[now.getDay()];
  const h = horaires.find(h => h.jour === jourActuel);
  if (!h || !h.ouvert || !h.sortiesFour) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (s: string) => { const [hh,mm] = s.replace("h","h0").split("h"); return parseInt(hh)*60+(parseInt(mm)||0); };
  const prochaine = h.sortiesFour.find(s => toMin(s) > nowMin);
  return prochaine || null;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const getStyle = (c: ConfigBoulangerie) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Lato:wght@300;400;700;900&family=Dancing+Script:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}

@keyframes croissantTourne { from{transform:rotateY(0deg) rotateX(-10deg)} to{transform:rotateY(360deg) rotateX(-10deg)} }
@keyframes farineChute { 0%{transform:translateY(-10px) rotate(0deg) scale(1);opacity:.7} 100%{transform:translateY(100vh) rotate(360deg) scale(.5);opacity:0} }
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes chaleur{0%,100%{width:60%}50%{width:95%}}
@keyframes vapeur{0%{transform:translateY(0) scaleX(1);opacity:.6}100%{transform:translateY(-40px) scaleX(1.5);opacity:0}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes cloche{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}

.rv{opacity:0;transform:translateY(32px);transition:opacity .9s,transform .9s;}
.rv.vis{opacity:1;transform:none;}
.rv-l{opacity:0;transform:translateX(-44px);transition:opacity .9s,transform .9s;}
.rv-l.vis{opacity:1;transform:none;}
.rv-r{opacity:0;transform:translateX(44px);transition:opacity .9s,transform .9s;}
.rv-r.vis{opacity:1;transform:none;}

.btn-b{
  background:${c.couleurPrimaire};color:#fff;border:none;
  padding:14px 36px;font-family:'Lato',sans-serif;font-size:12px;
  font-weight:900;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;border-radius:2px;
  transition:all .25s;box-shadow:0 4px 20px ${c.couleurPrimaire}50;
}
.btn-b:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 8px 32px ${c.couleurPrimaire}70;}
.btn-outline-b{
  background:transparent;color:${c.couleurTexte};
  border:2px solid ${c.couleurTexte}50;
  padding:13px 34px;font-family:'Lato',sans-serif;font-size:12px;
  font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;border-radius:2px;transition:all .25s;
}
.btn-outline-b:hover{border-color:${c.couleurPrimaire};color:${c.couleurPrimaire};}

.nav-b{
  font-family:'Lato',sans-serif;font-size:11px;font-weight:900;
  letter-spacing:.18em;text-transform:uppercase;
  color:rgba(255,255,255,.8);cursor:pointer;background:none;border:none;
  transition:color .2s;position:relative;padding:4px 0;
}
.nav-b::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:2px;
  background:${c.couleurAccent};transform:scaleX(0);transition:transform .3s;}
.nav-b:hover,.nav-b.active{color:${c.couleurAccent};}
.nav-b:hover::after,.nav-b.active::after{transform:scaleX(1);}

/* Carte produit flip */
.flip-prod{perspective:900px;}
.flip-inner-prod{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,0,.2,1);}
.flip-prod:hover .flip-inner-prod{transform:rotateY(180deg);}
.flip-front-prod,.flip-back-prod{position:absolute;inset:0;backface-visibility:hidden;}
.flip-back-prod{transform:rotateY(180deg);background:${c.couleurPrimaire};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;}

.fw-inp{
  width:100%;padding:11px 15px;background:rgba(255,255,255,.9);
  border:none;border-bottom:2px solid rgba(0,0,0,.15);
  color:${c.couleurTexte};font-family:'Lato',sans-serif;font-size:14px;
  outline:none;box-sizing:border-box;transition:border-color .2s;
}
.fw-inp:focus{border-bottom-color:${c.couleurPrimaire};}
.fw-inp::placeholder{color:rgba(0,0,0,.3);}
`;

// ─── CROISSANT SVG 3D ─────────────────────────────────────────────────────────

function CroissantSVG({ cp, ca }: { cp: string; ca: string }) {
  const { isMobile } = useIsMobile();
  return (
    <div style={{ perspective: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
      <div style={{ animation: 'croissantTourne 12s linear infinite', transformStyle: 'preserve-3d', filter: `drop-shadow(0 12px 30px ${cp}60)` }}>
        <svg viewBox="0 0 300 200" width="300" height="200">
          {/* Corps du croissant */}
          <path d="M150,30 Q220,10 260,80 Q290,140 230,170 Q180,190 150,160 Q120,190 70,170 Q10,140 40,80 Q80,10 150,30Z"
            fill={ca} opacity="0.95" />
          {/* Couches feuilletage */}
          <path d="M150,45 Q210,28 245,88 Q268,135 218,160 Q175,178 150,150"
            stroke={cp} strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M150,60 Q200,45 230,96 Q248,132 206,152 Q170,166 150,140"
            stroke={cp} strokeWidth="2" fill="none" opacity="0.45" />
          <path d="M150,75 Q190,62 215,104 Q228,130 194,144 Q165,154 150,130"
            stroke={cp} strokeWidth="1.5" fill="none" opacity="0.3" />
          {/* Dorure */}
          <path d="M150,30 Q220,10 260,80 Q290,140 230,170"
            stroke="#f5c842" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
          {/* Brillance */}
          <ellipse cx="130" cy="70" rx="25" ry="12" fill="rgba(255,255,255,.25)" transform="rotate(-20 130 70)" />
          {/* Détails texture */}
          {[0,1,2,3].map(i => (
            <line key={i} x1={90+i*20} y1={120-i*8} x2={110+i*18} y2={135-i*6}
              stroke={cp} strokeWidth="1.5" opacity="0.3" />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── PARTICULES FARINE ────────────────────────────────────────────────────────

function FarineParticules() {
  const { isMobile } = useIsMobile();
  const particules = Array.from({length: 20}, (_, i) => ({
    x: Math.random() * 100,
    taille: 3 + Math.random() * 6,
    delay: Math.random() * 8,
    duree: 6 + Math.random() * 6,
    opacite: 0.3 + Math.random() * 0.4,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particules.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: '-10px',
          width: p.taille, height: p.taille, borderRadius: '50%',
          background: 'rgba(255,255,255,0.8)',
          animation: `farineChute ${p.duree}s ${p.delay}s ease-in infinite`,
          opacity: p.opacite,
        }} />
      ))}
    </div>
  );
}

// ─── BADGE SORTI DU FOUR ──────────────────────────────────────────────────────

function BadgeSortieFour({ horaires, cp, ca }: { horaires: ConfigBoulangerie["horaires"]; cp: string; ca: string }) {
  const { isMobile } = useIsMobile();
  const prochaine = prochaineSortie(horaires);
  if (!prochaine) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${ca}20`, border: `1.5px solid ${ca}`, borderRadius: 20, padding: '6px 14px' }}>
      <span style={{ animation: 'cloche 2s ease-in-out infinite', display: 'inline-block' }}>🔔</span>
      <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: ca }}>
        Prochaine sortie du four à {prochaine}
      </span>
    </div>
  );
}

// ─── BARRE CHALEUR FOUR ───────────────────────────────────────────────────────

function BarreChaleur({ cp, ca }: { cp: string; ca: string }) {
  const { isMobile } = useIsMobile();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <span style={{ fontSize: 16 }}>🌡️</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg,${ca},${cp},#ff4400)`, borderRadius: 3, animation: 'chaleur 3s ease-in-out infinite' }} />
      </div>
      <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: cp }}>250°C</span>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigBoulangerie; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const liens = [['accueil','Accueil'],['produits-page','Nos Produits'],['commande-page','Commander'],['contact-page','Contact']];
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? `rgba(44,26,14,.97)` : `rgba(44,26,14,.88)`, backdropFilter: 'blur(16px)', borderBottom: scrolled ? `1px solid ${config.couleurAccent}30` : 'none', transition: 'all .4s', padding: isMobile ? '0 20px' : '0 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer' }}>
          <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 26, color: config.couleurAccent, letterSpacing: '0.02em', lineHeight: 1 }}>{config.nomBoulangerie}</p>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Boulangerie Artisanale</p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {liens.map(([id,label]) => <button key={id} className={`nav-b${page===id?' active':''}`} onClick={() => setPage(id)}>{label}</button>)}
        </div>
        <button className="btn-b" onClick={() => setPage('commande-page')} style={{ padding: '10px 22px', fontSize: 11 }}>🎂 Commande Spéciale</button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigBoulangerie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const horaires = ea(config.horaires, CONFIG_BOULANGERIE_DEFAUT.horaires);
  return (
    <section style={{ background: config.couleurFondSombre, minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 66 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.18)' }} />
      <FarineParticules />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${config.couleurFondSombre}ee 0%, ${config.couleurFondSombre}99 45%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: isMobile ? '48px 20px' : '60px 48px', width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60, alignItems: 'center', zIndex: 2 }}>
        <div>
          <div style={{ marginBottom: 18, animation: 'fadeUp .6s ease both' }}>
            <BadgeSortieFour horaires={horaires} cp={cp} ca={ca} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(60px,10vw,120px)', fontWeight: 800, color: '#fff', lineHeight: .9, letterSpacing: '-.01em', marginBottom: 8, animation: 'fadeUp .7s .1s ease both' }}>
            {config.tagline}
          </h1>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'clamp(40px,7vw,80px)', fontWeight: 300, color: ca, lineHeight: .95, marginBottom: 28, animation: 'fadeUp .7s .15s ease both' }}>
            {config.sousTagline}
          </h1>
          <BarreChaleur cp={cp} ca={ca} />
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.9, maxWidth: 480, marginBottom: 40, marginTop: 16, animation: 'fadeUp .7s .25s ease both' }}>
            {config.description}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeUp .7s .35s ease both' }}>
            <button className="btn-b" onClick={() => setPage('produits-page')}>Voir nos produits</button>
            <button className="btn-outline-b" onClick={() => setPage('commande-page')} style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>🎂 Commander</button>
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 44, animation: 'fadeUp .7s .45s ease both' }}>
            {ea(config.stats, CONFIG_BOULANGERIE_DEFAUT.stats).slice(0, 3).map((s, i) => (
              <div key={i}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: i%2===0?cp:ca, lineHeight: 1 }}>{s.valeur}</p>
                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 3 }}>
          <CroissantSVG cp={cp} ca={ca} />
          {/* Vapeur */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 3, height: 24, background: 'rgba(255,255,255,.3)', borderRadius: 2, animation: `vapeur ${1.5+i*.3}s ${i*.2}s ease-out infinite` }} />
            ))}
          </div>
          <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 18, color: ca, textAlign: 'center' }}>Fraîchement sorti du four</p>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION STATS ────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.1);
  const stats = ea(config.stats, CONFIG_BOULANGERIE_DEFAUT.stats);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  return (
    <section style={{ background: cp, padding: 0 }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '44px 24px', textAlign: 'center', borderRight: i<3 ? '1px solid rgba(255,255,255,.2)' : 'none' }}>
            <div style={{ fontSize: 32, marginBottom: 10, animation: `float 3s ${i*.5}s ease-in-out infinite` }}>{s.icone}</div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6 }}>{s.valeur}</p>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.8)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION PRODUITS ────────────────────────────────────────────────────────

function SectionProduits({ config, setPage }: { config: ConfigBoulangerie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const produits = ea(config.produits, CONFIG_BOULANGERIE_DEFAUT.produits);
  const categories = ea(config.categoriesProduits, CONFIG_BOULANGERIE_DEFAUT.categoriesProduits);
  const [cat, setCat] = useState('Tous');
  const filtres = cat==='Tous' ? produits : produits.filter(p => p.categorie===cat);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Notre vitrine</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,4vw,60px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
              Nos <em style={{ fontStyle: 'italic', color: cp }}>créations</em>
            </h2>
          </div>
          <button className="btn-outline-b" onClick={() => setPage('commande-page')}>🎂 Commander sur mesure →</button>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {['Tous', ...categories].map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: cat===c ? cp : 'transparent', color: cat===c ? '#fff' : 'rgba(0,0,0,.5)', border: `1px solid ${cat===c ? cp : 'rgba(0,0,0,.15)'}`, transition: 'all .25s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grille flip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24 }}>
          {filtres.map((p, i) => (
            <div key={i} className="flip-prod" style={{ height: 340 }}>
              <div className="flip-inner-prod">
                {/* Face avant */}
                <div className="flip-front-prod" style={{ border: `2px solid ${p.nouveaute ? ca : 'rgba(0,0,0,.06)'}`, borderRadius: 4, overflow: 'hidden', background: '#fff', boxShadow: p.nouveaute ? `0 0 20px ${ca}30` : 'none' }}>
                  <div style={{ height: '60%', overflow: 'hidden', position: 'relative' }}>
                    <img src={p.photo} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }} />
                    {p.badge && <div style={{ position: 'absolute', top: 12, left: 12, background: p.badge==='NOUVEAU'?ca:cp, color: '#fff', fontSize: 9, fontFamily: "'Lato',sans-serif", fontWeight: 900, padding: '4px 10px', borderRadius: 2, letterSpacing: '0.1em' }}>{p.badge}</div>}
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.75)', color: ca, fontSize: 15, fontFamily: "'Playfair Display',serif", fontWeight: 700, padding: '4px 12px', borderRadius: 3 }}>{p.prix}</div>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, color: cp, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{p.categorie}</p>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: config.couleurTexte, marginBottom: 8 }}>{p.nom}</h3>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, color: 'rgba(0,0,0,.5)', lineHeight: 1.5 }}>{p.description.slice(0,70)}...</p>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: ca, marginTop: 8, opacity: .6 }}>Survoler pour détails →</p>
                  </div>
                </div>
                {/* Face arrière */}
                <div className="flip-back-prod" style={{ borderRadius: 4 }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 22, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>{p.nom}</p>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.9)', lineHeight: 1.7, marginBottom: 18 }}>{p.description}</p>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, color: ca, marginBottom: 12 }}>{p.prix}</p>
                  {p.allergenes && p.allergenes.length > 0 && (
                    <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      ⚠️ {p.allergenes.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(.08); const rvR = useReveal(.08);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        <div ref={rvL.ref} className={`rv-l${rvL.vis?' vis':''}`} style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/3', height: 280, overflow: 'hidden', border: `3px solid ${cp}40` }}>
              <img src={config.photoFour} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
            </div>
            <div style={{ height: 200, overflow: 'hidden', border: `3px solid ${ca}40` }}>
              <img src={config.photoEquipe} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='none'} />
            </div>
            <div style={{ height: 200, background: `linear-gradient(135deg,${cp}20,${ca}20)`, border: `2px solid ${ca}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 20, color: cp, textAlign: 'center', lineHeight: 1.5 }}>
                "{config.citation}"
              </p>
            </div>
          </div>
          <div style={{ position: 'absolute', top: -16, right: -16, width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg,${cp},${ca})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 28px ${cp}50` }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{config.fondee}</p>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 8, color: 'rgba(255,255,255,.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fondée</p>
          </div>
        </div>
        <div ref={rvR.ref} className={`rv-r${rvR.vis?' vis':''}`}>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Notre histoire</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,3.5vw,50px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.15, marginBottom: 20 }}>
            Trois générations de <em style={{ fontStyle: 'italic', color: cp }}>passion</em>
          </h2>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 15, color: 'rgba(0,0,0,.6)', lineHeight: 1.9, marginBottom: 20 }}>{config.descriptionAPropos}</p>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 14, color: 'rgba(0,0,0,.5)', lineHeight: 1.8, marginBottom: 32 }}>{config.histoire}</p>
          <BarreChaleur cp={cp} ca={ca} />
          <button className="btn-b" style={{ marginTop: 20 }}>Visiter la boulangerie 🥐</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION SPÉCIALITÉS ──────────────────────────────────────────────────────

function SectionSpecialites({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const specialites = ea(config.specialites, CONFIG_BOULANGERIE_DEFAUT.specialites);
  return (
    <section style={{ background: config.couleurFondSombre, padding: isMobile ? '60px 20px' : '100px 48px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoBanner})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: .07 }} />
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: ca, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Ce qui nous distingue</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            Nos <em style={{ fontStyle: 'italic', color: ca }}>spécialités</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
          {specialites.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.05)', border: `1px solid rgba(255,255,255,.1)`, borderRadius: 4, padding: '32px 24px', textAlign: 'center', transition: 'all .3s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.background=`${cp}15`; el.style.borderColor=ca; el.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.background='rgba(255,255,255,.05)'; el.style.borderColor='rgba(255,255,255,.1)'; el.style.transform='none'; }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: `float 3s ${i*.4}s ease-in-out infinite` }}>{s.icone}</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 22, color: ca, marginBottom: 12 }}>{s.nom}</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION COMMANDE SPÉCIALE ────────────────────────────────────────────────

function SectionCommande({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const [form, setForm] = useState({ prenom: '', email: '', telephone: '', occasion: '', date: '', personnes: '', allergenes: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, boulangerie: config.nomBoulangerie, type: 'commande-speciale', vendeur_id: config.vendeurId || 0 }) });
    } catch {}
    setEnvoye(true); // handled by hook setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Sur mesure</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,4vw,60px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Commande <em style={{ fontStyle: 'italic', color: cp }}>Spéciale</em>
          </h2>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 14, color: 'rgba(0,0,0,.5)', marginTop: 14, maxWidth: 560, margin: '14px auto 0' }}>
            Gâteau de mariage, anniversaire, baptême — nos artisans créent votre pièce unique. <strong>Délai minimum 48h.</strong>
          </p>
        </div>

        <div style={{ background: '#fff', border: `3px solid ${cp}20`, borderTop: `4px solid ${cp}`, padding: '40px 48px' }}>
          {envoye ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎂</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color: config.couleurTexte, marginBottom: 12 }}>Commande reçue!</h3>
              <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 20, color: cp }}>Nous vous contacterons dans les 24 heures.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px 32px' }}>
              {[['Prénom *','prenom','Votre prénom','text'],['Email *','email','votre@email.ca','email'],['Téléphone','telephone','(514) 555-0000','tel'],['Occasion *','occasion','Anniversaire, Mariage, Baptême...','text']].map(([label,key,ph,type]) => (
                <div key={key}>
                  <label style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input type={type} className="fw-inp" value={(form as any)[key]} onChange={e => setForm({...form,[key]:e.target.value})} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Date souhaitée *</label>
                <input type="date" className="fw-inp" value={form.date} onChange={e => setForm({...form,date:e.target.value})} />
              </div>
              <div>
                <label style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nb de personnes</label>
                <select className="fw-inp" value={form.personnes} onChange={e => setForm({...form,personnes:e.target.value})} style={{ cursor: 'pointer' }}>
                  <option value="">Choisir...</option>
                  {['4-6','8-10','12-15','20-25','30+'].map(n => <option key={n} value={n}>{n} personnes</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/3' }}>
                <label style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Allergènes à éviter</label>
                <input className="fw-inp" value={form.allergenes} onChange={e => setForm({...form,allergenes:e.target.value})} placeholder="Gluten, lactose, noix..." />
              </div>
              <div style={{ gridColumn: '1/3' }}>
                <label style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,.4)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Vos souhaits & inspirations</label>
                <textarea className="fw-inp" rows={3} value={form.message} onChange={e => setForm({...form,message:e.target.value})} placeholder="Décrivez votre gâteau de rêve — couleurs, saveurs, thème, décoration..." style={{ resize: 'none' }} />
              </div>
              <div style={{ gridColumn: '1/3' }}>
              <button disabled={loading || !form.prenom || !form.email || !form.occasion} style={{ opacity: !form.prenom||!form.email||!form.occasion ? .5 : 1, padding: '16px 40px', fontSize: 13, width: '100%', textAlign: 'center' }}>
                  {loading ? '⏳ Envoi...' : '🎂 Envoyer ma demande'}
                </button>
                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: 'rgba(0,0,0,.35)', textAlign: 'center', marginTop: 10 }}>Devis gratuit · Réponse sous 24h</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉVÉNEMENTS ───────────────────────────────────────────────────────

function SectionEvenements({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const evs = ea(config.evenements, CONFIG_BOULANGERIE_DEFAUT.evenements);
  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Ateliers & Agenda</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Événements à <em style={{ fontStyle: 'italic', color: cp }}>venir</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
          {evs.map((ev, i) => (
            <div key={i} style={{ background: '#fff', border: `2px solid ${i===0?cp:'rgba(0,0,0,.06)'}`, borderRadius: 4, padding: '24px', borderTop: `4px solid ${i%2===0?cp:ca}`, transition: 'all .3s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(-4px)'; el.style.boxShadow=`0 12px 36px ${cp}20`; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='none'; el.style.boxShadow='none'; }}>
              <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 14, color: i%2===0?cp:ca, marginBottom: 10 }}>{ev.date}</p>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: config.couleurTexte, marginBottom: 10 }}>{ev.titre}</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.7 }}>{ev.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const avis = ea(config.avis, CONFIG_BOULANGERIE_DEFAUT.avis);
  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.1 }}>
            Ils nous <em style={{ fontStyle: 'italic', color: cp }}>font confiance</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(avis.length,3)},1fr)`, gap: 24 }}>
          {avis.map((a, i) => (
            <div key={i} style={{ background: '#fff', padding: '28px 24px', borderTop: `4px solid ${i%2===0?cp:ca}`, boxShadow: '0 2px 12px rgba(0,0,0,.06)', transition: 'transform .3s,box-shadow .3s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(-4px)'; el.style.boxShadow='0 12px 40px rgba(0,0,0,.1)'; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='none'; el.style.boxShadow='0 2px 12px rgba(0,0,0,.06)'; }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {[...Array(a.note)].map((_,j) => <span key={j} style={{ color: ca, fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 16, color: 'rgba(0,0,0,.65)', lineHeight: 1.8, marginBottom: 20 }}>"{a.texte}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cp}` }} />
                <div>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 14, fontWeight: 700, color: config.couleurTexte }}>{a.auteur}</p>
                  <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 13, color: cp }}>{a.produitFavori}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigBoulangerie }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  const horaires = ea(config.horaires, CONFIG_BOULANGERIE_DEFAUT.horaires);
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const jourActuel = jours[new Date().getDay()];

  return (
    <section style={{ background: '#f5f0e8', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80 }}>
          <div>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 900, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Nous trouver</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,3.5vw,50px)', fontWeight: 800, color: config.couleurTexte, lineHeight: 1.15, marginBottom: 28 }}>
              Venez nous <em style={{ fontStyle: 'italic', color: cp }}>visiter</em>
            </h2>
            {[{i:'📍',l:'Adresse',v:`${config.adresse}, ${config.ville}`},{i:'📞',l:'Téléphone',v:config.telephone},{i:'✉️',l:'Email',v:config.email}].map((info,i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{info.i}</span>
                <div>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: ca, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>{info.l}</p>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 14, color: 'rgba(0,0,0,.65)' }}>{info.v}</p>
                </div>
              </div>
            ))}
            {/* Horaires */}
            <div style={{ background: '#fff', padding: '20px 22px', marginTop: 20, marginBottom: 24 }}>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 900, color: cp, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Horaires</p>
              {horaires.map((h, i) => {
                const estAuj = h.jour === jourActuel;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i<horaires.length-1?'1px solid rgba(0,0,0,.05)':'none', background: estAuj?`${ca}15`:'transparent' }}>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: estAuj?700:400, color: estAuj?config.couleurTexte:'rgba(0,0,0,.5)' }}>
                      {estAuj && '▶ '}{h.jour}
                    </span>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: estAuj?700:400, color: h.ouvert?(estAuj?ca:'rgba(0,0,0,.5)'):'#dc2626' }}>
                      {h.heures}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Réseaux */}
            <div style={{ display: 'flex', gap: 10 }}>
              {([['instagram','📸'],['facebook','📘']] as const).map(([k,ico]) =>
                config.reseaux?.[k] ? (
                  <a key={k} href={config.reseaux[k]} target="_blank" rel="noreferrer" style={{ width: 38, height: 38, background: cp, border: 'none', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', transition: 'filter .2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter='brightness(1.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter='none'}>{ico}</a>
                ) : null
              )}
            </div>
          </div>
          {/* Map */}
          <div>
            <div style={{ height: 460, overflow: 'hidden', border: `3px solid ${cp}30`, borderRadius: 4 }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" title="Localisation" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigBoulangerie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire; const ca = config.couleurAccent;
  return (
    <footer style={{ background: config.couleurFondSombre, padding: isMobile ? '0 20px' : '0 48px' }}>
      <div style={{ height: 4, background: `linear-gradient(90deg,${cp},${ca},${cp})`, margin: '0 -48px' }} />
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, padding: '52px 0 40px' }}>
        <div>
          <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 28, color: ca, marginBottom: 8 }}>{config.nomBoulangerie}</p>
          <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 16, color: `${ca}80`, marginBottom: 18 }}>"{config.citation}"</p>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>{config.adresse}<br />{config.ville}</p>
        </div>
        <div>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 900, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
          {[['accueil','Accueil'],['produits-page','Nos Produits'],['commande-page','Commander'],['contact-page','Contact']].map(([id,label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color=ca}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color='rgba(255,255,255,.4)'}>{label}</p>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 900, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Contact</p>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{config.telephone}</p>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{config.email}</p>
          <BadgeSortieFour horaires={ea(config.horaires,CONFIG_BOULANGERIE_DEFAUT.horaires)} cp={cp} ca={ca} />
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '18px 0', maxWidth: 1320, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 14, color: 'rgba(255,255,255,.2)' }}>🥐 Pétri avec amour depuis {config.fondee}</p>
        <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomBoulangerie}</p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateBoulangerieProps { config?: Partial<ConfigBoulangerie>; isPreview?: boolean; }

export default function TemplateBoulangerie({ config: partiel, isPreview }: TemplateBoulangerieProps) {
  const config: ConfigBoulangerie = {
    ...CONFIG_BOULANGERIE_DEFAUT, ...partiel,
    couleurPrimaire:   partiel?.couleurPrimaire   || CONFIG_BOULANGERIE_DEFAUT.couleurPrimaire,
    couleurAccent:     partiel?.couleurAccent     || CONFIG_BOULANGERIE_DEFAUT.couleurAccent,
    couleurFond:       partiel?.couleurFond       || CONFIG_BOULANGERIE_DEFAUT.couleurFond,
    couleurFondSombre: partiel?.couleurFondSombre || CONFIG_BOULANGERIE_DEFAUT.couleurFondSombre,
    couleurTexte:      partiel?.couleurTexte      || CONFIG_BOULANGERIE_DEFAUT.couleurTexte,
  };
  const VALID_IDS = ['hero','stats','produits','apropos','specialites','commande','evenements','avis','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_BOULANGERIE_DEFAUT.sections);
  config.sections           = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_BOULANGERIE_DEFAUT.sections;
  config.stats              = ea(partiel?.stats,              CONFIG_BOULANGERIE_DEFAUT.stats);
  config.produits           = ea(partiel?.produits,           CONFIG_BOULANGERIE_DEFAUT.produits);
  config.avis               = ea(partiel?.avis,               CONFIG_BOULANGERIE_DEFAUT.avis);
  config.evenements         = ea(partiel?.evenements,         CONFIG_BOULANGERIE_DEFAUT.evenements);
  config.specialites        = ea(partiel?.specialites,        CONFIG_BOULANGERIE_DEFAUT.specialites);
  config.categoriesProduits = ea(partiel?.categoriesProduits, CONFIG_BOULANGERIE_DEFAUT.categoriesProduits);
  config.horaires           = ea(partiel?.horaires,           CONFIG_BOULANGERIE_DEFAUT.horaires);

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'produits':    return <SectionProduits    config={config} setPage={handlePage} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'specialites': return <SectionSpecialites config={config} />;
      case 'commande':    return <SectionCommande    config={config} />;
      case 'evenements':  return <SectionEvenements  config={config} />;
      case 'avis':        return <SectionAvis        config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond }}>
      <style>{getStyle(config)}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 66 }}>
        {page === 'accueil' && (<>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>)}
        {page === 'produits-page' && (<><SectionProduits config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'commande-page' && (<><SectionCommande config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page'  && (<><SectionContact  config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}