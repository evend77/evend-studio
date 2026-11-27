// CHEMIN : services/enchere_site.js
// e-Vend Studio — Sites d'enchères spécialisés (Enchère Galerie / Enchère Live).
// Tables préfixées "ens_" (aucun lien avec la table "encheres" du marché multi-vendeur).
'use strict';

const crypto = require('crypto');
const pool = require('../db');
const { nettoyerTexte } = require('../utils/sanitize'); // nettoyage standard e-Vend Studio (sanitize-html)

// ───────────────────────── Schéma ─────────────────────────
const DDL = [
  `CREATE TABLE IF NOT EXISTS ens_reglages (
     gestionnaire_id INTEGER PRIMARY KEY,
     verification_courriel BOOLEAN NOT NULL DEFAULT true,
     prolongation_min INTEGER NOT NULL DEFAULT 2,
     notifier_gestionnaire BOOLEAN NOT NULL DEFAULT true,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS ens_lots (
     id SERIAL PRIMARY KEY,
     gestionnaire_id INTEGER NOT NULL,
     titre TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     photos JSONB NOT NULL DEFAULT '[]'::jsonb,
     categorie TEXT NOT NULL DEFAULT '',
     condition_lot TEXT NOT NULL DEFAULT '',
     tags JSONB NOT NULL DEFAULT '[]'::jsonb,
     vedette BOOLEAN NOT NULL DEFAULT false,
     prix_depart NUMERIC(12,2) NOT NULL,
     prix_reserve NUMERIC(12,2),
     increment NUMERIC(12,2),
     date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     date_fin TIMESTAMPTZ NOT NULL,
     statut TEXT NOT NULL DEFAULT 'active',
     prix_actuel NUMERIC(12,2),
     nb_mises INTEGER NOT NULL DEFAULT 0,
     leader_id INTEGER,
     leader_max NUMERIC(12,2),
     nb_prolongations INTEGER NOT NULL DEFAULT 0,
     prix_final NUMERIC(12,2),
     gagnant_id INTEGER,
     paiement_statut TEXT NOT NULL DEFAULT 'a_payer',
     termine_le TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS ens_lots_gest_idx ON ens_lots (gestionnaire_id, statut, date_fin)`,
  `CREATE TABLE IF NOT EXISTS ens_encherisseurs (
     id SERIAL PRIMARY KEY,
     gestionnaire_id INTEGER NOT NULL,
     email TEXT NOT NULL,
     prenom TEXT NOT NULL,
     verifie BOOLEAN NOT NULL DEFAULT false,
     code_hash TEXT,
     code_expire TIMESTAMPTZ,
     code_envoye_le TIMESTAMPTZ,
     essais INTEGER NOT NULL DEFAULT 0,
     token_hash TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (gestionnaire_id, email)
   )`,
  `CREATE INDEX IF NOT EXISTS ens_enc_token_idx ON ens_encherisseurs (token_hash)`,
  `CREATE TABLE IF NOT EXISTS ens_mises (
     id SERIAL PRIMARY KEY,
     lot_id INTEGER NOT NULL REFERENCES ens_lots(id) ON DELETE CASCADE,
     encherisseur_id INTEGER NOT NULL,
     montant NUMERIC(12,2) NOT NULL,
     max_montant NUMERIC(12,2),
     auto BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS ens_mises_lot_idx ON ens_mises (lot_id, id DESC)`,
];

let promesse = null;
function pret() {
  if (!promesse) {
    promesse = (async () => { for (const sql of DDL) await pool.query(sql); })()
      .catch((e) => { promesse = null; throw e; });
  }
  return promesse;
}

class ErreurEnchere extends Error {
  constructor(message, statut = 400, code = null) { super(message); this.statut = statut; this.code = code; }
}

// ───────────────────────── Règles de mise (pures, testées) ─────────────────────────
const r2 = (n) => Math.round(Number(n) * 100) / 100;

// Paliers d'incrément par défaut
function incrementPour(prix, fixe) {
  if (fixe != null && Number(fixe) > 0) return r2(fixe);
  const p = Number(prix) || 0;
  if (p < 25) return 1;
  if (p < 100) return 5;
  if (p < 500) return 10;
  if (p < 1000) return 25;
  if (p < 5000) return 50;
  return 100;
}

/**
 * Calcule le nouvel état d'un lot après une mise maximale.
 * lot : { prix_depart, prix_reserve, increment, prix_actuel, nb_mises, leader_id, leader_max }
 * Retourne { prix_actuel, leader_id, leader_max, resultat: 'leader'|'surenchere'|'maximum_releve',
 *            ancien_leader_id, mises:[{encherisseur_id, montant, max, auto}] }
 */
