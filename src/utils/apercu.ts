// CHEMIN : src/utils/apercu.ts
// Ouvre / ferme un aperçu de site sans sortir de l'application installée (PWA).

export function estPwa(): boolean {
  try {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true
    );
  } catch (e) {
    return false;
  }
}

/** Dans la PWA : même fenêtre (la session localStorage est conservée). Sur ordinateur : nouvel onglet. */
export function ouvrirApercu(url: string): void {
  if (estPwa()) {
    window.location.assign(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Ferme l'aperçu : onglet → close(); sinon retour à l'écran précédent (ou au tableau de bord). */
export function fermerApercu(): void {
  try { window.close(); } catch (e) { /* ignore */ }
  window.setTimeout(function () {
    if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  }, 150);
}