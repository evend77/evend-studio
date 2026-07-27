const sanitizeHtml = require('sanitize-html');

function nettoyerHtml(texte) {
  if (!texte || typeof texte !== 'string') return texte;
  return sanitizeHtml(texte, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'span'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}

module.exports = { nettoyerHtml };
