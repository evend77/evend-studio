// routes/authStudio.js
// e-Vend Studio — Authentification gestionnaires, administrateurs et commanditaires

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { genererLienPaiementPourGestionnaire } = require('./abonnements_studio');

const JWT_SECRET  = process.env.JWT_SECRET  || 'evend-studio-secret-change-en-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ─── UTILITAIRE: générer un token JWT ────────────────────────────────────────
function genererToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ─── POST /api/auth/inscription ──────────────────────────────────────────────
// Inscription d'un nouveau gestionnaire Studio
router.post('/inscription', async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }
  if (mot_de_passe.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit avoir au moins 8 caractères.' });
  }

  try {
    const existe = await pool.query('SELECT id FROM gestionnaires WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ message: 'Cette adresse courriel est déjà utilisée.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);

    const result = await pool.query(
      `INSERT INTO gestionnaires (email, mot_de_passe, nom, plan, statut)
       VALUES ($1, $2, $3, 'gratuit', 'actif')
       RETURNING id, email, nom, plan, statut, created_at`,
      [email.toLowerCase(), hash, nom.trim()]
    );
    const gestionnaire = result.rows[0];

    const slug = nom.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + gestionnaire.id;

    await pool.query(
      `INSERT INTO sites (gestionnaire_id, slug, template_id, sous_type, publie, config)
       VALUES ($1, $2, 'vitrine', 'portfolio', false, '{}')`,
      [gestionnaire.id, slug]
    );

    const token = genererToken({
      id:    gestionnaire.id,
      email: gestionnaire.email,
      role:  'gestionnaire',
      plan:  gestionnaire.plan,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      token,
      user: {
        id:     gestionnaire.id,
        email:  gestionnaire.email,
        nom:    gestionnaire.nom,
        plan:   gestionnaire.plan,
        statut: gestionnaire.statut,
        role:   'gestionnaire',
      },
    });
  } catch (err) {
    console.error('Erreur /api/auth/inscription:', err);
    return res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer.' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
// Connexion gestionnaire, admin ou commanditaire selon le champ "type"
router.post('/login', async (req, res) => {
  const { email, password, type } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Courriel et mot de passe requis.' });
  }

  try {
    // ── LOGIN ADMIN ──
    if (type === 'administration') {
      const result = await pool.query(
        `SELECT id, email, mot_de_passe, nom, role FROM admins WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const admin = result.rows[0];
      const valide = await bcrypt.compare(password, admin.mot_de_passe);
      if (!valide) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const token = genererToken({
        id:    admin.id,
        email: admin.email,
        role:  'admin',
      });

      return res.json({
        success: true,
        token,
        user: {
          id:    admin.id,
          email: admin.email,
          nom:   admin.nom,
          role:  'admin',
        },
      });
    }

    // ── LOGIN COMMANDITAIRE ──
    if (type === 'commanditaire') {
      const result = await pool.query(
        `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active
         FROM sponsors WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const commanditaire = result.rows[0];

      if (!commanditaire.active) {
        return res.status(403).json({ message: 'Votre compte est désactivé. Contactez le support.' });
      }

      const valide = await bcrypt.compare(password, commanditaire.mot_de_passe);
      if (!valide) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const token = genererToken({
        id:    commanditaire.id,
        email: commanditaire.email,
        role:  'commanditaire',
        type_sponsor: commanditaire.type_sponsor,
      });

      return res.json({
        success: true,
        token,
        user: {
          id:    commanditaire.id,
          email: commanditaire.email,
          nom:   commanditaire.nom,
          role:  'commanditaire',
          type_sponsor: commanditaire.type_sponsor,
          site_web: commanditaire.site_web,
          description: commanditaire.description,
          forfait: commanditaire.forfait,
          active: commanditaire.active,
        },
      });
    }

    // ── LOGIN GESTIONNAIRE (défaut) ──
    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, plan, statut FROM gestionnaires WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    const gestionnaire = result.rows[0];

    if (gestionnaire.statut === 'suspendu') {
      return res.status(403).json({ message: 'Votre compte est suspendu. Contactez le support.' });
    }

    const valide = await bcrypt.compare(password, gestionnaire.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    if (gestionnaire.statut === 'expire' || gestionnaire.statut === 'a_supprimer') {
      try {
        const urlPaiement = await genererLienPaiementPourGestionnaire(gestionnaire.id);
        return res.status(402).json({
          compte_expire: true,
          message: 'Votre période d\'essai est terminée. Configurez votre paiement pour continuer.',
          url_paiement: urlPaiement,
        });
      } catch (e) {
        console.error('Erreur génération lien paiement (login):', e.message);
        return res.status(402).json({
          compte_expire: true,
          message: 'Votre période d\'essai est terminée. Contactez le support pour régulariser votre compte.',
        });
      }
    }

    const token = genererToken({
      id:    gestionnaire.id,
      email: gestionnaire.email,
      role:  'gestionnaire',
      plan:  gestionnaire.plan,
    });

    return res.json({
      success: true,
      token,
      user: {
        id:     gestionnaire.id,
        email:  gestionnaire.email,
        nom:    gestionnaire.nom,
        plan:   gestionnaire.plan,
        statut: gestionnaire.statut,
        role:   'gestionnaire',
      },
    });
  } catch (err) {
    console.error('Erreur /api/auth/login:', err);
    return res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer.' });
  }
});

// ─── GET /api/auth/verify ────────────────────────────────────────────────────
// Vérifier si le token est encore valide (admin, gestionnaire ou commanditaire)
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // ── ADMIN ──
    if (payload.role === 'admin') {
      const r = await pool.query('SELECT id, email, nom FROM admins WHERE id = $1', [payload.id]);
      if (r.rows.length === 0) return res.status(401).json({ valid: false });
      return res.json({ valid: true, user: { ...r.rows[0], role: 'admin' } });
    }

    // ── COMMANDITAIRE ──
    if (payload.role === 'commanditaire') {
      const r = await pool.query(
        `SELECT id, nom, email, site_web, description, forfait, type_sponsor, active
         FROM sponsors WHERE id = $1`,
        [payload.id]
      );
      if (r.rows.length === 0) return res.status(401).json({ valid: false });
      if (!r.rows[0].active) return res.status(401).json({ valid: false, message: 'Compte désactivé.' });
      return res.json({ valid: true, user: { ...r.rows[0], role: 'commanditaire' } });
    }

    // ── GESTIONNAIRE (ou ancien token 'vendeur') ──
    const r = await pool.query(
      'SELECT id, email, nom, plan, statut FROM gestionnaires WHERE id = $1',
      [payload.id]
    );
    if (r.rows.length === 0) return res.status(401).json({ valid: false });
    return res.json({ valid: true, user: { ...r.rows[0], role: 'gestionnaire' } });
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Token invalide ou expiré.' });
  }
});

