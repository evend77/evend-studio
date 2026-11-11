// src/pages/PageAccueil.tsx
// e-Vend Studio — Refonte visuelle futuriste
// IMPORTANT : les composants de navigation, les destinations et les données dynamiques
// de PageTemplates sont conservés. Les textes et fonctionnalités existants sont maintenus.

import { useEffect, useRef } from 'react';
import {
  TEMPLATES as TOUS_LES_TEMPLATES,
  PHOTOS as PHOTOS_TEMPLATES,
  GROUPES as GROUPES_TEMPLATES,
} from './PageTemplates';
import MenuPublic from '../components/MenuPublic';
import BasDePage from '../components/BasDePage';
import BoutonInstallerStudio from '../components/BoutonInstallerStudio';

// Illustration décorative créée pour e-Vend Studio.
// Copier le dossier public/images fourni avec ce fichier dans le dossier public du projet.
const VISUELS = {
  hero: '/images/evend-studio-hero-visual.webp',
  editor: '/images/evend-studio-editor-visual.webp',
};

const PHOTOS = {
  seller: 'https://images.pexels.com/photos/5647688/pexels-photo-5647688.jpeg?auto=compress&cs=tinysrgb&w=800',
};

interface Template {
  id: string;
  nom: string;
  image: string;
  categorie: string;
}

