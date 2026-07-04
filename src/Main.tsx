// Main.tsx — e-Vend Studio

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageAccueil         from './pages/PageAccueil';
import PageTemplates         from './pages/PageTemplates';
import LoginPage             from './pages/LoginPage';
import AppGestionnaireStudio  from './AppGestionnaireStudio';
import AppAdminStudio        from './AppAdminStudio';
import SitePreview           from './pages/SitePreview';
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

const AnyLoginPage = LoginPage        as any;
const AnyGestionnaire = AppGestionnaireStudio as any;
const AnyAdmin     = AppAdminStudio   as any;
const API_BASE     = '/api';

export default function Main() {
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Détection d'un sous-domaine client (xxx.e-vendstudio.ca) ───────────────
  // Si le visiteur arrive sur un sous-domaine gratuit, on affiche directement
  // le site du gestionnaire correspondant au lieu de la page marketing.
  const [sousDomaineCheck, setSousDomaineCheck] = useState<{
    verifie: boolean;
    gestionnaireId: number | null;
  }>({ verifie: false, gestionnaireId: null });

  // Sous-domaines qui NE sont PAS des sites clients (domaine racine, www, outils dev)
  const SOUS_DOMAINES_NON_CLIENTS = ['www', 'e-vendstudio', 'localhost'];

  useEffect(() => {
    const hostname = window.location.hostname;
    const parties = hostname.split('.');

    // On ne détecte un sous-domaine client que sur un hostname du type
    // xxx.e-vendstudio.ca (3 segments), en excluant www et le domaine nu.
    const estCandidat =
      parties.length === 3 &&
      hostname.endsWith('.e-vendstudio.ca') &&
      !SOUS_DOMAINES_NON_CLIENTS.includes(parties[0]);

    if (!estCandidat) {
      setSousDomaineCheck({ verifie: true, gestionnaireId: null });
      return;
    }

    const slug = parties[0];
    fetch(`${API_BASE}/studio/sites/sous-domaine/public/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data?.gestionnaire_id) {
          setSousDomaineCheck({ verifie: true, gestionnaireId: data.gestionnaire_id });
        } else {
          setSousDomaineCheck({ verifie: true, gestionnaireId: null });
        }
      })
      .catch(() => setSousDomaineCheck({ verifie: true, gestionnaireId: null }));
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

  // ── Sous-domaine client détecté : on affiche directement son site ──────────
  // (peu importe le chemin visité — /, /catalogue, etc. — puisque le site du
  // gestionnaire gère lui-même sa navigation interne via son template)
  if (sousDomaineCheck.gestionnaireId) {
    return (
      <BrowserRouter>
        <SitePreview vendeurIdProp={sousDomaineCheck.gestionnaireId} hidePreviewBar />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/"             element={<PageAccueil />} />
        <Route path="/templates"    element={<PageTemplates />} />
        <Route path="/site-preview" element={<SitePreview />} />
        
        {/* Blog */}
        <Route path="/blog"         element={<BlogPlateforme />} />
        <Route path="/blog/:slug"   element={<BlogArticle />} />

        {/* FAQ & Contact */}
        <Route path="/faq"                element={<FaqPlateforme />} />
        <Route path="/contact"            element={<ContactPlateforme />} />
        <Route path="/politiques/:slug"   element={<PagePolitique />} />
        <Route path="/documents"           element={<PageDocumentsPlateforme />} />
        <Route path="/documents/:slug"     element={<PageDocumentsPlateforme />} />

        {/* Inscription vendeur */}
        <Route path="/inscription"  element={
          user ? <Navigate to="/dashboard" replace /> :
          <InscriptionGestionnaire onSuccess={(g) => handleLogin('gestionnaire', g, '')} />
        } />

        {/* Login */}
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <AnyLoginPage onLogin={handleLogin} />
        } />

        {/* Dashboard vendeur */}
        <Route path="/dashboard" element={
          !user ? <Navigate to="/login" replace /> :
          user.role === 'gestionnaire' ? <AnyGestionnaire onLogout={handleLogout} gestionnaireUser={user} /> :
          <Navigate to="/admin" replace />
        } />

        {/* Dashboard admin */}
        <Route path="/admin" element={
          !user ? <Navigate to="/login" replace /> :
          user.role === 'admin' ? <AnyAdmin onLogout={handleLogout} /> :
          <Navigate to="/dashboard" replace />
        } />

        {/* 🔗 Domaines (NOUVEAU) */}
        <Route path="/mon-domaine" element={
          !user ? <Navigate to="/login" replace /> :
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

        {/* Fallback — redirige selon statut */}
        <Route path="*" element={
          !user ? <PageAccueil /> :
          user.role === 'admin' ? <Navigate to="/admin" replace /> :
          <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}