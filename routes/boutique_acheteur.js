// CHEMIN : routes/boutique_acheteur.js
// e-Vend Studio — Panier, caisse et commandes de l'ACHETEUR des templates boutique (solo).
// Monté par routes/boutique_index.js sur : /api/boutique/acheteur/:gid/…
//
// Le compte acheteur est celui du MV (marketplace_acheteurs + cookie mv_token_<gid>) : même connexion, mêmes jetons.
// Rien n'est lu dans les tables du MV sauf marketplace_acheteurs.

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const C = require('../services/boutique_commandes');
const R = require('../services/boutique_retours');

const router = express.Router({ mergeParams: true });

// ─── Garde : acheteur connecté À CETTE boutique, boutique en mode solo ────────
async function authAcheteur(req, res, next) {
  const gid = parseInt(req.params.gid, 10);
  if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ message: 'Boutique introuvable' });
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const auth = req.headers.authorization;
  const token = cookie || (auth && auth.startsWith('Bearer ') ? auth.slice(7) : null);
  if (!token) return res.status(401).json({ message: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.gestionnaireId !== gid) return res.status(403).json({ message: "Ce compte n'appartient pas à cette boutique." });
    if (payload.type !== 'acheteur') return res.status(403).json({ message: 'Un compte acheteur est requis.' });
    const a = await pool.query('SELECT suspendu FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [payload.id, gid]);
    if (!a.rows[0]) return res.status(401).json({ message: 'Compte introuvable' });
    if (a.rows[0].suspendu === true) return res.status(403).json({ message: 'Votre compte est suspendu. Contactez la boutique.', suspendu: true });
    const s = await pool.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
    if (!s.rows[0] || !String(s.rows[0].template_id || '').startsWith('boutique-')) return res.status(409).json({ message: "Cette boutique n'est pas disponible." });
    req.gid = gid;
    req.acheteurId = payload.id;
    next();
  } catch (e) { res.status(401).json({ message: 'Token invalide' }); }
}
router.use(authAcheteur);

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e instanceof C.ErreurCommande) return res.status(e.status).json({ message: e.message, code: e.code });
    console.error('[boutique-acheteur]', e.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 ? n : null; };

// ═════════════════════════════ PANIER ═════════════════════════════════════
router.get('/panier', wrap(async (req, res) => {
  const lignes = await C.lireLignes(pool, req.gid, req.acheteurId);
  const sousTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);
  res.json({ articles: lignes.map(C.publique), sous_total: Math.round(sousTotal * 100) / 100, problemes: lignes.filter((l) => l.erreur).map((l) => l.erreur) });
}));

router.post('/panier', wrap(async (req, res) => {
  const pid = entier(req.body.produit_id);
  const qte = entier(req.body.quantite === undefined ? 1 : req.body.quantite);
  const variante = String(req.body.variante || '').trim().slice(0, 200);
  if (!pid || !qte || qte > 99) return res.status(400).json({ message: 'Quantité invalide.' });
  const p = (await pool.query(
    `SELECT id, titre, prix, prix_promo, stock, variantes, statut, date_parution, date_expiration, quantite_min
       FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL`, [pid, req.gid])).rows[0];
  const pb = C.problemeDisponibilite(p);
  if (pb) return res.status(409).json({ message: `Cet article ${pb}.` });
  const c = C.prixEtStock(p, variante);
  if (c.erreur) return res.status(409).json({ message: c.erreur });
  const deja = (await pool.query('SELECT quantite FROM boutique_panier WHERE acheteur_id = $1 AND produit_id = $2 AND variante = $3', [req.acheteurId, pid, variante])).rows[0];
  const total = (deja ? deja.quantite : 0) + qte;
  if (total > c.stock) return res.status(409).json({ message: c.stock <= 0 ? 'Cet article est épuisé.' : `Stock insuffisant : il n'en reste que ${c.stock}.` });
  if (total > 99) return res.status(400).json({ message: 'Quantité maximale : 99.' });
  await pool.query(
    `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = $5, updated_at = NOW()`, [req.gid, req.acheteurId, pid, variante, total]);
  res.status(201).json({ message: 'Ajouté au panier', quantite: total });
}));

