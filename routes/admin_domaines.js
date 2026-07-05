// routes/admin_domaines.js
// ============================================================
// Gestion des domaines personnalisés — Admin e-Vend Studio
// Liste, recherche, statistiques, historique et actions (renouvellement
// forcé, suspension/réactivation) sur les domaines achetés par les
// gestionnaires.
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const dynadotService = require('./dynadot');

// =====================================================================
// GET /api/admin/domaines/stats — statistiques globales
// =====================================================================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const maintenant = Date.now();
    const dans30Jours = maintenant + 30 * 24 * 60 * 60 * 1000;

    const totaux = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE statut = 'actif')             AS total_actifs,
         COUNT(*) FILTER (WHERE statut = 'suspendu')           AS total_suspendus,
         COUNT(*)                                              AS total_domaines,
         COALESCE(SUM(montant_total) FILTER (WHERE statut != 'expire'), 0) AS revenu_annuel_estime
       FROM domaines`
    );

    const expirantBientot = await pool.query(
      `SELECT COUNT(*) AS total
       FROM domaines
       WHERE statut = 'actif'
         AND expiration_date IS NOT NULL
         AND expiration_date::bigint BETWEEN $1 AND $2`,
      [maintenant, dans30Jours]
    );

    const revenuHistorique = await pool.query(
      `SELECT
         COALESCE(SUM(montant_total), 0) AS revenu_total_percu,
         COUNT(*) AS total_transactions
       FROM domaines_transactions`
    );

    res.json({
      total_domaines: parseInt(totaux.rows[0].total_domaines, 10),
      total_actifs: parseInt(totaux.rows[0].total_actifs, 10),
      total_suspendus: parseInt(totaux.rows[0].total_suspendus, 10),
      expirant_30_jours: parseInt(expirantBientot.rows[0].total, 10),
      revenu_annuel_estime: parseFloat(totaux.rows[0].revenu_annuel_estime),
      revenu_total_percu: parseFloat(revenuHistorique.rows[0].revenu_total_percu),
      total_transactions: parseInt(revenuHistorique.rows[0].total_transactions, 10),
    });
  } catch (err) {
    console.error('❌ GET /admin/domaines/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// GET /api/admin/domaines — liste complète avec recherche
// Query params optionnels : ?recherche=xxx & ?statut=actif|suspendu|expire
// =====================================================================
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { recherche, statut } = req.query;

    const conditions = [];
    const valeurs = [];
    let i = 1;

    if (recherche) {
      conditions.push(
        `(d.domaine ILIKE $${i} OR g.email ILIKE $${i} OR g.nom ILIKE $${i} OR g.nom_boutique ILIKE $${i})`
      );
      valeurs.push(`%${recherche}%`);
      i++;
    }

    if (statut) {
      conditions.push(`d.statut = $${i}`);
      valeurs.push(statut);
      i++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT d.id, d.domaine, d.gestionnaire_id, d.statut, d.expiration_date,
              d.dynadot_order_id, d.renouvellement_auto, d.prix_dynadot,
              d.montant_avant_taxes, d.tps, d.tvq, d.montant_total, d.created_at,
              g.nom, g.email, g.nom_boutique
       FROM domaines d
       JOIN gestionnaires g ON g.id = d.gestionnaire_id
       ${whereClause}
       ORDER BY d.expiration_date ASC NULLS LAST`,
      valeurs
    );

    res.json({ domaines: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('❌ GET /admin/domaines:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// GET /api/admin/domaines/:id/transactions — historique de facturation
// =====================================================================
router.get('/:id/transactions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, type, montant_avant_taxes, tps, tvq, montant_total, stripe_session_id, created_at
       FROM domaines_transactions
       WHERE domaine_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('❌ GET /admin/domaines/:id/transactions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// POST /api/admin/domaines/:id/renouveler-force — renouvellement forcé
// Renouvelle directement chez Dynadot sans passer par Stripe (ex: geste
// commercial, correction d'erreur). N'enregistre PAS de transaction/facture
// puisqu'aucun paiement n'est associé — seulement un ajustement admin.
// =====================================================================
router.post('/:id/renouveler-force', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM domaines WHERE id = $1`, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Domaine non trouvé.' });
    }
    const domaineRow = result.rows[0];

    const renewResult = await dynadotService.renouvelerDomaineDynadot(domaineRow.domaine);

    if (!renewResult.success) {
      return res.status(500).json({ error: renewResult.error || 'Échec du renouvellement chez Dynadot.' });
    }

    await pool.query(
      `UPDATE domaines SET expiration_date = $1, dernier_rappel_envoye = NULL, statut = 'actif' WHERE id = $2`,
      [renewResult.expirationDate || null, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      ['DOMAINE_RENOUVELLEMENT_FORCE_ADMIN', req.user.email,
       JSON.stringify({ domaine_id: id, domaine: domaineRow.domaine }), 'info']
    );

    res.json({ success: true, message: `Domaine ${domaineRow.domaine} renouvelé (action admin).` });
  } catch (err) {
    console.error('❌ POST /admin/domaines/:id/renouveler-force:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// PUT /api/admin/domaines/:id/statut — suspendre / réactiver
// Body : { statut: 'actif' | 'suspendu' }
// Suspendre bloque réellement l'accès au site pour ce domaine (vérifié par
// la route publique GET /studio/sites/domaine-perso/public/:domaine).
// =====================================================================
router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['actif', 'suspendu'].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide (doit être 'actif' ou 'suspendu')." });
    }

    const result = await pool.query(
      `UPDATE domaines SET statut = $1 WHERE id = $2 RETURNING domaine`,
      [statut, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Domaine non trouvé.' });
    }

    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [statut === 'suspendu' ? 'DOMAINE_SUSPENDU_ADMIN' : 'DOMAINE_REACTIVE_ADMIN', req.user.email,
       JSON.stringify({ domaine_id: id, domaine: result.rows[0].domaine }), 'warning']
    );

    res.json({ success: true, statut });
  } catch (err) {
    console.error('❌ PUT /admin/domaines/:id/statut:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;