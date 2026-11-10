// CHEMIN : routes/gestionnaire_etsy.js
// Clés Etsy « développeur » du GESTIONNAIRE (add-on « Connecteur Etsy »).
// Monté depuis routes/gestionnaire_ebay.js sur : /api/gestionnaire/ebay/etsy
//   GET /  configuration (secrets JAMAIS en clair, seulement masqués) · POST /  enregistrer (champ vide = inchangé)
//   POST /tester  vérifier la clé auprès d'Etsy · DELETE /  effacer
// Démarre aussi le traitement des imports Etsy en arrière-plan (file de travaux dans la base).

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');
const addons = require('../services/studio_addons');
const svc = require('../services/studio_etsy');

const router = express.Router();
const CODE_ADDON = 'connecteur_etsy';

router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});
router.use(async (req, res, next) => {
  try {
    if (!(await addons.addonActifRapide(req.user.id, CODE_ADDON, pool))) return res.status(403).json({ error: "L'add-on « Connecteur Etsy » n'est pas activé pour votre marketplace." });
    next();
  } catch (e) { console.error('[gestionnaire_etsy] add-on', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };
const masquer = (v) => { const c = lire(v); return c ? `${c.slice(0, 4)}••••${c.slice(-3)}` : null; };
const texte = (v) => (typeof v === 'string' ? v.trim() : '');
const SANS_ESPACE = /^[A-Za-z0-9_-]{8,100}$/;

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste); return true;
}
async function charger(gid) {
  await pool.query('INSERT INTO gestionnaire_etsy_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return (await pool.query('SELECT * FROM gestionnaire_etsy_config WHERE gestionnaire_id = $1', [gid])).rows[0];
}

router.get('/', async (req, res) => {
  try {
    const c = await charger(req.user.id);
    res.json({
      keystring_masque: masquer(c.keystring_chiffre), secret_masque: masquer(c.secret_chiffre),
      configure: !!(c.keystring_chiffre && c.secret_chiffre), verifie_le: c.verifie_le, url_retour: svc.URL_RETOUR,
    });
  } catch (e) { console.error('❌ GET etsy config :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/', async (req, res) => {
  try {
    const gid = req.user.id, b = req.body || {};
    await charger(gid);
    const sets = [], vals = [];
    const ajouter = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
    const keystring = texte(b.keystring), secret = texte(b.secret);
    if (keystring) { if (!SANS_ESPACE.test(keystring)) return res.status(400).json({ error: 'Keystring invalide : copiez-le en entier, sans espace.' }); ajouter('keystring_chiffre', chiffrer(keystring)); }
    if (secret) { if (!SANS_ESPACE.test(secret)) return res.status(400).json({ error: 'Shared secret invalide : copiez-le en entier, sans espace.' }); ajouter('secret_chiffre', chiffrer(secret)); }
    if (sets.length) {
      ajouter('verifie_le', null);
      vals.push(gid);
      await pool.query(`UPDATE gestionnaire_etsy_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`, vals);
      await svc.marquerReconnexionGestionnaire(gid);   // les jetons des collaborateurs ne valent que pour les anciennes clés
    }
    res.json({ ok: true });
  } catch (e) { console.error('❌ POST etsy config :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

// Appelle le « ping » d'Etsy avec la clé : prouve que le Keystring et le Shared secret sont valides.
router.post('/tester', async (req, res) => {
  try {
    const gid = req.user.id;
    if (!limite(`etsy-test-${gid}`, 6, 60 * 1000)) return res.status(429).json({ error: "Trop d'essais. Réessayez dans une minute." });
    const c = await charger(gid);
    const ks = lire(c.keystring_chiffre), sec = lire(c.secret_chiffre);
    if (!ks || !sec) return res.status(400).json({ error: "Enregistrez d'abord le Keystring et le Shared secret." });
    const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 15000);
    let r;
    try { r = await fetch(`${svc.API}/openapi-ping`, { headers: { 'x-api-key': `${ks}:${sec}` }, signal: ctrl.signal }); }
    catch (e) { return res.status(502).json({ error: "Impossible de joindre Etsy pour l'instant. Réessayez dans un moment." }); }
    finally { clearTimeout(delai); }
    if (r.ok) {
      await pool.query('UPDATE gestionnaire_etsy_config SET verifie_le = NOW() WHERE gestionnaire_id = $1', [gid]);
      return res.json({ ok: true, message: 'Etsy a accepté votre Keystring et votre Shared secret.' });
    }
    if (r.status === 401 || r.status === 403) return res.status(400).json({ error: "Etsy a refusé la clé. Vérifiez le Keystring et le Shared secret (même app Etsy), et que votre app est bien approuvée par Etsy." });
    res.status(400).json({ error: `Etsy a refusé la connexion (code ${r.status}).` });
  } catch (e) { console.error('❌ POST etsy tester :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/', async (req, res) => {
  try {
    await pool.query('UPDATE gestionnaire_etsy_config SET keystring_chiffre = NULL, secret_chiffre = NULL, verifie_le = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [req.user.id]);
    await svc.marquerReconnexionGestionnaire(req.user.id);
    res.json({ ok: true });
  } catch (e) { console.error('❌ DELETE etsy config :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

// Traitement des imports Etsy en arrière-plan (démarré une seule fois au chargement du serveur)
try { require('../services/studio_etsy_import').demarrer(); } catch (e) { console.error('Etsy import worker :', e.message); }

module.exports = router;