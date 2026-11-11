// CHEMIN : services/studio_evend_import.js
// e-Vend Studio — Import des annonces e-Vend d'un collaborateur dans ses produits Studio (lecture seule : rien n'est modifié sur e-Vend).
// PHOTOS : celles de media.e-vend.ca gardent leur adresse (aucune copie). Celles hébergées ailleurs (eBay, Shopify, Etsy, Square… e-Vend synchronise
// plusieurs plateformes) sont COPIÉES sur le stockage de Studio, avec protections : HTTPS seulement, adresses privées/internes refusées (même après redirection),
// 5 Mo maximum, vrai format d'image vérifié.
// Même principe que l'import Etsy : file de travaux dans la BASE (pas de Redis), tranches de ≈40 s, tout ou rien sur la limite d'annonces.
// Les photos gardent LEUR ADRESSE e-Vend (media.e-vend.ca) : aucune copie. Catégories : même nom que chez le gestionnaire, sinon la catégorie choisie
// (par défaut « Autre / Divers / Général »).

'use strict';

const crypto = require('crypto');
const dns = require('dns');
const net = require('net');
const https = require('https');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../db');
const svc = require('./studio_evend');
const regles = require('./studio_regles_produits');
const cfgMV = require('./studio_config_mv');

const MAX_PRODUITS_COLLAB = 1000;
const CATEGORIE_DEFAUT = 'Autre / Divers / Général';
const DUREE_TRANCHE_MS = 40 * 1000;
const LOT = 50;
const PHOTO_RE = /^https:\/\/media\.e-vend\.ca\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|avif)$/i;   // même règle que la validation des photos d'annonce

// ─── Conversions (pures, testées) ─────────────────────────────────────────────
const nombre = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const normaliser = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Description e-Vend (HTML nettoyé) → texte simple avec sauts de ligne : sans danger, comme les descriptions écrites dans Studio.
function htmlEnTexte(h) {
  let s = String(h || '');
  s = s.replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|ul|ol|tr|blockquote)\s*>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ').replace(/<\/li\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#(\d{1,5});/g, (m, n) => { const c = parseInt(n, 10); return c > 31 && c < 65536 ? String.fromCharCode(c) : ' '; });
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return s.length > 5000 ? s.slice(0, 4997) + '…' : s;
}

