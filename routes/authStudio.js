// routes/authStudio.js
// e-Vend Studio — Authentification gestionnaires, administrateurs et commanditaires

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { genererLienPaiementPourGestionnaire } = require('./abonnements_studio');
const crypto = require('crypto');
let envoyerEmailModele = null;
try { ({ envoyerEmailModele } = require('../services/email')); }
catch (e) { console.warn('⚠️ services/email.js introuvable (F2A):', e.message); }

function genererCodeOtp() {
  return String(crypto.randomInt(100000, 999999));
}

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
      `SELECT id, email, mot_de_passe, nom, plan, statut, email_verifie, premiere_verification_faite, email_verification_expire, two_factor_enabled FROM gestionnaires WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    const gestionnaire = result.rows[0];

    if (gestionnaire.statut === 'suspendu') {
      return res.status(403).json({
        message: 'Votre compte a été suspendu par l\'équipe e-Vend Studio.',
        code: 'COMPTE_SUSPENDU',
      });
    }
    if (gestionnaire.statut === 'banni') {
      return res.status(403).json({
        message: 'Votre compte a été banni de la plateforme.',
        code: 'COMPTE_BANNI',
      });
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
        email_verifie: gestionnaire.email_verifie,
        premiere_verification_faite: gestionnaire.premiere_verification_faite,
        email_verification_expire: gestionnaire.email_verification_expire,
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
      'SELECT id, email, nom, plan, statut, email_verifie, premiere_verification_faite, email_verification_expire FROM gestionnaires WHERE id = $1',
      [payload.id]
    );
    if (r.rows.length === 0) return res.status(401).json({ valid: false });
    return res.json({ valid: true, user: { ...r.rows[0], role: 'gestionnaire' } });
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Token invalide ou expiré.' });
  }
});

// ─── POST /api/auth/mot-de-passe-oublie ──────────────────────────────────────
// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
// Body : { email, userType: 'gestionnaire' | 'administration' }
// Toujours répondre pareil, que le courriel existe ou non (ne pas révéler
// si un compte existe) — mais générer et envoyer un vrai lien quand il existe.
router.post('/forgot-password', async (req, res) => {
  const { email, userType } = req.body;
  if (!email || !userType) {
    return res.status(400).json({ message: 'Courriel requis.' });
  }

  const REPONSE_GENERIQUE = { success: true, message: 'Si ce courriel existe, un lien de réinitialisation vous a été envoyé.' };

  try {
    const table = userType === 'administration' ? 'admins' : 'gestionnaires';
    const result = await pool.query(`SELECT id, nom, email FROM ${table} WHERE email = $1`, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      // Ne pas révéler que le compte n'existe pas — même réponse que le succès.
      return res.json(REPONSE_GENERIQUE);
    }
    const compte = result.rows[0];

    const token = genererCodeOtp() + crypto.randomBytes(16).toString('hex'); // token plus long qu'un simple OTP
    const expire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await pool.query(
      `UPDATE ${table} SET reset_token = $1, reset_token_expire = $2 WHERE id = $3`,
      [token, expire, compte.id]
    );

    if (envoyerEmailModele) {
      const type = userType === 'administration' ? 'admin' : 'gestionnaire';
      const lien = `${process.env.FRONTEND_URL || 'https://e-vend.ca'}/reinitialiser-mot-de-passe?token=${token}&type=${type}`;
      envoyerEmailModele(7, compte.email, {
        nom_gestionnaire: compte.nom,
        lien_reinitialisation: lien,
      }).catch(e => console.error('Erreur envoi email #7 (réinitialisation):', e.message));
    }

    return res.json(REPONSE_GENERIQUE);
  } catch (err) {
    console.error('Erreur /api/auth/forgot-password:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
// Body : { token, type: 'admin' | 'gestionnaire', nouveau_mot_de_passe }
router.post('/reset-password', async (req, res) => {
  const { token, type, nouveau_mot_de_passe } = req.body;
  if (!token || !type || !nouveau_mot_de_passe) {
    return res.status(400).json({ message: 'Champs manquants.' });
  }
  if (nouveau_mot_de_passe.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const table = type === 'admin' ? 'admins' : 'gestionnaires';
    const result = await pool.query(
      `SELECT id, reset_token_expire FROM ${table} WHERE reset_token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Lien invalide ou déjà utilisé.' });
    }
    const compte = result.rows[0];
    if (!compte.reset_token_expire || new Date(compte.reset_token_expire) < new Date()) {
      return res.status(400).json({ message: 'Ce lien a expiré. Refaites une demande.' });
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 12);
    await pool.query(
      `UPDATE ${table} SET mot_de_passe = $1, reset_token = NULL, reset_token_expire = NULL WHERE id = $2`,
      [hash, compte.id]
    );

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('Erreur /api/auth/reset-password:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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
      `SELECT id, email, mot_de_passe, nom, plan, statut, email_verifie, premiere_verification_faite, email_verification_expire, two_factor_enabled FROM gestionnaires WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }
    const gestionnaire = result.rows[0];
    if (gestionnaire.statut === 'suspendu') {
      return res.status(403).json({
        message: 'Votre compte a été suspendu par l\'équipe e-Vend Studio.',
        code: 'COMPTE_SUSPENDU',
      });
    }
    if (gestionnaire.statut === 'banni') {
      return res.status(403).json({
        message: 'Votre compte a été banni de la plateforme.',
        code: 'COMPTE_BANNI',
      });
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

    // ── Authentification à deux facteurs ──
    if (gestionnaire.two_factor_enabled) {
      const code = genererCodeOtp();
      const expire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await pool.query(
        `UPDATE gestionnaires SET f2a_code = $1, f2a_code_expire = $2 WHERE id = $3`,
        [code, expire, gestionnaire.id]
      );
      if (envoyerEmailModele) {
        envoyerEmailModele(9, gestionnaire.email, {
          nom_gestionnaire: gestionnaire.nom,
          code_otp: code,
        }).catch(e => console.error('Erreur envoi email #9 (code OTP):', e.message));
      }
      return res.json({ requires2FA: true, userId: gestionnaire.id });
    }

    const token = genererToken({ id: gestionnaire.id, email: gestionnaire.email, role: 'gestionnaire', plan: gestionnaire.plan });
    return res.json({
      success: true, token,
      user: { id: gestionnaire.id, email: gestionnaire.email, nom: gestionnaire.nom, plan: gestionnaire.plan, statut: gestionnaire.statut, email_verifie: gestionnaire.email_verifie,
        premiere_verification_faite: gestionnaire.premiere_verification_faite,
        email_verification_expire: gestionnaire.email_verification_expire, role: 'gestionnaire' },
    });
  } catch (err) {
    console.error('Erreur /api/auth/login-studio:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/auth/login-admin → login admin
// ─── POST /api/auth/verify-2fa ────────────────────────────────────────────────
// Body : { userId, code, userType } — pour l'instant, seul userType='gestionnaire'
// est géré ici (F2A admin non demandé, à faire séparément si besoin).
router.post('/verify-2fa', async (req, res) => {
  const { userId, code, userType } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ message: 'Code requis.' });
  }

  try {
    if (userType === 'admin') {
      const result = await pool.query(
        `SELECT id, email, nom, role, f2a_code, f2a_code_expire FROM admins WHERE id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Compte introuvable.' });
      }
      const admin = result.rows[0];

      if (!admin.f2a_code || admin.f2a_code !== String(code).trim()) {
        return res.status(400).json({ message: 'Code invalide ou expiré.' });
      }
      if (!admin.f2a_code_expire || new Date(admin.f2a_code_expire) < new Date()) {
        return res.status(400).json({ message: 'Code invalide ou expiré.' });
      }

      await pool.query(`UPDATE admins SET f2a_code = NULL, f2a_code_expire = NULL WHERE id = $1`, [admin.id]);

      const token = genererToken({ id: admin.id, email: admin.email, role: 'admin' });
      return res.json({
        success: true, token,
        user: { id: admin.id, email: admin.email, nom: admin.nom, role: 'admin' },
      });
    }

    if (userType === 'commanditaire') {
      const result = await pool.query(
        `SELECT id, nom, email, type_sponsor, site_web, description, forfait, active, f2a_code, f2a_code_expire FROM sponsors WHERE id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Compte introuvable.' });
      }
      const commanditaire = result.rows[0];

      if (!commanditaire.f2a_code || commanditaire.f2a_code !== String(code).trim()) {
        return res.status(400).json({ message: 'Code invalide ou expiré.' });
      }
      if (!commanditaire.f2a_code_expire || new Date(commanditaire.f2a_code_expire) < new Date()) {
        return res.status(400).json({ message: 'Code invalide ou expiré.' });
      }

      await pool.query(`UPDATE sponsors SET f2a_code = NULL, f2a_code_expire = NULL WHERE id = $1`, [commanditaire.id]);

      const token = genererToken({
        id: commanditaire.id, email: commanditaire.email, role: 'commanditaire', type_sponsor: commanditaire.type_sponsor,
      });
      return res.json({
        success: true, token,
        user: {
          id: commanditaire.id, email: commanditaire.email, nom: commanditaire.nom, role: 'commanditaire',
          type_sponsor: commanditaire.type_sponsor, site_web: commanditaire.site_web,
          description: commanditaire.description, forfait: commanditaire.forfait, active: commanditaire.active,
        },
      });
    }

    if (userType !== 'gestionnaire') {
      return res.status(400).json({ message: 'Type de compte non supporté pour la F2A pour le moment.' });
    }

    const result = await pool.query(
      `SELECT id, email, nom, plan, statut, email_verifie, premiere_verification_faite, email_verification_expire,
              f2a_code, f2a_code_expire
       FROM gestionnaires WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }
    const gestionnaire = result.rows[0];

    if (!gestionnaire.f2a_code || gestionnaire.f2a_code !== String(code).trim()) {
      return res.status(400).json({ message: 'Code invalide ou expiré.' });
    }
    if (!gestionnaire.f2a_code_expire || new Date(gestionnaire.f2a_code_expire) < new Date()) {
      return res.status(400).json({ message: 'Code invalide ou expiré.' });
    }

    // Code valide : on le consomme (usage unique) et on émet le vrai token.
    await pool.query(
      `UPDATE gestionnaires SET f2a_code = NULL, f2a_code_expire = NULL WHERE id = $1`,
      [gestionnaire.id]
    );

    const token = genererToken({ id: gestionnaire.id, email: gestionnaire.email, role: 'gestionnaire', plan: gestionnaire.plan });
    return res.json({
      success: true, token,
      user: {
        id: gestionnaire.id, email: gestionnaire.email, nom: gestionnaire.nom, plan: gestionnaire.plan,
        statut: gestionnaire.statut, email_verifie: gestionnaire.email_verifie,
        premiere_verification_faite: gestionnaire.premiere_verification_faite,
        email_verification_expire: gestionnaire.email_verification_expire, role: 'gestionnaire',
      },
    });
  } catch (err) {
    console.error('Erreur /api/auth/verify-2fa:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/login-admin', async (req, res) => {
  const { code_utilisateur, mot_de_passe } = req.body;
  if (!code_utilisateur || !mot_de_passe) {
    return res.status(400).json({ message: 'Identifiants requis.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, role, two_factor_enabled FROM admins WHERE email = $1`,
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

    if (admin.two_factor_enabled) {
      const code = genererCodeOtp();
      const expire = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query(
        `UPDATE admins SET f2a_code = $1, f2a_code_expire = $2 WHERE id = $3`,
        [code, expire, admin.id]
      );
      if (envoyerEmailModele) {
        envoyerEmailModele(9, admin.email, {
          nom_gestionnaire: admin.nom,
          code_otp: code,
        }).catch(e => console.error('Erreur envoi email #9 (code OTP admin):', e.message));
      }
      return res.json({ requires2FA: true, userId: admin.id });
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
// ⚠️ NOTE : ModalLoginSponsor.tsx (le vrai formulaire de connexion) appelle
// POST /api/sponsors/login (routes/sponsors.js), pas cette route-ci. Celle-ci
// semble être un doublon legacy, comme /login-studio l'était pour les
// gestionnaires. La F2A est bien branchée dans routes/sponsors.js pour le
// flow réel — celle-ci est laissée par précaution, à confirmer/retirer.
router.post('/login-commanditaire', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Courriel et mot de passe requis.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, two_factor_enabled
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

    if (commanditaire.two_factor_enabled) {
      const code = genererCodeOtp();
      const expire = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query(
        `UPDATE sponsors SET f2a_code = $1, f2a_code_expire = $2 WHERE id = $3`,
        [code, expire, commanditaire.id]
      );
      if (envoyerEmailModele) {
        envoyerEmailModele(9, commanditaire.email, {
          nom_gestionnaire: commanditaire.nom,
          code_otp: code,
        }).catch(e => console.error('Erreur envoi email #9 (code OTP commanditaire):', e.message));
      }
      return res.json({ requires2FA: true, userId: commanditaire.id });
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