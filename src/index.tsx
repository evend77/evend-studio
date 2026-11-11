// CHEMIN : src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Main from './Main';  // ← Remets Main, pas App

// 📲 App installable (PWA) — e-Vend Studio lui-même, sur e-vendstudio.ca seulement.
// Les boutiques (sous-domaines et domaines personnalisés) ont leur propre PWA, injectée par le serveur.
const HOTES_STUDIO = ['e-vendstudio.ca', 'www.e-vendstudio.ca'];
if (HOTES_STUDIO.indexOf(window.location.hostname) !== -1) {
  // Le manifest de Studio n'est utilisé que sur e-vendstudio.ca : les autres domaines gardent le manifest de public/manifest.json
  const lienManifest = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (lienManifest) {
    lienManifest.href = '/pwa/studio-manifest.json';
  } else {
    const l = document.createElement('link');
    l.rel = 'manifest';
    l.href = '/pwa/studio-manifest.json';
    document.head.appendChild(l);
  }
  // Garde l'invitation d'installation du navigateur pour le bouton « Installer Studio »
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    (window as any).__pwaInstallEvent = e;
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/studio-sw.js').catch(() => {});
    });
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);