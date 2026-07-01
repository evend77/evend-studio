// src/templates/TemplateBistro.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Bistro & Café
// Style : fond noir #0d0d0d / brun chaud #8b6914 / blanc ivoire
// Typo : Space Grotesk (ultra bold) + Inter
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : resto

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface ItemMenuBistro {
  nom: string;
  description: string;
  prix: string;
  photo: string;
  categorie: string; // 'cafes', 'patisseries', 'lattes', 'boissons'
}

export interface CaracteristiqueBistro {
  icone: string; // emoji SVG
  texte: string;
}

export interface ConfigBistro {
  // Identité
  nomBistro: string;
  sloganHero: string;     // Géant en arrière-plan
  sloganSub: string;      // Petite phrase sous le héro
  descriptionCourte: string;
  descriptionLongue: string;

  // Photos
  photoHero: string;
  photosGalerie: string[];   // 4 photos galerie home
  photoAPropos1: string;
  photoAPropos2: string;
  photoSpecial1: string;     // photo gauche section "spécialité"
  photoSpecial2: string;     // photo droite section "spécialité"
  photoReservation: string;

  // Couleurs
  couleurFond: string;         // #0d0d0d
  couleurNav: string;          // #1a1410 brun nav
  couleurAccent: string;       // #8b6914 brun doré
  couleurTexte: string;        // #ffffff
  couleurTexteClair: string;   // rgba(255,255,255,0.6)

  // Menu
  items: ItemMenuBistro[];

  // Caractéristiques "Pourquoi nous"
  caracteristiques: CaracteristiqueBistro[];

  // Tagline section spécialité
  titreSpecial: string;
  descSpecial: string;

  // À propos
  titreAPropos: string;
  descAPropos: string;

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  coordGoogleMaps: string;
  reseaux: { facebook?: string; twitter?: string; youtube?: string; instagram?: string };

