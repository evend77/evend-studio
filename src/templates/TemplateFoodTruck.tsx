// src/templates/TemplateFoodTruck.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Food Truck & Street Food
// Style : fond sombre #0d0d0d / accent orange #ff6b00 + jaune #ffd700
// Typo : Bebas Neue (impact) + Poppins (corps)
// Effets WOW :
//   - Camion SVG qui roule avec fumée animée et flammes
//   - Badge Ouvert/Fermé automatique selon horaires
//   - Map dynamique avec adresse du jour
//   - Cards menu qui flip au hover (3D)
//   - Sections ON/OFF + réordonnables
// Catégorie : resto

import React, { useState, useEffect, useRef } from 'react';

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface PlatMenu {
  nom: string;
  description: string;
  prix: string;
  photo: string;
  categorie: string;
  badge?: string;
  couleurBadge?: string;
  populaire?: boolean;
}

export interface AvisFoodTruck {
  texte: string;
  auteur: string;
  note: number;
  photo: string;
  date: string;
}

export interface ConfigFoodTruck {
  nomCamion: string;
  tagline: string;
  sousTagline: string;
  description: string;
  descriptionAPropos: string;
  couleurPrimaire: string;   // orange
  couleurSecondaire: string; // jaune
  couleurFond: string;       // sombre
  couleurTexte: string;
  emplacementAujourdhui: string;
  emplacementLien: string;
  horairesOuverture: { jour: string; heures: string; ouvert: boolean }[];
  photoHero: string;
  photoCamion: string;
  photoAPropos: string;
  stats: { valeur: string; label: string; icone: string }[];
  categoriesMenu: string[];
  plats: PlatMenu[];
  avis: AvisFoodTruck[];
  evenements: { titre: string; date: string; lieu: string; description: string }[];
  reseaux: { instagram?: string; facebook?: string; tiktok?: string };
  telephone: string;
  email: string;
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_FOODTRUCK_DEFAUT: ConfigFoodTruck = {
  nomCamion: 'Le Truck Fumant',
  tagline: 'Street Food.',
  sousTagline: 'Faite avec amour.',
  description: 'Le meilleur burger de la rue, préparé sur place avec des ingrédients locaux. Trouvez-nous chaque jour à un nouvel emplacement — suivez-nous!',
  descriptionAPropos: 'Depuis 2019, Le Truck Fumant sillonne les rues de Montréal pour vous offrir une expérience street food authentique. Tout est fait maison, des sauces aux pains briochés. On se voit dans la rue!',
  couleurPrimaire: '#ff6b00',
  couleurSecondaire: '#ffd700',
  couleurFond: '#0d0d0d',
  couleurTexte: '#f5f5f5',
  emplacementAujourdhui: '1234 rue Sainte-Catherine, Montréal, QC',
  emplacementLien: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',
  horairesOuverture: [
    { jour: 'Lundi',    heures: 'Fermé',        ouvert: false },
    { jour: 'Mardi',    heures: '11h – 21h',    ouvert: true  },
    { jour: 'Mercredi', heures: '11h – 21h',    ouvert: true  },
    { jour: 'Jeudi',    heures: '11h – 22h',    ouvert: true  },
    { jour: 'Vendredi', heures: '11h – 23h',    ouvert: true  },
    { jour: 'Samedi',   heures: '10h – 23h',    ouvert: true  },
    { jour: 'Dimanche', heures: '10h – 20h',    ouvert: true  },
  ],
  photoHero: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoCamion: 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoAPropos: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=900',
  stats: [
    { valeur: '500+', label: 'Burgers / semaine',  icone: '🍔' },
    { valeur: '4.9',  label: 'Note Google',         icone: '⭐' },
    { valeur: '5',    label: 'Ans sur la route',    icone: '🚚' },
    { valeur: '100%', label: 'Ingrédients locaux',  icone: '🌿' },
  ],
  categoriesMenu: ['Burgers', 'Frites', 'Hotdogs', 'Boissons', 'Desserts'],
  plats: [
    { nom: 'Le Classique Fumant', description: 'Boeuf Angus, cheddar fondu, laitue, tomate, oignons caramélisés, sauce secrète maison', prix: '14$', photo: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Burgers', badge: 'BEST-SELLER', couleurBadge: '#ff6b00', populaire: true },
    { nom: 'Le BBQ Smoky', description: 'Double boeuf, bacon fumé maison, sauce BBQ artisanale, coleslaw croustillant', prix: '17$', photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Burgers', badge: 'NOUVEAU', couleurBadge: '#22c55e', populaire: false },
    { nom: 'Le Végé Boom', description: 'Galette de pois chiches maison, avocat, feta, tomates séchées, pesto basilic', prix: '13$', photo: 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Burgers', populaire: false },
    { nom: 'Frites Fumantes', description: 'Frites maison coupe épaisse, assaisonnement paprika-ail, mayo truffe', prix: '7$', photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Frites', badge: 'INCONTOURNABLE', couleurBadge: '#ffd700', populaire: true },
    { nom: 'Poutine du Truck', description: 'Frites maison, fromage en grains frais, sauce brune au beurre brun', prix: '11$', photo: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Frites', populaire: false },
    { nom: 'Hot-Dog Montréalais', description: 'Saucisse fumée, moutarde jaune, choucroute maison, relish maison', prix: '9$', photo: 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Hotdogs', populaire: false },
    { nom: 'Limonade Gingembre', description: 'Limonade maison pressée, gingembre frais, menthe, sirop érable', prix: '5$', photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Boissons', populaire: false },
    { nom: 'Milkshake Fumant', description: 'Lait entier, glace artisanale, sirop maison, chantilly fraîche', prix: '8$', photo: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Desserts', badge: 'COUP DE COEUR', couleurBadge: '#e91e8c', populaire: true },
  ],
  avis: [
    { texte: 'Le meilleur burger de Montréal, sans hésitation. La sauce secrète est à tomber. Je les suis partout!', auteur: 'Jean-François B.', note: 5, photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', date: 'Il y a 2 jours' },
    { texte: 'Trouvé par hasard un vendredi soir. File de 20 personnes — ça valait LARGEMENT l\'attente. La poutine est divine!', auteur: 'Marie-Claude T.', note: 5, photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', date: 'Il y a 1 semaine' },
    { texte: 'Les frites fumantes + le classique = combo parfait. Les prix sont très raisonnables pour la qualité. À bientôt!', auteur: 'Patrick L.', note: 5, photo: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200', date: 'Il y a 3 jours' },
  ],
  evenements: [
    { titre: 'Festival Rue Sainte-Catherine', date: '21 juin 2026', lieu: 'Rue Sainte-Catherine, Montréal', description: 'On sera présents toute la journée pour la Fête de la Musique! Spécial burger du jour.' },
    { titre: 'March des Fermiers Atwater', date: 'Tous les samedis', lieu: 'Marché Atwater, Montréal', description: 'Retrouvez-nous chaque samedi matin au marché Atwater de 9h à 14h.' },
    { titre: 'Food Truck Rally MTL', date: '12 juillet 2026', lieu: 'Vieux-Port de Montréal', description: 'Le grand rassemblement des meilleurs food trucks de la ville. On vous y attend!' },
  ],
  reseaux: { instagram: '#', facebook: '#', tiktok: '#' },
  telephone: '(514) 555-0742',
  email: 'bonjour@letruckfumant.ca',
  sections: [
    { id: 'hero',        actif: true, ordre: 1,  label: 'Hero + Camion animé'       },
    { id: 'emplacement', actif: true, ordre: 2,  label: 'Emplacement du jour'       },
    { id: 'stats',       actif: true, ordre: 3,  label: 'Chiffres clés'             },
    { id: 'menu',        actif: true, ordre: 4,  label: 'Notre menu'                },
    { id: 'apropos',     actif: true, ordre: 5,  label: 'Notre histoire'            },
    { id: 'evenements',  actif: true, ordre: 6,  label: 'Événements & Présences'    },
    { id: 'avis',        actif: true, ordre: 7,  label: 'Avis clients'              },
    { id: 'contact',     actif: true, ordre: 8,  label: 'Contact & Réseaux'        },
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

function estOuvertMaintenant(horaires: ConfigFoodTruck['horairesOuverture']): boolean {
  const maintenant = new Date();
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const jourActuel = jours[maintenant.getDay()];
  const horaire = horaires.find(h => h.jour === jourActuel);
  if (!horaire || !horaire.ouvert) return false;
  const [debut, fin] = horaire.heures.split(' – ');
  if (!debut || !fin) return false;
  const toMin = (h: string) => {
    const [hh, mm] = h.replace('h', ':').split(':');
    return parseInt(hh) * 60 + (parseInt(mm) || 0);
  };
  const now = maintenant.getHours() * 60 + maintenant.getMinutes();
  return now >= toMin(debut) && now <= toMin(fin);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const getStyle = (c: ConfigFoodTruck) => `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}

@keyframes roule { 0%{transform:translateX(-120%)} 100%{transform:translateX(120vw)} }
@keyframes roueBas { 0%,100%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes fumee { 0%{transform:translateY(0) scale(1);opacity:.7} 100%{transform:translateY(-60px) scale(2.5);opacity:0} }
@keyframes flamme { 0%,100%{transform:scaleY(1) skewX(-5deg);opacity:.9} 50%{transform:scaleY(1.3) skewX(5deg);opacity:1} }
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes flipCard{0%{transform:rotateY(0)} 100%{transform:rotateY(180deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

.rv{opacity:0;transform:translateY(32px);transition:opacity .8s,transform .8s;}
.rv.vis{opacity:1;transform:none;}
.rv-l{opacity:0;transform:translateX(-40px);transition:opacity .8s,transform .8s;}
.rv-l.vis{opacity:1;transform:none;}
.rv-r{opacity:0;transform:translateX(40px);transition:opacity .8s,transform .8s;}
.rv-r.vis{opacity:1;transform:none;}

.btn-ft{
  background:${c.couleurPrimaire};color:#fff;border:none;
  padding:14px 36px;font-family:'Poppins',sans-serif;font-size:12px;
  font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;border-radius:4px;
  transition:all .25s;box-shadow:0 4px 20px ${c.couleurPrimaire}60;
}
.btn-ft:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 8px 30px ${c.couleurPrimaire}80;}

.btn-outline-ft{
  background:transparent;color:${c.couleurTexte};
  border:2px solid ${c.couleurTexte}50;
  padding:13px 34px;font-family:'Poppins',sans-serif;font-size:12px;
  font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;border-radius:4px;transition:all .25s;
}
.btn-outline-ft:hover{border-color:${c.couleurPrimaire};color:${c.couleurPrimaire};transform:translateY(-2px);}

.nav-ft{
  font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;
  letter-spacing:.15em;text-transform:uppercase;
  color:rgba(255,255,255,.75);cursor:pointer;background:none;border:none;
  transition:color .2s;position:relative;padding:4px 0;
}
.nav-ft::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:2px;background:${c.couleurPrimaire};transform:scaleX(0);transition:transform .3s;}
.nav-ft:hover,.nav-ft.active{color:${c.couleurPrimaire};}
.nav-ft:hover::after,.nav-ft.active::after{transform:scaleX(1);}

/* Flip card menu */
.flip-wrap{perspective:1000px;}
.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .6s;}
.flip-wrap:hover .flip-inner{transform:rotateY(180deg);}
.flip-front,.flip-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:8px;overflow:hidden;}
.flip-back{transform:rotateY(180deg);background:${c.couleurPrimaire};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}

.fw-inp{
  width:100%;padding:12px 16px;background:rgba(255,255,255,.08);
  border:none;border-bottom:2px solid rgba(255,255,255,.2);
  color:#fff;font-family:'Poppins',sans-serif;font-size:14px;
  outline:none;box-sizing:border-box;transition:border-color .2s;
}
.fw-inp:focus{border-bottom-color:${c.couleurPrimaire};}
.fw-inp::placeholder{color:rgba(255,255,255,.3);}
`;

// ─── CAMION SVG ───────────────────────────────────────────────────────────────

function CamionSVG({ cp, cs }: { cp: string; cs: string }) {
  return (
    <div style={{ position: 'absolute', bottom: 80, left: 0, width: '100%', pointerEvents: 'none', overflow: 'hidden', height: 160 }}>
      {/* Flammes sous le camion */}
      <div style={{ position: 'absolute', bottom: 40, left: '20%', display: 'flex', gap: 6 }}>
        {[1,2,3,4,5].map((_, i) => (
          <div key={i} style={{
            width: 12 + i * 4, height: 24 + i * 4,
            background: `linear-gradient(to top, #ff4400, #ff8800, ${cs})`,
            borderRadius: '50% 50% 20% 20%',
            animation: `flamme ${0.4 + i * 0.1}s ${i * 0.05}s ease-in-out infinite`,
            transformOrigin: 'bottom center',
            opacity: 0.85,
          }} />
        ))}
      </div>

      {/* Camion animé */}
      <div style={{ animation: 'roule 18s linear infinite', position: 'absolute', bottom: 28, left: 0 }}>
        <svg width="280" height="120" viewBox="0 0 280 120" fill="none">
          {/* Corps principal */}
          <rect x="40" y="20" width="200" height="75" rx="8" fill={cp} />
          {/* Toit */}
          <rect x="60" y="8" width="140" height="20" rx="6" fill={cp} />
          {/* Fenêtre service */}
          <rect x="150" y="28" width="70" height="45" rx="4" fill="#1a1a1a" opacity="0.8" />
          <rect x="155" y="33" width="60" height="35" rx="3" fill="#2a2a2a" />
          {/* Cabine */}
          <rect x="40" y="30" width="90" height="55" rx="6" fill={cp} />
          <rect x="48" y="38" width="55" height="38" rx="4" fill="#87CEEB" opacity="0.7" />
          {/* Texte sur camion */}
          <text x="155" y="68" fontFamily="Bebas Neue, sans-serif" fontSize="13" fill={cs} fontWeight="bold" textAnchor="middle">FOOD TRUCK</text>
          {/* Roues */}
          <circle cx="90" cy="96" r="22" fill="#222" />
          <circle cx="90" cy="96" r="14" fill="#444" />
          <circle cx="90" cy="96" r="5" fill={cs} />
          <circle cx="200" cy="96" r="22" fill="#222" />
          <circle cx="200" cy="96" r="14" fill="#444" />
          <circle cx="200" cy="96" r="5" fill={cs} />
          {/* Détails roues rayons */}
          {[0,60,120,180,240,300].map((deg, i) => (
            <line key={i} x1="90" y1="96"
              x2={90 + 12 * Math.cos(deg * Math.PI/180)}
              y2={96 + 12 * Math.sin(deg * Math.PI/180)}
              stroke="#666" strokeWidth="2" />
          ))}
          {[0,60,120,180,240,300].map((deg, i) => (
            <line key={i} x1="200" y1="96"
              x2={200 + 12 * Math.cos(deg * Math.PI/180)}
              y2={96 + 12 * Math.sin(deg * Math.PI/180)}
              stroke="#666" strokeWidth="2" />
          ))}
          {/* Pare-chocs */}
          <rect x="20" y="75" width="25" height="8" rx="2" fill="#333" />
          <rect x="235" y="75" width="25" height="8" rx="2" fill="#333" />
          {/* Tuyau échappement */}
          <rect x="22" y="55" width="6" height="25" rx="3" fill="#555" />
          <circle cx="25" cy="50" r="5" fill="#444" />
        </svg>

        {/* Fumée */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: -10 - i * 5, left: 22 + i * 3,
            width: 12 + i * 4, height: 12 + i * 4,
            background: 'rgba(200,200,200,0.5)',
            borderRadius: '50%',
            animation: `fumee ${1 + i * 0.3}s ${i * 0.2}s ease-out infinite`,
          }} />
        ))}
      </div>

      {/* Route */}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 28, background: '#1a1a1a', borderTop: '3px solid #333' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, display: 'flex', gap: 40, transform: 'translateY(-50%)', overflow: 'hidden' }}>
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} style={{ width: 60, height: 4, background: '#ffd700', opacity: 0.5, flexShrink: 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BADGE OUVERT/FERMÉ ───────────────────────────────────────────────────────

function BadgeStatut({ horaires }: { horaires: ConfigFoodTruck['horairesOuverture'] }) {
  const { isMobile } = useIsMobile();
  const ouvert = estOuvertMaintenant(horaires);
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const jourActuel = jours[new Date().getDay()];
  const horaire = horaires.find(h => h.jour === jourActuel);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: ouvert ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', border: `1px solid ${ouvert ? '#22c55e' : '#ef4444'}`, borderRadius: 20, padding: '6px 14px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ouvert ? '#22c55e' : '#ef4444', animation: ouvert ? 'pulse 2s infinite' : 'none' }} />
      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 700, color: ouvert ? '#22c55e' : '#ef4444' }}>
        {ouvert ? `🟢 Ouvert · ${horaire?.heures}` : '🔴 Fermé'}
      </span>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigFoodTruck; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? 'rgba(13,13,13,.97)' : 'rgba(13,13,13,.88)', backdropFilter: 'blur(16px)', borderBottom: scrolled ? `1px solid ${config.couleurPrimaire}30` : 'none', transition: 'all .4s', padding: isMobile ? '0 20px' : '0 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer' }}>
          <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 24, color: config.couleurPrimaire, letterSpacing: '0.08em', lineHeight: 1 }}>{config.nomCamion}</p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Food Truck</p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['accueil','Accueil'],['menu-page','Menu'],['contact-page','Contact']].map(([id,label]) => (
            <button key={id} className={`nav-ft${page===id?' active':''}`} onClick={() => setPage(id)}>{label}</button>
          ))}
        </div>
        <BadgeStatut horaires={ea(config.horairesOuverture, CONFIG_FOODTRUCK_DEFAUT.horairesOuverture)} />
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigFoodTruck; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire;
  const cs = config.couleurSecondaire;

  return (
    <section style={{ background: config.couleurFond, minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 64 }}>
      {/* Fond photo */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.15)' }} />
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${config.couleurFond}f0 0%, ${config.couleurFond}99 50%, transparent 100%)` }} />
      {/* Camion animé */}
      <CamionSVG cp={cp} cs={cs} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: isMobile ? '48px 20px' : '60px 48px', zIndex: 2 }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: 20, animation: 'fadeUp .6s ease both' }}>
            <BadgeStatut horaires={ea(config.horairesOuverture, CONFIG_FOODTRUCK_DEFAUT.horairesOuverture)} />
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(72px,12vw,150px)', color: '#fff', lineHeight: 0.88, letterSpacing: '0.02em', marginBottom: 6, animation: 'fadeUp .7s .1s ease both' }}>
            {config.tagline}
          </h1>
          <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(60px,10vw,130px)', lineHeight: 0.88, letterSpacing: '0.02em', marginBottom: 28, animation: 'fadeUp .7s .15s ease both', background: `linear-gradient(90deg,${cp},${cs})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {config.sousTagline}
          </h1>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.9, maxWidth: 520, marginBottom: 40, animation: 'fadeUp .7s .2s ease both' }}>
            {config.description}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeUp .7s .3s ease both' }}>
            <button className="btn-ft" onClick={() => setPage('menu-page')}>🍔 Voir le menu</button>
            <button className="btn-outline-ft" onClick={() => { const el = document.getElementById('emplacement'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
              📍 Nous trouver
            </button>
          </div>
          {/* Stats rapides */}
          <div style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap', animation: 'fadeUp .7s .4s ease both' }}>
            {ea(config.stats, CONFIG_FOODTRUCK_DEFAUT.stats).map((s, i) => (
              <div key={i}>
                <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: i % 2 === 0 ? cp : cs, lineHeight: 1 }}>{s.valeur}</p>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION EMPLACEMENT ──────────────────────────────────────────────────────

function SectionEmplacement({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire;
  const cs = config.couleurSecondaire;
  const horaires = ea(config.horairesOuverture, CONFIG_FOODTRUCK_DEFAUT.horairesOuverture);
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const jourActuel = jours[new Date().getDay()];

  // Construire URL embed dynamique depuis l'adresse
  const adresseEncoded = encodeURIComponent(config.emplacementAujourdhui);
  const mapUrl = config.emplacementLien || `https://maps.google.com/maps?q=${adresseEncoded}&output=embed`;

  return (
    <section id="emplacement" style={{ background: '#0f0f0f', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>On est où?</p>
          <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,6vw,80px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1, marginBottom: 16 }}>
            Notre emplacement du jour
          </h2>
          {/* Adresse en gros + badge ouvert */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: `${cp}15`, border: `2px solid ${cp}40`, borderRadius: 8, padding: '14px 24px', marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>📍</span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{config.emplacementAujourdhui}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <a href={`https://maps.google.com/?q=${adresseEncoded}`} target="_blank" rel="noreferrer"
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: cp, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Ouvrir dans Google Maps →
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 32 }}>
          {/* Map */}
          <div style={{ height: 420, overflow: 'hidden', border: `2px solid ${cp}30`, borderRadius: 8 }}>
            <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg)' }} allowFullScreen loading="lazy" title="Emplacement" />
          </div>

          {/* Horaires */}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '28px 24px' }}>
            <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: '#fff', letterSpacing: '0.05em', marginBottom: 20 }}>Nos horaires</p>
            {horaires.map((h, i) => {
              const estAujourdhui = h.jour === jourActuel;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < horaires.length-1 ? '1px solid rgba(255,255,255,.06)' : 'none', background: estAujourdhui ? `${cp}10` : 'transparent', margin: estAujourdhui ? '0 -12px' : '0', padding: estAujourdhui ? '10px 12px' : '10px 0', borderRadius: estAujourdhui ? 6 : 0 }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: estAujourdhui ? 700 : 400, color: estAujourdhui ? '#fff' : 'rgba(255,255,255,.5)' }}>
                    {estAujourdhui && <span style={{ color: cp, marginRight: 6 }}>▶</span>}
                    {h.jour}
                  </span>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: estAujourdhui ? 700 : 400, color: h.ouvert ? (estAujourdhui ? cs : 'rgba(255,255,255,.6)') : '#ef4444' }}>
                    {h.heures}
                  </span>
                </div>
              );
            })}
            <div style={{ marginTop: 20, padding: '12px', background: `${cp}15`, borderRadius: 6, textAlign: 'center' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: cp, fontWeight: 700, marginBottom: 4 }}>📲 Suivez-nous pour les updates!</p>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.4)' }}>L'emplacement peut varier selon les événements</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION STATS ────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.1);
  const stats = ea(config.stats, CONFIG_FOODTRUCK_DEFAUT.stats);
  const cols = [config.couleurPrimaire, config.couleurSecondaire, config.couleurPrimaire, config.couleurSecondaire];

  return (
    <section style={{ background: config.couleurPrimaire, padding: '0' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '48px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,.2)' : 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 10, animation: `float 3s ${i*.5}s ease-in-out infinite` }}>{s.icone}</div>
            <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(44px,5vw,64px)', color: '#fff', lineHeight: 1, marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>{s.valeur}</p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.8)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION MENU ─────────────────────────────────────────────────────────────

function SectionMenu({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire;
  const cs = config.couleurSecondaire;
  const plats = ea(config.plats, CONFIG_FOODTRUCK_DEFAUT.plats);
  const categories = ea(config.categoriesMenu, CONFIG_FOODTRUCK_DEFAUT.categoriesMenu);
  const [cat, setCat] = useState('Tous');
  const filtres = cat === 'Tous' ? plats : plats.filter(p => p.categorie === cat);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Notre carte</p>
          <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,6vw,80px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1 }}>
            Le menu du truck
          </h2>
          <div style={{ height: 4, width: 60, background: `linear-gradient(90deg,${cp},${cs})`, margin: '16px auto 0', borderRadius: 2 }} />
        </div>

        {/* Filtres catégories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          {['Tous', ...categories].map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: cat === c ? cp : 'rgba(255,255,255,.06)', color: cat === c ? '#fff' : 'rgba(255,255,255,.5)', border: `1px solid ${cat === c ? cp : 'rgba(255,255,255,.1)'}`, transition: 'all .25s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grille flip cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
          {filtres.map((p, i) => (
            <div key={i} className="flip-wrap" style={{ height: 300, cursor: 'pointer' }}>
              <div className="flip-inner" style={{ height: '100%' }}>
                {/* Face avant */}
                <div className="flip-front" style={{ border: `2px solid ${p.populaire ? cp : 'rgba(255,255,255,.08)'}`, boxShadow: p.populaire ? `0 0 30px ${cp}30` : 'none' }}>
                  <img src={p.photo} alt={p.nom} style={{ width: '100%', height: '65%', objectFit: 'cover', display: 'block', filter: 'brightness(.75)' }} />
                  {p.badge && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: p.couleurBadge || cp, color: '#fff', fontSize: 9, fontWeight: 800, fontFamily: "'Poppins',sans-serif", padding: '4px 10px', borderRadius: 3, letterSpacing: '0.1em' }}>
                      {p.badge}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.8)', color: cs, fontSize: 16, fontFamily: "'Bebas Neue',cursive", padding: '4px 12px', letterSpacing: '0.05em', borderRadius: 4 }}>
                    {p.prix}
                  </div>
                  <div style={{ padding: '14px 18px', background: 'rgba(13,13,13,.95)' }}>
                    <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.nom}</h3>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{p.description.slice(0,60)}...</p>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, right: 10, fontFamily: "'Poppins',sans-serif", fontSize: 9, color: cp, opacity: .6 }}>Survoler pour détails →</div>
                </div>
                {/* Face arrière */}
                <div className="flip-back">
                  <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 36, color: '#fff', letterSpacing: '0.05em', marginBottom: 12, textAlign: 'center' }}>{p.nom}</p>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.9)', lineHeight: 1.7, textAlign: 'center', marginBottom: 20 }}>{p.description}</p>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 48, color: cs, letterSpacing: '0.05em' }}>{p.prix}</div>
                  <div style={{ marginTop: 8, fontFamily: "'Poppins',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.categorie}</div>
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

function SectionAPropos({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(.08); const rvR = useReveal(.08);
  const cp = config.couleurPrimaire; const cs = config.couleurSecondaire;

  return (
    <section style={{ background: '#0f0f0f', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        <div ref={rvL.ref} className={`rv-l${rvL.vis?' vis':''}`} style={{ position: 'relative' }}>
          <div style={{ height: 480, overflow: 'hidden', border: `3px solid ${cp}40`, borderRadius: 4 }}>
            <img src={config.photoCamion} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.8)', transition: 'transform .7s' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'none'} />
          </div>
          {/* Badge décoratif */}
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg,${cp},${cs})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 30px ${cp}60` }}>
            <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: '#fff', lineHeight: 1 }}>2019</p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 8, color: 'rgba(255,255,255,.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sur la route</p>
          </div>
        </div>
        <div ref={rvR.ref} className={`rv-r${rvR.vis?' vis':''}`}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Notre histoire</p>
          <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,5vw,70px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1, marginBottom: 24 }}>
            La passion dans chaque burger
          </h2>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: 'rgba(255,255,255,.6)', lineHeight: 1.9, marginBottom: 32 }}>
            {config.descriptionAPropos}
          </p>
          {[['🌿','100% Local','Ingrédients de producteurs québécois'],['🔥','Fait Maison','Sauces, pains, condiments — tout est préparé sur place'],['🚚','Toujours en mouvement','Suivez-nous sur les réseaux pour notre emplacement du jour']].map(([ico,titre,desc]) => (
            <div key={titre} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{ico}</span>
              <div>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{titre}</p>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉVÉNEMENTS ───────────────────────────────────────────────────────

function SectionEvenements({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const cs = config.couleurSecondaire;
  const evs = ea(config.evenements, CONFIG_FOODTRUCK_DEFAUT.evenements);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Agenda</p>
          <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,6vw,80px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1 }}>
            Où nous retrouver
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evs.map((ev, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0, background: 'rgba(255,255,255,.04)', border: `1px solid rgba(255,255,255,.08)`, borderRadius: 8, overflow: 'hidden', transition: 'all .3s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = cp; el.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,.08)'; el.style.transform = 'none'; }}>
              {/* Date */}
              <div style={{ background: `linear-gradient(135deg,${cp},${cs})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: 'rgba(255,255,255,.8)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>{ev.date}</p>
              </div>
              {/* Contenu */}
              <div style={{ padding: '20px 24px' }}>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{ev.titre}</h3>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: cp, fontWeight: 600, marginBottom: 8 }}>📍 {ev.lieu}</p>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{ev.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const cs = config.couleurSecondaire;
  const avis = ea(config.avis, CONFIG_FOODTRUCK_DEFAUT.avis);

  return (
    <section style={{ background: '#0f0f0f', padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,6vw,80px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1 }}>Ce qu'ils en pensent</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(avis.length,3)},1fr)`, gap: 20 }}>
          {avis.map((a, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: `2px solid ${i===0?cp:'rgba(255,255,255,.08)'}`, borderRadius: 8, padding: '28px 24px', transition: 'all .3s', borderTop: `4px solid ${i%2===0?cp:cs}` }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.borderColor = cp; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.borderColor = i===0?cp:'rgba(255,255,255,.08)'; }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[...Array(a.note)].map((_,j) => <span key={j} style={{ color: cs, fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, marginBottom: 20 }}>"{a.texte}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cp}` }} />
                <div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.auteur}</p>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{a.date}</p>
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

function SectionContact({ config }: { config: ConfigFoodTruck }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(.05);
  const cp = config.couleurPrimaire; const cs = config.couleurSecondaire;
  const [form, setForm] = useState({ prenom: '', email: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, truck: config.nomCamion, type: 'contact-foodtruck', vendeur_id: config.vendeurId || 0 }) });
    } catch {}
    setEnvoye(true); // handled by hook setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 48px' }}>
      <div ref={rv.ref} className={`rv${rv.vis?' vis':''}`} style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80 }}>
          <div>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: cp, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Contact</p>
            <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(40px,5vw,70px)', color: '#fff', letterSpacing: '0.03em', lineHeight: 1, marginBottom: 32 }}>Restons en contact</h2>
            {[{ i: '📞', l: 'Téléphone', v: config.telephone }, { i: '✉️', l: 'Email', v: config.email }].map((info, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${cp}20`, border: `1px solid ${cp}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{info.i}</div>
                <div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>{info.l}</p>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{info.v}</p>
                </div>
              </div>
            ))}
            {/* Réseaux */}
            <div style={{ marginTop: 28 }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Suivez le truck!</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['instagram','📸','Instagram'],['facebook','📘','Facebook'],['tiktok','🎵','TikTok']].map(([k,ico,label]) =>
                  config.reseaux?.[k as keyof typeof config.reseaux] ? (
                    <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,.06)', border: `1px solid rgba(255,255,255,.12)`, borderRadius: 6, textDecoration: 'none', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = cp; (e.currentTarget as HTMLAnchorElement).style.background = `${cp}15`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.12)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.06)'; }}>
                      <span>{ico}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{label}</span>
                    </a>
                  ) : null
                )}
              </div>
            </div>
          </div>
          {/* Formulaire */}
          <div style={{ background: 'rgba(255,255,255,.04)', padding: '36px', border: `2px solid ${cp}30`, borderTop: `4px solid ${cp}`, borderRadius: 4 }}>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🚚</div>
                <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: '#fff', letterSpacing: '0.04em', marginBottom: 10 }}>Message envoyé!</h3>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: cp }}>On vous répond dès que possible!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: '#fff', letterSpacing: '0.04em', marginBottom: 4 }}>Nous écrire</h3>
                {[['Prénom *','prenom','Votre prénom'],['Email *','email','votre@email.ca']].map(([label,key,ph]) => (
                  <div key={key}>
                    <label style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input className="fw-inp" value={(form as any)[key]} onChange={e => setForm({...form,[key]:e.target.value})} placeholder={ph} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea className="fw-inp" rows={4} value={form.message} onChange={e => setForm({...form,message:e.target.value})} placeholder="Commande spéciale, événement privé, collaboration..." style={{ resize: 'none' }} />
                </div>
              <button disabled={loading || !form.prenom || !form.email} style={{ opacity: !form.prenom||!form.email ? .5 : 1, padding: '14px', textAlign: 'center' }}>
                  {loading ? '⏳ Envoi...' : '🍔 Envoyer'}
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

function Footer({ config, setPage }: { config: ConfigFoodTruck; setPage: (p: string) => void }) {
  const cp = config.couleurPrimaire; const cs = config.couleurSecondaire;
  return (
    <footer style={{ background: '#050505', borderTop: `1px solid ${cp}20`, padding: '48px 48px 0' }}>
      <div style={{ height: 4, background: `linear-gradient(90deg,${cp},${cs},${cp})`, margin: '-48px -48px 48px' }} />
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, paddingBottom: 40 }}>
        <div>
          <p style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: cp, letterSpacing: '0.06em', marginBottom: 6 }}>{config.nomCamion}</p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 16, maxWidth: 280 }}>{config.description.slice(0,100)}...</p>
          <BadgeStatut horaires={ea(config.horairesOuverture, CONFIG_FOODTRUCK_DEFAUT.horairesOuverture)} />
        </div>
        <div>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, fontWeight: 700, color: cp, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
          {[['accueil','Accueil'],['menu-page','Menu'],['contact-page','Contact']].map(([id,label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = cp}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,.35)'}>{label}</p>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, fontWeight: 700, color: cp, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Contact</p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>{config.telephone}</p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>{config.email}</p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)' }}>{config.emplacementAujourdhui.split(',')[1]}</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '16px 0', maxWidth: 1320, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.2)' }}>🚚 Fait avec feu & passion</p>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} {config.nomCamion}</p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateFoodTruckProps {
  config?: Partial<ConfigFoodTruck>;
  isPreview?: boolean;
}

