// CHEMIN : src/pages/acheteur/Wishlist.tsx
// e-Vend Studio — Dashboard acheteur : liste de souhaits
// Adapté de Wishlist.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET/POST/DELETE /api/acheteur/:gid/wishlist · POST /api/marketplace/:gid/panier

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

const API = '/api';

interface Item {
  id: number;
  produit_id: number;
  titre: string;
  prix: number | string;
  prix_promo: number | string | null;
  stock: number | null;
  photo_principale: string | null;
  categorie: string | null;
  statut: string;
  collaborateur_id: number | null;
  boutique: string | null;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  naviguer?: (page: string) => void;
}

const C = {
  green: '#10b981', rose: '#f43f5e', roseLight: 'rgba(244,63,94,0.15)', pink: '#ec4899', amber: '#f59e0b',
  red: '#ef4444', border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)',
};

const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const prixFinal = (i: Item) => (i.prix_promo !== null && num(i.prix_promo) > 0 && num(i.prix_promo) < num(i.prix) ? num(i.prix_promo) : num(i.prix));
const enPromo = (i: Item) => prixFinal(i) < num(i.prix);
const disponible = (i: Item) => i.statut === 'actif' && (i.stock === null || num(i.stock) > 0);

export default function Wishlist({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', naviguer }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState<'recent' | 'prix_asc' | 'prix_desc'>('recent');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [occupe, setOccupe] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API}/acheteur/${gestionnaireId}/wishlist`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setItems(j.items || []);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  const retirer = async (it: Item) => {
    setOccupe(it.produit_id);
    try {
      const r = await fetch(`${API}/acheteur/${gestionnaireId}/wishlist/${it.produit_id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error();
      setItems(prev => prev.filter(x => x.produit_id !== it.produit_id));
      showToast('Retiré de votre liste');
    } catch { showToast('Impossible de retirer ce produit', false); }
    finally { setOccupe(null); }
  };

  const ajouterPanier = async (it: Item) => {
    setOccupe(it.produit_id);
    try {
      const r = await fetch(`${API}/marketplace/${gestionnaireId}/panier`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produit_id: it.produit_id, titre: it.titre, image_url: it.photo_principale, prix: prixFinal(it), quantite: 1 }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Ajout impossible');
      showToast('🛒 Ajouté au panier');
    } catch (e: any) { showToast(e.message || 'Ajout impossible', false); }
    finally { setOccupe(null); }
  };

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let l = items.filter(i => !q || i.titre.toLowerCase().includes(q) || (i.boutique || '').toLowerCase().includes(q) || (i.categorie || '').toLowerCase().includes(q));
    if (tri === 'prix_asc') l = [...l].sort((a, b) => prixFinal(a) - prixFinal(b));
    if (tri === 'prix_desc') l = [...l].sort((a, b) => prixFinal(b) - prixFinal(a));
    return l;
  }, [items, recherche, tri]);

  const valeurTotale = items.filter(disponible).reduce((s, i) => s + prixFinal(i), 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement de votre liste…</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        .wl-card { transition: transform .2s, box-shadow .2s; }
        .wl-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.35); }
        .wl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
        @media(max-width:520px){ .wl-grid{ grid-template-columns:1fr 1fr; gap:10px; } }
        @media(max-width:360px){ .wl-grid{ grid-template-columns:1fr; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ background: `linear-gradient(135deg, ${C.rose} 0%, ${C.pink} 100%)`, borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>❤️ Liste de souhaits</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.85)' }}>
          {items.length} produit{items.length > 1 ? 's' : ''}{items.length > 0 ? ` · valeur ${formaterPrix(valeurTotale)}` : ''}
        </p>
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{erreur}</div>}

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un produit, une boutique…"
            style={{ flex: '1 1 200px', minWidth: 0, padding: '10px 14px', background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <select value={tri} onChange={e => setTri(e.target.value as any)}
            style={{ padding: '10px 12px', background: '#111c33', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
            <option value="recent">Plus récents</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💝</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontFamily: "'Sora',sans-serif" }}>Votre liste est vide</h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: C.textLight }}>Ajoutez des produits à votre liste depuis la boutique pour les retrouver ici.</p>
          {naviguer && (
            <button onClick={() => naviguer('boutique')} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.rose}, ${C.pink})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Découvrir la boutique
            </button>
          )}
        </div>
      ) : affiches.length === 0 ? (
        <p style={{ textAlign: 'center', color: C.textLight, padding: 40 }}>Aucun produit ne correspond à votre recherche.</p>
      ) : (
        <div className="wl-grid">
          {affiches.map(it => {
            const dispo = disponible(it);
            return (
              <div key={it.id} className="wl-card" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {it.photo_principale
                    ? <img src={it.photo_principale} alt={it.titre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 44, opacity: .4 }}>🛍️</span>}
                  {enPromo(it) && <span style={{ position: 'absolute', top: 8, left: 8, background: C.rose, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>PROMO</span>}
                  {!dispo && <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>Indisponible</span>}
                </div>
                <div style={{ padding: isMobile ? '10px 10px 12px' : '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 15, fontWeight: 700, color: '#fff', fontFamily: "'Sora',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{it.titre}</h3>
                  {it.boutique && <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏪 {it.boutique}</p>}
                  <div style={{ margin: '10px 0 12px', display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: isMobile ? 16 : 19, fontWeight: 800, color: '#fff' }}>{formaterPrix(prixFinal(it))}</span>
                    {enPromo(it) && <span style={{ fontSize: 12, color: C.textLight, textDecoration: 'line-through' }}>{formaterPrix(num(it.prix))}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button onClick={() => ajouterPanier(it)} disabled={!dispo || occupe === it.produit_id}
                      style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: dispo ? 'pointer' : 'not-allowed', color: dispo ? '#fff' : C.textLight, background: dispo ? `linear-gradient(135deg, ${C.green}, #059669)` : 'rgba(255,255,255,.05)' }}>
                      🛒 {isMobile ? 'Panier' : 'Ajouter au panier'}
                    </button>
                    <button onClick={() => retirer(it)} disabled={occupe === it.produit_id} title="Retirer"
                      style={{ padding: '10px 12px', background: C.roseLight, border: `1px solid ${C.rose}40`, borderRadius: 10, color: C.rose, fontSize: 15, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}