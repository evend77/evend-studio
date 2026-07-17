// routes/sponsor_pubs.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getTousLesPlansPub, versDictionnaire: versDictPub, PLAN_PUB_DEFAUT } = require('../config/plansPub');
const { verifierModerationIA, doitEtreRejetee } = require('./moderationIA');

// ── UPLOAD D'IMAGES DE PUB — séparé du système Photos (sponsor_photos) ────
// Les images de pub ne doivent JAMAIS créer d'entrée dans sponsor_photos
// (cette table est la banque de photos gratuite pour les gestionnaires).
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_SPONSOR || 'evend-studio-sponsors-2026-296886269853-us-east-1-an';

const uploadPub = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format de fichier non supporté.'));
  }
});

async function uploadPubToS3(file, sponsor_id) {
  const key = `sponsors-pubs/${sponsor_id}/${uuidv4()}-${file.originalname}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: key, Body: file.buffer, ContentType: file.mimetype,
  }));
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

async function deletePubImageFromS3(url) {
  if (!url) return;
  const base = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
  if (!url.startsWith(base)) return; // image pas sur notre bucket (ex: ancienne URL), on ignore
  const key = url.replace(base, '');
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (e) {
    console.error('⚠️ Erreur suppression image pub sur S3 (ignorée):', e.message);
  }
}

// POST — Upload d'une image/vidéo de PUB (ne touche PAS à sponsor_photos)
router.post('/pubs/upload-image', authenticateToken, uploadPub.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    const url = await uploadPubToS3(req.file, req.user.id);
    res.json({ success: true, url_image: url });
  } catch (error) {
    console.error('❌ Erreur upload image pub:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
});

// ── MIDDLEWARE ──────────────────────────────────────────────────
const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 📢 ROUTES SPONSOR
// ════════════════════════════════════════════════════════════════

// GET — Récupérer les pubs du sponsor
router.get('/pubs', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const result = await pool.query(
      `SELECT 
        id, titre, description, url_image, url_lien,
        actif, statut, raison_blocage, impressions, clics, type, effet, prix_par_click,
        budget_type, budget_montant, budget_depense,
        categories,
        roue_active,
        codes_promo AS codes_promo_roue,
        participations AS participations_roue,
        gagnants AS gagnants_roue,
        created_at
       FROM sponsor_pubs
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [sponsor_id]
    );
    res.json({ pubs: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération pubs sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// POST — Créer une pub (sponsor)
router.post('/pubs', authenticateToken, async (req, res) => {
  try {
    const {
      titre, description, url_lien, type, effet,
      images, prix_par_click, budget_type, budget_montant,
      categories,
      roue_active, codes_promo_roue,
      question, choix, compteur, code_promo, note, auteur
    } = req.body;

    const sponsor_id = req.user.id;

    // Vérifier que le sponsor a le bon type
    const sponsorCheck = await pool.query(
      'SELECT type_sponsor FROM sponsors WHERE id = $1',
      [sponsor_id]
    );
    if (sponsorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    if (sponsorCheck.rows[0].type_sponsor === 'photos') {
      return res.status(403).json({ error: 'Votre compte n\'est pas autorisé à créer des publicités' });
    }

    // Vérifier le quota de pubs actives du forfait pub
    const sponsorForfaitResult = await pool.query(
      'SELECT forfait_pub FROM sponsors WHERE id = $1',
      [sponsor_id]
    );
    const forfaitPubId = sponsorForfaitResult.rows[0]?.forfait_pub || PLAN_PUB_DEFAUT;
    const plansPubCreation = versDictPub(await getTousLesPlansPub());
    const planPub = plansPubCreation[forfaitPubId] || plansPubCreation[PLAN_PUB_DEFAUT];

    if (planPub.maxPubsActives !== null) {
      const comptePubsActives = await pool.query(
        `SELECT COUNT(*) as count FROM sponsor_pubs WHERE sponsor_id = $1 AND statut = 'active'`,
        [sponsor_id]
      );
      const pubsActives = parseInt(comptePubsActives.rows[0].count);
      if (pubsActives >= planPub.maxPubsActives) {
        return res.status(403).json({
          error: `Vous avez atteint votre quota de ${planPub.maxPubsActives} pubs actives pour le forfait "${planPub.label}". Mettez une pub en pause ou passez à un forfait supérieur.`
        });
      }
    }

    // Sauvegarder les données spécifiques au format
    let extra_data = {};
    if (type === 'interactive') {
      extra_data = { question, choix };
    } else if (type === 'social') {
      extra_data = { compteur };
    } else if (type === 'codepromo') {
      extra_data = { code_promo };
    } else if (type === 'temoignage') {
      extra_data = { note, auteur };
    }

    // Codes promo de la roue
    const codesPromoArray = codes_promo_roue && codes_promo_roue.length > 0 
      ? codes_promo_roue 
      : [];

    const urlImageFinale = images?.[0] || '';

    // ── Modération : toute nouvelle pub part TOUJOURS en attente (jamais publiée
    // directement, peu importe le toggle) — la Vérification IA, si activée, sert
    // seulement à rejeter automatiquement les cas évidents pour te faire gagner du temps.
    let statutInitial = 'en_attente';
    let raisonBlocageInitiale = null;
    try {
      const configMod = await pool.query('SELECT * FROM configuration_moderation WHERE id = 1');
      if (!configMod.rows[0]?.verification_ai_active) {
        console.log(`ℹ️ Vérification IA désactivée — pub #${titre} envoyée en attente sans appel IA`);
      } else if (!urlImageFinale) {
        console.log(`ℹ️ Vérification IA activée mais aucune image à vérifier pour "${titre}" — en attente sans appel IA`);
      } else {
        const resultatIA = await verifierModerationIA(urlImageFinale, `${titre} ${description}`);
        if (!resultatIA.erreur) {
          const rejetee = doitEtreRejetee(resultatIA.scores, configMod.rows[0]);
          console.log(`✅ Vérification IA effectuée pour "${titre}" — scores:`, resultatIA.scores, `— rejetée auto: ${rejetee}`);
          if (rejetee) {
            statutInitial = 'rejete';
            raisonBlocageInitiale = 'Rejetée automatiquement par la vérification IA (contenu non conforme détecté)';
          }
        } else {
          console.error('⚠️ Modération IA indisponible, la pub reste en attente manuelle:', resultatIA.message);
        }
      }
    } catch (e) {
      console.error('⚠️ Erreur inattendue de modération IA (fallback en attente):', e.message);
    }

    const result = await pool.query(
      `INSERT INTO sponsor_pubs 
       (sponsor_id, titre, description, url_image, url_lien, actif, statut, raison_blocage,
        type, effet, prix_par_click, extra_data,
        budget_type, budget_montant, budget_depense,
        categories,
        roue_active, codes_promo,
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14, $15, $16, NOW(), NOW())
       RETURNING *`,
      [
        sponsor_id,
        titre,
        description,
        urlImageFinale,
        url_lien,
        statutInitial,
        raisonBlocageInitiale,
        type || 'basique',
        effet || null,
        prix_par_click || 0.50,
        JSON.stringify(extra_data),
        budget_type || 'jour',
        budget_montant || 10,
        categories || [],
        roue_active || false,
        codesPromoArray
      ]
    );

    res.status(201).json({
      success: true,
      message: statutInitial === 'rejete'
        ? 'Publicité rejetée automatiquement par la vérification IA (contenu non conforme détecté)'
        : 'Publicité créée — en attente d\'approbation par un administrateur',
      pub: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur création pub:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la publicité' });
  }
});

// PUT — Modifier une pub (édition complète)
router.put('/pubs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor_id = req.user.id;
    const {
      titre, description, url_lien, type, effet,
      images, prix_par_click, budget_type, budget_montant,
      categories,
      roue_active, codes_promo_roue,
      question, choix, compteur, code_promo, note, auteur
    } = req.body;

    const check = await pool.query(
      'SELECT id, url_image FROM sponsor_pubs WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    let extra_data = {};
    if (type === 'interactive') {
      extra_data = { question, choix };
    } else if (type === 'social') {
      extra_data = { compteur };
    } else if (type === 'codepromo') {
      extra_data = { code_promo };
    } else if (type === 'temoignage') {
      extra_data = { note, auteur };
    }

    // Si aucune nouvelle image fournie, on garde l'image existante
    const nouvelleUrlImage = (images && images.length > 0) ? images[0] : check.rows[0].url_image;
    const codesPromoArray = codes_promo_roue && codes_promo_roue.length > 0 ? codes_promo_roue : [];

    const result = await pool.query(
      `UPDATE sponsor_pubs SET
        titre = $1, description = $2, url_image = $3, url_lien = $4,
        type = $5, effet = $6, prix_par_click = $7, extra_data = $8,
        budget_type = $9, budget_montant = $10,
        categories = $11, roue_active = $12, codes_promo = $13,
        updated_at = NOW()
       WHERE id = $14 AND sponsor_id = $15
       RETURNING *`,
      [
        titre, description, nouvelleUrlImage, url_lien,
        type || 'basique', effet || null, prix_par_click || 0.50, JSON.stringify(extra_data),
        budget_type || 'jour', budget_montant || 10,
        categories || [], roue_active || false, codesPromoArray,
        id, sponsor_id
      ]
    );

    res.json({ success: true, message: 'Publicité modifiée avec succès', pub: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification pub:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la publicité' });
  }
});

// PUT — Activer/Désactiver une pub
router.put('/pubs/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    const sponsor_id = req.user.id;

    const check = await pool.query(
      'SELECT id, statut FROM sponsor_pubs WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    if (actif && ['en_attente', 'rejete'].includes(check.rows[0].statut)) {
      return res.status(403).json({
        error: check.rows[0].statut === 'rejete'
          ? 'Cette publicité a été rejetée et ne peut pas être réactivée. Contactez le support si vous pensez que c\'est une erreur.'
          : 'Cette publicité est encore en attente d\'approbation par un administrateur.'
      });
    }

    if (actif) {
      const sponsorForfaitResult = await pool.query(
        'SELECT forfait_pub FROM sponsors WHERE id = $1',
        [sponsor_id]
      );
      const forfaitPubId = sponsorForfaitResult.rows[0]?.forfait_pub || PLAN_PUB_DEFAUT;
      const plansPubToggle = versDictPub(await getTousLesPlansPub());
      const planPub = plansPubToggle[forfaitPubId] || plansPubToggle[PLAN_PUB_DEFAUT];

      if (planPub.maxPubsActives !== null) {
        const comptePubsActives = await pool.query(
          `SELECT COUNT(*) as count FROM sponsor_pubs WHERE sponsor_id = $1 AND statut = 'active' AND id != $2`,
          [sponsor_id, id]
        );
        const pubsActives = parseInt(comptePubsActives.rows[0].count);
        if (pubsActives >= planPub.maxPubsActives) {
          return res.status(403).json({
            error: `Vous avez atteint votre quota de ${planPub.maxPubsActives} pubs actives pour le forfait "${planPub.label}". Mettez une autre pub en pause ou passez à un forfait supérieur.`
          });
        }
      }
    }

    await pool.query(
      `UPDATE sponsor_pubs SET actif = $1, statut = $2, updated_at = NOW()
       WHERE id = $3 AND sponsor_id = $4`,
      [actif, actif ? 'active' : 'pause', id, sponsor_id]
    );

    res.json({
      success: true,
      message: actif ? 'Publicité activée' : 'Publicité mise en pause'
    });
  } catch (error) {
    console.error('❌ Erreur toggle pub:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// DELETE — Supprimer une pub
router.delete('/pubs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor_id = req.user.id;

    const check = await pool.query(
      'SELECT id, statut FROM sponsor_pubs WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    if (check.rows[0].statut === 'rejete') {
      return res.status(403).json({
        error: 'Cette publicité a été bloquée et ne peut pas être supprimée. Contactez le support si vous pensez que c\'est une erreur.'
      });
    }

    await pool.query('DELETE FROM sponsor_pubs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Publicité supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression pub:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📊 STATISTIQUES
// ════════════════════════════════════════════════════════════════

// GET — Statistiques des pubs du sponsor
router.get('/pubs/stats', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const { periode = '30' } = req.query;

    const pubsResult = await pool.query(
      `SELECT 
        id, titre, type, actif, prix_par_click,
        impressions, clics,
        budget_montant, budget_depense,
        categories,
        roue_active,
        codes_promo AS codes_promo_roue,
        participations AS participations_roue,
        gagnants AS gagnants_roue,
        COALESCE(clics * prix_par_click, 0) as cout_estime,
        created_at
       FROM sponsor_pubs
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [sponsor_id]
    );

    const stats = pubsResult.rows.map(pub => ({
      id: pub.id,
      titre: pub.titre,
      type: pub.type,
      actif: pub.actif,
      impressions: pub.impressions || 0,
      clics: pub.clics || 0,
      ctr: pub.impressions > 0 ? (pub.clics / pub.impressions) * 100 : 0,
      cout: parseFloat(pub.cout_estime) || 0,
      budget_montant: parseFloat(pub.budget_montant) || 0,
      budget_depense: parseFloat(pub.budget_depense) || 0,
      budget_restant: Math.max(parseFloat(pub.budget_montant) - parseFloat(pub.cout_estime), 0),
      categories: pub.categories || [],
      roue_active: pub.roue_active || false,
      codes_promo_roue: pub.codes_promo_roue || [],
      participations_roue: pub.participations_roue || 0,
      gagnants_roue: pub.gagnants_roue || 0,
      prix_par_click: pub.prix_par_click || 0.50,
      created_at: pub.created_at,
    }));

    const totalImpressions = stats.reduce((sum, s) => sum + s.impressions, 0);
    const totalClics = stats.reduce((sum, s) => sum + s.clics, 0);
    const totalCout = stats.reduce((sum, s) => sum + s.cout, 0);
    const ctrGlobal = totalImpressions > 0 ? (totalClics / totalImpressions) * 100 : 0;

    // Stats de la roue
    const totalParticipations = stats.reduce((sum, s) => sum + s.participations_roue, 0);
    const totalGagnants = stats.reduce((sum, s) => sum + s.gagnants_roue, 0);

    res.json({
      stats,
      total_impressions: totalImpressions,
      total_clics: totalClics,
      total_cout: totalCout,
      ctr_global: ctrGlobal,
      total_participations_roue: totalParticipations,
      total_gagnants_roue: totalGagnants,
    });
  } catch (error) {
    console.error('❌ Erreur stats pubs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET — Récupérer UNE pub du sponsor (pour pré-remplir le formulaire d'édition)
// ⚠️ Doit rester APRÈS /pubs/stats, sinon /pubs/:id capte 'stats' comme un id.
router.get('/pubs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        id, titre, description, url_image, url_lien,
        actif, statut, impressions, clics, type, effet, prix_par_click, extra_data,
        budget_type, budget_montant, budget_depense,
        categories,
        roue_active,
        codes_promo AS codes_promo_roue,
        created_at
       FROM sponsor_pubs
       WHERE id = $1 AND sponsor_id = $2`,
      [id, sponsor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    res.json({ pub: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération pub:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la publicité' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🎡 ROUTES ROUE DE LA FORTUNE
// ════════════════════════════════════════════════════════════════

// POST — Enregistrer une participation à la roue
router.post('/roue/:pubId/participer', async (req, res) => {
  try {
    const { pubId } = req.params;
    const { gagne } = req.body;

    // Incrémenter les participations
    await pool.query(
      `UPDATE sponsor_pubs SET 
        participations = participations + 1,
        updated_at = NOW()
       WHERE id = $1`,
      [pubId]
    );

    // Si l'utilisateur a gagné, incrémenter les gagnants
    if (gagne) {
      await pool.query(
        `UPDATE sponsor_pubs SET 
          gagnants = gagnants + 1,
          updated_at = NOW()
         WHERE id = $1`,
        [pubId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur participation roue:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la participation' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📊 ROUTES PUBLIQUES (pour l'affichage)
// ════════════════════════════════════════════════════════════════

// GET — Récupérer une pub aléatoire pour un site spécifique
// ?gestionnaireId=123 requis pour exclure les pubs/sponsors bloqués par ce gestionnaire
// et pour tracker l'impression dans addon_pub_stats (revenu du gestionnaire).
router.get('/pub/random/:categorieSite', async (req, res) => {
  try {
    // Empêche Cloudflare/le navigateur de mettre cette réponse en cache — sinon
    // le même "random" reste figé indéfiniment pour tous les visiteurs.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { categorieSite } = req.params;
    const gestionnaireId = req.query.gestionnaireId ? parseInt(req.query.gestionnaireId) : null;

    const query = `
      SELECT 
        sp.id, sp.titre, sp.description, sp.url_image, sp.url_lien,
        sp.type, sp.effet, sp.extra_data, sp.categories,
        sp.roue_active, sp.codes_promo AS codes_promo_roue,
        sp.sponsor_id, s.nom AS sponsor_nom
      FROM sponsor_pubs sp
      JOIN sponsors s ON s.id = sp.sponsor_id
      LEFT JOIN options_gestionnaire og ON og.gestionnaire_id = $2
      WHERE sp.actif = true AND s.active = true
        AND (sp.categories = '{}' OR $1 = ANY(sp.categories))
        AND ($2::int IS NULL OR NOT EXISTS (
          SELECT 1 FROM gestionnaire_pubs_bloquees b WHERE b.gestionnaire_id = $2 AND b.pub_id = sp.id
        ))
        AND ($2::int IS NULL OR NOT EXISTS (
          SELECT 1 FROM gestionnaire_sponsors_bloques bs WHERE bs.gestionnaire_id = $2 AND bs.sponsor_id = sp.sponsor_id
        ))
        AND (
          $2::int IS NULL
          OR og.categories_pub_autorisees IS NULL
          OR array_length(og.categories_pub_autorisees, 1) IS NULL
          OR sp.categories = '{}'
          OR sp.categories && og.categories_pub_autorisees
        )
      ORDER BY RANDOM() LIMIT 1
    `;

    const result = await pool.query(query, [categorieSite, gestionnaireId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ pub: null, message: 'Aucune pub disponible' });
    }

    const pub = result.rows[0];
    await pool.query(
      `UPDATE sponsor_pubs SET impressions = impressions + 1 WHERE id = $1`,
      [pub.id]
    );

    if (gestionnaireId) {
      await pool.query(
        `INSERT INTO addon_pub_stats (gestionnaire_id, pub_id, impressions, clics, date)
         VALUES ($1, $2, 1, 0, CURRENT_DATE)
         ON CONFLICT (gestionnaire_id, pub_id, date)
         DO UPDATE SET impressions = addon_pub_stats.impressions + 1`,
        [gestionnaireId, pub.id]
      );
    }

    res.json({ pub });
  } catch (error) {
    console.error('❌ Erreur récupération pub aléatoire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la pub' });
  }
});

// POST — Track un clic sur une pub
router.post('/pub/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { gestionnaireId } = req.body;

    await pool.query(
      `UPDATE sponsor_pubs SET clics = clics + 1 WHERE id = $1`,
      [id]
    );

    if (gestionnaireId) {
      await pool.query(
        `INSERT INTO addon_pub_stats (gestionnaire_id, pub_id, clics, date)
         VALUES ($1, $2, 1, CURRENT_DATE)
         ON CONFLICT (gestionnaire_id, pub_id, date) 
         DO UPDATE SET clics = addon_pub_stats.clics + 1`,
        [gestionnaireId, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur track clic:', error);
    res.status(500).json({ error: 'Erreur lors du tracking du clic' });
  }
});

// ── SIGNALEMENT (route publique — les visiteurs du site ne sont pas connectés) ──
const MOTIFS_SIGNALEMENT = [
  'photo_inappropriee', 'texte_inapproprie', 'spam', 'contenu_violent',
  'contenu_sexuel', 'arnaque', 'droits_auteur', 'lien_suspect', 'autre',
];

const LABELS_MOTIFS = {
  photo_inappropriee: 'Photo inappropriée ou choquante',
  texte_inapproprie: 'Texte inapproprié ou offensant',
  spam: 'Spam ou publicité trompeuse',
  contenu_violent: 'Contenu violent ou haineux',
  contenu_sexuel: 'Contenu à caractère sexuel',
  arnaque: 'Arnaque ou fraude suspectée',
  droits_auteur: 'Violation de droits d\'auteur / marque',
  lien_suspect: 'Lien suspect ou brisé',
  autre: 'Autre motif',
};

// POST — Signaler une pub (aucune authentification requise, accessible depuis le site public)
router.post('/pub/:id/signaler', async (req, res) => {
  try {
    const { id } = req.params;
    const { motif, commentaire } = req.body;

    if (!motif || !MOTIFS_SIGNALEMENT.includes(motif)) {
      return res.status(400).json({ error: 'Motif de signalement invalide' });
    }

    const pubExiste = await pool.query('SELECT id FROM sponsor_pubs WHERE id = $1', [id]);
    if (pubExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    await pool.query(
      `INSERT INTO signalements_pub (pub_id, motif, commentaire) VALUES ($1, $2, $3)`,
      [id, motif, (commentaire || '').slice(0, 1000)]
    );

    res.status(201).json({ success: true, message: 'Signalement envoyé, merci' });
  } catch (error) {
    console.error('❌ Erreur envoi signalement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du signalement' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔧 ADMIN ROUTES
// ════════════════════════════════════════════════════════════════

// GET — Toutes les pubs (admin), tous sponsors confondus
// Recherche (ID, titre, nom de sponsor) + pagination (50/page) — pensé pour des milliers de pubs.
// ════════════════════════════════════════════════════════════════
// 🚩 SIGNALEMENTS (ADMIN)
// ════════════════════════════════════════════════════════════════

// GET — Compteur rapide des signalements non traités (pour le badge du menu)
router.get('/admin/signalements/compte', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM signalements_pub WHERE statut = 'nouveau'`);
    res.json({ nouveaux: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('❌ Erreur compte signalements:', error);
    res.status(500).json({ error: 'Erreur lors du comptage des signalements' });
  }
});

// GET — Liste des signalements (recherche + filtre statut + pagination)
router.get('/admin/signalements', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const statutFiltre = (req.query.statut || '').trim();

    const conditions = [];
    const params = [];
    if (search) {
      params.push(search);
      conditions.push(`(sig.id::text = $${params.length} OR sp.id::text = $${params.length} OR sp.titre ILIKE '%' || $${params.length} || '%' OR s.nom ILIKE '%' || $${params.length} || '%')`);
    }
    if (statutFiltre) {
      params.push(statutFiltre);
      conditions.push(`sig.statut = $${params.length}`);
    }
    const whereSql = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM signalements_pub sig
       JOIN sponsor_pubs sp ON sp.id = sig.pub_id
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE ${whereSql}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const paramsListe = [...params, limit, offset];
    const limitIdx = paramsListe.length - 1;
    const offsetIdx = paramsListe.length;

    const result = await pool.query(
      `SELECT
        sig.id, sig.motif, sig.commentaire, sig.statut, sig.action_prise, sig.note_admin,
        sig.created_at, sig.traite_at,
        sp.id AS pub_id, sp.titre AS pub_titre, sp.description AS pub_description,
        sp.url_image AS pub_image, sp.actif AS pub_actif, sp.statut AS pub_statut,
        s.nom AS sponsor_nom,
        (SELECT COUNT(*) FROM signalements_pub sig2 WHERE sig2.pub_id = sp.id) AS nb_signalements_pub
       FROM signalements_pub sig
       JOIN sponsor_pubs sp ON sp.id = sig.pub_id
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE ${whereSql}
       ORDER BY sig.statut ASC, sig.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    res.json({
      signalements: result.rows,
      total, page, limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('❌ Erreur liste signalements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des signalements' });
  }
});

// PUT — Traiter un signalement (bloquer la pub ou l'autoriser) + note admin
router.put('/admin/signalements/:id/traiter', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note_admin } = req.body; // action: 'bloquer' | 'autoriser'

    if (!['bloquer', 'autoriser'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }

    const signalement = await pool.query('SELECT pub_id, motif FROM signalements_pub WHERE id = $1', [id]);
    if (signalement.rows.length === 0) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }
    const pubId = signalement.rows[0].pub_id;

    if (action === 'bloquer') {
      const raisonLisible = `Bloquée suite à un signalement : ${LABELS_MOTIFS[signalement.rows[0].motif] || 'Contenu non conforme'}`;
      await pool.query(
        `UPDATE sponsor_pubs SET actif = false, statut = 'rejete', raison_blocage = $1, updated_at = NOW() WHERE id = $2`,
        [raisonLisible, pubId]
      );
    }
    // 'autoriser' → on ne touche pas à la pub, elle reste comme elle était (jamais bloquée automatiquement)

    await pool.query(
      `UPDATE signalements_pub SET
        statut = 'traite', action_prise = $1, note_admin = $2, traite_at = NOW()
       WHERE id = $3`,
      [action === 'bloquer' ? 'bloquee' : 'autorisee', note_admin || null, id]
    );

    res.json({ success: true, message: action === 'bloquer' ? 'Publicité bloquée' : 'Publicité autorisée à continuer' });
  } catch (error) {
    console.error('❌ Erreur traitement signalement:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du signalement' });
  }
});

router.get('/admin/all', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const statutFiltre = (req.query.statut || '').trim();

    // Construction dynamique des conditions et paramètres, dans l'ordre où ils sont ajoutés
    const conditions = [];
    const params = [];
    if (search) {
      params.push(search);
      conditions.push(`(sp.id::text = $${params.length} OR sp.titre ILIKE '%' || $${params.length} || '%' OR s.nom ILIKE '%' || $${params.length} || '%')`);
    }
    if (statutFiltre) {
      params.push(statutFiltre);
      conditions.push(`sp.statut = $${params.length}`);
    }
    const whereSql = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM sponsor_pubs sp JOIN sponsors s ON s.id = sp.sponsor_id WHERE ${whereSql}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const paramsListe = [...params, limit, offset];
    const limitIdx = paramsListe.length - 1;
    const offsetIdx = paramsListe.length;
    const result = await pool.query(
      `SELECT
        sp.id, sp.titre, sp.description, sp.url_image, sp.url_lien, sp.type, sp.actif, sp.statut, sp.raison_blocage,
        sp.impressions, sp.clics, sp.prix_par_click,
        sp.budget_type, sp.budget_montant, sp.budget_depense,
        sp.sponsor_id, s.nom AS sponsor_nom, sp.created_at
       FROM sponsor_pubs sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE ${whereSql}
       ORDER BY sp.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    res.json({
      pubs: result.rows,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('❌ Erreur récupération pubs admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// PUT — Mettre en pause / réactiver une pub (admin) — cohérent avec le champ statut
// PUT — Approuver une pub en attente (admin) — la publie
router.put('/admin/:id/approuver', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sponsor_pubs SET actif = true, statut = 'active', raison_blocage = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Publicité non trouvée' });
    res.json({ success: true, message: 'Publicité approuvée et publiée', pub: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur approbation pub admin:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});

// PUT — Rejeter une pub en attente (admin) — reste en BD (pour référence/ID) mais jamais publiée
router.put('/admin/:id/rejeter', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    const result = await pool.query(
      `UPDATE sponsor_pubs SET actif = false, statut = 'rejete', raison_blocage = COALESCE($2, raison_blocage, 'Rejetée par un administrateur'), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, (raison || '').trim() || null]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Publicité non trouvée' });
    res.json({ success: true, message: 'Publicité rejetée', pub: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur rejet pub admin:', error);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

router.put('/admin/:id/pause', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    const result = await pool.query(
      `UPDATE sponsor_pubs SET actif = $1, statut = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [actif, actif ? 'active' : 'pause', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Publicité non trouvée' });
    res.json({ success: true, message: actif ? 'Publicité réactivée' : 'Publicité mise en pause', pub: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur pause/reprise pub admin:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// PUT — Modifier une pub (admin) — édition générale (prix par clic, etc.)
router.put('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, prix_par_click } = req.body;

    const result = await pool.query(
      `UPDATE sponsor_pubs SET
        actif = COALESCE($1, actif),
        statut = CASE WHEN $1 IS NOT NULL THEN (CASE WHEN $1 THEN 'active' ELSE 'pause' END) ELSE statut END,
        prix_par_click = COALESCE($2, prix_par_click),
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [actif, prix_par_click, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    res.json({
      success: true,
      message: 'Publicité modifiée avec succès',
      pub: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur modification pub admin:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// DELETE — Supprimer définitivement une pub (admin) — BD + image S3
router.delete('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT url_image FROM sponsor_pubs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    await deletePubImageFromS3(existing.rows[0].url_image);
    await pool.query('DELETE FROM sponsor_pubs WHERE id = $1', [id]);
    res.json({ success: true, message: 'Publicité supprimée' });
  } catch (error) {
    console.error('❌ Erreur suppression pub admin:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ── VÉRIFICATION DES BUDGETS (CRON) ──────────────────────────────────
router.get('/verifier-budgets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sp.id, sp.statut, sp.budget_type, sp.budget_montant, sp.budget_depense,
        sp.budget_date_debut, sp.budget_date_fin,
        COALESCE(SUM(asp.clics * sp.prix_par_click), 0) as cout_estime
      FROM sponsor_pubs sp
      LEFT JOIN addon_pub_stats asp ON asp.pub_id = sp.id 
        AND asp.date >= DATE_TRUNC('day', NOW())
      WHERE sp.actif = true OR sp.statut = 'budget_epuise'
      GROUP BY sp.id
    `);

    const now = new Date();
    let desactives = 0;
    let budgetExpires = [];

    for (const pub of result.rows) {
      const debut = new Date(pub.budget_date_debut);
      let reset = false;

      if (pub.budget_type === 'jour') {
        const diffJours = Math.floor((now.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
        if (diffJours >= 1) reset = true;
      } else if (pub.budget_type === 'semaine') {
        const diffSemaines = Math.floor((now.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (diffSemaines >= 1) reset = true;
      } else if (pub.budget_type === 'mois') {
        const diffMois = (now.getFullYear() - debut.getFullYear()) * 12 + now.getMonth() - debut.getMonth();
        if (diffMois >= 1) reset = true;
      } else if (pub.budget_type === 'annee') {
        const diffAnnees = now.getFullYear() - debut.getFullYear();
        if (diffAnnees >= 1) reset = true;
      }

      // Nouvelle période : on réinitialise le budget ET on réactive si elle avait été
      // coupée pour budget épuisé (mais pas si le sponsor l'avait lui-même mise en pause).
      if (reset) {
        await pool.query(
          `UPDATE sponsor_pubs SET 
            budget_depense = 0,
            actif = CASE WHEN statut = 'budget_epuise' THEN true ELSE actif END,
            statut = CASE WHEN statut = 'budget_epuise' THEN 'active' ELSE statut END,
            budget_date_debut = NOW(),
            budget_date_fin = NOW() + INTERVAL '1 ' || 
              CASE budget_type 
                WHEN 'jour' THEN 'day'
                WHEN 'semaine' THEN 'week'
                WHEN 'mois' THEN 'month'
                WHEN 'annee' THEN 'year'
              END
           WHERE id = $1`,
          [pub.id]
        );
        budgetExpires.push({
          id: pub.id,
          raison: 'reset_periode',
          type: pub.budget_type
        });
        continue; // période fraîche — pas de vérification de dépassement ce tour-ci
      }

      const depense = parseFloat(pub.budget_depense || 0);
      const coutEstime = parseFloat(pub.cout_estime || 0);
      const totalDepense = Math.max(depense, coutEstime);

      if (totalDepense >= pub.budget_montant) {
        await pool.query(
          `UPDATE sponsor_pubs SET actif = false, statut = 'budget_epuise' WHERE id = $1`,
          [pub.id]
        );
        desactives++;
        budgetExpires.push({
          id: pub.id,
          raison: 'budget_atteint',
          depense: totalDepense,
          budget: pub.budget_montant
        });
      }
    }

    res.json({
      success: true,
      pubs_verifies: result.rows.length,
      desactives,
      budgetExpires
    });
  } catch (error) {
    console.error('❌ Erreur vérification budgets:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des budgets' });
  }
});

// ── WEBHOOK POUR LES CLICS (mise à jour du budget) ──────────────────
router.post('/webhook/click', async (req, res) => {
  try {
    const { pub_id, cout } = req.body;

    if (!pub_id) {
      return res.status(400).json({ error: 'pub_id requis' });
    }

    await pool.query(
      `UPDATE sponsor_pubs SET 
        budget_depense = budget_depense + $1,
        updated_at = NOW()
       WHERE id = $2`,
      [cout || 0.50, pub_id]
    );

    const check = await pool.query(
      `SELECT budget_montant, budget_depense FROM sponsor_pubs WHERE id = $1`,
      [pub_id]
    );

    if (check.rows.length > 0) {
      const { budget_montant, budget_depense } = check.rows[0];
      if (budget_depense >= budget_montant) {
        await pool.query(
          `UPDATE sponsor_pubs SET actif = false WHERE id = $1`,
          [pub_id]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur webhook click:', error);
    res.status(500).json({ error: 'Erreur lors du webhook' });
  }
});

module.exports = router;