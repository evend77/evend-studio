// routes/menus.js
// Gestion des menus de la plateforme e-Vend — CRUD complet

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken, isAdmin);

// ─── MENUS ────────────────────────────────────────────────────────────────

// GET /api/menus — Liste tous les menus avec leurs items
router.get('/', async (req, res) => {
  try {
    const menus = await pool.query(
      `SELECT * FROM menus ORDER BY type, id`
    );

    // Pour chaque menu, récupérer ses items (avec sous-items)
    const result = [];
    for (const menu of menus.rows) {
      const items = await pool.query(
        `SELECT * FROM menu_items 
         WHERE menu_id = $1 
         ORDER BY ordre ASC, id ASC`,
        [menu.id]
      );
      // Construire l'arbre parent/enfants
      const arbre = construireArbre(items.rows);
      result.push({ ...menu, items: arbre });
    }

    res.json({ menus: result });
  } catch (err) {
    console.error('GET /menus:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menus/:id — Un menu avec ses items
router.get('/:id', async (req, res) => {
  try {
    const menu = await pool.query(
      `SELECT * FROM menus WHERE id = $1`, [req.params.id]
    );
    if (menu.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });

    const items = await pool.query(
      `SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY ordre ASC, id ASC`,
      [req.params.id]
    );

    res.json({ menu: { ...menu.rows[0], items: construireArbre(items.rows) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/menus — Créer un nouveau menu
router.post('/', async (req, res) => {
  const { nom, type, description } = req.body;
  if (!nom || !type) return res.status(400).json({ error: 'nom et type requis' });

  const slug = nom.toLowerCase()
    .replace(/[àáâã]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôõ]/g, 'o').replace(/[ùûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    const result = await pool.query(
      `INSERT INTO menus (nom, slug, type, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nom, slug + '-' + Date.now(), type, description]
    );
    res.status(201).json({ menu: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/menus/:id — Modifier un menu
router.patch('/:id', async (req, res) => {
  const { nom, description, actif } = req.body;
  try {
    const result = await pool.query(
      `UPDATE menus SET 
        nom         = COALESCE($1, nom),
        description = COALESCE($2, description),
        actif       = COALESCE($3, actif),
        updated_at  = NOW()
       WHERE id = $4 RETURNING *`,
      [nom, description, actif, req.params.id]
    );
    res.json({ menu: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menus/:id — Supprimer un menu
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM menus WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Menu supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ITEMS DE MENU ────────────────────────────────────────────────────────

// POST /api/menus/:menuId/items — Ajouter un item
router.post('/:menuId/items', async (req, res) => {
  const { menuId } = req.params;
  const {
    parent_id, label, url, type_lien, cible,
    icone, ordre, taille_texte, gras, italique, couleur, visible
  } = req.body;

  if (!label) return res.status(400).json({ error: 'label requis' });

  try {
    // Calculer l'ordre si pas fourni
    let ordreItem = ordre;
    if (ordreItem === undefined || ordreItem === null) {
      const maxOrdre = await pool.query(
        `SELECT COALESCE(MAX(ordre), -1) + 1 AS next_ordre 
         FROM menu_items WHERE menu_id = $1 AND parent_id IS NOT DISTINCT FROM $2`,
        [menuId, parent_id || null]
      );
      ordreItem = maxOrdre.rows[0].next_ordre;
    }

    const result = await pool.query(
      `INSERT INTO menu_items 
        (menu_id, parent_id, label, url, type_lien, cible, icone, ordre, taille_texte, gras, italique, couleur, visible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [menuId, parent_id || null, label, url || null, type_lien || 'custom',
       cible || '_self', icone || null, ordreItem, taille_texte || 14,
       gras || false, italique || false, couleur || null, visible !== false]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/menus/:menuId/items/:itemId — Modifier un item
router.patch('/:menuId/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const {
    label, url, type_lien, cible, icone,
    taille_texte, gras, italique, couleur, visible, ordre, parent_id
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE menu_items SET
        label        = COALESCE($1,  label),
        url          = COALESCE($2,  url),
        type_lien    = COALESCE($3,  type_lien),
        cible        = COALESCE($4,  cible),
        icone        = COALESCE($5,  icone),
        taille_texte = COALESCE($6,  taille_texte),
        gras         = COALESCE($7,  gras),
        italique     = COALESCE($8,  italique),
        couleur      = COALESCE($9,  couleur),
        visible      = COALESCE($10, visible),
        ordre        = COALESCE($11, ordre),
        parent_id    = COALESCE($12, parent_id),
        updated_at   = NOW()
       WHERE id = $13 RETURNING *`,
      [label, url, type_lien, cible, icone, taille_texte, gras,
       italique, couleur, visible, ordre, parent_id, itemId]
    );
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menus/:menuId/items/reordonner — Réordonner les items
router.put('/:menuId/items/reordonner', async (req, res) => {
  const { ordres } = req.body; // [{ id: 1, ordre: 0 }, { id: 2, ordre: 1 }, ...]
  if (!Array.isArray(ordres)) return res.status(400).json({ error: 'ordres requis' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre } of ordres) {
      await client.query(
        `UPDATE menu_items SET ordre = $1, updated_at = NOW() WHERE id = $2`,
        [ordre, id]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Ordre mis à jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/menus/:menuId/items/:itemId — Supprimer un item
router.delete('/:menuId/items/:itemId', async (req, res) => {
  try {
    await pool.query(`DELETE FROM menu_items WHERE id = $1`, [req.params.itemId]);
    res.json({ message: 'Item supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTE PUBLIQUE — menu par slug (pour le frontend) ────────────────────
// GET /api/menus/public/:slug — Sans auth, pour afficher le menu sur le site
router.get('/public/:slug', async (req, res) => {
  try {
    const menu = await pool.query(
      `SELECT * FROM menus WHERE slug = $1 AND actif = true`, [req.params.slug]
    );
    if (menu.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });

    const items = await pool.query(
      `SELECT * FROM menu_items 
       WHERE menu_id = $1 AND visible = true
       ORDER BY ordre ASC, id ASC`,
      [menu.rows[0].id]
    );

    res.json({ menu: { ...menu.rows[0], items: construireArbre(items.rows) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HELPER — Construire arbre parent/enfants ──────────────────────────────
function construireArbre(items) {
  const map = {};
  const racines = [];

  for (const item of items) {
    map[item.id] = { ...item, sous_items: [] };
  }
  for (const item of items) {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].sous_items.push(map[item.id]);
    } else {
      racines.push(map[item.id]);
    }
  }
  return racines;
}

module.exports = router;