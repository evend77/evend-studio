// CHEMIN : services/boutique_etsy_import.js
// e-Vend Studio — Connecteur Etsy (boutique solo) : import des annonces Etsy actives du gestionnaire dans SES produits.
// Adapté de services/studio_etsy_import.js (MV) : file de travaux dans la BASE, tranches de ≈40 s, pause automatique quand la limite d'appels Etsy est atteinte.
// Différences avec le MV :
//   • un seul compte Etsy par boutique (pas de collaborateur) ;
//   • « tout ou rien » : si le palier d'annonces actives ne permet pas de TOUT importer, rien n'est importé et un message l'explique ;
//   • catégorie : tout est placé dans « Divers / Autre » (réutilisée si elle existe déjà, sinon créée — la seule catégorie créée automatiquement) ;
//   • doublons évités par la table boutique_etsy_annonces.
// Lecture seule : rien n'est jamais modifié sur Etsy. Pas de suivi du stock après l'import.

'use strict';

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../db');
const svc = require('./boutique_etsy');
const L = require('./boutique_limites');
const EXP = require('./boutique_expedition');

const MEDIA_URL = 'https://media.e-vend.ca';
const CATEGORIE_DEFAUT = 'Divers / Autre';
const DUREE_TRANCHE_MS = 40 * 1000;
const PAGE = 100;   // maximum autorisé par Etsy

let s3 = null;
const clientS3 = () => s3 || (s3 = new S3Client({
  region: 'auto', endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
}));

// ─── Conversions ──────────────────────────────────────────────────────────────
function poidsKg(valeur, unite) {
  const v = parseFloat(valeur);
  if (!v || v <= 0) return null;
  const u = String(unite || '').toLowerCase();
  const kg = u === 'oz' ? v * 0.0283495 : u === 'lb' ? v * 0.453592 : u === 'g' ? v / 1000 : u === 'kg' ? v : null;
  return kg === null ? null : Math.round(kg * 1000) / 1000;
}
function texteDescription(t) {
  const s = String(t || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return s.length > 5000 ? s.slice(0, 4997) + '…' : s;
}

// ─── Catégorie « Divers / Autre » chez CE gestionnaire ───────────────────────
// Réutilisée si elle existe (même nom, sans tenir compte des majuscules) ; sinon créée. Une catégorie désactivée est réactivée (le nom est unique).
async function categorieDefaut(gid) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [3301, gid]);
    let r = (await client.query('SELECT id, nom, active FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2) ORDER BY id LIMIT 1', [gid, CATEGORIE_DEFAUT])).rows[0];
    if (!r) r = (await client.query('INSERT INTO studio_categories (gestionnaire_id, nom, taxable, active) VALUES ($1,$2,true,true) RETURNING id, nom, active', [gid, CATEGORIE_DEFAUT])).rows[0];
    else if (r.active === false) await client.query('UPDATE studio_categories SET active = true WHERE id = $1', [r.id]);
    await client.query('COMMIT');
    return { id: r.id, nom: r.nom };
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
}

