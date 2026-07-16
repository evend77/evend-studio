// src/pages/admin/AdminMonetisationSponsors.tsx
import React, { useState, useEffect, useRef } from 'react';

const THEME = {
  accent: '#f59e0b', accentLight: '#fef3c7', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const STATUT_INFO: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: '✅ Actif', bg: '#dcfce7', color: THEME.success },
  pause: { label: '⏸ Pause', bg: '#fef3c7', color: THEME.warning },
  budget_epuise: { label: '💸 Épuisé', bg: '#fee2e2', color: THEME.danger },
  en_attente: { label: '⏳ Attente', bg: '#f3f4f6', color: THEME.textLight },
  rejete: { label: '🚫 Rejetée', bg: '#fecaca', color: '#991b1b' },
};

const API_BASE = '/api/admin/monetisation-pub';
const PAR_PAGE = 50;

function formatCurrency(num: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(num || 0);
}

function useDebounce(input: string, delay: number, onDebounced: (v: string) => void) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => onDebounced(input.trim()), delay);
    return () => { if (ref.current) clearTimeout(ref.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
      <button onClick={() => onChange(Math.max(page - 1, 1))} disabled={page <= 1}
        style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page <= 1 ? '#f3f4f6' : '#fff', color: page <= 1 ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer' }}>
        ← Précédent
      </button>
      <span style={{ fontSize: 13, color: THEME.textLight }}>Page <strong>{page}</strong> / {totalPages}</span>
      <button onClick={() => onChange(Math.min(page + 1, totalPages))} disabled={page >= totalPages}
        style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page >= totalPages ? '#f3f4f6' : '#fff', color: page >= totalPages ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'default' : 'pointer' }}>
        Suivant →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ⚙️ ONGLET CONFIG
// ══════════════════════════════════════════════════════════════════════
interface GestionnaireConfig { id: number; nom_boutique: string; email: string; montant_par_clic: number | null; utilise_defaut: boolean; }

