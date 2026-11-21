// CHEMIN : src/components/tonsBoutique.ts
// e-Vend Studio — Couleurs « sombre » / « clair » partagées par les blocs des templates boutique (offres, enchères, questions, avis, favoris, parution…).
// Sans l'option `clair`, les valeurs sont EXACTEMENT celles d'origine (thème sombre de Premium) : rien ne change pour Premium.
// Avec `clair` (Simplisse, fond blanc), les voiles blancs deviennent des voiles foncés et les textes pâles deviennent foncés.

export function tons(clair?: boolean) {
  const c = !!clair;
  return {
    clair: c,
    b: (a: number) => (c ? `rgba(17,24,39,${a})` : `rgba(255,255,255,${a})`),   // voile / bordure / texte doux (alpha)
    txt: c ? '#1a1a1a' : '#fff',                 // texte principal
    sur: c ? '#fff' : '#000',                    // texte posé sur la couleur d'accent
    ok: c ? '#047857' : '#6ee7b7',               // texte vert
    okVif: c ? '#059669' : '#34d399',
    err: c ? '#b91c1c' : '#fca5a5',              // texte rouge
    avert: c ? '#92400e' : '#fcd34d',            // texte ambre
    champ: c ? '#f9fafb' : 'rgba(0,0,0,0.25)',   // fond d'un champ de saisie
    modal: c ? '#fff' : '#1a1a24',               // fond d'une fenêtre modale
    carte: c ? '#fff' : '#1e1e1e',               // fond d'une carte pleine
    carteBord: c ? '#e5e7eb' : '#222',
  };
}