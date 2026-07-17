// routes/admin_plans_sponsors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');


// Génère une plan_key à partir du label (slug simple), en évitant les collisions
async function genererPlanKey(table, label) {
  const base = label.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'plan';
  let key = base;
  let i = 1;
  while (true) {
    const existe = await pool.query(`SELECT id FROM ${table} WHERE plan_key = $1`, [key]);
    if (existe.rows.length === 0) return key;
    i++;
    key = `${base}_${i}`;
  }
}

// ════════════════════════════════════════════════════════════════
// 📸 FORFAITS PHOTOS
// ════════════════════════════════════════════════════════════════

// GET — Liste complète (actifs ET inactifs, pour la gestion admin)
router.get('/plans-photos', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.plan_key, p.label, p.max_photos, p.prix, p.actif, p.ordre,
        (SELECT COUNT(*) FROM sponsors WHERE forfait = p.plan_key) as nb_sponsors_abonnes
       FROM plans_photos p ORDER BY p.ordre`
    );
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('❌ Erreur liste plans photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des forfaits' });
  }
});

// POST — Créer un nouveau forfait photo
router.post('/plans-photos', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { label, max_photos, prix, ordre } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Le nom du forfait est requis' });
    }
    const plan_key = await genererPlanKey('plans_photos', label);
    const maxOrdre = await pool.query('SELECT COALESCE(MAX(ordre), 0) as max FROM plans_photos');
    const result = await pool.query(
      `INSERT INTO plans_photos (plan_key, label, max_photos, prix, ordre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [plan_key, label.trim(), max_photos === '' || max_photos === undefined ? null : max_photos, prix || 0, ordre ?? (parseInt(maxOrdre.rows[0].max) + 1)]
    );
    res.status(201).json({ success: true, plan: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création plan photo:', error);
    res.status(500).json({ error: 'Erreur lors de la création du forfait' });
  }
});

// PUT — Modifier un forfait photo (label/limite/prix/ordre/actif) — plan_key ne change jamais
router.put('/plans-photos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, max_photos, prix, ordre, actif } = req.body;
    const result = await pool.query(
      `UPDATE plans_photos SET
        label = COALESCE($1, label),
        max_photos = $2,
        prix = COALESCE($3, prix),
        ordre = COALESCE($4, ordre),
        actif = COALESCE($5, actif),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [label, max_photos === '' || max_photos === undefined ? null : max_photos, prix, ordre, actif, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Forfait non trouvé' });
    res.json({ success: true, plan: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification plan photo:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du forfait' });
  }
});

// DELETE — Supprimer un forfait photo (bloqué si des sponsors y sont abonnés)
router.delete('/plans-photos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await pool.query('SELECT plan_key FROM plans_photos WHERE id = $1', [id]);
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Forfait non trouvé' });

    const enUsage = await pool.query('SELECT COUNT(*) as count FROM sponsors WHERE forfait = $1', [plan.rows[0].plan_key]);
    if (parseInt(enUsage.rows[0].count) > 0) {
      return res.status(409).json({ error: `${enUsage.rows[0].count} sponsor(s) sont encore sur ce forfait. Désactivez-le plutôt que de le supprimer, ou faites-les changer de forfait d'abord.` });
    }

    await pool.query('DELETE FROM plans_photos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur suppression plan photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du forfait' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📢 FORFAITS PUB
// ════════════════════════════════════════════════════════════════

router.get('/plans-pub', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.plan_key, p.label, p.max_pubs_actives, p.prix, p.actif, p.ordre,
        (SELECT COUNT(*) FROM sponsors WHERE forfait_pub = p.plan_key) as nb_sponsors_abonnes
       FROM plans_pub p ORDER BY p.ordre`
    );
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('❌ Erreur liste plans pub:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des forfaits' });
  }
});

router.post('/plans-pub', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { label, max_pubs_actives, prix, ordre } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Le nom du forfait est requis' });
    }
    const plan_key = await genererPlanKey('plans_pub', label);
    const maxOrdre = await pool.query('SELECT COALESCE(MAX(ordre), 0) as max FROM plans_pub');
    const result = await pool.query(
      `INSERT INTO plans_pub (plan_key, label, max_pubs_actives, prix, ordre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [plan_key, label.trim(), max_pubs_actives === '' || max_pubs_actives === undefined ? null : max_pubs_actives, prix || 0, ordre ?? (parseInt(maxOrdre.rows[0].max) + 1)]
    );
    res.status(201).json({ success: true, plan: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création plan pub:', error);
    res.status(500).json({ error: 'Erreur lors de la création du forfait' });
  }
});

router.put('/plans-pub/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, max_pubs_actives, prix, ordre, actif } = req.body;
    const result = await pool.query(
      `UPDATE plans_pub SET
        label = COALESCE($1, label),
        max_pubs_actives = $2,
        prix = COALESCE($3, prix),
        ordre = COALESCE($4, ordre),
        actif = COALESCE($5, actif),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [label, max_pubs_actives === '' || max_pubs_actives === undefined ? null : max_pubs_actives, prix, ordre, actif, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Forfait non trouvé' });
    res.json({ success: true, plan: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification plan pub:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du forfait' });
  }
});

router.delete('/plans-pub/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await pool.query('SELECT plan_key FROM plans_pub WHERE id = $1', [id]);
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Forfait non trouvé' });

    const enUsage = await pool.query('SELECT COUNT(*) as count FROM sponsors WHERE forfait_pub = $1', [plan.rows[0].plan_key]);
    if (parseInt(enUsage.rows[0].count) > 0) {
      return res.status(409).json({ error: `${enUsage.rows[0].count} sponsor(s) sont encore sur ce forfait. Désactivez-le plutôt que de le supprimer, ou faites-les changer de forfait d'abord.` });
    }

    await pool.query('DELETE FROM plans_pub WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur suppression plan pub:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du forfait' });
  }
});

module.exports = router;