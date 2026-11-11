// CHEMIN : src/components/BoutonInstallerStudio.tsx
// Bouton « Installer e-Vend Studio » (PWA). Même logique que BoutonInstallerApp, mais pour Studio.
// Ne s'affiche pas si l'app est déjà installée, ou si le navigateur ne la propose pas.
// Sur iPhone (pas de bouton d'installation chez Apple) : affiche l'astuce « Partager → Sur l'écran d'accueil ».

import { useState, useEffect } from 'react';

export default function BoutonInstallerStudio({ largeurMax }: { largeurMax?: string }) {
  const [installEvent, setInstallEvent] = useState<any>((window as any).__pwaInstallEvent || null);
  const [appInstallee, setAppInstallee] = useState(false);
  const [aideIOS, setAideIOS] = useState(false);
  const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const estStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const surInvitation = (e: Event) => { e.preventDefault(); setInstallEvent(e); };
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
    } else {
      setAideIOS(o => !o);
    }
  };

  if (appInstallee || estStandalone || !(installEvent || estIOS)) return null;

  return (
    <div style={{ width: '100%', maxWidth: largeurMax }}>
      <button
        type="button"
        onClick={installer}
        style={{
          width: '100%', padding: '12px 18px',
          background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
          border: '1.5px solid #fbbf24', borderRadius: '12px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
        }}
      >
        {'📲 Installer e-Vend Studio'}
      </button>
      {aideIOS && (
        <p style={{ margin: '10px 0 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          {"Sur iPhone : touchez le bouton Partager (le carré avec une flèche), puis « Sur l'écran d'accueil »."}
        </p>
      )}
    </div>
  );
}