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
const { verifierCompteBloque, gererTentativeEchouee } = require('./authStudio');

// Cookie host-only (pas d'attribut domain) : chaque site (sous-domaine ou
// domaine perso) reçoit son cookie séparément, isolé automatiquement par le
// navigateur. Le nom du cookie est en plus scopé par gestionnaireId, pour
// gérer aussi le cas où plusieurs boutiques sont prévisualisées depuis le
// même host (ex: e-vendstudio.ca/site-preview?vendeurId=X en mode admin).
const EST_PRODUCTION = process.env.NODE_ENV === 'production';
function optionsCookieMarketplace() {
  return {
    httpOnly: true,
    secure: EST_PRODUCTION,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // pas de "domain" — host-only par design
  };
}
function nomCookieMarketplace(gestionnaireId) {
  return `mv_token_${gestionnaireId}`;
}

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

    // Clé de blocage scopée par boutique + type — un même email peut avoir
    // des comptes distincts sur plusieurs marketplaces, il ne faut pas que
    // le blocage sur l'une affecte les autres.
    const userTypeKey = `${type}_${gestionnaireId}`;
    const blocage = await verifierCompteBloque(email, userTypeKey);
    if (blocage) {
      return res.status(403).json({ blocked: true, message: blocage.message });
    }

    const table = type === 'acheteur' ? 'marketplace_acheteurs' : 'marketplace_collaborateurs';
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE gestionnaire_id = $1 AND email = $2`,
      [gestionnaireId, email]
    );

    if (result.rows.length === 0) {
      await gererTentativeEchouee(email, userTypeKey, null);
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect' });
    }

    const compte = result.rows[0];
    const motDePasseValide = await bcrypt.compare(password, compte.mot_de_passe);
    if (!motDePasseValide) {
      const nomCompte = type === 'acheteur' ? `${compte.prenom || ''} ${compte.nom || ''}`.trim() : compte.nom_responsable;
      await gererTentativeEchouee(email, userTypeKey, nomCompte);
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect' });
    }

    if (type === 'collaborateur' && compte.statut !== 'actif') {
      return res.status(403).json({ message: 'Votre compte collaborateur est encore en attente d\'approbation' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), userTypeKey]);

    const token = jwt.sign(
      { id: compte.id, type, gestionnaireId: Number(gestionnaireId) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie(nomCookieMarketplace(gestionnaireId), token, optionsCookieMarketplace());

    delete compte.mot_de_passe;
    res.json({ token, compte: { ...compte, type } });
  } catch (err) {
    console.error('Erreur login marketplace:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

// POST /:gestionnaireId/logout — efface le cookie de session marketplace
router.post('/:gestionnaireId/logout', (req, res) => {
  const { gestionnaireId } = req.params;
  res.clearCookie(nomCookieMarketplace(gestionnaireId), optionsCookieMarketplace());
  res.json({ success: true });
});

// ─── Middleware JWT marketplace ───────────────────────────────────────────────
// Priorité au cookie httpOnly (scopé par gestionnaireId), fallback header.
// 🔒 CORRECTIF SÉCURITÉ : vérifie aussi que le token appartient bien à la
// boutique demandée dans l'URL — avant, n'importe quel compte marketplace
// valide (peu importe la boutique) passait cette vérification, ce qui
// permettait à un acheteur/collaborateur de boutique A d'appeler les routes
// de boutique B en devinant/itérant des IDs numériques dans l'URL.
function authMarketplace(req, res, next) {
  const { gestionnaireId } = req.params;
  const cookieToken = req.cookies && req.cookies[nomCookieMarketplace(gestionnaireId)];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ message: 'Non authentifie' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.gestionnaireId !== Number(gestionnaireId)) {
      return res.status(403).json({ message: 'Ce compte n\'appartient pas à cette boutique.' });
    }

    req.mvUser = payload;
    next();
  } catch { res.status(401).json({ message: 'Token invalide ou expire' }); }
}

// ─── Profil acheteur ─────────────────────────────────────────────────────────
router.get('/:gestionnaireId/acheteurs/:acheteurId/profil', authMarketplace, async (req, res) => {
  try {
    const { gestionnaireId, acheteurId } = req.params;
    if (req.mvUser.type !== 'acheteur' || req.mvUser.id !== Number(acheteurId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'acheteur' || req.mvUser.id !== Number(acheteurId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'acheteur' || req.mvUser.id !== Number(acheteurId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'acheteur' || req.mvUser.id !== Number(acheteurId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'acheteur' || req.mvUser.id !== Number(acheteurId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'collaborateur' || req.mvUser.id !== Number(collabId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
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
    if (req.mvUser.type !== 'collaborateur' || req.mvUser.id !== Number(collabId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
    const r = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE type='acheteur') AS acheteurs, COUNT(*) FILTER (WHERE type='gestionnaire') AS gestionnaire, COUNT(*) AS total FROM marketplace_messages WHERE destinataire_id=$1 AND gestionnaire_id=$2 AND lu=false",
      [collabId, gestionnaireId]
    );
    const row = r.rows[0] || {};
    res.json({ acheteurs: parseInt(row.acheteurs||0), gestionnaire: parseInt(row.gestionnaire||0), total: parseInt(row.total||0) });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});