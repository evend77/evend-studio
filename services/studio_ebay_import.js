// CHEMIN : services/studio_ebay_import.js
// e-Vend Studio — Connecteur eBay, import des annonces d'un collaborateur dans ses produits Studio.
// Adapté de routes/ebaySync.js (e-Vend) : API Trading (GetMyeBaySelling + GetItem), mapping de catégories à 3 niveaux,
// photos copiées sur notre stockage. Différences : file de travaux dans la BASE (pas de Redis), appels comptés PAR GESTIONNAIRE
// (chaque marketplace a ses propres clés eBay donc sa propre limite), catégories créées chez le gestionnaire seulement au besoin.

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const svc = require('./studio_ebay');
const regles = require('./studio_regles_produits');
const cfgMV = require('./studio_config_mv');

const COMPAT = '1191';
const SITE_ID = '2'; // Canada, comme e-Vend
const MEDIA_URL = 'https://media.e-vend.ca';
const FUSEAU_REMISE = 'America/Los_Angeles';
const LIMITE_GETITEM_JOUR = parseInt(process.env.EBAY_GETITEM_LIMITE_JOUR || '4500', 10);
const LIMITE_APPELS_PAGE_JOUR = 500;
const MAX_PRODUITS_COLLAB = 1000;
const CATEGORIE_DEFAUT = 'Autre / Divers / Général';
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
// Contenu brut de la 1re balise <nom ...>…</nom> (null si absente)
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
    const erreurs = blocs(xml, 'Errors');
    const e0 = erreurs[0] || '';
    const code = valeur(e0, 'ErrorCode');
    const msg = valeur(e0, 'LongMessage') || valeur(e0, 'ShortMessage') || `Erreur eBay ${appel}`;
    if (code === '518' || /usage limit|call limit/i.test(msg)) throw new QuotaEbay(msg);
    if (code === '931' || code === '932' || /auth token|hard expired|invalid.*token/i.test(msg)) throw new svc.ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
    const err = new Error(msg); err.ebayCode = code; throw err;
  }
  return xml;
}

// ─── Budget d'appels (par gestionnaire) ───────────────────────────────────────
async function reserver(gid, appel, n, plafond) {
  await pool.query(`INSERT INTO ebay_budget (gestionnaire_id, jour, appel, nb) VALUES ($1, ${SQL_JOUR}, $2, 0) ON CONFLICT DO NOTHING`, [gid, appel]);
  const r = await pool.query(
    `UPDATE ebay_budget SET nb = nb + $3 WHERE gestionnaire_id = $1 AND jour = ${SQL_JOUR} AND appel = $2 AND nb + $3 <= $4 RETURNING nb`,
    [gid, appel, n, plafond]);
  if (!r.rows.length) throw new QuotaEbay(`Limite quotidienne atteinte (${appel})`);
}
async function signalerQuota(gid) {
  await pool.query(
    `INSERT INTO ebay_budget (gestionnaire_id, jour, appel, nb) VALUES ($1, ${SQL_JOUR}, 'GetItem', $2)
     ON CONFLICT (gestionnaire_id, jour, appel) DO UPDATE SET nb = GREATEST(ebay_budget.nb, $2)`, [gid, LIMITE_GETITEM_JOUR]);
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
  t = sanitizeHtml(t, { allowedTags: [], allowedAttributes: {} });
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

// ─── Catégories : mapping 3 niveaux, création chez le gestionnaire au besoin ──
async function categorieStudio(gid, ebayId, ebayNom) {
  let m = null;
  if (ebayId) m = (await pool.query('SELECT categorie_nom, taxable FROM ebay_map_precis WHERE ebay_category_id = $1', [ebayId])).rows[0];
  const seg = String(ebayNom || '').split(':').map((s) => s.trim()).filter(Boolean);
  if (!m && seg.length >= 2) m = (await pool.query('SELECT categorie_nom, taxable FROM ebay_map_niveau2 WHERE ebay_chemin = $1', [`${seg[0]}:${seg[1]}`])).rows[0];
  if (!m && seg.length >= 1) m = (await pool.query('SELECT categorie_nom, taxable FROM ebay_map_racine WHERE ebay_racine = $1', [seg[0]])).rows[0];
  const nom = (m ? m.categorie_nom : CATEGORIE_DEFAUT).slice(0, 100);
  const taxable = m ? m.taxable : true;
  // Trouver ou créer chez CE gestionnaire (nom unique sans tenir compte des majuscules)
  const ex = await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, nom]);
  if (ex.rows[0]) return { id: ex.rows[0].id, nom };
  const cree = await pool.query(
    `INSERT INTO studio_categories (gestionnaire_id, nom, taxable, active) VALUES ($1,$2,$3,true) ON CONFLICT (gestionnaire_id, LOWER(nom)) DO NOTHING RETURNING id`, [gid, nom, taxable]);
  if (cree.rows[0]) return { id: cree.rows[0].id, nom };
  return { id: (await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, nom])).rows[0].id, nom };
}

