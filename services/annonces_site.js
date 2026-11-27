// CHEMIN : services/annonces_site.js
// e-Vend Studio — Petites annonces (affichage seulement, aucune transaction).
// Tables préfixées "ann_". Chaque annonce a un "afficheur_id" (NULL = le gestionnaire lui-même) pour permettre plus tard
// un gestionnaire « multi-afficheurs ».
'use strict';

const pool = require('../db');
const { nettoyerTexte } = require('../utils/sanitize'); // nettoyage standard e-Vend Studio (sanitize-html)
const LIM = require('./annonces_limites');       // paliers (Prix Template) : nombre d'annonces actives permis

const DDL = [
  `CREATE TABLE IF NOT EXISTS ann_reglages (
     gestionnaire_id INTEGER PRIMARY KEY,
     duree_defaut_jours INTEGER NOT NULL DEFAULT 30,
     notifier_messages BOOLEAN NOT NULL DEFAULT true,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS ann_annonces (
     id SERIAL PRIMARY KEY,
     gestionnaire_id INTEGER NOT NULL,
     afficheur_id INTEGER,
     type_annonce TEXT NOT NULL DEFAULT 'general',
     titre TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     prix NUMERIC(12,2),
     prix_texte TEXT NOT NULL DEFAULT '',
     categorie TEXT NOT NULL DEFAULT '',
     lieu TEXT NOT NULL DEFAULT '',
     photos JSONB NOT NULL DEFAULT '[]'::jsonb,
     details JSONB NOT NULL DEFAULT '{}'::jsonb,
     vedette BOOLEAN NOT NULL DEFAULT false,
     statut TEXT NOT NULL DEFAULT 'active',
     date_expiration TIMESTAMPTZ,
     vues INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS ann_annonces_gest_idx ON ann_annonces (gestionnaire_id, statut, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS ann_messages (
     id SERIAL PRIMARY KEY,
     annonce_id INTEGER NOT NULL REFERENCES ann_annonces(id) ON DELETE CASCADE,
     gestionnaire_id INTEGER NOT NULL,
     nom TEXT NOT NULL,
     email TEXT NOT NULL,
     telephone TEXT NOT NULL DEFAULT '',
     message TEXT NOT NULL,
     lu BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS ann_messages_gest_idx ON ann_messages (gestionnaire_id, lu, created_at DESC)`,
];

let promesse = null;
function pret() {
  if (!promesse) {
    promesse = (async () => { for (const sql of DDL) await pool.query(sql); })().catch((e) => { promesse = null; throw e; });
  }
  return promesse;
}

class ErreurAnnonce extends Error {
  constructor(message, statut = 400, code = null) { super(message); this.statut = statut; this.code = code; }
}

