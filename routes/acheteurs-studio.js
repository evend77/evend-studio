// routes/acheteurs-studio.js
// e-Vend Studio — Gestion des acheteurs par site

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const sec = require('../services/studio_securite_inscription');

// 🔒 Routes « vendeur » : le rôle doit être gestionnaire. Sans ça, un jeton d'acheteur dont le numéro égale celui du
// gestionnaire listait les acheteurs (courriels, téléphones) de ce gestionnaire.
function exigerGestionnaire(req, res, next) {
  const r = req.user && req.user.role;
  if (r === 'gestionnaire' || r === 'admin' || r === 'administration') return next();
  return res.status(403).json({ message: 'Accès non autorisé.' });
}
const { verifierCompteBloque, gererTentativeEchouee } = require('./authStudio');

// Cookie host-only, scopé par site — cohérent avec le système marketplace.
const EST_PRODUCTION = process.env.NODE_ENV === 'production';
function optionsCookieAcheteur() {
  return {
    httpOnly: true,
    secure: EST_PRODUCTION,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
function nomCookieAcheteur(siteId) {
  return `acheteur_studio_token_${siteId}`;
}

// ─── Helper token acheteur ────────────────────────────────────────────────────
function genererTokenAcheteur(acheteur) {
  return jwt.sign(
    { id: acheteur.id, email: acheteur.email, site_id: acheteur.site_id, role: 'acheteur' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ─── POST /api/acheteurs-studio/inscription ───────────────────────────────────
router.post('/inscription', async (req, res) => {
  const R = req.body && typeof req.body === 'object' ? req.body : {};
  const ip = sec.ipClient(req);
  // 🔒 Champ piège, limites par IP (15 essais et 3 comptes par heure) et par site (60 comptes par heure), types vérifiés.
  // (Jeton anti-robot signé : à ajouter quand la page d'inscription qui appelle cette route sera fournie.)
  if (typeof R.website === 'string' && R.website !== '') {
    return res.status(201).json({ success: true });
  }
  const siteId = Number(R.site_id);
  if (!Number.isInteger(siteId) || siteId <= 0) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  if (sec.depasse('astu:ip:' + ip + ':essais', 15) || sec.depasse('astu:ip:' + ip + ':ok', 3) || sec.depasse('astu:site:' + siteId + ':ok', 60)) {
    return res.status(429).json({ message: "Trop de tentatives d'inscription. Réessayez plus tard." });
  }
  sec.noter('astu:ip:' + ip + ':essais');
  if (typeof R.nom !== 'string' || typeof R.email !== 'string' || typeof R.mot_de_passe !== 'string') {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  const site_id = siteId;
  const nom = sec.validerNomPersonne(R.nom, 100);
  const prenom = typeof R.prenom === 'string' && R.prenom.trim() ? sec.validerNomPersonne(R.prenom, 100) : null;
  const email = sec.validerCourriel(R.email);
  const mot_de_passe = R.mot_de_passe;
  const tel = sec.validerTelephone(typeof R.telephone === 'string' ? R.telephone : '');
  const telephone = tel.ok ? tel.valeur : null;
  if (!nom || !email || (R.prenom && String(R.prenom).trim() && !prenom)) {
    return res.status(400).json({ message: 'Nom ou adresse courriel invalide.' });
  }
  const erreurMdp = sec.validerMotDePasse(mot_de_passe);
  if (erreurMdp) return res.status(400).json({ message: erreurMdp });
  try {
    const siteInfo = await pool.query('SELECT gestionnaire_id FROM sites WHERE id = $1', [site_id]);
    if (!siteInfo.rows.length) return res.status(404).json({ message: 'Site introuvable.' });

    const existe = await pool.query(
      'SELECT id FROM acheteurs_studio WHERE site_id = $1 AND LOWER(email) = $2',
      [site_id, email]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    const result = await pool.query(
      `INSERT INTO acheteurs_studio (site_id, vendeur_id, prenom, nom, email, mot_de_passe, telephone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, prenom, nom, email, site_id, statut`,
      [site_id, siteInfo.rows[0]?.gestionnaire_id, prenom || null, nom, email, hash, telephone]
    );
    sec.noter('astu:ip:' + ip + ':ok'); sec.noter('astu:site:' + site_id + ':ok');

    const acheteur = result.rows[0];
    const token = genererTokenAcheteur(acheteur);
    res.cookie(nomCookieAcheteur(site_id), token, optionsCookieAcheteur());
    res.status(201).json({ success: true, token, acheteur });
  } catch (err) {
    if (err && err.code === '23505') return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    console.error('POST inscription acheteur:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/acheteurs-studio/connexion ────────────────────────────────────
router.post('/connexion', async (req, res) => {
  const { site_id, email, mot_de_passe } = req.body || {};
  if (!site_id || typeof email !== 'string' || typeof mot_de_passe !== 'string' || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  const userTypeKey = `acheteur_studio_${site_id}`;
  try {
    const blocage = await verifierCompteBloque(email, userTypeKey);
    if (blocage) {
      return res.status(403).json({ blocked: true, message: blocage.message });
    }

    const result = await pool.query(
      'SELECT * FROM acheteurs_studio WHERE site_id = $1 AND LOWER(email) = $2',
      [site_id, email.toLowerCase()]
    );
    if (!result.rows.length) {
      await gererTentativeEchouee(email, userTypeKey, null);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const acheteur = result.rows[0];
    if (acheteur.statut === 'suspendu') {
      return res.status(403).json({ message: 'Votre compte est suspendu.' });
    }
    const valide = await bcrypt.compare(mot_de_passe, acheteur.mot_de_passe);
    if (!valide) {
      await gererTentativeEchouee(email, userTypeKey, `${acheteur.prenom || ''} ${acheteur.nom || ''}`.trim());
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), userTypeKey]);

    await pool.query(
      'UPDATE acheteurs_studio SET derniere_connexion = NOW() WHERE id = $1',
      [acheteur.id]
    );

    const token = genererTokenAcheteur(acheteur);
    res.cookie(nomCookieAcheteur(site_id), token, optionsCookieAcheteur());
    res.json({
      success: true, token,
      acheteur: { id: acheteur.id, prenom: acheteur.prenom, nom: acheteur.nom, email: acheteur.email, site_id: acheteur.site_id }
    });
  } catch (err) {
    console.error('POST connexion acheteur:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/acheteurs-studio/deconnexion ──────────────────────────────────
router.post('/deconnexion', (req, res) => {
  const { site_id } = req.body;
  if (site_id) res.clearCookie(nomCookieAcheteur(site_id), optionsCookieAcheteur());
  res.json({ success: true });
});

// ─── GET /api/acheteurs-studio/moi ───────────────────────────────────────────
router.get('/moi', async (req, res) => {
  const { site_id } = req.query;
  const cookieToken = site_id && req.cookies && req.cookies[nomCookieAcheteur(site_id)];
  const headerToken = req.headers.authorization?.split(' ')[1];
  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: 'Non authentifié.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, prenom, nom, email, telephone, adresse, ville, province, code_postal, statut, created_at FROM acheteurs_studio WHERE id = $1',
      [payload.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Acheteur non trouvé.' });
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ message: 'Token invalide.' });
  }
});

// ─── GET /api/acheteurs-studio/mes-commandes ─────────────────────────────────
router.get('/mes-commandes', async (req, res) => {
  const { site_id } = req.query;
  const cookieToken = site_id && req.cookies && req.cookies[nomCookieAcheteur(site_id)];
  const headerToken = req.headers.authorization?.split(' ')[1];
  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: 'Non authentifié.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      `SELECT id, produit_nom, variante, quantite, total, statut, created_at, stripe_payment_intent
       FROM commandes_studio WHERE acheteur_id = $1 ORDER BY created_at DESC`,
      [payload.id]
    );
    res.json({ commandes: result.rows });
  } catch {
    res.status(401).json({ message: 'Token invalide.' });
  }
});

// ─── GET /api/acheteurs-studio/vendeur — liste pour le vendeur ───────────────
router.get('/vendeur', authenticateToken, exigerGestionnaire, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.json({ acheteurs: [], total: 0 });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `SELECT a.id, a.prenom, a.nom, a.email, a.telephone, a.statut,
              a.created_at, a.derniere_connexion,
              COUNT(c.id) as nb_commandes,
              COALESCE(SUM(c.total), 0) as total_achats
       FROM acheteurs_studio a
       LEFT JOIN commandes_studio c ON c.acheteur_id = a.id
       WHERE a.site_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [siteId]
    );
    res.json({ acheteurs: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET acheteurs gestionnaire:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/acheteurs-studio/:id/statut ────────────────────────────────────
router.put('/:id/statut', authenticateToken, exigerGestionnaire, async (req, res) => {
  const { statut } = req.body;
  if (!['actif', 'suspendu'].includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });
  try {
    await pool.query(
      `UPDATE acheteurs_studio SET statut = $1
       WHERE id = $2 AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $3)`,
      [statut, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── GET /api/acheteurs-studio/:id/commandes ─────────────────────────────────
router.get('/:id/commandes', authenticateToken, exigerGestionnaire, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM commandes_studio
       WHERE acheteur_id = $1
       AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $2)
       ORDER BY created_at DESC`,
      [req.params.id, req.user.id]
    );
    res.json({ commandes: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;