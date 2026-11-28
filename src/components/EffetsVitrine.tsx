// CHEMIN : src/components/EffetsVitrine.tsx
// e-Vend Studio — Add-on vitrine « Effets de boutique » : dessine les effets (saison, vente) et la musique de fond sur un site vitrine.
// Va chercher les réglages sur /api/vitrines-effets/public/:gid (le serveur répond actif:false si le site n'est pas une vitrine,
// si l'add-on n'est pas activé ou si rien n'est choisi). Les décorations sont coupées si le visiteur a demandé « moins d'animations ».
// Réutilise le dessin des effets du multivendeur (DecorationOverlayPublique, MusiqueDeFondPublique) sans le modifier.

import React, { useEffect, useState } from 'react';
import { DecorationOverlayPublique, MusiqueDeFondPublique } from '../templates/multivendeur/EffetsBoutique';

export default function EffetsVitrine({ gestionnaireId, topOffset = 70 }: { gestionnaireId: number | string; topOffset?: number }) {
  const [cfg, setCfg] = useState<any>(null);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    try { setReduit(!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch { /* ignoré */ }
  }, []);

  useEffect(() => {
    if (!gestionnaireId) return;
    let actif = true;
    fetch(`/api/vitrines-effets/public/${gestionnaireId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (actif) setCfg(d && d.actif ? d : null); })
      .catch(() => {});
    return () => { actif = false; };
  }, [gestionnaireId]);

  if (!cfg) return null;
  return (
    // --e-b-accent : couleur par défaut du mot « Merci » (variable du multivendeur, absente des sites vitrine)
    <div style={{ display: 'contents', ['--e-b-accent' as any]: '#537373' }}>
      {!reduit && (
        <DecorationOverlayPublique
          saison={cfg.saison}
          effets={cfg.effets}
          effetsConfig={cfg.effetsConfig}
          venteEffets={cfg.venteEffets}
          venteEffetsConfig={cfg.venteEffetsConfig}
          topOffset={topOffset}
        />
      )}
      <MusiqueDeFondPublique url={cfg.musiqueUrl} config={cfg.musiqueConfig} />
    </div>
  );
}