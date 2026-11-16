// CHEMIN : services/studio_securite_inscription.js
// e-Vend Studio — Sécurité des inscriptions marketplace (acheteurs + collaborateurs)
// Nettoyage du texte, validation des formats, limites par IP / boutique, jeton anti-robot.
// Aucune tâche planifiée : les compteurs en mémoire se nettoient à l'usage.

const crypto = require('crypto');

// Contrôle (0-31, 127-159) + invisibles (zero-width, séparateurs de ligne, BOM) — construit sans escapes \u
const CARACTERES_INVISIBLES = new RegExp('[' + [[0, 31], [127, 159], [8203, 8207], [8232, 8238], [8288, 8288], [65279, 65279]]
  .map(function (r) { return String.fromCharCode(r[0]) + '-' + String.fromCharCode(r[1]); }).join('') + ']', 'g');

// ─── Nettoyage du texte ──────────────────────────────────────────────────────
// Retire balises HTML, caractères de contrôle, < > et les débuts de formule
// (= + @) qui piègent Excel. Espaces multiples réduits, longueur coupée.
function nettoyerTexte(valeur, max) {
  if (typeof valeur !== 'string') return '';
  let t = valeur
    .normalize('NFC')
    .replace(/<[^>]*>?/g, ' ')                 // balises (même incomplètes)
    .replace(CARACTERES_INVISIBLES, '') // contrôle + invisibles
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[=+@]+/, '')
    .trim();
  return t.slice(0, max || 100);
}

