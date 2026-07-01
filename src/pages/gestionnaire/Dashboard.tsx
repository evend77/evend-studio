// src/pages/vendeur/Dashboard.tsx
// e-Vend Studio — Tableau de bord vendeur — sans Polaris

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface VendeurUser {
  id:               number;
  email:            string;
  nom:              string;
  nom_boutique:     string | null;
  role:             string;
  statut?:          string;
  plan?:            string;
  site_template_id?: string;
}

interface StatsVendeur {
  revenus: { total: number; mois: number; aujourdhui: number; croissance: number; };
  commandes: { total: number; enAttente: number; expediees: number; livrees: number; annulees: number; croissance: number; };
  produits: { total: number; actifs: number; enRupture: number; vues: number; vuesCroissance: number; };
  avis: { moyenne: number; total: number; cinqEtoiles: number; quatreEtoiles: number; troisEtoiles: number; deuxEtoiles: number; uneEtoile: number; };
  graphiques: {
    ventes30j: { date: string; ventes: number; commandes: number }[];
    topProduits: { nom: string; ventes: number; revenu: number }[];
  };
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────────

function CarteKPI({ icone, titre, valeur, sousTitre, couleur, tendance }: {
  icone: string; titre: string; valeur: string; sousTitre: string; couleur: string;
  tendance?: { valeur: number; positif: boolean };
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{icone}</span>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{titre}</span>
        </div>
        {tendance && (
          <span style={{ fontSize: 11, fontWeight: 700, color: tendance.positif ? '#059669' : '#dc2626', background: tendance.positif ? '#d1fae5' : '#fee2e2', padding: '2px 8px', borderRadius: 20 }}>
            {tendance.positif ? '↑' : '↓'} {tendance.valeur}%
          </span>
        )}
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: couleur, margin: '0 0 4px' }}>{valeur}</p>
      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{sousTitre}</p>
    </div>
  );
}

