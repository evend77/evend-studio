// CHEMIN : routes/boutique_expedition_config.js
// e-Vend Studio — Méthodes d'expédition du gestionnaire (templates boutique, solo).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/expedition
//   GET    /transporteurs      → liste fixe des transporteurs, provinces, logos (pour l'écran)
//   GET    /methodes           → toutes mes méthodes (actives ou non)
//   GET    /methodes/details   → mes méthodes actives enrichies (nom, logo, libellé de prix) — pour le choix dans l'annonce
//   PUT    /methodes           → enregistrer { methodes: [...] } (remplace ma liste ; les retirées sont supprimées)
//   GET    /config             → livraison gratuite globale
//   PATCH  /config             → modifier la livraison gratuite globale

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const E = require('../services/boutique_expedition');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

class Refus extends Error { constructor(message, status) { super(message); this.status = status || 400; } }
const bad = (m, s) => { throw new Refus(m, s); };
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Refus) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_expedition_config]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function texte(v, nom, max, obligatoire) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') bad(`${nom} invalide`);
  const t = v.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  if (t.length > max) bad(`${nom} trop long (max ${max} caractères)`);
  if (obligatoire && !t) bad(`${nom} requis`);
  return t;
}
function nombre(v, nom, min, max, vide) {
  if (v === undefined || v === null || v === '') { if (vide === undefined) bad(`${nom} requis`); return vide; }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) bad(`${nom} invalide (entre ${min} et ${max})`);
  return Math.round(n * 100) / 100;
}

const MODES = ['fixe', 'fixe_kg', 'kg', 'zone'];
const IDS = Object.keys(E.TRANSPORTEURS).map(Number).concat(E.IDS_PERSONNALISES);

router.get('/transporteurs', h(async (req, res) => {
  res.json({
    transporteurs: Object.keys(E.TRANSPORTEURS).map((k) => ({ id: Number(k), nom: E.TRANSPORTEURS[k].nom, logo: E.TRANSPORTEURS[k].logo })),
    ids_personnalises: E.IDS_PERSONNALISES, logos_personnalises: E.LOGOS_PERSONNALISES, provinces: E.PROVINCES,
  });
}));

router.get('/methodes', h(async (req, res) => {
  const r = await pool.query('SELECT * FROM boutique_methodes_expedition WHERE gestionnaire_id = $1 ORDER BY transporteur_id', [req.gid]);
  res.json(r.rows);
}));

router.get('/methodes/details', h(async (req, res) => {
  const r = await pool.query('SELECT * FROM boutique_methodes_expedition WHERE gestionnaire_id = $1 AND actif = true ORDER BY transporteur_id', [req.gid]);
  const dev = await E.deviseDe(pool, req.gid);
  res.json(r.rows.map((m) => ({ ...E.enrichir(m, null, 0, 'QC'), libelle_prix: E.libellePrix(m, dev) })));
}));

function lireMethode(m) {
  if (!m || typeof m !== 'object') bad('Méthode invalide');
  const tid = Number(m.transporteur_id);
  if (!IDS.includes(tid)) bad('Transporteur invalide');
  let nomPerso = null, logoPerso = null;
  if (E.IDS_PERSONNALISES.includes(tid)) {
    nomPerso = texte(m.nom_personnalise, 'Nom du transporteur', 100, true);
    if (!E.LOGOS_PERSONNALISES.includes(m.logo_personnalise)) bad('Logo de transporteur personnalisé invalide');
    logoPerso = m.logo_personnalise;
  }
  const mode = MODES.includes(m.mode_calcul) ? m.mode_calcul : 'fixe';
  const montant = (v, nom) => (v === undefined || v === null || v === '' ? null : nombre(v, nom, 0, 100000, null));
  let zones = null;
  if (mode === 'zone') {
    if (!m.frais_zones || typeof m.frais_zones !== 'object') bad('Frais par province requis');
    zones = {};
    for (const code of E.PROVINCES) {
      const v = m.frais_zones[code];
      if (v === undefined) bad(`Frais manquant pour ${code}`);
      zones[code] = v === null || v === 'non' ? null : String(nombre(v, `Frais ${code}`, 0, 100000));
    }
  }
  return {
    tid, mode, nomPerso, logoPerso, zones,
    fixes: montant(m.frais_fixes, 'Frais fixe'), parKg: montant(m.frais_par_kg, 'Frais par kg'), gratuit: montant(m.gratuit_superieur, 'Livraison gratuite dès'),
    delais: texte(m.delais_estime, 'Délais estimés', 100) || null,
    combine: m.combine_shipping === true, fixeUnique: m.combine_frais_fixe_unique !== false, kgAdd: m.combine_kg_additionne !== false,
  };
}

