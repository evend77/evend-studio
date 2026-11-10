// CHEMIN : services/studio_etsy_import.js
// e-Vend Studio — Connecteur Etsy : import des annonces d'un collaborateur dans ses produits Studio.
// Adapté de routes/etsySync.js (e-Vend) et de services/studio_ebay_import.js : file de travaux dans la BASE (pas de Redis),
// traitement par tranches de ≈40 s, pause automatique quand la limite d'appels Etsy du gestionnaire est atteinte.
// Lecture seule : rien n'est jamais modifié sur Etsy.

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../db');
const svc = require('./studio_etsy');
const regles = require('./studio_regles_produits');
const cfgMV = require('./studio_config_mv');

const MEDIA_URL = 'https://media.e-vend.ca';
const MAX_PRODUITS_COLLAB = 1000;
const CATEGORIE_DEFAUT = 'Autre / Divers / Général';
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
  let s = String(t || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return s.length > 5000 ? s.slice(0, 4997) + '…' : s;
}

// ─── Catégorie : « Autre / Divers / Général » chez CE gestionnaire (le collaborateur la change ensuite) ──
async function categorieDefaut(gid) {
  const ex = await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, CATEGORIE_DEFAUT]);
  if (ex.rows[0]) return { id: ex.rows[0].id, nom: CATEGORIE_DEFAUT };
  const cree = await pool.query(
    `INSERT INTO studio_categories (gestionnaire_id, nom, taxable, active) VALUES ($1,$2,true,true) ON CONFLICT (gestionnaire_id, LOWER(nom)) DO NOTHING RETURNING id`, [gid, CATEGORIE_DEFAUT]);
  if (cree.rows[0]) return { id: cree.rows[0].id, nom: CATEGORIE_DEFAUT };
  return { id: (await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, CATEGORIE_DEFAUT])).rows[0].id, nom: CATEGORIE_DEFAUT };
}

// ─── Photos : copiées chez nous (survivent à la fermeture de la boutique Etsy) ──
function extension(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  return null;
}
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
async function copierPhoto(gid, cid, url) {
  let u; try { u = new URL(url); } catch (e) { return null; }
  if (u.protocol !== 'https:' || !/(^|\.)etsystatic\.com$/i.test(u.hostname)) return null;   // seulement les images hébergées par Etsy
  const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    const ext = extension(buf); if (!ext) return null;
    const cle = `studio/collab/${gid}/${cid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    await clientS3().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buf, ContentType: MIMES[ext] }));
    return `${MEDIA_URL}/${cle}`;
  } catch (e) { return null; }
  finally { clearTimeout(delai); }
}

// ─── Importer UNE annonce (les données viennent déjà de la page : aucun appel de plus) ──
// retourne 'importe' | 'ignore' (déjà là) | 'brouillon' (importée mais à vérifier)
async function importerUne(job, l, ctx) {
  const gid = job.gestionnaire_id, cid = job.collaborateur_id;
  const id = String(l.listing_id);
  const deja = await pool.query('SELECT 1 FROM produits WHERE collaborateur_id = $1 AND etsy_listing_id = $2', [cid, id]);
  if (deja.rows.length) return 'ignore';

  const prix = l.price && l.price.divisor ? l.price.amount / l.price.divisor : 0;
  const urls = (Array.isArray(l.images) ? l.images : []).map((i) => i.url_fullxfull || i.url_570xN).filter(Boolean).slice(0, 8);
  const photos = [];
  for (const u of urls) { const p = await copierPhoto(gid, cid, u); if (p) photos.push(p); }

  const categorie = ctx.categories ? ctx.categorie : { id: null, nom: null };
  const titre = String(l.title || 'Annonce Etsy').slice(0, 150);
  let statut = regles.statutPublication(ctx.regles, null, 'actif');
  let note = null;
  const ep = regles.erreurPrix(ctx.regles, prix, titre);
  if (ep) { statut = 'brouillon'; note = ep; }
  const stock = ctx.regles.gererStock ? Math.max(parseInt(l.quantity, 10) || 0, 0) : null;
  const sku = Array.isArray(l.skus) && l.skus[0] ? String(l.skus[0]).slice(0, 60) : null;

  await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids, etsy_listing_id, etsy_synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'[]',$12,$13,$14,NOW())
     ON CONFLICT (collaborateur_id, etsy_listing_id) WHERE etsy_listing_id IS NOT NULL DO NOTHING`,
    [gid, cid, titre, texteDescription(l.description), prix, stock, sku, categorie.nom, categorie.id, photos[0] || null, JSON.stringify(photos), statut, poidsKg(l.item_weight, l.item_weight_unit), id]);

  const devise = l.price && l.price.currency_code;
  if (devise && devise !== ctx.devise) ctx.avertissements.add(`Certains prix Etsy sont en ${devise} : ils sont repris tels quels (sans conversion). Vérifiez vos prix.`);
  if (l.has_variations) ctx.avertissements.add('Certaines annonces ont des variations Etsy : elles sont importées comme une seule annonce (variations non reprises).');
  if (note) ctx.avertissements.add(note);
  return statut === 'brouillon' ? 'brouillon' : 'importe';
}

