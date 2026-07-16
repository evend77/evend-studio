// routes/admin_monetisation_sponsors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// ⚙️ CONFIG — montant fixe par clic (global + par gestionnaire)
// ════════════════════════════════════════════════════════════════

// GET — Valeur par défaut + liste des gestionnaires (avec recherche/pagination)
router.get('/config', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const cfg = await pool.query('SELECT montant_par_clic_defaut FROM configuration_monetisation_pub WHERE id = 1');
    const defaut = parseFloat(cfg.rows[0]?.montant_par_clic_defaut ?? 0.10);

    const whereSearch = search ? `AND (g.nom_boutique ILIKE '%' || $1 || '%' OR g.email ILIKE '%' || $1 || '%' OR g.id::text = $1)` : '';
    const paramsCount = search ? [search] : [];
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM gestionnaires g
       JOIN options_gestionnaire og ON og.gestionnaire_id = g.id
       WHERE og.pub_sponsor = true ${whereSearch}`,
      paramsCount
    );
    const total = parseInt(countResult.rows[0].total);

    const paramsListe = search ? [search, limit, offset] : [limit, offset];
    const limitIdx = search ? 2 : 1;
    const offsetIdx = search ? 3 : 2;

    const result = await pool.query(
      `SELECT g.id, g.nom_boutique, g.email, g.montant_par_clic
       FROM gestionnaires g
       JOIN options_gestionnaire og ON og.gestionnaire_id = g.id
       WHERE og.pub_sponsor = true ${whereSearch}
       ORDER BY g.nom_boutique
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    res.json({
      defaut,
      gestionnaires: result.rows.map(g => ({
        id: g.id, nom_boutique: g.nom_boutique, email: g.email,
        montant_par_clic: g.montant_par_clic === null ? null : parseFloat(g.montant_par_clic),
        utilise_defaut: g.montant_par_clic === null,
      })),
      total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('❌ Erreur config monétisation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT — Modifier la valeur par défaut globale
router.put('/config/defaut', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { montant } = req.body;
    if (montant === undefined || isNaN(parseFloat(montant)) || parseFloat(montant) < 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    await pool.query(
      `UPDATE configuration_monetisation_pub SET montant_par_clic_defaut = $1, updated_at = NOW() WHERE id = 1`,
      [montant]
    );
    res.json({ success: true, montant: parseFloat(montant) });
  } catch (error) {
    console.error('❌ Erreur modification défaut monétisation:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du montant par défaut' });
  }
});

// PUT — Modifier (ou retirer) le montant personnalisé d'un gestionnaire précis
// montant = null → revient à utiliser la valeur par défaut
router.put('/config/:gestionnaireId', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { montant } = req.body;
    if (montant !== null && (isNaN(parseFloat(montant)) || parseFloat(montant) < 0)) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    const result = await pool.query(
      `UPDATE gestionnaires SET montant_par_clic = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [montant, gestionnaireId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur modification montant gestionnaire:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du montant' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📢 ONGLET SPONSOR — stats détaillées de toutes les pubs
// ════════════════════════════════════════════════════════════════

router.get('/sponsors-stats', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const whereSearch = search
      ? `AND (sp.id::text = $1 OR sp.titre ILIKE '%' || $1 || '%' OR s.nom ILIKE '%' || $1 || '%')`
      : '';
    const paramsCount = search ? [search] : [];
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM sponsor_pubs sp JOIN sponsors s ON s.id = sp.sponsor_id WHERE 1=1 ${whereSearch}`,
      paramsCount
    );
    const total = parseInt(countResult.rows[0].total);

    const paramsListe = search ? [search, limit, offset] : [limit, offset];
    const limitIdx = search ? 2 : 1;
    const offsetIdx = search ? 3 : 2;

    const result = await pool.query(
      `SELECT
        sp.id, sp.titre, sp.type, sp.impressions, sp.clics, sp.prix_par_click,
        sp.budget_montant, sp.budget_depense, sp.statut,
        s.nom AS sponsor_nom
       FROM sponsor_pubs sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE 1=1 ${whereSearch}
       ORDER BY sp.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    const pubs = result.rows.map(p => {
      const impressions = parseInt(p.impressions) || 0;
      const clics = parseInt(p.clics) || 0;
      const ctr = impressions > 0 ? (clics / impressions) * 100 : 0;
      const depense = parseFloat(p.budget_depense) || 0;
      const budget = parseFloat(p.budget_montant) || 0;
      return {
        id: p.id, titre: p.titre, type: p.type, sponsor_nom: p.sponsor_nom,
        impressions, clics, ctr,
        depense, budget, restant: Math.max(0, budget - depense),
        statut: p.statut,
      };
    });

    res.json({ pubs, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    console.error('❌ Erreur stats sponsors (admin):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🏪 ONGLET GESTIONNAIRE — revenu total + revenu du mois en cours
// ════════════════════════════════════════════════════════════════

router.get('/gestionnaires-revenu', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const cfg = await pool.query('SELECT montant_par_clic_defaut FROM configuration_monetisation_pub WHERE id = 1');
    const montantDefaut = parseFloat(cfg.rows[0]?.montant_par_clic_defaut ?? 0.10);

    const whereSearch = search ? `AND (g.nom_boutique ILIKE '%' || $1 || '%' OR g.email ILIKE '%' || $1 || '%' OR g.id::text = $1)` : '';
    const paramsCount = search ? [search] : [];
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM gestionnaires g
       JOIN options_gestionnaire og ON og.gestionnaire_id = g.id
       WHERE og.pub_sponsor = true ${whereSearch}`,
      paramsCount
    );
    const total = parseInt(countResult.rows[0].total);

    const paramsListe = search ? [search, limit, offset] : [limit, offset];
    const limitIdx = search ? 2 : 1;
    const offsetIdx = search ? 3 : 2;

    const result = await pool.query(
      `SELECT
        g.id, g.nom_boutique, g.email, g.montant_par_clic,
        COALESCE(SUM(aps.clics), 0) as clics_total,
        COALESCE(SUM(aps.clics) FILTER (WHERE aps.date >= date_trunc('month', CURRENT_DATE)), 0) as clics_mois,
        COALESCE(SUM(aps.impressions), 0) as impressions_total
       FROM gestionnaires g
       JOIN options_gestionnaire og ON og.gestionnaire_id = g.id
       LEFT JOIN addon_pub_stats aps ON aps.gestionnaire_id = g.id
       WHERE og.pub_sponsor = true ${whereSearch}
       GROUP BY g.id
       ORDER BY clics_total DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    const gestionnaires = result.rows.map(g => {
      const montant = g.montant_par_clic !== null ? parseFloat(g.montant_par_clic) : montantDefaut;
      const clicsTotal = parseInt(g.clics_total) || 0;
      const clicsMois = parseInt(g.clics_mois) || 0;
      return {
        id: g.id, nom_boutique: g.nom_boutique, email: g.email,
        montant_par_clic: montant,
        impressions_total: parseInt(g.impressions_total) || 0,
        clics_total: clicsTotal,
        clics_mois: clicsMois,
        revenu_total: clicsTotal * montant,
        revenu_mois: clicsMois * montant,
      };
    });

    res.json({ gestionnaires, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    console.error('❌ Erreur revenu gestionnaires (admin):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des revenus' });
  }
});

module.exports = router;