// routes/menus.js
// Menus gérés de e-Vend Studio : menu du haut (« principal ») et bas de page (« footer »).
// Admin : CRUD complet. Public : GET /api/menus/public/type/principal  ou  /footer
//
// Les tables `menus` et `menu_items` sont créées automatiquement au premier démarrage
// (avec les liens actuels du site comme point de départ). Rien à lancer à la main.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Pour l'instant : administrateur seulement.
// Quand les permissions seront ajoutées à Studio, il suffira d'ajouter ici
// le contrôle (ex. verifierPermission('parametres')) à la fin de ce tableau.
const admin = [authenticateToken, isAdmin];

const TYPES_MENU  = ['principal', 'footer'];
// custom = URL libre · page = page du site · ancre = défilement vers une section de l'accueil
// politiques = liste déroulante des politiques (bas de page)
const TYPES_LIEN  = ['custom', 'page', 'ancre', 'politiques'];

// ─── CRÉATION AUTOMATIQUE DES TABLES (une seule fois) ─────────────────────

const LIENS_PRINCIPAL = [
  ['Templates',      '/#templates', 'ancre'],
  ['Fonctionnalités', '/#features',  'ancre'],
  ['Blog',           '/blog',       'page'],
  ['FAQ',            '/faq',        'page'],
  ['Documents',      '/documents',  'page'],
];
const LIENS_FOOTER = [
  ['Templates',      '/#templates', 'ancre'],
  ['Fonctionnalités', '/#features',  'ancre'],
  ['Blog',           '/blog',       'page'],
  ['FAQ',            '/faq',        'page'],
  ['Documents',      '/documents',  'page'],
  ['Contact',        '/contact',    'page'],
  ['Nos politiques', null,          'politiques'],
];

