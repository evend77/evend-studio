// CHEMIN : src/templates/multivendeur/mvSecurite.ts
// e-Vend Studio — Template Multi-Vendeur Premium — Nettoyage des champs de recherche et de saisie.
// Première barrière côté navigateur ; le serveur nettoie et limite de nouveau tout ce qu'il reçoit
// (requêtes SQL paramétrées, texte sans balises, longueurs maximales).

/** Champ de recherche : pas de balises, pas de caractères de contrôle, 100 caractères maximum. */
export function nettoyerRecherche(v: string): string {
  return String(v ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>`\\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 100);
}

/** Texte libre (message, description) : caractères de contrôle retirés (sauf retour à la ligne), longueur limitée. */
export function nettoyerTexte(v: string, max: number): string {
  return String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, max);
}