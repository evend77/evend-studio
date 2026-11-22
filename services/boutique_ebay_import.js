// CHEMIN : services/boutique_ebay_import.js
// e-Vend Studio — Connecteur eBay (boutique solo) : import des annonces eBay du gestionnaire dans SES produits.
// Adapté de services/studio_ebay_import.js (MV) : API Trading (GetMyeBaySelling + GetItem), photos copiées sur notre stockage, file de travaux dans la BASE,
// appels comptés par boutique. Différences avec le MV :
//   • un seul compte eBay par boutique (pas de collaborateur) ;
//   • « tout ou rien » : si le palier d'annonces actives ne permet pas TOUT importer, rien n'est importé et un message l'explique ;
//   • les catégories ne sont JAMAIS créées automatiquement : la catégorie eBay est mémorisée et le gestionnaire l'associe lui-même à l'une de SES catégories.
// Tables : boutique_ebay_jobs, boutique_ebay_budget, boutique_ebay_annonces, boutique_ebay_categories, boutique_ebay_nouvelles (+ ebay_map_* en lecture seule).

'use strict';

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { nettoyerTexte } = require('../utils/sanitize');   // nettoyage unique (utils/sanitize.js)
const pool = require('../db');
const svc = require('./boutique_ebay');
const L = require('./boutique_limites');

const COMPAT = '1191';
const SITE_ID = '2'; // Canada
const MEDIA_URL = 'https://media.e-vend.ca';
const FUSEAU_REMISE = 'America/Los_Angeles';
const LIMITE_GETITEM_JOUR = parseInt(process.env.EBAY_GETITEM_LIMITE_JOUR || '4500', 10);
const LIMITE_APPELS_PAGE_JOUR = 500;
const DUREE_TRANCHE_MS = 40 * 1000;
const SQL_JOUR = `(NOW() AT TIME ZONE '${FUSEAU_REMISE}')::date`;

let s3 = null;
const clientS3 = () => s3 || (s3 = new S3Client({
  region: 'auto', endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
}));

class QuotaEbay extends Error { constructor(m) { super(m || 'Limite quotidienne eBay atteinte'); this.quota = true; } }

// ─── Petit lecteur XML (les réponses Trading sont simples et prévisibles) ─────
const decoder = (s) => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;|&#x27;/g, "'").replace(/&amp;/g, '&');
function brut(xml, nom) {
  const m = new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`).exec(xml || '');
  return m ? m[1] : null;
}
const valeur = (xml, nom) => { const b = brut(xml, nom); return b === null ? null : decoder(b).trim(); };
function blocs(xml, nom) {
  const out = []; const re = new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`, 'g'); let m;
  while ((m = re.exec(xml || ''))) out.push(m[1]);
  return out;
}
function attribut(xml, nom, attr) {
  const m = new RegExp(`<${nom}\\s[^>]*${attr}="([^"]*)"`).exec(xml || '');
  return m ? m[1] : null;
}
const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─── Appel Trading ────────────────────────────────────────────────────────────
async function trading(env, jeton, appel, corps) {
  const url = env === 'sandbox' ? 'https://api.sandbox.ebay.com/ws/api.dll' : 'https://api.ebay.com/ws/api.dll';
  const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 60000);
  let r;
  try {
    r = await fetch(url, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'X-EBAY-API-CALL-NAME': appel, 'X-EBAY-API-SITEID': SITE_ID, 'X-EBAY-API-COMPATIBILITY-LEVEL': COMPAT, 'X-EBAY-API-IAF-TOKEN': jeton, 'Content-Type': 'text/xml' },
      body: `<?xml version="1.0" encoding="utf-8"?><${appel}Request xmlns="urn:ebay:apis:eBLBaseComponents">${corps}</${appel}Request>`,
    });
  } catch (e) { throw new svc.ErreurEbay("Impossible de joindre eBay pour l'instant.", 502); }
  finally { clearTimeout(delai); }
  const xml = await r.text();
  if (r.status === 429) throw new QuotaEbay();
  if (/<Ack>Failure<\/Ack>/.test(xml)) {
    const e0 = blocs(xml, 'Errors')[0] || '';
    const code = valeur(e0, 'ErrorCode');
    const msg = valeur(e0, 'LongMessage') || valeur(e0, 'ShortMessage') || `Erreur eBay ${appel}`;
    if (code === '518' || /usage limit|call limit/i.test(msg)) throw new QuotaEbay(msg);
    if (code === '931' || code === '932' || /auth token|hard expired|invalid.*token/i.test(msg)) throw new svc.ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
    const err = new Error(msg); err.ebayCode = code; throw err;
  }
  return xml;
}

