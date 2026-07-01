// src/AppAdminStudio.tsx
// e-Vend Studio — Dashboard Administration
// ✅ Zéro import externe — tout en PageEnConstruction jusqu'à développement
// Usage: <AppAdminStudio onLogout={handleLogout} />

import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5001/api';

// ─── THÈME ────────────────────────────────────────────────────────────────────
const THEME = {
  sidebar:      '#111111',
  sidebarHover: '#1e1e1e',
  sidebarActive:'#8a6c3e',
  accent:       '#c9a96e',
  accentLight:  '#f5ede0',
  topbar:       '#ffffff',
  bg:           '#f4f4f2',
  card:         '#ffffff',
  border:       '#e5e7eb',
  text:         '#1a1a1a',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Vendeur {
  id: number;
  nom: string;
  email: string;
  nom_boutique?: string;
  plan: string;
  statut: string;
  slug?: string;
  publie?: boolean;
  created_at?: string;
}

interface SousSection { id: string; label: string; icon: string; badge?: number; }
interface NavItem {
  id: string; label: string; icon: string; badge?: number;
  sousSections?: SousSection[];
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  {
    id: 'vendeurs', label: 'Vendeurs', icon: '🏪',
    sousSections: [
      { id: 'vendeurs-liste',        label: 'Liste des vendeurs',      icon: '📋' },
      { id: 'vendeurs-approbations', label: 'Approbations en attente', icon: '⏳' },
      { id: 'vendeurs-suspendus',    label: 'Comptes suspendus',       icon: '🚫' },
      { id: 'vendeurs-creer',        label: 'Créer un vendeur',        icon: '➕' },
    ],
  },
  {
    id: 'sites', label: 'Sites Studio', icon: '🎨',
    sousSections: [
      { id: 'sites-liste',    label: 'Tous les sites',     icon: '📋' },
      { id: 'sites-publies',  label: 'Sites publiés',      icon: '✅' },
      { id: 'sites-brouillon',label: 'Brouillons',         icon: '📝' },
    ],
  },
  {
    id: 'forfaits', label: 'Forfaits & Plans', icon: '⭐',
    sousSections: [
      { id: 'forfaits-liste',       label: 'Gérer les plans',    icon: '🗂️' },
      { id: 'forfaits-creer',       label: 'Créer un plan',      icon: '➕' },
      { id: 'forfaits-abonnements', label: 'Abonnements actifs', icon: '✅' },
    ],
  },
  {
    id: 'finances', label: 'Finances', icon: '💰',
    sousSections: [
      { id: 'finances-revenus',    label: 'Revenus',            icon: '💸' },
      { id: 'finances-paiements',  label: 'Paiements vendeurs', icon: '💳' },
      { id: 'finances-rapports',   label: 'Rapports',           icon: '📊' },
    ],
  },
  {
    id: 'messagerie', label: 'Messagerie', icon: '✉️',
    sousSections: [
      { id: 'messagerie-notifications', label: 'Notifications',   icon: '📢' },
      { id: 'messagerie-support',       label: 'Support vendeurs',icon: '🏪' },
    ],
  },
  {
    id: 'plateforme', label: 'Plateforme', icon: '⚙️',
    sousSections: [
      { id: 'plateforme-config',   label: 'Configuration générale', icon: '🔧' },
      { id: 'plateforme-emails',   label: 'Modèles de courriels',   icon: '📧' },
      { id: 'plateforme-stripe',   label: 'Configuration Stripe',   icon: '💳' },
      { id: 'plateforme-domaines', label: 'Gestion des domaines',   icon: '🌐' },
    ],
  },
  {
    id: 'analytique', label: 'Analytique', icon: '📈',
    sousSections: [
      { id: 'analytique-visites', label: 'Visites',          icon: '🌐' },
      { id: 'analytique-sites',   label: 'Perf. des sites',  icon: '📄' },
    ],
  },
  { id: 'logs', label: 'Journaux & Audits', icon: '📋' },
];

// ─── PAGE EN CONSTRUCTION ────────────────────────────────────────────────────
function PageEnConstruction({ titre }: { titre: string }) {
  return (
    <div style={{ padding: '40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.25 }}>🔧</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h2>
        <p style={{ fontSize: '14px', color: THEME.textLight, margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Cette section est en cours de développement.<br />Elle sera disponible prochainement.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: `${THEME.accent}15`, border: `1px solid ${THEME.accent}30`, borderRadius: 20 }}>
          <span style={{ fontSize: 14 }}>⏳</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: THEME.accent }}>En développement</span>
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KPICard({ icon, titre, valeur, sousTitre, couleur, tendance }: {
  icon: string; titre: string; valeur: string; sousTitre: string;
  couleur: string; tendance?: { val: string; positif: boolean };
}) {
  return (
    <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: couleur + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
        {tendance && (
          <span style={{ fontSize: '12px', fontWeight: '700', color: tendance.positif ? THEME.success : THEME.danger, backgroundColor: tendance.positif ? '#dcfce7' : '#fee2e2', padding: '3px 8px', borderRadius: '20px' }}>
            {tendance.positif ? '↑' : '↓'} {tendance.val}
          </span>
        )}
      </div>
      <p style={{ fontSize: '28px', fontWeight: '800', color: THEME.text, margin: '0 0 4px 0', lineHeight: 1 }}>{valeur}</p>
      <p style={{ fontSize: '13px', fontWeight: '600', color: THEME.textLight, margin: '0 0 2px 0' }}>{titre}</p>
      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{sousTitre}</p>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardStats({ stats, vendeurs, naviguerVers }: {
  stats: any; vendeurs: Vendeur[]; naviguerVers: (p: string) => void;
}) {
  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tableau de bord</h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Vue d'ensemble de e-Vend Studio</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <KPICard icon="🏪" titre="Vendeurs total"     valeur={String(stats.total_vendeurs  || vendeurs.length)} sousTitre="Sur la plateforme"  couleur={THEME.accent}   tendance={{ val: '+2 ce mois', positif: true }} />
        <KPICard icon="✅" titre="Vendeurs actifs"    valeur={String(stats.vendeurs_actifs || vendeurs.filter(v => v.statut === 'actif').length)} sousTitre="Comptes en règle" couleur={THEME.success} />
        <KPICard icon="🌐" titre="Sites publiés"      valeur={String(stats.sites_publies   || 0)} sousTitre="En ligne maintenant"  couleur="#6366f1" />
        <KPICard icon="⏳" titre="En attente"         valeur={String(stats.vendeurs_attente || vendeurs.filter(v => v.statut === 'en_attente').length)} sousTitre="À approuver"        couleur={THEME.warning} />
      </div>

      {/* Vendeurs récents */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.accent}`, backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏪 Vendeurs récents</h3>
          <button onClick={() => naviguerVers('vendeurs-liste')} style={{ fontSize: '12px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Voir tous →</button>
        </div>
        {vendeurs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: THEME.textLight, fontSize: '14px' }}>Aucun vendeur pour l'instant.</div>
        ) : (
          vendeurs.slice(0, 6).map((v, i) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < 5 ? `1px solid #f5f5f5` : 'none', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: THEME.accent }}>{v.nom.charAt(0)}</div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{v.nom}</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{v.email} · {v.plan}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {v.slug && <span style={{ fontSize: '11px', color: '#aaa' }}>/{v.slug}</span>}
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: v.statut === 'actif' ? '#dcfce7' : v.statut === 'suspendu' ? '#fee2e2' : '#fef9c3', color: v.statut === 'actif' ? THEME.success : v.statut === 'suspendu' ? THEME.danger : THEME.warning }}>
                  {v.statut === 'actif' ? '✓ Actif' : v.statut === 'suspendu' ? '✗ Suspendu' : '⏳ En attente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── LISTE VENDEURS ───────────────────────────────────────────────────────────
function ListeVendeurs({ vendeurs, onStatutChange, naviguerVers }: {
  vendeurs: Vendeur[];
  onStatutChange: (id: number, statut: string) => void;
  naviguerVers: (p: string) => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const filtres = vendeurs.filter(v => {
    const ok = filtreStatut === 'tous' || v.statut === filtreStatut;
    const q = recherche.toLowerCase();
    const match = !q || v.nom.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || (v.slug || '').includes(q);
    return ok && match;
  });

  const changerStatut = async (id: number, statut: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/admin/vendeurs/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut }),
      });
      onStatutChange(id, statut);
    } catch { alert('Erreur lors de la mise à jour.'); }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: 0 }}>🏪 Vendeurs ({filtres.length})</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 14px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', width: 200 }} />
          {['tous','actif','en_attente','suspendu'].map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)} style={{ padding: '7px 14px', border: `1px solid ${filtreStatut === s ? THEME.accent : THEME.border}`, borderRadius: '8px', background: filtreStatut === s ? THEME.accent : '#fff', color: filtreStatut === s ? '#fff' : THEME.textLight, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {s === 'tous' ? 'Tous' : s === 'actif' ? 'Actifs' : s === 'en_attente' ? 'En attente' : 'Suspendus'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.border}` }}>
              {['ID', 'Vendeur', 'Courriel', 'Plan', 'Site', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: THEME.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtres.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>Aucun vendeur trouvé.</td></tr>
            ) : filtres.map((v, i) => (
              <tr key={v.id} style={{ borderBottom: `1px solid ${THEME.border}`, backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '11px' }}>{v.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${THEME.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: THEME.accent, fontSize: 13 }}>{v.nom.charAt(0)}</div>
                    <span style={{ fontWeight: '600', color: THEME.text }}>{v.nom}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: THEME.textLight }}>{v.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#f0f0f0', color: '#555' }}>{v.plan}</span>
                </td>
                <td style={{ padding: '12px 16px', color: THEME.textLight, fontSize: '11px' }}>{v.slug ? `/${v.slug}` : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: v.statut === 'actif' ? '#dcfce7' : v.statut === 'suspendu' ? '#fee2e2' : '#fef9c3', color: v.statut === 'actif' ? THEME.success : v.statut === 'suspendu' ? THEME.danger : THEME.warning }}>
                    {v.statut === 'actif' ? '✓ Actif' : v.statut === 'suspendu' ? '✗ Suspendu' : '⏳ En attente'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {v.statut !== 'actif' && <button onClick={() => changerStatut(v.id, 'actif')} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: '#dcfce7', color: THEME.success, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Activer</button>}
                    {v.statut !== 'suspendu' && <button onClick={() => changerStatut(v.id, 'suspendu')} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: '#fee2e2', color: THEME.danger, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Suspendre</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SESSION INDICATOR ────────────────────────────────────────────────────────
function SessionIndicator() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('token');
      if (!token) { setOk(false); return; }
      try {
        const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        setOk(Date.now() < p.exp * 1000);
      } catch { setOk(false); }
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);
  if (ok === null) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, backgroundColor: ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', border: `1px solid ${ok ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
      <span style={{ fontSize: 12 }}>{ok ? '✅' : '❌'}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#16a34a' : '#dc2626' }}>{ok ? 'Session active' : 'Session expirée'}</span>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
interface AppAdminStudioProps {
  onLogout?: () => void;
}

export default function AppAdminStudio({ onLogout }: AppAdminStudioProps) {
  const [pageActive, setPageActive]         = useState('dashboard');
  const [sectionOuverte, setSectionOuverte] = useState<string | null>(null);
  const [heureActuelle, setHeureActuelle]   = useState(new Date());
  const [vendeurs, setVendeurs]             = useState<Vendeur[]>([]);
  const [stats, setStats]                   = useState<any>({});
  const [admin, setAdmin]                   = useState<any>(null);

  // Charger vendeurs
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/admin/vendeurs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.vendeurs) setVendeurs(data.vendeurs); })
      .catch(() => {});

    fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});

    try {
      const u = localStorage.getItem('user');
      if (u) setAdmin(JSON.parse(u));
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHeureActuelle(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const naviguerVers = (page: string) => {
    setPageActive(page);
    // Ouvrir la section parente automatiquement
    const parent = NAV_ITEMS.find(n => n.sousSections?.some(s => s.id === page));
    if (parent) setSectionOuverte(parent.id);
  };

  const toggleSection = (id: string) =>
    setSectionOuverte(prev => prev === id ? null : id);

  const pageAppartientA = (itemId: string) =>
    pageActive === itemId || pageActive.startsWith(itemId + '-');

  // ── Routeur ──────────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (pageActive) {
      case 'dashboard':
        return <DashboardStats stats={stats} vendeurs={vendeurs} naviguerVers={naviguerVers} />;

      case 'vendeurs':
      case 'vendeurs-liste':
        return <ListeVendeurs vendeurs={vendeurs} onStatutChange={(id, s) => setVendeurs(prev => prev.map(v => v.id === id ? { ...v, statut: s } : v))} naviguerVers={naviguerVers} />;

      default:
        // Tout le reste → page en construction avec le bon titre
        const item = NAV_ITEMS.find(n => n.id === pageActive);
        const ss = NAV_ITEMS.flatMap(n => n.sousSections || []).find(s => s.id === pageActive);
        const titre = ss?.label || item?.label || pageActive.replace(/-/g, ' ');
        return <PageEnConstruction titre={titre} />;
    }
  };

  // ── SIDEBAR ───────────────────────────────────────────────────────────────
  const sidebar = (
    <div style={{ width: '250px', backgroundColor: THEME.sidebar, height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg,#c9a96e,#e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>e</span>
          <div>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: '800', margin: 0, letterSpacing: '1.5px' }}>VEND STUDIO</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Administration</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: '6px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#c9a96e' }}>Mode Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0 16px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const estOuvert   = sectionOuverte === item.id;
          const sectionActif = pageAppartientA(item.id);

          return (
            <div key={item.id}>
              <div
                onClick={() => item.sousSections ? toggleSection(item.id) : naviguerVers(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px 9px 14px', cursor: 'pointer',
                  borderLeft: sectionActif && !item.sousSections ? '3px solid #c9a96e' : sectionActif ? '3px solid rgba(201,169,110,0.4)' : '3px solid transparent',
                  backgroundColor: sectionActif && !item.sousSections ? THEME.sidebarActive : sectionActif ? 'rgba(138,108,62,0.15)' : 'transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!sectionActif) (e.currentTarget as HTMLElement).style.backgroundColor = THEME.sidebarHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = sectionActif && !item.sousSections ? THEME.sidebarActive : sectionActif ? 'rgba(138,108,62,0.15)' : 'transparent'; }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: sectionActif ? 700 : 500, color: sectionActif ? 'white' : 'rgba(255,255,255,0.65)', flex: 1 }}>{item.label}</span>
                {item.sousSections && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{estOuvert ? '▲' : '▼'}</span>}
              </div>

              {item.sousSections && estOuvert && (
                <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                  {item.sousSections.map(ss => {
                    const actif = pageActive === ss.id;
                    return (
                      <div key={ss.id} onClick={() => naviguerVers(ss.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 36, marginRight: 10, padding: '7px 10px 7px 12px', borderRadius: 7, marginBottom: 2, cursor: 'pointer', backgroundColor: actif ? 'rgba(138,108,62,0.35)' : 'transparent', borderLeft: actif ? '2px solid #c9a96e' : '2px solid rgba(255,255,255,0.1)', transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (!actif) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = actif ? 'rgba(138,108,62,0.35)' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 13, opacity: actif ? 1 : 0.55 }}>{ss.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: actif ? 700 : 400, color: actif ? 'white' : 'rgba(255,255,255,0.5)', flex: 1 }}>{ss.label}</span>
                        {actif && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#c9a96e', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profil admin + déconnexion */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a96e,#8a6c3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
            {admin?.nom?.charAt(0) || 'A'}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>{admin?.nom || 'Administrateur'}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{admin?.email || ''}</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); if (onLogout) onLogout(); else window.location.href = '/login'; }}
          style={{ width: '100%', backgroundColor: 'rgba(220,38,38,0.15)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.15)'; }}
        >
          🚪 Déconnexion
        </button>
      </div>
    </div>
  );

  // ── TOPBAR ────────────────────────────────────────────────────────────────
  const topbar = (
    <div style={{ position: 'fixed', top: 0, left: 250, right: 0, height: 56, backgroundColor: THEME.topbar, borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', paddingLeft: 24, paddingRight: 24, gap: 16, zIndex: 99, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: THEME.textLight, fontWeight: 500 }}>
          {heureActuelle.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          <span style={{ marginLeft: 16, color: '#aaa' }}>{heureActuelle.toLocaleTimeString('fr-CA')}</span>
        </span>
      </div>
      <SessionIndicator />
      <button onClick={() => window.open('/', '_self')} style={{ color: THEME.accent, fontWeight: 700, fontSize: 13, backgroundColor: THEME.accentLight, padding: '6px 14px', borderRadius: 8, border: `1px solid ${THEME.accent}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        🏠 Retour à l'accueil
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: THEME.bg, minHeight: '100vh' }}>
      {sidebar}
      {topbar}
      <div style={{ marginLeft: 250, marginTop: 56, minHeight: 'calc(100vh - 56px)', paddingBottom: 60 }}>
        {renderPage()}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 250, right: 0, backgroundColor: '#e8eaed', borderTop: `1px solid ${THEME.border}`, padding: '8px', textAlign: 'center', fontSize: 12, color: THEME.textLight, zIndex: 99 }}>
        © {new Date().getFullYear()} e-Vend Studio Administration — Accès restreint
      </div>
    </div>
  );
}