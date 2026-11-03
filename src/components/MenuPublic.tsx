// src/components/MenuPublic.tsx
// Menu du haut commun à toutes les pages publiques de e-Vend Studio.
//   - Les liens viennent de l'admin (Paramètres > Menu > « Menu du haut ») ; s'ils sont indisponibles,
//     les liens par défaut de useMenuPublic s'affichent.
//   - Le logo (à gauche) et les boutons « ⭐ Commanditaire » et « Mon compte » (à droite) sont fixes.
//   - « Commanditaire » ouvre la fenêtre de connexion des commanditaires (ModalLoginSponsor).
//
// Utilisation :   <MenuPublic />   en haut de la page.
// Le menu est fixé en haut de l'écran (68 px) ; par défaut il réserve sa place avec un espace
// vide. Une page qui gère déjà son propre espace (ex. l'accueil) passe  reserverEspace={false}.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuPublic, ItemMenu } from '../hooks/useMenuPublic';
import { useAllerA, useDefilementAncre, idAncre } from '../utils/liensMenu';
import LogoStudio from './LogoStudio';
import ModalLoginSponsor from './ModalLoginSponsor';

type Variante = 'bureau' | 'sous' | 'mobile' | 'mobileSous';

// Page courante ? (les liens vers une section de l'accueil ne sont jamais « actifs »)
function estActif(url: string | null, chemin: string): boolean {
  if (!url || !url.startsWith('/') || idAncre(url)) return false;
  const base = url.split(/[?#]/)[0];
  if (base === '/') return chemin === '/';
  return chemin === base || chemin.startsWith(base + '/');
}

function styleLien(item: ItemMenu, variante: Variante, actif: boolean): React.CSSProperties {
  const couleurNormale =
    variante === 'bureau' ? 'rgba(255,255,255,0.7)' :
    variante === 'sous' ? 'rgba(255,255,255,0.75)' :
    variante === 'mobile' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)';
  const base: React.CSSProperties = {
    color: actif ? '#f5a623' : (item.couleur || couleurNormale),
    textDecoration: 'none',
    fontStyle: item.italique ? 'italic' : 'normal',
    fontWeight: item.gras || actif ? 700 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  if (variante === 'bureau') return { ...base, padding: '8px 14px', fontSize: item.taille_texte + 'px', borderRadius: '8px', transition: 'color 0.2s', whiteSpace: 'nowrap' };
  if (variante === 'sous') return { ...base, display: 'block', padding: '11px 18px', fontSize: '13px', transition: 'all 0.15s' };
  if (variante === 'mobile') return { ...base, display: 'block', padding: '12px 0', fontSize: Math.max(16, item.taille_texte) + 'px', borderBottom: '1px solid rgba(255,255,255,0.06)' };
  return { ...base, display: 'block', padding: '10px 0 10px 18px', fontSize: '15px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
}

function Lien({ item, variante, chemin, apres }: { item: ItemMenu; variante: Variante; chemin: string; apres?: () => void }) {
  const allerA = useAllerA();
  const actif = estActif(item.url, chemin);
  const contenu = <>{item.icone ? <span style={{ marginRight: '6px' }}>{item.icone}</span> : null}{item.label}</>;

  if (!item.url) {
    return <span style={styleLien(item, variante, false)}>{contenu}</span>;
  }
  const href = item.url;
  const nouvelOnglet = item.cible === '_blank';
  const interne = href.startsWith('/') && !nouvelOnglet;
  return (
    <a
      href={href}
      target={nouvelOnglet ? '_blank' : undefined}
      rel={nouvelOnglet ? 'noopener noreferrer' : undefined}
      className={variante === 'bureau' ? 'sv-nav-link' : variante === 'sous' ? 'sv-sous-lien' : undefined}
      aria-current={actif ? 'page' : undefined}
      style={styleLien(item, variante, actif)}
      onClick={interne ? (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        allerA(href);
        if (apres) apres();
      } : undefined}
    >
      {contenu}
    </a>
  );
}

// Un élément du menu sur ordinateur : lien simple, ou lien avec liste déroulante s'il a des sous-éléments
function ItemBureau({ item, chemin }: { item: ItemMenu; chemin: string }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, [ouvert]);

  useEffect(() => { setOuvert(false); }, [chemin]);

  if (item.sous_items.length === 0) return <Lien item={item} variante="bureau" chemin={chemin} />;

  const actifGroupe = estActif(item.url, chemin) || item.sous_items.some(sub => estActif(sub.url, chemin));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="sv-nav-link"
        aria-expanded={ouvert}
        onClick={() => setOuvert(o => !o)}
        style={{ ...styleLien(item, 'bureau', actifGroupe), background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        {item.icone ? <span>{item.icone}</span> : null}{item.label}
        <span style={{ fontSize: '9px', transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>
      {ouvert && (
        <div className="sv-sous-menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '200px',
          background: '#0d1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1100,
          animation: 'svFadeUp 0.18s ease',
        }}>
          {item.url && <Lien item={{ ...item, sous_items: [] }} variante="sous" chemin={chemin} apres={() => setOuvert(false)} />}
          {item.sous_items.map(sub => <Lien key={sub.id} item={sub} variante="sous" chemin={chemin} apres={() => setOuvert(false)} />)}
        </div>
      )}
    </div>
  );
}

export default function MenuPublic({ reserverEspace = true }: { reserverEspace?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = useMenuPublic('principal');
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [modalSponsorOuvert, setModalSponsorOuvert] = useState(false);

  useDefilementAncre();
  useEffect(() => { setMenuMobileOuvert(false); }, [pathname]);

  // Connexion d'un commanditaire réussie : le cookie est déjà posé, on va à son tableau de bord
  const apresConnexionSponsor = () => { window.location.href = '/sponsor-dashboard'; };
  const ouvrirSponsor = () => { setMenuMobileOuvert(false); setModalSponsorOuvert(true); };

  const boutonSponsor: React.CSSProperties = { padding: '8px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '30px', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(245,158,11,0.3)', fontFamily: 'inherit', whiteSpace: 'nowrap' };
  const boutonCompte: React.CSSProperties = { padding: '8px 20px', background: '#f5a623', border: 'none', borderRadius: '30px', color: '#000', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', whiteSpace: 'nowrap' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes svFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .sv-nav, .sv-nav * { box-sizing: border-box; }
        .sv-nav-link:hover { color: #f5a623 !important; }
        .sv-sous-lien:hover { background: rgba(245,166,35,0.08); color: #f5a623 !important; }
        .sv-btn-sponsor:hover { transform: scale(1.05); }
        .sv-btn-compte:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,166,35,0.35); }
        .sv-hamburger { display: none; }
        @media (max-width: 900px) {
          .sv-hamburger { display: flex !important; }
          .sv-nav-liens, .sv-nav-actions { display: none !important; }
        }
      `}</style>

      <nav className="sv-nav" aria-label="Navigation principale" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(6,13,31,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', gap: '28px' }}>
          <LogoStudio />

          <div className="sv-nav-liens" style={{ display: 'flex', gap: '4px', flex: 1, alignItems: 'center' }}>
            {items.map(item => <ItemBureau key={item.id + item.label} item={item} chemin={pathname} />)}
          </div>

          <div className="sv-nav-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <button type="button" className="sv-btn-sponsor" onClick={ouvrirSponsor} style={boutonSponsor}>⭐ Commanditaire</button>
            <button type="button" className="sv-btn-compte" onClick={() => navigate('/login')} style={boutonCompte}>Mon compte →</button>
          </div>

          <button
            type="button"
            className="sv-hamburger"
            onClick={() => setMenuMobileOuvert(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#fff', fontSize: '26px', marginLeft: 'auto' }}
            aria-label="Menu"
            aria-expanded={menuMobileOuvert}
          >
            {menuMobileOuvert ? '✕' : '☰'}
          </button>
        </div>

        {menuMobileOuvert && (
          <div style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}>
            {items.map(item => (
              <div key={item.id + item.label}>
                <Lien item={item} variante="mobile" chemin={pathname} apres={() => setMenuMobileOuvert(false)} />
                {item.sous_items.map(sub => <Lien key={sub.id} item={sub} variante="mobileSous" chemin={pathname} apres={() => setMenuMobileOuvert(false)} />)}
              </div>
            ))}
            <button type="button" onClick={ouvrirSponsor} style={{ ...boutonSponsor, marginTop: '8px', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '16px' }}>⭐ Commanditaire</button>
            <button type="button" onClick={() => navigate('/login')} style={{ ...boutonCompte, padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '16px' }}>Mon compte →</button>
          </div>
        )}
      </nav>

      {reserverEspace && <div aria-hidden="true" style={{ height: '68px' }} />}

      <ModalLoginSponsor
        isOpen={modalSponsorOuvert}
        onClose={() => setModalSponsorOuvert(false)}
        onLoginSuccess={apresConnexionSponsor}
      />
    </>
  );
}