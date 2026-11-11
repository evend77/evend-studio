// CHEMIN : src/pages/gestionnaire/BoutiqueListeProduits.tsx
// e-Vend Studio — Liste des produits des templates boutique (solo). Le gestionnaire est son propre vendeur.
// API : /api/boutique/gestionnaire/produits (seulement SES annonces ; jamais celles des collaborateurs du MV).

import React, { useCallback, useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Produit { id: number; titre: string; prix: string; prix_promo: string | null; stock: number | null; sku: string | null; categorie: string | null; photo_principale: string | null; statut: 'actif' | 'brouillon'; }
interface Stats { total: number; actifs: number; brouillons: number; ruptures: number; }

interface Props {
  gestionnaireId: number;
  accent?: string;
  isMobile?: boolean;
  pagePlan?: string;
  naviguerVers: (page: string) => void;
}

type Filtre = 'tous' | 'actif' | 'brouillon' | 'rupture';

export default function BoutiqueListeProduits({ accent, isMobile, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const mobile = !!isMobile;
  const [produits, setProduits] = useState<Produit[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, brouillons: 0, ruptures: 0 });
  const [limite, setLimite] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [q, setQ] = useState('');
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState<number[]>([]);
  const [aSupprimer, setASupprimer] = useState<number[] | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [erreurLimite, setErreurLimite] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    const params: string[] = [`page=${page}`];
    if (recherche) params.push(`q=${encodeURIComponent(recherche)}`);
    if (filtre === 'actif' || filtre === 'brouillon') params.push(`statut=${filtre}`);
    if (filtre === 'rupture') params.push('stock=rupture');
    const r = await bq(`/produits?${params.join('&')}`);
    if (r.ok) {
      setProduits(r.data.produits || []);
      setStats(r.data.stats || { total: 0, actifs: 0, brouillons: 0, ruptures: 0 });
      setLimite(r.data.limite === undefined ? null : r.data.limite);
      setPages(r.data.pages || 1);
    } else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, recherche, filtre]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setSelection([]); }, [page, recherche, filtre]);

  const changerStatut = async (p: Produit) => {
    const nouveau = p.statut === 'actif' ? 'brouillon' : 'actif';
    const r = await bq(`/produits/${p.id}/statut`, { method: 'PATCH', body: { statut: nouveau } });
    if (r.ok) { charger(); return; }
    if (r.data && r.data.code === 'LIMITE_ANNONCES') setErreurLimite(messageErreur(r)); else setErreur(messageErreur(r));
  };

  const dupliquer = async (p: Produit) => {
    const r = await bq(`/produits/${p.id}/dupliquer`, { method: 'POST' });
    if (r.ok && r.data.id) naviguerVers(`modifier-annonce?id=${r.data.id}`); else setErreur(messageErreur(r));
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    setEnCours(true);
    const r = aSupprimer.length === 1
      ? await bq(`/produits/${aSupprimer[0]}`, { method: 'DELETE' })
      : await bq('/produits/bulk/supprimer', { method: 'POST', body: { ids: aSupprimer } });
    setEnCours(false);
    setASupprimer(null);
    setSelection([]);
    if (r.ok) charger(); else setErreur(messageErreur(r));
  };

  const toutSelectionne = produits.length > 0 && selection.length === produits.length;
  const bascule = (id: number) => setSelection(s => (s.indexOf(id) >= 0 ? s.filter(x => x !== id) : s.concat([id])));

  const pct = limite ? Math.min(100, Math.round((stats.actifs / limite) * 100)) : 0;
  const bouton: React.CSSProperties = { border: '1px solid #e1e4e8', background: '#fff', borderRadius: 6, padding: '5px 9px', fontSize: 12, cursor: 'pointer', fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#1a2332' }}>📋 Liste des produits</h2>
        <button onClick={() => naviguerVers('annonces-creer')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>➕ Ajouter un produit</button>
      </div>

      {limite !== null && (
        <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontWeight: 700, color: '#1a2332' }}>{stats.actifs} / {limite} annonces actives</span>
            {pagePlan && <button onClick={() => naviguerVers(pagePlan)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Mon plan & limites →</button>}
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        {([['tous', `Tous (${stats.total})`], ['actif', `Actifs (${stats.actifs})`], ['brouillon', `Brouillons (${stats.brouillons})`], ['rupture', `Rupture (${stats.ruptures})`]] as [Filtre, string][]).map(([f, nom]) => (
          <button key={f} onClick={() => { setFiltre(f); setPage(1); }}
            style={{ border: `1px solid ${filtre === f ? couleur : '#e1e4e8'}`, background: filtre === f ? couleur : '#fff', color: filtre === f ? '#fff' : '#1a2332', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{nom}</button>
        ))}
        <form onSubmit={e => { e.preventDefault(); setRecherche(q.trim()); setPage(1); }} style={{ marginLeft: mobile ? 0 : 'auto', display: 'flex', gap: 6, width: mobile ? '100%' : 'auto' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher (titre ou SKU)" maxLength={80}
            style={{ border: '1px solid #e1e4e8', borderRadius: 8, padding: '8px 12px', fontSize: 13, minWidth: mobile ? 0 : 220, flex: mobile ? 1 : undefined }} />
          <button type="submit" style={{ ...bouton, padding: '8px 12px' }}>🔍</button>
        </form>
      </div>

      {selection.length > 0 && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.length} sélectionné{selection.length > 1 ? 's' : ''}</span>
          <button onClick={() => setASupprimer(selection)} style={{ ...bouton, color: '#dc2626', borderColor: '#fecaca' }}>🗑️ Supprimer</button>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, overflow: 'hidden' }}>
        {chargement ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>⏳ Chargement…</div>
        ) : produits.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
            {stats.total === 0 ? 'Vous n’avez pas encore de produit.' : 'Aucun produit ne correspond à votre recherche.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', width: 30 }}><input type="checkbox" checked={toutSelectionne} onChange={() => setSelection(toutSelectionne ? [] : produits.map(p => p.id))} /></th>
                  <th style={{ padding: '10px 6px' }}>Produit</th>
                  <th style={{ padding: '10px 6px' }}>Prix</th>
                  <th style={{ padding: '10px 6px' }}>Stock</th>
                  <th style={{ padding: '10px 6px' }}>Statut</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {produits.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #f0f1f3' }}>
                    <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selection.indexOf(p.id) >= 0} onChange={() => bascule(p.id)} /></td>
                    <td style={{ padding: '10px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.photo_principale
                          ? <img src={p.photo_principale} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>}
                        <div style={{ minWidth: 0 }}>
                          <div onClick={() => naviguerVers(`modifier-annonce?id=${p.id}`)} style={{ fontWeight: 700, color: '#1a2332', cursor: 'pointer', overflowWrap: 'anywhere' }}>{p.titre}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{[p.sku, p.categorie].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>
                      {p.prix_promo ? <><strong>{formaterArgent(p.prix_promo)}</strong> <s style={{ color: '#9ca3af', fontSize: 11 }}>{formaterArgent(p.prix)}</s></> : formaterArgent(p.prix)}
                    </td>
                    <td style={{ padding: '10px 6px', color: p.stock === 0 ? '#dc2626' : '#1a2332', fontWeight: p.stock === 0 ? 700 : 400 }}>{p.stock === null ? '∞' : p.stock === 0 ? 'Rupture' : p.stock}</td>
                    <td style={{ padding: '10px 6px' }}>
                      <button onClick={() => changerStatut(p)} title="Cliquer pour changer"
                        style={{ border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: p.statut === 'actif' ? '#dcfce7' : '#f3f4f6', color: p.statut === 'actif' ? '#15803d' : '#6b7280' }}>
                        {p.statut === 'actif' ? '● Actif' : '○ Brouillon'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => naviguerVers(`modifier-annonce?id=${p.id}`)} style={bouton}>✏️</button>{' '}
                      <button onClick={() => dupliquer(p)} style={bouton} title="Dupliquer">📄</button>{' '}
                      <button onClick={() => setASupprimer([p.id])} style={{ ...bouton, color: '#dc2626' }} title="Supprimer">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...bouton, opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} style={{ ...bouton, opacity: page >= pages ? 0.4 : 1 }}>Suivant →</button>
        </div>
      )}

      {aSupprimer && (
        <BoutiqueModale type="confirmer" accent="#dc2626" titre="Supprimer ?" enCours={enCours} texteConfirmer="Supprimer"
          message={aSupprimer.length === 1 ? 'Cette annonce sera supprimée définitivement.' : `Ces ${aSupprimer.length} annonces seront supprimées définitivement.`}
          onConfirmer={supprimer} onFermer={() => { if (!enCours) setASupprimer(null); }} />
      )}
      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {erreurLimite && (
        <BoutiqueModale type="erreur" titre="Limite d'annonces atteinte" message={erreurLimite} accent={couleur} onFermer={() => setErreurLimite('')}
          actionSecondaire={pagePlan ? { texte: 'Voir mon plan', onClick: () => naviguerVers(pagePlan) } : undefined} />
      )}
    </div>
  );
}