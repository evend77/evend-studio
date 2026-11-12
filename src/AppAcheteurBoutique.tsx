// CHEMIN : src/AppAcheteurBoutique.tsx
// e-Vend Studio — Espace acheteur des templates BOUTIQUE (solo : Premium, Simplisse, Mode, Beauté…). Menu court.
// Même contrat que AppAcheteur (MV) : { vendeurId, config, naviguerTemplate }. AppAcheteur reste inchangé pour le multivendeur.
// Compte acheteur = celui du MV (marketplace_acheteurs, jeton mv_token_<gestionnaire>).
// Retour de paiement : ?page=dashboard-acheteur&vue=commande-confirmee&commande=BQ-… (ou vue=panier&paiement=annule).

import { useState, useEffect } from 'react';
import PanierBoutique from './pages/boutique/PanierBoutique';
import CaisseBoutique from './pages/boutique/CaisseBoutique';
import CommandeBoutique from './pages/boutique/CommandeBoutique';
import CommandesBoutique, { statutCommande } from './pages/boutique/CommandesBoutique';
import RetoursBoutique from './pages/boutique/RetoursBoutique';
import { ba } from './pages/boutique/boutiqueAcheteurApi';
import Notifications from './pages/acheteur/Notifications';
import Profil from './pages/acheteur/Profil';
import MessagerieGestionnaire from './pages/acheteur/MessagerieGestionnaire';
import { formaterPrix } from './templates/shared/devise';
import BanniereDashboard from './templates/shared/BanniereDashboard';

const API_BASE = '/api';

interface CompteAcheteur { id: number; prenom: string; nom: string; email: string; telephone?: string; }
type PageDash = 'dashboard' | 'commandes' | 'retours' | 'panier' | 'checkout' | 'confirmation' | 'messagerie' | 'notifications' | 'profil';
interface Props { vendeurId?: number; config?: Record<string, any>; naviguerTemplate: (dest: any) => void; pageInitiale?: 'dashboard' | 'panier'; }

function pageDepuisUrl(): PageDash {
  try {
    const v = new URLSearchParams(window.location.search).get('vue');
    if (v === 'commande-confirmee') return 'confirmation';
    if (v === 'panier') return 'panier';
    if (v === 'checkout') return 'checkout';
  } catch (e) { /* URL indisponible */ }
  return 'dashboard';
}