// ─── Travaux ──────────────────────────────────────────────────────────────────
const ACTIFS = `statut IN ('en_attente','en_cours','pause')`;
async function creerImport(gid, cid) {
  const dej = await pool.query(`SELECT id FROM etsy_jobs WHERE collaborateur_id = $1 AND type = 'import' AND ${ACTIFS}`, [cid]);
  if (dej.rows.length) return { id: dej.rows[0].id, dejaEnCours: true };
  try {
    const r = await pool.query(`INSERT INTO etsy_jobs (gestionnaire_id, collaborateur_id, type) VALUES ($1,$2,'import') RETURNING id`, [gid, cid]);
    return { id: r.rows[0].id, dejaEnCours: false };
  } catch (e) {
    if (e.code === '23505') { const x = await pool.query(`SELECT id FROM etsy_jobs WHERE collaborateur_id = $1 AND type = 'import' AND ${ACTIFS}`, [cid]); return { id: x.rows[0].id, dejaEnCours: true }; }
    throw e;
  }
}
async function terminer(id, statut, message) {
  await pool.query(`UPDATE etsy_jobs SET statut = $2, message = $3, fini_le = NOW(), maj_le = NOW(), verrou_jusqua = NULL WHERE id = $1`, [id, statut, message || null]);
}

async function placeRestante(gid, cid) {
  const n = +(await pool.query('SELECT COUNT(*)::int AS n FROM produits WHERE collaborateur_id = $1', [cid])).rows[0].n;
  let max = MAX_PRODUITS_COLLAB;
  const mv = await cfgMV.lire(gid, pool);
  const etatPlan = await require('./studio_plans_collab').etat(gid, cid, pool).catch(() => ({ systeme: false }));
  if (etatPlan.systeme) {
    if (etatPlan.bloque) return { max, restant: 0 };
    if (etatPlan.plan && etatPlan.plan.limite_annonces != null) max = Math.min(max, etatPlan.plan.limite_annonces);
  } else if (!cfgMV.actif(mv, 'utiliser_plans_vendeur', false)) {
    const m = parseInt(mv.max_produits, 10);
    if (Number.isFinite(m) && m > 0) max = Math.min(max, m);
  }
  return { max, restant: Math.max(max - n, 0) };
}