// Annonce e-Vend → champs d'un produit Studio. ctx : { regles, categories, defaut, index }.
function convertir(l, ctx) {
  const avert = [];
  const titre = String(l.nom || 'Annonce e-Vend').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 150) || 'Annonce e-Vend';
  const prixEv = nombre(l.prix) || 0;
  const original = nombre(l.prix_original);
  // e-Vend : « prix » = prix actuel, « prix_original » = ancien prix barré. Studio : « prix » = prix normal, « prix promo » = prix réduit.
  let prix = prixEv, prixPromo = null;
  if (original !== null && original > prixEv && prixEv > 0) { prix = original; prixPromo = prixEv; }
  let hors = false;
  if (!(prix >= 0 && prix <= 1000000)) { prix = Math.min(Math.max(prix || 0, 0), 1000000); hors = true; }

  let statut = regles.statutPublication(ctx.regles, null, 'actif');
  const ep = hors ? 'Un prix hors limites a été corrigé : vérifiez vos prix.' : regles.erreurPrix(ctx.regles, prixPromo !== null ? prixPromo : prix, titre);
  if (ep) { statut = 'brouillon'; avert.push(ep); }

  const suivi = (l.suivi_inventaire || 'suivre') === 'suivre';
  const gerer = !!ctx.regles.gererStock && suivi;
  const stock = gerer ? Math.max(Math.trunc(nombre(l.stock) || 0), 0) : null;

  // Catégorie : même nom chez le gestionnaire (sans tenir compte des accents/majuscules), sinon celle choisie par défaut
  let cat = { id: null, nom: null }, sansCorrespondance = false;
  if (ctx.categories) {
    cat = ctx.defaut; sansCorrespondance = true;
    for (const n of (Array.isArray(l.categories) ? l.categories : [])) {
      const m = ctx.index.get(normaliser(n));
      if (m) { cat = m; sansCorrespondance = false; break; }
    }
  }

  const imgs = Array.isArray(l.images) ? l.images : [];
  const valides = imgs.filter((u) => typeof u === 'string' && u.length <= 2000 && /^https:\/\//i.test(u));
  const photosSrc = valides.slice(0, 8);   // adresses d'origine : copiées plus tard (importerUne) si elles ne viennent pas d'e-Vend
  if (imgs.length > valides.length && imgs.length <= 8) avert.push("Certaines photos avaient une adresse invalide (non sécurisée) : elles n'ont pas été reprises.");
  if (imgs.length > 8) avert.push('Seules les 8 premières photos de chaque annonce sont reprises.');

  const brutVar = Array.isArray(l.variantes) ? l.variantes : [];
  const variantes = [];
  const vus = new Set();
  for (const v of brutVar) {
    let nom = v && v.combinaison;
    if (nom && typeof nom === 'object') nom = Object.keys(nom).map((k) => nom[k]).filter((x) => x !== null && x !== undefined && String(x).trim() !== '').join(' / ');
    nom = String(nom || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 60);
    if (!nom || vus.has(nom.toLowerCase())) continue;
    vus.add(nom.toLowerCase());
    const pv = nombre(v.prix);
    variantes.push({
      nom,
      prix: pv === null || pv === prixEv || pv < 0 || pv > 1000000 ? null : pv,
      stock: gerer ? Math.max(Math.trunc(nombre(v.quantite) || 0), 0) : null,
    });
  }
  if (variantes.length > 20) { variantes.length = 20; avert.push("Certaines annonces ont plus de 20 variantes : seules les 20 premières sont reprises."); }

  let poids = nombre(l.poids);
  poids = poids !== null && poids >= 0 && poids <= 10000 ? Math.round(poids * 1000) / 1000 : null;
  const qm = nombre(l.quantite_minimum);
  const quantiteMin = ctx.regles.qteMinActive && qm !== null && qm > 1 && qm <= 9999 ? Math.trunc(qm) : null;
  const pr = nombre(l.prix_revient);
  const prixRevient = ctx.regles.prixRevient && pr !== null && pr >= 0 && pr <= 1000000 ? pr : null;

  return {
    titre, description: htmlEnTexte(l.description), prix, prixPromo, stock,
    sku: l.sku ? String(l.sku).slice(0, 60) : null,
    categorie: cat, sansCorrespondance, photosSrc, variantes, statut, poids, quantiteMin, prixRevient, avert,
  };
}

// ─── Photos ───────────────────────────────────────────────────────────────────
const MEDIA_URL = 'https://media.e-vend.ca';
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
let s3 = null;
const clientS3 = () => s3 || (s3 = new S3Client({
  region: 'auto', endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
}));

// Adresse interne/privée ? (protège le serveur contre les adresses piégées)
function ipPrivee(ip) {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x === '::' || x === '::1') return true;
    const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x);
    if (m) return ipPrivee(m[1]);
    return /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('ff');
  }
  return true;
}
// Résolution DNS vérifiée AU MOMENT de la connexion (impossible de la contourner par un changement d'adresse entre-temps)
function lookupSur(host, opts, cb) {
  dns.lookup(host, { all: true, family: 0 }, (err, liste) => {
    if (err) return cb(err);
    const ok = (liste || []).filter((a) => !ipPrivee(a.address));
    if (!ok.length || ok.length !== liste.length) return cb(new Error('adresse refusée'));
    if (opts && opts.all) return cb(null, ok);
    cb(null, ok[0].address, ok[0].family);
  });
}
function extension(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  return null;
}
// Télécharge une image (HTTPS seulement, 5 Mo max, 3 redirections max, chaque étape revérifiée)
function telecharger(url, restes = 3) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url); } catch (e) { return resolve(null); }
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return resolve(null);
    if (net.isIP(u.hostname.replace(/^\[|\]$/g, '')) && ipPrivee(u.hostname.replace(/^\[|\]$/g, ''))) return resolve(null);
    const req = https.get(u, { lookup: lookupSur, timeout: 15000, headers: { 'User-Agent': 'e-Vend-Studio-import', Accept: 'image/*' } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (restes <= 0) return resolve(null);
        let suite; try { suite = new URL(res.headers.location, u).toString(); } catch (e) { return resolve(null); }
        return resolve(telecharger(suite, restes - 1));
      }
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      const morceaux = []; let taille = 0;
      res.on('data', (c) => { taille += c.length; if (taille > 5 * 1024 * 1024) { req.destroy(); resolve(null); } else morceaux.push(c); });
      res.on('end', () => resolve(taille ? Buffer.concat(morceaux) : null));
      res.on('error', () => resolve(null));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}