// ─── Budget d'appels (par boutique) ───────────────────────────────────────────
async function reserver(gid, appel, n, plafond) {
  await pool.query(`INSERT INTO boutique_ebay_budget (gestionnaire_id, jour, appel, nb) VALUES ($1, ${SQL_JOUR}, $2, 0) ON CONFLICT DO NOTHING`, [gid, appel]);
  const r = await pool.query(
    `UPDATE boutique_ebay_budget SET nb = nb + $3 WHERE gestionnaire_id = $1 AND jour = ${SQL_JOUR} AND appel = $2 AND nb + $3 <= $4 RETURNING nb`, [gid, appel, n, plafond]);
  if (!r.rows.length) throw new QuotaEbay(`Limite quotidienne atteinte (${appel})`);
}
async function signalerQuota(gid) {
  await pool.query(
    `INSERT INTO boutique_ebay_budget (gestionnaire_id, jour, appel, nb) VALUES ($1, ${SQL_JOUR}, 'GetItem', $2)
     ON CONFLICT (gestionnaire_id, jour, appel) DO UPDATE SET nb = GREATEST(boutique_ebay_budget.nb, $2)`, [gid, LIMITE_GETITEM_JOUR]);
}
async function prochaineRemise() {
  const r = await pool.query(`SELECT ((date_trunc('day', NOW() AT TIME ZONE '${FUSEAU_REMISE}') + INTERVAL '1 day') AT TIME ZONE '${FUSEAU_REMISE}') + INTERVAL '5 minutes' AS t`);
  return new Date(r.rows[0].t);
}

// ─── Lecture des annonces ─────────────────────────────────────────────────────
async function pageAnnonces(env, jeton, numero) {
  const xml = await trading(env, jeton, 'GetMyeBaySelling', `
  <ActiveList><Include>true</Include><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>${numero}</PageNumber></Pagination></ActiveList>
  <OutputSelector>ActiveList.ItemArray.Item.ItemID</OutputSelector>
  <OutputSelector>ActiveList.PaginationResult</OutputSelector>`);
  const liste = brut(xml, 'ActiveList');
  if (liste === null) return { ids: [], total: 0, pages: 1 };
  const ids = blocs(liste, 'Item').map((i) => valeur(i, 'ItemID')).filter(Boolean);
  return { ids, total: parseInt(valeur(liste, 'TotalNumberOfEntries') || String(ids.length), 10) || 0, pages: parseInt(valeur(liste, 'TotalNumberOfPages') || '1', 10) || 1 };
}

function poidsKg(xml) {
  const maj = brut(xml, 'WeightMajor'), min = brut(xml, 'WeightMinor');
  const a = parseFloat(maj) || 0, b = parseFloat(min) || 0;
  if (!a && !b) return null;
  const u = ((attribut(xml, 'WeightMajor', 'unit') || '') + (attribut(xml, 'WeightMinor', 'unit') || '')).toLowerCase();
  if (u.includes('lb') || u.includes('oz')) return Math.round((a + b / 16) * 0.453592 * 1000) / 1000;
  if (u.includes('kg') || u.includes('g')) return Math.round((a + b / 1000) * 1000) / 1000;
  return null;
}

