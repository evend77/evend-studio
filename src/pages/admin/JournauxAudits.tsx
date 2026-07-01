import React, { useState, useMemo, useEffect, useCallback } from 'react';

// ── Type LogEntry (compatible avec la BD audit_logs) ──────────────────────────
interface LogEntry {
  id:          number;
  date:        string;
  action:      string;
  utilisateur: string;
  details:     string;
  niveau:      string;
  ip?:         string;
  // Champs calculés côté client pour la compatibilité avec les filtres
  categorie:   CategorieLog;
  severite:    Severite;
  metadata?:   Record<string, any>;
}

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
  orange: '#ea580c',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type CategorieLog = 'admin' | 'vendeur' | 'acheteur' | 'finance' | 'systeme' | 'api';
type Severite     = 'info' | 'succes' | 'avertissement' | 'erreur' | 'critique';

// ── Config catégories ─────────────────────────────────────────────────────────
const CAT_CONFIG: Record<CategorieLog, { label: string; icon: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',        icon: '🔐', color: '#7c3aed', bg: '#f5f3ff' },
  vendeur:  { label: 'Vendeur',      icon: '🏪', color: T.accent,  bg: T.accentLight },
  acheteur: { label: 'Acheteur',     icon: '🛒', color: '#0891b2', bg: '#ecfeff' },
  finance:  { label: 'Finance',      icon: '💰', color: T.success, bg: '#f0fdf4' },
  systeme:  { label: 'Système',      icon: '⚙️', color: '#374151', bg: '#f9fafb' },
  api:      { label: 'API',          icon: '🌐', color: '#6d4fc2', bg: '#f3e8ff' },
};

