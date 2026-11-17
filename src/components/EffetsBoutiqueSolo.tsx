// CHEMIN : src/components/EffetsBoutiqueSolo.tsx
// e-Vend Studio — Add-on « Effets de boutique » : dessine les effets (saison, vente) et la musique de fond sur une boutique solo.
// Va chercher les réglages sur /api/boutique/effets/:gid. Rien ne s'affiche si le gestionnaire n'a rien choisi,
// et les décorations sont coupées si le visiteur a demandé « moins d'animations ».
// Réutilise le dessin des effets du multivendeur (DecorationOverlayPublique, MusiqueDeFondPublique) sans le modifier.

import React, { useEffect, useState } from 'react';
import { DecorationOverlayPublique, MusiqueDeFondPublique } from '../templates/multivendeur/EffetsBoutique';

export default function EffetsBoutiqueSolo({ gestionnaireId, topOffset = 70 }: { gestionnaireId: number | string; topOffset?: number }) {
  const [cfg, setCfg] = useState<any>(null);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    try { setReduit(!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch { /* ignoré */ }
  }, []);

  useEffect(() => {
    if (!gestionnaireId) return;
    let actif = true;
    fetch(`/api/boutique/effets/${gestionnaireId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (actif) setCfg(d && d.actif ? d : null); })
      .catch(() => {});
    return () => { actif = false; };
  }, [gestionnaireId]);

  if (!cfg) return null;
  return (
    <>
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
    </>
  );
}