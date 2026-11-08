// CHEMIN : src/AppCollaborateur.tsx
// e-Vend Studio — Dashboard collaborateur (vendeur inscrit sur la marketplace d'un gestionnaire)
// Adapte depuis AppVendeur.tsx — token scope par gestionnaireId
// Session : cookie httpOnly mv_token_<id> (illisible côté navigateur) ; infos d'affichage : mv_compte_<id>

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CollaborateurStripe from './pages/collaborateur/CollaborateurStripe';
import MessagerieGestionnaire from './pages/collaborateur/MessagerieGestionnaire';
import MessagerieAcheteurs from './pages/collaborateur/MessagerieAcheteurs';
import CollaborateurProduits from './pages/collaborateur/CollaborateurProduits';
import CollaborateurCreerAnnonce from './pages/collaborateur/CollaborateurCreerAnnonce';
import CollaborateurReductions from './pages/collaborateur/CollaborateurReductions';
import CollaborateurCommandes from './pages/collaborateur/CollaborateurCommandes';
import CollaborateurPaiements from './pages/collaborateur/CollaborateurPaiements';
import CollaborateurRetours from './pages/collaborateur/CollaborateurRetours';
import CollaborateurCompte from './pages/collaborateur/CollaborateurCompte';
import CollaborateurBoutique from './pages/collaborateur/CollaborateurBoutique';
import CollaborateurAvis from './pages/collaborateur/CollaborateurAvis';
import CollaborateurConfiguration from './pages/collaborateur/CollaborateurConfiguration';
import CollaborateurMethodesExpedition from './pages/collaborateur/CollaborateurMethodesExpedition';
import CollaborateurBlogs from './pages/collaborateur/CollaborateurBlogs';
import CollaborateurFaq from './pages/collaborateur/CollaborateurFaq';
import CollaborateurRapportFinancier from './pages/collaborateur/CollaborateurRapportFinancier';
import CollaborateurCommandeDetail from './pages/collaborateur/CollaborateurCommandeDetail';
import CollaborateurEtiquettes from './pages/collaborateur/CollaborateurEtiquettes';
import BanniereDashboard from './templates/shared/BanniereDashboard';
import { formaterPrix } from './templates/shared/devise';

const API_BASE = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CompteCollaborateur {
  id: number;
  email: string;
  nom_responsable: string;
  nom_boutique: string;
  statut: string;
  type_entreprise?: string;
}

interface StatsCollaborateur {
  revenus: { total: number; mois: number; aujourdhui: number };
  commandes: { total: number; en_attente: number; expediees: number; livrees: number };
  produits: { total: number; actifs: number; en_rupture: number };
  avis: { moyenne: number; total: number };
  graphiques: { ventes30j: { date: string; ventes: number }[] };
}

interface Props {
  vendeurId?: number;
  config?: Record<string, any>;
  naviguerTemplate?: (dest: any) => void;
}

// ─── Tooltip session ──────────────────────────────────────────────────────────
function SessionIndicator({ gestionnaireId }: { gestionnaireId: number }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const ref = useRef<any>(null);
  // Le jeton est dans un cookie httpOnly (illisible ici) : on demande au serveur si la session est valide.
  const verifier = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/me`, { credentials: 'include' });
      setOk(res.ok);
    } catch { /* réseau indisponible : on garde l'état précédent */ }
  };
  useEffect(() => {
    verifier();
    ref.current = setInterval(verifier, 60000);
    return () => clearInterval(ref.current);
  }, [gestionnaireId]);
  if (ok === null) return null;
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: ok ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: ok ? '#4ade80' : '#f87171', border: `1px solid ${ok ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, fontWeight: 600 }}>
      {ok ? 'Connecte' : 'Session expiree'}
    </span>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function CarteKPI({ emoji, titre, valeur, sousTitre, couleur }: { emoji: string; titre: string; valeur: string; sousTitre: string; couleur: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
        <span style={{ color: '#666', fontSize: 13 }}>{titre}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: couleur, marginBottom: 4 }}>{valeur}</div>
      <div style={{ fontSize: 12, color: '#999' }}>{sousTitre}</div>
    </div>
  );
}

// ─── Page stub ────────────────────────────────────────────────────────────────
function PageStub({ titre, emoji }: { titre: string; emoji: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#333' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{titre}</h2>
      <p style={{ color: '#999', fontSize: 14 }}>Cette section arrive bientot</p>
    </div>
  );
}

