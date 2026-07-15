// src/pages/admin/AdminPubsSponsors.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PubAdmin {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  type: string;
  actif: boolean;
  statut: 'active' | 'pause' | 'budget_epuise' | 'en_attente';
  impressions: number;
  clics: number;
  prix_par_click: number;
  budget_type: string;
  budget_montant: number;
  budget_depense: number;
  sponsor_id: number;
  sponsor_nom: string;
  created_at: string;
}

const THEME = {
  accent: '#f59e0b', accentLight: '#fef3c7', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const STATUT_INFO: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: '✅ Active', bg: '#dcfce7', color: THEME.success },
  pause: { label: '⏸ Pause', bg: '#fef3c7', color: THEME.warning },
  budget_epuise: { label: '💸 Budget épuisé', bg: '#fee2e2', color: THEME.danger },
  en_attente: { label: '⏳ En attente', bg: '#f3f4f6', color: THEME.textLight },
};

const TYPE_ICONES: Record<string, string> = {
  basique: '📸', carrousel: '🎠', video: '🎬', interactive: '✨',
  social: '🔥', avant_apres: '🔄', parallaxe: '🎯', minijeu: '🎮',
  codepromo: '🏷️', temoignage: '⭐',
};

const API_BASE = '/api/sponsors/pubs';
const PAR_PAGE = 50;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(num: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(num || 0);
}

function AdminPubsSponsors() {
  const [pubs, setPubs] = useState<PubAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const charger = async (pageDemandee: number, rechercheDemandee: string) => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(pageDemandee), limit: String(PAR_PAGE) });
      if (rechercheDemandee) params.set('search', rechercheDemandee);
      const res = await fetch(`${API_BASE}/admin/all?${params.toString()}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPubs(data.pubs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      showToast('❌ Erreur lors du chargement des pubs', 'error');
    }
    setChargement(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setRecherche(rechercheInput.trim()); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rechercheInput]);

  useEffect(() => { charger(page, recherche); }, [page, recherche]);

  const togglePause = async (pub: PubAdmin) => {
    const nouveauActif = !pub.actif;
    setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: nouveauActif, statut: nouveauActif ? 'active' : 'pause' } : p));
    try {
      const res = await fetch(`${API_BASE}/admin/${pub.id}/pause`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actif: nouveauActif }),
      });
      if (!res.ok) throw new Error();
      showToast(nouveauActif ? '✅ Publicité réactivée' : '⏸ Publicité mise en pause', 'success');
    } catch {
      setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: pub.actif, statut: pub.statut } : p));
      showToast('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const supprimer = async (pub: PubAdmin) => {
    if (!window.confirm(`Supprimer définitivement la pub #${pub.id} "${pub.titre}" (${pub.sponsor_nom}) ?\n\nCeci retire aussi l'image du stockage S3.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/${pub.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setPubs(prev => prev.filter(p => p.id !== pub.id));
      setTotal(t => Math.max(0, t - 1));
      showToast('✅ Publicité supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="apub-container" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>📢 Pub Sponsor</h1>
          <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Toutes les publicités, tous sponsors confondus — {total} au total</p>
        </div>
      </div>

      <div className="apub-recherche" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)}
          placeholder="🔍 Chercher par ID, titre ou nom de sponsor..."
          style={{ flex: '1 1 320px', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }}
        />
      </div>

      <div className="print-table" style={{ backgroundColor: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {chargement ? (
          <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
        ) : pubs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>
            {recherche ? '🔍 Aucun résultat pour cette recherche' : '📭 Aucune publicité pour le moment'}
          </div>
        ) : (
          <table className="apub-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                {['ID', 'Aperçu', 'Titre', 'Sponsor', 'Type', 'Impressions', 'Clics', '$/clic', 'Budget', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>{h}</th>
                ))}
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pubs.map((pub, i) => (
                <tr key={pub.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>#{pub.id}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <img src={pub.url_image} alt={pub.titre} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'left', maxWidth: 160 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pub.titre}</p>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{pub.sponsor_nom}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{TYPE_ICONES[pub.type] || '📸'} {pub.type}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{pub.impressions ?? 0}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{pub.clics ?? 0}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{formatCurrency(pub.prix_par_click)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11 }}>{formatCurrency(pub.budget_depense)} / {formatCurrency(pub.budget_montant)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: STATUT_INFO[pub.statut]?.bg, color: STATUT_INFO[pub.statut]?.color }}>
                      {STATUT_INFO[pub.statut]?.label || pub.statut}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => togglePause(pub)}
                        style={{ padding: '5px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: pub.actif ? '#fef3c7' : '#dcfce7', color: pub.actif ? '#92400e' : THEME.success }}>
                        {pub.actif ? '⏸' : '▶️'}
                      </button>
                      <button onClick={() => supprimer(pub)}
                        style={{ padding: '5px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#fee2e2', color: THEME.danger }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="apub-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page <= 1 ? '#f3f4f6' : '#fff', color: page <= 1 ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer' }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 13, color: THEME.textLight }}>Page <strong>{page}</strong> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page >= totalPages ? '#f3f4f6' : '#fff', color: page >= totalPages ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'default' : 'pointer' }}>
            Suivant →
          </button>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .apub-container { padding: 16px 10px !important; }
          .apub-table { font-size: 11px; }
          .apub-recherche input { flex: 1 1 100% !important; }
          .apub-pagination button { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminPubsSponsors;