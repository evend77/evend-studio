// CHEMIN : src/pages/acheteur/CollaborateursFavoris.tsx
// e-Vend Studio — Dashboard acheteur : collaborateurs favoris
// Adapté de VendeursFavoris.tsx (e-Vend) : « vendeurs » devient « collaborateurs ».
// Session : cookie httpOnly (credentials: 'include').
// API : GET /api/acheteur/:gid/favoris · GET /favoris/suggestions · POST/DELETE /favoris/:collabId

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API = '/api';

interface Collab {
  id: number;
  nom_boutique: string;
  logo_url: string | null;
  banniere_url: string | null;
  ville: string | null;
  province: string | null;
  type_entreprise: string | null;
  description: string;
  membre_depuis: string;
  total_produits: number;
  note_moyenne: number;
  nombre_avis: number;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  onEcrire?: (collaborateurId: number) => void; // ouvre « Chat avec collaborateurs »
}

const C = {
  indigo: '#6366f1', purple: '#8b5cf6', pink: '#ec4899', amber: '#fbbf24', red: '#ef4444', green: '#10b981',
  border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)',
};

const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#f97316)', 'linear-gradient(135deg,#3b82f6,#06b6d4)',
];

function Etoiles({ note, nb }: { note: number; nb: number }) {
  if (!nb) return <span style={{ fontSize: 11, color: C.textLight }}>Pas encore d'avis</span>;
  return (
    <span style={{ fontSize: 12, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: C.amber }}>★</span><b>{note.toFixed(1)}</b><span style={{ color: C.textLight, fontSize: 11 }}>({nb})</span>
    </span>
  );
}

export default function CollaborateursFavoris({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', onEcrire }: Props) {
  const [favoris, setFavoris] = useState<Collab[]>([]);
  const [suggestions, setSuggestions] = useState<Collab[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [occupe, setOccupe] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const charger = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`${API}/acheteur/${gestionnaireId}/favoris`, { credentials: 'include' }),
        fetch(`${API}/acheteur/${gestionnaireId}/favoris/suggestions`, { credentials: 'include' }),
      ]);
      if (!a.ok) throw new Error((await a.json().catch(() => ({}))).error || 'Chargement impossible');
      setFavoris((await a.json()).collaborateurs || []);
      if (b.ok) setSuggestions((await b.json()).collaborateurs || []);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  const basculer = async (c: Collab, ajouter: boolean) => {
    setOccupe(c.id);
    try {
      const r = await fetch(`${API}/acheteur/${gestionnaireId}/favoris/${c.id}`, { method: ajouter ? 'POST' : 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Action impossible');
      showToast(ajouter ? '💜 Ajouté à vos favoris' : 'Retiré de vos favoris');
      await charger();
    } catch (e: any) { showToast(e.message || 'Action impossible', false); }
    finally { setOccupe(null); }
  };

  const voirBoutique = (c: Collab) => {
    window.open(`/site-preview?vendeurId=${gestionnaireId}&page=boutique-page&boutiqueId=${c.id}`, '_blank', 'noopener,noreferrer');
  };

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return favoris.filter(c => !q || c.nom_boutique.toLowerCase().includes(q) || (c.ville || '').toLowerCase().includes(q));
  }, [favoris, recherche]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  const carte = (c: Collab, estFavori: boolean, i: number) => (
    <div key={c.id} className="cf-card" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 70, background: c.banniere_url ? `url(${c.banniere_url}) center/cover` : GRADIENTS[i % GRADIENTS.length] }} />
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -26 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, border: '3px solid #0a1628', background: GRADIENTS[(i + 2) % GRADIENTS.length], overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {c.logo_url ? <img src={c.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.nom_boutique[0] || '?').toUpperCase()}
          </div>
          <div style={{ minWidth: 0, paddingBottom: 2 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Sora',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom_boutique}</h3>
            <Etoiles note={c.note_moyenne} nb={c.nombre_avis} />
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: C.textLight, minHeight: 32, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {c.description || 'Aucune description.'}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 14px' }}>
          {(c.ville || c.province) && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}>📍 {[c.ville, c.province].filter(Boolean).join(', ')}</span>}
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,.15)', color: '#6ee7b7' }}>🛍️ {c.total_produits} produit{c.total_produits > 1 ? 's' : ''}</span>
          {c.type_entreprise && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,.07)', color: C.textLight }}>{c.type_entreprise}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button onClick={() => voirBoutique(c)} style={{ flex: 2, padding: '10px 6px', border: 'none', borderRadius: 10, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🏪 Voir la boutique
          </button>
          {estFavori && onEcrire && (
            <button onClick={() => onEcrire(c.id)} title="Écrire au collaborateur" style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'rgba(255,255,255,.05)', color: '#fff', fontSize: 14, cursor: 'pointer' }}>💬</button>
          )}
          <button onClick={() => basculer(c, !estFavori)} disabled={occupe === c.id} title={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{ padding: '10px 12px', border: `1px solid ${estFavori ? 'rgba(244,63,94,.4)' : 'rgba(251,191,36,.4)'}`, borderRadius: 10, background: estFavori ? 'rgba(244,63,94,.15)' : 'rgba(251,191,36,.12)', color: estFavori ? '#f43f5e' : C.amber, fontSize: 14, cursor: 'pointer' }}>
            {estFavori ? '💔' : '💜'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        .cf-card { transition: transform .2s, box-shadow .2s; }
        .cf-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.35); }
        .cf-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
        @media(max-width:420px){ .cf-grid{ grid-template-columns:1fr; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>{toast.msg}</div>
      )}

      <div style={{ background: `linear-gradient(135deg, ${C.indigo} 0%, ${C.purple} 100%)`, borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>💜 Collaborateurs favoris</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{favoris.length} collaborateur{favoris.length > 1 ? 's' : ''} suivi{favoris.length > 1 ? 's' : ''}</p>
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{erreur}</div>}

      {favoris.length > 0 && (
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher parmi mes favoris…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', marginBottom: 16, background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
      )}

      {favoris.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18, marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏪</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontFamily: "'Sora',sans-serif" }}>Aucun collaborateur favori</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.textLight }}>Ajoutez vos boutiques préférées depuis les suggestions ci-dessous.</p>
        </div>
      ) : filtres.length === 0 ? (
        <p style={{ textAlign: 'center', color: C.textLight, padding: 30 }}>Aucun favori ne correspond à votre recherche.</p>
      ) : (
        <div className="cf-grid" style={{ marginBottom: 32 }}>{filtres.map((c, i) => carte(c, true, i))}</div>
      )}

      {suggestions.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontFamily: "'Sora',sans-serif", color: '#fff' }}>✨ Suggestions pour vous</h2>
          <div className="cf-grid">{suggestions.map((c, i) => carte(c, false, i + 1))}</div>
        </>
      )}
    </div>
  );
}