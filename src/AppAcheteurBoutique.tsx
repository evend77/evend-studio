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
import MesOffresBoutique from './pages/boutique/MesOffresBoutique';
import MesEncheresBoutique from './pages/boutique/MesEncheresBoutique';
import { ba } from './pages/boutique/boutiqueAcheteurApi';
import WishlistBoutique from './pages/boutique/WishlistBoutique';   // add-on « Favoris » : page « Liste de souhaits »
import MesAvisBoutique from './pages/boutique/MesAvisBoutique';   // add-on « Avis clients » : page « Mes avis »
import { synchroniserInvite } from './components/BoutiqueFavoris';
import Notifications from './pages/acheteur/Notifications';
import ProfilBoutique from './pages/boutique/ProfilBoutique';
import MessagerieGestionnaire from './pages/acheteur/MessagerieGestionnaire';
import { formaterPrix } from './templates/shared/devise';
import BanniereDashboard from './templates/shared/BanniereDashboard';

const API_BASE = '/api';

interface CompteAcheteur { id: number; prenom: string; nom: string; email: string; telephone?: string; }
type PageDash = 'dashboard' | 'wishlist' | 'avis' | 'commandes' | 'retours' | 'offres' | 'encheres' | 'panier' | 'checkout' | 'confirmation' | 'messagerie' | 'notifications' | 'profil';
interface Props { vendeurId?: number; config?: Record<string, any>; naviguerTemplate: (dest: any) => void; pageInitiale?: 'dashboard' | 'panier' | 'wishlist' | 'avis'; }