const haute = (u) => u.replace(/(\/s-l)\d+(\.(?:jpg|png|webp))$/i, '$11600$2');   // eBay : version grande taille
async function copierPhoto(gid, cid, url) {
  const buf = await telecharger(/(^|\.)ebayimg\.com\//i.test(url) ? haute(url) : url);
  if (!buf) return null;
  const ext = extension(buf); if (!ext) return null;
  const cle = `studio/collab/${gid}/${cid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  try { await clientS3().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buf, ContentType: MIMES[ext] })); }
  catch (e) { return null; }
  return `${MEDIA_URL}/${cle}`;
}
const deps = { copier: copierPhoto };   // remplaçable dans les tests
// Photos d'une annonce : celles d'e-Vend gardées telles quelles, les autres copiées (4 à la fois)
async function resoudrePhotos(gid, cid, sources, ctx) {
  const sortie = new Array(sources.length).fill(null);
  for (let i = 0; i < sources.length; i += 4) {
    await Promise.all(sources.slice(i, i + 4).map(async (u, k) => {
      if (PHOTO_RE.test(u)) { sortie[i + k] = u; return; }
      const c = await deps.copier(gid, cid, u);
      if (c) { sortie[i + k] = c; ctx.photosCopiees++; } else ctx.photosEchec++;
    }));
  }
  return sortie.filter(Boolean);
}

// ─── Catégories ───────────────────────────────────────────────────────────────
async function categorieDefaut(gid) {
  const ex = await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, CATEGORIE_DEFAUT]);
  if (ex.rows[0]) return { id: ex.rows[0].id, nom: CATEGORIE_DEFAUT };
  const cree = await pool.query(
    `INSERT INTO studio_categories (gestionnaire_id, nom, taxable, active) VALUES ($1,$2,true,true) ON CONFLICT (gestionnaire_id, LOWER(nom)) DO NOTHING RETURNING id`, [gid, CATEGORIE_DEFAUT]);
  if (cree.rows[0]) return { id: cree.rows[0].id, nom: CATEGORIE_DEFAUT };
  return { id: (await pool.query('SELECT id FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [gid, CATEGORIE_DEFAUT])).rows[0].id, nom: CATEGORIE_DEFAUT };
}
async function categorieChoisie(gid, id) {
  if (!id) return null;
  const r = await pool.query('SELECT id, nom FROM studio_categories WHERE id = $1 AND gestionnaire_id = $2 AND active = true', [id, gid]);
  return r.rows[0] ? { id: r.rows[0].id, nom: r.rows[0].nom } : null;
}
async function indexCategories(gid) {
  const r = await pool.query('SELECT id, nom FROM studio_categories WHERE gestionnaire_id = $1 AND active = true', [gid]);
  const m = new Map();
  r.rows.forEach((c) => { const k = normaliser(c.nom); if (!m.has(k)) m.set(k, { id: c.id, nom: c.nom }); });
  return m;
}

// ─── Importer UNE annonce ─────────────────────────────────────────────────────
// retourne 'importe' | 'ignore' (déjà là) | 'brouillon' (importée mais à vérifier)
async function importerUne(job, l, ctx) {
  const gid = job.gestionnaire_id, cid = job.collaborateur_id;
  const id = String(l.id);
  const deja = await pool.query('SELECT id, photo_principale FROM produits WHERE collaborateur_id = $1 AND evend_produit_id = $2', [cid, id]);
  if (deja.rows.length) {
    // Déjà importée : si elle n'a aucune photo (import précédent), on la complète
    if (!deja.rows[0].photo_principale) {
      const ph = await resoudrePhotos(gid, cid, convertir(l, ctx).photosSrc, ctx);
      if (ph.length) { await pool.query('UPDATE produits SET photo_principale = $2, photos = $3 WHERE id = $1 AND photo_principale IS NULL', [deja.rows[0].id, ph[0], JSON.stringify(ph)]); ctx.completees++; }
    }
    return 'ignore';
  }
  const p = convertir(l, ctx);
  p.photos = await resoudrePhotos(gid, cid, p.photosSrc, ctx);
  await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids, quantite_min, prix_revient, evend_produit_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (collaborateur_id, evend_produit_id) WHERE evend_produit_id IS NOT NULL DO NOTHING`,
    [gid, cid, p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku, p.categorie.nom, p.categorie.id,
      p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, p.poids, p.quantiteMin, p.prixRevient, id]);
  p.avert.forEach((a) => ctx.avertissements.add(a));
  if (p.sansCorrespondance) ctx.sansCorrespondance++;
  return p.statut === 'brouillon' ? 'brouillon' : 'importe';
}

