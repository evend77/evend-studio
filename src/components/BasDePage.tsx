// src/components/BasDePage.tsx
// Bas de page commun à toutes les pages publiques de e-Vend Studio.
//   - Liens : menu « Pied de page » de l'admin (Paramètres > Menu). Si le serveur ne répond pas,
//     les liens par défaut de useMenuPublic s'affichent.
//   - « Nos politiques » : liste déroulante des politiques du site (/api/politiquesPlateforme/public).
//   - Section d'inscription à l'infolettre (POST /api/infolettre) au-dessus du logo.
//
// Utilisation :   <BasDePage />   en bas de la page.

import { useState, useEffect, useRef } from 'react';
import { useMenuPublic, ItemMenu, urlSure } from '../hooks/useMenuPublic';
import { useAllerA } from '../utils/liensMenu';
import { lireJsonCache } from '../utils/cachePublic';
import LogoStudio from './LogoStudio';
import InscriptionInfolettre from './InscriptionInfolettre';

const API_BASE = '/api';

interface Politique { slug: string; titre: string; }
interface Entree { href: string; titre: string; }

// Utilisées seulement si la liste des politiques ne peut pas être chargée
const POLITIQUES_DEFAUT: Politique[] = [
  { slug: 'confidentialite',      titre: 'Politique de confidentialité' },
  { slug: 'conditions-service',   titre: "Conditions d'utilisation" },
  { slug: 'retour-remboursement', titre: 'Politique de remboursement' },
  { slug: 'expedition',           titre: "Politique d'expédition" },
];

// Lien du bas de page (page du site → navigation sans rechargement ; sinon lien normal)
function LienPied({ item }: { item: ItemMenu }) {
  const allerA = useAllerA();
  const contenu = <>{item.icone ? <span style={{ marginRight: '6px' }}>{item.icone}</span> : null}{item.label}</>;
  const style: React.CSSProperties = {
    color: item.couleur || 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px',
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
          color: ouvert ? '#f5a623' : 'rgba(255,255,255,0.7)',
          fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'color 0.2s', fontFamily: 'inherit',
        }}
      >
        {titre}
        <span style={{ fontSize: '9px', transform: ouvert ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>

      {ouvert && (
        <div className="sv-pied-deroulant" style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
          background: '#0d1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          minWidth: '220px', maxWidth: 'calc(100vw - 32px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden', zIndex: 100, animation: 'svFadeUp 0.18s ease', textAlign: 'left',
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

export default function BasDePage() {
  const items = useMenuPublic('footer');
  const [politiques, setPolitiques] = useState<Politique[]>([]);

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

  const listePolitiques: Politique[] = politiques.length > 0 ? politiques : POLITIQUES_DEFAUT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes svFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .sv-pied, .sv-pied * { box-sizing: border-box; }
        .sv-pied-lien:hover { color: #f5a623 !important; }
        .sv-pied-entree:hover { background: rgba(245,166,35,0.08); color: #f5a623 !important; }
      `}</style>

      <footer className="sv-pied" style={{ padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <InscriptionInfolettre />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <LogoStudio petit />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  ...item.sous_items.filter(sub => urlSure(sub.url)).map(sub => ({ href: sub.url as string, titre: sub.label })),
                ];
                return <DeroulantPied key={item.id + item.label} titre={item.label} entrees={entrees} />;
              }
              return <LienPied key={item.id + item.label} item={item} />;
            })}
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>© 2026 e-Vend Studio — La solution de boutique en ligne 100% canadienne</p>
        </div>
      </footer>
    </>
  );
}