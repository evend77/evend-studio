// CHEMIN : src/components/VitrineBoutonInstallerApp.tsx
// e-Vend Studio — Add-on vitrine « App installable (PWA) » : bouton « Installer l'app » au bas du site (mobile seulement).
// Monté une seule fois dans SitePreview. Il apparaît seulement si le serveur a ajouté la PWA vitrine (window.__pwaVitrine)
// et si le navigateur propose l'installation (ou sur iPhone, avec l'aide manuelle). Le comptage est fait par le script de <head>.

import { useState, useEffect } from 'react';

// Fond plein à la couleur choisie : lisible sur un gabarit clair comme sur un gabarit sombre. Texte noir si la couleur est pâle.
const texteSur = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160 ? '#111111' : '#ffffff';
};

export default function VitrineBoutonInstallerApp() {
  const info = (window as any).__pwaVitrine as { nom?: string; theme?: string } | undefined;
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
  const couleur = /^#[0-9a-fA-F]{6}$/.test(info.theme || '') ? (info.theme as string) : '#2d6a9f';

  return (
    <div className="vt-install-mobile" style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box' }}>
      <style>{`.vt-install-mobile{display:none}@media (max-width:768px){.vt-install-mobile{display:block}}`}</style>
      <button type="button" onClick={installer}
        style={{ width: '100%', padding: '14px 20px', background: couleur, color: texteSur(couleur), border: '1px solid rgba(128,128,128,0.4)', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
        {`📲 Installer l'app ${info.nom || ''}`.trim()}
      </button>
      {aideIOS && (
        <p style={{ margin: '10px 0 0', padding: '10px 12px', borderRadius: 10, background: '#ffffff', color: '#111111', fontSize: 13, lineHeight: 1.5, textAlign: 'center' }}>
          {"Sur iPhone : touchez le bouton Partager (le carré avec une flèche), puis « Sur l'écran d'accueil »."}
        </p>
      )}
    </div>
  );
}