// ─── Photos : copiées chez nous (survivent à la fermeture du compte eBay) ──────
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
  // Seules les images hébergées par eBay sont téléchargées
  let u; try { u = new URL(url); } catch (e) { return null; }
  if (u.protocol !== 'https:' || !/(^|\.)ebayimg\.com$/i.test(u.hostname)) return null;
  const ctrl = new AbortController(); const delai = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return null;
    const ext = extension(buf); if (!ext) return null;
    const cle = `studio/collab/${gid}/${cid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    await clientS3().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buf, ContentType: MIMES[ext] }));
    return `${MEDIA_URL}/${cle}`;
  } catch (e) { return null; }
  finally { clearTimeout(delai); }
}
const haute = (u) => u.replace(/s-l\d+\.(jpg|png|webp)$/i, 's-l1600.$1');

// ─── Importer UNE annonce ─────────────────────────────────────────────────────
// retourne 'importe' | 'ignore' (déjà là) | 'brouillon' (importée mais à vérifier)
async function importerUne(job, env, jeton, id, ctx) {
  const gid = job.gestionnaire_id, cid = job.collaborateur_id;
  const deja = await pool.query('SELECT 1 FROM produits WHERE collaborateur_id = $1 AND ebay_item_id = $2', [cid, id]);
  if (deja.rows.length) return 'ignore';

  await reserver(gid, 'GetItem', 1, LIMITE_GETITEM_JOUR);
  let d;
  try { d = await detailsAnnonce(env, jeton, id); }
  catch (e) { if (e.quota) await signalerQuota(gid); throw e; }

  const photos = [];
  for (const u of d.images.slice(0, 8)) { const p = await copierPhoto(gid, cid, haute(u)); if (p) photos.push(p); }

  let categorie = { id: null, nom: null };
  if (ctx.categories) categorie = await categorieStudio(gid, d.categorieId, d.categorieNom);

  // Respect des règles du gestionnaire : un prix refusé met l'annonce en brouillon plutôt que de la perdre
  let statut = regles.statutPublication(ctx.regles, null, 'actif');
  let note = null;
  const ep = regles.erreurPrix(ctx.regles, d.prix, d.titre);
  if (ep) { statut = 'brouillon'; note = ep; }
  const stock = ctx.regles.gererStock ? d.stock : null;
  const titre = d.titre.slice(0, 150);

  await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids, ebay_item_id, ebay_synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'[]',$12,$13,$14,NOW())
     ON CONFLICT (collaborateur_id, ebay_item_id) WHERE ebay_item_id IS NOT NULL DO NOTHING`,
    [gid, cid, titre, d.description, d.prix, stock, d.sku, categorie.nom, categorie.id, photos[0] || null, JSON.stringify(photos), statut, d.poids, id]);
  try { await pool.query('DELETE FROM ebay_nouvelles WHERE collaborateur_id = $1 AND ebay_item_id = $2', [cid, id]); } catch (e) { /* table du suivi pas encore installée */ }
  if (d.variations) ctx.avertissements.add('Certaines annonces ont des variations eBay : elles sont importées comme une seule annonce (variations non reprises).');
  if (note) ctx.avertissements.add(note);
  return statut === 'brouillon' ? 'brouillon' : 'importe';
}

