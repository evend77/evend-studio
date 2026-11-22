// CHEMIN : utils/sanitize.js
const sanitizeHtml = require('sanitize-html');

// HTML limité (blog, politiques, descriptions) — inchangé, sauf rel forcé sur les liens
function nettoyerHtml(texte) {
  if (!texte || typeof texte !== 'string') return texte;
  return sanitizeHtml(texte, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'span'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true)
    }
  });
}

// Texte brut : AUCUNE balise (noms, courriels, messages, recherche, etc.)
// max = longueur maximale (défaut 500)
function nettoyerTexte(texte, max = 500) {
  if (texte === null || texte === undefined) return '';
  if (typeof texte !== 'string') texte = String(texte);
  const propre = sanitizeHtml(texte, { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  return propre.slice(0, max);
}

module.exports = { nettoyerHtml, nettoyerTexte };
