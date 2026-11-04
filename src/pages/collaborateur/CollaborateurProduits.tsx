// CHEMIN : src/pages/collaborateur/CollaborateurProduits.tsx
// e-Vend Studio — Dashboard collaborateur : liste de mes annonces (produits)
// Adapté de ListeProduits.tsx (e-Vend). API : /api/collab/:gestionnaireId/produits

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Produit {
  id: number; titre: string; prix: string; prix_promo: string | null; stock: number | null;
  sku: string | null; categorie: string | null; photo_principale: string | null;
  statut: 'actif' | 'brouillon'; created_at: string;
}
interface Reponse {
  produits: Produit[]; total: number; page: number; pages: number;
  stats: { total: number; actifs: number; brouillons: number; ruptures: number };
}
interface Props {
  gestionnaireId: number; accent: string; isMobile: boolean;
  onCreer: () => void; onModifier: (id: number) => void;
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a', bg: '#f4f6f8' };
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }));

export default function CollaborateurProduits({ gestionnaireId, accent, isMobile, onCreer, onModifier }: Props) {
  const base = `/api/collab/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState('');
  const [rupture, setRupture] = useState(false);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [aSupprimer, setASupprimer] = useState<number[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [chargement, setChargement] = useState(true);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (qEff) p.set('q', qEff);
    if (statut) p.set('statut', statut);
    if (rupture) p.set('stock', 'rupture');
    try {
      const res = await fetch(`${base}/produits?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); }
      else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, qEff, statut, rupture]);

  useEffect(() => { charger(); }, [charger]);

  const changerRecherche = (v: string) => {
    setQ(v);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350);
  };

  const action = async (url: string, methode: string, corps?: unknown) => {
    setOccupe(true);
    try {
      const res = await fetch(`${base}${url}`, {
        method: methode, credentials: 'include',
        headers: corps ? { 'Content-Type': 'application/json' } : undefined,
        body: corps ? JSON.stringify(corps) : undefined,
      });
      if (!res.ok) setErreur((await res.json().catch(() => ({}))).error || 'Action impossible');
      else setErreur('');
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    if (aSupprimer.length === 1) await action(`/produits/${aSupprimer[0]}`, 'DELETE');
    else await action('/produits/bulk/supprimer', 'POST', { ids: aSupprimer });
    setChoisis(c => c.filter(id => !aSupprimer.includes(id)));
    setASupprimer(null);
  };

  const basculer = (id: number) => setChoisis(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]));
  const tous = !!data && data.produits.length > 0 && data.produits.every(p => choisis.includes(p.id));
  const bouton = (couleur: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${couleur}`, color: couleur, borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' });
  const badge = (s: string): React.CSSProperties => ({ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s === 'actif' ? '#E9F7EF' : '#FEF9E7', color: s === 'actif' ? '#1E8449' : '#B7950B' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  const lignes = data?.produits || [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>📦 Mes annonces</h2>
        <button onClick={onCreer} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Nouvelle annonce
        </button>
      </div>

      {/* Compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total', v: data?.stats.total ?? 0, f: () => { setStatut(''); setRupture(false); setPage(1); } },
          { l: 'Actives', v: data?.stats.actifs ?? 0, f: () => { setStatut('actif'); setRupture(false); setPage(1); } },
          { l: 'Brouillons', v: data?.stats.brouillons ?? 0, f: () => { setStatut('brouillon'); setRupture(false); setPage(1); } },
          { l: 'En rupture', v: data?.stats.ruptures ?? 0, f: () => { setStatut(''); setRupture(true); setPage(1); } },
        ].map(c => (
          <button key={c.l} onClick={c.f} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{c.v}</div>
            <div style={{ fontSize: 11, color: T.light, textTransform: 'uppercase', fontWeight: 700 }}>{c.l}</div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input value={q} onChange={e => changerRecherche(e.target.value)} placeholder="🔍 Titre ou SKU…" maxLength={80}
          style={{ flex: 1, minWidth: 180, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' }} />
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}
          style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actives</option>
          <option value="brouillon">Brouillons</option>
        </select>
        {rupture && <button onClick={() => { setRupture(false); setPage(1); }} style={bouton(accent)}>En rupture ✕</button>}
        {choisis.length > 0 && (
          <button onClick={() => setASupprimer(choisis)} style={{ ...bouton(T.danger), padding: '9px 14px', fontSize: 12 }}>🗑️ Supprimer ({choisis.length})</button>
        )}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {lignes.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>📦</div>
          <p style={{ fontWeight: 700, color: T.text }}>{data?.stats.total ? 'Aucune annonce ne correspond à vos filtres' : 'Vous n\'avez pas encore d\'annonce'}</p>
          {!data?.stats.total && <button onClick={onCreer} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Créer ma première annonce</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '36px 56px 1fr 110px 80px 100px 250px', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', alignItems: 'center' }}>
              <input type="checkbox" checked={tous} onChange={() => setChoisis(tous ? [] : lignes.map(p => p.id))} />
              <span></span><span>Annonce</span><span>Prix</span><span>Stock</span><span>Statut</span><span>Actions</span>
            </div>
          )}
          {lignes.map(p => (
            <div key={p.id} style={isMobile
              ? { padding: 14, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }
              : { display: 'grid', gridTemplateColumns: '36px 56px 1fr 110px 80px 100px 250px', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
              {!isMobile && <input type="checkbox" checked={choisis.includes(p.id)} onChange={() => basculer(p.id)} />}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: T.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🖼️</span>}
                </div>
                {isMobile && <strong style={{ fontSize: 14, color: T.text }}>{p.titre}</strong>}
              </div>
              {!isMobile && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                  <div style={{ fontSize: 11, color: T.light }}>{[p.sku && `SKU ${p.sku}`, p.categorie].filter(Boolean).join(' · ') || '—'}</div>
                </div>
              )}
              <div style={{ fontSize: 13 }}>
                {p.prix_promo ? (<><strong style={{ color: T.danger }}>{argent(p.prix_promo)}</strong> <s style={{ color: T.light, fontSize: 11 }}>{argent(p.prix)}</s></>) : <strong>{argent(p.prix)}</strong>}
              </div>
              <div style={{ fontSize: 13, color: p.stock === 0 ? T.danger : T.text, fontWeight: p.stock === 0 ? 700 : 400 }}>
                {p.stock === null ? '∞' : p.stock === 0 ? 'Rupture' : p.stock}
              </div>
              <div><span style={badge(p.statut)}>{p.statut === 'actif' ? 'Active' : 'Brouillon'}</span></div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button disabled={occupe} onClick={() => onModifier(p.id)} style={bouton(accent)}>✏️ Modifier</button>
                <button disabled={occupe} onClick={() => action(`/produits/${p.id}/statut`, 'PATCH', { statut: p.statut === 'actif' ? 'brouillon' : 'actif' })} style={bouton(T.light)}>
                  {p.statut === 'actif' ? '⏸ Retirer' : '▶ Publier'}
                </button>
                <button disabled={occupe} onClick={() => action(`/produits/${p.id}/dupliquer`, 'POST')} style={bouton(T.light)} title="Dupliquer">⧉</button>
                <button disabled={occupe} onClick={() => setASupprimer([p.id])} style={bouton(T.danger)} title="Supprimer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} annonce{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...bouton(T.light), padding: '7px 14px', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...bouton(T.light), padding: '7px 14px', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {aSupprimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🗑️</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Supprimer {aSupprimer.length > 1 ? `${aSupprimer.length} annonces` : 'cette annonce'} ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 18px' }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setASupprimer(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={confirmerSuppression} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}