// « Plus tard » : déclaré AVANT les routes avec :id
router.get('/panier/plus-tard', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT pt.id, pt.produit_id, pt.variante, pt.quantite, p.titre, p.prix, p.prix_promo, p.photo_principale AS image_url, p.statut
       FROM boutique_panier_plus_tard pt JOIN produits p ON p.id = pt.produit_id AND p.gestionnaire_id = pt.gestionnaire_id AND p.collaborateur_id IS NULL
      WHERE pt.gestionnaire_id = $1 AND pt.acheteur_id = $2 ORDER BY pt.created_at DESC`, [req.gid, req.acheteurId]);
  res.json({ articles: r.rows.map((x) => ({ ...x, prix: C.prixEtStock(x, x.variante).prix ?? Number(x.prix) })) });
}));

router.post('/panier/plus-tard/:id/remettre', wrap(async (req, res) => {
  const id = entier(req.params.id);
  const a = (await pool.query('SELECT * FROM boutique_panier_plus_tard WHERE id = $1 AND acheteur_id = $2 AND gestionnaire_id = $3', [id, req.acheteurId, req.gid])).rows[0];
  if (!a) return res.status(404).json({ message: 'Article introuvable' });
  const p = (await pool.query('SELECT id, prix, prix_promo, stock, variantes, statut, date_parution, date_expiration FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL', [a.produit_id, req.gid])).rows[0];
  const pb = C.problemeDisponibilite(p);
  if (pb) return res.status(409).json({ message: `Cet article ${pb}.` });
  const c = C.prixEtStock(p, a.variante);
  if (c.erreur) return res.status(409).json({ message: c.erreur });
  const deja = (await pool.query('SELECT quantite FROM boutique_panier WHERE acheteur_id = $1 AND produit_id = $2 AND variante = $3', [req.acheteurId, a.produit_id, a.variante])).rows[0];
  const total = Math.min(99, (deja ? deja.quantite : 0) + a.quantite);
  if (total > c.stock) return res.status(409).json({ message: c.stock <= 0 ? 'Cet article est épuisé.' : `Stock insuffisant : il n'en reste que ${c.stock}.` });
  await pool.query(
    `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = $5, updated_at = NOW()`, [req.gid, req.acheteurId, a.produit_id, a.variante, total]);
  await pool.query('DELETE FROM boutique_panier_plus_tard WHERE id = $1', [id]);
  res.json({ message: 'Article remis au panier' });
}));

router.delete('/panier/plus-tard/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM boutique_panier_plus_tard WHERE id = $1 AND acheteur_id = $2 AND gestionnaire_id = $3', [entier(req.params.id), req.acheteurId, req.gid]);
  res.json({ message: 'Article supprimé' });
}));

router.post('/panier/:id/plus-tard', wrap(async (req, res) => {
  const id = entier(req.params.id);
  const l = (await pool.query('SELECT * FROM boutique_panier WHERE id = $1 AND acheteur_id = $2 AND gestionnaire_id = $3', [id, req.acheteurId, req.gid])).rows[0];
  if (!l) return res.status(404).json({ message: 'Article introuvable' });
  await pool.query(
    `INSERT INTO boutique_panier_plus_tard (gestionnaire_id, acheteur_id, produit_id, variante, quantite) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = EXCLUDED.quantite`, [req.gid, req.acheteurId, l.produit_id, l.variante, l.quantite]);
  await pool.query('DELETE FROM boutique_panier WHERE id = $1', [id]);
  res.json({ message: 'Article mis de côté' });
}));

router.patch('/panier/:id', wrap(async (req, res) => {
  const id = entier(req.params.id);
  const qte = entier(req.body.quantite);
  if (!id || !qte || qte > 99) return res.status(400).json({ message: 'Quantité invalide.' });
  const l = (await C.lireLignes(pool, req.gid, req.acheteurId)).find((x) => x.id === id);
  if (!l) return res.status(404).json({ message: 'Article introuvable' });
  if (qte > l.stock) return res.status(409).json({ message: l.stock <= 0 ? 'Cet article est épuisé.' : `Stock insuffisant : il n'en reste que ${l.stock}.` });
  await pool.query('UPDATE boutique_panier SET quantite = $1, updated_at = NOW() WHERE id = $2 AND acheteur_id = $3 AND gestionnaire_id = $4', [qte, id, req.acheteurId, req.gid]);
  res.json({ message: 'Quantité mise à jour' });
}));

