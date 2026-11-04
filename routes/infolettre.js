// routes/infolettre.js
// Inscription à l'infolettre e-Vend Studio (bas des pages publiques, etc.)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifierToken } = require('../utils/tokenDesabonnement');
const { attendreTables } = require('../utils/tablesInfolettre');

// ── Limiteur anti-spam : 5 inscriptions / heure / adresse IP ───────────────
// (en mémoire, sans nouvelle dépendance ; un utilisateur normal ne le voit jamais)
// Derrière le proxy du serveur, on lit l'IP réelle dans X-Forwarded-For (dernière
// valeur = celle ajoutée par le proxy), sinon l'IP directe.
const LIMITE_INSCRIPTIONS = 5;
const FENETRE_MS = 60 * 60 * 1000;
const compteurs = new Map();
function ipClient(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.ip || req.socket?.remoteAddress || 'inconnue');
}
function limiteurInfolettre(req, res, next) {
  const maintenant = Date.now();
  const ip = ipClient(req);
  let c = compteurs.get(ip);
  if (!c || c.reset <= maintenant) { c = { n: 0, reset: maintenant + FENETRE_MS }; compteurs.set(ip, c); }
  c.n++;
  if (c.n > LIMITE_INSCRIPTIONS) {
    const msg = 'Trop de demandes, réessayez plus tard.';
    return res.status(429).json({ success: false, error: msg, message: msg });
  }
  next();
}
// Ménage périodique pour que la table ne grossisse pas indéfiniment.
setInterval(() => {
  const maintenant = Date.now();
  for (const [ip, c] of compteurs) if (c.reset <= maintenant) compteurs.delete(ip);
}, 10 * 60 * 1000).unref();

router.use(attendreTables);

const dns = require('dns').promises;

// Regex basée sur le standard HTML5/WHATWG pour la validation d'email, avec
// un ajout : la extension (.com, .ca, .org...) doit faire au moins 2 LETTRES
// (jamais de chiffres/tirets dans une vraie extension) — bloque des trucs
// comme "test@x.c" ou "test@x.1" qui ont la bonne "forme" mais ne sont pas
// des extensions réelles. Le reste bloque tout HTML/JS (<, >, ", etc.).
const REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const LONGUEUR_MAX_EMAIL = 254; // limite pratique standard pour une adresse courriel

function formatEmailValide(email) {
  return typeof email === 'string'
    && email.length > 0
    && email.length <= LONGUEUR_MAX_EMAIL
    && REGEX_EMAIL.test(email.trim());
}

// ── Vérifie que le domaine existe vraiment et peut recevoir des courriels ──
// Un texte peut avoir la BONNE FORME ("test@gmial.con") sans être une vraie
// adresse. On vérifie donc que le domaine a un enregistrement MX (serveur de
// courriel) ou, à défaut, au moins un enregistrement A (le domaine existe).
// En cas d'erreur réseau/DNS temporaire (pas "le domaine n'existe pas", mais
// "on n'a pas pu vérifier"), on laisse passer plutôt que de bloquer un vrai
// abonné à cause d'un problème de notre côté.
async function domaineRecoitCourriel(email) {
  const domaine = email.split('@')[1];
  try {
    const mx = await dns.resolveMx(domaine);
    if (mx && mx.length > 0) return true;
  } catch (err) {
    if (err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') return true; // erreur réseau/DNS temporaire → on ne bloque pas
  }
  try {
    await dns.resolve4(domaine); // pas de MX, mais le domaine existe quand même (rare mais possible)
    return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return false; // domaine confirmé inexistant
    return true; // erreur réseau/DNS temporaire → on ne bloque pas
  }
}

// ─── POST /api/infolettre — inscription ─────────────────────────────────────
router.post('/', limiteurInfolettre, async (req, res) => {
  const { email, source } = req.body;

  if (!formatEmailValide(email)) {
    return res.status(400).json({ error: 'Adresse courriel invalide' });
  }

  const emailNormalise = email.trim().toLowerCase();

  const domaineValide = await domaineRecoitCourriel(emailNormalise);
  if (!domaineValide) {
    return res.status(400).json({ error: 'Ce domaine de courriel n\'existe pas' });
  }

  const sourceNormalisee = (typeof source === 'string' ? source.trim() : '').slice(0, 50) || 'footer_accueil';

  try {
    const { rows } = await pool.query(
      `INSERT INTO infolettre_abonnes (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET actif = true, date_desabonnement = NULL
         WHERE infolettre_abonnes.actif = false
       RETURNING id, email, actif, (xmax = 0) AS nouvellement_cree`,
      [emailNormalise, sourceNormalisee]
    );

    // Si la ligne existait déjà et était active, ON CONFLICT DO UPDATE ne
    // retourne rien (WHERE non satisfait) — on vérifie ce cas séparément
    // pour donner un message clair plutôt qu'une réponse vide.
    if (rows.length === 0) {
      return res.status(200).json({ message: 'Vous êtes déjà inscrit à l\'infolettre', deja_inscrit: true });
    }

    return res.status(201).json({ message: 'Inscription réussie', email: rows[0].email });
  } catch (err) {
    console.error('POST /infolettre:', err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// ─── DELETE /api/infolettre — désabonnement (appelé par la page de
// confirmation /desabonnement, PAS directement par le lien du courriel —
// voir DesabonnementInfolettre.tsx pour le pourquoi) ────────────────────────
router.delete('/', async (req, res) => {
  const { email, token } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Adresse courriel requise' });
  }
  const emailNormalise = email.trim().toLowerCase();

  // Jeton invalide (ou manquant) → on refuse, sans jamais préciser si c'est
  // le jeton qui cloche ou si l'email n'est simplement pas dans la liste.
  // Ça empêche quelqu'un de fabriquer un lien pour désabonner une adresse
  // qui n'est pas la sienne, et ça évite qu'on puisse "sonder" la liste
  // (deviner quels emails y sont inscrits) via les réponses du serveur.
  if (!verifierToken(emailNormalise, token)) {
    return res.status(400).json({ error: 'Lien de désabonnement invalide' });
  }

  try {
    await pool.query(
      `UPDATE infolettre_abonnes SET actif = false, date_desabonnement = NOW()
       WHERE email = $1`,
      [emailNormalise]
    );
    // Même message que l'email existait déjà comme inactif ou n'a jamais
    // été inscrit — encore une fois, pour ne rien révéler sur le contenu
    // de la liste.
    res.json({ message: 'Vous avez été désabonné(e) avec succès.' });
  } catch (err) {
    console.error('DELETE /infolettre:', err);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
});

module.exports = router;