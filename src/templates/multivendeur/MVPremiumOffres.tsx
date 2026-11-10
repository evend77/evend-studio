// CHEMIN : src/templates/multivendeur/MVPremiumOffres.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Page « Offres du jour » (add-on) : toutes les offres EN COURS, celles qui finissent bientôt d'abord.
// Le serveur ne renvoie que les offres actives (catalogue public : ?offres=1) ; le compte à rebours suit l'heure du serveur.

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';
import Navbar from './MVPremiumNavbar';
import { fondDe } from './mvTheme';
import { formaterPrix } from '../shared/devise';
import MVOffreCompteur from './MVOffre';

const API_BASE = '/api';

interface Offre {
  id: number; nom: string; prix: number; prix_original?: number; image: string | null; nom_boutique?: string; vendeur_id?: number;
  stock: number; offre_fin: string | null; heure_serveur?: string; categorie_nom?: string;
}
interface Props { vendeurId?: number; isDemo?: boolean; config?: Record<string, any>; naviguer: (d: NavMV) => void; }

const DEMO: Offre[] = [
  { id: 1, nom: 'iPhone 15 Pro Max 256Go', prix: 1449.99, prix_original: 1599.99, image: 'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80', nom_boutique: 'TechPro Montréal', stock: 8, offre_fin: new Date(Date.now() + 5 * 3600000).toISOString() },
  { id: 3, nom: 'Nike Air Max 270 — Blanc / Noir', prix: 189.99, prix_original: 229.99, image: null, nom_boutique: 'Sport Express', stock: 15, offre_fin: new Date(Date.now() + 30 * 3600000).toISOString() },
];

export default function MVPremiumOffres({ vendeurId, isDemo = false, config = {}, naviguer }: Props) {
  const gId = vendeurId || config?.gestionnaire_id;
  const couleurAccent = config?.couleur_accent || '#fbbf24';
  const [offres, setOffres] = useState<Offre[]>(isDemo ? DEMO : []);
  const [chargement, setChargement] = useState(!isDemo);
  const [erreur, setErreur] = useState(false);
  const [rechargement, setRechargement] = useState(0);

  useEffect(() => {
    if (isDemo || !gId) return;
    let annule = false;
    setChargement(true); setErreur(false);
    fetch(`${API_BASE}/produits/gestionnaire/${gId}?page=1&limit=100&offres=1`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { if (!annule) { setOffres(Array.isArray(d?.produits) ? d.produits : []); setChargement(false); } })
      .catch(() => { if (!annule) { setErreur(true); setChargement(false); } });
    return () => { annule = true; };
  }, [gId, isDemo, rechargement]);

  return (
    <div style={{ minHeight: '100vh', background: fondDe(config), fontFamily: "'DM Sans',sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .mvo-grille { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:18px; }
        .mvo-carte { cursor:pointer; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:14px; overflow:hidden; transition:transform .15s, border-color .15s; }
        .mvo-carte:hover { transform:translateY(-3px); border-color:rgba(249,115,22,0.6); }
        @media (max-width:768px) { .mvo-grille { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } .mvo-hero { padding:28px 16px 18px !important; } .mvo-main { padding:0 14px 40px !important; } }
        @media (max-width:380px) { .mvo-grille { grid-template-columns:minmax(0,1fr); } }
      `}</style>
      <Navbar naviguer={naviguer} config={config} />

      <div className="mvo-hero" style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 24px 24px' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.45)', color: '#fdba74', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>🔥 Offres du jour</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, margin: '0 0 8px' }}>Des prix spéciaux, pour un temps limité</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>Les offres qui se terminent bientôt sont en premier. Le prix revient à la normale dès la fin du compte à rebours.</p>
      </div>

      <div className="mvo-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 60px' }}>
        {chargement ? <p style={{ color: 'rgba(255,255,255,0.55)' }}>Chargement…</p>
          : erreur ? <p style={{ color: '#fca5a5' }}>Impossible de charger les offres. <button onClick={() => setRechargement(n => n + 1)} style={{ background: 'none', border: 'none', color: couleurAccent, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Réessayer</button></p>
          : offres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.55)' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔥</div>
              <p style={{ margin: '0 0 16px', fontSize: 16 }}>Aucune offre du jour pour le moment. Revenez bientôt !</p>
              <button onClick={() => naviguer({ page: 'catalogue' })} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Voir le catalogue</button>
            </div>
          ) : (
            <div className="mvo-grille">
              {offres.map(o => {
                const pct = o.prix_original && Number(o.prix_original) > Number(o.prix) ? Math.round(((Number(o.prix_original) - Number(o.prix)) / Number(o.prix_original)) * 100) : null;
                return (
                  <div key={o.id} className="mvo-carte" onClick={() => naviguer({ page: 'produit', produitId: o.id })}>
                    <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.05)' }}>
                      {o.image ? <img src={o.image} alt={o.nom} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>}
                      {pct && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>-{pct}%</span>}
                      {o.stock === 0 && <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>Épuisé</span>}
                    </div>
                    <div style={{ padding: 12 }}>
                      {o.nom_boutique && <div style={{ fontSize: 11, fontWeight: 700, color: couleurAccent, marginBottom: 2 }}>{o.nom_boutique}</div>}
                      <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{o.nom}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: couleurAccent }}>{formaterPrix(Number(o.prix))}</span>
                        {o.prix_original && Number(o.prix_original) > Number(o.prix) && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{formaterPrix(Number(o.prix_original))}</span>}
                      </div>
                      {o.offre_fin && <MVOffreCompteur compact fin={o.offre_fin} heureServeur={o.heure_serveur} onFini={() => setTimeout(() => setRechargement(n => n + 1), 1200)} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}