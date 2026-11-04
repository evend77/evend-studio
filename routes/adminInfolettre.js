// routes/adminInfolettre.js
// Liste des abonnés à l'infolettre, pour le dashboard admin Studio (Messagerie > E-mail marketing).
//
// Monté dans server.js :  app.use('/api/admin', require('./routes/adminInfolettre'));
//

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { attendreTables } = require('../utils/tablesInfolettre');

// 🔒 SÉCURITÉ : ces routes exposent et modifient la liste des abonnés — réservées
// aux admins connectés. Limité au chemin /infolettre : ce routeur est monté sur /api/admin,
// qui contient aussi d'autres routes qu'il ne faut pas affecter.
router.use('/infolettre', authenticateToken, isAdmin, attendreTables);

// ─── GET /api/admin/infolettre — liste des courriels actifs ────────────────
// (utilisée pour la campagne d'envoi — "tous les abonnés actifs")
router.get('/infolettre', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT email FROM infolettre_abonnes WHERE actif = true ORDER BY email ASC`
    );
    res.json({ emails: rows.map(r => r.email) });
  } catch (err) {
    console.error('GET /admin/infolettre:', err);
    res.status(500).json({ error: 'Erreur lors du chargement de la liste infolettre' });
  }
});

// ─── GET /api/admin/infolettre/tous — liste complète (actifs + inactifs) ───
// Pour la section "Gestion des abonnés" : voir tout le contenu de la table,
// avec statut, source et date, pour faire le ménage (rebonds, désabonnés).
router.get('/infolettre/tous', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, actif, source, date_inscription, date_desabonnement
       FROM infolettre_abonnes ORDER BY date_inscription DESC`
    );
    res.json({
      abonnes: rows,
      total: rows.length,
      actifs: rows.filter(r => r.actif).length,
    });
  } catch (err) {
    console.error('GET /admin/infolettre/tous:', err);
    res.status(500).json({ error: 'Erreur lors du chargement de la liste infolettre' });
  }
});

// ─── DELETE /api/admin/infolettre/:id — suppression définitive ────────────
// Pour retirer un courriel qui rebondit (bounce) ou qui n'a plus sa place
// dans la liste — contrairement au désabonnement (actif=false), ceci
// supprime la ligne pour de bon.
router.delete('/infolettre/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(`DELETE FROM infolettre_abonnes WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Abonné introuvable' });
    res.json({ succes: true });
  } catch (err) {
    console.error('DELETE /admin/infolettre/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ─── PATCH /api/admin/infolettre/:id — activer / désactiver ───────────────
// Alternative plus douce à la suppression : garder l'historique mais
// arrêter de lui envoyer des courriels (ex: le temps de vérifier un doute).
router.patch('/infolettre/:id', async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE infolettre_abonnes
       SET actif = $2, date_desabonnement = CASE WHEN $2 = false THEN NOW() ELSE NULL END
       WHERE id = $1 RETURNING id, email, actif`,
      [id, !!actif]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Abonné introuvable' });
    res.json({ succes: true, abonne: rows[0] });
  } catch (err) {
    console.error('PATCH /admin/infolettre/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

module.exports = router;