// ─── Travaux ──────────────────────────────────────────────────────────────────
async function creerImport(gid, cid) {
  const dej = await pool.query(`SELECT id FROM ebay_jobs WHERE collaborateur_id = $1 AND type = 'import' AND statut IN ('en_attente','en_cours','pause')`, [cid]);
  if (dej.rows.length) return { id: dej.rows[0].id, dejaEnCours: true };
  try {
    const r = await pool.query(`INSERT INTO ebay_jobs (gestionnaire_id, collaborateur_id, type) VALUES ($1,$2,'import') RETURNING id`, [gid, cid]);
    return { id: r.rows[0].id, dejaEnCours: false };
  } catch (e) {
    if (e.code === '23505') { const x = await pool.query(`SELECT id FROM ebay_jobs WHERE collaborateur_id = $1 AND type = 'import' AND statut IN ('en_attente','en_cours','pause')`, [cid]); return { id: x.rows[0].id, dejaEnCours: true }; }
    throw e;
  }
}

async function terminer(id, statut, message, extra) {
  await pool.query(`UPDATE ebay_jobs SET statut = $2, message = $3, fini_le = NOW(), maj_le = NOW(), verrou_jusqua = NULL WHERE id = $1`, [id, statut, message || null]);
}

// Place disponible dans la boutique du collaborateur
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

// Traite une tranche (≈40 s) d'un travail déjà verrouillé. Rend la main entre deux tranches.
async function traiterTranche(job) {
  const gid = job.gestionnaire_id, cid = job.collaborateur_id;
  const debut = Date.now();
  const ctx = { regles: await regles.lire(gid, pool), categories: cfgMV.actif(await cfgMV.lire(gid, pool), 'permettre_categories', true), avertissements: new Set() };
  try {
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) return terminer(job.id, 'erreur', "Le gestionnaire n'a pas terminé la configuration eBay.");
    const jeton = await svc.obtenirJeton(cid);
    let page = job.page_reprise || 1;
    let { traites, importes, ignores, erreurs } = job;
    let departFait = false;

    while (true) {
      await reserver(gid, 'GetMyeBaySelling', 1, LIMITE_APPELS_PAGE_JOUR);
      const p = await pageAnnonces(cfg.env, jeton, page);

      if (page === 1 && !job.total) {
        // Tout ou rien : on vérifie la place AVANT d'importer quoi que ce soit
        const place = await placeRestante(gid, cid);
        const dejaLies = +(await pool.query('SELECT COUNT(*)::int AS n FROM produits WHERE collaborateur_id = $1 AND ebay_item_id IS NOT NULL', [cid])).rows[0].n;
        const aAjouter = Math.max(p.total - dejaLies, 0);
        if (aAjouter > place.restant) {
          return terminer(job.id, 'erreur', `Limite atteinte : vous avez ${p.total} annonces sur eBay (${aAjouter} à ajouter) mais il ne reste de la place que pour ${place.restant} annonce(s) (maximum ${place.max}). Supprimez des annonces ou contactez le gestionnaire.`);
        }
        await pool.query('UPDATE ebay_jobs SET total = $2 WHERE id = $1', [job.id, p.total]);
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
          console.warn(`[ebay-import] annonce ${id} :`, e.message);
        }
        traites++;
        if ((traites % 5) === 0) await pool.query('UPDATE ebay_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, maj_le=NOW(), verrou_jusqua = NOW() + interval \'3 minutes\' WHERE id=$1', [job.id, traites, importes, ignores, erreurs]);
        if (Date.now() - debut > DUREE_TRANCHE_MS && i < p.ids.length - 1) {
          // On sort en milieu de page : la prochaine tranche relit la même page, les annonces déjà faites sont sautées sans appel
          await pool.query(`UPDATE ebay_jobs SET statut='en_attente', page_reprise=$2, index_reprise=$7, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, page, traites, importes, ignores, erreurs, i + 1]);
          return;
        }
      }
      if (page >= p.pages) break;
      page++;
      await pool.query('UPDATE ebay_jobs SET page_reprise=$2, index_reprise=0, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW() WHERE id=$1', [job.id, page, traites, importes, ignores, erreurs]);
      if (Date.now() - debut > DUREE_TRANCHE_MS) {
        await pool.query(`UPDATE ebay_jobs SET statut='en_attente', index_reprise=0, verrou_jusqua=NULL WHERE id=$1`, [job.id]);
        return;
      }
    }
    const av = [...ctx.avertissements].join(' ');
    await pool.query(`UPDATE ebay_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5 WHERE id=$1`, [job.id, traites, importes, ignores, erreurs]);
    try { await pool.query(`UPDATE ebay_connexions SET dernier_suivi = COALESCE(dernier_suivi, $2), prochain_suivi = NOW() + interval '60 minutes', calmes = 0 WHERE collaborateur_id = $1`, [cid, job.cree_le]); } catch (e) { /* suivi pas encore installé */ }
    return terminer(job.id, 'termine', av || null);
  } catch (e) {
    if (e.quota) {
      const reprise = await prochaineRemise();
      await pool.query(`UPDATE ebay_jobs SET statut='pause', reprise_a=$2, message=$3, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`,
        [job.id, reprise, "Pause : la limite quotidienne d'appels eBay est atteinte. L'import reprend automatiquement après la remise à zéro d'eBay."]);
      return;
    }
    if (e.code === 'reconnexion') return terminer(job.id, 'erreur', 'Reconnexion eBay requise : reconnectez votre compte puis relancez.');
    if (e instanceof svc.ErreurEbay && e.status === 502) {
      // Panne passagère : on réessaie dans quelques minutes
      await pool.query(`UPDATE ebay_jobs SET statut='pause', reprise_a = NOW() + interval '5 minutes', message=$2, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, "eBay est injoignable pour l'instant : nouvel essai dans quelques minutes."]);
      return;
    }
    console.error('[ebay-import] travail', job.id, e.message);
    return terminer(job.id, 'erreur', `Erreur pendant l'import : ${String(e.message).slice(0, 300)}`);
  }
}