// ─── POST /api/auth/mot-de-passe-oublie ──────────────────────────────────────
router.post('/mot-de-passe-oublie', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Courriel requis.' });

  console.log(`[Mot de passe oublié] Demande pour: ${email}`);
  return res.json({ success: true, message: 'Si ce courriel existe, un lien vous sera envoyé.' });
});

// ─── ALIAS pour compatibilité ─────────────────────────────────────────────────

// POST /api/auth/login-studio → login gestionnaire
router.post('/login-studio', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Courriel et mot de passe requis.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, plan, statut FROM gestionnaires WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }
    const gestionnaire = result.rows[0];
    if (gestionnaire.statut === 'suspendu') {
      return res.status(403).json({ message: 'Votre compte est suspendu. Contactez le support.' });
    }
    const valide = await bcrypt.compare(mot_de_passe, gestionnaire.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    if (gestionnaire.statut === 'expire' || gestionnaire.statut === 'a_supprimer') {
      try {
        const urlPaiement = await genererLienPaiementPourGestionnaire(gestionnaire.id);
        return res.status(402).json({
          compte_expire: true,
          message: 'Votre période d\'essai est terminée. Configurez votre paiement pour continuer.',
          url_paiement: urlPaiement,
        });
      } catch (e) {
        console.error('Erreur génération lien paiement (login-studio):', e.message);
        return res.status(402).json({
          compte_expire: true,
          message: 'Votre période d\'essai est terminée. Contactez le support pour régulariser votre compte.',
        });
      }
    }

    const token = genererToken({ id: gestionnaire.id, email: gestionnaire.email, role: 'gestionnaire', plan: gestionnaire.plan });
    return res.json({
      success: true, token,
      user: { id: gestionnaire.id, email: gestionnaire.email, nom: gestionnaire.nom, plan: gestionnaire.plan, statut: gestionnaire.statut, role: 'gestionnaire' },
    });
  } catch (err) {
    console.error('Erreur /api/auth/login-studio:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/auth/login-admin → login admin
router.post('/login-admin', async (req, res) => {
  const { code_utilisateur, mot_de_passe } = req.body;
  if (!code_utilisateur || !mot_de_passe) {
    return res.status(400).json({ message: 'Identifiants requis.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, role FROM admins WHERE email = $1`,
      [code_utilisateur.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }
    const admin = result.rows[0];
    const valide = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }
    const token = genererToken({ id: admin.id, email: admin.email, role: 'admin' });
    return res.json({
      success: true, token,
      user: { id: admin.id, email: admin.email, nom: admin.nom, role: 'admin' },
    });
  } catch (err) {
    console.error('Erreur /api/auth/login-admin:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/auth/login-commanditaire ──────────────────────────────────────
// Connexion commanditaire (alias)
router.post('/login-commanditaire', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Courriel et mot de passe requis.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active
       FROM sponsors WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const commanditaire = result.rows[0];

    if (!commanditaire.active) {
      return res.status(403).json({ message: 'Votre compte est désactivé. Contactez le support.' });
    }

    const valide = await bcrypt.compare(mot_de_passe, commanditaire.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = genererToken({
      id:    commanditaire.id,
      email: commanditaire.email,
      role:  'commanditaire',
      type_sponsor: commanditaire.type_sponsor,
    });

    return res.json({
      success: true,
      token,
      user: {
        id:    commanditaire.id,
        email: commanditaire.email,
        nom:   commanditaire.nom,
        role:  'commanditaire',
        type_sponsor: commanditaire.type_sponsor,
        site_web: commanditaire.site_web,
        description: commanditaire.description,
        forfait: commanditaire.forfait,
        active: commanditaire.active,
      },
    });
  } catch (err) {
    console.error('Erreur /api/auth/login-commanditaire:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;