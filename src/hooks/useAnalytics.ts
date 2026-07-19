// src/hooks/useAnalytics.ts
// e-Vend Studio — Add-on Analytique
//
// Hook de tracking respectueux de la Loi 25 : n'enregistre AUCUNE visite
// tant que le visiteur n'a pas explicitement accepté la catégorie
// "analytique" dans la bannière cookie (CookieBanner.tsx). Si le
// consentement arrive après le chargement de la page, le hook le détecte
// via l'événement 'evend-cookie-consent-updated' et track à ce moment-là.
//
// Usage prévu :
//   - SitePreview.tsx : appeler useAnalytics(vendeurId, options?.analytique)
//     une seule fois par site — track automatiquement le chargement initial.
//   - Templates avec de vraies sous-pages (boutique-complete, etc.) :
//     appeler trackPageView('/produit/123', 'Nom du produit') au changement
//     de vue interne, quand ce sera implémenté.

import { useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';
const CONSENT_KEY = 'evend_cookie_consent';

interface ConsentData {
  accepted:       boolean;
  analytique:     boolean;
  marketing:      boolean;
  fonctionnalite: boolean;
  date:           string;
}

function lireConsentement(): ConsentData | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function consentementAnalytiqueDonne(): boolean {
  const c = lireConsentement();
  return !!c && c.accepted === true && c.analytique === true;
}

// Un session_id par gestionnaire — pas un seul par navigateur — pour qu'il
// n'y ait jamais de risque de mélange entre deux sites différents prévisualisés
// dans le même navigateur (ex: mode preview sur le domaine principal).
function sessionIdPour(gestionnaireId: number | string): string {
  const key = `evend_analytics_session_${gestionnaireId}`;
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

interface UseAnalyticsReturn {
  trackPageView: (page: string, titre?: string) => void;
}

/**
 * @param gestionnaireId  id du gestionnaire propriétaire du site affiché
 * @param actif           options?.analytique du gestionnaire (add-on activé ou non)
 */
export function useAnalytics(
  gestionnaireId: number | string | undefined | null,
  actif: boolean | undefined
): UseAnalyticsReturn {
  const derniereVisiteId       = useRef<number | null>(null);
  const debutVisite            = useRef<number>(Date.now());
  const dejaTrackeAuChargement = useRef(false);

  const envoyerDuree = useCallback(() => {
    if (!derniereVisiteId.current) return;
    const secondes = Math.round((Date.now() - debutVisite.current) / 1000);
    const url  = `${API_BASE}/analytique/visite/${derniereVisiteId.current}/duree`;
    const body = JSON.stringify({ duree_secondes: secondes });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      }
    } catch {}
  }, []);

  const trackPageView = useCallback((page: string, titre?: string) => {
    if (!actif || !gestionnaireId) return;
    if (!consentementAnalytiqueDonne()) return;

    // Changement de page interne : on ferme la durée de la visite précédente
    // avant d'en ouvrir une nouvelle.
    if (derniereVisiteId.current) envoyerDuree();

    debutVisite.current = Date.now();

    fetch(`${API_BASE}/analytique/visite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gestionnaire_id: gestionnaireId,
        session_id:      sessionIdPour(gestionnaireId),
        page,
        titre:      titre || document.title || null,
        referent:   document.referrer || null,
        resolution: `${window.screen.width}x${window.screen.height}`,
        langue:     navigator.language || null,
      }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.visite_id) derniereVisiteId.current = data.visite_id; })
      .catch(() => {});
  }, [actif, gestionnaireId, envoyerDuree]);

  // ── Chargement initial : track dès que le consentement est disponible ────
  useEffect(() => {
    if (!actif || !gestionnaireId || dejaTrackeAuChargement.current) return;

    const pageInitiale = window.location.pathname || '/';

    if (consentementAnalytiqueDonne()) {
      dejaTrackeAuChargement.current = true;
      trackPageView(pageInitiale);
      return;
    }

    // Pas encore de décision du visiteur — on attend le signal de CookieBanner.tsx
    const onConsentUpdate = () => {
      if (dejaTrackeAuChargement.current) return;
      if (consentementAnalytiqueDonne()) {
        dejaTrackeAuChargement.current = true;
        trackPageView(pageInitiale);
      }
    };
    window.addEventListener('evend-cookie-consent-updated', onConsentUpdate);
    return () => window.removeEventListener('evend-cookie-consent-updated', onConsentUpdate);
  }, [actif, gestionnaireId, trackPageView]);

  // ── Envoyer la durée quand le visiteur quitte ou change d'onglet ─────────
  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') envoyerDuree(); };
    window.addEventListener('pagehide', envoyerDuree);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', envoyerDuree);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [envoyerDuree]);

  return { trackPageView };
}