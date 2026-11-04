// utils/courrielMime.js
// Construit un courriel MIME complet (HTML + images intégrées + pièces jointes)
// et l'envoie via Amazon SES (SendRawEmail) avec le SDK déjà installé dans
// Studio (@aws-sdk/client-ses). Aucune nouvelle dépendance.

const crypto = require('crypto');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const nonAscii = s => /[^\x20-\x7e]/.test(s);
const mot = s => nonAscii(s) ? `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=` : s;
const cleanHeader = s => String(s).replace(/[\r\n]+/g, ' ');
const base64Lignes = buf => (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64').replace(/.{1,76}/g, '$&\r\n').trimEnd();
const nomFichier = s => cleanHeader(s).replace(/"/g, "'");

// "Nom" <adresse>  →  { nom, adresse }
function separerAdresse(chaine) {
  const m = String(chaine).match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { nom: m[1].trim(), adresse: m[2].trim() } : { nom: '', adresse: String(chaine).trim() };
}
function enteteAdresse(chaine) {
  const { nom, adresse } = separerAdresse(chaine);
  return nom ? `"${mot(cleanHeader(nom)).replace(/"/g, '')}" <${adresse}>` : adresse;
}

function construireMime({ from, to, subject, html, inline = [], pieces = [] }) {
  const id = crypto.randomBytes(8).toString('hex');
  const bMixed = `----=_mixed_${id}`;
  const bRel   = `----=_related_${id}`;
  const L = [];
  L.push(`From: ${enteteAdresse(from)}`);
  L.push(`To: ${enteteAdresse(to)}`);
  L.push(`Subject: ${mot(cleanHeader(subject))}`);
  L.push('MIME-Version: 1.0');
  L.push(`Date: ${new Date().toUTCString()}`);
  L.push(`Content-Type: multipart/mixed; boundary="${bMixed}"`);
  L.push('');
  L.push(`--${bMixed}`);
  L.push(`Content-Type: multipart/related; boundary="${bRel}"`);
  L.push('');
  L.push(`--${bRel}`);
  L.push('Content-Type: text/html; charset=UTF-8');
  L.push('Content-Transfer-Encoding: base64');
  L.push('');
  L.push(base64Lignes(Buffer.from(html, 'utf8')));
  for (const img of inline) {
    L.push(`--${bRel}`);
    L.push(`Content-Type: ${img.contentType || 'application/octet-stream'}; name="${mot(nomFichier(img.filename))}"`);
    L.push('Content-Transfer-Encoding: base64');
    L.push(`Content-ID: <${img.cid}>`);
    L.push(`Content-Disposition: inline; filename="${mot(nomFichier(img.filename))}"`);
    L.push('');
    L.push(base64Lignes(img.content));
  }
  L.push(`--${bRel}--`);
  for (const p of pieces) {
    L.push(`--${bMixed}`);
    L.push(`Content-Type: ${p.contentType || 'application/octet-stream'}; name="${mot(nomFichier(p.filename))}"`);
    L.push('Content-Transfer-Encoding: base64');
    L.push(`Content-Disposition: attachment; filename="${mot(nomFichier(p.filename))}"`);
    L.push('');
    L.push(base64Lignes(p.content));
  }
  L.push(`--${bMixed}--`);
  L.push('');
  return Buffer.from(L.join('\r\n'), 'utf8');
}

async function envoyerCourriel({ from, to, subject, html, inline, pieces }) {
  const raw = construireMime({ from, to, subject, html, inline, pieces });
  await ses.send(new SendRawEmailCommand({
    Source: separerAdresse(from).adresse,
    Destinations: [separerAdresse(to).adresse],
    RawMessage: { Data: raw },
  }));
}

module.exports = { envoyerCourriel, construireMime, separerAdresse };