// ─── Validation des formats ──────────────────────────────────────────────────
const REGEX_EMAIL = /^[a-z0-9._%+\-]+@[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?)*\.[a-z]{2,24}$/;
const REGEX_NOM = /^[\p{L}\p{M}][\p{L}\p{M}' .\-]*$/u;

function validerCourriel(brut) {
  if (typeof brut !== 'string') return null;
  const e = brut.trim().toLowerCase();
  if (e.length < 6 || e.length > 254 || e.includes('..')) return null;
  return REGEX_EMAIL.test(e) ? e : null;
}

// Téléphone : 10 à 15 chiffres (ex. 514-555-1234 ou +33 1 23 45 67 89). Vide = ok (optionnel).
function validerTelephone(brut) {
  if (brut === null || brut === undefined || brut === '') return { ok: true, valeur: null };
  if (typeof brut !== 'string' || brut.length > 30) return { ok: false };
  if (!/^[0-9 ()+.\-]+$/.test(brut.trim())) return { ok: false };
  const chiffres = brut.replace(/\D/g, '');
  if (chiffres.length < 10 || chiffres.length > 15) return { ok: false };
  return { ok: true, valeur: brut.trim().replace(/\s+/g, ' ') };
}

function validerMotDePasse(mdp) {
  if (typeof mdp !== 'string') return 'Mot de passe invalide.';
  if (mdp.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (Buffer.byteLength(mdp, 'utf8') > 72) return 'Le mot de passe est trop long (72 caractères maximum).';
  return null;
}

// Nom de personne : lettres, espaces, apostrophe, point, tiret.
function validerNomPersonne(brut, max) {
  const n = nettoyerTexte(brut, max || 100);
  if (n.length < 1 || !REGEX_NOM.test(n)) return null;
  return n;
}

// ─── Adresse de livraison canadienne ─────────────────────────────────────────
const PROVINCES_VALIDES = ['QC', 'ON', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
const PROVINCE_PAR_LETTRE_CODE_POSTAL = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON', R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
};
const REGEX_CODE_POSTAL_CA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

// Retourne { ok:true, adresse, ville, province, code_postal } ou { ok:false, message }
function validerAdresse(b) {
  const adresse = nettoyerTexte(b.adresse, 150);
  const ville = nettoyerTexte(b.ville, 80);
  const province = typeof b.province === 'string' ? b.province.trim().toUpperCase() : '';
  const cp = typeof b.code_postal === 'string' ? b.code_postal.trim() : '';
  if (adresse.length < 3) return { ok: false, message: 'Adresse invalide.' };
  if (ville.length < 2) return { ok: false, message: 'Ville invalide.' };
  if (!PROVINCES_VALIDES.includes(province)) return { ok: false, message: 'Province invalide.' };
  if (!REGEX_CODE_POSTAL_CA.test(cp)) return { ok: false, message: 'Code postal invalide (format canadien attendu, ex: H2X 1Y4).' };
  const brut = cp.toUpperCase().replace(/[\s-]/g, '');
  const attendue = PROVINCE_PAR_LETTRE_CODE_POSTAL[brut[0]];
  const coherent = attendue ? province === attendue : (province === 'NT' || province === 'NU');
  if (!coherent) return { ok: false, message: 'Le code postal ne correspond pas à la province sélectionnée.' };
  return { ok: true, adresse, ville, province, code_postal: brut.slice(0, 3) + ' ' + brut.slice(3) };
}

// ─── Limites (mémoire) ───────────────────────────────────────────────────────
// Fenêtre glissante simple : { cle -> [timestamps] }, nettoyée à chaque lecture.
const FENETRE_MS = 60 * 60 * 1000;
const compteurs = new Map();

function purgerSiGros() {
  if (compteurs.size < 5000) return;
  const maintenant = Date.now();
  compteurs.forEach((liste, cle) => {
    if (!liste.length || maintenant - liste[liste.length - 1] > FENETRE_MS) compteurs.delete(cle);
  });
}

function lire(cle) {
  const maintenant = Date.now();
  const liste = (compteurs.get(cle) || []).filter(t => maintenant - t < FENETRE_MS);
  compteurs.set(cle, liste);
  return liste;
}

function depasse(cle, max) { return lire(cle).length >= max; }
function noter(cle) { purgerSiGros(); lire(cle).push(Date.now()); }
function reinitialiserLimites() { compteurs.clear(); } // pour les tests

// IP du visiteur derrière nginx / Cloudflare.
function ipClient(req) {
  const cf = req.headers && req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf.trim();
  const xff = req.headers && req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.ip || (req.socket && req.socket.remoteAddress) || 'inconnue';
}

// ─── Jeton anti-robot (signé, émis au chargement de la page) ─────────────────
// Format : "<timestamp>.<signature>". Le serveur exige un délai minimum entre
// l'émission et l'envoi : un robot qui appelle l'API directement n'en a pas.
const DELAI_MIN_MS = 3000;
const DUREE_MAX_MS = 2 * 60 * 60 * 1000;

function secret() { return process.env.JWT_SECRET || ''; }
function signer(texte) {
  return crypto.createHmac('sha256', secret()).update(texte).digest('hex').slice(0, 32);
}

function creerJeton(gestionnaireId, portee) {
  const ts = String(Date.now());
  return ts + '.' + signer(`${portee}|${gestionnaireId}|${ts}`);
}

// Retourne null si valide, sinon un code : 'absent' | 'invalide' | 'trop_rapide' | 'expire'
function verifierJeton(jeton, gestionnaireId, portee) {
  if (typeof jeton !== 'string' || !jeton) return 'absent';
  const [ts, sig] = jeton.split('.');
  if (!/^\d{10,15}$/.test(ts || '') || !sig) return 'invalide';
  const attendu = signer(`${portee}|${gestionnaireId}|${ts}`);
  const a = Buffer.from(sig), b = Buffer.from(attendu);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return 'invalide';
  const age = Date.now() - Number(ts);
  if (age < DELAI_MIN_MS) return 'trop_rapide';
  if (age > DUREE_MAX_MS) return 'expire';
  return null;
}

module.exports = {
  nettoyerTexte, validerCourriel, validerTelephone, validerMotDePasse, validerNomPersonne, validerAdresse,
  depasse, noter, reinitialiserLimites, ipClient, creerJeton, verifierJeton,
  DELAI_MIN_MS,
};