  // Footer
  descFooter: string;

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_BISTRO_DEFAUT: ConfigBistro = {
  nomBistro: 'Café Arôme',
  sloganHero: 'CAFÉ\nARÔME',
  sloganSub: 'TOUT PEUT ATTENDRE. PRENEZ UN MOMENT CAFÉ.',
  descriptionCourte: 'Vivez la pure félicité d\'une tasse parfaitement préparée chez Café Arôme. Embarquez dans un délicieux voyage de saveurs où le riche arôme et le goût éveillent vos sens.',
  descriptionLongue: 'Entrez dans un espace chaleureux et accueillant qui inspire la détente et la connexion à chaque visite.',

  photoHero: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photosGalerie: [
    'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  photoAPropos1: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoAPropos2: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoSpecial1: 'https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoSpecial2: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoReservation: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=1200',

  couleurFond: '#0d0d0d',
  couleurNav: '#1a1410',
  couleurAccent: '#8b6914',
  couleurTexte: '#ffffff',
  couleurTexteClair: 'rgba(255,255,255,0.6)',

  items: [
    { nom: 'Espresso Maison', description: 'Un espresso double intense, crema dorée', prix: '3.50$', photo: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'cafes' },
    { nom: 'Cappuccino Artisanal', description: 'Mousse de lait onctueuse, cacao saupoudré', prix: '5.25$', photo: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'cafes' },
    { nom: 'Cold Brew Signature', description: 'Infusion à froid 24h, doux et corsé', prix: '6.00$', photo: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'cafes' },
    { nom: 'Croissant Beurre', description: 'Feuilletage pur beurre, doré à souhait', prix: '4.50$', photo: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'patisseries' },
    { nom: 'Pancakes aux Fruits', description: 'Moelleux, garnis de fruits frais et sirop d\'érable', prix: '12.50$', photo: 'https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'patisseries' },
    { nom: 'Latte Caramel Salé', description: 'Lait vapeur, sirop caramel artisanal', prix: '6.75$', photo: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'lattes' },
    { nom: 'Matcha Latte', description: 'Matcha japonais premium, doux et velouté', prix: '7.00$', photo: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'lattes' },
    { nom: 'Chocolat Chaud Belge', description: 'Chocolat noir fondu, lait entier, crème fouettée', prix: '5.75$', photo: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=500', categorie: 'boissons' },
  ],

  caracteristiques: [
    { icone: '☕', texte: 'Nos cafés sont soigneusement sélectionnés pour leur qualité, leur saveur et leur impact social.' },
    { icone: '🫖', texte: 'Nos mélanges uniques vous offrent une aventure gustative à chaque gorgée.' },
    { icone: '🏡', texte: 'Nous créons des espaces pour que les amateurs de café se réunissent et savourent ensemble.' },
  ],

  titreSpecial: 'NOTRE PRÉPARATION SIGNATURE',
  descSpecial: 'Chez Café Arôme, découvrez un café d\'exception préparé pour sublimer chaque instant. Que vous savouries votre remontant quotidien ou célébriez une occasion spéciale, nous apportons chaleur et saveur à votre journée!',

  titreAPropos: 'À PROPOS DE CAFÉ ARÔME',
  descAPropos: 'Dégustez le meilleur café de qualité supérieure, sélectionné avec soin auprès de producteurs responsables. Chaque tasse raconte une histoire de terroir, de passion et de savoir-faire.',

  adresse: '500 rue Saint-Denis, 2e étage',
  ville: 'Montréal, QC H2J 2L7',
  telephone: '(514) 555-0142',
  email: 'bonjour@cafearome.ca',
  horaires: ['Lun – Ven : 10h – 21h', 'Samedi : 9h – 22h', 'Dimanche : 10h – 22h'],
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',
  reseaux: { facebook: '#', twitter: '#', youtube: '#', instagram: '#' },

  descFooter: 'Entrez dans un espace chaleureux et accueillant qui inspire la détente et la connexion à chaque visite.',

  sections: [
    { id: 'hero',        actif: true,  ordre: 1, label: 'Hero (accueil)'       },
    { id: 'galerie',     actif: true,  ordre: 2, label: 'Galerie photos'       },
    { id: 'apropos',     actif: true,  ordre: 3, label: 'À propos du bistro'   },
    { id: 'special',     actif: true,  ordre: 4, label: 'Préparation spéciale' },
    { id: 'menu',        actif: true,  ordre: 5, label: 'Notre menu'           },
    { id: 'pourquoi',    actif: true,  ordre: 6, label: 'Pourquoi nous'        },
    { id: 'reservation', actif: true,  ordre: 7, label: 'Réservation'          },
    { id: 'contact',     actif: true,  ordre: 8, label: 'Contact & Carte'      },
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

function Nav({ config, page, setPage }: { config: ConfigBistro; page: string; setPage: (p: string) => void }) {
  const ca = config.couleurAccent;
  const cn = config.couleurNav;

  const liens = [
    ['accueil', 'ACCUEIL'],
    ['apropos-page', 'À PROPOS'],
    ['menu-page', 'MENU'],
    ['reservation-page', 'RÉSERVATION'],
    ['contact-page', 'CONTACT'],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .nav-bistro-link {
          font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.12em; cursor:pointer; background:none; border:none;
          padding:0 20px; color:rgba(255,255,255,0.75); transition:color .2s;
          position:relative; height:100%; display:flex; align-items:center;
        }
        .nav-bistro-link.active,.nav-bistro-link:hover { color:#fff; }
        .nav-bistro-link.active { background:${ca}; }
        @keyframes heroSlide { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
        .bistro-fu { animation:heroSlide .9s cubic-bezier(.22,1,.36,1) both; }
        .bistro-fu2 { animation:heroSlide .9s .15s cubic-bezier(.22,1,.36,1) both; }
        .bistro-fu3 { animation:heroSlide .9s .28s cubic-bezier(.22,1,.36,1) both; }
        .rv { opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease; }
        .rv.vis { opacity:1;transform:translateY(0); }
        .rv-l { opacity:0;transform:translateX(-36px);transition:opacity .7s ease,transform .7s ease; }
        .rv-l.vis { opacity:1;transform:translateX(0); }
        .rv-r { opacity:0;transform:translateX(36px);transition:opacity .7s ease,transform .7s ease; }
        .rv-r.vis { opacity:1;transform:translateX(0); }
        .item-menu-bistro { transition:transform .3s,box-shadow .3s; cursor:default; }
        .item-menu-bistro:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.4); }
        .item-menu-bistro img { transition:transform .5s ease; }
        .item-menu-bistro:hover img { transform:scale(1.05); }
        .btn-bistro {
          background:${ca}; color:#fff; border:none; padding:14px 36px;
          font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:700;
          letter-spacing:0.1em; cursor:pointer; transition:filter .2s,transform .2s;
        }
        .btn-bistro:hover { filter:brightness(.88); transform:translateY(-1px); }
        .btn-bistro-outline {
          background:transparent; color:#fff; border:1.5px solid #fff; padding:13px 32px;
          font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.1em; cursor:pointer; transition:all .2s;
        }
        .btn-bistro-outline:hover { background:#fff; color:#0d0d0d; }
        .input-bistro {
          width:100%; padding:14px 16px; background:transparent;
          border:1px solid rgba(255,255,255,0.2); color:#fff;
          font-family:'Inter',sans-serif; font-size:14px; outline:none;
          box-sizing:border-box; transition:border-color .2s;
        }
        .input-bistro:focus { border-color:${ca}; }
        .input-bistro::placeholder { color:rgba(255,255,255,0.35); }
        select.input-bistro option { background:#1a1a1a; }
      `}</style>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: cn }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
          {/* Logo gauche */}
          <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.15em' }}>
              {config.nomBistro.toUpperCase()}
            </span>
          </div>

          {/* Liens nav */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {liens.map(([id, label]) => (
              <button key={id} className={`nav-bistro-link${page === id ? ' active' : ''}`} onClick={() => setPage(id)}
                style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', color: page === id ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                {label}
              </button>
            ))}
          </div>
          {/* placeholder droite */}
          <div />
        </div>
        {/* Ligne séparatrice fine */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </nav>
    </>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigBistro; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cf = config.couleurFond;
  const ca = config.couleurAccent;

  return (
    <section style={{ background: cf, minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingTop: 64 }}>
      {/* Photo fond avec overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.22)' }} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: isMobile ? '60px 20px' : '80px 60px', width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', alignItems: 'center', gap: isMobile ? 24 : 60 }}>
        {/* Nom géant gauche */}
        <div>
          <h1 className="bistro-fu" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(72px, 12vw, 160px)',
            fontWeight: 700, color: '#fff', lineHeight: 0.9,
            letterSpacing: '-0.02em', margin: 0,
            whiteSpace: 'pre-line',
          }}>
            {config.sloganHero}
          </h1>
        </div>

        {/* Texte droite */}
        <div>
          <p className="bistro-fu2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.25em', marginBottom: 28, textTransform: 'uppercase' }}>
            {config.sloganSub}
          </p>
          <p className="bistro-fu3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, marginBottom: 40, maxWidth: 420 }}>
            {config.descriptionCourte}
          </p>
          <div className="bistro-fu3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn-bistro" onClick={() => setPage('menu-page')}>Explorer le menu</button>
            <button className="btn-bistro-outline" onClick={() => setPage('reservation-page')}>Réserver une table</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION GALERIE ──────────────────────────────────────────────────────────

function SectionGalerie({ config, setPage }: { config: ConfigBistro; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const photos = ea(config.photosGalerie, CONFIG_BISTRO_DEFAUT.photosGalerie);

  // Layout : 3 colonnes en haut, 1 grande + texte en bas
  return (
    <section style={{ background: config.couleurFond, padding: '0 0 0' }}>
      {/* Grille 3 photos haut */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 0 }}>
        {photos.slice(0, 3).map((url, i) => (
          <div key={i} style={{ height: 340, overflow: 'hidden' }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>

      {/* Photo grande + texte */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0 }}>
        <div style={{ height: 400, overflow: 'hidden' }}>
          <img src={photos[3] || photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s ease' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '60px 80px', background: '#111' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            À propos de {config.nomBistro}
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            {config.titreAPropos}
          </h2>
          <button className="btn-bistro" onClick={() => setPage('apropos-page')}>À propos de nous</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 60px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Photos empilées */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4', marginBottom: 0 }}>
            <img src={config.photoAPropos1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
          </div>
          {/* Petite photo superposée */}
          <div style={{ position: 'absolute', bottom: -24, right: -24, width: '45%', aspectRatio: '1/1', overflow: 'hidden', border: `4px solid ${config.couleurFond}` }}>
            <img src={config.photoAPropos2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>

        {/* Texte droite */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`} style={{ paddingRight: 20 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>Notre histoire</p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 28 }}>
            {config.titreAPropos}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 36 }}>
            {config.descAPropos}
          </p>
          <button className="btn-bistro">En savoir plus</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION SPÉCIALITÉ ───────────────────────────────────────────────────────

function SectionSpecial({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.08);

  return (
    <section style={{ background: '#111', padding: '0' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', minHeight: 560 }}>
        {/* Photo gauche */}
        <div style={{ overflow: 'hidden' }}>
          <img src={config.photoSpecial1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>

        {/* Texte centre */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: isMobile ? '48px 20px' : '60px 48px' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            Spécialité
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 20 }}>
            {config.titreSpecial}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32 }}>
            {config.descSpecial}
          </p>
          <button className="btn-bistro-outline">À propos de nous</button>
        </div>

        {/* Photo droite */}
        <div style={{ overflow: 'hidden' }}>
          <img src={config.photoSpecial2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION MENU ─────────────────────────────────────────────────────────────

function SectionMenu({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.05);
  const items = ea(config.items, CONFIG_BISTRO_DEFAUT.items);

  const categories = Array.from(new Set(items.map(i => i.categorie)));
  const [catActive, setCatActive] = useState<string>('tous');

  const labelsCategories: Record<string, string> = {
    'tous': 'TOUT LE MENU',
    'cafes': 'CAFÉS',
    'patisseries': 'PÂTISSERIES',
    'lattes': 'LATTES',
    'boissons': 'BOISSONS',
  };

  const itemsFiltres = catActive === 'tous' ? items : items.filter(i => i.categorie === catActive);

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '60px 20px' : '100px 60px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Titre géant */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Ce que nous servons</p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(48px, 8vw, 108px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-0.02em' }}>
            NOTRE<br />MENU
          </h2>
        </div>

        {/* Filtres catégories */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {['tous', ...categories].map(cat => (
            <button key={cat} onClick={() => setCatActive(cat)} style={{
              padding: '14px 24px', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
              background: catActive === cat ? ca : 'transparent',
              color: catActive === cat ? '#fff' : 'rgba(255,255,255,0.5)',
              borderBottom: catActive === cat ? `2px solid ${ca}` : '2px solid transparent',
              transition: 'all .2s',
            }}>
              {labelsCategories[cat] || cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grille items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {itemsFiltres.map((item, i) => (
            <div key={i} className="item-menu-bistro" style={{ background: '#111', overflow: 'hidden' }}>
              <div style={{ height: 240, overflow: 'hidden' }}>
                <img src={item.photo} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '20px 24px' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {item.nom}
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 12 }}>{item.description}</p>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: ca }}>{item.prix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION POURQUOI NOUS ────────────────────────────────────────────────────

function SectionPourquoi({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.08);
  const caract = ea(config.caracteristiques, CONFIG_BISTRO_DEFAUT.caracteristiques);

  return (
    <section style={{ background: '#111', padding: isMobile ? '60px 20px' : '100px 60px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Texte + caractéristiques */}
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 48 }}>
            DES EXPÉRIENCES CAFÉ UNIQUES
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {caract.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, border: `1px solid ${ca}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {c.icone}
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, paddingTop: 4 }}>
                  {c.texte}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div style={{ overflow: 'hidden', aspectRatio: '4/5' }}>
          <img src={config.photoSpecial2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s' }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION RÉSERVATION ──────────────────────────────────────────────────────

function SectionReservation({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const [form, setForm] = useState({ taille: '2', date: '', heure: '', nom: '', email: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bistro: config.nomBistro, type: 'reservation-bistro', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: '0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: 600 }}>
        {/* Photo */}
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <img src={config.photoReservation} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.7)' }} />
        </div>

        {/* Formulaire */}
        <div style={{ background: '#111', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Réservation</p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 8 }}>
            RÉSERVER UNE TABLE
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 36 }}>
            SÉLECTIONNEZ VOS DÉTAILS ET NOUS TROUVERONS LES MEILLEURES PLACES POUR VOUS
          </p>

          {envoye ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: '#fff', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
                RÉSERVATION CONFIRMÉE
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Nous vous attendons avec impatience!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Taille du groupe</label>
                <select className="input-bistro" value={form.taille} onChange={e => setForm({ ...form, taille: e.target.value })}>
                  {['1 invité','2 invités','3 invités','4 invités','5 invités','6 invités','7 invités','8 invités','10+ invités'].map((v, i) => (
                    <option key={i} value={String(i + 1)}>{v}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Date</label>
                <input type="date" className="input-bistro" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ colorScheme: 'dark' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Heure</label>
                <select className="input-bistro" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })}>
                  {['8h00','8h30','9h00','9h30','10h00','10h30','11h00','11h30','12h00','12h30','13h00','14h00','15h00','16h00','17h00','18h00','19h00','20h00','21h00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Nom</label>
                <input className="input-bistro" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Courriel</label>
                <input type="email" className="input-bistro" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.ca" />
              </div>
              <button disabled={loading || !form.date || !form.nom}
                style={{ opacity: !form.date || !form.nom ? 0.5 : 1, width: '100%', textAlign: 'center', padding: '16px' }}>
                {loading ? 'ENVOI...' : 'RÉSERVER MAINTENANT'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigBistro }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const horaires = ea(config.horaires, CONFIG_BISTRO_DEFAUT.horaires);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, bistro: config.nomBistro, type: 'contact-bistro', vendeur_id: config.vendeurId || 0 }) });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: '#0d0d0d', padding: isMobile ? '60px 20px' : '100px 60px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Titre géant */}
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Contactez-nous</p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.9 }}>
            VISITEZ<br />NOTRE CAFÉ
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80 }}>
          {/* Infos + carte */}
          <div>
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Heures d'ouverture</h3>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '0.02em' }}>{h}</p>
              ))}
            </div>
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Contact</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{config.telephone}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: ca }}>{config.email}</p>
            </div>
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Localisation</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.8 }}>
                {config.adresse}<br />{config.ville}
              </p>
            </div>
            {/* Carte */}
            <div style={{ height: 280 }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, display: 'block', filter: 'grayscale(1) invert(0.85)' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localisation" />
            </div>
          </div>

          {/* Formulaire contact */}
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 32 }}>Envoyez-nous un message</h3>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: '#fff', letterSpacing: '0.05em' }}>MESSAGE ENVOYÉ</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Nous vous répondrons sous 24h.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Prénom *</label>
                    <input className="input-bistro" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Nom *</label>
                    <input className="input-bistro" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Courriel *</label>
                  <input type="email" className="input-bistro" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Téléphone</label>
                  <input type="tel" className="input-bistro" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="Téléphone" />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Message *</label>
                  <textarea className="input-bistro" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Votre message..." style={{ resize: 'none' }} />
                </div>
                <button className="btn-bistro" onClick={handleSubmit} disabled={loading || !form.prenom || !form.nom || !form.email || !form.message}
                  style={{ opacity: !form.prenom || !form.nom || !form.email || !form.message ? 0.5 : 1, width: '100%', textAlign: 'center', padding: '16px' }}>
                  {loading ? 'ENVOI...' : 'ENVOYER LE MESSAGE'}
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

function Footer({ config, setPage }: { config: ConfigBistro; setPage: (p: string) => void }) {
  const ca = config.couleurAccent;

  return (
    <footer style={{ background: ca, padding: '48px 60px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
        {/* Logo + desc */}
        <div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', marginBottom: 12 }}>
            {config.nomBistro.toUpperCase()}
          </p>
          {/* Icônes réseaux */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {[['facebook', '📘'], ['twitter', '🐦'], ['youtube', '📺'], ['instagram', '📸']].map(([res, ico]) => (
              config.reseaux?.[res as keyof typeof config.reseaux] ? (
                <a key={res} href={config.reseaux[res as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', transition: 'background .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.15)'}>
                  {ico}
                </a>
              ) : null
            ))}
          </div>
        </div>
        {/* Menu nav */}
        <div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
          {[['accueil', 'Accueil'], ['apropos-page', 'À propos'], ['menu-page', 'Menu'], ['reservation-page', 'Réservation'], ['contact-page', 'Contact']].map(([id, label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.75)'}>
              {label}
            </p>
          ))}
        </div>
        {/* Adresse */}
        <div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Adresse</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, letterSpacing: '0.02em' }}>{config.adresse}<br />{config.ville}</p>
        </div>
        {/* Description */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>{config.descFooter}</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20, display: 'flex', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} {config.nomBistro.toUpperCase()} — TOUS DROITS RÉSERVÉS
        </p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateBistroProps {
  config?: Partial<ConfigBistro>;
  isPreview?: boolean;
}

export default function TemplateBistro({ config: partiel, isPreview }: TemplateBistroProps) {
  const config: ConfigBistro = { ...CONFIG_BISTRO_DEFAUT, ...partiel };
  config.items           = ea(partiel?.items,           CONFIG_BISTRO_DEFAUT.items);
  config.caracteristiques= ea(partiel?.caracteristiques,CONFIG_BISTRO_DEFAUT.caracteristiques);
  config.horaires        = ea(partiel?.horaires,        CONFIG_BISTRO_DEFAUT.horaires);
  config.photosGalerie   = ea(partiel?.photosGalerie,   CONFIG_BISTRO_DEFAUT.photosGalerie);
  const VALID_IDS_BISTRO = ['hero', 'galerie', 'apropos', 'special', 'menu', 'pourquoi', 'reservation', 'contact'];
  const rawSectionsBistro = ea(partiel?.sections, CONFIG_BISTRO_DEFAUT.sections);
  config.sections = rawSectionsBistro.every(s => VALID_IDS_BISTRO.includes(s.id))
    ? rawSectionsBistro
    : CONFIG_BISTRO_DEFAUT.sections;

  const [page, setPage] = useState('accueil');
  const handlePage = (p: string) => { setPage(p); if (!isPreview) window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'galerie':     return <SectionGalerie     config={config} setPage={handlePage} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'special':     return <SectionSpecial     config={config} />;
      case 'menu':        return <SectionMenu        config={config} />;
      case 'pourquoi':    return <SectionPourquoi    config={config} />;
      case 'reservation': return <SectionReservation config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 64 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'apropos-page' && (<><SectionAPropos config={config} /><SectionPourquoi config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'menu-page' && (<><SectionMenu config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'reservation-page' && (<><SectionReservation config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page' && (<><SectionContact config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}