export default function AppAcheteurBoutique({ vendeurId, config = {}, naviguerTemplate = () => {}, pageInitiale }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id || 0;
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const nomSite = config.nom_boutique || 'Ma Boutique';

  const [page, setPage] = useState<PageDash>(pageInitiale || pageDepuisUrl());
  const [isMobile, setIsMobile] = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [compte, setCompte] = useState<CompteAcheteur | null>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [retourCommande, setRetourCommande] = useState<string | null>(null);
  const [nbPanier, setNbPanier] = useState(0);
  const [nbNotifs, setNbNotifs] = useState(0);
  const [nbMessages, setNbMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { const saved = localStorage.getItem(`mv_compte_${gestionnaireId}`); if (saved) setCompte(JSON.parse(saved)); } catch (e) { /* compte illisible */ }
  }, [gestionnaireId]);

  // Pas de session → page de connexion
  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem(`mv_token_${gestionnaireId}`); } catch (e) { /* stockage indisponible */ }
    if (!token && compte === null) naviguerTemplate({ page: 'login' });
  }, [compte, gestionnaireId]);

  // Session réellement valide ? (cookie) sinon on oublie le compte et on retourne au login
  useEffect(() => {
    if (!compte || !compte.id) return;
    let annule = false;
    fetch(`${API_BASE}/marketplace/${gestionnaireId}/me`, { credentials: 'include' })
      .then(r => {
        if (annule || r.status !== 401) return;
        try { localStorage.removeItem(`mv_compte_${gestionnaireId}`); localStorage.removeItem(`mv_token_${gestionnaireId}`); } catch (e) { /* rien */ }
        naviguerTemplate({ page: 'login' });
      }).catch(() => {});
    return () => { annule = true; };
  }, [compte, gestionnaireId]);

  // Données du tableau de bord (rafraîchies chaque minute)
  useEffect(() => {
    if (!compte || !compte.id) return;
    const charger = async () => {
      const [c, p] = await Promise.all([ba(gestionnaireId, '/commandes'), ba(gestionnaireId, '/panier')]);
      if (c.ok) setCommandes(c.data.commandes);
      if (p.ok) setNbPanier((p.data.articles || []).reduce((s: number, a: any) => s + (a.quantite || 0), 0));
      try {
        const opt = { credentials: 'include' as const };
        const [n, m] = await Promise.all([fetch(`${API_BASE}/acheteur/${gestionnaireId}/notifications`, opt), fetch(`${API_BASE}/acheteur/${gestionnaireId}/support/conversations`, opt)]);
        if (n.ok) setNbNotifs(((await n.json()).notifications || []).filter((x: any) => !x.lu).length);
        if (m.ok) { const l = await m.json(); setNbMessages((Array.isArray(l) ? l : []).reduce((s: number, t: any) => s + (t.non_lus || 0), 0)); }
      } catch (e) { /* messagerie indisponible : on affiche le reste */ }
      setLoading(false);
    };
    charger();
    const t = setInterval(charger, 60000);
    return () => clearInterval(t);
  }, [compte, gestionnaireId, page]);

  useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setMenuMobileOuvert(false); };
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const naviguer = (dest: string) => {
    if (dest === 'boutique' || dest === 'accueil') { naviguerTemplate({ page: dest === 'boutique' ? 'catalogue' : 'accueil' }); return; }
    setPage((dest === 'caisse' ? 'checkout' : dest) as PageDash);
    if (isMobile) setMenuMobileOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deconnecter = () => {
    fetch(`${API_BASE}/marketplace/${gestionnaireId}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    try { localStorage.removeItem(`mv_token_${gestionnaireId}`); localStorage.removeItem(`mv_compte_${gestionnaireId}`); } catch (e) { /* rien */ }
    naviguerTemplate({ page: 'accueil' });
  };

  if (!compte) return null;
  const prenom = compte.prenom || compte.nom || 'Acheteur';
  const payees = commandes.filter(c => c.statut_paiement === 'paye' && c.statut !== 'annulee');
  const MENU: { id: PageDash; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'commandes', label: 'Mes commandes', icon: '📦' },
    { id: 'retours', label: 'Mes retours', icon: '🔄' },
    { id: 'panier', label: 'Mon panier', icon: '🛒', badge: nbPanier },
    { id: 'messagerie', label: 'Messagerie', icon: '💬', badge: nbMessages },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: nbNotifs },
    { id: 'profil', label: 'Mon profil', icon: '👤' },
  ];
  const commun = { gestionnaireId, isMobile, couleurAccent };
  const carte = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 } as const;

  const renderPage = () => {
    if (page === 'dashboard') {
      if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>Chargement de votre espace...</div>;
      const kpis = [
        { label: 'Commandes', valeur: payees.length, icon: '📦', couleur: '#3b82f6' },
        { label: 'En cours', valeur: payees.filter(c => c.statut !== 'livree').length, icon: '🚚', couleur: '#8b5cf6' },
        { label: 'Livrées', valeur: payees.filter(c => c.statut === 'livree').length, icon: '✅', couleur: '#10b981' },
        { label: 'Dépenses', valeur: formaterPrix(payees.reduce((s, c) => s + (Number(c.total) || 0), 0)), icon: '💳', couleur: couleurAccent },
      ];
      return (
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, margin: '0 0 4px' }}>Bonjour, {prenom} 👋</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 24px' }}>Bienvenue dans votre espace client</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
            {kpis.map((k, i) => (
              <div key={i} style={{ ...carte, padding: isMobile ? '14px 12px' : '18px 20px' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: k.couleur }}>{k.valeur}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ ...carte, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>📦 Commandes récentes</h3>
              <button onClick={() => naviguer('commandes')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
            </div>
            {commandes.length === 0 ? <div style={{ padding: 28, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Aucune commande pour le moment</div>
              : commandes.slice(0, 4).map(c => {
                const s = statutCommande(c);
                return (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div><div style={{ fontSize: 12, fontWeight: 700 }}>{c.numero_commande}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{new Date(c.created_at).toLocaleDateString('fr-CA')}</div></div>
                    <div style={{ textAlign: 'right' }}><span style={{ fontSize: 10, fontWeight: 700, color: s.couleur }}>{s.texte}</span><div style={{ fontSize: 12, fontWeight: 600 }}>{formaterPrix(Number(c.total) || 0)}</div></div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    if (page === 'commandes') return <CommandesBoutique {...commun} naviguer={naviguer} demanderRetour={(n: string) => { setRetourCommande(n); naviguer('retours'); }} />;
    if (page === 'retours') return <RetoursBoutique key={retourCommande || 'r'} {...commun} commandeInitiale={retourCommande} />;
    if (page === 'panier') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><PanierBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={naviguer} /></div>;
    if (page === 'checkout') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><CaisseBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={naviguer} /></div>;
    if (page === 'confirmation') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><CommandeBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={(p: string) => { if (p === 'accueil') naviguer('commandes'); else naviguer(p); }} /></div>;
    if (page === 'messagerie') return <MessagerieGestionnaire {...commun} />;
    if (page === 'notifications') return <Notifications {...commun} />;
    if (page === 'profil') return <Profil {...commun} onProfilMaj={(p: any) => setCompte(c => (c ? { ...c, ...p } : c))} />;
    return null;
  };

  const actif: PageDash = page === 'checkout' || page === 'confirmation' ? 'panier' : page;
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .ab-menu-item { transition: all .2s; border-radius: 10px; margin: 2px 8px; cursor: pointer; }
        .ab-menu-item:hover { background: rgba(255,255,255,0.08); }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(135deg,#060d1f,#0a1628,#0d1f3c,#091322)' }} />
      <div style={{ minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: '#fff', display: 'flex', overflowX: 'hidden' }}>
        <div style={{ width: isMobile ? (menuMobileOuvert ? 260 : 0) : 260, background: 'rgba(6,13,31,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'width .3s' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: 0, fontSize: 16, fontFamily: "'Sora',sans-serif", fontWeight: 800 }}>{nomSite}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Espace client</p>
          </div>
          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {MENU.map(item => (
              <div key={item.id} className="ab-menu-item" onClick={() => naviguer(item.id)} style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, background: actif === item.id ? `linear-gradient(135deg,${couleurAccent}55,${couleurAccent}22)` : undefined }}>
                <span style={{ fontSize: 20, width: 26 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: actif === item.id ? '#fff' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{item.label}</span>
                {!!item.badge && item.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 12 }}>{item.badge}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[compte.prenom, compte.nom].filter(Boolean).join(' ') || 'Client'}</p>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{compte.email}</p>
            <button onClick={deconnecter} style={{ width: '100%', padding: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>🚪 Déconnexion</button>
          </div>
        </div>
        {isMobile && menuMobileOuvert && <div onClick={() => setMenuMobileOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 260, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
          <div style={{ background: 'rgba(6,13,31,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: isMobile ? '10px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && <button onClick={() => setMenuMobileOuvert(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>☰</button>}
            <span style={{ flex: 1 }} />
            <button onClick={() => naviguerTemplate({ page: 'accueil' })} style={{ background: `${couleurAccent}22`, border: `1px solid ${couleurAccent}44`, borderRadius: 8, color: couleurAccent, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 12px' }}>← {isMobile ? 'Boutique' : 'Retour à la boutique'}</button>
          </div>
          <BanniereDashboard config={config} type="acheteur" />
          <main style={{ flex: 1, padding: isMobile ? 16 : 28, minWidth: 0 }}>{renderPage()}</main>
        </div>
      </div>
    </>
  );
}