// Prend UN travail prêt (ou dont le verrou a expiré après un plantage) et traite une tranche
async function prochainTravail() {
  const r = await pool.query(
    `UPDATE ebay_jobs SET statut='en_cours', verrou_jusqua = NOW() + interval '3 minutes', maj_le = NOW(), reprise_a = NULL
      WHERE id = (SELECT id FROM ebay_jobs
                   WHERE (statut = 'en_attente')
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
  if (timer || process.env.EBAY_WORKER_DESACTIVE === '1') return;
  timer = setInterval(async () => {
    if (occupe) return; occupe = true;
    try {
      while (await prochainTravail()) { /* enchaîne tant qu'il y a du travail */ }
      let suivi = null; try { suivi = require('./studio_ebay_suivi'); } catch (e) { /* absent */ }
      for (let i = 0; suivi && i < 5 && await suivi.prochainSuivi().catch((e) => { console.warn('[ebay-suivi]', e.message); return false; }); i++) { /* quelques suivis par minute */ }
    }
    catch (e) { console.error('[ebay-import] worker', e.message); }
    finally { occupe = false; }
  }, 20000);
  if (timer.unref) timer.unref();
}

async function etatImport(cid, gid) {
  const r = await pool.query(`SELECT id, statut, total, traites, importes, ignores, erreurs, message, reprise_a, cree_le, fini_le FROM ebay_jobs WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND type='import' ORDER BY cree_le DESC LIMIT 1`, [cid, gid]);
  return r.rows[0] || null;
}

module.exports = { trading, reserver, creerImport, etatImport, demarrer, prochainTravail, pageAnnonces, detailsAnnonce, categorieStudio, texteDescription, brut, valeur, blocs, QuotaEbay };