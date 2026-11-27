// src/templates/annoncesSite/couleurs.ts
// e-Vend Studio — Petites fonctions de couleur pour les templates sombres (valeurs #rrggbb déjà validées par normaliserConfig).

export const rgb = (h: string): [number, number, number] => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255]; };
export const alpha = (h: string, a: number) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
export const lum = (h: string) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
/** Couleur du texte posé sur un fond de couleur h. */
export const surCouleur = (h: string) => (lum(h) > 0.6 ? '#0a0a0a' : '#ffffff');
/** Version plus foncée (texte et boutons sur fond blanc : un vert ou jaune néon y serait illisible). */
export const foncer = (h: string, f = 0.6) => { const [r, g, b] = rgb(h); const x = (v: number) => Math.round(v * f).toString(16).padStart(2, '0'); return `#${x(r)}${x(g)}${x(b)}`; };