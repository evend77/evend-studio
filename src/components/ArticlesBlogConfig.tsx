// src/components/ArticlesBlogConfig.tsx
// Config Mes pages (Simplisse + Premium), onglet Blog : montre les VRAIS articles du gestionnaire (écrits dans « Mes blogs »)
// avec leur statut. Seuls les articles « publié » apparaissent sur le site.
// API : GET /api/boutique/gestionnaire/blog/mes (routes/boutique_blog_gestionnaire.js) — lecture seule, rien n'est modifié ici.

import { useEffect, useState } from 'react';

export interface ArticleCfg { id: number; titre: string; statut: string; date_publication?: string | null; created_at?: string; image_couverture?: string | null }

export function useArticlesBlog(): { articles: ArticleCfg[]; total: number; charge: boolean; erreur: boolean } {
  const [etat, setEtat] = useState<{ articles: ArticleCfg[]; total: number; charge: boolean; erreur: boolean }>({ articles: [], total: 0, charge: false, erreur: false });
  useEffect(() => {
    let vivant = true;
    const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
    fetch('/api/boutique/gestionnaire/blog/mes', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (vivant) setEtat({ articles: Array.isArray(d.articles) ? d.articles : [], total: Number(d.total) || 0, charge: true, erreur: false }); })
      .catch(() => { if (vivant) setEtat({ articles: [], total: 0, charge: true, erreur: true }); });
    return () => { vivant = false; };
  }, []);
  return etat;
}

const LIBELLES: Record<string, [string, string, string]> = {
  publie: ['Publié', '#16a34a', '#f0fdf4'],
  brouillon: ['Brouillon', '#d97706', '#fffbeb'],
  archive: ['Archivé', '#6b7280', '#f3f4f6'],
};

export default function ArticlesBlogConfig({ etat, sombre = false }: { etat: { articles: ArticleCfg[]; total: number; charge: boolean; erreur: boolean }; sombre?: boolean }) {
  const txt = sombre ? '#ddd' : '#1a1a1a';
  const doux = sombre ? '#888' : '#666';
  const bord = sombre ? '#222' : '#e5e7eb';
  const nbPublies = etat.articles.filter(a => a.statut === 'publie').length;
  if (!etat.charge) return <p style={{ fontSize: 12, color: doux, margin: 0 }}>Chargement de vos articles…</p>;
  if (etat.erreur) return <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>Impossible de lire vos articles pour le moment.</p>;
  if (etat.total === 0) return <p style={{ fontSize: 12, color: doux, margin: 0, lineHeight: 1.6 }}>Vous n'avez encore aucun article. Écrivez-en dans le menu <b>Mes blogs</b> : les articles publiés apparaîtront ici et sur votre site.</p>;
  return (
    <div>
      <p style={{ fontSize: 12, color: doux, margin: '0 0 10px', lineHeight: 1.6 }}>
        <b style={{ color: txt }}>{etat.total}</b> article{etat.total > 1 ? 's' : ''} au total · <b style={{ color: '#16a34a' }}>{nbPublies}</b> publié{nbPublies > 1 ? 's' : ''} sur votre site (seuls les articles « Publié » s'affichent). Pour écrire ou modifier : menu <b>Mes blogs</b>.
      </p>
      {etat.articles.slice(0, 10).map(a => {
        const [lib, coul, fond] = LIBELLES[a.statut] || [a.statut, '#6b7280', '#f3f4f6'];
        const d = a.date_publication || a.created_at;
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${bord}` }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: txt, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</span>
            {d && <span style={{ fontSize: 11, color: doux }}>{new Date(d).toLocaleDateString('fr-CA')}</span>}
            <span style={{ fontSize: 10, fontWeight: 700, color: coul, background: fond, borderRadius: 10, padding: '2px 8px' }}>{lib}</span>
          </div>
        );
      })}
      {etat.total > 10 && <p style={{ fontSize: 11, color: doux, margin: '8px 0 0' }}>… et {etat.total - 10} autre(s) dans Mes blogs.</p>}
    </div>
  );
}