function calculerMise(lot, encherisseurId, maxMise) {
  const depart = Number(lot.prix_depart);
  const reserve = lot.prix_reserve != null ? Number(lot.prix_reserve) : null;
  const max = r2(maxMise);
  if (!Number.isFinite(max) || max <= 0) throw new ErreurEnchere('Montant invalide.');
  const nb = Number(lot.nb_mises) || 0;
  const avecReserve = (prix, topMax) => (reserve != null && reserve > prix && topMax >= reserve ? Math.min(reserve, topMax) : prix);

  // 1) Première mise
  if (nb === 0 || lot.leader_id == null) {
    if (max < depart) throw new ErreurEnchere(`La mise minimale est de ${depart.toFixed(2)} $.`, 400, 'mise_trop_basse');
    const prix = avecReserve(depart, max);
    return { prix_actuel: prix, leader_id: encherisseurId, leader_max: max, resultat: 'leader', ancien_leader_id: null,
      mises: [{ encherisseur_id: encherisseurId, montant: prix, max, auto: false }] };
  }

  const actuel = Number(lot.prix_actuel);
  const lmax = Number(lot.leader_max);
  const inc = incrementPour(actuel, lot.increment);

  // 2) Le meneur relève son propre maximum
  if (Number(lot.leader_id) === Number(encherisseurId)) {
    if (max <= lmax) throw new ErreurEnchere(`Votre maximum actuel est déjà de ${lmax.toFixed(2)} $. Entrez un montant plus élevé.`, 400, 'maximum_inchange');
    const prix = avecReserve(actuel, max);
    return { prix_actuel: prix, leader_id: encherisseurId, leader_max: max, resultat: 'maximum_releve', ancien_leader_id: encherisseurId,
      mises: prix !== actuel ? [{ encherisseur_id: encherisseurId, montant: prix, max, auto: false }] : [] };
  }

  // 3) Un challenger
  const minimum = r2(actuel + inc);
  if (max < minimum) throw new ErreurEnchere(`La mise minimale est de ${minimum.toFixed(2)} $.`, 400, 'mise_trop_basse');

  if (max > lmax) {
    // Le challenger prend la tête
    let prix = Math.min(max, r2(lmax + incrementPour(lmax, lot.increment)));
    prix = avecReserve(prix, max);
    const mises = [{ encherisseur_id: encherisseurId, montant: prix, max, auto: false }];
    return { prix_actuel: prix, leader_id: encherisseurId, leader_max: max, resultat: 'leader', ancien_leader_id: lot.leader_id, mises };
  }
  // Le meneur tient (égalité : le plus ancien gagne)
  let prix = max === lmax ? lmax : Math.min(lmax, r2(max + incrementPour(max, lot.increment)));
  prix = avecReserve(prix, lmax);
  return { prix_actuel: prix, leader_id: lot.leader_id, leader_max: lmax, resultat: 'surenchere', ancien_leader_id: lot.leader_id,
    mises: [{ encherisseur_id: encherisseurId, montant: max, max, auto: false }, { encherisseur_id: lot.leader_id, montant: prix, max: lmax, auto: true }] };
}

function masquer(prenom) {
  const p = String(prenom || '').trim();
  if (!p) return 'Enchérisseur';
  return p.slice(0, 1).toUpperCase() + '***';
}