async function initialiser() {
  const existe = await pool.query(`SELECT to_regclass('public.menus') AS t`);
  if (existe.rows[0].t) return; // déjà en place : on ne touche à rien

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE menus (
        id          SERIAL PRIMARY KEY,
        nom         VARCHAR(100) NOT NULL,
        slug        VARCHAR(200) NOT NULL UNIQUE,
        type        VARCHAR(20)  NOT NULL CHECK (type IN ('principal','footer')),
        description TEXT,
        actif       BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE menu_items (
        id           SERIAL PRIMARY KEY,
        menu_id      INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        parent_id    INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        label        VARCHAR(60) NOT NULL,
        url          TEXT,
        type_lien    VARCHAR(30) NOT NULL DEFAULT 'custom',
        cible        VARCHAR(10) NOT NULL DEFAULT '_self' CHECK (cible IN ('_self','_blank')),
        icone        VARCHAR(16),
        ordre        INTEGER NOT NULL DEFAULT 0,
        taille_texte INTEGER NOT NULL DEFAULT 14 CHECK (taille_texte BETWEEN 10 AND 24),
        gras         BOOLEAN NOT NULL DEFAULT false,
        italique     BOOLEAN NOT NULL DEFAULT false,
        couleur      VARCHAR(9),
        visible      BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX idx_menu_items_menu   ON menu_items (menu_id, ordre)`);
    await client.query(`CREATE INDEX idx_menu_items_parent ON menu_items (parent_id)`);

    const graines = [
      ['Menu principal', 'menu-principal', 'principal', LIENS_PRINCIPAL],
      ['Pied de page',   'pied-de-page',   'footer',    LIENS_FOOTER],
    ];
    for (const [nom, slug, type, liens] of graines) {
      const m = await client.query(
        `INSERT INTO menus (nom, slug, type, description) VALUES ($1,$2,$3,$4) RETURNING id`,
        [nom, slug, type, 'Créé automatiquement avec les liens actuels du site']
      );
      for (let i = 0; i < liens.length; i++) {
        await client.query(
          `INSERT INTO menu_items (menu_id, label, url, type_lien, ordre) VALUES ($1,$2,$3,$4,$5)`,
          [m.rows[0].id, liens[i][0], liens[i][1], liens[i][2], i]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const pret = initialiser().catch(err => {
  console.error('menus: création des tables impossible:', err.message);
  throw err;
});
pret.catch(() => {}); // évite un avertissement « rejet non géré » ; chaque requête re-signale l'erreur

router.use(async (req, res, next) => {
  try { await pret; next(); }
  catch (err) { res.status(500).json({ error: 'Menus indisponibles (tables non créées)' }); }
});

// ─── OUTILS DE VALIDATION ─────────────────────────────────────────────────

// Identifiant numérique valide (évite une erreur SQL 500 sur un id mal formé)
function idValide(v) {
  return /^\d{1,9}$/.test(String(v));
}

// URL d'un élément : vide, chemin du site (/... ou /#ancre), ou http(s)://.
// Tout le reste est refusé (ex. « javascript: », ou « // » qui mènerait vers un autre site).
function urlMenuValide(url) {
  if (url === undefined || url === null || url === '') return true;
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (u.length > 500) return false;
  return /^\/(?![\/\\])/.test(u) || /^https?:\/\//i.test(u);
}

const aucun = v => v === undefined || v === null || v === '';

// Valide et nettoie les champs d'un élément. Renvoie { erreur } ou { valeurs } (champs envoyés seulement).
function validerItem(body, creation) {
  const b = body || {};
  const a = k => Object.prototype.hasOwnProperty.call(b, k) && b[k] !== undefined;
  const v = {};

  if (a('label') || creation) {
    if (typeof b.label !== 'string' || !b.label.trim()) return { erreur: 'label requis' };
    if (b.label.trim().length > 60) return { erreur: 'label trop long (60 caractères maximum)' };
    v.label = b.label.trim();
  }
  if (a('url')) {
    if (!urlMenuValide(b.url)) return { erreur: 'URL invalide (doit commencer par / ou http(s)://)' };
    v.url = aucun(b.url) ? null : b.url.trim();
  }
  if (a('type_lien')) {
    if (!TYPES_LIEN.includes(b.type_lien)) return { erreur: 'type_lien invalide' };
    v.type_lien = b.type_lien;
  }
  if (a('cible')) {
    if (b.cible !== '_self' && b.cible !== '_blank') return { erreur: 'cible invalide' };
    v.cible = b.cible;
  }
  if (a('icone')) {
    if (aucun(b.icone)) v.icone = null;
    else if (typeof b.icone !== 'string' || b.icone.trim().length > 16) return { erreur: 'icône invalide (16 caractères maximum)' };
    else v.icone = b.icone.trim();
  }
  if (a('couleur')) {
    if (aucun(b.couleur)) v.couleur = null;
    else if (typeof b.couleur !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(b.couleur)) return { erreur: 'couleur invalide (ex. #f5a623)' };
    else v.couleur = b.couleur;
  }
  if (a('taille_texte')) {
    const t = Number(b.taille_texte);
    if (!Number.isInteger(t) || t < 10 || t > 24) return { erreur: 'taille_texte doit être entre 10 et 24' };
    v.taille_texte = t;
  }
  for (const k of ['gras', 'italique', 'visible']) {
    if (a(k)) {
      if (typeof b[k] !== 'boolean') return { erreur: `${k} doit être vrai ou faux` };
      v[k] = b[k];
    }
  }
  if (a('ordre') && !aucun(b.ordre)) {
    const o = Number(b.ordre);
    if (!Number.isInteger(o) || o < 0 || o > 100000) return { erreur: 'ordre invalide' };
    v.ordre = o;
  }
  return { valeurs: v };
}

// Vérifie que parentId est un élément RACINE du même menu (un seul niveau de sous-menu),
// et que l'élément déplacé n'est pas lui-même un parent. itemId = null à la création.
// Renvoie null si OK, sinon le message d'erreur.
async function verifierParent(menuId, itemId, parentId) {
  if (aucun(parentId)) return null;
  if (!idValide(parentId)) return 'Parent invalide';
  if (itemId !== null && String(parentId) === String(itemId)) return 'Un élément ne peut pas être son propre parent';
  const p = await pool.query(`SELECT id, parent_id FROM menu_items WHERE id = $1 AND menu_id = $2`, [parentId, menuId]);
  if (p.rows.length === 0) return 'Parent invalide';
  if (p.rows[0].parent_id) return 'Un seul niveau de sous-menu est permis';
  if (itemId !== null) {
    const enfants = await pool.query(`SELECT 1 FROM menu_items WHERE parent_id = $1 LIMIT 1`, [itemId]);
    if (enfants.rows.length > 0) return 'Cet élément contient des sous-menus : déplacez-les d\'abord';
  }
  return null;
}

function construireArbre(items) {
  const map = {};
  const racines = [];
  for (const item of items) map[item.id] = { ...item, sous_items: [] };
  for (const item of items) {
    if (item.parent_id && map[item.parent_id]) map[item.parent_id].sous_items.push(map[item.id]);
    else racines.push(map[item.id]);
  }
  return racines;
}

// ─── ROUTE PUBLIQUE — menu actif par type (pour le site) ──────────────────
// GET /api/menus/public/type/principal  ou  /api/menus/public/type/footer
// Sans connexion. Renvoie le premier menu actif de ce type, avec ses items visibles.
// Un item dont le parent est masqué n'est pas affiché.
router.get('/public/type/:type', async (req, res) => {
  const type = req.params.type;
  if (!TYPES_MENU.includes(type)) return res.status(400).json({ error: 'Type invalide' });
  try {
    const menu = await pool.query(
      `SELECT * FROM menus WHERE type = $1 AND actif = true ORDER BY id ASC LIMIT 1`, [type]
    );
    if (menu.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });

    const items = await pool.query(
      `SELECT * FROM menu_items WHERE menu_id = $1 AND visible = true ORDER BY ordre ASC, id ASC`,
      [menu.rows[0].id]
    );

    const atteignables = new Set();
    let change = true;
    while (change) {
      change = false;
      for (const it of items.rows) {
        if (atteignables.has(it.id)) continue;
        if (!it.parent_id || atteignables.has(it.parent_id)) { atteignables.add(it.id); change = true; }
      }
    }
    const visibles = items.rows.filter(it => atteignables.has(it.id));

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ menu: { ...menu.rows[0], items: construireArbre(visibles) } });
  } catch (err) {
    console.error('GET /menus/public/type:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── MENUS (admin) ────────────────────────────────────────────────────────

// GET /api/menus — tous les menus avec leurs items (en arbre)
router.get('/', ...admin, async (req, res) => {
  try {
    const menus = await pool.query(`SELECT * FROM menus ORDER BY type, id`);
    const items = await pool.query(`SELECT * FROM menu_items ORDER BY ordre ASC, id ASC`);
    const parMenu = {};
    for (const it of items.rows) (parMenu[it.menu_id] = parMenu[it.menu_id] || []).push(it);
    res.json({ menus: menus.rows.map(m => ({ ...m, items: construireArbre(parMenu[m.id] || []) })) });
  } catch (err) {
    console.error('GET /menus:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/menus/:id — un menu avec ses items
router.get('/:id', ...admin, async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide' });
  try {
    const menu = await pool.query(`SELECT * FROM menus WHERE id = $1`, [req.params.id]);
    if (menu.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });
    const items = await pool.query(
      `SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY ordre ASC, id ASC`, [req.params.id]
    );
    res.json({ menu: { ...menu.rows[0], items: construireArbre(items.rows) } });
  } catch (err) {
    console.error('GET /menus/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/menus — créer un menu
router.post('/', ...admin, async (req, res) => {
  const { nom, type, description } = req.body || {};
  if (typeof nom !== 'string' || !nom.trim()) return res.status(400).json({ error: 'nom et type requis' });
  if (nom.trim().length > 100) return res.status(400).json({ error: 'nom trop long (100 caractères maximum)' });
  if (!TYPES_MENU.includes(type)) return res.status(400).json({ error: 'type invalide (principal ou footer)' });
  if (!aucun(description) && (typeof description !== 'string' || description.length > 500)) {
    return res.status(400).json({ error: 'description invalide' });
  }

  const slug = nom.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'menu';

  try {
    const result = await pool.query(
      `INSERT INTO menus (nom, slug, type, description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [nom.trim(), `${slug}-${Date.now()}`, type, aucun(description) ? null : description]
    );
    res.status(201).json({ menu: result.rows[0] });
  } catch (err) {
    console.error('POST /menus:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/menus/:id — modifier nom, description, actif
router.patch('/:id', ...admin, async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide' });
  const b = req.body || {};
  const sets = [], valeurs = [];

  if (b.nom !== undefined) {
    if (typeof b.nom !== 'string' || !b.nom.trim() || b.nom.trim().length > 100) return res.status(400).json({ error: 'nom invalide' });
    valeurs.push(b.nom.trim()); sets.push(`nom = $${valeurs.length}`);
  }
  if (b.description !== undefined) {
    if (!aucun(b.description) && (typeof b.description !== 'string' || b.description.length > 500)) return res.status(400).json({ error: 'description invalide' });
    valeurs.push(aucun(b.description) ? null : b.description); sets.push(`description = $${valeurs.length}`);
  }
  if (b.actif !== undefined) {
    if (typeof b.actif !== 'boolean') return res.status(400).json({ error: 'actif doit être vrai ou faux' });
    valeurs.push(b.actif); sets.push(`actif = $${valeurs.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier' });

  try {
    valeurs.push(req.params.id);
    const result = await pool.query(
      `UPDATE menus SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${valeurs.length} RETURNING *`, valeurs
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });
    res.json({ menu: result.rows[0] });
  } catch (err) {
    console.error('PATCH /menus/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/menus/:id — supprimer un menu (et ses items)
router.delete('/:id', ...admin, async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide' });
  try {
    const r = await pool.query(`DELETE FROM menus WHERE id = $1`, [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Menu introuvable' });
    res.json({ message: 'Menu supprimé' });
  } catch (err) {
    console.error('DELETE /menus/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── ITEMS DE MENU (admin) ────────────────────────────────────────────────

// POST /api/menus/:menuId/items — ajouter un item
router.post('/:menuId/items', ...admin, async (req, res) => {
  const { menuId } = req.params;
  if (!idValide(menuId)) return res.status(400).json({ error: 'Identifiant invalide' });

  const { erreur, valeurs: v } = validerItem(req.body, true);
  if (erreur) return res.status(400).json({ error: erreur });
  const parentId = aucun((req.body || {}).parent_id) ? null : req.body.parent_id;

  try {
    const menu = await pool.query(`SELECT id FROM menus WHERE id = $1`, [menuId]);
    if (menu.rows.length === 0) return res.status(404).json({ error: 'Menu introuvable' });

    const erreurParent = await verifierParent(menuId, null, parentId);
    if (erreurParent) return res.status(400).json({ error: erreurParent });

    let ordreItem = v.ordre;
    if (ordreItem === undefined) {
      const r = await pool.query(
        `SELECT COALESCE(MAX(ordre), -1) + 1 AS next FROM menu_items WHERE menu_id = $1 AND parent_id IS NOT DISTINCT FROM $2`,
        [menuId, parentId]
      );
      ordreItem = r.rows[0].next;
    }

    const result = await pool.query(
      `INSERT INTO menu_items
        (menu_id, parent_id, label, url, type_lien, cible, icone, ordre, taille_texte, gras, italique, couleur, visible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [menuId, parentId, v.label, v.url ?? null, v.type_lien ?? 'custom', v.cible ?? '_self',
       v.icone ?? null, ordreItem, v.taille_texte ?? 14, v.gras ?? false, v.italique ?? false,
       v.couleur ?? null, v.visible ?? true]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error('POST /menus/:menuId/items:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/menus/:menuId/items/reordonner — réordonner  (déclaré avant le PATCH /:itemId)
router.put('/:menuId/items/reordonner', ...admin, async (req, res) => {
  const { ordres } = req.body || {};
  if (!idValide(req.params.menuId)) return res.status(400).json({ error: 'Identifiant invalide' });
  if (!Array.isArray(ordres) || ordres.length === 0 || ordres.length > 500) return res.status(400).json({ error: 'ordres requis' });
  for (const o of ordres) {
    if (!o || !idValide(o.id) || !Number.isInteger(o.ordre) || o.ordre < 0 || o.ordre > 100000) {
      return res.status(400).json({ error: 'ordres invalides' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre } of ordres) {
      await client.query(
        `UPDATE menu_items SET ordre = $1, updated_at = NOW() WHERE id = $2 AND menu_id = $3`,
        [ordre, id, req.params.menuId]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Ordre mis à jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /menus/:menuId/items/reordonner:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PATCH /api/menus/:menuId/items/:itemId — modifier un item
// Seuls les champs envoyés sont modifiés. url, icone, couleur et parent_id peuvent être vidés.
router.patch('/:menuId/items/:itemId', ...admin, async (req, res) => {
  const { menuId, itemId } = req.params;
  if (!idValide(menuId) || !idValide(itemId)) return res.status(400).json({ error: 'Identifiant invalide' });

  const body = req.body || {};
  const { erreur, valeurs: v } = validerItem(body, false);
  if (erreur) return res.status(400).json({ error: erreur });

  const aParent = Object.prototype.hasOwnProperty.call(body, 'parent_id');
  const sets = [], params = [];
  for (const champ of Object.keys(v)) { params.push(v[champ]); sets.push(`${champ} = $${params.length}`); }
  let parentId = null;
  if (aParent) {
    parentId = aucun(body.parent_id) ? null : body.parent_id;
    params.push(parentId); sets.push(`parent_id = $${params.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier' });

  try {
    if (aParent) {
      const erreurParent = await verifierParent(menuId, itemId, parentId);
      if (erreurParent) return res.status(400).json({ error: erreurParent });
    }
    params.push(itemId, menuId);
    const result = await pool.query(
      `UPDATE menu_items SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND menu_id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item introuvable' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error('PATCH /menus/:menuId/items/:itemId:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/menus/:menuId/items/:itemId — supprimer un item (et ses sous-items)
router.delete('/:menuId/items/:itemId', ...admin, async (req, res) => {
  const { menuId, itemId } = req.params;
  if (!idValide(menuId) || !idValide(itemId)) return res.status(400).json({ error: 'Identifiant invalide' });
  try {
    const r = await pool.query(`DELETE FROM menu_items WHERE id = $1 AND menu_id = $2`, [itemId, menuId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Item introuvable' });
    res.json({ message: 'Item supprimé' });
  } catch (err) {
    console.error('DELETE /menus/:menuId/items/:itemId:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;