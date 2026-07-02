// src/AppAcheteur.tsx
// e-Vend Studio — Dashboard acheteur partagé entre tous les templates marketplace
// Scoped par gestionnaireId : chaque marketplace a ses propres acheteurs
// Token clé : mv_token_${gestionnaireId} / mv_compte_${gestionnaireId}

import { useState, useEffect, useRef } from 'react';
import Panier   from './templates/shared/Panier';
import Checkout from './templates/shared/Checkout';

const API_BASE = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CompteAcheteur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
}

interface Commande {
  id: string;
  numero_commande?: string;
  date_commande: string;
  statut: string;
  total: number;
  articles?: any[];
}

interface Message {
  id: number;
  expediteur_nom: string;
  contenu: string;
  date: string;
  lu: boolean;
  type: 'collaborateur' | 'gestionnaire';
}

interface Notification {
  id: number;
  titre: string;
  message: string;
  date: string;
  lu: boolean;
}

interface Stats {
  commandes_total: number;
  commandes_en_cours: number;
  commandes_livrees: number;
  total_depense: number;
  depenses_30j?: { date: string; montant: number }[];
}

type PageDash =
  | 'dashboard' | 'commandes' | 'panier' | 'checkout' | 'wishlist'
  | 'messagerie' | 'notifications'
  | 'profil' | 'retours';

interface Props {
  vendeurId?: number;
  config?: Record<string, any>;
  naviguerTemplate: (dest: any) => void;
}