export default function TemplateFoodTruck({ config: partiel, isPreview }: TemplateFoodTruckProps) {
  const config: ConfigFoodTruck = {
    ...CONFIG_FOODTRUCK_DEFAUT, ...partiel,
    couleurPrimaire:   partiel?.couleurPrimaire   || CONFIG_FOODTRUCK_DEFAUT.couleurPrimaire,
    couleurSecondaire: partiel?.couleurSecondaire || CONFIG_FOODTRUCK_DEFAUT.couleurSecondaire,
    couleurFond:       partiel?.couleurFond       || CONFIG_FOODTRUCK_DEFAUT.couleurFond,
    couleurTexte:      partiel?.couleurTexte      || CONFIG_FOODTRUCK_DEFAUT.couleurTexte,
  };

  const VALID_IDS = ['hero','emplacement','stats','menu','apropos','evenements','avis','contact'];
  const rawSections = ea(partiel?.sections, CONFIG_FOODTRUCK_DEFAUT.sections);
  config.sections       = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_FOODTRUCK_DEFAUT.sections;
  config.stats          = ea(partiel?.stats,           CONFIG_FOODTRUCK_DEFAUT.stats);
  config.plats          = ea(partiel?.plats,           CONFIG_FOODTRUCK_DEFAUT.plats);
  config.avis           = ea(partiel?.avis,            CONFIG_FOODTRUCK_DEFAUT.avis);
  config.evenements     = ea(partiel?.evenements,      CONFIG_FOODTRUCK_DEFAUT.evenements);
  config.categoriesMenu = ea(partiel?.categoriesMenu,  CONFIG_FOODTRUCK_DEFAUT.categoriesMenu);
  config.horairesOuverture = ea(partiel?.horairesOuverture, CONFIG_FOODTRUCK_DEFAUT.horairesOuverture);

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'emplacement': return <SectionEmplacement config={config} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'menu':        return <SectionMenu        config={config} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
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
      <div style={{ paddingTop: 64 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'menu-page'    && (<><SectionMenu    config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page' && (<><SectionContact config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}