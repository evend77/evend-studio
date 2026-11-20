// CHEMIN : src/hooks/useBoutiqueAnalytique.ts
// e-Vend Studio — Add-on « Analytique » des templates boutique (solo) : compte les pages vues de la boutique.
// Loi 25 : AUCUNE visite n'est envoyée tant que le visiteur n'a pas accepté la catégorie « analytique » dans la bannière de cookies
// (clé localStorage « evend_cookie_consent », événement « evend-cookie-consent-updated »). Un refus = rien n'est compté.
// Le serveur dit aussi si le comptage est permis (add-on actif + bannière active + catégorie « analytique » proposée) : sinon, aucun envoi.
// Une boutique est une page unique avec des vues internes : le template appelle trackPageView('/catalogue', 'Catalogue') à chaque changement de vue.
// Aucun lien avec useAnalytics.ts (MV). Les appels vont à /api/boutique/analytique/<gid>/… ; la boutique doit correspondre au domaine visité.

import { useEffect, useRef, useCallback } from 'react';

const BASE = '/api/boutique/analytique';
const CONSENT_KEY = 'evend_cookie_consent';

function consentementDonne(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const c = raw ? JSON.parse(raw) : null;
    return !!c && c.accepted === true && c.analytique === true;
  } catch { return false; }
}

// Un identifiant de session par boutique (jamais partagé entre deux boutiques ouvertes dans le même navigateur)
function sessionIdPour(gid: number): string {
  const cle = `bq_analytique_session_${gid}`;
  const neuf = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-xx`;
  try {
    let id = localStorage.getItem(cle);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) { id = neuf(); localStorage.setItem(cle, id as string); }
    return id as string;
  } catch { return neuf(); }
}

/**
 * @param gid    id de la boutique (gestionnaire)
 * @param actif  false = ne rien faire (aperçu / démonstration)
 */
export function useBoutiqueAnalytique(gid: number | undefined | null, actif: boolean) {
  const permis = useRef<boolean | null>(null);                // réponse du serveur : null = pas encore connue
  const enAttente = useRef<{ page: string; titre?: string } | null>(null);
  const derniere = useRef<string>('');
  const visite = useRef<{ id: number; token: string } | null>(null);
  const debut = useRef<number>(Date.now());
  const cumul = useRef<number>(0);                            // secondes déjà passées (onglet visible) sur la page en cours
  const visible = useRef<boolean>(typeof document === 'undefined' ? true : document.visibilityState !== 'hidden');

  const secondes = () => cumul.current + (visible.current ? Math.round((Date.now() - debut.current) / 1000) : 0);

  const envoyerDuree = useCallback(() => {
    const v = visite.current;
    if (!v || !gid) return;
    const url = `${BASE}/${gid}/visite/${v.id}/duree`;
    const body = JSON.stringify({ duree_secondes: secondes(), token: v.token });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch { /* ignoré */ }
  }, [gid]);

  const envoyer = useCallback((page: string, titre?: string) => {
    if (!gid) return;
    if (visite.current) envoyerDuree();            // ferme la page précédente
    visite.current = null; debut.current = Date.now(); cumul.current = 0;
    fetch(`${BASE}/${gid}/visite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionIdPour(gid),
        page,
        titre: titre || document.title || null,
        referent: document.referrer || null,
        resolution: `${window.screen.width}x${window.screen.height}`,
        langue: navigator.language || null,
        recherche: window.location.search || '',
      }),
    })
      .then(r => (r.status === 201 ? r.json() : null))
      .then(d => { if (d && d.visite_id && d.token) visite.current = { id: d.visite_id, token: d.token }; })
      .catch(() => {});
  }, [gid, envoyerDuree]);

  // Envoie la page en attente si tout est réuni (add-on permis par le serveur + consentement du visiteur)
  const essayer = useCallback(() => {
    const p = enAttente.current;
    if (!p || !actif || !gid || permis.current !== true || !consentementDonne()) return;
    enAttente.current = null;
    envoyer(p.page, p.titre);
  }, [actif, gid, envoyer]);

  const trackPageView = useCallback((page: string, titre?: string) => {
    if (!actif || !gid || permis.current === false) return;
    if (page === derniere.current) return;         // même vue appelée deux fois de suite
    derniere.current = page;
    enAttente.current = { page, titre };
    essayer();
  }, [actif, gid, essayer]);

  // Demande au serveur si le comptage est permis, puis envoie la vue en attente
  useEffect(() => {
    if (!actif || !gid) return;
    let vivant = true;
    fetch(`${BASE}/${gid}/config`)
      .then(r => (r.ok ? r.json() : { actif: false }))
      .then(c => { if (!vivant) return; permis.current = !!(c && c.actif); if (permis.current) essayer(); else enAttente.current = null; })
      .catch(() => { if (vivant) permis.current = false; });
    return () => { vivant = false; };
  }, [actif, gid, essayer]);

  // Le visiteur donne son consentement après l'arrivée sur la page : on compte la vue en cours
  useEffect(() => {
    if (!actif || !gid) return;
    window.addEventListener('evend-cookie-consent-updated', essayer);
    return () => window.removeEventListener('evend-cookie-consent-updated', essayer);
  }, [actif, gid, essayer]);

  // Durée : seulement le temps où l'onglet est visible ; envoyée quand il se cache ou se ferme
  useEffect(() => {
    const surVisibilite = () => {
      if (document.visibilityState === 'hidden') { cumul.current = secondes(); visible.current = false; envoyerDuree(); }
      else { visible.current = true; debut.current = Date.now(); }
    };
    const surFermeture = () => { cumul.current = secondes(); visible.current = false; envoyerDuree(); };
    window.addEventListener('pagehide', surFermeture);
    document.addEventListener('visibilitychange', surVisibilite);
    return () => { window.removeEventListener('pagehide', surFermeture); document.removeEventListener('visibilitychange', surVisibilite); };
  }, [envoyerDuree]);

  return { trackPageView };
}

export default useBoutiqueAnalytique;