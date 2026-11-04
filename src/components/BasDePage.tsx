// src/components/BasDePage.tsx
// Bas de page commun à toutes les pages publiques de e-Vend Studio (même mise en page que e-Vend).
//   - Liens : menu « Pied de page » de l'admin (Paramètres > Menu). Si le serveur ne répond pas,
//     les liens par défaut de useMenuPublic s'affichent.
//   - « Nos politiques » : liste déroulante des politiques du site (/api/politiquesPlateforme/public).
//   - Réseaux sociaux : configuration générale de l'admin (seuls les liens remplis s'affichent).
//   - Infolettre : composant InscriptionInfolettre (même formulaire que sur e-Vend).
//
// Utilisation :   <BasDePage />   en bas de la page.
// La propriété « source » indique d'où vient l'inscription à l'infolettre (par défaut : footer_accueil,
// comme avant).

import { useState, useEffect, useRef } from 'react';
import { useMenuPublic, ItemMenu, urlSure } from '../hooks/useMenuPublic';
import { useAllerA } from '../utils/liensMenu';
import { lireJsonCache } from '../utils/cachePublic';
import LogoStudio from './LogoStudio';
import InscriptionInfolettre from './InscriptionInfolettre';

const API_BASE = '/api';

interface Politique { slug: string; titre: string; }
interface Entree { href: string; titre: string; }

const POLITIQUES_DEFAUT: Politique[] = [
  { slug: 'confidentialite',      titre: 'Politique de confidentialité' },
  { slug: 'conditions-service',   titre: "Conditions d'utilisation" },
  { slug: 'retour-remboursement', titre: 'Politique de remboursement' },
  { slug: 'expedition',           titre: "Politique d'expédition" },
];

