// src/pages/admin/GestionDomaines.tsx
// e-Vend Studio — Admin : Gestion des domaines personnalisés

import React, { useState, useEffect, useCallback } from 'react';

interface DomaineAdmin {
  id: number;
  domaine: string;
  gestionnaire_id: number;
  statut: 'actif' | 'suspendu' | 'expire';
  expiration_date: string | number | null;
  dynadot_order_id: string | null;
  renouvellement_auto: boolean;
  prix_dynadot: number | null;
  montant_avant_taxes: number | null;
  tps: number | null;
  tvq: number | null;
  montant_total: number | null;
  created_at: string;
  nom: string | null;
  email: string;
  nom_boutique: string | null;
}

interface Transaction {
  id: number;
  type: 'achat' | 'renouvellement';
  montant_avant_taxes: number | null;
  tps: number | null;
  tvq: number | null;
  montant_total: number | null;
  stripe_session_id: string | null;
  created_at: string;
}

interface Stats {
  total_domaines: number;
  total_actifs: number;
  total_suspendus: number;
  expirant_30_jours: number;
  revenu_annuel_estime: number;
  revenu_total_percu: number;
  total_transactions: number;
}

export default function GestionDomaines() {
  const [domaines, setDomaines] = useState<DomaineAdmin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('');
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);
  const [messageErreur, setMessageErreur] = useState('');

  const [domaineHistorique, setDomaineHistorique] = useState<DomaineAdmin | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chargementTransactions, setChargementTransactions] = useState(false);

  const token = () => localStorage.getItem('token');

  // ── Charger la liste des domaines ──────────────────────────────────────────
  const chargerDomaines = useCallback(async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams();
      if (recherche.trim()) params.set('recherche', recherche.trim());
      if (filtreStatut) params.set('statut', filtreStatut);

      const res = await fetch(`/api/admin/domaines?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setDomaines(data.domaines || []);
    } catch {
      setMessageErreur('Erreur lors du chargement des domaines.');
    }
    setChargement(false);
  }, [recherche, filtreStatut]);

  // ── Charger les statistiques ────────────────────────────────────────────────
  const chargerStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/domaines/stats', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setStats(data);
    } catch {
      // silencieux — les stats sont secondaires
    }
  }, []);

  useEffect(() => {
    chargerStats();
  }, [chargerStats]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      chargerDomaines();
    }, 300);
    return () => clearTimeout(debounce);
  }, [chargerDomaines]);

  // ── Formater une date (gère les timestamps Unix ms) ─────────────────────────
  const formatDate = (dateVal: string | number | null) => {
    if (!dateVal) return 'N/A';
    const timestamp = typeof dateVal === 'string' ? Number(dateVal) : dateVal;
    const date = isNaN(timestamp) ? new Date(dateVal as string) : new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getUrgenceExpiration = (dateVal: string | number | null) => {
    if (!dateVal) return { couleur: '#888', label: '' };
    const timestamp = typeof dateVal === 'string' ? Number(dateVal) : dateVal;
    const dateExpiration = isNaN(timestamp) ? new Date(dateVal as string) : new Date(timestamp);
    if (isNaN(dateExpiration.getTime())) return { couleur: '#888', label: '' };

    const joursRestants = Math.ceil((dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (joursRestants < 0) return { couleur: '#dc2626', label: 'Expiré' };
    if (joursRestants <= 7) return { couleur: '#dc2626', label: `${joursRestants}j` };
    if (joursRestants <= 30) return { couleur: '#f59e0b', label: `${joursRestants}j` };
    return { couleur: '#10b981', label: `${joursRestants}j` };
  };

  const getStatutBadge = (statut: string) => {
    if (statut === 'actif') return { couleur: '#10b981', label: '✅ Actif' };
    if (statut === 'suspendu') return { couleur: '#dc2626', label: '⛔ Suspendu' };
    return { couleur: '#888', label: '⏳ ' + statut };
  };

  // ── Actions admin ────────────────────────────────────────────────────────────
  const renouvelerForce = async (id: number, domaine: string) => {
    if (!window.confirm(`Renouveler ${domaine} sans facturation (geste admin) ?`)) return;
    setActionEnCours(id);
    try {
      const res = await fetch(`/api/admin/domaines/${id}/renouveler-force`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        await chargerDomaines();
        await chargerStats();
      } else {
        setMessageErreur(data.error || 'Erreur lors du renouvellement forcé.');
      }
    } catch {
      setMessageErreur('Erreur de connexion.');
    }
    setActionEnCours(null);
  };

  const changerStatut = async (id: number, nouveauStatut: 'actif' | 'suspendu') => {
    const verbe = nouveauStatut === 'suspendu' ? 'suspendre' : 'réactiver';
    if (!window.confirm(`Confirmer : ${verbe} ce domaine ?`)) return;
    setActionEnCours(id);
    try {
      const res = await fetch(`/api/admin/domaines/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      const data = await res.json();
      if (data.success) {
        setDomaines(prev => prev.map(d => d.id === id ? { ...d, statut: nouveauStatut } : d));
        await chargerStats();
      } else {
        setMessageErreur(data.error || 'Erreur lors du changement de statut.');
      }
    } catch {
      setMessageErreur('Erreur de connexion.');
    }
    setActionEnCours(null);
  };

  const voirHistorique = async (domaine: DomaineAdmin) => {
    setDomaineHistorique(domaine);
    setChargementTransactions(true);
    setTransactions([]);
    try {
      const res = await fetch(`/api/admin/domaines/${domaine.id}/transactions`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      // silencieux
    }
    setChargementTransactions(false);
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f8f9fb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>🌐 Gestion domaines</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Domaines personnalisés achetés par les gestionnaires via e-Vend Studio.
      </p>

      {messageErreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#991b1b', fontSize: 13 }}>{messageErreur}</span>
          <button onClick={() => setMessageErreur('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={carteStatStyle}>
            <div style={carteStatLabel}>Domaines actifs</div>
            <div style={{ ...carteStatValeur, color: '#10b981' }}>{stats.total_actifs}</div>
          </div>
          <div style={carteStatStyle}>
            <div style={carteStatLabel}>Suspendus</div>
            <div style={{ ...carteStatValeur, color: '#dc2626' }}>{stats.total_suspendus}</div>
          </div>
          <div style={carteStatStyle}>
            <div style={carteStatLabel}>Expirent (30j)</div>
            <div style={{ ...carteStatValeur, color: '#f59e0b' }}>{stats.expirant_30_jours}</div>
          </div>
          <div style={carteStatStyle}>
            <div style={carteStatLabel}>Revenu annuel estimé</div>
            <div style={{ ...carteStatValeur, color: '#4F46E5' }}>{stats.revenu_annuel_estime.toFixed(2)}$</div>
          </div>
          <div style={carteStatStyle}>
            <div style={carteStatLabel}>Revenu total perçu</div>
            <div style={{ ...carteStatValeur, color: '#4F46E5' }}>{stats.revenu_total_percu.toFixed(2)}$</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{stats.total_transactions} transaction(s)</div>
          </div>
        </div>
      )}

      {/* ── Recherche + filtre ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un domaine, un gestionnaire, un courriel..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ flex: 1, minWidth: 260, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          style={{ padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {chargement ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : domaines.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Aucun domaine trouvé.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f0f0f0' }}>
                  <th style={thStyle}>Domaine</th>
                  <th style={thStyle}>Gestionnaire</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Expiration</th>
                  <th style={thStyle}>Auto</th>
                  <th style={thStyle}>Montant/an</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {domaines.map(d => {
                  const statutBadge = getStatutBadge(d.statut);
                  const urgence = getUrgenceExpiration(d.expiration_date);
                  const enCours = actionEnCours === d.id;
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1a1a1a' }}>{d.domaine}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{d.nom || d.nom_boutique || '—'}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{d.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: statutBadge.couleur + '15', color: statutBadge.couleur }}>
                          {statutBadge.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div>{formatDate(d.expiration_date)}</div>
                        {urgence.label && <div style={{ fontSize: 11, fontWeight: 700, color: urgence.couleur }}>{urgence.label}</div>}
                      </td>
                      <td style={tdStyle}>{d.renouvellement_auto ? '✅' : '—'}</td>
                      <td style={tdStyle}>{d.montant_total != null ? `${d.montant_total.toFixed(2)}$` : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => voirHistorique(d)} style={boutonSecondaireStyle} title="Historique de facturation">
                            📜
                          </button>
                          <button onClick={() => renouvelerForce(d.id, d.domaine)} disabled={enCours} style={boutonSecondaireStyle} title="Renouveler (geste admin, sans facturation)">
                            {enCours ? '⏳' : '🔁'}
                          </button>
                          {d.statut === 'suspendu' ? (
                            <button onClick={() => changerStatut(d.id, 'actif')} disabled={enCours} style={{ ...boutonSecondaireStyle, color: '#10b981', borderColor: '#10b981' }} title="Réactiver">
                              ▶️
                            </button>
                          ) : (
                            <button onClick={() => changerStatut(d.id, 'suspendu')} disabled={enCours} style={{ ...boutonSecondaireStyle, color: '#dc2626', borderColor: '#dc2626' }} title="Suspendre">
                              ⛔
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal historique ── */}
      {domaineHistorique && (
        <div
          onClick={() => setDomaineHistorique(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>📜 Historique — {domaineHistorique.domaine}</h2>
              <button onClick={() => setDomaineHistorique(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {chargementTransactions ? (
              <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Chargement...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Aucune transaction enregistrée pour ce domaine.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${t.type === 'achat' ? '#4F46E5' : '#10b981'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>
                        {t.type === 'achat' ? '🛒 Achat initial' : '🔁 Renouvellement'}
                      </span>
                      <span style={{ fontSize: 12, color: '#888' }}>{formatDate(t.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Sous-total {t.montant_avant_taxes?.toFixed(2)}$ + TPS {t.tps?.toFixed(2)}$ + TVQ {t.tvq?.toFixed(2)}$
                      = <strong>{t.montant_total?.toFixed(2)}$ CAD</strong>
                    </div>
                    {t.stripe_session_id && (
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Session Stripe : {t.stripe_session_id}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles réutilisables ──────────────────────────────────────────────────────
const carteStatStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px',
};
const carteStatLabel: React.CSSProperties = {
  fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6,
};
const carteStatValeur: React.CSSProperties = {
  fontSize: 22, fontWeight: 800,
};
const thStyle: React.CSSProperties = {
  padding: '12px 10px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em',
};
const tdStyle: React.CSSProperties = {
  padding: '10px', verticalAlign: 'top',
};
const boutonSecondaireStyle: React.CSSProperties = {
  padding: '5px 9px', background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 6,
  fontSize: 13, cursor: 'pointer', lineHeight: 1,
};