// ───────────────────────── Courriels ─────────────────────────
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let sesClient = null;
async function envoyer(to, sujet, html) {
  try {
    if (!to || !process.env.AWS_ACCESS_KEY_ID) return false;
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    if (!sesClient) sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-2', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
    await sesClient.send(new SendEmailCommand({
      Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
      Destination: { ToAddresses: [to] },
      Message: { Subject: { Data: sujet, Charset: 'UTF-8' }, Body: { Html: { Data: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">${html}<p style="color:#888;font-size:12px;margin-top:24px">Enchères — e-Vend Studio</p></div>`, Charset: 'UTF-8' } } },
    }));
    return true;
  } catch (e) { console.error('❌ Enchères — courriel :', e.message); return false; }
}

async function infosSite(gid) {
  const r = await pool.query(
    `SELECT g.email, (SELECT s.config FROM sites s WHERE s.gestionnaire_id = g.id ORDER BY s.id DESC LIMIT 1) AS config FROM gestionnaires g WHERE g.id = $1`, [gid]);
  const row = r.rows[0] || {};
  const cfg = (row.config && (row.config.enchere || row.config)) || {};
  return { emailGest: row.email, nomBoutique: cfg.nomBoutique || cfg.nomVente || 'la vente aux enchères' };
}

const money = (n) => `${Number(n).toFixed(2)} $`;

// ───────────────────────── Réglages ─────────────────────────
async function reglages(gid) {
  await pret();
  const r = await pool.query('SELECT * FROM ens_reglages WHERE gestionnaire_id = $1', [gid]);
  const x = r.rows[0] || {};
  return {
    verification_courriel: x.verification_courriel !== false,
    prolongation_min: x.prolongation_min != null ? Number(x.prolongation_min) : 2,
    notifier_gestionnaire: x.notifier_gestionnaire !== false,
  };
}
async function sauverReglages(gid, b) {
  await pret();
  const v = b.verification_courriel !== false;
  const p = Math.max(0, Math.min(15, parseInt(b.prolongation_min, 10) || 0));
  const n = b.notifier_gestionnaire !== false;
  await pool.query(
    `INSERT INTO ens_reglages (gestionnaire_id, verification_courriel, prolongation_min, notifier_gestionnaire) VALUES ($1,$2,$3,$4)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET verification_courriel=$2, prolongation_min=$3, notifier_gestionnaire=$4, updated_at=NOW()`,
    [gid, v, p, n]);
  return reglages(gid);
}

// ───────────────────────── Enchérisseurs (sans compte) ─────────────────────────
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

async function demanderCode(gid, emailBrut, prenomBrut) {
  await pret();
  const email = nettoyerTexte(emailBrut, 200).toLowerCase();
  const prenom = nettoyerTexte(prenomBrut, 40);
  if (!EMAIL_RE.test(email)) throw new ErreurEnchere('Courriel invalide.');
  if (prenom.length < 2) throw new ErreurEnchere('Indiquez votre prénom.');
  const rg = await reglages(gid);
  const r = await pool.query(
    `INSERT INTO ens_encherisseurs (gestionnaire_id, email, prenom) VALUES ($1,$2,$3)
     ON CONFLICT (gestionnaire_id, email) DO UPDATE SET prenom = EXCLUDED.prenom RETURNING *`, [gid, email, prenom]);
  const e = r.rows[0];
  if (!rg.verification_courriel) {
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('UPDATE ens_encherisseurs SET verifie = true, token_hash = $2 WHERE id = $1', [e.id, sha(token)]);
    return { verification: false, token, prenom };
  }
  if (e.code_envoye_le && Date.now() - new Date(e.code_envoye_le).getTime() < 45000) {
    throw new ErreurEnchere('Un code vient d\'être envoyé. Patientez une minute avant d\'en redemander un.', 429);
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await pool.query(
    `UPDATE ens_encherisseurs SET code_hash=$2, code_expire=NOW() + INTERVAL '15 minutes', code_envoye_le=NOW(), essais=0 WHERE id=$1`, [e.id, sha(`${e.id}:${code}`)]);
  const info = await infosSite(gid);
  await envoyer(email, `Votre code de vérification : ${code}`,
    `<p>Bonjour ${esc(prenom)},</p><p>Voici votre code pour miser sur <strong>${esc(info.nomBoutique)}</strong> :</p>
     <p style="font-size:32px;letter-spacing:6px;font-weight:bold;margin:18px 0">${code}</p><p style="color:#666">Il expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.</p>`);
  return { verification: true, prenom };
}

async function verifierCode(gid, emailBrut, codeBrut) {
  await pret();
  const email = nettoyerTexte(emailBrut, 200).toLowerCase();
  const code = String(codeBrut || '').replace(/\D/g, '');
  const r = await pool.query('SELECT * FROM ens_encherisseurs WHERE gestionnaire_id=$1 AND email=$2', [gid, email]);
  const e = r.rows[0];
  if (!e || !e.code_hash || !e.code_expire || new Date(e.code_expire) < new Date()) throw new ErreurEnchere('Code expiré. Demandez-en un nouveau.', 400, 'code_expire');
  if (e.essais >= 5) throw new ErreurEnchere('Trop d\'essais. Demandez un nouveau code.', 429);
  if (sha(`${e.id}:${code}`) !== e.code_hash) {
    await pool.query('UPDATE ens_encherisseurs SET essais = essais + 1 WHERE id = $1', [e.id]);
    throw new ErreurEnchere('Code incorrect.', 400, 'code_incorrect');
  }
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE ens_encherisseurs SET verifie=true, token_hash=$2, code_hash=NULL, code_expire=NULL, essais=0 WHERE id=$1', [e.id, sha(token)]);
  return { token, prenom: e.prenom };
}

async function encherisseurParToken(gid, token) {
  await pret();
  if (!token || typeof token !== 'string' || token.length < 20) return null;
  const r = await pool.query('SELECT * FROM ens_encherisseurs WHERE gestionnaire_id=$1 AND token_hash=$2 AND verifie = true', [gid, sha(token)]);
  return r.rows[0] || null;
}

// ───────────────────────── Vues ─────────────────────────
function vuePublique(l, serveurMaintenant) {
  const reserveAtteinte = l.prix_reserve == null ? null : (l.prix_actuel != null && Number(l.prix_actuel) >= Number(l.prix_reserve));
  const debut = new Date(l.date_debut).getTime();
  const statut = l.statut === 'active' && debut > serveurMaintenant ? 'a_venir' : l.statut;
  const prix = l.statut === 'active' || l.statut === 'terminee' ? (l.prix_final != null ? l.prix_final : l.prix_actuel) : l.prix_actuel;
  return {
    id: l.id, titre: l.titre, description: l.description, photos: l.photos || [], categorie: l.categorie, condition: l.condition_lot,
    tags: l.tags || [], vedette: !!l.vedette, prixBase: Number(l.prix_depart), prixActuel: prix != null ? Number(prix) : null,
    increment: incrementPour(prix != null ? prix : l.prix_depart, l.increment), nbMises: Number(l.nb_mises) || 0,
    dateDebut: l.date_debut, dateFin: l.date_fin, statut, aReserve: l.prix_reserve != null, reserveAtteinte,
    meneurNom: l.leader_prenom ? masquer(l.leader_prenom) : null, meneurId: l.leader_id || null,
  };
}

const SELECT_LOT = `SELECT l.*, e.prenom AS leader_prenom FROM ens_lots l LEFT JOIN ens_encherisseurs e ON e.id = l.leader_id`;

async function listerPublic(gid, enchId) {
  await pret();
  const r = await pool.query(`${SELECT_LOT} WHERE l.gestionnaire_id = $1 AND l.statut <> 'annulee' ORDER BY l.vedette DESC, l.date_fin ASC LIMIT 300`, [gid]);
  const now = Date.now();
  return r.rows.map((l) => {
    const v = vuePublique(l, now);
    v.estMeneur = !!(enchId && l.leader_id === enchId);
    delete v.meneurId;
    return v;
  });
}

async function detailPublic(gid, lotId, enchId) {
  await pret();
  const r = await pool.query(`${SELECT_LOT} WHERE l.gestionnaire_id=$1 AND l.id=$2 AND l.statut <> 'annulee'`, [gid, lotId]);
  if (!r.rows[0]) throw new ErreurEnchere('Lot introuvable.', 404);
  const l = r.rows[0];
  const v = vuePublique(l, Date.now());
  v.estMeneur = !!(enchId && l.leader_id === enchId);
  delete v.meneurId;
  const m = await pool.query(
    `SELECT m.montant, m.auto, m.created_at, e.prenom FROM ens_mises m JOIN ens_encherisseurs e ON e.id = m.encherisseur_id WHERE m.lot_id=$1 ORDER BY m.id DESC LIMIT 25`, [lotId]);
  v.historique = m.rows.map((x) => ({ montant: Number(x.montant), nom: masquer(x.prenom), auto: x.auto, date: x.created_at }));
  if (enchId) {
    const mm = await pool.query('SELECT MAX(max_montant) AS mx FROM ens_mises WHERE lot_id=$1 AND encherisseur_id=$2', [lotId, enchId]);
    v.monMaximum = l.leader_id === enchId ? Number(l.leader_max) : (mm.rows[0].mx != null ? Number(mm.rows[0].mx) : null);
  }
  return v;
}

async function ticker(gid) {
  await pret();
  const r = await pool.query(
    `SELECT m.montant, m.created_at, e.prenom, l.titre, l.id AS lot_id
       FROM ens_mises m JOIN ens_lots l ON l.id = m.lot_id JOIN ens_encherisseurs e ON e.id = m.encherisseur_id
      WHERE l.gestionnaire_id=$1 AND l.statut <> 'annulee' ORDER BY m.id DESC LIMIT 20`, [gid]);
  return r.rows.map((x) => ({ nom: masquer(x.prenom), montant: Number(x.montant), lotId: x.lot_id, lot: x.titre, date: x.created_at }));
}

async function mesMises(gid, enchId) {
  await pret();
  const r = await pool.query(
    `SELECT DISTINCT l.id FROM ens_lots l JOIN ens_mises m ON m.lot_id = l.id WHERE l.gestionnaire_id=$1 AND m.encherisseur_id=$2`, [gid, enchId]);
  const ids = r.rows.map((x) => x.id);
  if (!ids.length) return [];
  const lots = await pool.query(`${SELECT_LOT} WHERE l.id = ANY($1::int[]) ORDER BY l.date_fin ASC`, [ids]);
  return lots.rows.map((l) => {
    const v = vuePublique(l, Date.now());
    v.estMeneur = l.leader_id === enchId;
    v.gagne = l.statut === 'terminee' && l.gagnant_id === enchId;
    delete v.meneurId;
    return v;
  });
}

// ───────────────────────── Miser ─────────────────────────
async function miser(gid, lotId, enchId, maxMise) {
  await pret();
  const rg = await reglages(gid);
  const client = await pool.connect();
  let issue;
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM ens_lots WHERE id=$1 AND gestionnaire_id=$2 FOR UPDATE', [lotId, gid]);
    const lot = r.rows[0];
    if (!lot || lot.statut === 'annulee') throw new ErreurEnchere('Lot introuvable.', 404);
    const now = Date.now();
    if (lot.statut !== 'active' || new Date(lot.date_fin).getTime() <= now) throw new ErreurEnchere('Cette enchère est terminée.', 400, 'terminee');
    if (new Date(lot.date_debut).getTime() > now) throw new ErreurEnchere('Cette enchère n\'a pas encore commencé.', 400, 'pas_commencee');

    const calc = calculerMise(lot, enchId, maxMise);
    for (const m of calc.mises) {
      await client.query('INSERT INTO ens_mises (lot_id, encherisseur_id, montant, max_montant, auto) VALUES ($1,$2,$3,$4,$5)',
        [lotId, m.encherisseur_id, m.montant, m.max, m.auto]);
    }
    // Anti-sniping : prolonger si la mise arrive dans les dernières minutes
    let nouvelleFin = new Date(lot.date_fin);
    let prolonge = false;
    const fenetre = rg.prolongation_min * 60000;
    if (fenetre > 0 && nouvelleFin.getTime() - now < fenetre && lot.nb_prolongations < 20 && calc.mises.length) {
      nouvelleFin = new Date(now + fenetre);
      prolonge = true;
    }
    await client.query(
      `UPDATE ens_lots SET prix_actuel=$2, leader_id=$3, leader_max=$4, nb_mises = nb_mises + $5, date_fin=$6, nb_prolongations = nb_prolongations + $7 WHERE id=$1`,
      [lotId, calc.prix_actuel, calc.leader_id, calc.leader_max, calc.mises.length || 0, nouvelleFin, prolonge ? 1 : 0]);
    await client.query('COMMIT');
    issue = { calc, lot, prolonge, dateFin: nouvelleFin };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw e;
  } finally { client.release(); }

  const { calc, lot } = issue;
  // Courriels "surenchéri" et notification gestionnaire (ne bloquent pas la réponse)
  (async () => {
    try {
      if (calc.resultat === 'leader' && calc.ancien_leader_id && calc.ancien_leader_id !== enchId) {
        const o = await pool.query('SELECT email, prenom FROM ens_encherisseurs WHERE id=$1', [calc.ancien_leader_id]);
        if (o.rows[0]) {
          const info = await infosSite(gid);
          await envoyer(o.rows[0].email, `Vous avez été surenchéri : ${lot.titre}`,
            `<p>Bonjour ${esc(o.rows[0].prenom)},</p><p>Quelqu'un a dépassé votre mise sur <strong>${esc(lot.titre)}</strong>. Le prix actuel est de <strong>${money(calc.prix_actuel)}</strong>.</p>
             <p>Retournez sur ${esc(info.nomBoutique)} pour miser à nouveau avant la fin de l'enchère.</p>`);
        }
      }
    } catch (e) { console.error('❌ Enchères — courriel surenchère :', e.message); }
  })();

  const gagnant = calc.leader_id === enchId;
  return {
    resultat: gagnant ? 'meneur' : 'surenchere',
    prixActuel: calc.prix_actuel,
    monMaximum: gagnant ? calc.leader_max : Number(maxMise),
    reserveAtteinte: lot.prix_reserve == null ? null : calc.prix_actuel >= Number(lot.prix_reserve),
    prolonge: issue.prolonge, dateFin: issue.dateFin,
    message: gagnant
      ? (calc.resultat === 'maximum_releve' ? 'Votre maximum a été relevé.' : 'Vous êtes le meilleur enchérisseur !')
      : 'Une mise automatique plus élevée existait déjà : vous avez été surenchéri.',
  };
}

// ───────────────────────── Fermeture automatique ─────────────────────────
async function fermerLotsEchus() {
  await pret();
  const ids = (await pool.query(`SELECT id FROM ens_lots WHERE statut='active' AND date_fin <= NOW() ORDER BY date_fin LIMIT 50`)).rows;
  let n = 0;
  for (const { id } of ids) {
    const client = await pool.connect();
    let ferme = null;
    try {
      await client.query('BEGIN');
      const r = await client.query(`SELECT * FROM ens_lots WHERE id=$1 AND statut='active' AND date_fin <= NOW() FOR UPDATE SKIP LOCKED`, [id]);
      const l = r.rows[0];
      if (!l) { await client.query('ROLLBACK'); continue; }
      const aGagnant = l.nb_mises > 0 && l.leader_id != null && (l.prix_reserve == null || Number(l.prix_actuel) >= Number(l.prix_reserve));
      await client.query(
        `UPDATE ens_lots SET statut=$2, prix_final=$3, gagnant_id=$4, termine_le=NOW() WHERE id=$1`,
        [id, aGagnant ? 'terminee' : 'sans_gagnant', aGagnant ? l.prix_actuel : null, aGagnant ? l.leader_id : null]);
      await client.query('COMMIT');
      ferme = { lot: l, aGagnant };
      n++;
    } catch (e) { try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ } console.error('❌ Enchères — fermeture :', e.message); }
    finally { client.release(); }
    if (ferme) notifierFermeture(ferme.lot, ferme.aGagnant).catch((e) => console.error('❌ Enchères — notif fermeture :', e.message));
  }
  return n;
}

async function notifierFermeture(l, aGagnant) {
  const info = await infosSite(l.gestionnaire_id);
  const rg = await reglages(l.gestionnaire_id);
  if (aGagnant) {
    const w = (await pool.query('SELECT email, prenom FROM ens_encherisseurs WHERE id=$1', [l.leader_id])).rows[0];
    if (w) await envoyer(w.email, `Vous avez remporté : ${l.titre}`,
      `<p>Félicitations ${esc(w.prenom)} !</p><p>Vous avez remporté <strong>${esc(l.titre)}</strong> pour <strong>${money(l.prix_actuel)}</strong>.</p>
       <p>Le vendeur (${esc(info.nomBoutique)}) vous contactera sous peu à ce courriel pour le paiement et la remise.</p>`);
    if (rg.notifier_gestionnaire && info.emailGest && w) await envoyer(info.emailGest, `Enchère terminée : ${l.titre}`,
      `<p>Le lot <strong>${esc(l.titre)}</strong> est terminé.</p><p><strong>Gagnant :</strong> ${esc(w.prenom)} — ${esc(w.email)}<br><strong>Prix final :</strong> ${money(l.prix_actuel)}</p>
       <p>Contactez-le pour le paiement, puis marquez le lot « payé » dans <em>Mes enchères</em>.</p>`);
  } else if (rg.notifier_gestionnaire && info.emailGest) {
    await envoyer(info.emailGest, `Enchère terminée sans gagnant : ${l.titre}`,
      `<p>Le lot <strong>${esc(l.titre)}</strong> s'est terminé ${l.nb_mises > 0 ? 'sans atteindre le prix de réserve' : 'sans aucune mise'}.</p>`);
  }
}

let minuterie = null;
function demarrerEncheres() {
  if (minuterie) return;
  pret().then(() => {
    minuterie = setInterval(() => { fermerLotsEchus().catch((e) => console.error('❌ Enchères — cron :', e.message)); }, 30000);
    if (minuterie.unref) minuterie.unref();
    console.log('🔨 Enchères (galerie/live) : fermeture automatique active');
  }).catch((e) => console.error('❌ Enchères — schéma :', e.message));
}

// ───────────────────────── Gestionnaire ─────────────────────────
function nettoyerLot(b, existant) {
  const out = {};
  const txt = (v, n) => nettoyerTexte(v, n);
  const num = (v) => (v === '' || v == null ? null : r2(v));
  out.titre = txt(b.titre, 140);
  if (!out.titre) throw new ErreurEnchere('Le titre est requis.');
  out.description = txt(b.description, 4000);
  out.categorie = txt(b.categorie, 60);
  out.condition_lot = txt(b.condition, 60);
  out.vedette = !!b.vedette;
  out.photos = (Array.isArray(b.photos) ? b.photos : []).map((p) => String(p || '').trim()).filter((p) => /^https:\/\//i.test(p)).slice(0, 8);
  out.tags = (Array.isArray(b.tags) ? b.tags : []).map((t) => txt(t, 30)).filter(Boolean).slice(0, 8);
  out.prix_depart = num(b.prixBase);
  if (out.prix_depart == null || !(out.prix_depart >= 0)) throw new ErreurEnchere('Le prix de départ est requis.');
  out.prix_reserve = num(b.prixReserve);
  if (out.prix_reserve != null && out.prix_reserve < out.prix_depart) throw new ErreurEnchere('Le prix de réserve doit être égal ou supérieur au prix de départ.');
  out.increment = num(b.increment);
  if (out.increment != null && out.increment <= 0) out.increment = null;
  const fin = new Date(b.dateFin);
  if (isNaN(fin.getTime())) throw new ErreurEnchere('La date de fin est invalide.');
  out.date_fin = fin;
  const debut = b.dateDebut ? new Date(b.dateDebut) : new Date();
  if (isNaN(debut.getTime())) throw new ErreurEnchere('La date de début est invalide.');
  out.date_debut = debut;
  if (fin <= debut) throw new ErreurEnchere('La date de fin doit être après le début.');
  if (!existant && fin.getTime() <= Date.now()) throw new ErreurEnchere('La date de fin doit être dans le futur.');
  return out;
}

function vueGestionnaire(l) {
  return {
    id: l.id, titre: l.titre, description: l.description, photos: l.photos || [], categorie: l.categorie, condition: l.condition_lot, tags: l.tags || [],
    vedette: !!l.vedette, prixBase: Number(l.prix_depart), prixReserve: l.prix_reserve != null ? Number(l.prix_reserve) : null,
    increment: l.increment != null ? Number(l.increment) : null, dateDebut: l.date_debut, dateFin: l.date_fin, statut: l.statut,
    prixActuel: l.prix_actuel != null ? Number(l.prix_actuel) : null, prixFinal: l.prix_final != null ? Number(l.prix_final) : null,
    nbMises: l.nb_mises, maximumMeneur: l.leader_max != null ? Number(l.leader_max) : null,
    meneur: l.leader_prenom ? { prenom: l.leader_prenom, email: l.leader_email } : null,
    gagnant: l.gagnant_id && l.leader_prenom ? { prenom: l.leader_prenom, email: l.leader_email } : null,
    paiementStatut: l.paiement_statut, termineLe: l.termine_le,
    reserveAtteinte: l.prix_reserve == null ? null : (l.prix_actuel != null && Number(l.prix_actuel) >= Number(l.prix_reserve)),
  };
}
const SELECT_GEST = `SELECT l.*, e.prenom AS leader_prenom, e.email AS leader_email FROM ens_lots l LEFT JOIN ens_encherisseurs e ON e.id = l.leader_id`;

async function listerGestionnaire(gid) {
  await pret();
  const r = await pool.query(`${SELECT_GEST} WHERE l.gestionnaire_id=$1 ORDER BY (l.statut='active') DESC, l.date_fin DESC LIMIT 500`, [gid]);
  return r.rows.map(vueGestionnaire);
}

async function creerLot(gid, b) {
  await pret();
  const c = nettoyerLot(b, null);
  const r = await pool.query(
    `INSERT INTO ens_lots (gestionnaire_id, titre, description, photos, categorie, condition_lot, tags, vedette, prix_depart, prix_reserve, increment, date_debut, date_fin)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [gid, c.titre, c.description, JSON.stringify(c.photos), c.categorie, c.condition_lot, JSON.stringify(c.tags), c.vedette, c.prix_depart, c.prix_reserve, c.increment, c.date_debut, c.date_fin]);
  return r.rows[0].id;
}

async function modifierLot(gid, id, b) {
  await pret();
  const r = await pool.query('SELECT * FROM ens_lots WHERE id=$1 AND gestionnaire_id=$2', [id, gid]);
  const l = r.rows[0];
  if (!l) throw new ErreurEnchere('Lot introuvable.', 404);
  if (l.statut !== 'active') throw new ErreurEnchere('Ce lot est terminé : il ne peut plus être modifié.', 400);
  const c = nettoyerLot(b, l);
  if (l.nb_mises > 0) {
    // Équité envers les enchérisseurs : prix, réserve, incrément et début verrouillés dès la première mise.
    if (Number(c.prix_depart) !== Number(l.prix_depart)
      || (c.prix_reserve == null) !== (l.prix_reserve == null)
      || (c.prix_reserve != null && Number(c.prix_reserve) !== Number(l.prix_reserve))
      || (c.increment == null) !== (l.increment == null)
      || (c.increment != null && Number(c.increment) !== Number(l.increment))) {
      throw new ErreurEnchere('Des mises ont déjà été placées : le prix de départ, la réserve et l\'incrément ne peuvent plus changer.', 400, 'verrouille');
    }
    if (c.date_fin < new Date(l.date_fin)) throw new ErreurEnchere('Des mises ont été placées : vous pouvez prolonger la date de fin, pas la raccourcir.', 400, 'verrouille');
    c.date_debut = l.date_debut;
  }
  await pool.query(
    `UPDATE ens_lots SET titre=$3, description=$4, photos=$5::jsonb, categorie=$6, condition_lot=$7, tags=$8::jsonb, vedette=$9, prix_depart=$10, prix_reserve=$11, increment=$12, date_debut=$13, date_fin=$14 WHERE id=$1 AND gestionnaire_id=$2`,
    [id, gid, c.titre, c.description, JSON.stringify(c.photos), c.categorie, c.condition_lot, JSON.stringify(c.tags), c.vedette, c.prix_depart, c.prix_reserve, c.increment, c.date_debut, c.date_fin]);
}

async function annulerLot(gid, id) {
  await pret();
  const r = await pool.query(`UPDATE ens_lots SET statut='annulee', termine_le=NOW() WHERE id=$1 AND gestionnaire_id=$2 AND statut='active' RETURNING nb_mises, leader_id, titre`, [id, gid]);
  if (!r.rows[0]) throw new ErreurEnchere('Lot introuvable ou déjà terminé.', 404);
  return r.rows[0];
}

async function supprimerLot(gid, id) {
  await pret();
  const r = await pool.query('SELECT nb_mises FROM ens_lots WHERE id=$1 AND gestionnaire_id=$2', [id, gid]);
  if (!r.rows[0]) throw new ErreurEnchere('Lot introuvable.', 404);
  if (r.rows[0].nb_mises > 0) throw new ErreurEnchere('Ce lot a reçu des mises : annulez-le au lieu de le supprimer.', 400);
  await pool.query('DELETE FROM ens_lots WHERE id=$1 AND gestionnaire_id=$2', [id, gid]);
}

async function marquerPaiement(gid, id, statut) {
  await pret();
  if (!['a_payer', 'payee', 'non_payee'].includes(statut)) throw new ErreurEnchere('Statut invalide.');
  const r = await pool.query(`UPDATE ens_lots SET paiement_statut=$3 WHERE id=$1 AND gestionnaire_id=$2 AND statut='terminee' RETURNING id`, [id, gid, statut]);
  if (!r.rows[0]) throw new ErreurEnchere('Seul un lot terminé avec un gagnant peut être marqué.', 400);
}

async function misesGestionnaire(gid, id) {
  await pret();
  const own = await pool.query('SELECT id FROM ens_lots WHERE id=$1 AND gestionnaire_id=$2', [id, gid]);
  if (!own.rows[0]) throw new ErreurEnchere('Lot introuvable.', 404);
  const r = await pool.query(
    `SELECT m.montant, m.auto, m.created_at, e.prenom, e.email FROM ens_mises m JOIN ens_encherisseurs e ON e.id = m.encherisseur_id WHERE m.lot_id=$1 ORDER BY m.id DESC LIMIT 200`, [id]);
  return r.rows.map((x) => ({ montant: Number(x.montant), auto: x.auto, date: x.created_at, prenom: x.prenom, email: x.email }));
}

module.exports = {
  ErreurEnchere, pret, incrementPour, calculerMise, masquer,
  reglages, sauverReglages, demanderCode, verifierCode, encherisseurParToken,
  listerPublic, detailPublic, ticker, mesMises, miser, fermerLotsEchus, demarrerEncheres,
  listerGestionnaire, creerLot, modifierLot, annulerLot, supprimerLot, marquerPaiement, misesGestionnaire,
};