router.delete('/panier/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM boutique_panier WHERE id = $1 AND acheteur_id = $2 AND gestionnaire_id = $3', [entier(req.params.id), req.acheteurId, req.gid]);
  res.json({ message: 'Article supprimé' });
}));

router.delete('/panier', wrap(async (req, res) => {
  await pool.query('DELETE FROM boutique_panier WHERE acheteur_id = $1 AND gestionnaire_id = $2', [req.acheteurId, req.gid]);
  res.json({ message: 'Panier vidé' });
}));

// ═════════════════════════════ CAISSE ═════════════════════════════════════
// Aperçu : méthodes d'expédition, modes de paiement offerts et totaux (taxes et expédition calculées par le serveur)
router.post('/caisse/infos', wrap(async (req, res) => {
  res.json(await C.apercu(req.gid, req.acheteurId, { province: String(req.body.province || '').toUpperCase(), methodeId: req.body.methode_id, codePromo: req.body.code_promo }));
}));

router.post('/caisse/commande', wrap(async (req, res) => {
  const b = req.body || {};
  res.status(201).json(await C.creerCommande({ gid: req.gid, acheteurId: req.acheteurId, adresse: b.adresse, methodeId: b.methode_id, note: b.note, mode: b.mode, codePromo: b.code_promo }));
}));

// ═════════════════════════════ COMMANDES ══════════════════════════════════
const COLS = `id, numero_commande, statut, statut_paiement, mode_paiement, devise, sous_total, rabais, code_promo, frais_expedition, taxes, total, articles, methode_expedition, adresse_livraison, note, expire_le, paye_le, created_at`;

router.get('/commandes', wrap(async (req, res) => {
  const r = await pool.query(`SELECT ${COLS} FROM boutique_commandes WHERE gestionnaire_id = $1 AND acheteur_id = $2 ORDER BY created_at DESC LIMIT 100`, [req.gid, req.acheteurId]);
  res.json({ commandes: r.rows });
}));

router.get('/commandes/:numero', wrap(async (req, res) => {
  const r = await pool.query(`SELECT ${COLS} FROM boutique_commandes WHERE numero_commande = $1 AND gestionnaire_id = $2 AND acheteur_id = $3`, [req.params.numero, req.gid, req.acheteurId]);
  if (!r.rows[0]) return res.status(404).json({ message: 'Commande introuvable' });
  res.json({ commande: r.rows[0] });
}));

// Retour de PayPal : l'acheteur a approuvé, on capture
router.post('/commandes/:numero/paypal/capturer', wrap(async (req, res) => {
  res.json(await C.capturerPaypal(req.gid, req.acheteurId, req.params.numero, String(req.body.order_id || '')));
}));

// Annulation d'une commande non payée (bouton « Retour » depuis Stripe / PayPal) : stock remis, articles remis au panier
router.post('/commandes/:numero/annuler', wrap(async (req, res) => {
  const c = (await pool.query('SELECT id, statut_paiement FROM boutique_commandes WHERE numero_commande = $1 AND gestionnaire_id = $2 AND acheteur_id = $3', [req.params.numero, req.gid, req.acheteurId])).rows[0];
  if (!c) return res.status(404).json({ message: 'Commande introuvable' });
  await C.annulerNonPayee(c.id, { par: 'acheteur', raison: "Annulée par l'acheteur" });
  res.json({ message: 'Commande annulée. Vos articles sont de retour dans votre panier.' });
}));

// ═════════════════════════════ RETOURS ════════════════════════════════════
router.get('/retours', wrap(async (req, res) => { res.json({ retours: await R.listerAcheteur(req.gid, req.acheteurId) }); }));
router.get('/retours/eligibles', wrap(async (req, res) => { res.json(await R.eligibles(req.gid, req.acheteurId)); }));
router.post('/retours', wrap(async (req, res) => { res.status(201).json({ retour: await R.demander(req.gid, req.acheteurId, req.body || {}) }); }));
router.post('/retours/:numero/annuler', wrap(async (req, res) => { await R.annulerAcheteur(req.gid, req.acheteurId, req.params.numero); res.json({ message: 'Demande de retour annulée.' }); }));

module.exports = router;