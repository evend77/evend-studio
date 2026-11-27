// src/templates/annoncesSite/pied.tsx
// e-Vend Studio — Pied de page des petites annonces, calqué sur celui des templates boutique :
// colonnes (identité + réseaux, contact), liens vers les politiques RÉDIGÉES dans Configuration → Mes politiques,
// page de politique affichée dans le site, « © année nom » et « Propulsé par e-Vend Studio » (désactivable).
// API : GET /api/studio/politiques/:gestionnaireId/public (liste) et /public/:slug (une politique) — les mêmes que les boutiques.

import { useState, useEffect, useCallback, useRef } from 'react';

export const POLITIQUES: [string, string][] = [
  ['conditions-service', 'Conditions de service'], ['confidentialite', 'Confidentialité'], ['retour-remboursement', 'Retour & remboursement'],
  ['expedition', 'Expédition'], ['coordonnees', 'Coordonnées'], ['mentions-legales', 'Mentions légales'],
];

// Même nettoyage du HTML des politiques que les templates boutique (le serveur nettoie déjà avec nettoyerHtml)
export function htmlSur(h: string): string {
  try {
    const doc = new DOMParser().parseFromString('<div id="r">' + h + '</div>', 'text/html'); const racine = doc.getElementById('r'); if (!racine) return '';
    racine.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,svg,math').forEach((e) => e.remove());
    racine.querySelectorAll('*').forEach((e) => {
      Array.from(e.attributes).forEach((a) => {
        const n = a.name.toLowerCase(), v = a.value.replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
        if (n.startsWith('on') || n === 'style' || ((n === 'href' || n === 'src' || n === 'xlink:href' || n === 'action') && !/^(https?:|mailto:|tel:|#|\/)/.test(v))) e.removeAttribute(a.name);
      });
      if (e.tagName === 'A') { e.setAttribute('target', '_blank'); e.setAttribute('rel', 'noopener noreferrer'); }
    });
    return racine.innerHTML;
  } catch (e) { return ''; }
}

export interface EtatPolitiques {
  liens: [string, string][];                                      // politiques rédigées (slug, nom)
  ouverte: { slug: string; titre: string; contenu: string } | null;
  statut: 'ferme' | 'loading' | 'idle' | 'err';                    // ferme = on est sur le site, pas sur une politique
  ouvrir: (slug: string) => void;
  fermer: () => void;
}

export function usePolitiques(gid: number): EtatPolitiques {
  const [rediges, setRediges] = useState<Record<string, boolean>>({});
  const [ouverte, setOuverte] = useState<EtatPolitiques['ouverte']>(null);
  const [statut, setStatut] = useState<EtatPolitiques['statut']>('ferme');
  const courant = useRef('');

  useEffect(() => {
    if (!gid) return;
    fetch(`/api/studio/politiques/${gid}/public`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d || !Array.isArray(d.politiques)) return;
      const m: Record<string, boolean> = {};
      d.politiques.forEach((p: any) => { m[p.slug] = typeof p.contenu === 'string' && p.contenu.trim().length > 0; });
      setRediges(m);
    }).catch(() => {});
  }, [gid]);

  const ouvrir = useCallback((slug: string) => {
    courant.current = slug; setOuverte(null); setStatut('loading');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch(`/api/studio/politiques/${gid}/public/${slug}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
      if (courant.current !== slug) return;
      const p = d && d.politique; if (!p) throw new Error();
      setOuverte({ slug, titre: String(p.titre || ''), contenu: typeof p.contenu === 'string' ? p.contenu : '' }); setStatut('idle');
    }).catch(() => { if (courant.current === slug) setStatut('err'); });
  }, [gid]);

  const fermer = useCallback(() => { courant.current = ''; setOuverte(null); setStatut('ferme'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  return { liens: POLITIQUES.filter(([s]) => rediges[s]), ouverte, statut, ouvrir, fermer };
}

/** Page d'une politique (remplace le contenu du site tant qu'elle est ouverte). */
export function PagePolitique({ pol, couleur, police }: { pol: EtatPolitiques; couleur: string; police?: string }) {
  const contenu = pol.ouverte && pol.ouverte.contenu.trim() ? htmlSur(pol.ouverte.contenu) : '';
  const titreAffiche = pol.ouverte && pol.ouverte.titre && !/<h1[\s>]/i.test(contenu) ? pol.ouverte.titre : '';
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px', fontFamily: police || 'inherit' }}>
      <style>{`.pol-contenu h1{font-size:30px;font-weight:800;color:#1a1a1a;margin:0 0 20px;line-height:1.2}.pol-contenu h2{font-size:20px;font-weight:800;color:#1a1a1a;margin:32px 0 10px}.pol-contenu h3{font-size:16px;font-weight:700;color:#1a1a1a;margin:22px 0 8px}.pol-contenu p{color:#444;line-height:1.9;margin:0 0 14px;font-size:15px}.pol-contenu ul,.pol-contenu ol{color:#444;padding-left:22px;margin:0 0 14px}.pol-contenu li{line-height:1.8;margin-bottom:6px;font-size:15px}.pol-contenu a{color:${couleur};text-decoration:underline}.pol-contenu strong{color:#1a1a1a}.pol-contenu blockquote{border-left:3px solid ${couleur};padding:8px 18px;margin:16px 0;color:#555}.pol-contenu hr{border:0;border-top:1px solid #e5e7eb;margin:24px 0}`}</style>
      <button onClick={pol.fermer} style={{ background: 'none', border: 'none', color: couleur, fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' }}>← Retour à l'accueil</button>
      {pol.liens.length > 1 && (
        <nav aria-label="Pages légales" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {pol.liens.map(([slug, nom]) => {
            const actif = pol.ouverte ? pol.ouverte.slug === slug : false;
            return <button key={slug} onClick={() => { if (!actif) pol.ouvrir(slug); }} aria-current={actif ? 'page' : undefined}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${actif ? couleur : '#d1d5db'}`, background: actif ? couleur : '#fff', color: actif ? '#fff' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{nom}</button>;
          })}
        </nav>
      )}
      {pol.statut === 'loading' && <p style={{ color: '#888' }}>Chargement…</p>}
      {pol.statut === 'err' && <p style={{ color: '#dc2626' }}>Impossible de charger cette page. Veuillez réessayer.</p>}
      {pol.statut === 'idle' && pol.ouverte && (contenu
        ? <>{titreAffiche && <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1a1a1a', margin: '0 0 20px', lineHeight: 1.2 }}>{titreAffiche}</h1>}<div className="pol-contenu" dangerouslySetInnerHTML={{ __html: contenu }} /></>
        : <><h1 style={{ fontSize: 30, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>{pol.ouverte.titre}</h1><p style={{ color: '#777' }}>Cette page n'a pas encore été rédigée.</p></>)}
    </div>
  );
}

const ICONES_RESEAUX: Record<string, string> = { facebook: 'f', instagram: '📸', tiktok: '♪', twitter: '𝕏', youtube: '▶', linkedin: 'in', pinterest: 'P' };

/** Texte blanc sur fond foncé, texte sombre sur fond clair. */
function texteSur(fond: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(fond);
  if (!m) return '#ffffff';
  const l = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
  return l > 0.65 ? '#111827' : '#ffffff';
}

export interface PropsPied {
  nom: string; fond: string; texteLibre?: string; avis: string;
  reseaux: Record<string, string>; telephone?: string; courriel?: string; adresse?: string;
  afficherPropulse: boolean; pol: EtatPolitiques;
}

export function Pied({ nom, fond, texteLibre, avis, reseaux, telephone, courriel, adresse, afficherPropulse, pol }: PropsPied) {
  const texte = texteSur(fond);
  const reseauxActifs = Object.entries(reseaux).filter(([, v]) => v);
  const aContact = !!(telephone || courriel || adresse);
  const lien: React.CSSProperties = { color: texte, textDecoration: 'none' };
  return (
    <footer style={{ background: fond, color: texte, paddingTop: 44 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{nom}</div>
            {texteLibre && <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, margin: '0 0 16px' }}>{texteLibre}</p>}
            {reseauxActifs.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {reseauxActifs.map(([k, url]) => (
                  <a key={k} href={url} target="_blank" rel="noopener noreferrer nofollow" aria-label={k}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(128,128,128,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: texte, textDecoration: 'none', fontWeight: 700 }}>
                    {ICONES_RESEAUX[k] || k.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
          {aContact && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, opacity: 0.9 }}>Contact</div>
              {telephone && <div style={{ marginBottom: 8, fontSize: 14 }}><a href={`tel:${telephone.replace(/[^0-9+]/g, '')}`} style={{ ...lien, opacity: 0.8 }}>📞 {telephone}</a></div>}
              {courriel && <div style={{ marginBottom: 8, fontSize: 14 }}><a href={`mailto:${courriel}`} style={{ ...lien, opacity: 0.8 }}>✉️ {courriel}</a></div>}
              {adresse && <div style={{ marginBottom: 8, fontSize: 14, opacity: 0.8 }}>📍 {adresse}</div>}
            </div>
          )}
        </div>

        {avis && <p style={{ fontSize: 11, opacity: 0.55, maxWidth: 680, lineHeight: 1.6, margin: '0 0 18px' }}>{avis}</p>}

        <div style={{ borderTop: '1px solid rgba(128,128,128,0.3)', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.5 }}>© {new Date().getFullYear()} {nom}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {pol.liens.map(([slug, label]) => <button key={slug} onClick={() => pol.ouvrir(slug)} style={{ background: 'none', border: 'none', color: texte, opacity: 0.6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{label}</button>)}
          </div>
          {afficherPropulse && (
            <a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, opacity: 0.4, color: texte, textDecoration: 'none' }}>Propulsé par e-Vend Studio</a>
          )}
        </div>
      </div>
    </footer>
  );
}