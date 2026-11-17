// CHEMIN : services/boutique_adresses.js
// e-Vend Studio — Carnet d'adresses de l'acheteur (templates boutique, solo). Plusieurs adresses de livraison et de facturation, comme Amazon.
// Adresse, appartement, ville et code postal sont chiffrés au repos (src/utils/chiffrement), comme l'adresse de l'inscription.
// Table : boutique_acheteur_adresses (voir etape7.sql). Aucun lien avec les adresses du multivendeur.

'use strict';

const pool = require('../db');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');
const { ErreurCommande } = require('./boutique_commandes_erreur');
const EXP = require('./boutique_expedition');

const MAX_ADRESSES = 20;
const TYPES = ['livraison', 'facturation'];
const refus = (m, s) => { throw new ErreurCommande(m, s || 400); };
const t = (v, n) => String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').trim().slice(0, n);
const sain = (v) => { try { return v ? dechiffrer(v) : ''; } catch (e) { return ''; } };

function normaliserCodePostal(cp) {
  const n = String(cp || '').trim().toUpperCase().replace(/[\s-]/g, '');
  return n.length === 6 ? `${n.slice(0, 3)} ${n.slice(3)}` : n;
}

function vue(x) {
  return { id: x.id, libelle: x.libelle || '', nom: x.nom || '', adresse1: sain(x.adresse1), adresse2: sain(x.adresse2), ville: sain(x.ville),
    province: x.province || '', code_postal: sain(x.code_postal), pays: x.pays || 'Canada', telephone: x.telephone || '', type: x.type || 'livraison', est_principale: !!x.est_principale };
}

// Vérifie le corps reçu. Retourne les valeurs propres ou lève une ErreurCommande.
function valider(b) {
  if (!b || typeof b !== 'object') refus("Adresse invalide.");
  const a = { libelle: t(b.libelle, 60), nom: t(b.nom, 120), adresse1: t(b.adresse1, 160), adresse2: t(b.adresse2, 160), ville: t(b.ville, 80),
    province: t(b.province, 2).toUpperCase(), code_postal: normaliserCodePostal(t(b.code_postal, 12)), pays: t(b.pays || 'Canada', 40) || 'Canada',
    telephone: t(b.telephone, 30), type: TYPES.includes(b.type) ? b.type : 'livraison', est_principale: b.est_principale === true };
  if (!a.nom || !a.adresse1 || !a.ville || !a.code_postal) refus('Adresse incomplète (nom, adresse, ville et code postal sont requis).');
  if (!EXP.PROVINCES.includes(a.province)) refus('Province invalide.');
  return a;
}

async function lister(gid, acheteurId, db) {
  const r = await (db || pool).query(
    `SELECT * FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 ORDER BY est_principale DESC, id`, [gid, acheteurId]);
  return r.rows.map(vue);
}

async function lire(gid, acheteurId, id, db) {
  const r = await (db || pool).query('SELECT * FROM boutique_acheteur_adresses WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3', [id, gid, acheteurId]);
  return r.rows[0] ? vue(r.rows[0]) : null;
}

async function creer(gid, acheteurId, corps) {
  const a = valider(corps);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT id FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [acheteurId, gid]);   // sérialise les ajouts d'un même acheteur
    const n = (await c.query('SELECT COUNT(*)::int n FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2', [gid, acheteurId])).rows[0].n;
    if (n >= MAX_ADRESSES) refus(`Vous ne pouvez pas enregistrer plus de ${MAX_ADRESSES} adresses.`, 409);
    const dejaPrincipale = (await c.query('SELECT 1 FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3 AND est_principale', [gid, acheteurId, a.type])).rows.length > 0;
    const principale = a.est_principale || !dejaPrincipale;
    if (principale) await c.query('UPDATE boutique_acheteur_adresses SET est_principale = false WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3', [gid, acheteurId, a.type]);
    const r = await c.query(
      `INSERT INTO boutique_acheteur_adresses (gestionnaire_id, acheteur_id, libelle, nom, adresse1, adresse2, ville, province, code_postal, pays, telephone, type, est_principale)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [gid, acheteurId, a.libelle || null, a.nom, chiffrer(a.adresse1), a.adresse2 ? chiffrer(a.adresse2) : null, chiffrer(a.ville), a.province, chiffrer(a.code_postal), a.pays, a.telephone || null, a.type, principale]);
    await c.query('COMMIT');
    return vue(r.rows[0]);
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

async function modifier(gid, acheteurId, id, corps) {
  const a = valider(corps);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const ex = (await c.query('SELECT * FROM boutique_acheteur_adresses WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 FOR UPDATE', [id, gid, acheteurId])).rows[0];
    if (!ex) refus('Adresse introuvable.', 404);
    let principale = ex.est_principale;
    if (a.type !== ex.type) principale = false;                                             // changer de type : elle quitte l'ancienne principale
    if (a.est_principale) principale = true;
    if (principale) await c.query('UPDATE boutique_acheteur_adresses SET est_principale = false WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3 AND id <> $4', [gid, acheteurId, a.type, id]);
    const r = await c.query(
      `UPDATE boutique_acheteur_adresses SET libelle = $1, nom = $2, adresse1 = $3, adresse2 = $4, ville = $5, province = $6, code_postal = $7, pays = $8, telephone = $9, type = $10, est_principale = $11, updated_at = NOW()
        WHERE id = $12 RETURNING *`,
      [a.libelle || null, a.nom, chiffrer(a.adresse1), a.adresse2 ? chiffrer(a.adresse2) : null, chiffrer(a.ville), a.province, chiffrer(a.code_postal), a.pays, a.telephone || null, a.type, principale, id]);
    // L'ancien type n'a plus de principale ? la plus ancienne reprend le rôle
    if (ex.est_principale && a.type !== ex.type) {
      await c.query(`UPDATE boutique_acheteur_adresses SET est_principale = true WHERE id = (SELECT id FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3 ORDER BY id LIMIT 1)`, [gid, acheteurId, ex.type]);
    }
    await c.query('COMMIT');
    return vue(r.rows[0]);
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

async function supprimer(gid, acheteurId, id) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await c.query('DELETE FROM boutique_acheteur_adresses WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 RETURNING type, est_principale', [id, gid, acheteurId]);
    if (!r.rows[0]) refus('Adresse introuvable.', 404);
    if (r.rows[0].est_principale) {
      await c.query(`UPDATE boutique_acheteur_adresses SET est_principale = true WHERE id = (SELECT id FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3 ORDER BY id LIMIT 1)`, [gid, acheteurId, r.rows[0].type]);
    }
    await c.query('COMMIT');
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

async function definirPrincipale(gid, acheteurId, id) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const ex = (await c.query('SELECT type FROM boutique_acheteur_adresses WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 FOR UPDATE', [id, gid, acheteurId])).rows[0];
    if (!ex) refus('Adresse introuvable.', 404);
    await c.query('UPDATE boutique_acheteur_adresses SET est_principale = false WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = $3', [gid, acheteurId, ex.type]);
    await c.query('UPDATE boutique_acheteur_adresses SET est_principale = true, updated_at = NOW() WHERE id = $1', [id]);
    await c.query('COMMIT');
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

module.exports = { MAX_ADRESSES, TYPES, valider, lister, lire, creer, modifier, supprimer, definirPrincipale, normaliserCodePostal };