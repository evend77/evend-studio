// CHEMIN : services/studio_questions.js
// e-Vend Studio — Add-on « Questions sur le produit » : règles communes (nettoyage du texte, blocage des coordonnées).
'use strict';

const sanitizeHtml = require('sanitize-html');

const CODE_ADDON = 'questions_produit';
const QUESTION_MIN = 10, QUESTION_MAX = 500;
const REPONSE_MIN = 2, REPONSE_MAX = 1000;

class ErreurQuestion extends Error { constructor(m, s) { super(m); this.status = s || 400; } }

// Texte brut : aucune balise, espaces compactés, caractères de contrôle retirés.
function nettoyer(t) {
  const brut = typeof t === 'string' ? t : '';
  return sanitizeHtml(brut, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

const RE_COURRIEL = /[^\s@]+@[^\s@]+\.[a-z]{2,}|\barobase\b/i;
const RE_TELEPHONE = /(?:\+?\d[\s.\-()]*){10,}/;
const RE_LIEN = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}\.(?:com|ca|net|org|io|co|fr|shop|store|app|me|biz|info)\b/i;

/** true si le texte contient un courriel, un numéro de téléphone ou un lien (pour garder les échanges sur la plateforme). */
function contientCoordonnees(t) {
  return RE_COURRIEL.test(t) || RE_TELEPHONE.test(t) || RE_LIEN.test(t);
}
const MSG_COORDONNEES = "Pour votre sécurité, n'écrivez pas de courriel, de numéro de téléphone ou de lien dans ce texte.";

function verifierQuestion(t) {
  const q = nettoyer(t);
  if (q.length < QUESTION_MIN) throw new ErreurQuestion(`Votre question est trop courte (au moins ${QUESTION_MIN} caractères).`);
  if (q.length > QUESTION_MAX) throw new ErreurQuestion(`Votre question est trop longue (${QUESTION_MAX} caractères maximum).`);
  if (contientCoordonnees(q)) throw new ErreurQuestion(MSG_COORDONNEES);
  return q;
}
function verifierReponse(t) {
  const r = nettoyer(t);
  if (r.length < REPONSE_MIN) throw new ErreurQuestion('Écrivez votre réponse.');
  if (r.length > REPONSE_MAX) throw new ErreurQuestion(`La réponse est trop longue (${REPONSE_MAX} caractères maximum).`);
  if (contientCoordonnees(r)) throw new ErreurQuestion(MSG_COORDONNEES);
  return r;
}

// « Alex B. » : prénom + initiale du nom (jamais le courriel ni le nom complet)
function nomPublic(prenom, nom) {
  const p = String(prenom || '').trim().split(/\s+/)[0] || 'Acheteur';
  const n = String(nom || '').trim();
  return n ? `${p} ${n.charAt(0).toUpperCase()}.` : p;
}

module.exports = { CODE_ADDON, ErreurQuestion, nettoyer, verifierQuestion, verifierReponse, contientCoordonnees, nomPublic, QUESTION_MAX, REPONSE_MAX };