function OngletConfig({ token, showToast }: { token: () => string | null; showToast: (m: string, t: 'success' | 'error') => void }) {
  const [defaut, setDefaut] = useState(0.10);
  const [defautInput, setDefautInput] = useState('0.10');
  const [gestionnaires, setGestionnaires] = useState<GestionnaireConfig[]>([]);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useDebounce(rechercheInput, 350, (v) => { setPage(1); setRecherche(v); });

  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE) });
      if (recherche) params.set('search', recherche);
      const res = await fetch(`${API_BASE}/config?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setDefaut(data.defaut ?? 0.10);
      setDefautInput((data.defaut ?? 0.10).toFixed(2));
      setGestionnaires(data.gestionnaires || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch { showToast('❌ Erreur lors du chargement', 'error'); }
    setChargement(false);
  };

  useEffect(() => { charger(); }, [page, recherche]);

  const sauvegarderDefaut = async () => {
    const montant = parseFloat(defautInput);
    if (isNaN(montant) || montant < 0) return showToast('❌ Montant invalide', 'error');
    try {
      await fetch(`${API_BASE}/config/defaut`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ montant }),
      });
      setDefaut(montant);
      showToast('✅ Montant par défaut mis à jour', 'success');
    } catch { showToast('❌ Erreur lors de la sauvegarde', 'error'); }
  };

  const sauvegarderGestionnaire = async (g: GestionnaireConfig) => {
    const valeur = editValues[g.id];
    const montant = valeur === '' || valeur === undefined ? null : parseFloat(valeur);
    if (montant !== null && (isNaN(montant) || montant < 0)) return showToast('❌ Montant invalide', 'error');
    try {
      await fetch(`${API_BASE}/config/${g.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ montant }),
      });
      setGestionnaires(prev => prev.map(x => x.id === g.id ? { ...x, montant_par_clic: montant, utilise_defaut: montant === null } : x));
      setEditValues(prev => { const c = { ...prev }; delete c[g.id]; return c; });
      showToast(`✅ Montant mis à jour pour ${g.nom_boutique}`, 'success');
    } catch { showToast('❌ Erreur lors de la sauvegarde', 'error'); }
  };

  return (
    <div>
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20, marginBottom: 24, maxWidth: 420 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>💵 Montant par défaut (par clic)</h3>
        <p style={{ fontSize: 12, color: THEME.textLight, margin: '0 0 12px' }}>Utilisé pour tout gestionnaire sans montant personnalisé.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="number" min={0} step="0.01" value={defautInput} onChange={e => setDefautInput(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
          <button onClick={sauvegarderDefaut} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: THEME.accent, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💾 Sauvegarder</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)} placeholder="🔍 Chercher un gestionnaire..."
          style={{ flex: '1 1 280px', padding: '9px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }} />
        {total > 0 && <span style={{ fontSize: 12, color: THEME.textLight }}>{total} gestionnaire{total > 1 ? 's' : ''} avec l'add-on actif</span>}
      </div>

      <div style={{ background: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'auto' }}>
        {chargement ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
        ) : gestionnaires.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>Aucun gestionnaire avec l'add-on pub activé</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                {['ID', 'Gestionnaire', 'Email', 'Montant/clic', ''].map(h => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gestionnaires.map((g, i) => {
                const valeurAffichee = editValues[g.id] !== undefined ? editValues[g.id] : (g.montant_par_clic !== null ? g.montant_par_clic.toFixed(2) : '');
                const modifie = editValues[g.id] !== undefined;
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>#{g.id}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>{g.nom_boutique}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{g.email}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <span style={{ fontSize: 11 }}>$</span>
                        <input type="number" min={0} step="0.01" value={valeurAffichee}
                          placeholder={defaut.toFixed(2)}
                          onChange={e => setEditValues(prev => ({ ...prev, [g.id]: e.target.value }))}
                          style={{ width: 70, padding: '5px 8px', border: `1.5px solid ${modifie ? THEME.accent : THEME.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }} />
                        {g.utilise_defaut && !modifie && <span style={{ fontSize: 9, color: THEME.textLight, fontStyle: 'italic' }}>(défaut)</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <button onClick={() => sauvegarderGestionnaire(g)} disabled={!modifie}
                        style={{ padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: modifie ? 'pointer' : 'default', background: modifie ? THEME.accent : '#e5e7eb', color: modifie ? 'white' : '#999' }}>
                        💾
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 📢 ONGLET SPONSOR
// ══════════════════════════════════════════════════════════════════════
interface PubStatAdmin { id: number; titre: string; type: string; sponsor_nom: string; impressions: number; clics: number; ctr: number; depense: number; budget: number; restant: number; statut: string; }

function OngletSponsor({ token, showToast }: { token: () => string | null; showToast: (m: string, t: 'success' | 'error') => void }) {
  const [pubs, setPubs] = useState<PubStatAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useDebounce(rechercheInput, 350, (v) => { setPage(1); setRecherche(v); });

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE) });
        if (recherche) params.set('search', recherche);
        const res = await fetch(`${API_BASE}/sponsors-stats?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
        const data = await res.json();
        setPubs(data.pubs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch { showToast('❌ Erreur lors du chargement', 'error'); }
      setChargement(false);
    };
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, recherche]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)} placeholder="🔍 Chercher par ID, titre ou sponsor..."
          style={{ flex: '1 1 320px', padding: '9px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }} />
        {total > 0 && <span style={{ fontSize: 12, color: THEME.textLight }}>{total} pub{total > 1 ? 's' : ''}</span>}
      </div>

      <div style={{ background: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
        {chargement ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
        ) : pubs.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>Aucune publicité trouvée</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                {['ID', 'Titre', 'Sponsor', 'Type', '👁️ Impressions', '🖱️ Clics', '📈 CTR', '💰 Dépensé', '💰 Budget', '💰 Restant', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pubs.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>#{p.id}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{p.sponsor_nom}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{p.type}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{p.impressions}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{p.clics}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{p.ctr.toFixed(2)}%</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{formatCurrency(p.depense)}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{formatCurrency(p.budget)}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{formatCurrency(p.restant)}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: STATUT_INFO[p.statut]?.bg, color: STATUT_INFO[p.statut]?.color }}>
                      {STATUT_INFO[p.statut]?.label || p.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 🏪 ONGLET GESTIONNAIRE
// ══════════════════════════════════════════════════════════════════════
interface GestionnaireRevenu { id: number; nom_boutique: string; email: string; montant_par_clic: number; impressions_total: number; clics_total: number; clics_mois: number; revenu_total: number; revenu_mois: number; }

function OngletGestionnaire({ token, showToast }: { token: () => string | null; showToast: (m: string, t: 'success' | 'error') => void }) {
  const [gestionnaires, setGestionnaires] = useState<GestionnaireRevenu[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useDebounce(rechercheInput, 350, (v) => { setPage(1); setRecherche(v); });

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE) });
        if (recherche) params.set('search', recherche);
        const res = await fetch(`${API_BASE}/gestionnaires-revenu?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
        const data = await res.json();
        setGestionnaires(data.gestionnaires || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch { showToast('❌ Erreur lors du chargement', 'error'); }
      setChargement(false);
    };
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, recherche]);

  const totalMois = gestionnaires.reduce((s, g) => s + g.revenu_mois, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)} placeholder="🔍 Chercher un gestionnaire..."
          style={{ flex: '1 1 320px', padding: '9px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <span style={{ fontSize: 12, color: THEME.textLight }}>
          {total} gestionnaire{total > 1 ? 's' : ''} · À verser ce mois (page actuelle) : <strong style={{ color: THEME.success }}>{formatCurrency(totalMois)}</strong>
        </span>
      </div>

      <div style={{ background: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
        {chargement ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
        ) : gestionnaires.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: THEME.textLight }}>Aucun gestionnaire trouvé</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                {['ID', 'Gestionnaire', 'Email', '$/clic', 'Impressions', 'Clics total', 'Clics ce mois', 'Revenu total', 'Revenu ce mois'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gestionnaires.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>#{g.id}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>{g.nom_boutique}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{g.email}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{g.montant_par_clic.toFixed(2)}$</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{g.impressions_total}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{g.clics_total}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>{g.clics_mois}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{formatCurrency(g.revenu_total)}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: THEME.success }}>{formatCurrency(g.revenu_mois)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Composant principal
// ══════════════════════════════════════════════════════════════════════
function AdminMonetisationSponsors() {
  const [onglet, setOnglet] = useState<'config' | 'sponsor' | 'gestionnaire'>('config');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  return (
    <div className="amon-container" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>💰 Monétisation</h1>
        <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Configuration du partage de revenu et vue d'ensemble sponsors/gestionnaires</p>
      </div>

      <div className="amon-tabs" style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${THEME.border}`, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { id: 'config', label: '⚙️ Config' },
          { id: 'sponsor', label: '📢 Sponsor' },
          { id: 'gestionnaire', label: '🏪 Gestionnaire' },
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

      {onglet === 'config' && <OngletConfig token={token} showToast={showToast} />}
      {onglet === 'sponsor' && <OngletSponsor token={token} showToast={showToast} />}
      {onglet === 'gestionnaire' && <OngletGestionnaire token={token} showToast={showToast} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .amon-container { padding: 16px 10px !important; }
          .amon-tabs button { padding: 9px 12px !important; font-size: 12.5px !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminMonetisationSponsors;