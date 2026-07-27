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

// ─── COOKIE OPTIONS: cookie httpOnly sécurisé pour le JWT ────────────────────
// En dev (localhost), un cookie avec domain=".e-vendstudio.ca" n'est jamais
// envoyé par le navigateur — on omet domain/secure pour que ça marche en local.
const EST_PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: EST_PRODUCTION,
  // 'lax' suffit et protège contre le CSRF : frontend et API sont sur le même
  // site (e-vendstudio.ca), pas besoin de 'none' (qui autorise l'envoi du
  // cookie depuis n'importe quel site tiers — inutile ici, et risqué).
  sameSite: 'lax',
  domain: EST_PRODUCTION ? '.e-vendstudio.ca' : undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
router.COOKIE_OPTIONS = COOKIE_OPTIONS; // ré-exporté pour admin_gestionnaires.js (impersonation)

// ═══════════════════════════════════════════════════════════════════════════
// 🔒 RATE LIMITING / ANTI-BRUTEFORCE — porté depuis evend-multivendeur
// (routes/auth.js) où ce système existe déjà et fonctionne. Studio avait le
// UI (UnlockAccountModal dans LoginPage.tsx) mais jamais le backend.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_TENTATIVES        = 5;
const FENETRE_RESET_MINUTES = 15; // au-delà, on repart le compteur à zéro
const DUREE_BLOCAGE_MINUTES = 10;

