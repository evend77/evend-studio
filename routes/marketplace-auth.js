// routes/marketplace-auth.js
// e-Vend Studio — Authentification des comptes marketplace (acheteurs + vendeurs)
// Scope : chaque compte est rattache a un gestionnaire_id (le site sur lequel il est cree)
// A monter dans server.js : app.use('/api/marketplace', require('./routes/marketplace-auth'));

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/:gestionnaireId/acheteurs/inscription', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { prenom, nom, email, mot_de_passe, telephone, infolettre } = req.body;

    if (!prenom || !nom || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const existant = await pool.query(
      'SELECT id FROM marketplace_acheteurs WHERE gestionnaire_id = $1 AND email = $2',
      [gestionnaireId, email]
    );
    if (existant.rows.length > 0) {
      return res.status(409).json({ message: 'Un compte existe deja avec ce courriel' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const result = await pool.query(
      `INSERT INTO marketplace_acheteurs (gestionnaire_id, prenom, nom, email, mot_de_passe, telephone, infolettre)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, prenom, nom, email`,
      [gestionnaireId, prenom, nom, email, hash, telephone || null, !!infolettre]
    );

    res.status(201).json({ acheteur: result.rows[0] });
  } catch (err) {
    console.error('Erreur inscription acheteur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/:gestionnaireId/collaborateurs/inscription', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { nom_responsable, nom_boutique, email, mot_de_passe, telephone, type_entreprise } = req.body;

    if (!nom_responsable || !nom_boutique || !email || !mot_de_passe || !type_entreprise) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const existant = await pool.query(
      'SELECT id FROM marketplace_collaborateurs WHERE gestionnaire_id = $1 AND email = $2',
      [gestionnaireId, email]
    );
    if (existant.rows.length > 0) {
      return res.status(409).json({ message: 'Une demande existe deja avec ce courriel' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const result = await pool.query(
      `INSERT INTO marketplace_collaborateurs (gestionnaire_id, nom_responsable, nom_boutique, email, mot_de_passe, telephone, type_entreprise, statut)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id, nom_boutique, email, statut`,
      [gestionnaireId, nom_responsable, nom_boutique, email, hash, telephone || null, type_entreprise]
    );

    res.status(201).json({ collaborateur: result.rows[0] });
  } catch (err) {
    console.error('Erreur inscription collaborateur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/:gestionnaireId/login', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { type, email, password } = req.body;

    if (!type || !email || !password) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    if (type !== 'acheteur' && type !== 'collaborateur') {
      return res.status(400).json({ message: 'Type de compte invalide' });
    }

    const table = type === 'acheteur' ? 'marketplace_acheteurs' : 'marketplace_collaborateurs';
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE gestionnaire_id = $1 AND email = $2`,
      [gestionnaireId, email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect' });
    }

    const compte = result.rows[0];
    const motDePasseValide = await bcrypt.compare(password, compte.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect' });
    }

    if (type === 'collaborateur' && compte.statut !== 'actif') {
      return res.status(403).json({ message: 'Votre compte collaborateur est encore en attente d\'approbation' });
    }

    const token = jwt.sign(
      { id: compte.id, type, gestionnaireId: Number(gestionnaireId) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete compte.mot_de_passe;
    res.json({ token, compte: { ...compte, type } });
  } catch (err) {
    console.error('Erreur login marketplace:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

// ─── Middleware JWT marketplace ───────────────────────────────────────────────
function authMarketplace(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Non authentifie' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.mvUser = payload;
    next();
  } catch { res.status(401).json({ message: 'Token invalide ou expire' }); }
}

// ─── Profil acheteur ─────────────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/profil', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    const r = await pool.query(
      'SELECT id, prenom, nom, email, telephone, infolettre, created_at FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2',
      [acheteurId, gestionnaireId]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Acheteur introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Stats acheteur ───────────────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/stats', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    const [total, enCours, livrees, depense] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM marketplace_commandes WHERE acheteur_id=$1 AND gestionnaire_id=$2', [acheteurId, gestionnaireId]),
      pool.query("SELECT COUNT(*) FROM marketplace_commandes WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND statut NOT IN ('livree','annulee')", [acheteurId, gestionnaireId]),
      pool.query("SELECT COUNT(*) FROM marketplace_commandes WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND statut='livree'", [acheteurId, gestionnaireId]),
      pool.query('SELECT COALESCE(SUM(total),0) AS total FROM marketplace_commandes WHERE acheteur_id=$1 AND gestionnaire_id=$2', [acheteurId, gestionnaireId]),
    ]);
    res.json({
      commandes_total:    parseInt(total.rows[0].count),
      commandes_en_cours: parseInt(enCours.rows[0].count),
      commandes_livrees:  parseInt(livrees.rows[0].count),
      total_depense:      parseFloat(depense.rows[0].total),
    });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Commandes acheteur ───────────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/commandes', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    const r = await pool.query(
      'SELECT id, numero_commande, date_commande, statut, total FROM marketplace_commandes WHERE acheteur_id=$1 AND gestionnaire_id=$2 ORDER BY date_commande DESC LIMIT 50',
      [acheteurId, gestionnaireId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Messages acheteur ────────────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/messages', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    const r = await pool.query(
      'SELECT id, expediteur_nom, contenu, date_envoi AS date, lu, type FROM marketplace_messages WHERE destinataire_id=$1 AND gestionnaire_id=$2 ORDER BY date_envoi DESC LIMIT 20',
      [acheteurId, gestionnaireId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Notifications acheteur ───────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/notifications', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    const r = await pool.query(
      'SELECT id, titre, message, created_at AS date, lu FROM marketplace_notifications WHERE acheteur_id=$1 AND gestionnaire_id=$2 ORDER BY created_at DESC LIMIT 30',
      [acheteurId, gestionnaireId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Stats collaborateur ──────────────────────────────────────────────────────
router.get('/:gestionnaireId/collaborateurs/:collabId/stats', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, collabId } = req.params;
    const [total, enAttente, livrees, revenus, produits, actifs, rupture, avis] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [collabId, gestionnaireId]),
      pool.query("SELECT COUNT(*) FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2 AND statut='en_attente'", [collabId, gestionnaireId]),
      pool.query("SELECT COUNT(*) FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2 AND statut='livree'", [collabId, gestionnaireId]),
      pool.query('SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(CASE WHEN date_commande >= NOW() - INTERVAL \'30 days\' THEN total ELSE 0 END),0) AS mois FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [collabId, gestionnaireId]),
      pool.query('SELECT COUNT(*) FROM produits WHERE vendeur_id=$1', [collabId]),
      pool.query("SELECT COUNT(*) FROM produits WHERE vendeur_id=$1 AND statut='actif'", [collabId]),
      pool.query("SELECT COUNT(*) FROM produits WHERE vendeur_id=$1 AND stock=0", [collabId]),
      pool.query('SELECT COALESCE(AVG(note),0) AS moyenne, COUNT(*) AS total FROM avis_gestionnaire WHERE gestionnaire_id=$2 AND cible_id=$1', [collabId, gestionnaireId]),
    ]);
    const ventes30j = await pool.query(
      "SELECT TO_CHAR(date_commande,'MM-DD') AS date, COALESCE(SUM(total),0) AS ventes FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2 AND date_commande >= NOW() - INTERVAL '30 days' GROUP BY TO_CHAR(date_commande,'MM-DD') ORDER BY date",
      [collabId, gestionnaireId]
    );
    res.json({
      revenus: { total: parseFloat(revenus.rows[0].total), mois: parseFloat(revenus.rows[0].mois), aujourdhui: 0 },
      commandes: { total: parseInt(total.rows[0].count), en_attente: parseInt(enAttente.rows[0].count), expediees: 0, livrees: parseInt(livrees.rows[0].count) },
      produits: { total: parseInt(produits.rows[0].count), actifs: parseInt(actifs.rows[0].count), en_rupture: parseInt(rupture.rows[0].count) },
      avis: { moyenne: parseFloat(avis.rows[0].moyenne), total: parseInt(avis.rows[0].total) },
      graphiques: { ventes30j: ventes30j.rows },
    });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ─── Messages non-lus collaborateur ──────────────────────────────────────────
router.get('/:gestionnaireId/collaborateurs/:collabId/messages/non-lus', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, collabId } = req.params;
    const r = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE type='acheteur') AS acheteurs, COUNT(*) FILTER (WHERE type='gestionnaire') AS gestionnaire, COUNT(*) AS total FROM marketplace_messages WHERE destinataire_id=$1 AND gestionnaire_id=$2 AND lu=false",
      [collabId, gestionnaireId]
    );
    const row = r.rows[0] || {};
    res.json({ acheteurs: parseInt(row.acheteurs||0), gestionnaire: parseInt(row.gestionnaire||0), total: parseInt(row.total||0) });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});