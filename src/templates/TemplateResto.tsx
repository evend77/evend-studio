// src/templates/TemplateResto.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Restaurant & Fast Food
// Style : fond noir #0a0a0a / orange #e8820a / blanc
// Typo : Oswald (condensed bold) + Inter
// Sections ON/OFF + réordonnables — Gratuit

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface PlatMenu {
  nom: string;
  description: string;
  ingredients: string;
  prix: string;
  photo: string;
  categorie: string;  // 'burgers', 'accompagnements', 'boissons', 'desserts'
  vedette?: boolean;
}

export interface AvisResto {
  texte: string;
  auteur: string;
  role: string;
  photo: string;
  note: number;
}

export interface ConfigResto {
  // Identité
  nomResto: string;
  slogan: string;
  sloganAccent: string;
  description: string;
  logoEmoji: string;

  // Photos
  photoHero: string;
  photoQualite: string;
  photoAPropos1: string;
  photoAPropos2: string;
  photoReservation: string;

  // Couleurs
  couleurFond: string;       // #0a0a0a
  couleurAccent: string;     // #e8820a orange
  couleurFondCarte: string;  // #141414
  couleurTexte: string;      // #ffffff

  // Plats héros (galerie miniatures)
  photosHero: string[];

  // Menu
  plats: PlatMenu[];

  // Avis
  avis: AvisResto[];

  // Stats réservation
  statsClients: string;
  statsMoments: string;
  descReservation: string;

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  reseaux: { facebook?: string; instagram?: string; twitter?: string };
  coordGoogleMaps: string;

  // CTA
  boutonsCommande: string;
  boutonsMenu: string;