// Vérifie si le compte (email + userType) est actuellement bloqué.
// Retourne null si non bloqué, ou { message } si bloqué (à renvoyer tel quel).
async function verifierCompteBloque(email, userType) {
  const blockCheck = await pool.query(
    `SELECT blocked_until FROM login_attempts
     WHERE email = $1 AND user_type = $2 AND blocked_until > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email.toLowerCase(), userType]
  );
  if (blockCheck.rows.length === 0) return null;

  const blockedUntil = new Date(blockCheck.rows[0].blocked_until);
  const minutesLeft = Math.ceil((blockedUntil - new Date()) / 60000);
  return {
    message: `Compte bloqué pour cause de trop nombreuses tentatives. Veuillez réessayer dans ${minutesLeft} minute(s), ou débloquez-le avec le code envoyé par courriel.`,
  };
}

// Enregistre une tentative échouée. Au 5e échec dans la fenêtre de 15 minutes,
// bloque le compte 10 minutes et envoie un code de déblocage par courriel.
async function gererTentativeEchouee(email, userType, nom) {
  try {
    const emailLower = email.toLowerCase();
    const attemptRecord = await pool.query(
      `SELECT * FROM login_attempts WHERE email = $1 AND user_type = $2 ORDER BY id DESC LIMIT 1`,
      [emailLower, userType]
    );

    let attemptCount = 1;
    let recordId = null;

    if (attemptRecord.rows.length > 0) {
      const record = attemptRecord.rows[0];
      const minutesSinceLast = (Date.now() - new Date(record.last_attempt).getTime()) / 60000;

      if (minutesSinceLast > FENETRE_RESET_MINUTES) {
        await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [emailLower, userType]);
      } else {
        attemptCount = record.attempt_count + 1;
        recordId = record.id;
      }
    }

    if (recordId) {
      await pool.query(
        `UPDATE login_attempts SET attempt_count = $1, last_attempt = NOW() WHERE id = $2`,
        [attemptCount, recordId]
      );
    } else {
      const insertResult = await pool.query(
        `INSERT INTO login_attempts (email, user_type, attempt_count, last_attempt)
         VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [emailLower, userType, attemptCount]
      );
      recordId = insertResult.rows[0].id;
    }

    if (attemptCount >= MAX_TENTATIVES) {
      const otpCode = genererCodeOtp();
      const blockedUntil = new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60000);
      const codeExpiresAt = new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60000);

      await pool.query(
        `UPDATE login_attempts SET blocked_until = $1, unlock_code = $2, code_expires_at = $3 WHERE id = $4`,
        [blockedUntil, otpCode, codeExpiresAt, recordId]
      );

      if (envoyerEmailModele) {
        envoyerEmailModele(29, emailLower, {
          nom_utilisateur: nom || 'utilisateur',
          code_otp: otpCode,
        }).catch(e => console.error('Erreur envoi email #29 (déblocage compte):', e.message));
      }
    }
  } catch (err) {
    console.error('❌ Erreur gererTentativeEchouee:', err.message);
  }
}


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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);

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

  const userType = type === 'administration' ? 'admin' : type === 'commanditaire' ? 'commanditaire' : 'gestionnaire';

  try {
    // 🔒 Rate limiting : compte actuellement bloqué ?
    const blocage = await verifierCompteBloque(email, userType);
    if (blocage) {
      return res.status(403).json({ success: false, blocked: true, message: blocage.message });
    }

    // ── LOGIN ADMIN ──
    if (type === 'administration') {
      const result = await pool.query(
        `SELECT id, email, mot_de_passe, nom, role FROM admins WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        await gererTentativeEchouee(email, userType, null);
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const admin = result.rows[0];
      const valide = await bcrypt.compare(password, admin.mot_de_passe);
      if (!valide) {
        await gererTentativeEchouee(email, userType, admin.nom);
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), userType]);

      const token = genererToken({
        id:    admin.id,
        email: admin.email,
        role:  'admin',
      });
      res.cookie('evend_studio_token', token, COOKIE_OPTIONS);

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
        await gererTentativeEchouee(email, userType, null);
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      const commanditaire = result.rows[0];

      if (!commanditaire.active) {
        return res.status(403).json({ message: 'Votre compte est désactivé. Contactez le support.' });
      }

      const valide = await bcrypt.compare(password, commanditaire.mot_de_passe);
      if (!valide) {
        await gererTentativeEchouee(email, userType, commanditaire.nom);
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }

      await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), userType]);

      const token = genererToken({
        id:    commanditaire.id,
        email: commanditaire.email,
        role:  'commanditaire',
        type_sponsor: commanditaire.type_sponsor,
      });
      res.cookie('evend_studio_token', token, COOKIE_OPTIONS);

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
      await gererTentativeEchouee(email, userType, null);
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
      await gererTentativeEchouee(email, userType, gestionnaire.nom);
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), userType]);

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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);

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
  const cookieToken = req.cookies && req.cookies['evend_studio_token'];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token manquant.' });
  }

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
    const blocage = await verifierCompteBloque(email, 'gestionnaire');
    if (blocage) {
      return res.status(403).json({ success: false, blocked: true, message: blocage.message });
    }

    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, plan, statut, email_verifie, premiere_verification_faite, email_verification_expire, two_factor_enabled FROM gestionnaires WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      await gererTentativeEchouee(email, 'gestionnaire', null);
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
      await gererTentativeEchouee(email, 'gestionnaire', gestionnaire.nom);
      return res.status(401).json({ message: 'Courriel ou mot de passe incorrect.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), 'gestionnaire']);

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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);
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
      res.cookie('evend_studio_token', token, COOKIE_OPTIONS);
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
      res.cookie('evend_studio_token', token, COOKIE_OPTIONS);
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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);
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
    const blocage = await verifierCompteBloque(code_utilisateur, 'admin');
    if (blocage) {
      return res.status(403).json({ success: false, blocked: true, message: blocage.message });
    }

    const result = await pool.query(
      `SELECT id, email, mot_de_passe, nom, role, two_factor_enabled FROM admins WHERE email = $1`,
      [code_utilisateur.toLowerCase()]
    );
    if (result.rows.length === 0) {
      await gererTentativeEchouee(code_utilisateur, 'admin', null);
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }
    const admin = result.rows[0];
    const valide = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valide) {
      await gererTentativeEchouee(code_utilisateur, 'admin', admin.nom);
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [code_utilisateur.toLowerCase(), 'admin']);

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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);
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
    const blocage = await verifierCompteBloque(email, 'commanditaire');
    if (blocage) {
      return res.status(403).json({ success: false, blocked: true, message: blocage.message });
    }

    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, two_factor_enabled
       FROM sponsors WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      await gererTentativeEchouee(email, 'commanditaire', null);
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const commanditaire = result.rows[0];

    if (!commanditaire.active) {
      return res.status(403).json({ message: 'Votre compte est désactivé. Contactez le support.' });
    }

    const valide = await bcrypt.compare(mot_de_passe, commanditaire.mot_de_passe);
    if (!valide) {
      await gererTentativeEchouee(email, 'commanditaire', commanditaire.nom);
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), 'commanditaire']);

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
    res.cookie('evend_studio_token', token, COOKIE_OPTIONS);

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

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
// Efface le cookie httpOnly. Le frontend continue de faire son propre
// localStorage.removeItem('token') en parallèle tant que la migration
// complète du frontend n'est pas faite.
router.post('/logout', (req, res) => {
  res.clearCookie('evend_studio_token', {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    domain: COOKIE_OPTIONS.domain,
  });
  return res.json({ success: true, message: 'Déconnecté.' });
});

// ─── POST /api/auth/unlock-account ─────────────────────────────────────────
// Débloque un compte via le code envoyé par courriel (template #29).
// Note : LoginPage.tsx envoie userType='administration' (nom de l'onglet),
// alors que /login stocke 'admin' dans login_attempts.user_type — on
// normalise ici pour que les deux se rejoignent.
router.post('/unlock-account', async (req, res) => {
  try {
    const { email, userType, code } = req.body;
    if (!email || !userType || !code) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }
    const type = userType === 'administration' ? 'admin' : userType;

    const result = await pool.query(
      `SELECT * FROM login_attempts
       WHERE email = $1 AND user_type = $2 AND unlock_code = $3
       AND code_expires_at > NOW() AND blocked_until > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email.toLowerCase(), type, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Code invalide ou expiré.' });
    }

    await pool.query(`DELETE FROM login_attempts WHERE email = $1 AND user_type = $2`, [email.toLowerCase(), type]);

    return res.json({ success: true, message: 'Compte débloqué avec succès. Veuillez vous reconnecter.' });
  } catch (err) {
    console.error('❌ Erreur /api/auth/unlock-account:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─── POST /api/auth/resend-unlock-code ─────────────────────────────────────
// Renvoie un nouveau code de déblocage (prolonge aussi le blocage de 10 min,
// comme evend-multivendeur — évite qu'un renvoi laisse le compte se
// débloquer tout seul avant que le nouveau code arrive).
router.post('/resend-unlock-code', async (req, res) => {
  try {
    const { email, userType } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ success: false, message: 'Courriel requis.' });
    }
    const type = userType === 'administration' ? 'admin' : userType;
    const emailLower = email.toLowerCase();

    const result = await pool.query(
      `SELECT * FROM login_attempts WHERE email = $1 AND user_type = $2 AND blocked_until > NOW() ORDER BY id DESC LIMIT 1`,
      [emailLower, type]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun compte bloqué trouvé.' });
    }
    const record = result.rows[0];

    const newOtpCode = genererCodeOtp();
    const nouvelleExpiration = new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60000);

    await pool.query(
      `UPDATE login_attempts SET unlock_code = $1, code_expires_at = $2, blocked_until = $3 WHERE id = $4`,
      [newOtpCode, nouvelleExpiration, nouvelleExpiration, record.id]
    );

    const table = type === 'admin' ? 'admins' : type === 'commanditaire' ? 'sponsors' : 'gestionnaires';
    let nom = null;
    try {
      const userResult = await pool.query(`SELECT nom FROM ${table} WHERE email = $1`, [emailLower]);
      if (userResult.rows.length > 0) nom = userResult.rows[0].nom;
    } catch (e) { /* ignore — champ nom optionnel dans l'email */ }

    if (envoyerEmailModele) {
      try {
        await envoyerEmailModele(29, emailLower, { nom_utilisateur: nom || 'utilisateur', code_otp: newOtpCode });
      } catch (emailErr) {
        console.error('❌ Erreur renvoi email #29:', emailErr.message);
        return res.status(500).json({ success: false, message: "Erreur lors de l'envoi du code." });
      }
    }

    return res.json({ success: true, message: 'Un nouveau code a été envoyé par courriel.' });
  } catch (err) {
    console.error('❌ Erreur /api/auth/resend-unlock-code:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;