// Notifications d'enchères (écrites par services/boutique_encheres.js) montrées dans le bandeau orange du haut de l'espace client
const TYPES_BANDEAU_ENCHERE = ['enchere_surpasse', 'enchere_gagnee', 'enchere_perdue', 'enchere_annulee', 'enchere_expiree', 'enchere_rappel'];

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
  const [notifsEnchere, setNotifsEnchere] = useState<{ id: number; titre: string; message: string; type: string; date: string }[]>([]);   // bandeau orange : notifications d'enchères non lues
  const [offresActif, setOffresActif] = useState(false);   // add-on « Faire une offre » activé
  const [favorisActif, setFavorisActif] = useState(false);   // add-on « Favoris » activé : menu « Liste de souhaits »
  const [avisActif, setAvisActif] = useState(false);   // add-on « Avis clients » activé : menu « Mes avis »
  const [encheresActif, setEncheresActif] = useState(false);   // add-on « Enchères » activé, ou l'acheteur a déjà des enchères
  const [nbEncheres, setNbEncheres] = useState(0);              // enchères gagnées à payer
  const [nbOffres, setNbOffres] = useState(0);              // offres qui attendent une action de l'acheteur
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

  // Add-on « Favoris » : les produits ajoutés en visiteur sont enregistrés dans le compte (rien à faire si la liste temporaire est vide)
  useEffect(() => { if (compte && compte.id) synchroniserInvite(gestionnaireId).catch(() => { /* réessayé à la prochaine visite */ }); }, [compte, gestionnaireId]);

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
      try {   // add-on « Faire une offre » : menu « Mes offres » seulement s'il est activé
        const ad = await fetch(`${API_BASE}/boutique/catalogue/${gestionnaireId}/addons`);
        const adds = ad.ok ? ((await ad.json()).addons || {}) : {};
        setFavorisActif(!!adds.favoris);
        setAvisActif(!!adds.avis_clients);
        const actif = !!adds.faire_une_offre;
        setOffresActif(actif);
        if (actif) { const o = await ba(gestionnaireId, '/negociations/mes'); if (o.ok) setNbOffres(o.data.a_repondre || 0); }
        const addonEnch = !!adds.encheres;
        const en = await ba(gestionnaireId, '/encheres/mes');
        setEncheresActif(addonEnch || (en.ok && (en.data.encheres || []).length > 0));
        if (en.ok) setNbEncheres(en.data.a_payer || 0);
      } catch (e) { /* add-ons indisponibles : on affiche le reste */ }
      try {
        const opt = { credentials: 'include' as const };
        const [n, m] = await Promise.all([fetch(`${API_BASE}/acheteur/${gestionnaireId}/notifications`, opt), fetch(`${API_BASE}/acheteur/${gestionnaireId}/support/conversations`, opt)]);
        if (n.ok) {
          const nl: any[] = (await n.json()).notifications || [];
          setNbNotifs(nl.filter((x: any) => !x.lu).length);
          setNotifsEnchere(nl.filter((x: any) => !x.lu && TYPES_BANDEAU_ENCHERE.includes(x.type)).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
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
    // Depuis le panier : ouvrir la fiche d'une annonce, ou lire la politique de retour (le template les ouvre lui-même)
    if (dest.startsWith('produit:')) { naviguerTemplate({ page: 'produit', produitId: Number(dest.slice(8)) }); return; }
    if (dest === 'retour-remboursement' || dest === 'conditions-service' || dest === 'confidentialite') { naviguerTemplate({ page: dest }); return; }
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
    ...(favorisActif ? [{ id: 'wishlist' as PageDash, label: 'Liste de souhaits', icon: '❤️' }] : []),
    ...(avisActif ? [{ id: 'avis' as PageDash, label: 'Mes avis', icon: '⭐' }] : []),
    { id: 'retours', label: 'Mes retours', icon: '🔄' },
    ...(offresActif ? [{ id: 'offres' as PageDash, label: 'Mes offres', icon: '🤝', badge: nbOffres }] : []),
    ...(encheresActif ? [{ id: 'encheres' as PageDash, label: 'Mes enchères', icon: '🔨', badge: nbEncheres }] : []),
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
    if (page === 'wishlist') return <WishlistBoutique {...commun} naviguer={naviguer} />;
    if (page === 'avis') return <MesAvisBoutique {...commun} naviguer={naviguer} />;
    if (page === 'commandes') return <CommandesBoutique {...commun} naviguer={naviguer} demanderRetour={(n: string) => { setRetourCommande(n); naviguer('retours'); }} />;
    if (page === 'retours') return <RetoursBoutique key={retourCommande || 'r'} {...commun} commandeInitiale={retourCommande} />;
    if (page === 'encheres') return <MesEncheresBoutique {...commun} naviguer={naviguer} onChange={() => { ba(gestionnaireId, '/encheres/mes').then(o => { if (o.ok) setNbEncheres(o.data.a_payer || 0); }); }} />;
    if (page === 'offres') return <MesOffresBoutique {...commun} naviguer={naviguer} onChange={() => { ba(gestionnaireId, '/negociations/mes').then(o => { if (o.ok) setNbOffres(o.data.a_repondre || 0); }); }} />;
    if (page === 'panier') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><PanierBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={naviguer} /></div>;
    if (page === 'checkout') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><CaisseBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={naviguer} /></div>;
    if (page === 'confirmation') return <div style={{ background: '#fff', color: '#111', borderRadius: 16 }}><CommandeBoutique gestionnaireId={gestionnaireId} accent={couleurAccent === '#fbbf24' ? '#111827' : couleurAccent} naviguerVers={(p: string) => { if (p === 'accueil') naviguer('commandes'); else naviguer(p); }} /></div>;
    if (page === 'messagerie') return <MessagerieGestionnaire {...commun} />;
    if (page === 'notifications') return <Notifications {...commun} />;
    if (page === 'profil') return <ProfilBoutique {...commun} onProfilMaj={(p: any) => setCompte(c => (c ? { ...c, ...p } : c))} />;
    return null;
  };

  // Bandeau orange : une notification d'enchère à la fois (la plus récente), « 1 sur N », ✕ = lue. Un clic ouvre le panier (gagnée / rappel) ou « Mes enchères ».
  const notifActive = notifsEnchere[0] || null;
  const marquerLue = (id: number) => {
    setNotifsEnchere(l => l.filter(n => n.id !== id));
    setNbNotifs(n => Math.max(0, n - 1));
    fetch(`${API_BASE}/acheteur/${gestionnaireId}/notifications/${id}/lire`, { method: 'PUT', credentials: 'include' }).catch(() => { /* déjà retirée à l'écran */ });
  };
  const ouvrirNotif = () => {
    if (!notifActive) return;
    const dest = notifActive.type === 'enchere_gagnee' || notifActive.type === 'enchere_rappel' ? 'panier' : 'encheres';
    marquerLue(notifActive.id); naviguer(dest);
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
          {notifActive && (
            <div role="status" style={{ width: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: isMobile ? '10px 14px' : '10px 24px', fontSize: isMobile ? 12 : 14, fontWeight: 600, boxSizing: 'border-box' }}>
              <button onClick={ouvrirNotif} title={notifActive.message} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', color: '#fff', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {notifActive.message}
              </button>
              {notifsEnchere.length > 1 && <span title={`${notifsEnchere.length} notifications en attente`} style={{ flexShrink: 0, background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>1 sur {notifsEnchere.length}</span>}
              <button onClick={() => marquerLue(notifActive.id)} aria-label="Fermer la notification" style={{ flexShrink: 0, background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>✕</button>
            </div>
          )}
          <main style={{ flex: 1, padding: isMobile ? 16 : 28, minWidth: 0 }}>{renderPage()}</main>
        </div>
      </div>
    </>
  );
}