const SEV_CONFIG: Record<Severite, { label: string; color: string; bg: string; dot: string }> = {
  info:          { label: 'Info',          color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  succes:        { label: 'Succès',        color: T.success, bg: '#f0fdf4', dot: T.success },
  avertissement: { label: 'Avertissement', color: '#92400e', bg: '#fffbeb', dot: T.warning },
  erreur:        { label: 'Erreur',        color: T.danger,  bg: '#fee2e2', dot: T.danger  },
  critique:      { label: 'Critique',      color: '#7f1d1d', bg: '#fef2f2', dot: '#dc2626' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function exportPDF(logs: LogEntry[]) {
  const lignes = logs.map(l =>
    `[${l.date}] [${l.categorie.toUpperCase()}] [${l.severite.toUpperCase()}] ${l.action} — ${l.details}${l.utilisateur ? ` (${l.utilisateur})` : ''}${l.ip && l.ip !== 'N/A' ? ` IP:${l.ip}` : ''}`
  ).join('\n');

  const contenu = `JOURNAUX & AUDITS — e-Vend Administration
Exporté le : ${new Date().toLocaleString('fr-CA')}
Période : 90 derniers jours
Nombre d'entrées : ${logs.length}
${'─'.repeat(80)}

${lignes}

${'─'.repeat(80)}
© 2026 e-Vend Administration — Document confidentiel`;

  const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `evend-logs-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Composants ────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success'|'info' }) {
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: type === 'success' ? T.success : T.accent, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

// ── MODALE DE DÉTAIL ──────────────────────────────────────────────────────────
function ModalDetail({ log, onFermer }: { log: LogEntry; onFermer: () => void }) {
  const cat = CAT_CONFIG[log.categorie];
  const sev = SEV_CONFIG[log.severite];

  // Essayer de parser les détails si c'est du JSON
  let detailsAffiches = log.details;
  let metadata = log.metadata || {};
  
  try {
    if (log.details && log.details.startsWith('{')) {
      const parsed = JSON.parse(log.details);
      detailsAffiches = parsed.message || JSON.stringify(parsed, null, 2);
      metadata = { ...metadata, ...parsed };
    }
  } catch {
    // Ce n'est pas du JSON valide, on garde tel quel
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{cat.icon}</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{log.action}</p>
                <p style={{ fontSize: '11px', opacity: 0.7, margin: '2px 0 0 0' }}>Log ID #{log.id} · {log.date}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Badges */}
        <div style={{ padding: '14px 22px', backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          <span style={{ backgroundColor: cat.bg, color: cat.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{cat.icon} {cat.label}</span>
          <span style={{ backgroundColor: sev.bg, color: sev.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>● {sev.label}</span>
          {log.ip && log.ip !== 'N/A' && <span style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>🌐 {log.ip}</span>}
        </div>

        {/* Contenu */}
        <div style={{ padding: '20px 22px' }}>

          {/* Détails */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', border: `1px solid ${T.border}` }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0' }}>Détails</p>
            <p style={{ fontSize: '13px', color: T.text, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }}>{detailsAffiches}</p>
          </div>

          {/* Infos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Utilisateur', val: log.utilisateur || 'Système' },
              { label: 'Date / Heure', val: log.date },
              { label: 'Adresse IP', val: log.ip || 'N/A' },
              { label: 'Catégorie', val: `${cat.icon} ${cat.label}` },
            ].map((r, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', margin: '0 0 3px 0' }}>{r.label}</p>
                <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: 0 }}>{r.val}</p>
              </div>
            ))}
          </div>

          {/* Metadata supplémentaires si présentes */}
          {Object.keys(metadata).length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Données supplémentaires</p>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                {Object.entries(metadata).map(([k, v], i, arr) => {
                  // Éviter d'afficher deux fois le message
                  if (k === 'message') return null;
                  return (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: i < arr.length - 1 ? `1px solid #f0f0f0` : 'none' }}>
                      <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: '700', color: T.textLight }}>{k}</div>
                      <div style={{ padding: '8px 12px', fontSize: '12px', color: T.text, fontFamily: 'monospace', wordBreak: 'break-word' as const }}>
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 22px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
interface JournauxAuditsProps { naviguerVers: (p: string, d?: any) => void; }

export default function JournauxAudits({ naviguerVers }: JournauxAuditsProps) {
  const [recherche,    setRecherche]    = useState('');
  const [filtreCateg,  setFiltreCateg]  = useState<'tous' | CategorieLog>('tous');
  const [filtreSev,    setFiltreSev]    = useState<'tous' | Severite>('tous');
  const [filtreUser,   setFiltreUser]   = useState('');
  const [logDetail,    setLogDetail]    = useState<LogEntry | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success'|'info' } | null>(null);
  const [page,         setPage]         = useState(1);
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const PAR_PAGE = 15;

  // ── Mapping BD → types front ──────────────────────────────────────────────
  const mapNiveauToCategorie = (action: string, niveau: string): CategorieLog => {
    const a = action.toLowerCase();
    if (a.includes('vendeur') || a.includes('inscription') || a.includes('boutique') || a.includes('suspendu') || a.includes('reactive') || a.includes('banni') || a.includes('statut')) return 'vendeur';
    if (a.includes('acheteur') || a.includes('commande') || a.includes('livraison')) return 'acheteur';
    if (a.includes('finance') || a.includes('paiement') || a.includes('commission') || a.includes('stripe') || a.includes('paypal')) return 'finance';
    if (a.includes('login') || a.includes('auth') || a.includes('admin') || a.includes('page') || a.includes('approbation')) return 'admin';
    if (a.includes('api') || a.includes('fetch') || a.includes('http')) return 'api';
    return 'systeme';
  };

  const mapNiveauToSeverite = (niveau: string): Severite => {
    const n = niveau.toLowerCase();
    if (n === 'critical' || n === 'critique') return 'critique';
    if (n === 'error' || n === 'erreur')      return 'erreur';
    if (n === 'warning' || n === 'avertissement') return 'avertissement';
    if (n === 'success' || n === 'succes')    return 'succes';
    return 'info';
  };

  const chargerLogs = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://evend-multivendeur-api.onrender.com/api/audit/logs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: LogEntry[] = data.map((row: any) => ({
        id:          row.id,
        date:        row.date ? new Date(row.date).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—',
        action:      row.action || '—',
        utilisateur: row.utilisateur || 'système',
        details:     row.details || '',
        niveau:      row.niveau || 'info',
        ip:          row.ip || undefined,
        categorie:   mapNiveauToCategorie(row.action || '', row.niveau || ''),
        severite:    mapNiveauToSeverite(row.niveau || ''),
        metadata:    (() => { try { return JSON.parse(row.details || '{}'); } catch { return {}; } })(),
      }));
      setLogs(mapped);
    } catch (err) {
      console.error('❌ Erreur chargement audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerLogs();
  }, [chargerLogs]);

  const showToast = (msg: string, type: 'success'|'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const logsFiltres = useMemo(() => logs.filter(l => {
    const s = recherche.toLowerCase();
    const inSearch   = !s || l.action.toLowerCase().includes(s) || l.details.toLowerCase().includes(s) || l.utilisateur?.toLowerCase().includes(s) || l.ip?.includes(s);
    const inCateg    = filtreCateg === 'tous' || l.categorie === filtreCateg;
    const inSev      = filtreSev   === 'tous' || l.severite  === filtreSev;
    const inUser     = !filtreUser || l.utilisateur?.toLowerCase().includes(filtreUser.toLowerCase());
    return inSearch && inCateg && inSev && inUser;
  }), [logs, recherche, filtreCateg, filtreSev, filtreUser]);

  const nbPages   = Math.ceil(logsFiltres.length / PAR_PAGE);
  const logsPage  = logsFiltres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const handleActualiser = () => {
    chargerLogs();
    showToast('🔄 Logs rechargés depuis la BD', 'info');
  };

  const handleExport = () => {
    exportPDF(logsFiltres);
    showToast(`📄 Export téléchargé — ${logsFiltres.length} entrées`, 'success');
    // Log export envoyé via API
    const token = localStorage.getItem('token');
    fetch('https://evend-multivendeur-api.onrender.com/api/audit/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'EXPORT_LOGS', details: `${logsFiltres.length} entrées exportées`, niveau: 'info' }),
    }).catch(() => {});
  };

  // Statistiques rapides
  const stats = {
    total:    logs.length,
    erreurs:  logs.filter(l => l.severite === 'erreur' || l.severite === 'critique').length,
    critiques: logs.filter(l => l.severite === 'critique').length,
    admin:    logs.filter(l => l.categorie === 'admin').length,
    api:      logs.filter(l => l.categorie === 'api').length,
    vendeur:  logs.filter(l => l.categorie === 'vendeur').length,
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 12px',
    fontSize: '12px', outline: 'none', backgroundColor: 'white',
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: T.textLight }}>Chargement des journaux...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast    && <Toast msg={toast.msg} type={toast.type} />}
      {logDetail && <ModalDetail log={logDetail} onFermer={() => setLogDetail(null)} />}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Journaux & Audits</h1>
            <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Base de données · {logs.length} entrées{loading ? ' — chargement...' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleActualiser}
              style={{ backgroundColor: 'white', color: T.accent, border: `2px solid ${T.accent}`, borderRadius: '9px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
              🔄 Actualiser
            </button>
            <button onClick={handleExport}
              style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '9px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(45,106,159,0.35)' }}>
              📄 Exporter les logs
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total entrées',   val: stats.total,    icon: '📋', color: T.accent  },
            { label: 'Actions admin',    val: stats.admin,    icon: '🔐', color: '#7c3aed' },
            { label: 'Appels API',       val: stats.api,      icon: '🌐', color: '#6d4fc2' },
            { label: 'Erreurs',          val: stats.erreurs,  icon: '⚠️', color: T.warning },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ fontSize: '18px', width: '34px', height: '34px', borderRadius: '8px', backgroundColor: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
                <p style={{ fontSize: '22px', fontWeight: '900', color: T.text, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, margin: 0 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>

          {/* Recherche */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1); }}
              placeholder="Rechercher action, détails, IP..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '30px', boxSizing: 'border-box' as const }} />
          </div>

          {/* Filtre utilisateur */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>👤</span>
            <input type="text" value={filtreUser} onChange={e => { setFiltreUser(e.target.value); setPage(1); }}
              placeholder="Filtrer par utilisateur..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '30px', boxSizing: 'border-box' as const }} />
          </div>

          {/* Catégorie */}
          <select value={filtreCateg} onChange={e => { setFiltreCateg(e.target.value as any); setPage(1); }} style={inputStyle}>
            <option value="tous">Toutes catégories</option>
            {(Object.entries(CAT_CONFIG) as [CategorieLog, typeof CAT_CONFIG[CategorieLog]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>

          {/* Sévérité */}
          <select value={filtreSev} onChange={e => { setFiltreSev(e.target.value as any); setPage(1); }} style={inputStyle}>
            <option value="tous">Toutes sévérités</option>
            {(Object.entries(SEV_CONFIG) as [Severite, typeof SEV_CONFIG[Severite]][]).map(([k, v]) => (
              <option key={k} value={k}>● {v.label}</option>
            ))}
          </select>

          {/* Reset */}
          {(recherche || filtreCateg !== 'tous' || filtreSev !== 'tous' || filtreUser) && (
            <button onClick={() => { setRecherche(''); setFiltreCateg('tous'); setFiltreSev('tous'); setFiltreUser(''); setPage(1); }}
              style={{ ...inputStyle, fontWeight: '600', color: T.textLight, cursor: 'pointer' }}>
              ✕ Reset
            </button>
          )}

          <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 0 auto', whiteSpace: 'nowrap' as const }}>
            <strong>{logsFiltres.length}</strong> entrée{logsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Tableau */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                  {['Date / Heure', 'Catégorie', 'Sévérité', 'Action', 'Utilisateur', 'IP', 'Détail'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsPage.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>🔍 Aucun résultat</td></tr>
                ) : logsPage.map((log, i) => {
                  const cat = CAT_CONFIG[log.categorie];
                  const sev = SEV_CONFIG[log.severite];
                  const estCritique = log.severite === 'critique' || log.severite === 'erreur';

                  return (
                    <tr key={log.id}
                      style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: estCritique ? '#fff9f9' : i % 2 === 0 ? 'white' : '#fafafa' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = estCritique ? '#fff9f9' : i % 2 === 0 ? 'white' : '#fafafa'}>

                      <td style={{ padding: '10px 14px', fontSize: '11px', color: T.textLight, fontFamily: 'monospace', whiteSpace: 'nowrap' as const }}>{log.date}</td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: cat.bg, color: cat.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' as const }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: sev.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: sev.color, whiteSpace: 'nowrap' as const }}>{sev.label}</span>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '700', color: T.text, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {log.action}
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: '11px', color: T.textLight, whiteSpace: 'nowrap' as const }}>
                        {log.utilisateur || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Système</span>}
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', color: T.textLight, whiteSpace: 'nowrap' as const }}>
                        {log.ip || '—'}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => setLogDetail(log)}
                          style={{ backgroundColor: T.accentLight, color: T.accent, border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          👁 Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {nbPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, backgroundColor: page === 1 ? '#f3f4f6' : 'white', color: page === 1 ? '#aaa' : T.text, fontSize: '12px', fontWeight: '700', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
              ← Préc
            </button>
            {Array.from({ length: nbPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${p === page ? T.accent : T.border}`, backgroundColor: p === page ? T.accent : 'white', color: p === page ? 'white' : T.text, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(nbPages, p + 1))} disabled={page === nbPages}
              style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, backgroundColor: page === nbPages ? '#f3f4f6' : 'white', color: page === nbPages ? '#aaa' : T.text, fontSize: '12px', fontWeight: '700', cursor: page === nbPages ? 'not-allowed' : 'pointer' }}>
              Suiv →
            </button>
            <span style={{ fontSize: '12px', color: T.textLight, marginLeft: '4px' }}>Page {page} / {nbPages}</span>
          </div>
        )}

        {/* Note */}
        <div style={{ marginTop: '20px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>📝</span>
          <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>
            <strong>Logs en temps réel :</strong> Toutes les actions que vous effectuez (création de plan, modification, appels API) apparaissent instantanément dans cette page.
          </p>
        </div>

      </div>
    </>
  );
}
