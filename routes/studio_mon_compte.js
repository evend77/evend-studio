// routes/studio_mon_compte.js
//
// GET  /api/studio/mon-compte/:gestionnaireId         — charger le profil complet
// PUT  /api/studio/mon-compte/:gestionnaireId         — sauvegarder le profil
// PUT  /api/studio/mon-compte/:gestionnaireId/mot-de-passe — changer le mot de passe
// POST /api/studio/mon-compte/:gestionnaireId/logo    — uploader le logo vers S3
// POST /api/studio/mon-compte/:gestionnaireId/banniere — uploader la bannière vers S3

const express  = require('express');
const router   = express.Router({ mergeParams: true });
const pool     = require('../db');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const multer   = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path     = require('path');
const { authenticateToken } = require('../middleware/auth');

let envoyerEmailModele = null;
try {
  ({ envoyerEmailModele } = require('../services/email'));
} catch (e) {
  console.warn('⚠️ services/email.js introuvable — courriel de vérification non envoyé:', e.message);
}

// ─── S3 ───────────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Format non supporté. JPG, PNG, GIF, WebP seulement.'), ok);
  },
});

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper upload S3 ─────────────────────────────────────────────────────────
async function uploadVersS3(file, gestionnaireId, type) {
  const ext   = path.extname(file.originalname).toLowerCase() || '.jpg';
  const s3Key = `studio/comptes/gestionnaire_${gestionnaireId}_${type}_${uuidv4()}${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         s3Key,
    Body:        file.buffer,
    ContentType: file.mimetype,
  }));
  return {
    url:    `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`,
    s3Key,
  };
}

async function supprimerS3(urlActuelle) {
  if (!urlActuelle || !BUCKET) return;
  try {
    // Extraire la clé S3 depuis l'URL
    const url    = new URL(urlActuelle);
    const s3Key  = url.pathname.slice(1); // retire le slash initial
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  } catch (e) {
    console.warn('⚠️ Impossible de supprimer l\'ancienne image S3 :', e.message);
  }
}

// =============================================================================
// GET /api/studio/mon-compte/:gestionnaireId
// Charger le profil complet du gestionnaire
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT
         id, email, email_verifie, nom, nom_boutique, telephone,
         num_civique, rue, ville, province, code_postal, pays,
         logo_url, banniere_url, description,
         politique_retours, politique_livraison,
         type_entreprise, est_entreprise, province_entreprise,
         num_entreprise, no_tps, no_taxe_provinciale,
         taux_tps, taux_provincial,
         jours_remboursement, latitude, longitude,
         plan, statut, created_at, updated_at
       FROM gestionnaires
       WHERE id = $1`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire introuvable.' });
    res.set('Cache-Control', 'no-store');
    res.json({ vendeur: result.rows[0] });
  } catch (err) {
    console.error('GET /studio/mon-compte/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/mon-compte/:gestionnaireId
// Sauvegarder le profil du gestionnaire (sans mot de passe, sans logo/bannière)
// =============================================================================
router.put('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const {
    nom, nom_boutique, telephone,
    num_civique, rue, ville, province, code_postal, pays,
    description, politique_retours, politique_livraison,
    type_entreprise, est_entreprise, province_entreprise,
    num_entreprise, no_tps, no_taxe_provinciale,
    taux_tps, taux_provincial,
    jours_remboursement, latitude, longitude,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE gestionnaires SET
         nom                  = COALESCE($1,  nom),
         nom_boutique         = COALESCE($2,  nom_boutique),
         telephone            = COALESCE($3,  telephone),
         num_civique          = COALESCE($4,  num_civique),
         rue                  = COALESCE($5,  rue),
         ville                = COALESCE($6,  ville),
         province             = COALESCE($7,  province),
         code_postal          = COALESCE($8,  code_postal),
         pays                 = COALESCE($9,  pays),
         description          = COALESCE($10, description),
         politique_retours    = COALESCE($11, politique_retours),
         politique_livraison  = COALESCE($12, politique_livraison),
         type_entreprise      = COALESCE($13, type_entreprise),
         est_entreprise       = COALESCE($14, est_entreprise),
         province_entreprise  = COALESCE($15, province_entreprise),
         num_entreprise       = COALESCE($16, num_entreprise),
         no_tps               = COALESCE($17, no_tps),
         no_taxe_provinciale  = COALESCE($18, no_taxe_provinciale),
         jours_remboursement  = COALESCE($19, jours_remboursement),
         latitude             = COALESCE($20, latitude),
         longitude            = COALESCE($21, longitude),
         taux_tps             = COALESCE($22, taux_tps),
         taux_provincial      = COALESCE($23, taux_provincial),
         updated_at           = NOW()
       WHERE id = $24
       RETURNING id, nom, nom_boutique, email, updated_at`,
      [
        nom ?? null, nom_boutique ?? null, telephone ?? null,
        num_civique ?? null, rue ?? null, ville ?? null,
        province ?? null, code_postal ?? null, pays ?? null,
        description ?? null, politique_retours ?? null, politique_livraison ?? null,
        type_entreprise ?? null, est_entreprise ?? null, province_entreprise ?? null,
        num_entreprise ?? null, no_tps ?? null, no_taxe_provinciale ?? null,
        jours_remboursement ?? null, latitude ?? null, longitude ?? null,
        taux_tps ?? null, taux_provincial ?? null,
        req.params.gestionnaireId,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Gestionnaire introuvable.' });
    res.json({ success: true, vendeur: result.rows[0] });
  } catch (err) {
    console.error('PUT /studio/mon-compte/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/mon-compte/:gestionnaireId/mot-de-passe
// Changer le mot de passe
// Body : { mot_de_passe_actuel, nouveau_mot_de_passe }
// =============================================================================
router.put('/mot-de-passe', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;

  if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
    return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  }
  if (nouveau_mot_de_passe.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    // Récupérer le hash actuel
    const result = await pool.query(
      `SELECT mot_de_passe FROM gestionnaires WHERE id = $1`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire introuvable.' });

    const hashActuel = result.rows[0].mot_de_passe;
    const valide     = await bcrypt.compare(mot_de_passe_actuel, hashActuel);
    if (!valide) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

    const nouveauHash = await bcrypt.hash(nouveau_mot_de_passe, 12);
    await pool.query(
      `UPDATE gestionnaires SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2`,
      [nouveauHash, req.params.gestionnaireId]
    );

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('PUT /studio/mon-compte/:gestionnaireId/mot-de-passe :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/mon-compte/:gestionnaireId/email
// Changer l'adresse courriel — remet la vérification à zéro
// Body : { mot_de_passe_actuel, nouvel_email }
// =============================================================================
router.put('/email', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { mot_de_passe_actuel, nouvel_email } = req.body;
  const gestionnaireId = req.params.gestionnaireId;

  if (!mot_de_passe_actuel || !nouvel_email) {
    return res.status(400).json({ error: 'Le mot de passe actuel et le nouvel email sont requis.' });
  }
  const emailPropre = String(nouvel_email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPropre)) {
    return res.status(400).json({ error: 'Adresse courriel invalide.' });
  }

  try {
    // Récupérer le hash + email actuel
    const result = await pool.query(
      `SELECT mot_de_passe, email, nom FROM gestionnaires WHERE id = $1`,
      [gestionnaireId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire introuvable.' });

    const g = result.rows[0];
    const valide = await bcrypt.compare(mot_de_passe_actuel, g.mot_de_passe);
    if (!valide) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

    if (emailPropre === g.email.trim().toLowerCase()) {
      return res.status(400).json({ error: 'C\'est déjà votre adresse courriel actuelle.' });
    }

    // Vérifier que le nouvel email n'est pas déjà utilisé par un autre compte
    const dejaPris = await pool.query(
      `SELECT id FROM gestionnaires WHERE email = $1 AND id != $2`,
      [emailPropre, gestionnaireId]
    );
    if (dejaPris.rows.length > 0) {
      return res.status(409).json({ error: 'Cette adresse courriel est déjà utilisée par un autre compte.' });
    }

    // Nouveau token de vérification (48h — aligné sur le modèle #3)
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE gestionnaires SET
         email = $1, email_verifie = false,
         email_verification_token = $2, email_verification_expire = $3,
         updated_at = NOW()
       WHERE id = $4`,
      [emailPropre, token, expiration, gestionnaireId]
    );

    if (envoyerEmailModele) {
      const lienVerification = `${process.env.FRONTEND_URL || 'https://e-vend.ca'}/verifier-email?token=${token}`;
      envoyerEmailModele(3, emailPropre, {
        nom_vendeur: g.nom,
        lien_verification: lienVerification,
      }).catch(e => console.error('Erreur envoi email #3 (changement courriel):', e.message));
    }

    res.json({ success: true, email: emailPropre, message: 'Adresse courriel mise à jour. Un courriel de vérification a été envoyé.' });
  } catch (err) {
    console.error('PUT /studio/mon-compte/:gestionnaireId/email :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/mon-compte/:gestionnaireId/logo
// Uploader le logo vers S3
// =============================================================================
router.post('/logo', authenticateToken, (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    const { gestionnaireId } = req.params;
    try {
      // Supprimer l'ancien logo S3
      const ancien = await pool.query(`SELECT logo_url FROM gestionnaires WHERE id = $1`, [gestionnaireId]);
      if (ancien.rows[0]?.logo_url) await supprimerS3(ancien.rows[0].logo_url);

      const { url } = await uploadVersS3(req.file, gestionnaireId, 'logo');
      await pool.query(`UPDATE gestionnaires SET logo_url = $1, updated_at = NOW() WHERE id = $2`, [url, gestionnaireId]);

      console.log(`🖼️  Logo gestionnaire ${gestionnaireId} uploadé : ${url}`);
      res.json({ success: true, logo_url: url });
    } catch (e) {
      console.error('❌ Erreur upload logo :', e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

// =============================================================================
// POST /api/studio/mon-compte/:gestionnaireId/banniere
// Uploader la bannière vers S3
// =============================================================================
router.post('/banniere', authenticateToken, (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  upload.single('banniere')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    const { gestionnaireId } = req.params;
    try {
      // Supprimer l'ancienne bannière S3
      const ancien = await pool.query(`SELECT banniere_url FROM gestionnaires WHERE id = $1`, [gestionnaireId]);
      if (ancien.rows[0]?.banniere_url) await supprimerS3(ancien.rows[0].banniere_url);

      const { url } = await uploadVersS3(req.file, gestionnaireId, 'banniere');
      await pool.query(`UPDATE gestionnaires SET banniere_url = $1, updated_at = NOW() WHERE id = $2`, [url, gestionnaireId]);

      console.log(`🖼️  Bannière gestionnaire ${gestionnaireId} uploadée : ${url}`);
      res.json({ success: true, banniere_url: url });
    } catch (e) {
      console.error('❌ Erreur upload bannière :', e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

// =============================================================================
// DELETE /api/studio/mon-compte/:gestionnaireId/logo
// Supprimer le logo
// =============================================================================
router.delete('/logo', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const ancien = await pool.query(`SELECT logo_url FROM gestionnaires WHERE id = $1`, [req.params.gestionnaireId]);
    if (ancien.rows[0]?.logo_url) await supprimerS3(ancien.rows[0].logo_url);
    await pool.query(`UPDATE gestionnaires SET logo_url = '', updated_at = NOW() WHERE id = $1`, [req.params.gestionnaireId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/mon-compte/:gestionnaireId/banniere
// Supprimer la bannière
// =============================================================================
router.delete('/banniere', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const ancien = await pool.query(`SELECT banniere_url FROM gestionnaires WHERE id = $1`, [req.params.gestionnaireId]);
    if (ancien.rows[0]?.banniere_url) await supprimerS3(ancien.rows[0].banniere_url);
    await pool.query(`UPDATE gestionnaires SET banniere_url = '', updated_at = NOW() WHERE id = $1`, [req.params.gestionnaireId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;