function ScoreCommission({ vendeurId }: { vendeurId: number }) {
  const [score, setScore]         = useState<number | null>(null);
  const [commission, setCommission] = useState<number | null>(null);
  const [niveau, setNiveau]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [historique, setHistorique] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [pageCourante, setPageCourante] = useState(1);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/vendeurs/${vendeurId}/score-commission`, {
      credentials: 'include', headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setScore(d.score); setCommission(d.commission_rate); setNiveau(d.niveau); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendeurId]);

  const chargerHistorique = async (page = 1) => {
    setLoadingHist(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/conduct-admin/vendeurs/${vendeurId}/historique?page=${page}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) { setHistorique(d.historique); setPagination(d.pagination); setPageCourante(page); }
    } catch {}
    setLoadingHist(false);
  };

  if (loading || score === null) return null;

  const nivCouleurs: Record<string, { bg: string; border: string; text: string; icone: string }> = {
    or:     { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', icone: '🥇' },
    argent: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', icone: '🥈' },
    bronze: { bg: '#fef3c7', border: '#cd7f32', text: '#92400e', icone: '🥉' },
  };
  const niv = nivCouleurs[niveau || 'bronze'] || nivCouleurs.bronze;
  const commPct = ((commission || 0) * 100).toFixed(1);

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Score de confiance</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Basé sur vos avis clients</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: niv.bg, border: `1px solid ${niv.border}`, borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ fontWeight: 700, color: niv.text, fontSize: 13 }}>{niv.icone} {niveau?.toUpperCase()}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#059669' }}>{score}</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}> pts</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            {commPct}% comm.
          </div>
          <button onClick={() => { setModal(true); chargerHistorique(1); }}
            style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
            Historique
          </button>
        </div>
      </div>

      {/* Modal historique */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Historique des scores</h3>
              <button onClick={() => setModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              {loadingHist ? (
                <p style={{ textAlign: 'center', color: '#9ca3af' }}>⏳ Chargement...</p>
              ) : historique.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af' }}>Aucun historique disponible.</p>
              ) : (
                historique.map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                    <span style={{ color: '#374151' }}>{h.date || h.created_at?.slice(0, 10)}</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{h.score} pts</span>
                    <span style={{ color: '#6b7280' }}>{h.raison || '—'}</span>
                  </div>
                ))
              )}
              {pagination && pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button disabled={pageCourante <= 1} onClick={() => chargerHistorique(pageCourante - 1)}
                    style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: pageCourante <= 1 ? 'default' : 'pointer', opacity: pageCourante <= 1 ? 0.4 : 1 }}>←</button>
                  <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>Page {pageCourante} / {pagination.totalPages}</span>
                  <button disabled={pageCourante >= pagination.totalPages} onClick={() => chargerHistorique(pageCourante + 1)}
                    style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: pageCourante >= pagination.totalPages ? 'default' : 'pointer', opacity: pageCourante >= pagination.totalPages ? 0.4 : 1 }}>→</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BarreAvis({ label, valeur, total, couleur }: { label: string; valeur: number; total: number; couleur: string }) {
  const pct = total > 0 ? (valeur / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
        <span style={{ color: '#374151' }}>{label}</span>
        <span style={{ fontWeight: 700, color: '#374151' }}>{valeur}</span>
      </div>
      <div style={{ height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: couleur, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

// Graphique en barres simple SVG (pas de dépendance externe)
function GraphiqueVentes({ donnees, isMobile }: { donnees: { date: string; ventes: number }[]; isMobile: boolean }) {
  if (donnees.length === 0) return (
    <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9ca3af' }}>Aucune donnée pour cette période</p>
    </div>
  );

  const max = Math.max(...donnees.map(d => d.ventes), 1);
  const h = 180;
  const w = isMobile ? 300 : 560;
  const barW = Math.max(4, (w - 40) / donnees.length - 3);
  const nb = isMobile ? Math.ceil(donnees.length / 3) : 1;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 30}`} style={{ minWidth: isMobile ? 300 : 400 }}>
        {/* Lignes de grille */}
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <line key={r} x1={30} x2={w - 10} y1={h - r * h} y2={h - r * h} stroke="#f3f4f6" strokeWidth={1} />
        ))}
        {/* Barres */}
        {donnees.map((d, i) => {
          const bh = (d.ventes / max) * h;
          const x = 30 + i * ((w - 40) / donnees.length);
          return (
            <g key={i}>
              <rect x={x} y={h - bh} width={barW} height={bh} fill="#2563eb" rx={2} opacity={0.8} />
              {i % nb === 0 && (
                <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize={9} fill="#9ca3af">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        {/* Axe Y labels */}
        {[0, 0.5, 1].map(r => (
          <text key={r} x={28} y={h - r * h + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
            {(max * r).toFixed(0)}$
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function Dashboard({ vendeur }: { vendeur: VendeurUser }) {
  const [periode, setPeriode]   = useState('30');
  const [stats, setStats]       = useState<StatsVendeur | null>(null);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const prenom = vendeur.nom?.split(' ')[0] || 'Vendeur';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!vendeur?.id) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/vendeurs/${vendeur.id}/stats?periode=${periode}`, {
      credentials: 'include', headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setStats(d))
      .catch(() => setErreur('Erreur de chargement des statistiques.'))
      .finally(() => setLoading(false));
  }, [vendeur?.id, periode]);

  const s: Record<string, React.CSSProperties> = {
    page:    { maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px', fontFamily: "'Inter', sans-serif", color: '#111' },
    card:    { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px' },
    titre:   { fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#374151', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 },
    grid2:   { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 },
    grid4:   { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 },
    badge:   { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' },
    btnPeriode: { padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  };

  return (
    <div style={s.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, margin: 0 }}>Bonjour, {prenom} 👋</h1>
        <span style={{ ...s.badge, background: '#d1fae5', color: '#059669' }}>Compte actif</span>
        {stats?.revenus?.croissance != null && (
          <span style={{ ...s.badge, background: stats.revenus.croissance > 0 ? '#d1fae5' : '#fee2e2', color: stats.revenus.croissance > 0 ? '#059669' : '#dc2626' }}>
            {stats.revenus.croissance > 0 ? '📈 +' : '📉 '}{stats.revenus.croissance.toFixed(1)}% vs mois dernier
          </span>
        )}
      </div>

      {/* Score commission */}
      <div style={{ marginBottom: 20 }}>
        <ScoreCommission vendeurId={vendeur.id} />
      </div>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['7', '7 jours'], ['30', '30 jours'], ['90', '90 jours'], ['365', '1 an']].map(([v, l]) => (
          <button key={v} onClick={() => setPeriode(v)}
            style={{ ...s.btnPeriode, background: periode === v ? '#2563eb' : '#fff', color: periode === v ? '#fff' : '#374151', borderColor: periode === v ? '#2563eb' : '#e5e7eb' }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#9ca3af' }}>Chargement des statistiques...</p>
        </div>
      ) : erreur ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#fee2e2', borderRadius: 12 }}>
          <p style={{ color: '#b91c1c' }}>{erreur}</p>
        </div>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* KPIs */}
          <div style={s.grid4}>
            <CarteKPI icone="💰" titre="Revenus période" valeur={`${(stats.revenus?.mois || 0).toFixed(2)} $`} sousTitre={`Total : ${(stats.revenus?.total || 0).toFixed(2)} $`} couleur="#059669"
              tendance={stats.revenus?.croissance ? { valeur: Math.abs(stats.revenus.croissance), positif: stats.revenus.croissance > 0 } : undefined} />
            <CarteKPI icone="🛒" titre="Commandes" valeur={String(stats.commandes?.total || 0)} sousTitre={`${stats.commandes?.enAttente || 0} en attente`} couleur="#2563eb"
              tendance={stats.commandes?.croissance ? { valeur: Math.abs(stats.commandes.croissance), positif: stats.commandes.croissance > 0 } : undefined} />
            <CarteKPI icone="👁️" titre="Vues produits" valeur={String(stats.produits?.vues || 0)} sousTitre={`${stats.produits?.vuesCroissance || 0}% vs hier`} couleur="#f59e0b"
              tendance={stats.produits?.vuesCroissance ? { valeur: Math.abs(stats.produits.vuesCroissance), positif: stats.produits.vuesCroissance > 0 } : undefined} />
            <CarteKPI icone="⭐" titre="Note moyenne" valeur={(stats.avis?.moyenne || 0).toFixed(1)} sousTitre={`${stats.avis?.total || 0} avis`} couleur="#6366f1" />
          </div>

          {/* Graphique ventes */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={s.titre as any}>📈 Performance des ventes</p>
              <button onClick={() => setPeriode(periode)} style={{ ...s.btnPeriode, fontSize: 12 }}>⟳ Rafraîchir</button>
            </div>
            <GraphiqueVentes donnees={stats.graphiques?.ventes30j || []} isMobile={isMobile} />
          </div>

          {/* Revenus + Avis */}
          <div style={s.grid2}>
            {/* Revenus détail */}
            <div style={s.card}>
              <p style={s.titre as any}>💰 Revenus et commissions</p>
              <div style={s.grid2}>
                {[
                  { label: "Aujourd'hui", valeur: stats.revenus?.aujourdhui || 0 },
                  { label: 'Cette période', valeur: stats.revenus?.mois || 0 },
                ].map(({ label, valeur }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                    <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', margin: 0 }}>{valeur.toFixed(2)} $</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                  Boutique : <strong style={{ color: '#111' }}>{vendeur.nom_boutique || '—'}</strong>
                </p>
              </div>
            </div>

            {/* Distribution avis */}
            <div style={s.card}>
              <p style={s.titre as any}>⭐ Distribution des avis</p>
              {stats.avis?.total > 0 ? (
                <>
                  <BarreAvis label="5 étoiles" valeur={stats.avis.cinqEtoiles || 0}    total={stats.avis.total} couleur="#10b981" />
                  <BarreAvis label="4 étoiles" valeur={stats.avis.quatreEtoiles || 0}  total={stats.avis.total} couleur="#3b82f6" />
                  <BarreAvis label="3 étoiles" valeur={stats.avis.troisEtoiles || 0}   total={stats.avis.total} couleur="#f59e0b" />
                  <BarreAvis label="2 étoiles" valeur={stats.avis.deuxEtoiles || 0}    total={stats.avis.total} couleur="#f97316" />
                  <BarreAvis label="1 étoile"  valeur={stats.avis.uneEtoile || 0}      total={stats.avis.total} couleur="#ef4444" />
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                    Moyenne : <strong style={{ color: '#111' }}>{stats.avis.moyenne.toFixed(1)} / 5</strong> · {stats.avis.total} avis
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
                  <p style={{ color: '#9ca3af' }}>Aucun avis pour le moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top produits */}
          {stats.graphiques?.topProduits?.length > 0 && (
            <div style={s.card}>
              <p style={s.titre as any}>🏆 Top produits</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.graphiques.topProduits.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.nom}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', margin: 0 }}>{p.revenu.toFixed(2)} $</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p.ventes} vente{p.ventes !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résumé commandes */}
          <div style={s.card}>
            <p style={s.titre as any}>📦 Résumé des commandes</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { label: 'En attente',  valeur: stats.commandes?.enAttente || 0,  couleur: '#f59e0b', bg: '#fef3c7' },
                { label: 'Expédiées',   valeur: stats.commandes?.expediees || 0,  couleur: '#3b82f6', bg: '#eff6ff' },
                { label: 'Livrées',     valeur: stats.commandes?.livrees || 0,    couleur: '#059669', bg: '#d1fae5' },
                { label: 'Annulées',    valeur: stats.commandes?.annulees || 0,   couleur: '#ef4444', bg: '#fee2e2' },
              ].map(({ label, valeur, couleur, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <p style={{ fontSize: 26, fontWeight: 900, color: couleur, margin: '0 0 4px' }}>{valeur}</p>
                  <p style={{ fontSize: 11, color: couleur, margin: 0, fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}