// ─── Travaux ──────────────────────────────────────────────────────────────────
const ACTIFS = `statut IN ('en_attente','en_cours','pause')`;
async function creerImport(gid, cid, categorieDefautId) {
  const choisie = categorieDefautId ? await categorieChoisie(gid, parseInt(categorieDefautId, 10)) : null;
  if (categorieDefautId && !choisie) { const e = new Error('Catégorie invalide'); e.status = 400; throw e; }
  const dej = await pool.query(`SELECT id FROM evend_jobs WHERE collaborateur_id = $1 AND ${ACTIFS}`, [cid]);
  if (dej.rows.length) return { id: dej.rows[0].id, dejaEnCours: true };
  try {
    const r = await pool.query(`INSERT INTO evend_jobs (gestionnaire_id, collaborateur_id, categorie_defaut_id) VALUES ($1,$2,$3) RETURNING id`, [gid, cid, choisie ? choisie.id : null]);
    return { id: r.rows[0].id, dejaEnCours: false };
  } catch (e) {
    if (e.code === '23505') { const x = await pool.query(`SELECT id FROM evend_jobs WHERE collaborateur_id = $1 AND ${ACTIFS}`, [cid]); return { id: x.rows[0].id, dejaEnCours: true }; }
    throw e;
  }
}
async function terminer(id, statut, message) {
  await pool.query(`UPDATE evend_jobs SET statut = $2, message = $3, fini_le = NOW(), maj_le = NOW(), verrou_jusqua = NULL WHERE id = $1`, [id, statut, message || null]);
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
  try {
    const jeton = await svc.jetonDe(gid, cid);
    if (!jeton) return terminer(job.id, 'erreur', 'Votre accès à e-Vend a expiré : reconnectez-vous, puis relancez l\'import.');
    const co = (await pool.query('SELECT importables FROM evend_connexions WHERE collaborateur_id = $1', [cid])).rows[0];
    const rg = await regles.lire(gid, pool);
    const categories = cfgMV.actif(await cfgMV.lire(gid, pool), 'permettre_categories', true);
    const ctx = { regles: rg, categories, defaut: null, index: null, avertissements: new Set(), sansCorrespondance: 0, photosCopiees: 0, photosEchec: 0, completees: 0 };
    if (categories) {
      ctx.defaut = (await categorieChoisie(gid, job.categorie_defaut_id)) || (await categorieDefaut(gid));
      ctx.index = await indexCategories(gid);
    }
    let { traites, importes, ignores, erreurs } = job;
    let apres = job.apres_id || 0;

    if (!job.total) {
      const total = co ? co.importables : 0;
      // Tout ou rien : on vérifie la place AVANT d'importer quoi que ce soit
      const place = await placeRestante(gid, cid);
      const dejaLies = +(await pool.query('SELECT COUNT(*)::int AS n FROM produits WHERE collaborateur_id = $1 AND evend_produit_id IS NOT NULL', [cid])).rows[0].n;
      const aAjouter = Math.max(total - dejaLies, 0);
      if (aAjouter > place.restant) {
        return terminer(job.id, 'erreur', `Limite atteinte : vous avez ${total} annonces sur e-Vend (${aAjouter} à ajouter) mais il ne reste de la place que pour ${place.restant} annonce(s) (maximum ${place.max}). Supprimez des annonces ou contactez le gestionnaire.`);
      }
      await pool.query('UPDATE evend_jobs SET total = $2 WHERE id = $1', [job.id, total]);
      job.total = total;
    }

    while (true) {
      const p = await svc.appeler('GET', `/annonces?apres=${apres}&limite=${LOT}`, { jeton });
      const liste = Array.isArray(p.annonces) ? p.annonces : [];
      for (let i = 0; i < liste.length; i++) {
        try {
          const res = await importerUne(job, liste[i], ctx);
          if (res === 'ignore') ignores++; else importes++;
        } catch (e) {
          erreurs++;
          console.warn(`[evend-import] annonce ${liste[i] && liste[i].id} :`, e.message);
        }
        traites++;
        apres = liste[i].id;
        if ((traites % 5) === 0) await pool.query(`UPDATE evend_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, apres_id=$6, maj_le=NOW(), verrou_jusqua = NOW() + interval '3 minutes' WHERE id=$1`, [job.id, traites, importes, ignores, erreurs, apres]);
        if (Date.now() - debut > DUREE_TRANCHE_MS && (i < liste.length - 1 || p.suivant)) {
          await pool.query(`UPDATE evend_jobs SET statut='en_attente', apres_id=$2, traites=$3, importes=$4, ignores=$5, erreurs=$6, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, apres, traites, importes, ignores, erreurs]);
          return;
        }
      }
      if (!p.suivant || !liste.length) break;
      apres = p.suivant;
    }
    await pool.query('UPDATE evend_jobs SET traites=$2, importes=$3, ignores=$4, erreurs=$5, apres_id=$6 WHERE id=$1', [job.id, traites, importes, ignores, erreurs, apres]);
    const notes = [...ctx.avertissements];
    if (ctx.sansCorrespondance > 0 && ctx.defaut) notes.push(`${ctx.sansCorrespondance} annonce(s) sans catégorie correspondante ont été rangées dans « ${ctx.defaut.nom} » : changez-les avec la modification groupée.`);
    if (ctx.completees > 0) notes.push(`${ctx.completees} annonce(s) déjà importées ont reçu leurs photos manquantes.`);
    if (ctx.photosEchec > 0) notes.push(`${ctx.photosEchec} photo(s) n'ont pas pu être copiées (site de la photo indisponible ou image trop lourde).`);
    if (co && co.numeriques > 0) notes.push(`${co.numeriques} annonce(s) numérique(s) n'ont pas été reprises.`);
    if (co && co.autres > 0) notes.push(`${co.autres} annonce(s) autre(s) qu'à prix fixe (enchères…) n'ont pas été reprises.`);
    await terminer(job.id, 'termine', notes.join(' ') || null);
    try { await svc.deconnecter(gid, cid); } catch (e) { /* l'accès expire de lui-même après 3 h */ }   // fini : on ferme l'accès chez e-Vend
  } catch (e) {
    if (e instanceof svc.ErreurEvend) {
      if (e.reconnexion) return terminer(job.id, 'erreur', 'Votre accès à e-Vend a expiré : reconnectez-vous, puis relancez l\'import.');
      if (e.status === 502) {
        await pool.query(`UPDATE evend_jobs SET statut='pause', reprise_a = NOW() + interval '5 minutes', message=$2, maj_le=NOW(), verrou_jusqua=NULL WHERE id=$1`, [job.id, "e-Vend est injoignable pour l'instant : nouvel essai dans quelques minutes."]);
        return;
      }
      return terminer(job.id, 'erreur', e.message);
    }
    console.error('[evend-import] travail', job.id, e.message);
    return terminer(job.id, 'erreur', `Erreur pendant l'import : ${String(e.message).slice(0, 300)}`);
  }
}

async function prochainTravail() {
  const r = await pool.query(
    `UPDATE evend_jobs SET statut='en_cours', verrou_jusqua = NOW() + interval '3 minutes', maj_le = NOW(), reprise_a = NULL
      WHERE id = (SELECT id FROM evend_jobs
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
  if (timer || process.env.EVEND_WORKER_DESACTIVE === '1') return;
  timer = setInterval(async () => {
    if (occupe) return; occupe = true;
    try { while (await prochainTravail()) { /* enchaîne tant qu'il y a du travail */ } }
    catch (e) { if (e.code !== '42P01') console.error('[evend-import] worker', e.message); }   // 42P01 : SQL pas encore lancé
    finally { occupe = false; }
  }, 20000);
  if (timer.unref) timer.unref();
}

async function etatImport(cid, gid) {
  const r = await pool.query(`SELECT id, statut, total, traites, importes, ignores, erreurs, message, reprise_a, cree_le, fini_le FROM evend_jobs WHERE collaborateur_id = $1 AND gestionnaire_id = $2 ORDER BY cree_le DESC LIMIT 1`, [cid, gid]);
  return r.rows[0] || null;
}

module.exports = { deps, ipPrivee, telecharger, creerImport, etatImport, demarrer, prochainTravail, convertir, htmlEnTexte, normaliser };