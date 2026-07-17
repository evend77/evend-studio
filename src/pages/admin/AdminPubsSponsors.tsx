// src/pages/admin/AdminPubsSponsors.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PubAdmin {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  type: string;
  actif: boolean;
  statut: 'active' | 'pause' | 'budget_epuise' | 'en_attente' | 'rejete';
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
  rejete: { label: '🚫 Rejetée', bg: '#fecaca', color: '#991b1b' },
};

const TYPE_ICONES: Record<string, string> = {
  basique: '📸', carrousel: '🎠', video: '🎬', interactive: '✨',
  social: '🔥', avant_apres: '🔄', parallaxe: '🎯', minijeu: '🎮',
  codepromo: '🏷️', temoignage: '⭐',
};

const API_BASE = '/api/sponsors';
const PAR_PAGE = 50;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(num: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(num || 0);
}

function OngletPublicites() {
  const [pubs, setPubs] = useState<PubAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [verifIA, setVerifIA] = useState(false);
  const [chargementVerifIA, setChargementVerifIA] = useState(true);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const chargerVerifIA = async () => {
    try {
      const res = await fetch('/api/admin/moderation-config', { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setVerifIA(!!data.verification_ai_active);
    } catch { /* silencieux, le toggle reste sur off par défaut */ }
    setChargementVerifIA(false);
  };

  const toggleVerifIA = async () => {
    const nouvelleValeur = !verifIA;
    setVerifIA(nouvelleValeur);
    try {
      await fetch('/api/admin/moderation-config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ verification_ai_active: nouvelleValeur }),
      });
      showToast(nouvelleValeur ? '🤖 Vérification IA activée' : '✋ Vérification IA désactivée — tout redevient manuel', 'success');
    } catch {
      setVerifIA(!nouvelleValeur);
      showToast('❌ Erreur lors du changement', 'error');
    }
  };

  useEffect(() => { chargerVerifIA(); }, []);

  const charger = async (pageDemandee: number, rechercheDemandee: string, statutDemande: string) => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(pageDemandee), limit: String(PAR_PAGE) });
      if (rechercheDemandee) params.set('search', rechercheDemandee);
      if (statutDemande) params.set('statut', statutDemande);
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

  useEffect(() => { charger(page, recherche, filtreStatut); }, [page, recherche, filtreStatut]);

  const approuver = async (pub: PubAdmin) => {
    try {
      const res = await fetch(`${API_BASE}/admin/${pub.id}/approuver`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: true, statut: 'active' } : p));
      showToast('✅ Publicité approuvée et publiée', 'success');
    } catch {
      showToast('❌ Erreur lors de l\'approbation', 'error');
    }
  };

  const rejeter = async (pub: PubAdmin) => {
    if (!window.confirm(`Rejeter la pub #${pub.id} "${pub.titre}" ? Elle ne sera jamais publiée.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/${pub.id}/rejeter`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: false, statut: 'rejete' } : p));
      showToast('🚫 Publicité rejetée', 'success');
    } catch {
      showToast('❌ Erreur lors du rejet', 'error');
    }
  };

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>{total} publicité{total > 1 ? 's' : ''} au total, tous sponsors confondus</p>
        {!chargementVerifIA && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: verifIA ? '#fef3c7' : '#f3f4f6', padding: '8px 14px', borderRadius: 10, border: `1px solid ${verifIA ? '#f59e0b' : THEME.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: verifIA ? '#92400e' : THEME.textLight }}>🤖 Vérification IA</span>
            <div onClick={toggleVerifIA}
              style={{ width: 38, height: 20, borderRadius: 11, background: verifIA ? THEME.accent : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: verifIA ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
            <span style={{ fontSize: 11, color: THEME.textLight }}>{verifIA ? 'Filtre auto actif' : 'Tout manuel'}</span>
          </div>
        )}
      </div>

      <div className="apub-recherche" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)}
          placeholder="🔍 Chercher par ID, titre ou nom de sponsor..."
          style={{ flex: '1 1 320px', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }}
        />
        <select value={filtreStatut} onChange={e => { setPage(1); setFiltreStatut(e.target.value); }}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">⏳ En attente</option>
          <option value="active">✅ Actives</option>
          <option value="pause">⏸ En pause</option>
          <option value="budget_epuise">💸 Budget épuisé</option>
          <option value="rejete">🚫 Rejetées</option>
        </select>
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
                      {pub.statut === 'en_attente' ? (
                        <>
                          <button onClick={() => approuver(pub)}
                            style={{ padding: '5px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#dcfce7', color: THEME.success }}>
                            ✅
                          </button>
                          <button onClick={() => rejeter(pub)}
                            style={{ padding: '5px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#fee2e2', color: THEME.danger }}>
                            🚫
                          </button>
                        </>
                      ) : pub.statut !== 'rejete' ? (
                        <button onClick={() => togglePause(pub)}
                          style={{ padding: '5px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: pub.actif ? '#fef3c7' : '#dcfce7', color: pub.actif ? '#92400e' : THEME.success }}>
                          {pub.actif ? '⏸' : '▶️'}
                        </button>
                      ) : null}
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

// ══════════════════════════════════════════════════════════════════════
// 🏷️ ONGLET CATÉGORIES
// ══════════════════════════════════════════════════════════════════════
interface CategoriePub { id: number; cle: string; label: string; emoji: string; actif: boolean; ordre: number; }

function ModaleCategorie({ categorie, onFermer, onSauvegarder }: {
  categorie: Partial<CategoriePub> | null;
  onFermer: () => void;
  onSauvegarder: (data: { label: string; emoji: string }) => void;
}) {
  const [label, setLabel] = useState(categorie?.label || '');
  const [emoji, setEmoji] = useState(categorie?.emoji || '🌍');

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, #1a2436, ${THEME.accent})`, color: 'white' }}>
          <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{categorie?.id ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Emoji</label>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4}
            style={{ width: 70, padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 18, textAlign: 'center', outline: 'none', marginBottom: 16 }} />
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Nom de la catégorie</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Technologie"
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onFermer} style={{ padding: '9px 18px', border: `1px solid ${THEME.border}`, borderRadius: 8, backgroundColor: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => label.trim() && onSauvegarder({ label: label.trim(), emoji: emoji || '🌍' })} disabled={!label.trim()}
            style={{ padding: '9px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: label.trim() ? 'pointer' : 'not-allowed', backgroundColor: label.trim() ? THEME.accent : '#fcd34d', color: 'white' }}>
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

function OngletCategories() {
  const [categories, setCategories] = useState<CategoriePub[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modale, setModale] = useState<{ open: boolean; categorie: Partial<CategoriePub> | null }>({ open: false, categorie: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const charger = async () => {
    setChargement(true);
    try {
      const res = await fetch('/api/admin/categories-pub', { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      showToast('❌ Erreur lors du chargement des catégories', 'error');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const sauvegarder = async (data: { label: string; emoji: string }) => {
    try {
      const estEdition = !!modale.categorie?.id;
      const res = await fetch(
        estEdition ? `/api/admin/categories-pub/${modale.categorie!.id}` : '/api/admin/categories-pub',
        {
          method: estEdition ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify(data),
        }
      );
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erreur');
      showToast(estEdition ? '✅ Catégorie modifiée' : '✅ Catégorie créée', 'success');
      setModale({ open: false, categorie: null });
      charger();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  const toggleActif = async (cat: CategoriePub) => {
    try {
      await fetch(`/api/admin/categories-pub/${cat.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actif: !cat.actif }),
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, actif: !c.actif } : c));
    } catch {
      showToast('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const supprimer = async (cat: CategoriePub) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.label}" ? Les pubs qui la ciblaient continueront de fonctionner normalement.`)) return;
    try {
      const res = await fetch(`/api/admin/categories-pub/${cat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      showToast('✅ Catégorie supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression', 'error');
    }
  };

  if (chargement) return <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Catégories de sites utilisées pour cibler les pubs</p>
        <button onClick={() => setModale({ open: true, categorie: null })}
          style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Nouvelle catégorie
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background: THEME.card, borderRadius: 10, border: `1.5px solid ${cat.actif ? THEME.border : '#fca5a5'}`, padding: 14, opacity: cat.actif ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{cat.emoji}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: 9, color: '#aaa', margin: 0, fontFamily: 'monospace' }}>{cat.cle}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setModale({ open: true, categorie: cat })} style={{ flex: 1, padding: '6px 0', border: `1px solid ${THEME.border}`, borderRadius: 6, background: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✏️</button>
              <button onClick={() => toggleActif(cat)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, background: cat.actif ? '#fef3c7' : '#dcfce7', color: cat.actif ? '#92400e' : THEME.success, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {cat.actif ? '⏸' : '▶️'}
              </button>
              <button onClick={() => supprimer(cat)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, background: '#fee2e2', color: THEME.danger, fontSize: 11, cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modale.open && <ModaleCategorie categorie={modale.categorie} onFermer={() => setModale({ open: false, categorie: null })} onSauvegarder={sauvegarder} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Composant principal — onglets Publicités / Catégories
// ══════════════════════════════════════════════════════════════════════
function AdminPubsSponsors() {
  const [onglet, setOnglet] = useState<'publicites' | 'categories'>('publicites');

  return (
    <div className="apub-container" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>📢 Pub Sponsor</h1>
      </div>

      <div className="apub-tabs" style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${THEME.border}`, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'publicites', label: '📢 Publicités' },
          { id: 'categories', label: '🏷️ Catégories' },
        ].map(t => (
          <button key={t.id} onClick={() => setOnglet(t.id as any)}
            style={{
              padding: '11px 20px', background: 'transparent', border: 'none',
              borderBottom: onglet === t.id ? `3px solid ${THEME.accent}` : '3px solid transparent',
              color: onglet === t.id ? THEME.accent : THEME.textLight,
              fontWeight: onglet === t.id ? 700 : 500, cursor: 'pointer', fontSize: 14,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {onglet === 'publicites' && <OngletPublicites />}
      {onglet === 'categories' && <OngletCategories />}

      <style>{`
        @media (max-width: 900px) {
          .apub-container { padding: 16px 10px !important; }
          .apub-tabs button { padding: 9px 12px !important; font-size: 12.5px !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminPubsSponsors;