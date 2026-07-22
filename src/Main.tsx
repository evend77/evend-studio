// Main.tsx — e-Vend Studio

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageAccueil         from './pages/PageAccueil';
import PageTemplates         from './pages/PageTemplates';
import PageTemplateDetail    from './pages/PageTemplateDetail';
import LoginPage             from './pages/LoginPage';
import AppGestionnaireStudio  from './AppGestionnaireStudio';
import AppAdminStudio        from './AppAdminStudio';
import SitePreview           from './pages/SitePreview';
import PagePaiement          from './pages/PagePaiement';
import BlogPlateforme        from './pages/BlogPlateforme';
import BlogArticle           from './pages/BlogArticle';
import FaqPlateforme         from './pages/FaqPlateforme';
import ContactPlateforme     from './pages/ContactPlateforme';
import PagePolitique              from './pages/PagePolitique';
import PageDocumentsPlateforme    from './pages/PageDocumentsPlateforme';
import InscriptionGestionnaire from './pages/gestionnaire/InscriptionGestionnaire';
import MonDomaine            from './pages/gestionnaire/MonDomaine';
import DomaineSucces         from './pages/DomaineSucces';
import DomaineAnnule         from './pages/DomaineAnnule';
import PageVerifierEmail     from './pages/PageVerifierEmail';
import SiteSuspendu          from './pages/SiteSuspendu';
import SiteMaintenance       from './pages/SiteMaintenance';
// 👇 NOUVEAUX IMPORTS POUR COMMANDITAIRE
import InscriptionCommanditaire from './pages/commanditaire/InscriptionCommanditaire';
import AppSponsors from './AppSponsors';
import MesPhotosSponsor from './pages/commanditaire/MesPhotosSponsor';
import SponsorPubsCreer from './pages/commanditaire/SponsorPubsCreer';


const AnyLoginPage = LoginPage        as any;
const AnyGestionnaire = AppGestionnaireStudio as any;
const AnyAdmin     = AppAdminStudio   as any;
const API_BASE     = '/api';

export default function Main() {
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Détection d'un sous-domaine client (xxx.e-vendstudio.ca) ───────────────
  const [sousDomaineCheck, setSousDomaineCheck] = useState<{
    verifie: boolean;
    gestionnaireId: number | null;
    suspendu: boolean;
    maintenance: boolean;
    messageMaintenance: string | null;
  }>({ verifie: false, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null });

  const SOUS_DOMAINES_NON_CLIENTS = ['www', 'e-vendstudio', 'localhost'];

  useEffect(() => {
    const hostname = window.location.hostname;
    const parties = hostname.split('.');

    const estSousDomaineClient =
      parties.length === 3 &&
      hostname.endsWith('.e-vendstudio.ca') &&
      !SOUS_DOMAINES_NON_CLIENTS.includes(parties[0]);

    if (estSousDomaineClient) {
      const slug = parties[0];
      fetch(`${API_BASE}/studio/sites/sous-domaine/public/${encodeURIComponent(slug)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.success && data?.gestionnaire_id) {
            setSousDomaineCheck({ verifie: true, gestionnaireId: data.gestionnaire_id, suspendu: !!data.site_suspendu, maintenance: !!data.maintenance, messageMaintenance: data.message_maintenance || null });
          } else {
            setSousDomaineCheck({ verifie: true, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null });
          }
        })
        .catch(() => setSousDomaineCheck({ verifie: true, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null }));
      return;
    }

    const estNotreDomaine =
      hostname.endsWith('e-vendstudio.ca') ||
      hostname === 'localhost' ||
      hostname.endsWith('.onrender.com');

    if (!estNotreDomaine) {
      fetch(`${API_BASE}/studio/sites/domaine-perso/public/${encodeURIComponent(hostname)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.success && data?.gestionnaire_id) {
            setSousDomaineCheck({ verifie: true, gestionnaireId: data.gestionnaire_id, suspendu: !!data.site_suspendu, maintenance: !!data.maintenance, messageMaintenance: data.message_maintenance || null });
          } else {
            setSousDomaineCheck({ verifie: true, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null });
          }
        })
        .catch(() => setSousDomaineCheck({ verifie: true, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null }));
      return;
    }

    setSousDomaineCheck({ verifie: true, gestionnaireId: null, suspendu: false, maintenance: false, messageMaintenance: null });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.valid && data?.user) setUser(data.user);
        else { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (_type: string, userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // ── Impersonation admin → gestionnaire ──────────────────────────────────────
  const handleImpersonateGestionnaire = (gestionnaire: any, token: string) => {
    const tokenAdmin = localStorage.getItem('token');
    const userAdmin  = localStorage.getItem('user');
    if (tokenAdmin) localStorage.setItem('admin_token_backup', tokenAdmin);
    if (userAdmin)  localStorage.setItem('admin_user_backup', userAdmin);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(gestionnaire));
    setUser(gestionnaire);
  };

  const handleStopImpersonationGestionnaire = () => {
    const tokenAdmin = localStorage.getItem('admin_token_backup');
    const userAdmin  = localStorage.getItem('admin_user_backup');

    localStorage.removeItem('admin_token_backup');
    localStorage.removeItem('admin_user_backup');

    if (tokenAdmin && userAdmin) {
      localStorage.setItem('token', tokenAdmin);
      localStorage.setItem('user', userAdmin);
      setUser(JSON.parse(userAdmin));
      window.location.href = '/admin';
    } else {
      handleLogout();
    }
  };

  if (!sousDomaineCheck.verifie || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg,#c9a96e,#e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
            e-Vend Studio
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (sousDomaineCheck.gestionnaireId) {
    if (sousDomaineCheck.suspendu) {
      return <SiteSuspendu />;
    }
    if (sousDomaineCheck.maintenance) {
      return <SiteMaintenance messagePersonnalise={sousDomaineCheck.messageMaintenance} />;
    }
    return (
      <BrowserRouter>
        <SitePreview vendeurIdProp={sousDomaineCheck.gestionnaireId} hidePreviewBar />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<PageAccueil />} />
        <Route path="/templates"    element={<PageTemplates />} />
        <Route path="/templates/:id" element={<PageTemplateDetail />} />
        <Route path="/site-preview" element={<SitePreview />} />
        <Route path="/verifier-email" element={<PageVerifierEmail />} />
        <Route path="/paiement"          element={<PagePaiement mode="payer" />} />
        <Route path="/paiement-confirme" element={<PagePaiement mode="confirme" />} />
        <Route path="/paiement-annule"   element={<PagePaiement mode="annule" />} />

        <Route path="/blog"         element={<BlogPlateforme />} />
        <Route path="/blog/:slug"   element={<BlogArticle />} />

        <Route path="/faq"                element={<FaqPlateforme />} />
        <Route path="/contact"            element={<ContactPlateforme />} />
        <Route path="/politiques/:slug"   element={<PagePolitique />} />
        <Route path="/documents"           element={<PageDocumentsPlateforme />} />
        <Route path="/documents/:slug"     element={<PageDocumentsPlateforme />} />
        <Route path="/sponsor/photos" element={<MesPhotosSponsor />} />
        <Route path="/sponsor/pubs/creer" element={<SponsorPubsCreer />} />
        

        {/* 👇 ROUTES COMMANDITAIRES */}
        <Route path="/commanditaire/inscription" element={<InscriptionCommanditaire />} />
        <Route path="/commanditaire/login" element={
          <div style={{ minHeight: '100vh', background: '#1a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#f59e0b' }}>⭐ Connexion commanditaire</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Utilisez le modal "Commanditaire" sur la page d'accueil</p>
              <button 
                onClick={() => window.location.href = '/'}
                style={{ marginTop: '20px', padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700', cursor: 'pointer' }}
              >
                ← Retour à l'accueil
              </button>
            </div>
          </div>
        } />
        <Route path="/sponsor-dashboard" element={
          <AppSponsors />
        } />

        <Route path="/inscription"  element={
          user ? <Navigate to="/dashboard" replace /> :
          <InscriptionGestionnaire />
        } />

        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <AnyLoginPage onLogin={handleLogin} />
        } />

        <Route path="/dashboard" element={
          !user ? <Navigate to="/login" replace /> :
          user.role === 'gestionnaire' ? (
            <AnyGestionnaire
              onLogout={localStorage.getItem('admin_token_backup') ? handleStopImpersonationGestionnaire : handleLogout}
              gestionnaireUser={user}
              isAdminImpersonation={!!localStorage.getItem('admin_token_backup')}
            />
          ) :
          <Navigate to="/admin" replace />
        } />

        <Route path="/admin" element={
          !user ? <Navigate to="/login" replace /> :
          user.role === 'admin' ? <AnyAdmin onLogout={handleLogout} onImpersonateGestionnaire={handleImpersonateGestionnaire} /> :
          <Navigate to="/dashboard" replace />
        } />

        <Route path="/mon-domaine" element={
          !user ? <Navigate to="/login" replace /> :
          user.premiere_verification_faite === false ? <Navigate to="/dashboard" replace /> :
          <MonDomaine gestionnaireId={user.id} />
        } />

        <Route path="/domaine-succes" element={
          !user ? <Navigate to="/login" replace /> :
          <DomaineSucces gestionnaireId={user.id} />
        } />

        <Route path="/domaine-annule" element={
          !user ? <Navigate to="/login" replace /> :
          <DomaineAnnule />
        } />

        <Route path="*" element={
          !user ? <PageAccueil /> :
          user.role === 'admin' ? <Navigate to="/admin" replace /> :
          <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}