function texteDescription(html) {
  let t = String(html || '').replace(/<\s*(br|\/p|\/div|\/li|\/h\d)\s*\/?>/gi, '\n');
  t = nettoyerTexte(t, 1000000);
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39|nbsp);/g, (e) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&nbsp;': ' ' }[e]));
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > 5000 ? t.slice(0, 4997) + '…' : t;
}

async function detailsAnnonce(env, jeton, id) {
  const xml = await trading(env, jeton, 'GetItem', `<ItemID>${echapper(id)}</ItemID><DetailLevel>ReturnAll</DetailLevel>`);
  const item = brut(xml, 'Item') || '';
  const vente = brut(item, 'SellingStatus') || '';
  const qte = parseInt(valeur(item, 'Quantity') || '0', 10) || 0;
  const vendus = parseInt(valeur(vente, 'QuantitySold') || '0', 10) || 0;
  const cat = brut(item, 'PrimaryCategory') || '';
  const images = blocs(brut(item, 'PictureDetails') || '', 'PictureURL').map(decoder).map((u) => u.trim()).filter((u) => /^https:\/\//i.test(u));
  return {
    id,
    titre: valeur(item, 'Title') || 'Annonce eBay',
    description: texteDescription(decoder(brut(item, 'Description') || '')),
    prix: parseFloat(valeur(vente, 'CurrentPrice')) || 0,
    stock: Math.max(qte - vendus, 0),
    sku: (valeur(item, 'SKU') || '').slice(0, 60) || null,
    categorieId: valeur(cat, 'CategoryID'),
    categorieNom: valeur(cat, 'CategoryName'),
    images,
    poids: poidsKg(brut(item, 'ShippingPackageDetails') || ''),
    variations: brut(item, 'Variations') !== null,
  };
}

// ─── Photos : copiées chez nous, au même endroit que les photos envoyées par le gestionnaire (studio/boutique/<id>/) ──
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
  if (u.protocol !== 'https:' || !/(^|\.)ebayimg\.com$/i.test(u.hostname)) return null;   // seules les images hébergées par eBay sont téléchargées
  const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return null;
    const ext = extension(buf); if (!ext) return null;
    const cle = `studio/boutique/${gid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    await clientS3().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buf, ContentType: MIMES[ext] }));
    return `${MEDIA_URL}/${cle}`;
  } catch (e) { return null; }
  finally { clearTimeout(delai); }
}
const haute = (u) => u.replace(/s-l\d+\.(jpg|png|webp)$/i, 's-l1600.$1');

// ─── Catégories : association faite par le gestionnaire (rien n'est créé automatiquement) ──
const cleCategorie = (id, nom) => String(id || nom || 'inconnue').slice(0, 200);

// Mémorise la catégorie eBay (une seule fois) et retourne la catégorie de la boutique associée, s'il y en a une
async function categorieAssociee(gid, d) {
  const cle = cleCategorie(d.categorieId, d.categorieNom);
  await pool.query(
    `INSERT INTO boutique_ebay_categories (gestionnaire_id, cle, ebay_nom, ebay_id) VALUES ($1,$2,$3,$4) ON CONFLICT (gestionnaire_id, cle) DO NOTHING`,
    [gid, cle, String(d.categorieNom || 'Sans catégorie eBay').slice(0, 300), d.categorieId || null]);
  const r = (await pool.query(
    `SELECT c.id, c.nom FROM boutique_ebay_categories e JOIN studio_categories c ON c.id = e.categorie_id AND c.gestionnaire_id = $1 AND c.active = true
      WHERE e.gestionnaire_id = $1 AND e.cle = $2`, [gid, cle])).rows[0];
  return { cle, id: r ? r.id : null, nom: r ? r.nom : null };
}

// Liste pour la page : catégories eBay trouvées, nombre d'annonces, choix actuel, suggestion (SEULEMENT si une catégorie du même nom existe déjà chez lui)
async function listerCategories(gid) {
  const lignes = (await pool.query(
    `SELECT e.cle, e.ebay_nom, e.ebay_id, e.categorie_id,
            (SELECT COUNT(*)::int FROM boutique_ebay_annonces a WHERE a.gestionnaire_id = e.gestionnaire_id AND a.ebay_categorie_cle = e.cle) AS nb
       FROM boutique_ebay_categories e WHERE e.gestionnaire_id = $1 ORDER BY nb DESC, e.ebay_nom`, [gid])).rows;
  const mes = (await pool.query('SELECT id, nom FROM studio_categories WHERE gestionnaire_id = $1 AND active = true ORDER BY LOWER(nom)', [gid])).rows;
  const parNom = new Map(mes.map((c) => [String(c.nom).toLowerCase(), c.id]));
  const out = [];
  for (const l of lignes) {
    let m = null;
    if (l.ebay_id) m = (await pool.query('SELECT categorie_nom FROM ebay_map_precis WHERE ebay_category_id = $1', [l.ebay_id])).rows[0];
    const seg = String(l.ebay_nom || '').split(':').map((s) => s.trim()).filter(Boolean);
    if (!m && seg.length >= 2) m = (await pool.query('SELECT categorie_nom FROM ebay_map_niveau2 WHERE ebay_chemin = $1', [`${seg[0]}:${seg[1]}`])).rows[0];
    if (!m && seg.length >= 1) m = (await pool.query('SELECT categorie_nom FROM ebay_map_racine WHERE ebay_racine = $1', [seg[0]])).rows[0];
    const sugNom = m ? m.categorie_nom : null;
    out.push({ cle: l.cle, ebay_nom: l.ebay_nom, nb: l.nb, categorie_id: l.categorie_id, suggestion_id: sugNom && parNom.has(sugNom.toLowerCase()) ? parNom.get(sugNom.toLowerCase()) : null });
  }
  return { categories_ebay: out, mes_categories: mes };
}

// associations : [{ cle, categorie_id|null }]. Les produits déjà importés reçoivent la catégorie, SAUF ceux que le gestionnaire a changés lui-même.
async function associerCategories(gid, associations) {
  if (!Array.isArray(associations) || associations.length === 0 || associations.length > 500) throw new svc.ErreurEbay('Associations invalides.', 400);
  const mes = new Map((await pool.query('SELECT id, nom FROM studio_categories WHERE gestionnaire_id = $1 AND active = true', [gid])).rows.map((c) => [c.id, c.nom]));
  let produitsMisAJour = 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const a of associations) {
      const cle = a && typeof a.cle === 'string' ? a.cle : '';
      const nouv = a && a.categorie_id !== null && a.categorie_id !== undefined && a.categorie_id !== '' ? parseInt(a.categorie_id, 10) : null;
      if (nouv !== null && (!Number.isInteger(nouv) || !mes.has(nouv))) throw new svc.ErreurEbay('Catégorie invalide.', 400);
      const ex = (await client.query('SELECT categorie_id FROM boutique_ebay_categories WHERE gestionnaire_id = $1 AND cle = $2 FOR UPDATE', [gid, cle])).rows[0];
      if (!ex) throw new svc.ErreurEbay('Catégorie eBay inconnue.', 400);
      if ((ex.categorie_id || null) === nouv) continue;
      await client.query('UPDATE boutique_ebay_categories SET categorie_id = $3 WHERE gestionnaire_id = $1 AND cle = $2', [gid, cle, nouv]);
      const r = await client.query(
        `UPDATE produits p SET categorie_id = $4, categorie = $5, updated_at = NOW()
          WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.categorie_id IS NOT DISTINCT FROM $3::int
            AND p.id IN (SELECT produit_id FROM boutique_ebay_annonces WHERE gestionnaire_id = $1 AND ebay_categorie_cle = $2)`,
        [gid, cle, ex.categorie_id || null, nouv, nouv === null ? null : mes.get(nouv)]);
      produitsMisAJour += r.rowCount;
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
  return { ok: true, produits_mis_a_jour: produitsMisAJour };
}

// ─── Importer UNE annonce ─────────────────────────────────────────────────────
// retourne 'importe' | 'ignore' (déjà là) | 'brouillon' (importée mais à vérifier)
async function importerUne(job, env, jeton, id, ctx) {
  const gid = job.gestionnaire_id;
  const deja = await pool.query('SELECT 1 FROM boutique_ebay_annonces WHERE gestionnaire_id = $1 AND ebay_item_id = $2', [gid, id]);
  if (deja.rows.length) return 'ignore';

  await reserver(gid, 'GetItem', 1, LIMITE_GETITEM_JOUR);
  let d;
  try { d = await detailsAnnonce(env, jeton, id); }
  catch (e) { if (e.quota) await signalerQuota(gid); throw e; }

  const photos = [];
  for (const u of d.images.slice(0, 8)) { const p = await copierPhoto(gid, haute(u)); if (p) photos.push(p); }
  const cat = await categorieAssociee(gid, d);

  // Un prix inférieur au minimum de la boutique (0,01 $) met l'annonce en brouillon plutôt que de la perdre
  let statut = 'actif';
  if (!(d.prix >= 0.01)) { statut = 'brouillon'; ctx.avertissements.add('Des annonces sans prix valide ont été importées en brouillon : complétez leur prix avant de les activer.'); }
  if (d.variations) ctx.avertissements.add('Certaines annonces ont des variations eBay : elles sont importées comme une seule annonce (variations non reprises).');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = await client.query(
      `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, stock, sku, categorie, categorie_id,
                             photo_principale, photos, variantes, statut, poids, ebay_item_id, ebay_synced_at)
       VALUES ($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,'[]',$11,$12,$13,NOW()) RETURNING id`,
      [gid, d.titre.slice(0, 150), d.description, d.prix >= 0.01 ? d.prix : 0.01, d.stock, d.sku, cat.nom, cat.id, photos[0] || null, JSON.stringify(photos), statut, d.poids, id]);
    const ins = await client.query(
      `INSERT INTO boutique_ebay_annonces (gestionnaire_id, ebay_item_id, produit_id, ebay_categorie_cle) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING 1`,
      [gid, id, p.rows[0].id, cat.cle]);
    if (!ins.rowCount) { await client.query('ROLLBACK'); return 'ignore'; }
    await client.query('DELETE FROM boutique_ebay_nouvelles WHERE gestionnaire_id = $1 AND ebay_item_id = $2', [gid, id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
  return statut === 'brouillon' ? 'brouillon' : 'importe';
}

// ─── Travaux ──────────────────────────────────────────────────────────────────
async function creerImport(gid) {
  await svc.exigerAddon(gid);
  const c = await svc.etatConnexion(gid);
  if (!c.connexion) throw new svc.ErreurEbay("Connectez d'abord votre compte eBay.", 409);
  if (c.connexion.statut !== 'connecte') throw new svc.ErreurEbay("Reconnectez votre compte eBay avant d'importer.", 409);
  const actifs = `statut IN ('en_attente','en_cours','pause')`;
  const dej = await pool.query(`SELECT id FROM boutique_ebay_jobs WHERE gestionnaire_id = $1 AND type = 'import' AND ${actifs}`, [gid]);
  if (dej.rows.length) return { id: dej.rows[0].id, dejaEnCours: true };
  try {
    const r = await pool.query(`INSERT INTO boutique_ebay_jobs (gestionnaire_id, type) VALUES ($1,'import') RETURNING id`, [gid]);
    return { id: r.rows[0].id, dejaEnCours: false };
  } catch (e) {
    if (e.code === '23505') { const x = await pool.query(`SELECT id FROM boutique_ebay_jobs WHERE gestionnaire_id = $1 AND type = 'import' AND ${actifs}`, [gid]); return { id: x.rows[0].id, dejaEnCours: true }; }
    throw e;
  }
}

async function terminer(id, statut, message) {
  await pool.query(`UPDATE boutique_ebay_jobs SET statut = $2, message = $3, fini_le = NOW(), maj_le = NOW(), verrou_jusqua = NULL WHERE id = $1`, [id, statut, message || null]);
}

// Traite une tranche (≈40 s) d'un travail déjà verrouillé. Rend la main entre deux tranches.
async function traiterTranche(job) {
  const gid = job.gestionnaire_id;
  const debut = Date.now();
  const ctx = { avertissements: new Set() };
  try {
    if (!(await svc.autorise(gid))) return terminer(job.id, 'erreur', "L'option « Connecteur eBay » n'est plus activée.");
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) return terminer(job.id, 'erreur', "La configuration eBay n'est pas terminée.");
    const jeton = await svc.obtenirJeton(gid);
    let page = job.page_reprise || 1;
    let { traites, importes, ignores, erreurs } = job;
    let departFait = false;

    while (true) {
      await reserver(gid, 'GetMyeBaySelling', 1, LIMITE_APPELS_PAGE_JOUR);
      const p = await pageAnnonces(cfg.env, jeton, page);

      if (page === 1 && !job.total) {
        // Tout ou rien : on vérifie la place AVANT d'importer quoi que ce soit
        const e = await L.etat(gid);
        const dejaLies = +(await pool.query('SELECT COUNT(*)::int AS n FROM boutique_ebay_annonces WHERE gestionnaire_id = $1', [gid])).rows[0].n;
        const aAjouter = Math.max(p.total - dejaLies, 0);
        if (e.limite !== null) {
          const restant = Math.max(e.limite - (await L.compter(gid)), 0);
          if (aAjouter > restant) {
            return terminer(job.id, 'erreur', `Import bloqué : vous avez ${aAjouter} annonce${aAjouter > 1 ? 's' : ''} à importer depuis eBay, mais votre palier ne permet plus que ${restant} annonce${restant > 1 ? 's' : ''} active${restant > 1 ? 's' : ''} (limite : ${e.limite}). Aucune annonce n'a été importée. Passez à un palier supérieur dans « Mon plan & limites » ou désactivez des annonces, puis relancez l'import.`);
          }
        }
        await pool.query('UPDATE boutique_ebay_jobs SET total = $2 WHERE id = $1', [job.id, p.total]);
        job.total = p.total;
      }

      let i = (page === (job.page_reprise || 1) && !departFait) ? (job.index_reprise || 0) : 0;
      departFait = true;
      for (; i < p.ids.length; i++) {
        const id = p.ids[i];
        try {
          const res = await importerUne(job, cfg.env, jeton, id, ctx);
          if (res === 'ignore') ignores++; else importes++;
        } catch (e) {
          if (e.quota || e.code === 'reconnexion') throw e;
          erreurs++;
          console.warn(`[boutique-ebay-import] annonce ${id} :`, e.message);
        }
        traites++;
        if ((traites % 5) === 0) await pool.query(`UPDATE boutique_ebay_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, maj_le=NOW(), verrou_jusqua = NOW() + interval '3 minutes' WHERE id=$1`, [job.id, traites, importes, ignores, erreurs]);
        if (Date.now() - debut > DUREE_TRANCHE_MS && i < p.ids.length - 1) {
          await pool.query(`UPDATE boutique_ebay_jobs SET statut='en_attente', page_reprise=$2, index_reprise=$7, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, page, traites, importes, ignores, erreurs, i + 1]);
          return;
        }
      }
      if (page >= p.pages) break;
      page++;
      await pool.query('UPDATE boutique_ebay_jobs SET page_reprise=$2, index_reprise=0, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW() WHERE id=$1', [job.id, page, traites, importes, ignores, erreurs]);
      if (Date.now() - debut > DUREE_TRANCHE_MS) {
        await pool.query(`UPDATE boutique_ebay_jobs SET statut='en_attente', index_reprise=0, verrou_jusqua=NULL WHERE id=$1`, [job.id]);
        return;
      }
    }
    await pool.query(`UPDATE boutique_ebay_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5 WHERE id=$1`, [job.id, traites, importes, ignores, erreurs]);
    await pool.query(`UPDATE boutique_ebay_connexion SET dernier_suivi = COALESCE(dernier_suivi, $2), prochain_suivi = NOW() + interval '60 minutes', calmes = 0 WHERE gestionnaire_id = $1`, [gid, job.cree_le]);
    return terminer(job.id, 'termine', [...ctx.avertissements].join(' ') || null);
  } catch (e) {
    if (e.quota) {
      const reprise = await prochaineRemise();
      await pool.query(`UPDATE boutique_ebay_jobs SET statut='pause', reprise_a=$2, message=$3, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
        [job.id, reprise, "Pause : la limite quotidienne d'appels eBay est atteinte. L'import reprend automatiquement après la remise à zéro d'eBay."]);
      return;
    }
    if (e.code === 'reconnexion') return terminer(job.id, 'erreur', 'Reconnexion eBay requise : reconnectez votre compte puis relancez.');
    if (e instanceof svc.ErreurEbay && e.status === 502) {
      await pool.query(`UPDATE boutique_ebay_jobs SET statut='pause', reprise_a = NOW() + interval '5 minutes', message=$2, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, "eBay est injoignable pour l'instant : nouvel essai dans quelques minutes."]);
      return;
    }
    console.error('[boutique-ebay-import] travail', job.id, e.message);
    return terminer(job.id, 'erreur', `Erreur pendant l'import : ${String(e.message).slice(0, 300)}`);
  }
}