// ─── Dashboard vue principale ─────────────────────────────────────────────────
function VueDashboard({ compte, stats, loading, isMobile, naviguer, accent }: {
  compte: CompteCollaborateur;
  stats: StatsCollaborateur | null;
  loading: boolean;
  isMobile: boolean;
  naviguer: (p: string) => void;
  accent: string;
}) {
  const prenom = compte.nom_responsable?.split(' ')[0] || 'Collaborateur';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#999' }}>Chargement de votre espace...</p>
      </div>
    );
  }

  const kpis = [
    { emoji: '💰', titre: 'Revenus ce mois', valeur: `${formaterPrix((stats?.revenus?.mois ?? 0))}`, sousTitre: `Total: ${formaterPrix((stats?.revenus?.total ?? 0))}`, couleur: '#008060' },
    { emoji: '🛒', titre: 'Commandes', valeur: String(stats?.commandes?.total ?? 0), sousTitre: `${stats?.commandes?.en_attente ?? 0} en attente`, couleur: '#3b82f6' },
    { emoji: '📦', titre: 'Produits actifs', valeur: String(stats?.produits?.actifs ?? 0), sousTitre: `${stats?.produits?.en_rupture ?? 0} en rupture`, couleur: '#f59e0b' },
    { emoji: '⭐', titre: 'Note moyenne', valeur: (stats?.avis?.moyenne ?? 0).toFixed(1), sousTitre: `${stats?.avis?.total ?? 0} avis`, couleur: '#8b5cf6' },
  ];

  const graphData = stats?.graphiques?.ventes30j || [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? 16 : 24, color: '#333' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: 0 }}>Bonjour, {prenom} 👋</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Votre espace collaborateur — {compte.nom_boutique}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <CarteKPI key={i} {...k} />)}
      </div>

      {/* Graphique ventes */}
      <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Ventes — 30 derniers jours</h3>
        </div>
        {graphData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={graphData}>
              <defs>
                <linearGradient id="colVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#aaa" fontSize={11} />
              <YAxis stroke="#aaa" fontSize={11} tickFormatter={v => `${v}$`} />
              <Tooltip formatter={(v: any) => `${formaterPrix(Number(v))}`} />
              <Area type="monotone" dataKey="ventes" stroke={accent} strokeWidth={2} fill="url(#colVentes)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14 }}>
            Aucune vente pour le moment
          </div>
        )}
      </div>

      {/* Grille bas */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Commandes recentes */}
        <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📦 Commandes recentes</h3>
            <button onClick={() => naviguer('commandes-liste')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
          </div>
          <div style={{ padding: '14px 18px', color: '#999', fontSize: 13, textAlign: 'center' }}>
            {stats?.commandes?.total === 0 ? 'Aucune commande pour le moment' : `${stats?.commandes?.en_attente ?? 0} commande(s) en attente`}
          </div>
        </div>

        {/* Stats avis */}
        <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>⭐ Avis clients</h3>
          </div>
          <div style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#f59e0b' }}>{(stats?.avis?.moyenne ?? 0).toFixed(1)}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>sur {stats?.avis?.total ?? 0} avis</div>
            <button onClick={() => naviguer('profil-avis')} style={{ marginTop: 12, background: 'none', border: '1px solid #e1e4e8', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#555' }}>
              Voir mes avis →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function AppCollaborateur({ vendeurId, config = {}, naviguerTemplate = () => {} }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id || 0;
  const accent = config.couleur_accent || '#3b82f6';
  const nomSite = config.nom_boutique || 'Ma Marketplace';

  // Retour de Stripe (?stripe=success|refresh) : on ouvre directement la page Paiements Stripe.
  const retourStripe = typeof window !== 'undefined' && !!new URLSearchParams(window.location.search).get('stripe');

  const [pageActive, setPageActive]   = useState(retourStripe ? 'config-stripe' : 'dashboard');
  const [isMobile,   setIsMobile]     = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [menuOuvert, setMenuOuvert]   = useState<string | null>(retourStripe ? 'configuration' : null);
  const [heure,      setHeure]        = useState(new Date());
  const [nonLus,     setNonLus]       = useState({ acheteurs: 0, gestionnaire: 0, total: 0 });
  const [avisAttente, setAvisAttente] = useState(0);   // avis qui attendent mon approbation
  const [addonsMV, setAddonsMV] = useState<Record<string, boolean>>({});   // add-ons du gestionnaire (blog, FAQ, chat)
  useEffect(() => {
    if (!gestionnaireId) return;
    fetch(`${API_BASE}/studio-forfaits/public/${gestionnaireId}/addons?t=${Date.now()}`).then(r => r.json()).then(d => setAddonsMV(d || {})).catch(() => setAddonsMV({}));
  }, [gestionnaireId, pageActive]);
  const [produitEnEdition, setProduitEnEdition] = useState<number | null>(null);
  const [commandeOuverte, setCommandeOuverte] = useState<number | null>(null);

  // Infos d'affichage du compte (le vrai jeton est dans le cookie httpOnly).
  const [compte]   = useState<CompteCollaborateur | null>(() => {
    try {
      const saved = localStorage.getItem(`mv_compte_${vendeurId || config.gestionnaire_id || 0}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [stats,  setStats]    = useState<StatsCollaborateur | null>(null);
  const [loading, setLoading] = useState(true);

  // Le cookie httpOnly est envoyé automatiquement (credentials: 'include') : aucun jeton à joindre.
  const getHeaders = () => ({ 'Content-Type': 'application/json' });

  // Rediriger si pas connecte
  useEffect(() => {
    if (compte === null) naviguerTemplate({ page: 'login' });
  }, [compte, gestionnaireId]);

  // Vérifie que la session (cookie) est réellement valide ; sinon on oublie le compte local et on retourne au login.
  useEffect(() => {
    if (!compte?.id) return;
    let annule = false;
    fetch(`${API_BASE}/marketplace/${gestionnaireId}/me`, { credentials: 'include' })
      .then(r => {
        if (annule || r.status !== 401) return;
        try { localStorage.removeItem(`mv_compte_${gestionnaireId}`); localStorage.removeItem(`mv_token_${gestionnaireId}`); } catch {}
        naviguerTemplate({ page: 'login' });
      })
      .catch(() => {});
    return () => { annule = true; };
  }, [compte?.id, gestionnaireId]);

  // Charger stats
  useEffect(() => {
    if (!compte?.id) return;
    const charger = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/collaborateurs/${compte.id}/stats`, { credentials: 'include', headers: getHeaders() });
        if (res.ok) setStats(await res.json());
      } catch {}
      setLoading(false);
    };
    charger();
    const t = setInterval(charger, 60000);
    return () => clearInterval(t);
  }, [compte?.id, gestionnaireId]);

  // Charger non-lus messagerie (gestionnaire + acheteurs)
  const chargerNonLus = useCallback(async () => {
    if (!compte?.id) return;
    try {
      const [rg, ra] = await Promise.all([
        fetch(`${API_BASE}/chat-admin-collab/${gestionnaireId}/collab/non-lus`, { credentials: 'include' }),
        fetch(`${API_BASE}/chat-acheteur-collab/${gestionnaireId}/collab/non-lus`, { credentials: 'include' }),
      ]);
      const g = rg.ok ? Number((await rg.json()).total) || 0 : 0;
      const a = ra.ok ? Number((await ra.json()).total) || 0 : 0;
      setNonLus({ acheteurs: a, gestionnaire: g, total: a + g });
    } catch {}
  }, [compte?.id, gestionnaireId]);

  // Avis à approuver (mode « je les approuve moi-même ») : pastille sur Mes avis clients
  const chargerAvisAttente = useCallback(async () => {
    if (!compte?.id) return;
    try {
      const r = await fetch(`${API_BASE}/collab/${gestionnaireId}/avis/compte`, { credentials: 'include' });
      if (r.ok) setAvisAttente(Number((await r.json()).attente) || 0);
    } catch {}
  }, [compte?.id, gestionnaireId]);
  useEffect(() => {
    chargerAvisAttente();
    const iv = setInterval(chargerAvisAttente, 60000);
    window.addEventListener('avis-collab-maj', chargerAvisAttente);
    return () => { clearInterval(iv); window.removeEventListener('avis-collab-maj', chargerAvisAttente); };
  }, [chargerAvisAttente]);

  useEffect(() => {
    chargerNonLus();
    const t = setInterval(chargerNonLus, 30000);
    return () => clearInterval(t);
  }, [chargerNonLus]);

  // Mobile + horloge
  useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setMenuMobileOuvert(false); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  useEffect(() => { const t = setInterval(() => setHeure(new Date()), 1000); return () => clearInterval(t); }, []);

  const naviguer = (page: string) => {
    setPageActive(page);
    if (page === 'creer') setProduitEnEdition(null); // « Créer une annonce » = toujours une annonce neuve
    if (isMobile) setMenuMobileOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deconnecter = () => {
    fetch(`${API_BASE}/marketplace/${gestionnaireId}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    localStorage.removeItem(`mv_token_${gestionnaireId}`);
    localStorage.removeItem(`mv_compte_${gestionnaireId}`);
    naviguerTemplate({ page: 'accueil' });
  };

  const initiale = (compte?.nom_boutique || compte?.nom_responsable || 'C').charAt(0).toUpperCase();

  const menuItems = [
    { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
    {
      id: 'annonces', label: 'VOS ANNONCES', icon: '📦',
      sousMenu: [
        { id: 'annonces-liste',   label: 'Liste des produits', icon: '📋' },
        { id: 'creer',            label: 'Creer une annonce',  icon: '➕' },
        { id: 'annonces-promos',  label: 'Reductions & codes', icon: '🏷️' },
      ]
    },
    {
      id: 'commandes', label: 'VOS COMMANDES', icon: '🛒',
      sousMenu: [
        { id: 'commandes-liste',     label: 'Liste des commandes', icon: '📋' },
        { id: 'commandes-paiements', label: 'Paiements',           icon: '💰' },
        { id: 'commandes-retours',   label: 'Retours',             icon: '🔄' },
      ]
    },
    ...(addonsMV.chat_collab ? [{
      id: 'messagerie', label: 'MESSAGERIE', icon: '💬', badge: nonLus.total > 0 ? nonLus.total : undefined,
      sousMenu: [
        { id: 'messagerie-acheteurs',    label: 'Messages acheteurs',  icon: '🛒', badge: nonLus.acheteurs > 0 ? nonLus.acheteurs : undefined },
        { id: 'messagerie-gestionnaire', label: 'Message gestionnaire', icon: '🏢', badge: nonLus.gestionnaire > 0 ? nonLus.gestionnaire : undefined },
      ]
    }] : []),
    {
      id: 'profil', label: 'MON PROFIL', icon: '👤', badge: avisAttente > 0 ? avisAttente : undefined,
      sousMenu: [
        { id: 'profil-compte',  label: 'Mon compte',        icon: '👤' },
        { id: 'profil-boutique',label: 'Ma boutique',       icon: '🏪' },
        { id: 'profil-avis',    label: 'Mes avis clients',  icon: '⭐', badge: avisAttente > 0 ? avisAttente : undefined },
        ...(addonsMV.blog_collab ? [{ id: 'profil-blogs',   label: 'Mes blogs',         icon: '📝' }] : []),
        ...(addonsMV.faq_collab ? [{ id: 'profil-faq',     label: 'Ma FAQ',            icon: '❓' }] : []),
        { id: 'profil-rapport', label: 'Rapport financier', icon: '📈' },
      ]
    },
    {
      id: 'configuration', label: 'CONFIGURATION', icon: '⚙️',
      sousMenu: [
        { id: 'config-generale', label: 'Configuration generale', icon: '⚙️' },
        { id: 'config-stripe',   label: 'Paiements Stripe',       icon: '💳' },
        { id: 'config-expedition', label: "Méthodes d'expédition", icon: '🚚' },
        ...(addonsMV.etiquette_shippo || addonsMV.etiquette_easypost ? [{ id: 'config-etiquettes', label: "Étiquettes d'expédition", icon: '🏷️' }] : []),
      ]
    },
  ];

  const renderPage = () => {
    if (pageActive === 'dashboard' && compte)
      return <VueDashboard compte={compte} stats={stats} loading={loading} isMobile={isMobile} naviguer={naviguer} accent={accent} />;
    if (!compte) return null;
    const commun = { gestionnaireId, accent, isMobile };
    if (pageActive === 'creer')
      return <CollaborateurCreerAnnonce {...commun} produitId={produitEnEdition} onRetour={() => { setProduitEnEdition(null); naviguer('annonces-liste'); }} />;
    if (pageActive === 'annonces-liste')
      return <CollaborateurProduits {...commun} onCreer={() => naviguer('creer')} onModifier={(id: number) => { naviguer('creer'); setProduitEnEdition(id); }} />;
    if (pageActive === 'annonces-promos')   return <CollaborateurReductions {...commun} />;
    if (pageActive === 'commande-detail' && commandeOuverte)
      return <CollaborateurCommandeDetail {...commun} commandeId={commandeOuverte} naviguer={naviguer} etiquettes={!!(addonsMV.etiquette_shippo || addonsMV.etiquette_easypost)} onRetour={() => naviguer('commandes-liste')} />;
    if (pageActive === 'commandes-liste')   return <CollaborateurCommandes {...commun} naviguer={naviguer} onDetail={(id: number) => { setCommandeOuverte(id); naviguer('commande-detail'); }} />;
    if (pageActive === 'commandes-paiements') return <CollaborateurPaiements {...commun} naviguer={naviguer} />;
    if (pageActive === 'commandes-retours') return <CollaborateurRetours {...commun} />;
    if (pageActive === 'messagerie-acheteurs')
      return <MessagerieAcheteurs gestionnaireId={gestionnaireId} accent={accent} isMobile={isMobile} onActivite={chargerNonLus} />;
    if (pageActive === 'messagerie-gestionnaire')
      return <MessagerieGestionnaire gestionnaireId={gestionnaireId} accent={accent} isMobile={isMobile} onActivite={chargerNonLus} />;
    if (pageActive === 'profil-compte')     return <CollaborateurCompte {...commun} />;
    if (pageActive === 'profil-boutique')   return <CollaborateurBoutique {...commun} />;
    if (pageActive === 'profil-avis')       return <CollaborateurAvis {...commun} />;
    if (pageActive === 'profil-blogs')      return <CollaborateurBlogs {...commun} />;
    if (pageActive === 'profil-faq')        return <CollaborateurFaq {...commun} />;
    if (pageActive === 'profil-rapport')    return <CollaborateurRapportFinancier {...commun} nomVendeur={compte.nom_boutique} />;
    if (pageActive === 'config-stripe')
      return <CollaborateurStripe gestionnaireId={gestionnaireId} collaborateurId={compte.id} accent={accent} isMobile={isMobile} />;
    if (pageActive === 'config-generale')   return <CollaborateurConfiguration {...commun} naviguer={naviguer} />;
    if (pageActive === 'config-expedition') return <CollaborateurMethodesExpedition {...commun} />;
    if (pageActive === 'config-etiquettes') return <CollaborateurEtiquettes {...commun} naviguer={naviguer} />;
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
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .ac-menu-item { transition: all .2s; border-radius: 8px; margin: 2px 10px; cursor: pointer; color: rgba(255,255,255,0.9); }
        .ac-menu-item:hover { background: rgba(59,130,246,0.25); }
        .ac-menu-item.active { background: linear-gradient(135deg,#2563eb,#1e40af); box-shadow: 0 4px 10px rgba(37,99,235,0.3); }
        .ac-sous-item { transition: all .2s; border-radius: 6px; color: rgba(255,255,255,0.8); cursor: pointer; }
        .ac-sous-item:hover { background: rgba(59,130,246,0.2); }
        .ac-sous-item.active { background: rgba(37,99,235,0.35); border-left: 3px solid #60a5fa; }
        .ac-menu-header { padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 14px; border-radius: 8px; margin: 2px 10px; transition: all .2s; }
        .ac-menu-header:hover { background: rgba(59,130,246,0.25); }
        .ac-menu-header.open { background: rgba(37,99,235,0.2); border-left: 3px solid #3b82f6; }
        .ac-mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", display: 'flex', overflow: 'hidden', background: '#f4f6f8' }}>

        {/* SIDEBAR */}
        <div style={{ width: isMobile ? (menuMobileOuvert ? 280 : 0) : 280, background: 'linear-gradient(180deg,#0a1a3a,#0e2a4a)', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'fixed', left: 0, top: 0, bottom: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', zIndex: 1000, transition: 'width 0.3s ease' }}>

          {/* Logo */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg,${accent},${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(nomSite[0] || 'M').toUpperCase()}
              </div>
              {(!isMobile || menuMobileOuvert) && (
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontFamily: "'Sora',sans-serif", fontWeight: 800, color: '#fff' }}>{nomSite}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Espace collaborateur</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <div style={{ flex: 1, paddingTop: 8 }}>
            {menuItems.map(item => (
              <div key={item.id}>
                {!item.sousMenu ? (
                  <div
                    className={`ac-menu-item ${pageActive === item.id ? 'active' : ''}`}
                    onClick={() => naviguer(item.id)}
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <span style={{ fontSize: 20, width: 26 }}>{item.icon}</span>
                    {(!isMobile || menuMobileOuvert) && (
                      <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{item.label}</span>
                    )}
                  </div>
                ) : (
                  (!isMobile || menuMobileOuvert) && (
                    <>
                      <div
                        className={`ac-menu-header ${menuOuvert === item.id ? 'open' : ''}`}
                        onClick={() => setMenuOuvert(menuOuvert === item.id ? null : item.id)}
                      >
                        <span style={{ fontSize: 20, width: 26 }}>{item.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, color: 'rgba(255,255,255,0.85)' }}>{item.label}</span>
                        {item.badge && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{item.badge}</span>}
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', transform: menuOuvert === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                      {menuOuvert === item.id && (
                        <div style={{ paddingBottom: 4 }}>
                          {item.sousMenu.map((sub: any) => (
                            <div
                              key={sub.id}
                              className={`ac-sous-item ${pageActive === sub.id ? 'active' : ''}`}
                              onClick={() => naviguer(sub.id)}
                              style={{ padding: '7px 12px', marginLeft: 36, marginRight: 10, marginBottom: 1, display: 'flex', alignItems: 'center', gap: 10 }}
                            >
                              <span style={{ fontSize: 17, width: 22 }}>{sub.icon}</span>
                              <span style={{ fontSize: 13, flex: 1 }}>{sub.label}</span>
                              {sub.badge && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{sub.badge}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            ))}
          </div>

          {/* Profil + deconnexion */}
          {(!isMobile || menuMobileOuvert) && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${accent},#1e40af)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initiale}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{compte.nom_boutique}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{compte.email}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>id: {compte.id}</p>
                </div>
              </div>
              <button onClick={deconnecter} style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                🚪 Deconnexion
              </button>
            </div>
          )}
        </div>

        {/* Overlay mobile */}
        {isMobile && menuMobileOuvert && <div className="ac-mobile-overlay" onClick={() => setMenuMobileOuvert(false)} />}

        {/* CONTENU PRINCIPAL */}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 280, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>

          {/* TOP BAR */}
          <div style={{ position: 'sticky', top: 0, zIndex: 900, background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', padding: isMobile ? '0 12px' : '0 24px', gap: 12, flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setMenuMobileOuvert(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>☰</button>
            )}
            {!isMobile && <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{nomSite}</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18 }}>
              {!isMobile && <span style={{ color: '#aaa', fontSize: 12 }}>{heure.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
              <span style={{ color: '#ccc', fontSize: 12, fontWeight: 600 }}>{heure.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
              <SessionIndicator gestionnaireId={gestionnaireId} />
              {addonsMV.chat_collab && <div onClick={() => naviguer('messagerie-acheteurs')} style={{ position: 'relative', cursor: 'pointer', fontSize: 20, color: '#fff' }}>
                💬
                {nonLus.total > 0 && (
                  <span style={{ position: 'absolute', top: -6, left: 12, background: '#ef4444', borderRadius: '50%', minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 2px' }}>
                    {nonLus.total > 99 ? '99+' : nonLus.total}
                  </span>
                )}
              </div>}
              <button
                onClick={() => naviguerTemplate({ page: 'accueil' })}
                style={{ background: `${accent}22`, border: `1px solid ${accent}55`, borderRadius: 8, color: accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '5px 11px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                ← {isMobile ? 'Boutique' : 'Retour a la boutique'}
              </button>
            </div>
          </div>

          {/* Bannière du gestionnaire (Config marketplace) */}
          <BanniereDashboard config={config} type="collab" />

          {/* PAGE */}
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {renderPage()}
          </main>

          {/* FOOTER */}
          <div style={{ background: '#2c3e50', borderTop: '1px solid #34495e', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#aaa', flexShrink: 0 }}>
            © {new Date().getFullYear()} {nomSite} — Espace Collaborateur
          </div>
        </div>
      </div>
    </>
  );
}