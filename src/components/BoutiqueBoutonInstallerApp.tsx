// CHEMIN : src/components/BoutiqueBoutonInstallerApp.tsx
// e-Vend Studio — Add-on « App installable (PWA) » (templates boutique) : bouton « Installer l'app » dans le pied de page (mobile seulement).
// Il apparaît seulement si le serveur a ajouté la PWA à cette boutique (window.__pwaBoutique, posé par le script de <head>) et si le navigateur
// propose l'installation (ou sur iPhone, avec l'aide manuelle). Le comptage des installations est fait par ce script, pas par ce bouton.

import React, { useState, useEffect } from 'react';

// `texte` : couleur du texte (blanc par défaut = gabarits sombres ; passer une couleur foncée pour un fond clair).
export default function BoutiqueBoutonInstallerApp({ couleur = '#c9a96e', texte = '#fff', texteDoux = 'rgba(255,255,255,0.75)' }: { couleur?: string; texte?: string; texteDoux?: string }) {
  const info = (window as any).__pwaBoutique as { nom?: string; theme?: string } | undefined;
  const [installEvent, setInstallEvent] = useState<any>((window as any).__pwaInstallEvent || null);
  const [appInstallee, setAppInstallee] = useState(false);
  const [aideIOS, setAideIOS] = useState(false);
  const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let estStandalone = false;
  try { estStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true; } catch (e) { estStandalone = false; }

  useEffect(() => {
    const surInvitation = (e: Event) => { e.preventDefault(); (window as any).__pwaInstallEvent = e; setInstallEvent(e); };
    const surInstallee = () => { setAppInstallee(true); setInstallEvent(null); };
    window.addEventListener('beforeinstallprompt', surInvitation);
    window.addEventListener('appinstalled', surInstallee);
    return () => { window.removeEventListener('beforeinstallprompt', surInvitation); window.removeEventListener('appinstalled', surInstallee); };
  }, []);

  const installer = async () => {
    if (installEvent) {
      installEvent.prompt();
      const choix = await installEvent.userChoice;
      if (choix && choix.outcome === 'accepted') setAppInstallee(true);
      setInstallEvent(null);
      (window as any).__pwaInstallEvent = null;
    } else {
      setAideIOS(o => !o);
    }
  };

  if (!info || appInstallee || estStandalone || !(installEvent || estIOS)) return null;

  return (
    <div className="bq-install-mobile" style={{ width: '100%', padding: '0 0 24px', boxSizing: 'border-box' }}>
      <style>{`.bq-install-mobile{display:none}@media (max-width:768px){.bq-install-mobile{display:block}}`}</style>
      <button type="button" onClick={installer}
        style={{ width: '100%', padding: '14px 20px', background: `${couleur}22`, color: texte, border: `1.5px solid ${couleur}`, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
        {`📲 Installer l'app ${info.nom || ''}`.trim()}
      </button>
      {aideIOS && (
        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5, color: texteDoux, textAlign: 'center' }}>
          {"Sur iPhone : touchez le bouton Partager (le carré avec une flèche), puis « Sur l'écran d'accueil »."}
        </p>
      )}
    </div>
  );
}