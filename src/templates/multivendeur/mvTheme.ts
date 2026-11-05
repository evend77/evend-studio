// CHEMIN : src/templates/multivendeur/mvTheme.ts
// e-Vend Studio — Template Multi-Vendeur Premium — Couleur de fond choisie par le gestionnaire
// (config.couleur_fond, ex. « #060d1f »). Valeur invalide ou absente → noir par défaut.

export const FOND_DEFAUT = '#0a0a0a';

const HEX = /^#[0-9a-f]{6}$/i;

/** Couleur de fond de la page */
export function fondDe(config?: Record<string, any> | null): string {
  const c = config?.couleur_fond;
  return typeof c === 'string' && HEX.test(c.trim()) ? c.trim() : FOND_DEFAUT;
}

/** Même couleur, légèrement transparente (barre de navigation collante) */
export function fondNav(config?: Record<string, any> | null): string {
  const h = fondDe(config).slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.95)`;
}