export default function PageAccueil() {
  const heroRef = useRef<HTMLElement>(null);

  // Ouvre la connexion dans un nouvel onglet, comme dans la version actuelle.
  const ouvrirLogin = () => {
    window.open('/login', '_blank', 'noopener,noreferrer');
  };

  // Sélection des quatre templates vedettes : logique d'origine conservée.
  const IDS_VEDETTE = [
    'boutique-simplisse',
    'salon-coiffure',
    'multi-vendeur-premium',
    'vitrine-resto',
  ];

  const templates: Template[] = IDS_VEDETTE
    .map((id) => TOUS_LES_TEMPLATES.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => ({
      id: t.id,
      nom: t.nom,
      image: PHOTOS_TEMPLATES[t.id] || PHOTOS_TEMPLATES.hero,
      categorie: GROUPES_TEMPLATES.find((g) => g.id === t.groupe)?.label || '',
    }));

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const y = Math.min(window.scrollY, window.innerHeight);
        hero.style.setProperty('--hero-scroll', `${y * 0.12}px`);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="studio-home">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .studio-home {
          --studio-bg: #050b18;
          --studio-bg-2: #08162b;
          --studio-panel: rgba(10, 28, 52, .72);
          --studio-cyan: #00d7ff;
          --studio-turquoise: #00e3c1;
          --studio-text: #f4f8ff;
          --studio-muted: #a9bdd5;
          min-height: 100vh;
          overflow: hidden;
          color: var(--studio-text);
          background: var(--studio-bg);
          font-family: 'Inter', sans-serif;
          isolation: isolate;
        }
        .studio-home *, .studio-home *::before, .studio-home *::after { box-sizing: border-box; }
        .studio-home button { font: inherit; }
        .studio-home a { color: inherit; }
        .studio-home section[id] { scroll-margin-top: 92px; }
        .studio-home html { scroll-behavior: smooth; }

        @keyframes studio-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes studio-float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-13px) rotate(0deg); }
        }
        @keyframes studio-pulse {
          0%, 100% { opacity: .55; transform: scale(.96); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes studio-sheen {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes studio-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .studio-home .reveal { animation: studio-fade-up .75s cubic-bezier(.2,.7,.2,1) both; }
        .studio-home .reveal-delay-1 { animation-delay: .12s; }
        .studio-home .reveal-delay-2 { animation-delay: .24s; }
        .studio-home .reveal-delay-3 { animation-delay: .36s; }

        /* HERO — composition cinématographique inspirée de SnowRoute */
        .studio-hero {
          min-height: min(850px, 100svh);
          min-height: max(720px, min(850px, 100svh));
          position: relative;
          display: flex;
          align-items: center;
          isolation: isolate;
          padding: 124px max(5.2vw, 28px) 76px;
          background:
            radial-gradient(ellipse at 72% 46%, rgba(0, 119, 255, .22), transparent 43%),
            radial-gradient(ellipse at 12% 90%, rgba(0, 211, 255, .12), transparent 38%),
            linear-gradient(112deg, #030916 0%, #06152c 48%, #041027 100%);
          overflow: hidden;
        }
        .studio-hero::before {
          content: ''; position: absolute; inset: 0; z-index: -2;
          background-image: linear-gradient(rgba(77,164,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(77,164,255,.045) 1px, transparent 1px);
          background-size: 58px 58px;
          mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);
          opacity: .5;
        }
        .studio-hero::after {
          content: ''; position: absolute; z-index: -1; width: 720px; height: 720px;
          right: 3%; top: 2%; border-radius: 50%;
          border: 1px solid rgba(0, 205, 255, .13);
          box-shadow: 0 0 90px rgba(0, 151, 255, .12), inset 0 0 90px rgba(0, 151, 255, .08);
          animation: studio-orbit 90s linear infinite;
        }
        .studio-hero-inner {
          width: 100%; max-width: 1480px; margin: 0 auto; position: relative;
          display: grid; grid-template-columns: minmax(390px, .91fr) minmax(500px, 1.09fr);
          align-items: center; gap: 10px;
        }
        .studio-hero-copy { position: relative; z-index: 4; max-width: 650px; padding: 16px 0 24px; }
        /* Bouton « Installer e-Vend Studio » : mobile seulement, au-dessus du badge ; caché s'il est vide */
        .studio-install-mobile { display: none; }
        .studio-eyebrow {
          display: inline-flex; align-items: center; gap: 11px; margin-bottom: 25px;
          padding: 9px 17px; border: 1px solid rgba(0, 207, 255, .42); border-radius: 999px;
          color: #5ce9ff; background: rgba(0, 157, 224, .12);
          box-shadow: 0 0 28px rgba(0, 195, 255, .15), inset 0 0 18px rgba(0, 195, 255, .08);
          font-size: 12px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase;
        }
        .studio-eyebrow-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--studio-turquoise); box-shadow: 0 0 12px var(--studio-turquoise); }
        .studio-hero h1 {
          margin: 0 0 22px; color: #f5f9ff; font-size: clamp(46px, 5.3vw, 82px);
          line-height: .99; font-weight: 900; letter-spacing: -.065em;
          text-shadow: 0 8px 45px rgba(0, 0, 0, .35);
        }
        .studio-hero h1 span {
          display: inline-block; color: transparent;
          background: linear-gradient(100deg, #fff 0%, #a9f5ff 26%, #00d7ff 60%, #00e5c0 100%);
          -webkit-background-clip: text; background-clip: text;
          filter: drop-shadow(0 0 22px rgba(0, 198, 255, .2));
        }
        .studio-hero-description { max-width: 600px; color: #c0d0e4; font-size: clamp(15px, 1.25vw, 18px); line-height: 1.75; margin: 0 0 30px; }
        .studio-hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 13px; margin-bottom: 31px; }
        .studio-btn-primary, .studio-btn-secondary, .studio-btn-templates, .studio-template-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 11px;
          border-radius: 13px; cursor: pointer; text-decoration: none;
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, background .22s ease;
        }
        .studio-btn-primary {
          min-height: 58px; padding: 0 25px; color: #00101c; border: 1px solid #6df4ff;
          background: linear-gradient(105deg, #00c8ff, #00e5ce 55%, #21bfff);
          box-shadow: 0 0 20px rgba(0, 205, 255, .4), 0 0 55px rgba(0, 164, 255, .2), inset 0 1px 0 rgba(255,255,255,.65);
          font-weight: 800; font-size: 15px;
        }
        .studio-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 0 28px rgba(0, 205, 255, .62), 0 14px 35px rgba(0,0,0,.3); }
        .studio-btn-secondary {
          min-height: 56px; padding: 0 22px; color: #e7f5ff; border: 1px solid rgba(92, 190, 255, .52);
          background: rgba(5, 22, 44, .62); backdrop-filter: blur(12px); font-weight: 700; font-size: 14px;
        }
        .studio-btn-secondary:hover { transform: translateY(-3px); border-color: var(--studio-cyan); background: rgba(0, 130, 210, .18); }
        .studio-hero-proof { display: flex; flex-wrap: wrap; gap: 12px 22px; color: #a9c0d9; font-size: 12px; }
        .studio-hero-proof span { display: inline-flex; align-items: center; gap: 7px; }
        .studio-proof-check { color: #41e9d0; font-size: 15px; }
        .studio-hero-art { position: relative; min-width: 0; transform: translateY(var(--hero-scroll, 0)); transition: transform .08s linear; }
        .studio-hero-art::before {
          content: ''; position: absolute; inset: 15% 4% 3%; border-radius: 50%;
          background: rgba(0, 157, 255, .28); filter: blur(75px); animation: studio-pulse 7s ease-in-out infinite;
        }
        .studio-hero-image { display: block; position: relative; z-index: 1; width: 112%; max-width: none; margin-left: -4%; height: auto; object-fit: contain; filter: drop-shadow(0 28px 42px rgba(0,0,0,.45)); animation: studio-float 8s ease-in-out infinite; }
        .studio-float-card {
          position: absolute; z-index: 2; display: flex; align-items: center; gap: 11px;
          padding: 13px 16px; border-radius: 14px; color: #eafaff;
          border: 1px solid rgba(57, 207, 255, .5); background: rgba(4, 22, 46, .78);
          box-shadow: 0 12px 40px rgba(0,0,0,.3), 0 0 24px rgba(0, 188, 255, .13);
          backdrop-filter: blur(16px); font-size: 12px; font-weight: 700;
        }
        .studio-float-card strong { display: block; color: #fff; font-size: 13px; margin-bottom: 3px; }
        .studio-float-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #46e8ff; background: rgba(0, 190, 255, .13); font-size: 19px; }
        .studio-float-one { top: 9%; right: 0; animation: studio-float 7s ease-in-out infinite; }
        .studio-float-two { bottom: 13%; left: 0; animation: studio-float 8s 1s ease-in-out infinite; }

        /* Bandeau de bénéfices sous le visuel principal */
        .studio-benefit-strip { position: relative; z-index: 5; max-width: 1380px; margin: -2px auto 0; padding: 0 28px 34px; }
        .studio-benefit-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid rgba(39, 171, 255, .35); border-radius: 18px; overflow: hidden; background: linear-gradient(110deg, rgba(6,24,48,.92), rgba(8,39,69,.78)); box-shadow: 0 18px 55px rgba(0,0,0,.22), 0 0 30px rgba(0,150,255,.09); backdrop-filter: blur(16px); }
        .studio-benefit { display: flex; align-items: center; gap: 13px; padding: 19px 22px; min-width: 0; border-right: 1px solid rgba(71, 174, 255, .2); }
        .studio-benefit:last-child { border-right: 0; }
        .studio-benefit-icon { flex: 0 0 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; color: #35e5ff; background: rgba(0, 184, 255, .12); font-size: 21px; box-shadow: inset 0 0 16px rgba(0, 193, 255, .08); }
        .studio-benefit strong { display: block; color: #f3f9ff; font-size: 12px; margin-bottom: 4px; }
        .studio-benefit small { display: block; color: #9db7d1; font-size: 11px; line-height: 1.4; }

        /* Sections */
        .studio-section { position: relative; padding: 104px 28px; background: #071326; }
        .studio-section.alt { background: linear-gradient(145deg, #050d1b 0%, #091a31 55%, #061326 100%); }
        .studio-section::before { content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 194, 255, .24), transparent); }
        .studio-container { width: 100%; max-width: 1220px; margin: 0 auto; position: relative; }
        .studio-section-heading { text-align: center; max-width: 760px; margin: 0 auto 54px; }
        .studio-section-kicker { display: inline-flex; align-items: center; gap: 8px; color: #4de5ff; border: 1px solid rgba(0, 205, 255, .25); background: rgba(0, 168, 230, .09); border-radius: 999px; padding: 7px 13px; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 17px; }
        .studio-section-title { margin: 0 0 14px; color: #f3f8ff; font-size: clamp(30px, 4vw, 48px); line-height: 1.12; font-weight: 850; letter-spacing: -.045em; }
        .studio-accent { color: #22d9f3; text-shadow: 0 0 24px rgba(0, 200, 255, .2); }
        .studio-section-subtitle { margin: 0; color: #a7bad1; font-size: 16px; line-height: 1.7; }

        /* Templates dynamiques */
        .studio-templates-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        .studio-template-card { min-width: 0; overflow: hidden; border-radius: 17px; cursor: pointer; border: 1px solid rgba(76, 171, 255, .23); background: linear-gradient(145deg, rgba(15,38,66,.96), rgba(5,17,34,.96)); box-shadow: 0 14px 35px rgba(0,0,0,.2); transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
        .studio-template-card:hover { transform: translateY(-9px); border-color: rgba(0, 215, 255, .75); box-shadow: 0 22px 48px rgba(0,0,0,.35), 0 0 28px rgba(0, 180, 255, .13); }
        .studio-template-image-wrap { position: relative; aspect-ratio: 1.12 / 1; overflow: hidden; background: #0b1c32; }
        .studio-template-image-wrap::after { content: ''; position: absolute; inset: 35% 0 0; background: linear-gradient(transparent, rgba(3,12,26,.6)); pointer-events: none; }
        .studio-template-image { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .5s ease; }
        .studio-template-card:hover .studio-template-image { transform: scale(1.07); }
        .studio-template-badge { position: absolute; z-index: 1; top: 13px; left: 13px; padding: 6px 10px; border-radius: 999px; color: #bdf8ff; border: 1px solid rgba(61, 213, 255, .42); background: rgba(3,18,37,.82); backdrop-filter: blur(10px); font-size: 10px; font-weight: 700; }
        .studio-template-info { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px; }
        .studio-template-name { margin: 0; color: #f1f7ff; font-size: 14px; font-weight: 700; }
        .studio-template-btn { flex: 0 0 auto; padding: 8px 11px; color: #4de7ff; border: 1px solid rgba(0, 198, 255, .27); background: rgba(0, 174, 230, .09); border-radius: 9px; font-size: 11px; font-weight: 700; }
        .studio-template-btn:hover { background: rgba(0, 174, 230, .2); }
        .studio-templates-cta { text-align: center; margin-top: 37px; }
        .studio-btn-templates { min-height: 49px; padding: 0 22px; color: #dff8ff; border: 1px solid rgba(68, 182, 255, .45); background: rgba(7, 28, 53, .65); font-size: 13px; font-weight: 700; }
        .studio-btn-templates:hover { border-color: #00d7ff; color: #fff; transform: translateY(-2px); box-shadow: 0 0 25px rgba(0, 190, 255, .13); }

        /* Blocs éditorial / fonctionnalités */
        .studio-two-columns { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 65px; }
        .studio-feature-copy { min-width: 0; }
        .studio-feature-copy .studio-section-kicker { margin-bottom: 18px; }
        .studio-feature-copy .studio-section-title { text-align: left; margin-bottom: 18px; }
        .studio-feature-description { color: #b1c3d8; font-size: 16px; line-height: 1.8; margin: 0 0 24px; }
        .studio-feature-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
        .studio-feature-list li { display: flex; align-items: center; gap: 12px; color: #e1edf9; font-size: 14px; }
        .studio-feature-list li span { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; border-radius: 9px; color: #48e7ff; background: rgba(0, 183, 255, .11); border: 1px solid rgba(0, 190, 255, .18); }
        .studio-visual-frame { position: relative; padding: 12px; border: 1px solid rgba(56, 184, 255, .34); border-radius: 23px; background: linear-gradient(145deg, rgba(22,57,91,.75), rgba(4,17,34,.9)); box-shadow: 0 28px 70px rgba(0,0,0,.35), 0 0 45px rgba(0, 160, 255, .1); }
        .studio-visual-frame::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(130deg, rgba(0,220,255,.6), transparent 40%, rgba(0,180,255,.22)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .studio-editor-image { display: block; width: 100%; height: auto; border-radius: 14px; }
        .studio-domain-visual { min-height: 310px; display: grid; place-items: center; position: relative; overflow: hidden; border: 1px solid rgba(0, 193, 255, .28); border-radius: 24px; background: radial-gradient(circle at 50% 45%, rgba(0, 173, 255, .2), transparent 52%), linear-gradient(145deg, #0b2340, #061326); box-shadow: 0 25px 65px rgba(0,0,0,.32); }
        .studio-domain-orbit { position: absolute; width: 255px; height: 255px; border: 1px solid rgba(40, 208, 255, .28); border-radius: 50%; box-shadow: 0 0 40px rgba(0, 174, 255, .12), inset 0 0 40px rgba(0, 174, 255, .08); }
        .studio-domain-orbit::before, .studio-domain-orbit::after { content: ''; position: absolute; inset: 22px; border: 1px dashed rgba(0, 210, 255, .25); border-radius: 50%; }
        .studio-domain-orbit::after { inset: 48px; border-style: solid; opacity: .65; }
        .studio-domain-center { position: relative; z-index: 1; display: grid; place-items: center; width: 112px; height: 112px; border-radius: 28px; color: #4deaff; background: linear-gradient(145deg, rgba(0,198,255,.2), rgba(0,91,190,.2)); border: 1px solid rgba(0, 215, 255, .55); box-shadow: 0 0 45px rgba(0, 188, 255, .22), inset 0 0 25px rgba(0, 204, 255, .13); font-size: 48px; }
        .studio-domain-chip { position: absolute; z-index: 2; display: flex; align-items: center; gap: 9px; padding: 12px 15px; border: 1px solid rgba(73, 199, 255, .35); border-radius: 12px; background: rgba(4, 22, 44, .9); color: #dff8ff; box-shadow: 0 12px 30px rgba(0,0,0,.24); font-size: 12px; font-weight: 700; }
        .studio-domain-chip.one { top: 17%; left: 7%; }
        .studio-domain-chip.two { right: 6%; bottom: 17%; }
        .studio-domain-chip span { color: #43e7d0; font-size: 20px; }

        /* Fonctionnalités */
        .studio-features-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .studio-feature-card { min-height: 180px; padding: 24px 21px; border-radius: 16px; border: 1px solid rgba(67, 158, 232, .2); background: linear-gradient(145deg, rgba(15,39,68,.82), rgba(6,19,37,.94)); box-shadow: inset 0 1px 0 rgba(255,255,255,.035); transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .studio-feature-card:hover { transform: translateY(-6px); border-color: rgba(0, 209, 255, .55); box-shadow: 0 18px 38px rgba(0,0,0,.22), 0 0 25px rgba(0,180,255,.09); }
        .studio-feature-icon { width: 49px; height: 49px; display: grid; place-items: center; margin-bottom: 18px; border-radius: 14px; color: #45e8ff; border: 1px solid rgba(0, 198, 255, .28); background: linear-gradient(145deg, rgba(0, 192, 255, .17), rgba(0, 93, 180, .12)); font-size: 25px; box-shadow: 0 0 22px rgba(0, 180, 255, .08); }
        .studio-feature-title { color: #f1f8ff; font-size: 15px; font-weight: 750; margin: 0 0 8px; }
        .studio-feature-card-desc { color: #9fb4cb; font-size: 12px; line-height: 1.6; margin: 0; }

        /* Témoignage */
        .studio-testimonial { display: flex; align-items: center; gap: 32px; max-width: 980px; margin: 0 auto; padding: 39px 45px; border: 1px solid rgba(0, 192, 255, .25); border-radius: 22px; background: radial-gradient(ellipse at 0 50%, rgba(0, 159, 255, .12), transparent 48%), linear-gradient(125deg, rgba(13,37,65,.95), rgba(5,17,33,.96)); box-shadow: 0 22px 60px rgba(0,0,0,.23); }
        .studio-testimonial-image { flex: 0 0 auto; padding: 5px; border-radius: 50%; border: 1px solid rgba(0, 211, 255, .6); box-shadow: 0 0 26px rgba(0, 188, 255, .18); }
        .studio-testimonial-img { display: block; width: 92px; height: 92px; border-radius: 50%; object-fit: cover; }
        .studio-testimonial-text { flex: 1; min-width: 0; }
        .studio-quote-icon { color: #28dff5; opacity: .75; font: 700 54px/ .7 Georgia, serif; }
        .studio-testimonial-quote { color: #eaf4ff; font-size: 18px; line-height: 1.75; font-style: italic; margin: 8px 0 13px; }
        .studio-testimonial-author { color: #4bdff4; font-size: 13px; font-weight: 700; margin: 0; }

        /* Appel à l'action */
        .studio-final-cta { position: relative; isolation: isolate; overflow: hidden; padding: 105px 28px; text-align: center; background: radial-gradient(ellipse at 50% 110%, rgba(0, 189, 255, .28), transparent 53%), linear-gradient(120deg, #061329, #092448 52%, #041326); }
        .studio-final-cta::before { content: ''; position: absolute; z-index: -1; width: 520px; height: 520px; left: calc(50% - 260px); top: -330px; border: 1px solid rgba(0, 212, 255, .25); border-radius: 50%; box-shadow: 0 0 0 45px rgba(0, 194, 255, .035), 0 0 0 90px rgba(0, 194, 255, .025), 0 0 100px rgba(0, 190, 255, .12); }
        .studio-final-cta-inner { max-width: 760px; margin: 0 auto; }
        .studio-final-cta h2 { color: #f6fbff; font-size: clamp(32px, 4.5vw, 52px); font-weight: 900; letter-spacing: -.045em; line-height: 1.12; margin: 0 0 17px; }
        .studio-final-cta p { color: #b3c8df; font-size: 16px; line-height: 1.7; margin: 0 auto 28px; }
        .studio-final-cta .studio-btn-primary { min-height: 60px; padding: 0 30px; }
        .studio-cta-note { color: #91abc6 !important; font-size: 12px !important; margin: 18px 0 0 !important; }

        /* Notes */
        .studio-notes { padding: 28px; background: #040a14; border-top: 1px solid rgba(67, 160, 226, .12); }
        .studio-notes-inner { max-width: 1220px; margin: 0 auto; }
        .studio-notes-list { list-style: none; margin: 0; padding: 0; }
        .studio-note-item { display: flex; gap: 8px; color: #71869f; font-size: 11px; line-height: 1.7; margin: 0 0 6px; }
        .studio-note-item span:first-child { color: #42d9ee; }

        /* Liens de notes */
        .studio-note-link { color: #6ceeff; text-decoration: underline; font-size: 10px; margin-left: 3px; vertical-align: super; }
        .studio-note-link-dark { color: #003044; text-decoration: underline; font-size: 10px; margin-left: 3px; vertical-align: super; }

        @media (max-width: 1100px) {
          .studio-hero-inner { grid-template-columns: minmax(330px, .95fr) minmax(390px, 1.05fr); }
          .studio-hero { padding-left: 4vw; padding-right: 4vw; }
          .studio-hero h1 { font-size: clamp(43px, 5.4vw, 66px); }
          .studio-benefit { padding: 16px 14px; }
          .studio-templates-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .studio-features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .studio-home .desktop-break { display: none; }
          .studio-hero { min-height: 0; padding: 128px 22px 34px; }
          .studio-hero-inner { grid-template-columns: 1fr; gap: 0; }
          .studio-hero-copy { max-width: 680px; padding: 12px 0 0; text-align: center; margin: 0 auto; }
          .studio-install-mobile { display: block; max-width: 340px; margin: 0 auto 18px; }
          .studio-install-mobile:empty { display: none; }
          .studio-eyebrow { margin-bottom: 20px; font-size: 10px; }
          .studio-hero h1 { font-size: clamp(42px, 10vw, 64px); line-height: 1.02; }
          .studio-hero-description { margin-left: auto; margin-right: auto; font-size: 15px; }
          .studio-hero-actions, .studio-hero-proof { justify-content: center; }
          .studio-hero-art { max-width: 650px; margin: -4px auto 0; width: 100%; }
          .studio-hero-image { width: 108%; margin-left: -4%; }
          .studio-float-one { right: 0; top: 4%; }
          .studio-float-two { left: 0; bottom: 7%; }
          .studio-benefit-strip { padding: 0 18px 26px; }
          .studio-benefit-grid { grid-template-columns: repeat(2, 1fr); }
          .studio-benefit:nth-child(2) { border-right: 0; }
          .studio-benefit:nth-child(-n+2) { border-bottom: 1px solid rgba(71,174,255,.2); }
          .studio-section { padding: 76px 22px; }
          .studio-two-columns { grid-template-columns: 1fr; gap: 35px; }
          .studio-two-columns.reverse-mobile .studio-feature-visual { order: 2; }
          .studio-two-columns.reverse-mobile .studio-feature-copy { order: 1; }
          .studio-feature-copy .studio-section-title { text-align: center; }
          .studio-feature-copy { text-align: center; }
          .studio-feature-list { max-width: 460px; margin: 0 auto; text-align: left; }
          .studio-section-heading { margin-bottom: 38px; }
          .studio-testimonial { padding: 30px 25px; gap: 20px; }
          .studio-testimonial-quote { font-size: 16px; }
          .studio-final-cta { padding: 78px 22px; }
        }
        @media (max-width: 480px) {
          .studio-hero { padding: 118px 17px 25px; }
          .studio-hero h1 { font-size: clamp(38px, 11vw, 49px); }
          .studio-hero-description { font-size: 14px; line-height: 1.65; }
          .studio-hero-actions { flex-direction: column; align-items: stretch; }
          .studio-btn-primary, .studio-btn-secondary { width: 100%; min-height: 54px; }
          .studio-hero-proof { gap: 9px 14px; font-size: 10px; }
          .studio-float-card { padding: 8px 10px; gap: 7px; font-size: 9px; }
          .studio-float-card strong { font-size: 10px; }
          .studio-float-icon { width: 27px; height: 27px; font-size: 15px; }
          .studio-benefit-strip { padding-left: 12px; padding-right: 12px; }
          .studio-benefit { padding: 13px 10px; gap: 9px; }
          .studio-benefit-icon { flex-basis: 31px; height: 31px; font-size: 17px; }
          .studio-benefit strong { font-size: 10px; }
          .studio-benefit small { font-size: 9px; }
          .studio-section { padding: 62px 17px; }
          .studio-templates-grid, .studio-features-grid { grid-template-columns: 1fr; }
          .studio-template-image-wrap { aspect-ratio: 1.35 / 1; }
          .studio-feature-card { min-height: 0; }
          .studio-domain-visual { min-height: 265px; }
          .studio-domain-orbit { width: 205px; height: 205px; }
          .studio-domain-chip { padding: 9px 10px; font-size: 10px; }
          .studio-domain-chip.one { left: 3%; }
          .studio-domain-chip.two { right: 3%; }
          .studio-testimonial { flex-direction: column; text-align: center; padding: 28px 20px; }
          .studio-testimonial-img { width: 78px; height: 78px; }
          .studio-testimonial-quote { font-size: 15px; }
          .studio-notes { padding: 23px 17px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .studio-home *, .studio-home *::before, .studio-home *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
        }
      `}</style>

      {/* MENU PUBLIC — composant dynamique conservé */}
      <MenuPublic reserverEspace={false} />

      {/* HERO */}
      <section ref={heroRef} className="studio-hero">
        <div className="studio-hero-inner">
          <div className="studio-hero-copy">
            <div className="studio-install-mobile"><BoutonInstallerStudio /></div>
            <div className="studio-eyebrow reveal">
              <span className="studio-eyebrow-dot" />
              ✨ Lancez votre boutique en 10 minutes
              <sup>
                <a
                  href="#note-1"
                  className="studio-note-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >1</a>
              </sup>
            </div>
            <h1 className="reveal reveal-delay-1">
              Créez votre<br />
              <span>boutique en ligne</span>
            </h1>
            <p className="studio-hero-description reveal reveal-delay-2">
              e-Vend Studio est la plateforme la plus simple pour créer votre présence en ligne —<br className="desktop-break" />
              boutique avec paiement intégré ou site vitrine pour présenter vos services.<br className="desktop-break" />
              Choisissez un template, personnalisez-le, et lancez votre site.
            </p>
            <div className="studio-hero-actions reveal reveal-delay-3">
              <button className="studio-btn-primary" onClick={ouvrirLogin}>
                <span aria-hidden="true">🚀</span>
                Essai gratuit 14 jours →
                <sup>
                  <a
                    href="#note-2"
                    className="studio-note-link-dark"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >2</a>
                </sup>
              </button>
              <button
                className="studio-btn-secondary"
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Voir les templates <span aria-hidden="true">↓</span>
              </button>
            </div>
            <div className="studio-hero-proof reveal reveal-delay-3">
              <span><b className="studio-proof-check">✓</b> ⭐ 4.9/5</span>
              <span><b className="studio-proof-check">✓</b> 🔥 +10k boutiques</span>
              <span><b className="studio-proof-check">✓</b> 🇨🇦 100% canadien</span>
            </div>
          </div>

          <div className="studio-hero-art" aria-label="Aperçu de la plateforme de création e-Vend Studio">
            <img className="studio-hero-image" src={VISUELS.hero} alt="Ordinateur et téléphone présentant un aperçu de boutique en ligne" />
            <div className="studio-float-card studio-float-one">
              <span className="studio-float-icon">🎨</span>
              <span><strong>Votre style</strong>Personnalisation facile</span>
            </div>
            <div className="studio-float-card studio-float-two">
              <span className="studio-float-icon">✓</span>
              <span><strong>Prêt à publier</strong>Votre site, votre marque</span>
            </div>
          </div>
        </div>
      </section>

      {/* BANDEAU VISUEL — reprend les avantages déjà présentés dans les sections */}
      <div className="studio-benefit-strip" aria-label="Avantages e-Vend Studio">
        <div className="studio-benefit-grid">
          <div className="studio-benefit"><span className="studio-benefit-icon">▧</span><span><strong>Modèles professionnels</strong><small>Un design adapté à votre projet</small></span></div>
          <div className="studio-benefit"><span className="studio-benefit-icon">✥</span><span><strong>Personnalisation facile</strong><small>Créez un site à votre image</small></span></div>
          <div className="studio-benefit"><span className="studio-benefit-icon">◇</span><span><strong>Paiements sécurisés</strong><small>Avec Stripe intégré</small></span></div>
          <div className="studio-benefit"><span className="studio-benefit-icon">◎</span><span><strong>Votre domaine</strong><small>Votre marque, votre adresse</small></span></div>
        </div>
      </div>

      {/* TEMPLATES — données et navigation d'origine conservées */}
      <section id="templates" className="studio-section">
        <div className="studio-container">
          <div className="studio-section-heading">
            <span className="studio-section-kicker">✦ Templates</span>
            <h2 className="studio-section-title">Des designs <span className="studio-accent">professionnels</span></h2>
            <p className="studio-section-subtitle">Boutiques, sites vitrine, réservations, enchères — un template pour chaque projet</p>
          </div>

          <div className="studio-templates-grid">
            {templates.map((t) => (
              <div key={t.id} className="studio-template-card" onClick={ouvrirLogin}>
                <div className="studio-template-image-wrap">
                  <img src={t.image} alt={t.nom} className="studio-template-image" loading="lazy" />
                  <span className="studio-template-badge">{t.categorie}</span>
                </div>
                <div className="studio-template-info">
                  <h3 className="studio-template-name">{t.nom}</h3>
                  <button className="studio-template-btn" onClick={(e) => { e.stopPropagation(); ouvrirLogin(); }}>
                    Personnaliser →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="studio-templates-cta">
            <button
              className="studio-btn-templates"
              onClick={() => window.open('/templates', '_blank', 'noopener,noreferrer')}
              title="Ouvrir dans un nouvel onglet"
            >
              Voir tous les templates ({TOUS_LES_TEMPLATES.filter((t) => t.disponible).length}) ↗
            </button>
          </div>
        </div>
      </section>

      {/* PERSONNALISATION */}
      <section id="features" className="studio-section alt">
        <div className="studio-container studio-two-columns">
          <div className="studio-feature-copy">
            <span className="studio-section-kicker">✦ Personnalisation</span>
            <h2 className="studio-section-title">Modifiez <span className="studio-accent">couleurs et photos</span></h2>
            <p className="studio-feature-description">
              Aucune compétence technique requise. Changez les couleurs, ajoutez vos photos,
              modifiez les polices — tout est intuitif et instantané.
            </p>
            <ul className="studio-feature-list">
              <li><span>✦</span>Thèmes de couleurs illimités</li>
              <li><span>▧</span>Bibliothèque d'images intégrée</li>
              <li><span>✎</span>Éditeur glisser-déposer</li>
              <li><span>▣</span>Responsive sur mobile/tablette</li>
            </ul>
          </div>
          <div className="studio-feature-visual">
            <div className="studio-visual-frame">
              <img src={VISUELS.editor} alt="Aperçu de l'éditeur de création de site e-Vend Studio" className="studio-editor-image" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* DOMAINE + STRIPE */}
      <section className="studio-section">
        <div className="studio-container studio-two-columns reverse-mobile">
          <div className="studio-feature-visual">
            <div className="studio-domain-visual" role="img" aria-label="Illustration du domaine personnalisé et des paiements sécurisés">
              <div className="studio-domain-orbit" />
              <div className="studio-domain-center">⌘</div>
              <div className="studio-domain-chip one"><span>◎</span>Votre domaine</div>
              <div className="studio-domain-chip two"><span>✓</span>Paiements Stripe</div>
            </div>
          </div>
          <div className="studio-feature-copy">
            <span className="studio-section-kicker">✦ Professionnel</span>
            <h2 className="studio-section-title">Votre <span className="studio-accent">domaine</span> + <span className="studio-accent">Stripe</span></h2>
            <p className="studio-feature-description">
              Utilisez votre propre nom de domaine (ex: maboutique.com) et connectez votre compte Stripe
              pour recevoir vos paiements directement.
            </p>
            <ul className="studio-feature-list">
              <li><span>◎</span>Domaine personnalisé inclus</li>
              <li><span>▣</span>Paiements Stripe intégrés</li>
              <li><span>↗</span>Virement automatique vers votre compte</li>
              <li><span>◇</span>Transactions sécurisées</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS — tableau de données d'origine conservé */}
      <section className="studio-section alt">
        <div className="studio-container">
          <div className="studio-section-heading">
            <span className="studio-section-kicker">✦ Tout compris</span>
            <h2 className="studio-section-title">Ce que vous <span className="studio-accent">obtenez</span></h2>
            <p className="studio-section-subtitle">Une plateforme complète pour vendre en ligne</p>
          </div>

          <div className="studio-features-grid">
            {[
              { emoji: '🎨', title: 'Templates pro', desc: "Designs modernes prêts à l'emploi" },
              { emoji: '🌈', title: 'Personnalisation', desc: 'Couleurs, photos, polices' },
              { emoji: '🌐', title: 'Domaine personnalisé', desc: 'Votre marque, votre adresse' },
              { emoji: '💳', title: 'Stripe intégré', desc: 'Paiements sécurisés' },
              { emoji: '📦', title: 'Gestion des stocks', desc: 'Suivez vos inventaires' },
              { emoji: '📊', title: 'Tableau de bord', desc: 'Statistiques et analyses' },
              { emoji: '🚚', title: 'Calculs de livraison', desc: 'Tarifs automatiques' },
              { emoji: '💬', title: 'Support client', desc: 'Assistance 7j/7' },
            ].map((f) => (
              <div key={f.title} className="studio-feature-card">
                <div className="studio-feature-icon">{f.emoji}</div>
                <h3 className="studio-feature-title">{f.title}</h3>
                <p className="studio-feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGE — contenu existant conservé */}
      <section className="studio-section">
        <div className="studio-container">
          <div className="studio-testimonial">
            <div className="studio-testimonial-image">
              <img src={PHOTOS.seller} alt="Vendeur" className="studio-testimonial-img" loading="lazy" />
            </div>
            <div className="studio-testimonial-text">
              <span className="studio-quote-icon">“</span>
              <p className="studio-testimonial-quote">
                J'ai monté ma boutique e-Vend Studio en une heure. Les templates sont magnifiques,
                l'édition est super facile, et Stripe fonctionne parfaitement. Je recommande !
              </p>
              <p className="studio-testimonial-author">— Marie Cloutier, Artisane à Québec</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="studio-final-cta">
        <div className="studio-final-cta-inner">
          <span className="studio-section-kicker">✦ Votre projet commence ici</span>
          <h2>Prêt à lancer votre boutique ?</h2>
          <p>Rejoignez des milliers de vendeurs canadiens sur e-Vend Studio</p>
          <button className="studio-btn-primary" onClick={ouvrirLogin}>
            Démarrer mon essai gratuit de 14 jours →
          </button>
          <p className="studio-cta-note">
            Aucune carte de crédit requise pour démarrer
            <sup>
              <a
                href="#note-2"
                className="studio-note-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >2</a>
            </sup>
          </p>
        </div>
      </section>

      {/* NOTES */}
      <section id="notes" className="studio-notes">
        <div className="studio-notes-inner">
          <ol className="studio-notes-list">
            <li id="note-1" className="studio-note-item">
              <span>1.</span>
              <span>Le temps de 10 minutes peut varier selon le modèle et la configuration choisis.</span>
            </li>
            <li id="note-2" className="studio-note-item">
              <span>2.</span>
              <span>Aucune carte de crédit n'est requise pour démarrer l'essai gratuit de 14 jours. Un moyen de paiement Stripe doit toutefois être configuré avant la fin de cette période — autrement, le site créé durant l'essai sera perdu.</span>
            </li>
          </ol>
        </div>
      </section>

      {/* BAS DE PAGE — composant dynamique conservé */}
      <BasDePage />
    </div>
  );
}