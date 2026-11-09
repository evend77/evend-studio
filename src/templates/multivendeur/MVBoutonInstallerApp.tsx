// CHEMIN : src/templates/multivendeur/MVBoutonInstallerApp.tsx
// e-Vend Studio — Add-on « App installable (PWA) » : bouton « Installer l'app » dans la boutique (mobile seulement).
// Même logique que le bouton d'e-Vend. Il apparaît seulement si le serveur a ajouté la PWA à cette boutique
// (window.__pwaBoutique) et si le navigateur propose l'installation (ou sur iPhone, avec l'aide manuelle).
// Le comptage des installations est fait par le script placé dans <head> par le serveur.

import { useState, useEffect } from 'react';

export default function MVBoutonInstallerApp({ largeurMax }: { largeurMax?: string }) {
  const info = (window as any).__pwaBoutique as { nom?: string; theme?: string } | undefined;
  const [installEvent, setInstallEvent] = useState<any>((window as any).__pwaInstallEvent || null);
  const [appInstallee, setAppInstallee] = useState(false);
  const [aideIOS, setAideIOS] = useState(false);
  const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const estStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const surInvitation = (e: Event) => { e.preventDefault(); (window as any).__pwaInstallEvent = e; setInstallEvent(e); };
    const surInstallee = () => { setAppInstallee(true); setInstallEvent(null); };
    window.addEventListener('beforeinstallprompt', surInvitation);
    window.addEventListener('appinstalled', surInstallee);
    return () => {
      window.removeEventListener('beforeinstallprompt', surInvitation);
      window.removeEventListener('appinstalled', surInstallee);
    };
  }, []);

  const installer = async () => {
    if (installEvent) {
      installEvent.prompt();
      const choix = await installEvent.userChoice;
      if (choix.outcome === 'accepted') setAppInstallee(true);
      setInstallEvent(null);
      (window as any).__pwaInstallEvent = null;
    } else {
      setAideIOS(o => !o);
    }
  };

  if (!info || appInstallee || estStandalone || !(installEvent || estIOS)) return null;

  return (
    <div className="mv-install-mobile" style={{ width: '100%', maxWidth: largeurMax, padding: '0 20px 16px', boxSizing: 'border-box' }}>
      <style>{`.mv-install-mobile{display:none}@media (max-width:768px){.mv-install-mobile{display:block}}`}</style>
      <button
        type="button"
        onClick={installer}
        style={{
          width: '100%', padding: '14px 20px',
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '12px',
          fontSize: '16px', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
        }}
      >
        {`📲 Installer l'app ${info.nom || ''}`.trim()}
      </button>
      {aideIOS && (
        <p style={{ margin: '10px 0 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
          {"Sur iPhone : touchez le bouton Partager (le carré avec une flèche), puis « Sur l'écran d'accueil »."}
        </p>
      )}
    </div>
  );
}