// routes/messagerie_contact.js
// e-Vend Studio — Messages via formulaire de contact + quota
// Monté dans server.js via : app.use('/api/messagerie-contact', require('./routes/messagerie_contact'));

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const MESSAGES_INCLUS = 100;

// Paliers d'achat — tarif dégressif au volume
const PALIERS_BLOCS = [
  { id: 'bloc-50',   quantite: 50,   prix_ht: 2.00 },
  { id: 'bloc-100',  quantite: 100,  prix_ht: 3.50 },
  { id: 'bloc-500',  quantite: 500,  prix_ht: 15.00 },
  { id: 'bloc-1000', quantite: 1000, prix_ht: 25.00 },
];

// ─── Helper — récupère (ou initialise) le quota du cycle en cours ──────────
async function getOuCreerQuota(gestionnaireId) {
  const res = await pool.query(
    `SELECT * FROM quotas_messagerie_contact WHERE gestionnaire_id = $1`,
    [gestionnaireId]
  );
  if (res.rows.length > 0) return res.rows[0];

  const insert = await pool.query(
    `INSERT INTO quotas_messagerie_contact (gestionnaire_id, utilises, inclus, extra_achetes)
     VALUES ($1, 0, $2, 0) RETURNING *`,
    [gestionnaireId, MESSAGES_INCLUS]
  );
  return insert.rows[0];
}

// ─── GET /api/messagerie-contact/paliers — liste des paliers d'achat ───────
router.get('/paliers', authenticateToken, (req, res) => {
  res.json(PALIERS_BLOCS);
});

// ─── GET /api/messagerie-contact/gestionnaire/:id/messages ─────────────────
router.get('/gestionnaire/:id/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, email, telephone, sujet, message, champs_supplementaires, lu, created_at AS date
       FROM messages_contact
       WHERE gestionnaire_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messagerie-contact/gestionnaire/:id/quota ────────────────────
router.get('/gestionnaire/:id/quota', authenticateToken, async (req, res) => {
  try {
    const quota = await getOuCreerQuota(req.params.id);
    res.json({
      utilises: quota.utilises,
      inclus: quota.inclus,
      extra_achetes: quota.extra_achetes,
      limite_totale: quota.inclus + quota.extra_achetes,
      cycle_fin: quota.cycle_fin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messagerie-contact/messages/:id/lire ─────────────────────────
router.put('/messages/:id/lire', authenticateToken, async (req, res) => {
  try {
    await pool.query(`UPDATE messages_contact SET lu = true WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messagerie-contact/gestionnaire/:id/lire-tout ────────────────
router.put('/gestionnaire/:id/lire-tout', authenticateToken, async (req, res) => {
  try {
    await pool.query(`UPDATE messages_contact SET lu = true WHERE gestionnaire_id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messagerie-contact/gestionnaire/:id/acheter-bloc ────────────
// Body: { palier_id: 'bloc-50' | 'bloc-100' | 'bloc-500' | 'bloc-1000' }
// Ajoute immédiatement la quantité au quota. Le montant est enregistré pour
// apparaître sur la PROCHAINE facture du cycle — pas de paiement immédiat.
router.post('/gestionnaire/:id/acheter-bloc', authenticateToken, async (req, res) => {
  const gestionnaireId = req.params.id;
  const palier = PALIERS_BLOCS.find(p => p.id === req.body?.palier_id);
  if (!palier) {
    return res.status(400).json({ error: 'Palier invalide.' });
  }

  try {
    const quota = await getOuCreerQuota(gestionnaireId);

    await pool.query(
      `UPDATE quotas_messagerie_contact SET extra_achetes = extra_achetes + $2, updated_at = NOW()
       WHERE gestionnaire_id = $1`,
      [gestionnaireId, palier.quantite]
    );

    const cycleFacturation = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    await pool.query(
      `INSERT INTO achats_blocs_messagerie (gestionnaire_id, quantite_messages, prix_ht, cycle_facturation)
       VALUES ($1, $2, $3, $4)`,
      [gestionnaireId, palier.quantite, palier.prix_ht, cycleFacturation]
    );

    res.json({
      success: true,
      palier,
      nouvelle_limite: quota.inclus + quota.extra_achetes + palier.quantite,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Utilisé par le endpoint public /api/studio/contact — PAS authentifié ──
// Vérifie le quota AVANT d'accepter un message, incrémente si accepté.
// Exporté pour être appelé depuis routes/studio_contact.js
async function verifierEtIncrementerQuota(gestionnaireId) {
  const quota = await getOuCreerQuota(gestionnaireId);
  const limite = quota.inclus + quota.extra_achetes;
  if (quota.utilises >= limite) {
    return { autorise: false, limite, utilises: quota.utilises };
  }
  await pool.query(
    `UPDATE quotas_messagerie_contact SET utilises = utilises + 1, updated_at = NOW() WHERE gestionnaire_id = $1`,
    [gestionnaireId]
  );
  return { autorise: true, limite, utilises: quota.utilises + 1 };
}

module.exports = router;
module.exports.verifierEtIncrementerQuota = verifierEtIncrementerQuota;
module.exports.MESSAGES_INCLUS = MESSAGES_INCLUS;
module.exports.PALIERS_BLOCS = PALIERS_BLOCS;