  // À propos
  aPropsTitre: string;
  aPropsTexte1: string;
  aPropsTexte2: string;

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_RESTO_DEFAUT: ConfigResto = {
  nomResto: 'BurgerLab',
  slogan: 'Le paradis ultime',
  sloganAccent: 'du burger.',
  description: 'Bienvenue chez BurgerLab — là où la saveur rencontre l\'innovation! Dégustez nos burgers artisanaux, préparés avec des ingrédients frais et des recettes audacieuses.',
  logoEmoji: '🍔',

  photoHero: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200',
  photoQualite: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoAPropos2: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoReservation: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1200',

  couleurFond: '#0a0a0a',
  couleurAccent: '#e8820a',
  couleurFondCarte: '#141414',
  couleurTexte: '#ffffff',

  photosHero: [
    'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=300',
  ],

  plats: [
    { nom: 'Burger Double Classique', description: 'Le classique revisité', ingredients: 'Bœuf, fromage fondu, laitue, tomate, cornichons, mayo maison', prix: '16.99$', photo: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'burgers', vedette: false },
    { nom: 'Burger Noir Signature', description: 'Notre pièce de résistance', ingredients: 'Pain noir, bœuf wagyu, bacon croustillant, fromage suisse, aïoli truffe', prix: '22.99$', photo: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'burgers', vedette: true },
    { nom: 'Burger Dinde & Avocat', description: 'Léger et savoureux', ingredients: 'Dinde, avocat, laitue, tomate, mayo citronnée', prix: '17.99$', photo: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'burgers', vedette: false },
    { nom: 'Burger Truffe & Champignons', description: 'Raffinement en bouche', ingredients: 'Bœuf, aïoli à la truffe, champignons sautés, fromage suisse, oignons caramélisés', prix: '19.99$', photo: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'burgers', vedette: false },
    { nom: 'Poutine Signature', description: 'Le classique québécois', ingredients: 'Frites, fromage en grains, sauce maison', prix: '8.99$', photo: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'accompagnements', vedette: false },
    { nom: 'Rondelles d\'Oignon', description: 'Croustillantes à souhait', ingredients: 'Oignons panés, sauce ranch maison', prix: '7.99$', photo: 'https://images.pexels.com/photos/2271107/pexels-photo-2271107.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'accompagnements', vedette: false },
    { nom: 'Bâtonnets de Mozzarella', description: 'Irrésistiblement fondants', ingredients: 'Mozzarella, chapelure dorée, sauce marinara', prix: '9.99$', photo: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'accompagnements', vedette: false },
  ],

  avis: [
    { texte: 'BurgerLab ne déçoit jamais! Les burgers sont parfaits et les frites sont à tomber. On reviendra chaque semaine!', auteur: 'Justin S.', role: 'Client fidèle', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Les meilleurs burgers en ville, sans aucun doute. La viande est fraîche, le service est rapide et l\'ambiance est super.', auteur: 'Marie T.', role: 'Blogueuse culinaire', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'On a commandé pour tout le bureau et tout le monde a adoré. Service impeccable et livraison rapide!', auteur: 'Pierre L.', role: 'Directeur commercial', photo: 'https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
  ],

  statsClients: '300+',
  statsMoments: '180+',
  descReservation: 'Réservez votre place chez BurgerLab dès aujourd\'hui! Que ce soit pour un repas décontracté ou une occasion spéciale, réservez une table pour profiter de nos burgers signature et de notre ambiance vibrante.',

  adresse: '1234 rue Sainte-Catherine Ouest',
  ville: 'Montréal, QC H3G 1P2',
  telephone: '(514) 555-0188',
  email: 'info@burgerlab.ca',
  horaires: ['Lun – Jeu : 11h – 22h', 'Ven – Sam : 11h – 23h', 'Dim : 12h – 21h'],
  reseaux: { facebook: '#', instagram: '#', twitter: '#' },
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',

  boutonsCommande: 'Commander maintenant',
  boutonsMenu: 'Voir le menu',

  aPropsTitre: 'Notre histoire',
  aPropsTexte1: 'Chez BurgerLab, nous sommes passionnés par la création de burgers qui éveillent vos papilles. En utilisant les ingrédients les plus frais et des recettes créatives, nous livrons des saveurs inoubliables à chaque bouchée.',
  aPropsTexte2: 'BurgerLab a démarré avec un rêve simple : créer l\'expérience burger parfaite. Fondé par des amoureux de la gastronomie, nous avons combiné des ingrédients frais, des saveurs audacieuses et une passion pour l\'innovation.',

  sections: [
    { id: 'hero',          actif: true,  ordre: 1, label: 'Hero (accueil)'        },
    { id: 'special',       actif: true,  ordre: 2, label: 'Offre spéciale'        },
    { id: 'menu',          actif: true,  ordre: 3, label: 'Menu complet'          },
    { id: 'accompagnements', actif: true, ordre: 4, label: 'Accompagnements'      },
    { id: 'qualite',       actif: true,  ordre: 5, label: 'Notre qualité (CTA)'   },
    { id: 'apropos',       actif: true,  ordre: 6, label: 'À propos'              },
    { id: 'avis',          actif: true,  ordre: 7, label: 'Avis clients'          },
    { id: 'reservation',   actif: true,  ordre: 8, label: 'Réservation de table'  },
    { id: 'contact',       actif: true,  ordre: 9, label: 'Contact & Carte'       },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function ea<T>(val: any, def: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : def;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigResto; page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const co = config.couleurAccent;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Caveat:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
        .nav-resto { font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(255,255,255,0.8); cursor:pointer; background:none; border:none; transition:color .2s; }
        .nav-resto:hover,.nav-resto.active { color:${co}; }
        .btn-orange { background:${co}; color:#fff; border:2px solid ${co}; border-radius:50px; padding:11px 24px; font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:0.05em; transition:filter .2s,transform .2s; }
        .btn-orange:hover { filter:brightness(.88); transform:scale(1.02); }
        .btn-outline-orange { background:transparent; color:${co}; border:2px solid ${co}; border-radius:50px; padding:11px 24px; font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:0.05em; transition:all .2s; }
        .btn-outline-orange:hover { background:${co}; color:#fff; }
        .btn-outline-blanc { background:transparent; color:#fff; border:2px solid #fff; border-radius:50px; padding:11px 24px; font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:0.05em; transition:all .2s; }
        .btn-outline-blanc:hover { background:#fff; color:#0a0a0a; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)} }
        .fu { animation:fadeUp .85s cubic-bezier(.22,1,.36,1) both; }
        .fu2 { animation:fadeUp .85s .15s cubic-bezier(.22,1,.36,1) both; }
        .fu3 { animation:fadeUp .85s .28s cubic-bezier(.22,1,.36,1) both; }
        .rv { opacity:0; transform:translateY(36px); transition:opacity .7s ease,transform .7s ease; }
        .rv.vis { opacity:1; transform:translateY(0); }
        .rv-l { opacity:0; transform:translateX(-40px); transition:opacity .7s ease,transform .7s ease; }
        .rv-l.vis { opacity:1; transform:translateX(0); }
        .rv-r { opacity:0; transform:translateX(40px); transition:opacity .7s ease,transform .7s ease; }
        .rv-r.vis { opacity:1; transform:translateX(0); }
        .plat-card { transition:transform .3s,box-shadow .3s; }
        .plat-card:hover { transform:translateY(-6px); box-shadow:0 20px 50px rgba(232,130,10,0.2); }
        .plat-card img { transition:transform .5s ease; }
        .plat-card:hover img { transform:scale(1.06) rotate(1deg); }
        .thumb { cursor:pointer; opacity:.6; border:2px solid transparent; border-radius:8px; overflow:hidden; transition:all .3s; }
        .thumb.actif,.thumb:hover { opacity:1; border-color:${co}; }
        .input-resto { width:100%; padding:14px 16px; background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; font-family:'Inter',sans-serif; font-size:14px; outline:none; box-sizing:border-box; transition:border-color .2s; }
        .input-resto:focus { border-color:${co}; }
        .input-resto::placeholder { color:rgba(255,255,255,0.4); }
        select.input-resto option { background:#1a1a1a; }
      `}</style>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? `rgba(10,10,10,0.97)` : 'rgba(10,8,5,.85)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${co}30` : 'none',
        transition: 'all .3s', padding: '0 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{config.logoEmoji}</span>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
              {config.nomResto.split(' ')[0]}
              <span style={{ color: co }}>{config.nomResto.includes(' ') ? config.nomResto.slice(config.nomResto.indexOf(' ')) : ''}</span>
            </span>
          </div>

          {/* Liens */}
          <div style={{ display: 'flex', gap: 28 }}>
            {[['accueil', 'Accueil'], ['apropos', 'À propos'], ['menu-page', 'Menu'], ['avis-page', 'Avis'], ['reservation-page', 'Réservation']].map(([id, label]) => (
              <button key={id} className={`nav-resto${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>{label}</button>
            ))}
          </div>

          {/* CTA */}
          <button className="btn-orange" onClick={() => setPage('reservation-page')}>
            Commander en ligne
          </button>
        </div>
      </nav>
    </>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const [photoActive, setPhotoActive] = useState(0);
  const photos = ea(config.photosHero, CONFIG_RESTO_DEFAUT.photosHero);

  useEffect(() => {
    const id = setInterval(() => setPhotoActive(p => (p + 1) % photos.length), 3500);
    return () => clearInterval(id);
  }, [photos.length]);

  return (
    <section style={{ background: config.couleurFond, minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 68, overflow: 'hidden', position: 'relative' }}>
      {/* Grain texture subtil */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.6 }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60, alignItems: 'center', width: '100%', position: 'relative' }}>
        {/* Texte */}
        <div>
          <p className="fu" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 20 }}>
            🔥 Fraîcheur & Innovation
          </p>
          <h1 className="fu2" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 700, color: '#fff', lineHeight: 0.95, marginBottom: 24, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            {config.slogan}<br />
            <span style={{ color: co }}>{config.sloganAccent.toUpperCase()}</span>
          </h1>
          <p className="fu3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 36, maxWidth: 440 }}>
            {config.description}
          </p>
          <div className="fu3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn-orange" onClick={() => setPage('reservation-page')}>{config.boutonsCommande}</button>
            <button className="btn-outline-blanc" onClick={() => setPage('menu-page')}>{config.boutonsMenu}</button>
          </div>

          {/* Miniatures */}
          <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
            {photos.map((url, i) => (
              <div key={i} className={`thumb${i === photoActive ? ' actif' : ''}`} style={{ width: 72, height: 56 }} onClick={() => setPhotoActive(i)}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Photo principale animée */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {photos.map((url, i) => (
            <img key={i} src={url} alt="plat vedette"
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                width: '90%', maxWidth: 520,
                objectFit: 'contain',
                opacity: i === photoActive ? 1 : 0,
                transform: i === photoActive ? 'scale(1)' : 'scale(0.92)',
                transition: 'opacity .7s ease, transform .7s ease',
                filter: 'drop-shadow(0 20px 60px rgba(232,130,10,0.3))',
              }}
            />
          ))}
        </div>
      </div>

      {/* Ticker bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: co, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: isMobile ? 24 : 60, animation: 'marquee 20s linear infinite', whiteSpace: 'nowrap', fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '0.15em' }}>
          {[...Array(5)].map((_, i) => (
            <span key={i}>🍔 BURGERS ARTISANAUX &nbsp;✦&nbsp; 🍟 FRITES MAISON &nbsp;✦&nbsp; 🧀 INGRÉDIENTS FRAIS &nbsp;✦&nbsp; 🌶 SAUCES SIGNATURE &nbsp;✦&nbsp;</span>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>
    </section>
  );
}

// ─── SECTION SPÉCIAL ──────────────────────────────────────────────────────────

function SectionSpecial({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const cf = config.couleurFond;
  const plats = ea(config.plats, CONFIG_RESTO_DEFAUT.plats);
  const platVedette = plats.find(p => p.vedette) || plats[1] || plats[0];
  const rv = useReveal(0.08);

  return (
    <section style={{ background: '#0d0d1a', padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
      {/* Taches décoratives */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: `${co}08`, borderRadius: '50%', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, background: `${co}06`, borderRadius: '50%', filter: 'blur(80px)' }} />

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center', position: 'relative' }}>
        {/* Photo gauche — plat vedette */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <img src={platVedette.photo} alt={platVedette.nom}
            style={{ width: '80%', maxWidth: 480, objectFit: 'contain', filter: `drop-shadow(0 24px 60px ${co}40)`, animation: 'float 4s ease-in-out infinite' }}
          />
          <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
        </div>

        {/* Texte droite */}
        <div>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: co, marginBottom: 12, letterSpacing: '0.05em' }}>De notre menu</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 20, letterSpacing: '-0.01em' }}>
            Découvrez nos<br /><span style={{ color: co }}>Offres Spéciales</span>
          </h2>
          <h3 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: co, marginBottom: 8 }}>{platVedette.nom}</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.6 }}>{platVedette.ingredients}</p>
          <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 42, fontWeight: 700, color: '#fff', marginBottom: 32 }}>{platVedette.prix}</p>
          <button className="btn-orange" onClick={() => setPage('reservation-page')}>{config.boutonsCommande}</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION MENU ─────────────────────────────────────────────────────────────

function SectionMenu({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const co = config.couleurAccent;
  const cf = config.couleurFond;
  const cfk = config.couleurFondCarte;
  const rv = useReveal(0.05);
  const plats = ea(config.plats, CONFIG_RESTO_DEFAUT.plats).filter(p => p.categorie === 'burgers');

  return (
    <section style={{ background: cf, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: co, marginBottom: 10 }}>Menu complet</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Découvrez nos <span style={{ color: co }}>Spécialités</span>
          </h2>
        </div>

        {/* Liste menu — alternance gauche/droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {plats.map((p, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
              gap: 0,
              minHeight: 320,
            }}>
              {/* Photo */}
              <div style={{ order: i % 2 === 0 ? 1 : 2, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px', background: i % 2 === 0 ? cf : cfk }}>
                <img src={p.photo} alt={p.nom} style={{ width: '70%', maxWidth: 380, objectFit: 'contain', filter: `drop-shadow(0 16px 40px ${co}30)` }} className="plat-card" />
              </div>
              {/* Texte */}
              <div style={{ order: i % 2 === 0 ? 2 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', background: i % 2 === 0 ? cfk : cf }}>
                <h3 style={{ fontFamily: "'Caveat', cursive", fontSize: 32, color: co, marginBottom: 6 }}>{p.nom}</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.6 }}>{p.ingredients}</p>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 40, fontWeight: 700, color: '#fff' }}>{p.prix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ACCOMPAGNEMENTS ──────────────────────────────────────────────────

function SectionAccompagnements({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const co = config.couleurAccent;
  const rv = useReveal(0.05);
  const acc = ea(config.plats, CONFIG_RESTO_DEFAUT.plats).filter(p => p.categorie === 'accompagnements');

  return (
    <section style={{ background: '#0d0d0d', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: co, marginBottom: 10 }}>Côté</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Savourez les <span style={{ color: co }}>Croustillants</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(acc.length, 3)}, 1fr)`, gap: 40 }}>
          {acc.map((a, i) => (
            <div key={i} className="plat-card" style={{ textAlign: 'center', cursor: 'default' }}>
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <img src={a.photo} alt={a.nom} style={{ maxHeight: '100%', width: 'auto', objectFit: 'contain', filter: `drop-shadow(0 12px 32px ${co}30)` }} />
              </div>
              <h3 style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: co, marginBottom: 6 }}>{a.nom}</h3>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: '#fff' }}>{a.prix}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION QUALITÉ ──────────────────────────────────────────────────────────

function SectionQualite({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const rv = useReveal(0.08);

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: 480, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoQualite})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' }} />
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '80px 40px', textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 32 }}>
          Découvrez notre <span style={{ color: co }}>Qualité Authentique</span>
        </h2>
        <button className="btn-orange" onClick={() => setPage('menu-page')} style={{ fontSize: 16, padding: '14px 36px' }}>
          {config.boutonsMenu}
        </button>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigResto }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 40, alignItems: 'center' }}>
        {/* Photo gauche */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4', border: `2px solid ${co}40` }}>
          <img src={config.photoAPropos1} alt="cuisine" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s', display: 'block' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>

        {/* Texte centre */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: co, marginBottom: 10 }}>Notre histoire</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>
            {config.aPropsTitre.toUpperCase()}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 16 }}>{config.aPropsTexte1}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>{config.aPropsTexte2}</p>
        </div>

        {/* Photo droite */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`} style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4', border: `2px solid ${co}40` }}>
          <img src={config.photoAPropos2} alt="burgers" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s', display: 'block' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config }: { config: ConfigResto }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const rv = useReveal(0.05);
  const avis = ea(config.avis, CONFIG_RESTO_DEFAUT.avis);
  const [actif, setActif] = useState(0);

  return (
    <section style={{ background: '#0d0d0d', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Texte */}
        <div>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: co, marginBottom: 10 }}>Avis</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 16 }}>
            Ce que disent<br /><span style={{ color: co }}>nos clients</span>
          </h2>
        </div>

        {/* Carte avis */}
        <div style={{ position: 'relative' }}>
          {/* Cadre décoratif */}
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${co}30`, borderRadius: 24, transform: 'translate(8px, 8px)' }} />
          <div style={{ background: config.couleurFondCarte, borderRadius: 24, padding: '36px', position: 'relative', border: `1px solid ${co}20` }}>
            {/* Quote icon */}
            <div style={{ fontSize: 48, color: co, lineHeight: 1, marginBottom: 16, fontFamily: 'Georgia, serif' }}>"</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>
              {avis[actif]?.texte}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={avis[actif]?.photo} alt={avis[actif]?.auteur} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${co}` }} />
              <div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>{avis[actif]?.auteur}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: co }}>{avis[actif]?.role}</p>
              </div>
            </div>
            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {avis.map((_, i) => (
                <button key={i} onClick={() => setActif(i)} style={{ width: i === actif ? 28 : 10, height: 10, borderRadius: 5, border: 'none', cursor: 'pointer', background: i === actif ? co : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION RÉSERVATION ──────────────────────────────────────────────────────

function SectionReservation({ config }: { config: ConfigResto }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const [form, setForm] = useState({ nom: '', adultes: '2', enfants: '0', date: '', heure: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, resto: config.nomResto, type: 'reservation-table', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: 600, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoReservation})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.25)' }} />

      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '80px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center', width: '100%' }}>
        {/* Formulaire */}
        <div style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '40px', border: `1px solid ${co}30` }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: 28 }}>
            Réserver une <span style={{ color: co }}>Table</span>
          </h2>

          {envoye ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, color: '#fff', marginBottom: 10 }}>Réservation confirmée!</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Nous vous attendons avec impatience!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Nom *</label>
                <input className="input-resto" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Adultes *</label>
                  <select className="input-resto" value={form.adultes} onChange={e => setForm({ ...form, adultes: e.target.value })}>
                    {[1,2,3,4,5,6,7,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Enfants</label>
                  <select className="input-resto" value={form.enfants} onChange={e => setForm({ ...form, enfants: e.target.value })}>
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Date *</label>
                  <input type="date" className="input-resto" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Heure *</label>
                  <input type="time" className="input-resto" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Message spécial</label>
                <textarea className="input-resto" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Allergies, occasion spéciale..."
                  style={{ resize: 'none' }} />
              </div>
              <button disabled={loading || !form.nom || !form.date || !form.heure}
                className="btn-orange"
                style={{ opacity: !form.nom || !form.date || !form.heure ? 0.5 : 1, borderRadius: 8, padding: '14px' }}>
                {loading ? 'Envoi...' : 'Confirmer la réservation'}
              </button>
            </div>
          )}
        </div>

        {/* Stats droite */}
        <div style={{ color: '#fff' }}>
          <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: co, marginBottom: 20 }}>Sublimez votre expérience</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 40 }}>{config.descReservation}</p>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 56, color: co, lineHeight: 1, marginBottom: 4 }}>{config.statsClients}</p>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: '#fff', opacity: 0.7 }}>Clients chaque jour</p>
            </div>
            <div>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 56, color: co, lineHeight: 1, marginBottom: 4 }}>{config.statsMoments}</p>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: '#fff', opacity: 0.7 }}>Moments mémorables</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigResto }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurAccent;
  const horaires = ea(config.horaires, CONFIG_RESTO_DEFAUT.horaires);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: co, marginBottom: 10 }}>Contactez-nous</p>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Visitez notre <span style={{ color: co }}>Restaurant</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 24 : 60, alignItems: 'flex-start' }}>
          {/* Infos */}
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 32 }}>
              Des questions ou besoin d'aide? Contactez {config.nomResto}! Nous sommes là pour rendre votre expérience burger incroyable.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: co, fontSize: 18, width: 24, flexShrink: 0 }}>📍</span>
                <div>
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Adresse</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{config.adresse}<br />{config.ville}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: co, fontSize: 18, width: 24, flexShrink: 0 }}>✉️</span>
                <div>
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Courriel</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: co }}>{config.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: co, fontSize: 18, width: 24, flexShrink: 0 }}>📞</span>
                <div>
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Téléphone</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{config.telephone}</p>
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div style={{ background: config.couleurFondCarte, borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 700, color: co, marginBottom: 12, letterSpacing: '0.1em' }}>HEURES D'OUVERTURE</p>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{h}</p>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12, letterSpacing: '0.1em' }}>SUIVEZ-NOUS</p>
              <div style={{ display: 'flex', gap: 14 }}>
                {config.reseaux?.facebook && (
                  <a href={config.reseaux.facebook} target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', border: `1px solid ${co}30`, transition: 'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${co}30`}>
                    📘
                  </a>
                )}
                {config.reseaux?.instagram && (
                  <a href={config.reseaux.instagram} target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', border: `1px solid ${co}30`, transition: 'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${co}30`}>
                    📸
                  </a>
                )}
                {config.reseaux?.twitter && (
                  <a href={config.reseaux.twitter} target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', border: `1px solid ${co}30`, transition: 'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${co}30`}>
                    🐦
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Carte Google Maps */}
          <div style={{ borderRadius: 20, overflow: 'hidden', height: 420, border: `1px solid ${co}20` }}>
            <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localisation du restaurant" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigResto; setPage: (p: string) => void }) {
  const co = config.couleurAccent;