// ─── Photos : copiées chez nous (survivent à la fermeture de la boutique Etsy), au même endroit que les photos envoyées par le gestionnaire ──
function extension(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  return null;
}
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
async function copierPhoto(gid, url) {
  let u; try { u = new URL(url); } catch (e) { return null; }
  if (u.protocol !== 'https:' || !/(^|\.)etsystatic\.com$/i.test(u.hostname)) return null;   // seules les images hébergées par Etsy sont téléchargées
  const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    const ext = extension(buf); if (!ext) return null;
    const cle = `studio/boutique/${gid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    await clientS3().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buf, ContentType: MIMES[ext] }));
    return `${MEDIA_URL}/${cle}`;
  } catch (e) { return null; }
  finally { clearTimeout(delai); }
}

// ─── Importer UNE annonce (les données viennent déjà de la page : aucun appel de plus) ──
// retourne 'importe' | 'ignore' (déjà là) | 'brouillon' (importée mais à vérifier)
async function importerUne(job, l, ctx) {
  const gid = job.gestionnaire_id;
  const id = String(l.listing_id);
  const deja = await pool.query('SELECT 1 FROM boutique_etsy_annonces WHERE gestionnaire_id = $1 AND etsy_listing_id = $2', [gid, id]);
  if (deja.rows.length) return 'ignore';

  const prix = l.price && l.price.divisor ? l.price.amount / l.price.divisor : 0;
  const urls = (Array.isArray(l.images) ? l.images : []).map((i) => i.url_fullxfull || i.url_570xN).filter(Boolean).slice(0, 8);
  const photos = [];
  for (const u of urls) { const p = await copierPhoto(gid, u); if (p) photos.push(p); }

  if (!ctx.categorie) ctx.categorie = await categorieDefaut(gid);
  const titre = String(l.title || 'Annonce Etsy').slice(0, 150);
  // Un prix inférieur au minimum de la boutique (0,01 $) met l'annonce en brouillon plutôt que de la perdre
  let statut = 'actif';
  if (!(prix >= 0.01)) { statut = 'brouillon'; ctx.avertissements.add('Des annonces sans prix valide ont été importées en brouillon : complétez leur prix avant de les activer.'); }
  const stock = Math.max(parseInt(l.quantity, 10) || 0, 0);
  const sku = Array.isArray(l.skus) && l.skus[0] ? String(l.skus[0]).slice(0, 60) : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = await client.query(
      `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, stock, sku, categorie, categorie_id,
                             photo_principale, photos, variantes, statut, poids, etsy_listing_id, etsy_synced_at)
       VALUES ($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,'[]',$11,$12,$13,NOW()) RETURNING id`,
      [gid, titre, texteDescription(l.description), prix >= 0.01 ? prix : 0.01, stock, sku, ctx.categorie.nom, ctx.categorie.id, photos[0] || null, JSON.stringify(photos), statut, poidsKg(l.item_weight, l.item_weight_unit), id]);
    const ins = await client.query(
      `INSERT INTO boutique_etsy_annonces (gestionnaire_id, etsy_listing_id, produit_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING 1`, [gid, id, p.rows[0].id]);
    if (!ins.rowCount) { await client.query('ROLLBACK'); return 'ignore'; }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }

  const devise = l.price && l.price.currency_code;
  if (devise && String(devise).toUpperCase() !== ctx.devise) ctx.avertissements.add(`Certains prix Etsy sont en ${devise} : ils sont repris tels quels (sans conversion). Vérifiez vos prix.`);
  if (l.has_variations) ctx.avertissements.add('Certaines annonces ont des variations Etsy : elles sont importées comme une seule annonce (variations non reprises).');
  return statut === 'brouillon' ? 'brouillon' : 'importe';
}

// ─── Travaux ──────────────────────────────────────────────────────────────────
const ACTIFS = `statut IN ('en_attente','en_cours','pause')`;
async function creerImport(gid) {
  await svc.exigerAddon(gid);
  const c = await svc.etatConnexion(gid);
  if (!c.connexion) throw new svc.ErreurEtsy("Connectez d'abord votre compte Etsy.", 409);
  if (c.connexion.statut !== 'connecte') throw new svc.ErreurEtsy("Reconnectez votre compte Etsy avant d'importer.", 409);
  const dej = await pool.query(`SELECT id FROM boutique_etsy_jobs WHERE gestionnaire_id = $1 AND type = 'import' AND ${ACTIFS}`, [gid]);
  if (dej.rows.length) return { id: dej.rows[0].id, dejaEnCours: true };
  try {
    const r = await pool.query(`INSERT INTO boutique_etsy_jobs (gestionnaire_id, type) VALUES ($1,'import') RETURNING id`, [gid]);
    return { id: r.rows[0].id, dejaEnCours: false };
  } catch (e) {
    if (e.code === '23505') { const x = await pool.query(`SELECT id FROM boutique_etsy_jobs WHERE gestionnaire_id = $1 AND type = 'import' AND ${ACTIFS}`, [gid]); return { id: x.rows[0].id, dejaEnCours: true }; }
    throw e;
  }
}
async function terminer(id, statut, message) {
  await pool.query(`UPDATE boutique_etsy_jobs SET statut = $2, message = $3, fini_le = NOW(), maj_le = NOW(), verrou_jusqua = NULL WHERE id = $1`, [id, statut, message || null]);
}

// Traite une tranche (≈40 s) d'un travail déjà verrouillé. Rend la main entre deux tranches.
async function traiterTranche(job) {
  const gid = job.gestionnaire_id;
  const debut = Date.now();
  const ctx = { categorie: null, devise: String(await EXP.deviseDe(pool, gid)).toUpperCase(), avertissements: new Set() };
  try {
    if (!(await svc.autorise(gid))) return terminer(job.id, 'erreur', "L'option « Connecteur Etsy » n'est plus activée.");
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) return terminer(job.id, 'erreur', "La configuration Etsy n'est pas terminée.");
    const jeton = await svc.obtenirJeton(gid);
    const co = (await pool.query('SELECT etsy_shop_id FROM boutique_etsy_connexion WHERE gestionnaire_id = $1', [gid])).rows[0];
    if (!co) return terminer(job.id, 'erreur', "Aucun compte Etsy n'est connecté.");
    let { traites, importes, ignores, erreurs } = job;
    let offset = ((job.page_reprise || 1) - 1) * PAGE;
    let indexDepart = job.index_reprise || 0;

    while (true) {
      const p = await svc.etsyGet(cfg, jeton, `/shops/${co.etsy_shop_id}/listings/active`, { limit: PAGE, offset, includes: 'Images' });
      const liste = Array.isArray(p.results) ? p.results : [];
      const compte = parseInt(p.count, 10) || liste.length;

      if (!job.total && offset === 0) {
        // Tout ou rien : on vérifie la place AVANT d'importer quoi que ce soit
        const e = await L.etat(gid);
        const dejaLies = +(await pool.query('SELECT COUNT(*)::int AS n FROM boutique_etsy_annonces WHERE gestionnaire_id = $1', [gid])).rows[0].n;
        const aAjouter = Math.max(compte - dejaLies, 0);
        if (e.limite !== null) {
          const restant = Math.max(e.limite - (await L.compter(gid)), 0);
          if (aAjouter > restant) {
            return terminer(job.id, 'erreur', `Import bloqué : vous avez ${aAjouter} annonce${aAjouter > 1 ? 's' : ''} à importer depuis Etsy, mais votre palier ne permet plus que ${restant} annonce${restant > 1 ? 's' : ''} active${restant > 1 ? 's' : ''} (limite : ${e.limite}). Aucune annonce n'a été importée. Passez à un palier supérieur dans « Mon plan & limites » ou désactivez des annonces, puis relancez l'import.`);
          }
        }
        await pool.query('UPDATE boutique_etsy_jobs SET total = $2 WHERE id = $1', [job.id, compte]);
        job.total = compte;
      }

      for (let i = indexDepart; i < liste.length; i++) {
        try {
          const res = await importerUne(job, liste[i], ctx);
          if (res === 'ignore') ignores++; else importes++;
        } catch (e) {
          if (e.quota || e.code === 'reconnexion') throw e;
          erreurs++;
          console.warn(`[boutique-etsy-import] annonce ${liste[i] && liste[i].listing_id} :`, e.message);
        }
        traites++;
        if ((traites % 5) === 0) await pool.query(`UPDATE boutique_etsy_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, maj_le=NOW(), verrou_jusqua = NOW() + interval '3 minutes' WHERE id=$1`, [job.id, traites, importes, ignores, erreurs]);
        if (Date.now() - debut > DUREE_TRANCHE_MS && i < liste.length - 1) {
          // On sort en milieu de page : la prochaine tranche relit la même page, les annonces déjà faites sont sautées
          await pool.query(`UPDATE boutique_etsy_jobs SET statut='en_attente', page_reprise=$2, index_reprise=$7, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
            [job.id, Math.floor(offset / PAGE) + 1, traites, importes, ignores, erreurs, i + 1]);
          return;
        }
      }
      indexDepart = 0;
      offset += PAGE;
      if (!liste.length || offset >= compte) break;
      await pool.query('UPDATE boutique_etsy_jobs SET page_reprise=$2, index_reprise=0, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW() WHERE id=$1', [job.id, Math.floor(offset / PAGE) + 1, traites, importes, ignores, erreurs]);
      if (Date.now() - debut > DUREE_TRANCHE_MS) {
        await pool.query(`UPDATE boutique_etsy_jobs SET statut='en_attente', verrou_jusqua=NULL WHERE id=$1`, [job.id]);
        return;
      }
    }
    await pool.query('UPDATE boutique_etsy_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5 WHERE id=$1', [job.id, traites, importes, ignores, erreurs]);
    return terminer(job.id, 'termine', [...ctx.avertissements].join(' ') || null);
  } catch (e) {
    if (e.quota) {
      const delai = Math.min(Math.max((e.retryAfterSec || 15 * 60) * 1000, 60 * 1000), 24 * 60 * 60 * 1000);
      await pool.query(`UPDATE boutique_etsy_jobs SET statut='pause', reprise_a=$2, message=$3, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
        [job.id, new Date(Date.now() + delai), "Pause : la limite d'appels Etsy est atteinte. L'import reprend automatiquement."]);
      return;
    }
    if (e.code === 'reconnexion') return terminer(job.id, 'erreur', 'Reconnexion Etsy requise : reconnectez votre compte puis relancez.');
    if (e instanceof svc.ErreurEtsy && e.status === 502) {
      await pool.query(`UPDATE boutique_etsy_jobs SET statut='pause', reprise_a = NOW() + interval '5 minutes', message=$2, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, "Etsy est injoignable pour l'instant : nouvel essai dans quelques minutes."]);
      return;
    }
    console.error('[boutique-etsy-import] travail', job.id, e.message);
    return terminer(job.id, 'erreur', `Erreur pendant l'import : ${String(e.message).slice(0, 300)}`);
  }
}

