// src/utils/liensMenu.ts
// Navigation des liens du menu et du bas de page.
// Les liens « section de l'accueil » (/#templates, /#features…) font défiler l'accueil jusqu'à la section :
//   - sur l'accueil : défilement fluide tout de suite ;
//   - sur une autre page : retour à l'accueil, puis défilement (useDefilementAncre, dans MenuPublic).

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// « /#templates » → « templates » ; tout autre lien → null
export function idAncre(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^\/#([A-Za-z][A-Za-z0-9_-]*)$/.exec(url.trim());
  return m ? m[1] : null;
}

// Défile jusqu'à l'élément ; réessaie pendant ~3 s si la section n'est pas encore affichée
export function defilerVers(id: string, essais = 30): void {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (essais > 0) window.setTimeout(() => defilerVers(id, essais - 1), 100);
}

// Renvoie la fonction à appeler au clic sur un lien interne (commençant par « / »)
export function useAllerA(): (href: string) => void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (href: string) => {
    const ancre = idAncre(href);
    if (ancre) {
      if (pathname === '/') defilerVers(ancre);
      else navigate({ pathname: '/', hash: '#' + ancre });
      return;
    }
    navigate(href);
  };
}

// À placer une seule fois par page (dans MenuPublic) : arrivé sur l'accueil avec un #, on défile jusqu'à la section
export function useDefilementAncre(): void {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (pathname !== '/' || hash.length < 2) return;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* garde tel quel */ }
    defilerVers(id);
  }, [pathname, hash]);
}