async function traiterTranche(job) {
  const gid = job.gestionnaire_id, cid = job.collaborateur_id;
  const debut = Date.now();
  const rg = await regles.lire(gid, pool);
  const categories = cfgMV.actif(await cfgMV.lire(gid, pool), 'permettre_categories', true);
  const ctx = { regles: rg, categories, categorie: categories ? await categorieDefaut(gid) : null, devise: rg.devise || 'CAD', avertissements: new Set() };
  try {
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) return terminer(job.id, 'erreur', "Le gestionnaire n'a pas terminé la configuration Etsy.");
    const jeton = await svc.obtenirJeton(cid);
    const co = (await pool.query('SELECT etsy_shop_id FROM etsy_connexions WHERE collaborateur_id = $1', [cid])).rows[0];
    if (!co) return terminer(job.id, 'erreur', "Aucun compte Etsy n'est connecté.");
    let { traites, importes, ignores, erreurs } = job;
    let offset = ((job.page_reprise || 1) - 1) * PAGE;
    let indexDepart = job.index_reprise || 0;
    let total = job.total || 0;

    while (true) {
      const p = await svc.etsyGet(cfg, jeton, `/shops/${co.etsy_shop_id}/listings/active`, { limit: PAGE, offset, includes: 'Images' });
      const liste = Array.isArray(p.results) ? p.results : [];
      if (!job.total && offset === 0 && !total) {
        total = parseInt(p.count, 10) || liste.length;
        // Tout ou rien : on vérifie la place AVANT d'importer quoi que ce soit
        const place = await placeRestante(gid, cid);
        const dejaLies = +(await pool.query('SELECT COUNT(*)::int AS n FROM produits WHERE collaborateur_id = $1 AND etsy_listing_id IS NOT NULL', [cid])).rows[0].n;
        const aAjouter = Math.max(total - dejaLies, 0);
        if (aAjouter > place.restant) {
          return terminer(job.id, 'erreur', `Limite atteinte : vous avez ${total} annonces sur Etsy (${aAjouter} à ajouter) mais il ne reste de la place que pour ${place.restant} annonce(s) (maximum ${place.max}). Supprimez des annonces ou contactez le gestionnaire.`);
        }
        await pool.query('UPDATE etsy_jobs SET total = $2 WHERE id = $1', [job.id, total]);
        job.total = total;
      }

      for (let i = indexDepart; i < liste.length; i++) {
        try {
          const res = await importerUne(job, liste[i], ctx);
          if (res === 'ignore') ignores++; else importes++;
        } catch (e) {
          if (e.quota || e.code === 'reconnexion') throw e;
          erreurs++;
          console.warn(`[etsy-import] annonce ${liste[i] && liste[i].listing_id} :`, e.message);
        }
        traites++;
        if ((traites % 5) === 0) await pool.query(`UPDATE etsy_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, maj_le=NOW(), verrou_jusqua = NOW() + interval '3 minutes' WHERE id=$1`, [job.id, traites, importes, ignores, erreurs]);
        if (Date.now() - debut > DUREE_TRANCHE_MS && i < liste.length - 1) {
          // On sort en milieu de page : la prochaine tranche relit la même page, les annonces déjà faites sont sautées
          await pool.query(`UPDATE etsy_jobs SET statut='en_attente', page_reprise=$2, index_reprise=$7, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
            [job.id, Math.floor(offset / PAGE) + 1, traites, importes, ignores, erreurs, i + 1]);
          return;
        }
      }
      indexDepart = 0;
      offset += PAGE;
      if (!liste.length || offset >= (parseInt(p.count, 10) || 0)) break;
      await pool.query('UPDATE etsy_jobs SET page_reprise=$2, index_reprise=0, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW() WHERE id=$1', [job.id, Math.floor(offset / PAGE) + 1, traites, importes, ignores, erreurs]);
      if (Date.now() - debut > DUREE_TRANCHE_MS) {
        await pool.query(`UPDATE etsy_jobs SET statut='en_attente', verrou_jusqua=NULL WHERE id=$1`, [job.id]);
        return;
      }
    }
    await pool.query('UPDATE etsy_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5 WHERE id=$1', [job.id, traites, importes, ignores, erreurs]);
    return terminer(job.id, 'termine', [...ctx.avertissements].join(' ') || null);
  } catch (e) {
    if (e.quota) {
      const delai = Math.min(Math.max((e.retryAfterSec || 15 * 60) * 1000, 60 * 1000), 24 * 60 * 60 * 1000);
      await pool.query(`UPDATE etsy_jobs SET statut='pause', reprise_a=$2, message=$3, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
        [job.id, new Date(Date.now() + delai), "Pause : la limite d'appels Etsy est atteinte. L'import reprend automatiquement."]);
      return;
    }
    if (e.code === 'reconnexion') return terminer(job.id, 'erreur', 'Reconnexion Etsy requise : reconnectez votre compte puis relancez.');
    if (e instanceof svc.ErreurEtsy && e.status === 502) {
      await pool.query(`UPDATE etsy_jobs SET statut='pause', reprise_a = NOW() + interval '5 minutes', message=$2, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, "Etsy est injoignable pour l'instant : nouvel essai dans quelques minutes."]);
      return;
    }
    console.error('[etsy-import] travail', job.id, e.message);
    return terminer(job.id, 'erreur', `Erreur pendant l'import : ${String(e.message).slice(0, 300)}`);
  }
}

async function prochainTravail() {
  const r = await pool.query(
    `UPDATE etsy_jobs SET statut='en_cours', verrou_jusqua = NOW() + interval '3 minutes', maj_le = NOW(), reprise_a = NULL
      WHERE id = (SELECT id FROM etsy_jobs
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
    catch (e) { if (e.code !== '42P01') console.error('[etsy-import] worker', e.message); }   // 42P01 : SQL pas encore lancé
    finally { occupe = false; }
  }, 20000);
  if (timer.unref) timer.unref();
}

async function etatImport(cid, gid) {
  const r = await pool.query(`SELECT id, statut, total, traites, importes, ignores, erreurs, message, reprise_a, cree_le, fini_le FROM etsy_jobs WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND type='import' ORDER BY cree_le DESC LIMIT 1`, [cid, gid]);
  return r.rows[0] || null;
}

module.exports = { creerImport, etatImport, demarrer, prochainTravail };