  return (
    <footer style={{ background: co, padding: '16px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#fff', opacity: 0.8 }}>
          Politique de confidentialité
        </p>
        <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          © {new Date().getFullYear()} {config.nomResto} — Tous droits réservés
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['accueil', 'Accueil'], ['menu-page', 'Menu'], ['reservation-page', 'Réservation']].map(([id, label]) => (
            <span key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#fff', opacity: 0.8, cursor: 'pointer' }}>{label}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateRestoProps {
  config?: Partial<ConfigResto>;
  isPreview?: boolean;
}

export default function TemplateResto({ config: partiel, isPreview }: TemplateRestoProps) {
  const config: ConfigResto = { ...CONFIG_RESTO_DEFAUT, ...partiel };
  config.plats       = ea(partiel?.plats,       CONFIG_RESTO_DEFAUT.plats);
  config.avis        = ea(partiel?.avis,        CONFIG_RESTO_DEFAUT.avis);
  config.horaires    = ea(partiel?.horaires,    CONFIG_RESTO_DEFAUT.horaires);
  config.photosHero  = ea(partiel?.photosHero,  CONFIG_RESTO_DEFAUT.photosHero);
  const VALID_IDS_RESTO = ['hero', 'special', 'menu', 'accompagnements', 'qualite', 'apropos', 'avis', 'reservation', 'contact'];
  const rawSectionsResto = ea(partiel?.sections, CONFIG_RESTO_DEFAUT.sections);
  config.sections = rawSectionsResto.every(s => VALID_IDS_RESTO.includes(s.id))
    ? rawSectionsResto
    : CONFIG_RESTO_DEFAUT.sections;

  const [page, setPage] = useState('accueil');

  const handlePage = (p: string) => {
    setPage(p);
    if (!isPreview) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionsActives = [...config.sections]
    .filter(s => s.actif)
    .sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':            return <SectionHero            config={config} setPage={handlePage} />;
      case 'special':         return <SectionSpecial         config={config} setPage={handlePage} />;
      case 'menu':            return <SectionMenu            config={config} setPage={handlePage} />;
      case 'accompagnements': return <SectionAccompagnements config={config} setPage={handlePage} />;
      case 'qualite':         return <SectionQualite         config={config} setPage={handlePage} />;
      case 'apropos':         return <SectionAPropos         config={config} />;
      case 'avis':            return <SectionAvis            config={config} />;
      case 'reservation':     return <SectionReservation     config={config} />;
      case 'contact':         return <SectionContact         config={config} />;
      default:                return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Caveat:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 68 }}>
        {page === 'accueil' && (
          <>
            {sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'menu-page' && (
          <>
            <SectionMenu config={config} setPage={handlePage} />
            <SectionAccompagnements config={config} setPage={handlePage} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'apropos' && (
          <>
            <SectionAPropos config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'avis-page' && (
          <>
            <SectionAvis config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'reservation-page' && (
          <>
            <SectionReservation config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'contact-page' && (
          <>
            <SectionContact config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
      </div>
    </div>
  );
}