// ─── Badge de statut commande ─────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { couleur: string; texte: string }> = {
    en_attente:    { couleur: '#f59e0b', texte: 'En attente' },
    confirmee:     { couleur: '#3b82f6', texte: 'Confirmee' },
    en_cours:      { couleur: '#8b5cf6', texte: 'En cours' },
    expediee:      { couleur: '#06b6d4', texte: 'Expediee' },
    livree:        { couleur: '#10b981', texte: 'Livree' },
    annulee:       { couleur: '#ef4444', texte: 'Annulee' },
  };
  const c = cfg[statut] || { couleur: '#6b7280', texte: statut };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${c.couleur}22`, border: `1px solid ${c.couleur}66`, color: c.couleur }}>
      {c.texte}
    </span>
  );
}

// ─── Page stub générique ──────────────────────────────────────────────────────
function PageStub({ titre, emoji }: { titre: string; emoji: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{titre}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Cette section arrive bientot</p>
    </div>
  );
}

// ─── Indicateur de session (token JWT local) ──────────────────────────────────
function SessionIndicator({ gestionnaireId }: { gestionnaireId: number }) {
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const ref = useRef<any>(null);

  const verifier = () => {
    const token = localStorage.getItem(`mv_token_${gestionnaireId}`);
    if (!token) { setConnecte(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      setConnecte(Date.now() < payload.exp * 1000);
    } catch { setConnecte(false); }
  };

  useEffect(() => {
    verifier();
    ref.current = window.setInterval(verifier, 60000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [gestionnaireId]);

  if (connecte === null) return <span style={{ color: '#aaa', fontSize: 11 }}>...</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: connecte ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${connecte ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
      <span style={{ fontSize: 10 }}>{connecte ? 'Connecte' : 'Session expiree'}</span>
    </div>
  );
}

// ─── Vue Dashboard principal ──────────────────────────────────────────────────
function VueDashboard({
  compte, commandes, messages, notifications, stats, loading, isMobile, naviguer, couleurAccent,
}: {
  compte: CompteAcheteur;
  commandes: Commande[];
  messages: Message[];
  notifications: Notification[];
  stats: Stats | null;
  loading: boolean;
  isMobile: boolean;
  naviguer: (p: PageDash) => void;
  couleurAccent: string;
}) {
  const prenom = compte.prenom || compte.nom || 'Acheteur';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${couleurAccent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Chargement de votre espace...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Commandes', valeur: stats?.commandes_total ?? commandes.length, icon: '📦', couleur: '#3b82f6' },
    { label: 'En cours', valeur: stats?.commandes_en_cours ?? commandes.filter(c => !['livree','annulee'].includes(c.statut)).length, icon: '🚚', couleur: '#8b5cf6' },
    { label: 'Livrees', valeur: stats?.commandes_livrees ?? commandes.filter(c => c.statut === 'livree').length, icon: '✅', couleur: '#10b981' },
    { label: 'Depenses', valeur: `${(stats?.total_depense ?? commandes.reduce((a, c) => a + (c.total || 0), 0)).toFixed(2)} $`, icon: '💳', couleur: couleurAccent },
  ];

  const nonLus = messages.filter(m => !m.lu).length + notifications.filter(n => !n.lu).length;

  return (
    <div>
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, margin: 0 }}>
          Bonjour, {prenom} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>Bienvenue dans votre espace acheteur</p>
      </div>

      {nonLus > 0 && (
        <div
          onClick={() => naviguer('messagerie')}
          style={{ background: `${couleurAccent}15`, border: `1px solid ${couleurAccent}44`, borderRadius: 12, padding: '10px 16px', marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ fontSize: 13, color: couleurAccent, fontWeight: 700 }}>{nonLus} nouveau{nonLus > 1 ? 'x' : ''} message{nonLus > 1 ? 's' : ''} ou notification{nonLus > 1 ? 's' : ''}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: couleurAccent }}>Voir →</span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 20 : 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: isMobile ? '14px 12px' : '18px 20px' }}>
            <div style={{ fontSize: isMobile ? 22 : 28, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: k.couleur }}>{k.valeur}</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Grille bas */}
      <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 18 }}>

        {/* Commandes recentes */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📦 Commandes recentes</h3>
            <button onClick={() => naviguer('commandes')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
          </div>
          {commandes.length === 0 ? (
            <div style={{ padding: '28px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Aucune commande pour le moment</div>
          ) : commandes.slice(0, 4).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{c.numero_commande || `#${c.id}`}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{c.date_commande ? new Date(c.date_commande).toLocaleDateString('fr-CA') : ''}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatutBadge statut={c.statut} />
                <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{(c.total || 0).toFixed(2)} $</p>
              </div>
            </div>
          ))}
        </div>

        {/* Messages recents */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>💬 Messages recents</h3>
            <button onClick={() => naviguer('messagerie')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
          </div>
          {messages.length === 0 ? (
            <div style={{ padding: '28px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Aucun message</div>
          ) : messages.slice(0, 4).map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.type === 'collaborateur' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {m.type === 'collaborateur' ? '🏪' : '🏢'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: m.lu ? 400 : 700, color: m.lu ? 'rgba(255,255,255,0.55)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.expediteur_nom}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m.contenu || '').substring(0, 45)}...</p>
              </div>
              {!m.lu && <div style={{ width: 7, height: 7, borderRadius: '50%', background: couleurAccent, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function AppAcheteur({ vendeurId, config = {}, naviguerTemplate = () => {} }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id || 0;
  const couleurAccent  = config.couleur_accent || '#fbbf24';
  const nomSite        = config.nom_boutique || 'Ma Marketplace';

  const [page,     setPage]     = useState<PageDash>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [heure,    setHeure]    = useState(new Date());

  const [compte,        setCompte]        = useState<CompteAcheteur | null>(null);
  const [checkoutCollabId, setCheckoutCollabId] = useState<number | null>(null);
  const [commandes,     setCommandes]     = useState<Commande[]>([]);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [loading,       setLoading]       = useState(true);

  // Lire compte depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(`mv_compte_${gestionnaireId}`);
    if (saved) {
      try { setCompte(JSON.parse(saved)); } catch {}
    }
  }, [gestionnaireId]);

  // Rediriger si pas de session
  useEffect(() => {
    const token = localStorage.getItem(`mv_token_${gestionnaireId}`);
    if (!token && compte === null) {
      naviguerTemplate({ page: 'login' });
    }
  }, [compte, gestionnaireId]);

  // Charger les donnees
  useEffect(() => {
    if (!compte?.id) return;
    const token = localStorage.getItem(`mv_token_${gestionnaireId}`);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const charger = async () => {
      setLoading(true);
      try {
        const [statsRes, cmdRes, msgRes, notifRes] = await Promise.allSettled([
          fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/${compte.id}/stats`, { headers }),
          fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/${compte.id}/commandes`, { headers }),
          fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/${compte.id}/messages`, { headers }),
          fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/${compte.id}/notifications`, { headers }),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) setStats(await statsRes.value.json());
        if (cmdRes.status === 'fulfilled' && cmdRes.value.ok) setCommandes(await cmdRes.value.json());
        if (msgRes.status === 'fulfilled' && msgRes.value.ok) setMessages(await msgRes.value.json());
        if (notifRes.status === 'fulfilled' && notifRes.value.ok) setNotifications(await notifRes.value.json());
      } catch (err) {
        console.error('Erreur chargement dashboard acheteur:', err);
      } finally {
        setLoading(false);
      }
    };

    charger();
    const interval = setInterval(charger, 60000);
    return () => clearInterval(interval);
  }, [compte?.id, gestionnaireId]);

  // Mobile + horloge
  useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setMenuMobileOuvert(false); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeure(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const naviguer = (dest: PageDash) => {
    setPage(dest);
    if (isMobile) setMenuMobileOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deconnecter = () => {
    localStorage.removeItem(`mv_token_${gestionnaireId}`);
    localStorage.removeItem(`mv_compte_${gestionnaireId}`);
    naviguerTemplate({ page: 'accueil' });
  };

  const nonLusTotal = messages.filter(m => !m.lu).length + notifications.filter(n => !n.lu).length;
  const prenom = compte?.prenom || compte?.nom || 'Acheteur';
  const initiale = prenom.charAt(0).toUpperCase();

  const MENU: { id: PageDash; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard',     label: 'TABLEAU DE BORD', icon: '📊' },
    { id: 'commandes',     label: 'MES COMMANDES',   icon: '📦' },
    { id: 'wishlist',      label: 'LISTE DE SOUHAITS', icon: '❤️' },
    { id: 'messagerie',    label: 'MESSAGERIE',       icon: '💬', badge: nonLusTotal },
    { id: 'notifications', label: 'NOTIFICATIONS',    icon: '🔔', badge: notifications.filter(n => !n.lu).length },
    { id: 'panier',        label: 'MON PANIER',       icon: '🛒' },
    { id: 'retours',       label: 'RETOURS',          icon: '🔄' },
    { id: 'profil',        label: 'MON PROFIL',       icon: '👤' },
  ];

  const renderPage = () => {
    if (page === 'dashboard' && compte)
      return (
        <VueDashboard
          compte={compte} commandes={commandes} messages={messages}
          notifications={notifications} stats={stats} loading={loading}
          isMobile={isMobile} naviguer={naviguer} couleurAccent={couleurAccent}
        />
      );
    if (page === 'commandes')     return <PageStub titre="Mes commandes" emoji="📦" />;
    if (page === 'panier')        return <Panier naviguer={(p: string) => naviguer(p as PageDash)} gestionnaireId={gestionnaireId} config={config} />;
    if (page === 'checkout')       return <Checkout naviguer={(p: string) => naviguer(p as PageDash)} vendeurId={checkoutCollabId ?? undefined} gestionnaireId={gestionnaireId} config={config} />;
    if (page === 'wishlist')       return <PageStub titre="Liste de souhaits" emoji="❤️" />;
    if (page === 'messagerie')    return <PageStub titre="Messagerie" emoji="💬" />;
    if (page === 'notifications') return <PageStub titre="Notifications" emoji="🔔" />;
    if (page === 'retours')       return <PageStub titre="Retours" emoji="🔄" />;
    if (page === 'profil')        return <PageStub titre="Mon profil" emoji="👤" />;
    return null;
  };

  if (!compte) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gradientBG { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatParticle { 0%,100%{transform:translateY(0);opacity:.25} 50%{transform:translateY(-18px);opacity:.5} }
        .da-menu-item { transition:all .2s; border-radius:10px; margin:2px 8px; cursor:pointer; }
        .da-menu-item:hover { background:rgba(255,255,255,0.08); }
        .da-menu-item.active { background:linear-gradient(135deg,#3b82f6,#8b5cf6); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        @media(max-width:768px) {
          .kpi-grid { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
          .bottom-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* Fond */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(135deg,#060d1f,#0a1628,#0d1f3c,#091322)', backgroundSize: '400% 400%', animation: 'gradientBG 8s ease infinite' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 41 + 5) % 95}%`, top: `${(i * 67 + 10) % 90}%`, width: `${4 + (i % 3) * 3}px`, height: `${4 + (i % 3) * 3}px`, borderRadius: '50%', background: i % 2 === 0 ? '#3b82f622' : `${couleurAccent}22`, animation: `floatParticle ${5 + (i % 4)}s ease-in-out ${i * 0.4}s infinite` }} />
        ))}
      </div>

      <div style={{ minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: '#fff', display: 'flex', overflowX: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: isMobile ? (menuMobileOuvert ? 280 : 0) : 280, background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.07)', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflowY: 'hidden', overflowX: 'hidden', zIndex: 1000, transition: 'width 0.3s ease' }}>

          {/* Logo */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${couleurAccent}, ${couleurAccent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#000' }}>
                {(nomSite[0] || 'M').toUpperCase()}
              </div>
              {(!isMobile || menuMobileOuvert) && (
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontFamily: "'Sora',sans-serif", fontWeight: 800, color: '#fff' }}>{nomSite}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Espace acheteur</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {MENU.map(item => (
              <div key={item.id}
                className={`da-menu-item ${page === item.id ? 'active' : ''}`}
                onClick={() => naviguer(item.id)}
                style={{ padding: isMobile ? '9px 12px' : '11px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span style={{ fontSize: isMobile ? 20 : 22, width: 28 }}>{item.icon}</span>
                {(!isMobile || menuMobileOuvert) && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 700, color: page === item.id ? '#fff' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 12 }}>{item.badge}</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Profil + deconnexion */}
          {(!isMobile || menuMobileOuvert) && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                  {initiale}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[compte.prenom, compte.nom].filter(Boolean).join(' ') || 'Acheteur'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{compte.email}</p>
                </div>
              </div>
              <button onClick={deconnecter} style={{ width: '100%', padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                🚪 Deconnexion
              </button>
            </div>
          )}
        </div>

        {/* Overlay mobile */}
        {isMobile && menuMobileOuvert && (
          <div onClick={() => setMenuMobileOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
        )}

        {/* Contenu principal */}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 280, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>

          {/* Top bar */}
          <div style={{ background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: isMobile ? '10px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setMenuMobileOuvert(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>☰</button>
            )}
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {heure.toLocaleDateString('fr-CA', { weekday: isMobile ? undefined : 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <SessionIndicator gestionnaireId={gestionnaireId} />
            <div
              onClick={() => naviguer('notifications')}
              style={{ position: 'relative', cursor: 'pointer', fontSize: 20 }}
            >
              🔔
              {nonLusTotal > 0 && (
                <span style={{ position: 'absolute', top: -6, left: 12, background: '#ef4444', borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 2px' }}>
                  {nonLusTotal > 99 ? '99+' : nonLusTotal}
                </span>
              )}
            </div>
            <button
              onClick={() => naviguerTemplate({ page: 'accueil' })}
              style={{ background: `${couleurAccent}22`, border: `1px solid ${couleurAccent}44`, borderRadius: 8, color: couleurAccent, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '6px 12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              ← {isMobile ? 'Boutique' : 'Retour a la boutique'}
            </button>
            <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
              {heure.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Page content */}
          <main style={{ flex: 1, padding: isMobile ? '16px' : '28px', overflowY: 'auto', overflowX: 'hidden' }}>
            {renderPage()}
          </main>
        </div>
      </div>
    </>
  );
}