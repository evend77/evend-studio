// CHEMIN : routes/boutique_acheteurs_gestionnaire.js
// e-Vend Studio — « Mes acheteurs » des templates boutique (solo). Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/acheteurs.
// Les acheteurs sont ceux inscrits sur CE site (marketplace_acheteurs.gestionnaire_id = le gestionnaire connecté).
// Ne touche ni au MV ni aux autres templates. Accès : gestionnaire connecté, limité à SES acheteurs.

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { dechiffrer } = require('../src/utils/chiffrement');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { console.error('[boutique_acheteurs_gestionnaire]', req.method, req.path, e && e.message ? e.message : e); res.status(500).json({ error: 'Erreur serveur' }); }
};

const sain = (v) => { try { return v ? dechiffrer(v) : ''; } catch (e) { return ''; } };

// Liste des acheteurs inscrits sur la boutique
router.get('/', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT id, prenom, nom, email, telephone, infolettre, COALESCE(suspendu, false) AS suspendu, created_at
       FROM marketplace_acheteurs WHERE gestionnaire_id = $1 ORDER BY created_at DESC LIMIT 5000`, [req.gid]);
  res.json({ acheteurs: r.rows });
}));

// Fiche d'un acheteur : réponses aux champs personnalisés + carnet d'adresses
router.get('/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identifiant invalide' });
  const a = await pool.query('SELECT id FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid]);
  if (!a.rows[0]) return res.status(404).json({ error: 'Acheteur introuvable' });
  const rep = await pool.query('SELECT reponses FROM boutique_acheteur_reponses WHERE gestionnaire_id = $1 AND acheteur_id = $2 ORDER BY id DESC LIMIT 1', [req.gid, id]);
  const adr = await pool.query('SELECT libelle, nom, adresse1, adresse2, ville, province, code_postal, pays, telephone, type, est_principale FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 ORDER BY est_principale DESC, id', [req.gid, id]);
  const adresses = adr.rows.map((x) => ({ libelle: x.libelle || '', nom: x.nom || '', adresse1: sain(x.adresse1), adresse2: sain(x.adresse2), ville: sain(x.ville), province: x.province || '', code_postal: sain(x.code_postal), pays: x.pays || '', telephone: x.telephone || '', type: x.type || 'livraison', est_principale: !!x.est_principale }));
  res.json({
    reponses: rep.rows[0] && Array.isArray(rep.rows[0].reponses) ? rep.rows[0].reponses : [],
    adresse: adresses[0] || null,   // première adresse (compatibilité)
    adresses,
  });
}));

// Suspendre / réactiver (un acheteur suspendu ne peut plus se connecter à la boutique)
router.put('/:id/suspendre', wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identifiant invalide' });
  if (typeof (req.body && req.body.suspendu) !== 'boolean') return res.status(400).json({ error: 'Valeur invalide' });
  const r = await pool.query('UPDATE marketplace_acheteurs SET suspendu = $1 WHERE id = $2 AND gestionnaire_id = $3 RETURNING id', [req.body.suspendu, id, req.gid]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Acheteur introuvable' });
  res.json({ ok: true, suspendu: req.body.suspendu });
}));

module.exports = router;