router.put('/methodes', h(async (req, res) => {
  const liste = req.body && req.body.methodes;
  if (!Array.isArray(liste) || liste.length > 20) bad('Données invalides');
  const ms = liste.map(lireMethode);
  ms.forEach((m) => {
    if ((m.mode === 'fixe' || m.mode === 'fixe_kg') && m.fixes === null && m.tid !== 14) bad('Frais fixe requis');
    if ((m.mode === 'kg' || m.mode === 'fixe_kg') && !m.parKg) bad('Frais par kg requis');
  });
  if (new Set(ms.map((m) => m.tid)).size !== ms.length) bad('Transporteur en double');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // On ne supprime que les transporteurs retirés : les identifiants restent stables, donc les choix des annonces aussi
    await client.query('DELETE FROM boutique_methodes_expedition WHERE gestionnaire_id = $1 AND transporteur_id <> ALL($2::int[])', [req.gid, ms.map((m) => m.tid)]);
    for (const m of ms) {
      await client.query(
        `INSERT INTO boutique_methodes_expedition (gestionnaire_id, transporteur_id, actif, frais_fixes, frais_par_kg, delais_estime,
                gratuit_superieur, mode_calcul, combine_shipping, combine_frais_fixe_unique, combine_kg_additionne, frais_zones,
                nom_personnalise, logo_personnalise, updated_at)
         VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
         ON CONFLICT (gestionnaire_id, transporteur_id) DO UPDATE SET actif=true, frais_fixes=EXCLUDED.frais_fixes, frais_par_kg=EXCLUDED.frais_par_kg,
                delais_estime=EXCLUDED.delais_estime, gratuit_superieur=EXCLUDED.gratuit_superieur, mode_calcul=EXCLUDED.mode_calcul,
                combine_shipping=EXCLUDED.combine_shipping, combine_frais_fixe_unique=EXCLUDED.combine_frais_fixe_unique,
                combine_kg_additionne=EXCLUDED.combine_kg_additionne, frais_zones=EXCLUDED.frais_zones,
                nom_personnalise=EXCLUDED.nom_personnalise, logo_personnalise=EXCLUDED.logo_personnalise, updated_at=NOW()`,
        [req.gid, m.tid, m.fixes, m.parKg, m.delais, m.gratuit, m.mode, m.combine, m.fixeUnique, m.kgAdd,
         m.zones ? JSON.stringify(m.zones) : null, m.nomPerso, m.logoPerso]);
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
  res.json({ success: true, message: "Méthodes d'expédition sauvegardées" });
}));

router.get('/config', h(async (req, res) => {
  const c = await E.reglagesDe(pool, req.gid);
  res.json({
    livraison_gratuite_globale_actif: !!(c && c.livraison_gratuite_globale_actif),
    livraison_gratuite_globale_seuil: c && c.livraison_gratuite_globale_seuil !== null ? Number(c.livraison_gratuite_globale_seuil) : 0,
    livraison_gratuite_globale_provinces: (c && c.livraison_gratuite_globale_provinces) || [],
  });
}));

router.patch('/config', h(async (req, res) => {
  const b = req.body || {};
  if (typeof b.livraison_gratuite_globale_actif !== 'boolean') bad('Valeur invalide');
  const seuil = nombre(b.livraison_gratuite_globale_seuil, 'Montant minimum', 0, 1000000, 0);
  const provs = b.livraison_gratuite_globale_provinces === undefined ? [] : b.livraison_gratuite_globale_provinces;
  if (!Array.isArray(provs) || provs.some((p) => E.PROVINCES.indexOf(p) < 0)) bad('Provinces invalides');
  if (b.livraison_gratuite_globale_actif && !(seuil > 0)) bad("Indiquez un montant d'achat minimum supérieur à 0 $");
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, livraison_gratuite_globale_actif, livraison_gratuite_globale_seuil, livraison_gratuite_globale_provinces, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET livraison_gratuite_globale_actif = EXCLUDED.livraison_gratuite_globale_actif,
       livraison_gratuite_globale_seuil = EXCLUDED.livraison_gratuite_globale_seuil,
       livraison_gratuite_globale_provinces = EXCLUDED.livraison_gratuite_globale_provinces, updated_at = NOW()`,
    [req.gid, b.livraison_gratuite_globale_actif, seuil, JSON.stringify(Array.from(new Set(provs)))]);
  res.json({ success: true });
}));

module.exports = router;