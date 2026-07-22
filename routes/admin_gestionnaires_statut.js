// routes/admin_gestionnaires_statut.js
// PUT /api/admin/gestionnaires/:id/statut
// Body : { statut: 'actif' | 'suspendu' | 'banni' | 'en_maintenance' }
//
// Envoie le modèle #5 (suspendu) ou #6 (réactivé) selon la transition.
// Aucun courriel pour 'banni' ou 'en_maintenance' (pas demandé).

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const jwt     = require('jsonwebtoken');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function supprimerS3SiPresent(url) {
  if (!url) return;
  try {
    const u = new URL(url);
    const key = u.pathname.slice(1);
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
  } catch (e) {
    console.warn('⚠️ Suppression S3 impossible pour', url, ':', e.message);
  }
}
const { authenticateToken, isAdmin } = require('../middleware/auth');

let envoyerEmailModele = null;
try { ({ envoyerEmailModele } = require('../services/email')); }
catch (e) { console.warn('⚠️ services/email.js introuvable:', e.message); }

const STATUTS_VALIDES = ['actif', 'suspendu', 'banni', 'en_maintenance'];

router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!STATUTS_VALIDES.includes(statut)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}.` });
    }

    const avant = await pool.query(
      `SELECT statut, email, nom, nom_boutique FROM gestionnaires WHERE id = $1`,
      [id]
    );
    if (avant.rows.length === 0) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé.' });
    }
    const g = avant.rows[0];
    const ancienStatut = g.statut;

    await pool.query(
      `UPDATE gestionnaires SET statut = $1, updated_at = NOW() WHERE id = $2`,
      [statut, id]
    );

    // 📧 Courriel #5 (suspendu) ou #6 (réactivé) — seulement sur transition réelle,
    // jamais bloquant pour la requête admin.
    if (envoyerEmailModele) {
      if (statut === 'suspendu' && ancienStatut !== 'suspendu') {
        envoyerEmailModele(5, g.email, {
          nom_gestionnaire: g.nom,
          nom_boutique_gestionnaire: g.nom_boutique,
        }).catch(e => console.error('Erreur envoi email #5 (suspension):', e.message));
      } else if (statut === 'actif' && ancienStatut === 'suspendu') {
        envoyerEmailModele(6, g.email, {
          nom_gestionnaire: g.nom,
          lien_dashboard: `${process.env.FRONTEND_URL || 'https://e-vend.ca'}/dashboard`,
        }).catch(e => console.error('Erreur envoi email #6 (réactivation):', e.message));
      }
    }

    res.json({ success: true, statut });
  } catch (err) {
    console.error('PUT /admin/gestionnaires/:id/statut :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/gestionnaires/:id/2fa — activer/désactiver la F2A (admin)
// Body : { enabled: boolean }
router.put('/:id/2fa', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const result = await pool.query(
      `UPDATE gestionnaires SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [!!enabled, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé.' });
    res.json({ success: true, two_factor_enabled: !!enabled });
  } catch (err) {
    console.error('PUT /admin/gestionnaires/:id/2fa :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/gestionnaires/:id/impersonate — ouvrir en tant que (admin)
// Émet un token gestionnaire valide, sans mot de passe — accès réservé aux admins.
router.post('/:id/impersonate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, nom, plan, statut FROM gestionnaires WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé.' });
    }
    const g = result.rows[0];

    const token = jwt.sign(
      { id: g.id, email: g.email, role: 'gestionnaire', plan: g.plan },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '2h' } // session d'impersonation volontairement plus courte qu'un login normal
    );

    // Journal d'audit — l'impersonation touche un compte qui n'est pas le sien, à tracer.
    try {
      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau)
         VALUES ($1, $2, $3::jsonb, $4)`,
        ['IMPERSONATION_GESTIONNAIRE', req.user.email || `admin_${req.user.id}`,
         JSON.stringify({ gestionnaire_id: g.id, gestionnaire_email: g.email }), 'warning']
      );
    } catch (e) {
      console.warn('⚠️ Audit log impersonation non enregistré:', e.message);
    }

    res.json({
      success: true,
      token,
      gestionnaire: { id: g.id, email: g.email, nom: g.nom, plan: g.plan, statut: g.statut, role: 'gestionnaire' },
    });
  } catch (err) {
    console.error('POST /admin/gestionnaires/:id/impersonate :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/gestionnaires/:id — suppression propre et définitive
// Body : { raison: string } — obligatoire, incluse dans le courriel + l'archive.
//
// Ordre des opérations :
//   1. Récupérer les infos (avant qu'elles disparaissent)
//   2. Envoyer le courriel #28 (compte supprimé)
//   3. Archiver id/email/nom/raison dans gestionnaires_supprimes
//   4. Supprimer les fichiers S3 connus (logo, bannière)
//   5. DELETE FROM gestionnaires — le ON DELETE CASCADE sur les FK s'occupe
//      de tout le reste (sites, produits, commandes, domaines, etc.)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const raison = (req.body?.raison || '').trim();
    if (!raison) {
      return res.status(400).json({ error: 'La raison de la suppression est obligatoire.' });
    }

    const result = await pool.query(
      `SELECT id, email, nom, nom_boutique, logo_url, banniere_url FROM gestionnaires WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé.' });
    }
    const g = result.rows[0];
    const dateStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });

    // 📧 Courriel de suppression (modèle #28) — envoyé avant la suppression réelle,
    // ne doit jamais bloquer l'opération si l'envoi échoue.
    if (envoyerEmailModele) {
      try {
        await envoyerEmailModele(28, g.email, {
          nom_gestionnaire: g.nom,
          raison_suppression: raison,
        });
      } catch (e) {
        console.error('Erreur envoi email #28 (suppression compte):', e.message);
      }
    }

    // 🗂️ Archive minimale — id, email, raison conservés comme convenu
    await pool.query(
      `INSERT INTO gestionnaires_supprimes (id, email, nom, nom_boutique, raison, supprime_par, date_suppression)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [g.id, g.email, g.nom, g.nom_boutique, raison, req.user.email || `admin_${req.user.id}`]
    );

    // 🗑️ Fichiers S3 connus (logo, bannière du profil gestionnaire)
    // ⚠️ Limite connue : les photos de produits ou autres fichiers uploadés
    // ailleurs dans l'app ne sont pas couvertes ici faute de visibilité sur
    // toutes les tables qui en stockent — à compléter si d'autres emplacements
    // S3 sont identifiés.
    await supprimerS3SiPresent(g.logo_url);
    await supprimerS3SiPresent(g.banniere_url);

    // 🔥 Suppression réelle — cascade sur toutes les FK liées
    await pool.query(`DELETE FROM gestionnaires WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/gestionnaires/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;