const r2 = (n) => Math.round(Number(n) * 100) / 100;
const txt = (v, n) => nettoyerTexte(v, n);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Courriel (SES) ──
let ses = null;
async function envoyer(to, sujet, html, replyTo) {
  try {
    if (!to || !process.env.AWS_ACCESS_KEY_ID) return false;
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    if (!ses) ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-2', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
    await ses.send(new SendEmailCommand({
      Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
      Message: { Subject: { Data: sujet, Charset: 'UTF-8' }, Body: { Html: { Data: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">${html}<p style="color:#888;font-size:12px;margin-top:24px">Petites annonces — e-Vend Studio</p></div>`, Charset: 'UTF-8' } } },
    }));
    return true;
  } catch (e) { console.error('❌ Annonces — courriel :', e.message); return false; }
}

// ── Réglages ──
async function reglages(gid) {
  await pret();
  const x = (await pool.query('SELECT * FROM ann_reglages WHERE gestionnaire_id=$1', [gid])).rows[0] || {};
  return { duree_defaut_jours: x.duree_defaut_jours != null ? Number(x.duree_defaut_jours) : 30, notifier_messages: x.notifier_messages !== false };
}
async function sauverReglages(gid, b) {
  await pret();
  const d = Math.max(0, Math.min(365, parseInt(b.duree_defaut_jours, 10) || 0));
  await pool.query(
    `INSERT INTO ann_reglages (gestionnaire_id, duree_defaut_jours, notifier_messages) VALUES ($1,$2,$3)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET duree_defaut_jours=$2, notifier_messages=$3, updated_at=NOW()`, [gid, d, b.notifier_messages !== false]);
  return reglages(gid);
}

// ── Validation d'une annonce ──
function nettoyer(b) {
  const o = {};
  o.titre = txt(b.titre, 140);
  if (o.titre.length < 3) throw new ErreurAnnonce('Le titre est requis (3 caractères minimum).');
  o.description = txt(b.description, 5000);
  o.categorie = txt(b.categorie, 60);
  o.lieu = txt(b.lieu, 80);
  o.prix_texte = txt(b.prixTexte, 40);
  if (b.prix === '' || b.prix == null) o.prix = null;
  else { o.prix = r2(b.prix); if (!(o.prix >= 0) || o.prix > 1e9) throw new ErreurAnnonce('Prix invalide.'); }
  o.photos = (Array.isArray(b.photos) ? b.photos : []).map((p) => String(p || '').trim()).filter((p) => /^https:\/\//i.test(p) && p.length < 1000).slice(0, 12);
  o.vedette = !!b.vedette;
  // Champs libres « Détails » (ex. Année : 2019) — jusqu'à 12 paires, texte seulement
  const det = {};
  if (b.details && typeof b.details === 'object' && !Array.isArray(b.details)) {
    for (const [k, v] of Object.entries(b.details).slice(0, 12)) { const kk = txt(k, 40), vv = txt(v, 120); if (kk && vv) det[kk] = vv; }
  }
  o.details = det;
  return o;
}

function vue(a, estGest) {
  const exp = a.date_expiration ? new Date(a.date_expiration) : null;
  const expiree = a.statut === 'active' && exp && exp.getTime() <= Date.now();
  const v = {
    id: a.id, titre: a.titre, description: a.description, prix: a.prix != null ? Number(a.prix) : null, prixTexte: a.prix_texte,
    categorie: a.categorie, lieu: a.lieu, photos: a.photos || [], details: a.details || {}, vedette: !!a.vedette,
    statut: expiree ? 'expiree' : a.statut, datePublication: a.created_at, dateExpiration: a.date_expiration,
  };
  if (estGest) { v.vues = a.vues; v.nbMessages = Number(a.nb_messages || 0); v.nbNonLus = Number(a.nb_non_lus || 0); v.afficheurId = a.afficheur_id; }
  return v;
}

const ACTIVE_SQL = `a.statut = 'active' AND (a.date_expiration IS NULL OR a.date_expiration > NOW())`;

// ── Public ──
async function listerPublic(gid, q) {
  await pret();
  const w = ['a.gestionnaire_id = $1', ACTIVE_SQL]; const p = [gid];
  if (q.categorie) { p.push(txt(q.categorie, 60)); w.push(`a.categorie = $${p.length}`); }
  if (q.lieu) { p.push(`%${txt(q.lieu, 80).replace(/[%_]/g, '')}%`); w.push(`a.lieu ILIKE $${p.length}`); }
  if (q.q) { p.push(`%${txt(q.q, 80).replace(/[%_]/g, '')}%`); w.push(`(a.titre ILIKE $${p.length} OR a.description ILIKE $${p.length})`); }
  if (q.prixMin !== undefined && q.prixMin !== '' && Number.isFinite(Number(q.prixMin))) { p.push(Number(q.prixMin)); w.push(`a.prix >= $${p.length}`); }
  if (q.prixMax !== undefined && q.prixMax !== '' && Number.isFinite(Number(q.prixMax))) { p.push(Number(q.prixMax)); w.push(`a.prix <= $${p.length}`); }
  // Filtres sur les détails (ex. Marque, Année, Chambres) : d = {Clé: valeur}, dmin / dmax = {Clé: nombre}
  const cleOk = (k) => { const kk = txt(k, 40); return kk && !/[\u0000-\u001f]/.test(kk) ? kk : ''; };
  const nbDetail = (idx) => `NULLIF(regexp_replace(a.details->>$${idx}, '[^0-9]', '', 'g'), '')::numeric`;
  const objSur = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  let nf = 0;
  for (const [k, v] of Object.entries(objSur(q.d))) {
    if (nf++ >= 4) break; const kk = cleOk(k), vv = typeof v === 'string' ? txt(v, 80) : ''; if (!kk || !vv) continue;
    p.push(kk); const ik = p.length; p.push(vv); w.push(`LOWER(a.details->>$${ik}) = LOWER($${p.length})`);
  }
  for (const [mode, src] of [['>=', q.dmin], ['<=', q.dmax]]) {
    for (const [k, v] of Object.entries(objSur(src))) {
      if (nf++ >= 8) break; const kk = cleOk(k); if (!kk || v === '' || !Number.isFinite(Number(v))) continue;
      p.push(kk); const ik = p.length; p.push(Number(v)); w.push(`${nbDetail(ik)} ${mode} $${p.length}`);
    }
  }
  const tri = { recent: 'a.vedette DESC, a.created_at DESC', prix_asc: 'a.prix ASC NULLS LAST, a.created_at DESC', prix_desc: 'a.prix DESC NULLS LAST, a.created_at DESC' }[q.tri] || 'a.vedette DESC, a.created_at DESC';
  const page = Math.max(1, parseInt(q.page, 10) || 1); const taille = 24;
  const total = Number((await pool.query(`SELECT COUNT(*) AS n FROM ann_annonces a WHERE ${w.join(' AND ')}`, p)).rows[0].n);
  p.push(taille, (page - 1) * taille);
  const r = await pool.query(`SELECT a.* FROM ann_annonces a WHERE ${w.join(' AND ')} ORDER BY ${tri} LIMIT $${p.length - 1} OFFSET $${p.length}`, p);
  const cats = (await pool.query(`SELECT a.categorie, COUNT(*) AS n FROM ann_annonces a WHERE a.gestionnaire_id=$1 AND ${ACTIVE_SQL} AND a.categorie <> '' GROUP BY a.categorie ORDER BY n DESC, a.categorie`, [gid])).rows;
  // Facettes : valeurs distinctes (avec compte) pour les clés demandées (ex. Marque, Carrosserie)
  const facettes = {};
  for (const k of String(q.facettes || '').split(',').map(cleOk).filter(Boolean).slice(0, 5)) {
    const f = await pool.query(`SELECT a.details->>$2 AS v, COUNT(*) AS n FROM ann_annonces a WHERE a.gestionnaire_id=$1 AND ${ACTIVE_SQL} AND COALESCE(a.details->>$2,'') <> '' GROUP BY 1 ORDER BY n DESC, 1 LIMIT 40`, [gid, k]);
    facettes[k] = f.rows.map((x) => ({ nom: x.v, n: Number(x.n) }));
  }
  return { annonces: r.rows.map((a) => vue(a, false)), total, page, pages: Math.max(1, Math.ceil(total / taille)), categories: cats.map((c) => ({ nom: c.categorie, n: Number(c.n) })), facettes };
}

async function detailPublic(gid, id, compterVue) {
  await pret();
  const r = await pool.query(`SELECT a.* FROM ann_annonces a WHERE a.id=$1 AND a.gestionnaire_id=$2 AND ${ACTIVE_SQL}`, [id, gid]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable ou expirée.', 404);
  if (compterVue) pool.query('UPDATE ann_annonces SET vues = vues + 1 WHERE id=$1', [id]).catch(() => {});
  return vue(r.rows[0], false);
}

async function envoyerMessage(gid, id, b) {
  await pret();
  if (txt(b.site_web, 200)) return { ok: true }; // champ piège (robots) : on fait semblant que c'est passé
  const nom = txt(b.nom, 80), email = txt(b.email, 200).toLowerCase(), tel = txt(b.telephone, 30), message = txt(b.message, 3000);
  if (nom.length < 2) throw new ErreurAnnonce('Indiquez votre nom.');
  if (!EMAIL_RE.test(email)) throw new ErreurAnnonce('Courriel invalide.');
  if (message.length < 5) throw new ErreurAnnonce('Écrivez votre message (5 caractères minimum).');
  if (/https?:\/\/.*https?:\/\/.*https?:\/\//is.test(message)) throw new ErreurAnnonce('Trop de liens dans le message.');
  const a = (await pool.query(`SELECT a.* FROM ann_annonces a WHERE a.id=$1 AND a.gestionnaire_id=$2 AND ${ACTIVE_SQL}`, [id, gid])).rows[0];
  if (!a) throw new ErreurAnnonce('Annonce introuvable ou expirée.', 404);
  // Même courriel, même annonce : pas plus de 3 messages par 24 h
  const n = Number((await pool.query(`SELECT COUNT(*) AS n FROM ann_messages WHERE annonce_id=$1 AND email=$2 AND created_at > NOW() - INTERVAL '24 hours'`, [id, email])).rows[0].n);
  if (n >= 3) throw new ErreurAnnonce('Vous avez déjà écrit plusieurs fois pour cette annonce. Patientez une réponse.', 429);
  await pool.query('INSERT INTO ann_messages (annonce_id, gestionnaire_id, nom, email, telephone, message) VALUES ($1,$2,$3,$4,$5,$6)', [id, gid, nom, email, tel, message]);
  const rg = await reglages(gid);
  if (rg.notifier_messages) {
    const g = (await pool.query('SELECT email FROM gestionnaires WHERE id=$1', [gid])).rows[0];
    if (g && g.email) {
      envoyer(g.email, `Nouveau message — ${a.titre}`,
        `<p>Vous avez reçu un message pour votre annonce <strong>${esc(a.titre)}</strong>.</p>
         <p><strong>De :</strong> ${esc(nom)} — ${esc(email)}${tel ? ` — ${esc(tel)}` : ''}</p>
         <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px">${esc(message)}</p>
         <p>Répondez simplement à ce courriel : votre réponse ira directement à ${esc(nom)}.</p>`, email).catch(() => {});
    }
  }
  return { ok: true };
}

// ── Gestionnaire ──
const SELECT_GEST = `SELECT a.*, (SELECT COUNT(*) FROM ann_messages m WHERE m.annonce_id = a.id) AS nb_messages,
  (SELECT COUNT(*) FROM ann_messages m WHERE m.annonce_id = a.id AND m.lu = false) AS nb_non_lus FROM ann_annonces a`;

async function listerGestionnaire(gid) {
  await pret();
  const r = await pool.query(`${SELECT_GEST} WHERE a.gestionnaire_id=$1 AND a.statut <> 'supprimee' ORDER BY a.created_at DESC LIMIT 1000`, [gid]);
  return r.rows.map((a) => vue(a, true));
}

function expirationDepuis(jours) { return jours > 0 ? new Date(Date.now() + jours * 86400000) : null; }

async function creer(gid, b) {
  await pret();
  await LIM.verifierActivation(gid, 1);
  const o = nettoyer(b);
  const rg = await reglages(gid);
  const jours = b.dureeJours !== undefined && b.dureeJours !== '' ? Math.max(0, Math.min(365, parseInt(b.dureeJours, 10) || 0)) : rg.duree_defaut_jours;
  const r = await pool.query(
    `INSERT INTO ann_annonces (gestionnaire_id, titre, description, prix, prix_texte, categorie, lieu, photos, details, vedette, date_expiration)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11) RETURNING id`,
    [gid, o.titre, o.description, o.prix, o.prix_texte, o.categorie, o.lieu, JSON.stringify(o.photos), JSON.stringify(o.details), o.vedette, expirationDepuis(jours)]);
  return r.rows[0].id;
}

async function modifier(gid, id, b) {
  await pret();
  const o = nettoyer(b);
  const r = await pool.query(
    `UPDATE ann_annonces SET titre=$3, description=$4, prix=$5, prix_texte=$6, categorie=$7, lieu=$8, photos=$9::jsonb, details=$10::jsonb, vedette=$11, updated_at=NOW()
      WHERE id=$1 AND gestionnaire_id=$2 AND statut <> 'supprimee' RETURNING id`,
    [id, gid, o.titre, o.description, o.prix, o.prix_texte, o.categorie, o.lieu, JSON.stringify(o.photos), JSON.stringify(o.details), o.vedette]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable.', 404);
}

// Une annonce déjà active et non expirée compte déjà dans le palier : seule une annonce qui le devient ajoute 1
async function verifierSiNonComptee(gid, id) {
  const r = await pool.query(
    `SELECT (statut = 'active' AND (date_expiration IS NULL OR date_expiration > NOW())) AS comptee
       FROM ann_annonces WHERE id=$1 AND gestionnaire_id=$2 AND statut <> 'supprimee'`, [id, gid]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable.', 404);
  if (!r.rows[0].comptee) await LIM.verifierActivation(gid, 1);
}

async function changerStatut(gid, id, statut) {
  await pret();
  if (!['active', 'vendue', 'archivee'].includes(statut)) throw new ErreurAnnonce('Statut invalide.');
  if (statut === 'active') await verifierSiNonComptee(gid, id);
  const r = await pool.query(`UPDATE ann_annonces SET statut=$3, updated_at=NOW() WHERE id=$1 AND gestionnaire_id=$2 AND statut <> 'supprimee' RETURNING id`, [id, gid, statut]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable.', 404);
}

async function renouveler(gid, id, jours) {
  await pret();
  const rg = await reglages(gid);
  const j = jours !== undefined && jours !== '' ? Math.max(0, Math.min(365, parseInt(jours, 10) || 0)) : rg.duree_defaut_jours;
  await verifierSiNonComptee(gid, id);
  const r = await pool.query(`UPDATE ann_annonces SET statut='active', date_expiration=$3, created_at=NOW(), updated_at=NOW() WHERE id=$1 AND gestionnaire_id=$2 AND statut <> 'supprimee' RETURNING id`, [id, gid, expirationDepuis(j)]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable.', 404);
}

async function supprimer(gid, id) {
  await pret();
  const r = await pool.query('DELETE FROM ann_annonces WHERE id=$1 AND gestionnaire_id=$2 RETURNING id', [id, gid]);
  if (!r.rows[0]) throw new ErreurAnnonce('Annonce introuvable.', 404);
}

async function messages(gid) {
  await pret();
  const r = await pool.query(
    `SELECT m.*, a.titre FROM ann_messages m JOIN ann_annonces a ON a.id = m.annonce_id WHERE m.gestionnaire_id=$1 ORDER BY m.created_at DESC LIMIT 300`, [gid]);
  return r.rows.map((m) => ({ id: m.id, annonceId: m.annonce_id, annonce: m.titre, nom: m.nom, email: m.email, telephone: m.telephone, message: m.message, lu: m.lu, date: m.created_at }));
}
async function marquerLu(gid, id, lu) {
  await pret();
  await pool.query('UPDATE ann_messages SET lu=$3 WHERE id=$1 AND gestionnaire_id=$2', [id, gid, lu !== false]);
}
async function supprimerMessage(gid, id) {
  await pret();
  await pool.query('DELETE FROM ann_messages WHERE id=$1 AND gestionnaire_id=$2', [id, gid]);
}

// ── Config du site (apparence) : TOUTES les chaînes passent par nettoyerTexte (utils/sanitize.js) avant d'être enregistrées ──
const CLES_INTERDITES = new Set(['__proto__', 'constructor', 'prototype']);
function nettoyerConfig(v, prof = 0) {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') return nettoyerTexte(v, 2000);
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v;
  if (prof >= 8) return null;
  if (Array.isArray(v)) return v.slice(0, 100).map((x) => nettoyerConfig(x, prof + 1));
  if (typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v).slice(0, 100)) {
      const kk = nettoyerTexte(k, 60);
      if (!kk || CLES_INTERDITES.has(kk)) continue;
      o[kk] = nettoyerConfig(val, prof + 1);
    }
    return o;
  }
  return null;
}

module.exports = {
  nettoyerConfig, ErreurAnnonce, pret, reglages, sauverReglages, listerPublic, detailPublic, envoyerMessage, listerGestionnaire, creer, modifier, changerStatut, renouveler, supprimer, messages, marquerLu, supprimerMessage };