// Prend UN travail prêt (ou dont le verrou a expiré après un plantage) et traite une tranche
async function prochainTravail() {
  const r = await pool.query(
    `UPDATE boutique_etsy_jobs SET statut='en_cours', verrou_jusqua = NOW() + interval '3 minutes', maj_le = NOW(), reprise_a = NULL
      WHERE id = (SELECT id FROM boutique_etsy_jobs
                   WHERE statut = 'en_attente'
                      OR (statut = 'pause' AND reprise_a <= NOW())
                      OR (statut = 'en_cours' AND verrou_jusqua < NOW())
                   ORDER BY cree_le LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING *`);
  if (!r.rows[0]) return false;
  await traiterTranche(r.rows[0]);
  return true;
}

let timer = null, occupe = false;
function demarrer() {
  if (timer || process.env.ETSY_WORKER_DESACTIVE === '1') return;
  timer = setInterval(async () => {
    if (occupe) return; occupe = true;
    try { while (await prochainTravail()) { /* enchaîne tant qu'il y a du travail */ } }
    catch (e) { if (e.code !== '42P01') console.error('[boutique-etsy-import] worker', e.message); }   // 42P01 : SQL pas encore lancé
    finally { occupe = false; }
  }, 20000);
  if (timer.unref) timer.unref();
}

async function etatImport(gid) {
  const r = await pool.query(`SELECT id, statut, total, traites, importes, ignores, erreurs, message, reprise_a, cree_le, fini_le FROM boutique_etsy_jobs WHERE gestionnaire_id = $1 AND type='import' ORDER BY cree_le DESC LIMIT 1`, [gid]);
  return r.rows[0] || null;
}

module.exports = { creerImport, etatImport, demarrer, prochainTravail, categorieDefaut, CATEGORIE_DEFAUT };