// CHEMIN : src/templates/multivendeur/MVPremiumFooter.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Pied de page partagé (toutes les pages)
//
// Les liens « Documents » et « Nos politiques » s'affichent seulement si :
//   1) le gestionnaire les a cochés dans « Configurer mes pages » (footer_documents_actif / footer_politiques_actif)
//   2) il existe au moins une page active (documents) ou une politique rédigée (politiques)
// Données lues (publiques) :
//   GET /api/studio/pages/:gestionnaireId/public       → { pages: [{ slug, titre, ... }] }
//   GET /api/studio/politiques/:gestionnaireId/public  → { politiques: [{ slug, titre, contenu, ... }] }

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface LienPage { slug: string; titre: string; }

// Réseaux sociaux configurés par le gestionnaire (config.extra.reseaux_sociaux)
const RESEAUX: { cle: string; nom: string }[] = [
  { cle: 'facebook', nom: 'Facebook' }, { cle: 'instagram', nom: 'Instagram' }, { cle: 'x', nom: 'X' },
  { cle: 'linkedin', nom: 'LinkedIn' }, { cle: 'youtube', nom: 'YouTube' }, { cle: 'tiktok', nom: 'TikTok' },
  { cle: 'pinterest', nom: 'Pinterest' },
];

const lienSur = (u: any): string => (typeof u === 'string' && /^https:\/\/[^\s<>"']+$/i.test(u.trim()) ? u.trim() : '');

function IconeReseau({ cle }: { cle: string }) {
  const trait = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (cle) {
    case 'facebook':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...trait}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
    case 'instagram':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...trait}><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>;
    case 'x':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    case 'linkedin':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...trait}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
    case 'youtube':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...trait}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>;
    case 'tiktok':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...trait}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2.1 4.3 5 4.6" /></svg>;
    default:
      return <svg width="18" height="18" viewBox="0 0 24 24" {...trait}><circle cx="12" cy="12" r="10" /><path d="M10.5 21l2-9" /><path d="M9.2 12.6c-.6-3.2 1.7-5.1 4.2-4.6 2.4.5 2.5 3.3 1.6 5.2-.9 1.8-3.1 2.4-4.1 1.2" /></svg>;
  }
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
}

export default function MVPremiumFooter({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const nom = config.nom_boutique || 'Ma Marketplace';
  const accent = config.couleur_accent || '#fbbf24';

  const [documents, setDocuments] = useState<LienPage[]>([]);
  const [politiques, setPolitiques] = useState<LienPage[]>([]);
  const [dropdownOuvert, setDropdownOuvert] = useState(false);

  const reseauxActifs = RESEAUX
    .map(r => ({ ...r, url: lienSur(config?.extra?.reseaux_sociaux?.[r.cle]) }))
    .filter(r => r.url);

  const veutDocuments = config.footer_documents_actif !== false;
  const veutPolitiques = config.footer_politiques_actif !== false;

  useEffect(() => {
    if (isDemo || !gId) return;
    let actif = true;

    if (veutDocuments) {
      fetch(`${API_BASE}/studio/pages/${gId}/public`)
        .then(r => (r.ok ? r.json() : { pages: [] }))
        .then(d => { if (actif) setDocuments(Array.isArray(d?.pages) ? d.pages : []); })
        .catch(() => {});
    }
    if (veutPolitiques) {
      fetch(`${API_BASE}/studio/politiques/${gId}/public`)
        .then(r => (r.ok ? r.json() : { politiques: [] }))
        .then(d => {
          const liste = Array.isArray(d?.politiques) ? d.politiques : [];
          // Seules les politiques réellement rédigées sont affichées
          if (actif) setPolitiques(liste.filter((p: any) => typeof p?.contenu === 'string' && p.contenu.trim().length > 0));
        })
        .catch(() => {});
    }
    return () => { actif = false; };
  }, [gId, isDemo, veutDocuments, veutPolitiques]);

  const ouvrirPolitique = (slug: string) => {
    setDropdownOuvert(false);
    naviguer({ page: 'politique', politiqueSlug: slug });
  };

  return (
    <footer style={s.footer}>
      <style>{`
        .mvf-link:hover { color:#fff !important; }
        .mvf-reseau:hover { background:rgba(255,255,255,0.16) !important; color:#fff !important; }
        .mvf-pol-item:hover { background:rgba(255,255,255,0.08) !important; color:#fff !important; }
        @media(max-width:640px){
          .mvf-inner { flex-direction:column !important; align-items:flex-start !important; gap:20px !important; }
          .mvf-links { flex-wrap:wrap !important; gap:16px !important; }
          .mvf-copy { margin-left:0 !important; }
        }
      `}</style>
      <div className="mvf-inner" style={s.inner}>
        <div style={s.logo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, background: `linear-gradient(135deg,${accent},${accent}cc)` }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>

        {reseauxActifs.length > 0 && (
          <div className="mvf-reseaux" style={s.reseaux}>
            {reseauxActifs.map(r => (
              <a key={r.cle} href={r.url} target="_blank" rel="noopener noreferrer" aria-label={r.nom} title={r.nom} className="mvf-reseau" style={s.reseau}>
                <IconeReseau cle={r.cle} />
              </a>
            ))}
          </div>
        )}

        <div className="mvf-links" style={s.links}>
          <span className="mvf-link" style={s.link} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span className="mvf-link" style={s.link} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
          {config.encheres_actif !== false && (
            <span className="mvf-link" style={s.link} onClick={() => naviguer({ page: 'encheres' })}>Enchères</span>
          )}
          {veutDocuments && documents.length > 0 && (
            <span className="mvf-link" style={s.link} onClick={() => naviguer({ page: 'documents' })}>Documents</span>
          )}

          {veutPolitiques && politiques.length > 0 && (
            <div style={{ position: 'relative' }}>
              <span
                className="mvf-link"
                style={{ ...s.link, display: 'flex', alignItems: 'center', gap: 5, userSelect: 'none' }}
                onClick={() => setDropdownOuvert(v => !v)}
              >
                Nos politiques
                <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: dropdownOuvert ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </span>

              {dropdownOuvert && (
                <>
                  <div onClick={() => setDropdownOuvert(false)} style={{ position: 'fixed', inset: 0, zIndex: 8 }} />
                  <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, minWidth: 210, zIndex: 9, boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}>
                    {politiques.map(p => (
                      <div
                        key={p.slug}
                        className="mvf-pol-item"
                        onClick={() => ouvrirPolitique(p.slug)}
                        style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }}
                      >
                        {p.titre}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <span className="mvf-copy" style={s.copy}>© {new Date().getFullYear()} {nom}</span>
      </div>
    </footer>
  );
}

const s: Record<string, React.CSSProperties> = {
  footer:   { padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', fontFamily: "'DM Sans',sans-serif" },
  inner:    { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' },
  logo:     { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  reseaux:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
  reseau:   { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s' },
  links:    { display: 'flex', gap: 24, flex: 1, flexWrap: 'wrap' },
  link:     { color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' },
  copy:     { fontSize: 13, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' },
};