// Sécurité : les liens des réseaux sociaux viennent de la configuration admin. On n'accepte
// que http:// et https:// (un lien « javascript: » s'exécuterait au clic).
function urlSociale(url: string | undefined): string {
  const u = (url || '').trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

const RESEAUX: { key: string; label: string; color: string; svg: React.ReactNode }[] = [
                { key: 'facebook', label: 'Facebook', color: '#1877F2', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                { key: 'instagram', label: 'Instagram', color: '#E4405F', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                { key: 'x', label: 'X', color: '#000000', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { key: 'youtube', label: 'YouTube', color: '#FF0000', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                { key: 'tiktok', label: 'TikTok', color: '#ffffff', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
                { key: 'pinterest', label: 'Pinterest', color: '#E60023', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg> },
];

// Lien du bas de page (page du site → navigation sans rechargement ; sinon lien normal)
function LienPied({ item }: { item: ItemMenu }) {
  const allerA = useAllerA();
  const contenu = <>{item.icone ? <span style={{ marginRight: '6px' }}>{item.icone}</span> : null}{item.label}</>;
  const style: React.CSSProperties = {
    color: item.couleur || 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px',
    fontWeight: item.gras ? 700 : 400, fontStyle: item.italique ? 'italic' : 'normal', transition: 'color 0.2s',
  };
  if (!item.url) return <span style={style}>{contenu}</span>;
  const href = item.url;
  const nouvelOnglet = item.cible === '_blank';
  const interne = href.startsWith('/') && !nouvelOnglet;
  return (
    <a
      href={href}
      className="sv-pied-lien"
      target={nouvelOnglet ? '_blank' : undefined}
      rel={nouvelOnglet ? 'noopener noreferrer' : undefined}
      style={style}
      onClick={interne ? (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        allerA(href);
      } : undefined}
    >
      {contenu}
    </a>
  );
}

// Liste déroulante qui s'ouvre vers le haut (politiques, ou sous-éléments d'un lien du menu)
function DeroulantPied({ titre, entrees }: { titre: string; entrees: Entree[] }) {
  const allerA = useAllerA();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dehors = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOuvert(o => !o)}
        aria-expanded={ouvert}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: ouvert ? '#fbbf24' : 'rgba(255,255,255,0.4)',
          fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'color 0.2s', fontFamily: 'inherit',
        }}
      >
        {titre}
        <span style={{ fontSize: '9px', transform: ouvert ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>

      {ouvert && (
        <div className="sv-pied-deroulant" style={{
          position: 'absolute', bottom: 'calc(100% + 10px)',
          background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          minWidth: '220px', maxWidth: 'calc(100vw - 32px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden', zIndex: 100, animation: 'svFadeUp 0.18s ease',
        }}>
          {entrees.map((p, i) => (
            <a
              key={p.href + p.titre}
              href={p.href}
              className="sv-pied-entree"
              onClick={(e) => {
                if (!p.href.startsWith('/')) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault(); setOuvert(false); allerA(p.href);
              }}
              style={{
                display: 'block', padding: '11px 18px', color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                fontSize: '13px', transition: 'all 0.15s',
                borderBottom: i < entrees.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {p.titre}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BasDePage({ source = 'footer_accueil' }: { source?: string }) {
  const items = useMenuPublic('footer');
  const [politiques, setPolitiques] = useState<Politique[]>([]);
  const [reseauxSociaux, setReseauxSociaux] = useState<Record<string, string>>({});

  const aPolitiques = items.some(i => i.type_lien === 'politiques');

  // Politiques (seulement si le menu contient « Nos politiques »)
  useEffect(() => {
    if (!aPolitiques) return;
    let annule = false;
    lireJsonCache(`${API_BASE}/politiquesPlateforme/public`).then(data => {
      if (!annule && data && Array.isArray(data.politiques)) setPolitiques(data.politiques);
    });
    return () => { annule = true; };
  }, [aPolitiques]);

  // Réseaux sociaux depuis la configuration générale de l'admin
  useEffect(() => {
    let annule = false;
    lireJsonCache(`${API_BASE}/admin/configuration/config-publique`).then(data => {
      if (annule || !data) return;
      setReseauxSociaux({
        facebook:  data.social_facebook  || '',
        instagram: data.social_instagram || '',
        x:         data.social_x         || '',
        linkedin:  data.social_linkedin  || '',
        youtube:   data.social_youtube   || '',
        tiktok:    data.social_tiktok    || '',
        pinterest: data.social_pinterest || '',
      });
    });
    return () => { annule = true; };
  }, []);

  const listePolitiques: Politique[] = politiques.length > 0 ? politiques : POLITIQUES_DEFAUT;
  const reseauxAffiches = RESEAUX.filter(({ key }) => urlSociale(reseauxSociaux[key]));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes svFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .sv-pied, .sv-pied * { box-sizing: border-box; }
        .sv-pied-lien:hover { color: #fbbf24 !important; }
        .sv-pied-entree:hover { background: rgba(251,191,36,0.08); color: #fbbf24 !important; }
        .sv-pied-deroulant { right: 0; }
                @media (max-width: 768px) { .sv-pied-deroulant { right: auto; left: 0; } .sv-pied-liens { flex: 0 0 100% !important; gap: 16px 22px !important; } }
      `}</style>

      <footer className="sv-pied" style={{ padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <LogoStudio petit />

          {reseauxAffiches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {reseauxAffiches.map(({ key, label, color, svg }) => (
                <a
                  key={key}
                  href={urlSociale(reseauxSociaux[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s', textDecoration: 'none', flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = color;
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  {svg}
                </a>
              ))}
            </div>
          )}

          <div className="sv-pied-liens" style={{ display: 'flex', gap: '24px', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {items.map(item => {
              if (item.type_lien === 'politiques') {
                return (
                  <DeroulantPied
                    key={item.id + item.label}
                    titre={item.label}
                    entrees={listePolitiques.map(p => ({ href: `/politiques/${p.slug}`, titre: p.titre }))}
                  />
                );
              }
              if (item.sous_items.length > 0) {
                const entrees: Entree[] = [
                  ...(item.url ? [{ href: item.url, titre: item.label }] : []),
                  ...item.sous_items.filter(s => urlSure(s.url)).map(s => ({ href: s.url as string, titre: s.label })),
                ];
                return <DeroulantPied key={item.id + item.label} titre={item.label} entrees={entrees} />;
              }
              return <LienPied key={item.id + item.label} item={item} />;
            })}
          </div>

          <InscriptionInfolettre source={source} />

          <p style={{ margin: '0 0 0 auto', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>© 2026 e-Vend Studio — La solution de boutique en ligne 100% canadienne</p>
        </div>
      </footer>
    </>
  );
}