// Prend UN travail prêt (ou dont le verrou a expiré après un plantage) et traite une tranche
async function prochainTravail() {
  const r = await pool.query(
    `UPDATE boutique_ebay_jobs SET statut='en_cours', verrou_jusqua = NOW() + interval '3 minutes', maj_le = NOW(), reprise_a = NULL
      WHERE id = (SELECT id FROM boutique_ebay_jobs
                   WHERE (statut = 'en_attente') OR (statut = 'pause' AND reprise_a <= NOW()) OR (statut = 'en_cours' AND verrou_jusqua < NOW())
                   ORDER BY cree_le LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING *`);
  if (!r.rows[0]) return false;
  await traiterTranche(r.rows[0]);
  return true;
}

let timer = null, occupe = false;
function demarrer() {
  if (timer || process.env.EBAY_WORKER_DESACTIVE === '1') return;
  timer = setInterval(async () => {
    if (occupe) return; occupe = true;
    try {
      while (await prochainTravail()) { /* enchaîne tant qu'il y a du travail */ }
      const suivi = require('./boutique_ebay_suivi');
      for (let i = 0; i < 5 && await suivi.prochainSuivi().catch((e) => { console.warn('[boutique-ebay-suivi]', e.message); return false; }); i++) { /* quelques suivis par minute */ }
    } catch (e) { console.error('[boutique-ebay-import] worker', e.message); }
    finally { occupe = false; }
  }, 20000);
  if (timer.unref) timer.unref();
}

async function etatImport(gid) {
  const r = await pool.query(`SELECT id, statut, total, traites, importes, ignores, erreurs, message, reprise_a, cree_le, fini_le FROM boutique_ebay_jobs WHERE gestionnaire_id = $1 AND type='import' ORDER BY cree_le DESC LIMIT 1`, [gid]);
  return r.rows[0] || null;
}

module.exports = {
  trading, reserver, creerImport, etatImport, demarrer, prochainTravail, pageAnnonces, detailsAnnonce, texteDescription,
  brut, valeur, blocs, QuotaEbay, listerCategories, associerCategories,
};